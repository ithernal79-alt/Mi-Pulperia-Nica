import React, { useState, useRef, useMemo } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Clipboard, 
  Download, 
  Check, 
  AlertCircle, 
  X, 
  Package, 
  CheckCircle2, 
  ArrowRight,
  FileText,
  HelpCircle,
  RefreshCw,
  Plus,
  Layers,
  Database
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Producto, ConfiguracionPulperia } from '../../types';
import { db } from '../../services/db';
import { audioSpeech } from '../../services/audioSpeech';
import { LISTA_CATEGORIAS } from '../../data/listaProductos';

interface ImportInventoryModalProps {
  existingProductos: Producto[];
  config: ConfiguracionPulperia;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  audioEnabled: boolean;
}

export interface ParsedProductRow {
  id: string;
  codigo_barras: string;
  nombre: string;
  categoria: string;
  precio_venta: number;
  precio_costo: number;
  stock_actual: number;
  stock_minimo: number;
  unidad_medida: string;
  isExisting: boolean;
  existingProd?: Producto;
  selected: boolean;
  isValid: boolean;
  errorReason?: string;
}

export const ImportInventoryModal: React.FC<ImportInventoryModalProps> = ({
  existingProductos,
  config,
  isOpen,
  onClose,
  onSuccess,
  audioEnabled,
}) => {
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedProductRow[]>([]);
  const [stockMode, setStockMode] = useState<'replace' | 'sum'>('replace');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{ creados: number; actualizados: number; total: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Mapa rápido de productos existentes para identificación
  const existingBarcodeMap = useMemo(() => {
    const map = new Map<string, Producto>();
    existingProductos.forEach((p) => {
      if (p.codigo_barras) map.set(p.codigo_barras.trim().toLowerCase(), p);
    });
    return map;
  }, [existingProductos]);

  const existingNameMap = useMemo(() => {
    const map = new Map<string, Producto>();
    existingProductos.forEach((p) => {
      if (p.nombre) map.set(p.nombre.trim().toLowerCase(), p);
    });
    return map;
  }, [existingProductos]);

  // Auxiliar para limpiar y parsear números monetarios o cantidades
  const parseNumeric = (val: any): number => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : Math.max(0, val);
    const str = String(val).replace(/[^0-9.-]/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : Math.max(0, num);
  };

  // Normalizador de filas crudas (array de objetos o array de arrays)
  const processRawRows = (rawRows: any[][]) => {
    if (!rawRows || rawRows.length === 0) {
      setParsedRows([]);
      return;
    }

    // Filtrar filas completamente vacías
    const cleanRows = rawRows.filter(r => r && r.some(c => c !== undefined && c !== null && String(c).trim() !== ''));
    if (cleanRows.length === 0) {
      setParsedRows([]);
      return;
    }

    // Determinar si la primera fila es encabezado
    const firstRowStr = cleanRows[0].map(c => String(c || '').toLowerCase().trim());
    const hasHeader = firstRowStr.some(c => 
      c.includes('nombre') || 
      c.includes('producto') || 
      c.includes('descripcion') || 
      c.includes('codigo') || 
      c.includes('precio') || 
      c.includes('stock')
    );

    let colIndices = {
      nombre: 0,
      codigo: 1,
      categoria: 2,
      precio_venta: 3,
      precio_costo: 4,
      stock: 5,
      stock_minimo: 6,
      unidad: 7,
    };

    if (hasHeader) {
      // Detección dinámica por nombre de columna
      firstRowStr.forEach((hdr, idx) => {
        if (hdr.includes('nombre') || hdr.includes('producto') || hdr.includes('descripcion') || hdr.includes('articulo')) {
          colIndices.nombre = idx;
        } else if (hdr.includes('cod') || hdr.includes('barras') || hdr.includes('barcode') || hdr.includes('upc') || hdr.includes('ean')) {
          colIndices.codigo = idx;
        } else if (hdr.includes('cat') || hdr.includes('rubro') || hdr.includes('seccion') || hdr.includes('tipo')) {
          colIndices.categoria = idx;
        } else if (hdr.includes('costo') || hdr.includes('compra')) {
          colIndices.precio_costo = idx;
        } else if (hdr.includes('venta') || hdr.includes('precio') || hdr.includes('pvp') || hdr.includes('publico')) {
          colIndices.precio_venta = idx;
        } else if (hdr.includes('min') || hdr.includes('alerta')) {
          colIndices.stock_minimo = idx;
        } else if (hdr.includes('stock') || hdr.includes('exist') || hdr.includes('cant') || hdr.includes('unidades')) {
          colIndices.stock = idx;
        } else if (hdr.includes('unid') || hdr.includes('medida') || hdr.includes('presentacion')) {
          colIndices.unidad = idx;
        }
      });
    }

    const dataRows = hasHeader ? cleanRows.slice(1) : cleanRows;

    const parsed: ParsedProductRow[] = dataRows.map((cols, idx) => {
      const nombre = String(cols[colIndices.nombre] || '').trim();
      const codigo = String(cols[colIndices.codigo] || '').trim();
      let categoria = String(cols[colIndices.categoria] || '').trim();
      if (!categoria) categoria = 'Varios';

      const precioVenta = parseNumeric(cols[colIndices.precio_venta]);
      const precioCosto = parseNumeric(cols[colIndices.precio_costo]);
      const stockActual = parseNumeric(cols[colIndices.stock]);
      const stockMinimo = cols[colIndices.stock_minimo] !== undefined && cols[colIndices.stock_minimo] !== '' 
        ? parseNumeric(cols[colIndices.stock_minimo]) 
        : 5;
      
      let unidad = String(cols[colIndices.unidad] || 'unidad').trim().toLowerCase();
      if (!unidad) unidad = 'unidad';

      // Buscar si ya existe por código de barras o nombre
      const cleanCode = codigo.toLowerCase();
      const cleanName = nombre.toLowerCase();
      const existing = (cleanCode ? existingBarcodeMap.get(cleanCode) : undefined) || existingNameMap.get(cleanName);

      const isValid = nombre.length >= 2 && precioVenta > 0;
      let errorReason: string | undefined = undefined;
      if (nombre.length < 2) {
        errorReason = 'Nombre de producto vacío o muy corto';
      } else if (precioVenta <= 0) {
        errorReason = 'Precio de venta debe ser mayor a 0';
      }

      return {
        id: existing ? existing.id : `prod-import-${Date.now().toString().slice(-4)}-${idx + 1}`,
        codigo_barras: codigo || (existing ? existing.codigo_barras : ''),
        nombre: nombre || 'Producto sin nombre',
        categoria: categoria || (existing ? existing.categoria : 'Varios'),
        precio_venta: precioVenta || (existing ? existing.precio_venta : 0),
        precio_costo: precioCosto || (existing ? existing.precio_costo : 0),
        stock_actual: stockActual,
        stock_minimo: stockMinimo,
        unidad_medida: unidad || (existing ? existing.unidad_medida : 'unidad'),
        isExisting: !!existing,
        existingProd: existing,
        selected: isValid,
        isValid,
        errorReason,
      };
    });

    setParsedRows(parsed);
  };

  // Parser para texto pegado (tabulaciones de Excel o comas/puntos y coma)
  const parseRawPastedText = (text: string) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) {
      setParsedRows([]);
      return;
    }

    const firstLine = lines[0];
    let delimiter = '\t';
    if (firstLine.includes('\t')) {
      delimiter = '\t';
    } else if (firstLine.includes(';') && (firstLine.match(/;/g)?.length || 0) >= (firstLine.match(/,/g)?.length || 0)) {
      delimiter = ';';
    } else if (firstLine.includes(',')) {
      delimiter = ',';
    } else if (firstLine.includes('|')) {
      delimiter = '|';
    }

    const rawRows = lines.map((line) => {
      if (delimiter === '\t') {
        return line.split('\t').map(p => p.trim());
      }
      const regex = new RegExp(`(?:^|${delimiter})(?:"([^"]*)"|([^"${delimiter}]*))`, 'g');
      const parts: string[] = [];
      let match;
      while ((match = regex.exec(line)) !== null) {
        parts.push((match[1] || match[2] || '').trim());
      }
      return parts;
    });

    processRawRows(rawRows);
  };

  // Manejador de archivo subido (Excel .xlsx, .xls o CSV)
  const handleFileChange = async (file: File) => {
    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();

    try {
      if (ext === 'xlsx' || ext === 'xls') {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rawJson: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        processRawRows(rawJson);
      } else {
        // CSV / TSV / Texto
        const text = await file.text();
        parseRawPastedText(text);
      }
    } catch (err) {
      console.error('Error al procesar archivo:', err);
      alert('Ocurrió un error al leer el archivo. Verifique que sea un archivo de Excel o CSV válido.');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Descargar plantilla Excel de muestra
  const handleDownloadTemplate = (format: 'excel' | 'csv' = 'excel') => {
    const templateData = [
      {
        'Nombre del Producto': 'Arroz Tío Pelón 1 Libra',
        'Código de Barras': '742100123456',
        'Categoría': 'Granos básicos',
        'Precio Venta': 22.00,
        'Precio Costo': 18.00,
        'Stock Actual': 50,
        'Stock Mínimo': 10,
        'Unidad de Medida': 'libra'
      },
      {
        'Nombre del Producto': 'Frijoles Rojos de Seda 1 Libra',
        'Código de Barras': '742100654321',
        'Categoría': 'Granos básicos',
        'Precio Venta': 36.00,
        'Precio Costo': 30.00,
        'Stock Actual': 40,
        'Stock Mínimo': 8,
        'Unidad de Medida': 'libra'
      },
      {
        'Nombre del Producto': 'Aceite Corona 1 Litro',
        'Código de Barras': '742100987654',
        'Categoría': 'Aceites y mantecas',
        'Precio Venta': 65.00,
        'Precio Costo': 55.00,
        'Stock Actual': 24,
        'Stock Mínimo': 6,
        'Unidad de Medida': 'botella'
      },
      {
        'Nombre del Producto': 'Azúcar Montelimar 1 Libra',
        'Código de Barras': '742100112233',
        'Categoría': 'Granos básicos',
        'Precio Venta': 16.00,
        'Precio Costo': 13.50,
        'Stock Actual': 60,
        'Stock Mínimo': 12,
        'Unidad de Medida': 'libra'
      },
      {
        'Nombre del Producto': 'Jabón Corona Azul Barra',
        'Código de Barras': '742100445566',
        'Categoría': 'Aseo y limpieza',
        'Precio Venta': 28.00,
        'Precio Costo': 22.00,
        'Stock Actual': 30,
        'Stock Mínimo': 5,
        'Unidad de Medida': 'unidad'
      }
    ];

    if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      // Auto width
      worksheet['!cols'] = [
        { wch: 32 }, // Nombre
        { wch: 18 }, // Código
        { wch: 20 }, // Categoría
        { wch: 14 }, // Precio Venta
        { wch: 14 }, // Precio Costo
        { wch: 14 }, // Stock Actual
        { wch: 14 }, // Stock Mínimo
        { wch: 16 }, // Unidad
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla Inventario');
      XLSX.writeFile(workbook, 'Plantilla_Importar_Inventario.xlsx');
    } else {
      const csvHeader = 'Nombre del Producto,Código de Barras,Categoría,Precio Venta,Precio Costo,Stock Actual,Stock Mínimo,Unidad de Medida\n';
      const csvRows = templateData.map(r => 
        `"${r['Nombre del Producto']}","${r['Código de Barras']}","${r['Categoría']}",${r['Precio Venta']},${r['Precio Costo']},${r['Stock Actual']},${r['Stock Mínimo']},"${r['Unidad de Medida']}"`
      ).join('\n');
      const blob = new Blob(['\uFEFF' + csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Plantilla_Importar_Inventario.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Toggle fila individual
  const toggleRow = (idx: number) => {
    setParsedRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, selected: !r.selected } : r))
    );
  };

  // Seleccionar / Deseleccionar todos
  const toggleAll = (select: boolean) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.isValid ? { ...r, selected: select } : r))
    );
  };

  // Estadísticas del lote analizado
  const stats = useMemo(() => {
    const total = parsedRows.length;
    const selected = parsedRows.filter((r) => r.selected && r.isValid).length;
    const existingCount = parsedRows.filter((r) => r.isExisting && r.isValid).length;
    const newCount = parsedRows.filter((r) => !r.isExisting && r.isValid).length;
    const invalidCount = parsedRows.filter((r) => !r.isValid).length;
    return { total, selected, existingCount, newCount, invalidCount };
  }, [parsedRows]);

  // Ejecutar importación real en la base de datos
  const handleConfirmImport = () => {
    const toImport = parsedRows.filter((r) => r.selected && r.isValid);
    if (toImport.length === 0) return;

    setIsProcessing(true);
    try {
      const productosAProcesar: Producto[] = toImport.map((r) => ({
        id: r.id,
        codigo_barras: r.codigo_barras,
        nombre: r.nombre,
        categoria: r.categoria,
        precio_venta: r.precio_venta,
        precio_costo: r.precio_costo,
        stock_actual: r.stock_actual,
        stock_minimo: r.stock_minimo,
        unidad_medida: r.unidad_medida,
        es_frecuente: true,
        color_tag: '#3B82F6',
      }));

      const res = db.importProductos(productosAProcesar, stockMode);
      setImportResult(res);

      if (audioEnabled) {
        audioSpeech.playSuccessSound();
        audioSpeech.speak(
          `Importación exitosa. ${res.creados} productos nuevos creados y ${res.actualizados} existentes actualizados.`
        );
      }

      onSuccess();
    } catch (err) {
      console.error('Error al importar productos:', err);
      alert('Ocurrió un problema durante la importación. Intente de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    setParsedRows([]);
    setFileName(null);
    setPastedText('');
    setImportResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div 
        id="modal-importar-inventario"
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20">
              <Package className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Importar Lista de Inventario</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/40 border border-emerald-300/30 text-white text-[11px] font-bold">
                  Excel & CSV
                </span>
              </h3>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Carga masiva de catálogo de productos, precios y existencias en segundos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {importResult ? (
            /* Pantalla de Éxito */
            <div className="py-8 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center border-4 border-emerald-200 shadow-sm animate-bounce">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900">
                  ¡Inventario Importado Exitosamente!
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Los productos y sus existencias se han registrado y sincronizado en el sistema.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-left">
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">Nuevos</p>
                  <p className="text-xl font-black text-emerald-950 font-mono">+{importResult.creados}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-teal-600 uppercase">Actualizados</p>
                  <p className="text-xl font-black text-teal-950 font-mono">{importResult.actualizados}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Total Lote</p>
                  <p className="text-xl font-black text-slate-900 font-mono">{importResult.total}</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetAll}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Importar otro archivo
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span>Ver Inventario</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : parsedRows.length === 0 ? (
            /* Pantalla Inicial: Carga o Pegado */
            <div className="space-y-4">
              {/* Barra superior de pestañas y descarga de plantilla */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setInputMode('upload')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      inputMode === 'upload'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Excel o CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('paste')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      inputMode === 'paste'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>Pegar desde Portapapeles</span>
                  </button>
                </div>

                {/* Botones de Descarga de Plantilla de Ejemplo */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                    Plantillas de ejemplo:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate('excel')}
                    title="Descargar plantilla lista en formato Excel (.xlsx) con ejemplos de productos de pulpería"
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Plantilla Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate('csv')}
                    title="Descargar plantilla en formato CSV delimitado por comas"
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* Zona de Drop o Input */}
              {inputMode === 'upload' ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
                    dragActive
                      ? 'border-emerald-500 bg-emerald-50/60 scale-[0.99]'
                      : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/20 bg-slate-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv, .tsv, .txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <div className="w-14 h-14 mx-auto mb-3 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center shadow-xs">
                    <FileSpreadsheet className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-800">
                    Arrastre su archivo Excel o CSV aquí, o <span className="text-emerald-600 underline decoration-2">haga clic para examinar</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Admite libros de Excel (.xlsx, .xls), archivos CSV con delimitador de coma o punto y coma, o archivos de texto TSV.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold font-mono">
                      .XLSX
                    </span>
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded-md text-[10px] font-bold font-mono">
                      .XLS
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px] font-bold font-mono">
                      .CSV
                    </span>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md text-[10px] font-bold font-mono">
                      .TSV / TXT
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Clipboard className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copie y pegue las celdas directamente desde Excel o Google Sheets:</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Ctrl + C en Excel, luego Ctrl + V aquí
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`Nombre del Producto\tCódigo de Barras\tCategoría\tPrecio Venta\tPrecio Costo\tStock Actual\tStock Mínimo\tUnidad
Arroz Faizan 1 Libra\t74210001\tGranos básicos\t22\t18\t50\t10\tlibra
Frijoles Rojos 1 Libra\t74210002\tGranos básicos\t36\t30\t40\t8\tlibra
Aceite Corona 1L\t74210003\tAceites y mantecas\t65\t55\t20\t5\tbotella`}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3.5 font-mono text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white shadow-xs"
                  />
                  <button
                    type="button"
                    disabled={!pastedText.trim()}
                    onClick={() => parseRawPastedText(pastedText)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Analizar Datos Pegados</span>
                  </button>
                </div>
              )}

              {/* Guía de columnas reconocidas */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-2">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                  <HelpCircle className="w-4 h-4 text-emerald-600" />
                  <span>Columnas reconocidas automáticamente por el importador:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="p-2 bg-white border border-slate-200 rounded-xl">
                    <span className="font-bold text-emerald-700 block">1. Nombre / Producto</span>
                    <span className="text-slate-400 text-[10px]">Requerido (mínimo 2 caracteres)</span>
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded-xl">
                    <span className="font-bold text-emerald-700 block">2. Código de Barras</span>
                    <span className="text-slate-400 text-[10px]">Opcional (identifica existentes)</span>
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded-xl">
                    <span className="font-bold text-emerald-700 block">3. Precio de Venta</span>
                    <span className="text-slate-400 text-[10px]">Requerido (mayor a 0)</span>
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded-xl">
                    <span className="font-bold text-emerald-700 block">4. Existencia / Stock</span>
                    <span className="text-slate-400 text-[10px]">Opcional (default: 0)</span>
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded-xl">
                    <span className="font-bold text-slate-700 block">5. Precio de Costo</span>
                    <span className="text-slate-400 text-[10px]">Opcional (para cálculo de margen)</span>
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded-xl">
                    <span className="font-bold text-slate-700 block">6. Categoría</span>
                    <span className="text-slate-400 text-[10px]">Opcional (default: Varios)</span>
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded-xl">
                    <span className="font-bold text-slate-700 block">7. Stock Mínimo</span>
                    <span className="text-slate-400 text-[10px]">Opcional (default: 5)</span>
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded-xl">
                    <span className="font-bold text-slate-700 block">8. Unidad de Medida</span>
                    <span className="text-slate-400 text-[10px]">unidad, libra, bolsa, etc.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Vista Previa de Filas Analizadas */
            <div className="space-y-4">
              {/* Tarjeta de Resumen y Opciones de Fusión */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800">
                      Archivo: <span className="font-mono text-emerald-700">{fileName || 'Texto pegado'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={resetAll}
                      className="text-[11px] font-bold text-slate-500 hover:text-rose-600 underline cursor-pointer"
                    >
                      Cambiar archivo
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[11px]">
                      {stats.newCount} nuevos
                    </span>
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded-md font-bold text-[11px]">
                      {stats.existingCount} ya existentes
                    </span>
                    {stats.invalidCount > 0 && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md font-bold text-[11px]">
                        {stats.invalidCount} con errores
                      </span>
                    )}
                    <span className="text-slate-400">|</span>
                    <span className="font-bold text-slate-700">
                      {stats.selected} seleccionados para importar
                    </span>
                  </div>
                </div>

                {/* Opción para manejo de existencias en existentes */}
                <div className="bg-white border border-slate-200 p-2 rounded-xl text-xs space-y-1 shadow-2xs">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Si el producto ya existe en inventario:
                  </span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                      <input
                        type="radio"
                        name="stockMode"
                        value="replace"
                        checked={stockMode === 'replace'}
                        onChange={() => setStockMode('replace')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-medium">Reemplazar stock</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                      <input
                        type="radio"
                        name="stockMode"
                        value="sum"
                        checked={stockMode === 'sum'}
                        onChange={() => setStockMode('sum')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-medium text-emerald-800 font-bold">Sumar a existencias (+ stock)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Controles de selección rápida */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleAll(true)}
                    className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                  >
                    Seleccionar todos los válidos
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => toggleAll(false)}
                    className="text-slate-500 hover:text-slate-800 font-bold underline cursor-pointer"
                  >
                    Deseleccionar todos
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Mostrando {parsedRows.length} filas leídas
                </p>
              </div>

              {/* Tabla de previsualización con scroll */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/80 sticky top-0 z-10 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200 backdrop-blur-xs">
                    <tr>
                      <th className="p-2.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={stats.selected === stats.total - stats.invalidCount && stats.selected > 0}
                          onChange={(e) => toggleAll(e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </th>
                      <th className="p-2.5">Producto</th>
                      <th className="p-2.5">Código de Barras</th>
                      <th className="p-2.5">Categoría</th>
                      <th className="p-2.5 text-right">P. Venta</th>
                      <th className="p-2.5 text-right">P. Costo</th>
                      <th className="p-2.5 text-center">Stock</th>
                      <th className="p-2.5 text-center">Unidad</th>
                      <th className="p-2.5 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => {
                      return (
                        <tr
                          key={idx}
                          onClick={() => row.isValid && toggleRow(idx)}
                          className={`transition-colors cursor-pointer ${
                            !row.isValid
                              ? 'bg-rose-50/50 opacity-70'
                              : row.selected
                              ? 'bg-white hover:bg-emerald-50/40'
                              : 'bg-slate-50/60 opacity-60'
                          }`}
                        >
                          <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              disabled={!row.isValid}
                              checked={row.selected}
                              onChange={() => toggleRow(idx)}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-30"
                            />
                          </td>
                          <td className="p-2.5">
                            <p className="font-bold text-slate-900 leading-tight">
                              {row.nombre}
                            </p>
                            {!row.isValid && (
                              <p className="text-[10px] text-rose-600 font-semibold mt-0.5 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>{row.errorReason}</span>
                              </p>
                            )}
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-slate-500">
                            {row.codigo_barras || <span className="text-slate-300">--</span>}
                          </td>
                          <td className="p-2.5 text-slate-600">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                              {row.categoria}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                            {config.moneda_simbolo} {row.precio_venta.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-500">
                            {row.precio_costo > 0 ? (
                              `${config.moneda_simbolo} ${row.precio_costo.toFixed(2)}`
                            ) : (
                              <span className="text-slate-300">--</span>
                            )}
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-slate-800">
                            {row.stock_actual}
                            {row.isExisting && stockMode === 'sum' && row.existingProd && (
                              <span className="block text-[9px] text-emerald-600 font-sans">
                                (Total: {(row.existingProd.stock_actual || 0) + row.stock_actual})
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-center text-slate-500 text-[11px]">
                            {row.unidad_medida}
                          </td>
                          <td className="p-2.5 text-center">
                            {row.isExisting ? (
                              <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full text-[10px] font-bold">
                                Actualizará
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                                Nuevo
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
          >
            {importResult ? 'Cerrar' : 'Cancelar'}
          </button>

          {!importResult && parsedRows.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetAll}
                className="px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 font-bold text-xs cursor-pointer"
              >
                Limpiar lista
              </button>
              <button
                type="button"
                disabled={stats.selected === 0 || isProcessing}
                onClick={handleConfirmImport}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Guardando e importando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Importar {stats.selected} Productos al Inventario</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
