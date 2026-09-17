import React, { useState, useRef, useMemo } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Clipboard, 
  Download, 
  Check, 
  AlertCircle, 
  X, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  FileText,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { Cliente, ConfiguracionPulperia } from '../../types';
import { db } from '../../services/db';
import { audioSpeech } from '../../services/audioSpeech';

interface ImportClientsModalProps {
  existingClientes: Cliente[];
  config: ConfiguracionPulperia;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  audioEnabled: boolean;
}

interface ParsedClientRow {
  id: string;
  nombre: string;
  telefono: string;
  limite_credito: number;
  saldo_actual: number;
  direccion_nota: string;
  isExisting: boolean;
  selected: boolean;
  isValid: boolean;
  errorReason?: string;
}

export const ImportClientsModal: React.FC<ImportClientsModalProps> = ({
  existingClientes,
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
  const [parsedRows, setParsedRows] = useState<ParsedClientRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{ creados: number; actualizados: number } | null>(null);
  const [defaultLimit, setDefaultLimit] = useState<number>(500);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Mapa de clientes existentes normalizados
  const existingMap = useMemo(() => {
    const map = new Map<string, Cliente>();
    existingClientes.forEach((c) => {
      if (c.nombre) map.set(c.nombre.trim().toLowerCase(), c);
      const cleanPhone = (c.telefono || '').replace(/\D/g, '');
      if (cleanPhone.length >= 7) map.set(`tel_${cleanPhone}`, c);
    });
    return map;
  }, [existingClientes]);

  // Parser genérico de texto CSV, TSV o tablas pegadas
  const parseRawText = (text: string) => {
    const rawLines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (rawLines.length === 0) {
      setParsedRows([]);
      return;
    }

    // Detectar delimitador analizando la primera línea: tab, punto y coma, coma o pipe
    const firstLine = rawLines[0];
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

    const rows = rawLines.map((line) => {
      // División respetando comillas básicas
      let parts: string[] = [];
      if (delimiter === '\t') {
        parts = line.split('\t');
      } else {
        // Expresión regular para separar por delimitador ignorando comillas
        const regex = new RegExp(`(?:^|${delimiter})(?:"([^"]*)"|([^"${delimiter}]*))`, 'g');
        let match;
        while ((match = regex.exec(line)) !== null) {
          parts.push((match[1] || match[2] || '').trim());
        }
      }
      return parts.map((p) => p.trim());
    });

    if (rows.length === 0) {
      setParsedRows([]);
      return;
    }

    // Comprobar si la primera fila es encabezado
    const col0 = (rows[0][0] || '').toLowerCase();
    const isHeader = 
      col0.includes('nombre') || 
      col0.includes('cliente') || 
      col0.includes('name') || 
      col0.includes('persona');

    const dataRows = isHeader ? rows.slice(1) : rows;

    const parsed: ParsedClientRow[] = dataRows.map((cols, idx) => {
      // Extracción inteligente de columnas
      // Formato esperado típico: [Nombre, Telefono, Limite, Saldo/Deuda, Direccion]
      const nombre = (cols[0] || '').trim();
      const telefono = (cols[1] || '').trim();

      // Función auxiliar para parsear números con signos de moneda C$ o $
      const parseNum = (val: string | undefined): number => {
        if (!val) return 0;
        const cleaned = val.replace(/[^0-9.-]/g, '');
        const n = parseFloat(cleaned);
        return isNaN(n) ? 0 : Math.max(0, n);
      };

      let limite = parseNum(cols[2]);
      if (limite === 0 && defaultLimit > 0) {
        limite = defaultLimit;
      }

      const saldo = parseNum(cols[3]);
      const direccion = (cols[4] || cols.slice(4).join(', ') || '').trim();

      // Comprobar existencia
      const cleanNom = nombre.toLowerCase();
      const cleanTel = telefono.replace(/\D/g, '');
      const existing = existingMap.get(cleanNom) || (cleanTel.length >= 7 ? existingMap.get(`tel_${cleanTel}`) : undefined);

      const isValid = nombre.length >= 2;
      const errorReason = !isValid ? 'Nombre muy corto o vacío' : undefined;

      return {
        id: existing ? existing.id : `CLI-${Date.now().toString().slice(-4)}-${idx + 1}`,
        nombre: nombre || 'Sin nombre',
        telefono: telefono || '',
        limite_credito: limite,
        saldo_actual: saldo,
        direccion_nota: direccion || (existing ? existing.direccion_nota || '' : ''),
        isExisting: !!existing,
        selected: isValid,
        isValid,
        errorReason,
      };
    });

    setParsedRows(parsed);
  };

  // Manejador para carga de archivo
  const handleFileChange = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        parseRawText(text);
      }
    };
    reader.readAsText(file);
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

  // Descargar plantilla CSV de muestra
  const handleDownloadTemplate = () => {
    const csvContent = [
      'Nombre,Telefono,Limite Credito,Saldo Inicial Fiado,Direccion o Nota',
      'Doña Maria Lopez,8888-1234,1500,250,Frente al parque central',
      'Don Carlos Ruiz,8765-4321,1000,0,Porton negro esquinero',
      'Reyna Mendoza,8456-7890,800,120,Vecina de enfrente',
      'Pedro Alvarado,8321-6547,2000,450,Pulpería los almendros',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Plantilla_Clientes_Fiados.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Ejecutar importación en la base de datos
  const handleConfirmImport = () => {
    const toImport = parsedRows.filter((r) => r.selected && r.isValid);
    if (toImport.length === 0) return;

    setIsProcessing(true);
    try {
      const now = new Date().toISOString().split('T')[0];
      const clientesAProcesar: Cliente[] = toImport.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        telefono: r.telefono,
        limite_credito: r.limite_credito,
        saldo_actual: r.saldo_actual,
        direccion_nota: r.direccion_nota,
        fecha_registro: now,
        ultimo_movimiento: r.saldo_actual > 0 ? now : undefined,
      }));

      const res = db.importClientes(clientesAProcesar);
      setImportResult({ creados: res.creados, actualizados: res.actualizados });
      
      if (audioEnabled) {
        audioSpeech.playSuccessSound();
      }

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Error al importar clientes:', err);
      alert('Ocurrió un error al importar los clientes. Por favor verifique el formato.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Conteo de seleccionados
  const validSelectedCount = parsedRows.filter((r) => r.selected && r.isValid).length;
  const newClientsCount = parsedRows.filter((r) => r.selected && r.isValid && !r.isExisting).length;
  const updateClientsCount = parsedRows.filter((r) => r.selected && r.isValid && r.isExisting).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* ENCABEZADO */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white flex items-center gap-2">
                <span>Importar Lista de Clientes al Fiado</span>
              </h3>
              <p className="text-xs text-slate-300">
                Carga masiva desde archivo Excel (.csv, .txt, .tsv) o pegando columnas directo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CUERPO DEL MODAL */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
          
          {/* RESULTADO DE IMPORTACIÓN EXITOSA */}
          {importResult && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl flex items-center gap-3 text-emerald-900 animate-in fade-in">
              <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-extrabold text-sm text-emerald-950">¡Importación completada con éxito!</h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Se registraron <strong>{importResult.creados} clientes nuevos</strong> y se actualizaron <strong>{importResult.actualizados} existentes</strong> en la libreta.
                </p>
              </div>
            </div>
          )}

          {/* SELECTOR DE MÉTODO DE INGRESO */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setInputMode('upload')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  inputMode === 'upload'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Subir Archivo Excel/CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode('paste')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  inputMode === 'paste'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clipboard className="w-3.5 h-3.5 text-blue-600" />
                <span>Copiar y Pegar Texto</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Descargar archivo modelo con ejemplos para rellenar en Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Plantilla (.csv)</span>
            </button>
          </div>

          {/* MÉTODO 1: SUBIR ARCHIVO */}
          {inputMode === 'upload' && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-slate-300 hover:border-emerald-400 bg-slate-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .tsv, .txt, text/csv, text/plain, application/vnd.ms-excel"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileChange(file);
                }}
              />
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-sm">
                {fileName ? `Archivo: ${fileName}` : 'Haz clic aquí o arrastra tu archivo (.csv, .txt, .tsv)'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Formatos compatibles: Archivos CSV exportados de Excel o Google Sheets. Columnas: 
                <strong> Nombre, Teléfono, Límite de Crédito, Saldo Inicial, Dirección/Nota</strong>.
              </p>
            </div>
          )}

          {/* MÉTODO 2: PEGAR TEXTO */}
          {inputMode === 'paste' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Pega aquí las celdas copiadas directamente de tu Excel o Google Sheets:
              </label>
              <textarea
                rows={5}
                value={pastedText}
                onChange={(e) => {
                  setPastedText(e.target.value);
                  parseRawText(e.target.value);
                }}
                placeholder={`Doña Maria Lopez\t8888-1234\t1500\t250\tFrente al parque\nDon Carlos Ruiz\t8765-4321\t1000\t0\tPortón negro\nReyna Mendoza\t8456-7890\t800\t120\tVecina de enfrente`}
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
              />
              <p className="text-[11px] text-slate-500">
                💡 Consejo: Puedes seleccionar varias filas en Excel con tus clientes (Ctrl + C) y pegarlas aquí directamente (Ctrl + V).
              </p>
            </div>
          )}

          {/* PRE-VISUALIZACIÓN DE CLIENTES PROCESADOS */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-100 p-3 rounded-2xl">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                    Vista Previa ({parsedRows.length} detectados)
                  </span>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      +{newClientsCount} nuevos
                    </span>
                    {updateClientsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        ↻ {updateClientsCount} actualizarán
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Límite crédito por defecto:</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={defaultLimit}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setDefaultLimit(val);
                      // Actualizar filas sin limite especificado
                      setParsedRows((prev) =>
                        prev.map((r) => ({
                          ...r,
                          limite_credito: r.limite_credito === 0 ? val : r.limite_credito,
                        }))
                      );
                    }}
                    className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* TABLA DE PRE-VISUALIZACIÓN */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5 text-center w-8">
                        <input
                          type="checkbox"
                          checked={parsedRows.every((r) => r.selected || !r.isValid)}
                          onChange={(e) => {
                            const check = e.target.checked;
                            setParsedRows((prev) =>
                              prev.map((r) => (r.isValid ? { ...r, selected: check } : r))
                            );
                          }}
                          className="w-3.5 h-3.5 text-emerald-600 rounded-sm"
                        />
                      </th>
                      <th className="p-2.5">Nombre del Cliente</th>
                      <th className="p-2.5">Teléfono</th>
                      <th className="p-2.5 text-right">Límite Crédito</th>
                      <th className="p-2.5 text-right">Saldo Inicial</th>
                      <th className="p-2.5">Dirección / Nota</th>
                      <th className="p-2.5 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr 
                        key={`parsed-${idx}`}
                        className={`hover:bg-slate-50 transition-colors ${!row.isValid ? 'bg-red-50/50 opacity-60' : ''}`}
                      >
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            disabled={!row.isValid}
                            onChange={(e) => {
                              const check = e.target.checked;
                              setParsedRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, selected: check } : r))
                              );
                            }}
                            className="w-3.5 h-3.5 text-emerald-600 rounded-sm"
                          />
                        </td>
                        <td className="p-2.5 font-bold text-slate-900">
                          {row.nombre}
                          {!row.isValid && (
                            <span className="block text-[10px] text-red-600 font-normal">{row.errorReason}</span>
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-slate-600">
                          {row.telefono || <span className="text-slate-400 italic">Sin tel.</span>}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-700">
                          {config.moneda_simbolo} {row.limite_credito.toFixed(2)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-amber-700">
                          {row.saldo_actual > 0 ? `${config.moneda_simbolo} ${row.saldo_actual.toFixed(2)}` : '-'}
                        </td>
                        <td className="p-2.5 text-slate-500 max-w-[150px] truncate" title={row.direccion_nota}>
                          {row.direccion_nota || '-'}
                        </td>
                        <td className="p-2.5 text-center">
                          {row.isExisting ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700 uppercase">
                              Actualizar
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 uppercase">
                              Nuevo
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* PIE DEL MODAL Y BOTONES */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {parsedRows.length > 0 ? (
              <span>
                Se importarán <strong className="text-emerald-800 font-bold">{validSelectedCount} clientes</strong> ({newClientsCount} nuevos, {updateClientsCount} actualizaciones).
              </span>
            ) : (
              <span>Carga un archivo o pega tus datos para comenzar la importación.</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-xs cursor-pointer transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={validSelectedCount === 0 || isProcessing}
              onClick={handleConfirmImport}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95 ${
                validSelectedCount > 0 && !isProcessing
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Importando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirmar e Importar ({validSelectedCount})</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
