import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Truck, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Tag, 
  DollarSign, 
  Barcode, 
  FileText,
  Calendar,
  Layers,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Producto, EntradaMercancia, ConfiguracionPulperia } from '../../types';
import { db } from '../../services/db';
import { audioSpeech } from '../../services/audioSpeech';
import { LISTA_CATEGORIAS, CATEGORIA_COLORS } from '../../data/listaProductos';

interface InventoryModuleProps {
  productos: Producto[];
  config: ConfiguracionPulperia;
  initialCategory?: string;
  onRefresh: () => void;
  audioEnabled: boolean;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  productos,
  config,
  initialCategory,
  onRefresh,
  audioEnabled,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(initialCategory || 'Todos');
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [showEntradaModal, setShowEntradaModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    if (initialCategory) {
      setCategoryFilter(initialCategory);
      setCurrentPage(1);
    }
  }, [initialCategory]);

  // Formulario de Entrada de Mercancía / Factura de Proveedor
  const [entradaForm, setEntradaForm] = useState({
    proveedor: '',
    numero_factura: '',
    producto_id: '',
    cantidad_ingresada: 1,
    costo_unitario: 0,
    nota: '',
  });

  // Formulario de Nuevo / Editar Producto
  const [productForm, setProductForm] = useState<Partial<Producto>>({
    codigo_barras: '',
    nombre: '',
    categoria: 'Granos básicos',
    precio_venta: 0,
    precio_costo: 0,
    stock_actual: 0,
    stock_minimo: 0,
    unidad_medida: 'unidad',
    es_frecuente: true,
    color_tag: '#3B82F6',
    marca: '',
  });

  // Categorías completas garantizadas con las 26 oficiales + las registradas en BD
  const categories = useMemo(() => {
    const fromProds = productos.map((p) => p.categoria).filter(Boolean);
    const combined = Array.from(new Set([...LISTA_CATEGORIAS, ...fromProds])).sort();
    return ['Todos', ...combined];
  }, [productos]);

  const unidades = ['unidad', 'libra', 'tarro', 'bolsa', 'litro', 'botella', 'paquete', 'carton', 'kg', 'lata', 'rollo', 'caja', 'servicio'];

  // Filtrar
  const filteredProducts = useMemo(() => {
    return productos.filter((p) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        p.nombre.toLowerCase().includes(term) ||
        p.codigo_barras.includes(term) ||
        p.categoria.toLowerCase().includes(term) ||
        (p.marca && p.marca.toLowerCase().includes(term));
      
      if (!matchesSearch) return false;
      if (categoryFilter === 'Todos') return true;
      return p.categoria.toLowerCase() === categoryFilter.toLowerCase();
    });
  }, [productos, searchTerm, categoryFilter]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (safeCurrentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, safeCurrentPage, itemsPerPage]);

  const handleRecargarListaProductos = () => {
    const confirmReset = window.confirm(
      '¿Desea restaurar/recargar la lista oficial de 278 productos en la base de datos?'
    );
    if (confirmReset) {
      db.recargarCatalogoBase();
      onRefresh();
      if (audioEnabled) {
        audioSpeech.speak('Lista de 278 productos recargada');
      }
    }
  };

  // Abrir modal de nuevo producto
  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setProductForm({
      id: `prod-${Date.now().toString().slice(-6)}`,
      codigo_barras: `7421${Math.floor(1000 + Math.random() * 9000)}`,
      nombre: '',
      categoria: 'Granos y Abarrotes',
      precio_venta: 0,
      precio_costo: 0,
      stock_actual: 0,
      stock_minimo: 0,
      unidad_medida: 'unidad',
      es_frecuente: true,
      color_tag: '#3B82F6',
    });
    setShowNewProductModal(true);
  };

  // Abrir modal de edición
  const handleOpenEditProduct = (prod: Producto) => {
    setEditingProduct(prod);
    setProductForm({ ...prod });
    setShowNewProductModal(true);
  };

  // Guardar producto
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.nombre || !productForm.precio_venta) {
      alert('Por favor ingrese el nombre y precio de venta');
      return;
    }

    const finalProduct: Producto = {
      id: productForm.id || `prod-${Date.now()}`,
      codigo_barras: productForm.codigo_barras || `74210${Date.now().toString().slice(-4)}`,
      nombre: productForm.nombre,
      categoria: productForm.categoria || 'Varios',
      precio_venta: Number(productForm.precio_venta),
      precio_costo: Number(productForm.precio_costo) || 0,
      stock_actual: Number(productForm.stock_actual) || 0,
      stock_minimo: Number(productForm.stock_minimo) || 5,
      unidad_medida: productForm.unidad_medida || 'unidad',
      es_frecuente: !!productForm.es_frecuente,
      color_tag: productForm.color_tag || '#3B82F6',
    };

    db.saveProducto(finalProduct);
    if (audioEnabled) audioSpeech.playSuccessSound();
    setShowNewProductModal(false);
    onRefresh();
  };

  // Guardar entrada de mercancía (factura proveedor)
  const handleSaveEntrada = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entradaForm.producto_id || entradaForm.cantidad_ingresada <= 0) {
      alert('Por favor seleccione un producto y especifique la cantidad ingresada');
      return;
    }

    const prod = productos.find(p => p.id === entradaForm.producto_id);
    if (!prod) return;

    db.registrarEntradaMercancia({
      proveedor: entradaForm.proveedor || 'Proveedor General',
      numero_factura: entradaForm.numero_factura || `FAC-${Date.now().toString().slice(-4)}`,
      producto_id: prod.id,
      producto_nombre: prod.nombre,
      cantidad_ingresada: Number(entradaForm.cantidad_ingresada),
      costo_unitario: Number(entradaForm.costo_unitario) || prod.precio_costo,
      total_costo: Number(entradaForm.cantidad_ingresada) * (Number(entradaForm.costo_unitario) || prod.precio_costo),
      nota: entradaForm.nota,
    });

    if (audioEnabled) {
      audioSpeech.playSuccessSound();
      audioSpeech.speak(`Mercancía ingresada. Stock de ${prod.nombre} actualizado`);
    }

    setShowEntradaModal(false);
    setEntradaForm({
      proveedor: '',
      numero_factura: '',
      producto_id: '',
      cantidad_ingresada: 1,
      costo_unitario: 0,
      nota: '',
    });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <span>Módulo de Inventario & Existencias</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Control de existencias con descuento automático por venta y entrada de facturas de proveedores
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botón Restaurar Catálogo Base */}
          <button
            type="button"
            onClick={handleRecargarListaProductos}
            title="Recargar o restaurar la lista oficial de 278 productos"
            className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all select-none border border-slate-300"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Restaurar Catálogo (278)</span>
            <span className="sm:hidden">Catálogo</span>
          </button>

          {/* Botón Entrada de Mercancía */}
          <button
            onClick={() => setShowEntradaModal(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all select-none"
          >
            <Truck className="w-4 h-4" />
            <span>Entrada de Mercancía</span>
          </button>

          {/* Botón Nuevo Producto */}
          <button
            onClick={handleOpenNewProduct}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all select-none"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Buscador & Filtros de Categoría */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, código de barras, categoría o marca..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none shadow-xs transition-all"
          />
        </div>

        {/* Selector Desplegable de Todas las Categorías */}
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filtrar por categoría"
            className="bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-800 font-semibold outline-none shadow-xs cursor-pointer max-w-[220px]"
          >
            {categories.map((cat) => {
              const count = cat === 'Todos' 
                ? productos.length 
                : productos.filter(p => p.categoria.toLowerCase() === cat.toLowerCase()).length;
              return (
                <option key={cat} value={cat}>
                  {cat === 'Todos' ? `Todas las Categorías (${count})` : `${cat} (${count})`}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Chips Rápidos de Categorías (Todas las 26 Categorías) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 text-xs scrollbar-thin">
        {categories.map((cat) => {
          const count = cat === 'Todos' 
            ? productos.length 
            : productos.filter(p => p.categoria.toLowerCase() === cat.toLowerCase()).length;
          const isSelected = categoryFilter === cat;

          return (
            <button
              key={cat}
              onClick={() => {
                setCategoryFilter(cat);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all shadow-xs flex items-center gap-1.5 select-none ${
                isSelected
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <span>{cat}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Resumen de Conteo */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500">
        <span>
          Mostrando <strong className="text-slate-700">{filteredProducts.length}</strong> de <strong className="text-slate-700">{productos.length}</strong> productos
          {categoryFilter !== 'Todos' && ` en "${categoryFilter}"`}
        </span>
        {totalPages > 1 && (
          <span>
            Página <strong className="text-slate-700">{safeCurrentPage}</strong> de <strong className="text-slate-700">{totalPages}</strong>
          </span>
        )}
      </div>

      {/* Tabla de Productos / Inventario */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] sm:text-xs font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-3 sm:px-4">Producto / Código</th>
                <th className="py-3.5 px-3 sm:px-4">Categoría</th>
                <th className="py-3.5 px-3 sm:px-4 text-right">Precio Venta</th>
                <th className="py-3.5 px-3 sm:px-4 text-right">Costo</th>
                <th className="py-3.5 px-3 sm:px-4 text-center">Stock Actual</th>
                <th className="py-3.5 px-3 sm:px-4 text-center">Stock Mínimo</th>
                <th className="py-3.5 px-3 sm:px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProducts.map((p) => {
                const isCritical = p.stock_actual <= p.stock_minimo;
                const isZero = p.stock_actual <= 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Nombre y Código de Barras */}
                    <td className="py-3 px-3 sm:px-4">
                      <div className="flex items-center gap-2.5">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: p.color_tag || '#10B981' }} 
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">{p.nombre}</p>
                          <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                            <Barcode className="w-3 h-3 text-slate-400" />
                            {p.codigo_barras} • {p.unidad_medida}
                            {p.marca ? ` • ${p.marca}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Categoría */}
                    <td className="py-3 px-3 sm:px-4">
                      <span 
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap border"
                        style={{
                          backgroundColor: `${p.color_tag || '#3B82F6'}15`,
                          borderColor: `${p.color_tag || '#3B82F6'}35`,
                          color: p.color_tag || '#1E293B',
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color_tag || '#3B82F6' }} />
                        {p.categoria}
                      </span>
                    </td>

                    {/* Precio Venta */}
                    <td className="py-3 px-3 sm:px-4 text-right font-mono font-black text-slate-900">
                      {config.moneda_simbolo} {p.precio_venta.toFixed(2)}
                    </td>

                    {/* Costo */}
                    <td className="py-3 px-3 sm:px-4 text-right font-mono text-slate-500">
                      {config.moneda_simbolo} {p.precio_costo.toFixed(2)}
                    </td>

                    {/* Stock Actual */}
                    <td className="py-3 px-3 sm:px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono font-bold text-xs ${
                        isZero
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : isCritical
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        {isCritical && <AlertTriangle className="w-3 h-3 text-amber-600 animate-pulse" />}
                        {p.stock_actual} {p.unidad_medida}s
                      </span>
                    </td>

                    {/* Stock Mínimo */}
                    <td className="py-3 px-3 sm:px-4 text-center text-slate-500 font-mono text-xs">
                      {p.stock_minimo} {p.unidad_medida}s
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-3 sm:px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditProduct(p)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                          title="Editar producto"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar ${p.nombre} del inventario?`)) {
                              db.deleteProducto(p.id);
                              onRefresh();
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                        <Package className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">
                          {productos.length === 0 ? 'Catálogo listo para registrar productos' : 'No se encontraron productos coincidentes'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {productos.length === 0
                            ? 'Comienza agregando los productos de tu pulpería con su nombre, costo, precio de venta y stock inicial.'
                            : 'Intenta con otro término de búsqueda o selecciona otra categoría.'}
                        </p>
                      </div>
                      {productos.length === 0 && (
                        <button
                          type="button"
                          onClick={handleOpenNewProduct}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-xs transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Agregar Primer Producto</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginador */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs">
            <span className="text-slate-600">
              Mostrando {Math.min((safeCurrentPage - 1) * itemsPerPage + 1, filteredProducts.length)} - {Math.min(safeCurrentPage * itemsPerPage, filteredProducts.length)} de {filteredProducts.length} productos
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 font-mono font-bold text-slate-800">
                {safeCurrentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL: ENTRADA DE MERCANCÍA / FACTURA DE PROVEEDOR
      ======================================================== */}
      {showEntradaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                <span>Registrar Entrada de Mercancía</span>
              </h3>
              <button 
                onClick={() => setShowEntradaModal(false)}
                className="text-slate-500 hover:text-slate-800 text-xs font-bold px-2 py-1 bg-slate-100 rounded-lg"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSaveEntrada} className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Proveedor / Distribuidor:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Distribuidora Sula, Cervecería..."
                    value={entradaForm.proveedor}
                    onChange={(e) => setEntradaForm({ ...entradaForm, proveedor: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-blue-500 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">No. de Factura / Boleta:</label>
                  <input
                    type="text"
                    placeholder="Ej. FAC-9842"
                    value={entradaForm.numero_factura}
                    onChange={(e) => setEntradaForm({ ...entradaForm, numero_factura: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-blue-500 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Seleccionar Producto a Surtir:</label>
                <select
                  required
                  value={entradaForm.producto_id}
                  onChange={(e) => {
                    const sel = productos.find(p => p.id === e.target.value);
                    setEntradaForm({
                      ...entradaForm,
                      producto_id: e.target.value,
                      costo_unitario: sel ? sel.precio_costo : 0,
                    });
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-blue-500 shadow-xs"
                >
                  <option value="">-- Seleccionar producto del inventario --</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (Stock actual: {p.stock_actual} {p.unidad_medida}s)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cantidad Ingresada (+ unidades):</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="1"
                    value={entradaForm.cantidad_ingresada === 0 ? '' : entradaForm.cantidad_ingresada}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEntradaForm({ 
                        ...entradaForm, 
                        cantidad_ingresada: val === '' ? 0 : parseFloat(val) || 0 
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-blue-500 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Costo Unitario de Compra:</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={entradaForm.costo_unitario === 0 ? '' : entradaForm.costo_unitario}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEntradaForm({ 
                        ...entradaForm, 
                        costo_unitario: val === '' ? 0 : parseFloat(val) || 0 
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-blue-500 shadow-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                <div className="flex justify-between">
                  <span>Total inversión de compra:</span>
                  <span className="font-bold font-mono">
                    {config.moneda_simbolo} {(entradaForm.cantidad_ingresada * entradaForm.costo_unitario).toFixed(2)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  ℹ️ Esta acción sumará automáticamente las unidades al stock local y actualizará el costo unitario del producto.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-xs flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>GUARDAR ENTRADA Y SUMAR A STOCK</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: NUEVO / EDITAR PRODUCTO
      ======================================================== */}
      {showNewProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" />
                <span>{editingProduct ? 'Editar Producto' : 'Registrar Nuevo Producto'}</span>
              </h3>
              <button 
                onClick={() => setShowNewProductModal(false)}
                className="text-slate-500 hover:text-slate-800 text-xs font-bold px-2 py-1 bg-slate-100 rounded-lg"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nombre del Producto:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Arroz Blanco 1 Libra, Tarro de Leche..."
                  value={productForm.nombre}
                  onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-500 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Código de Barras:</label>
                  <input
                    type="text"
                    placeholder="7421..."
                    value={productForm.codigo_barras}
                    onChange={(e) => setProductForm({ ...productForm, codigo_barras: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono outline-none focus:border-emerald-500 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Categoría:</label>
                  <select
                    value={productForm.categoria}
                    onChange={(e) => setProductForm({ ...productForm, categoria: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-500 shadow-xs"
                  >
                    {categories.filter(c => c !== 'Todos').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Precio de Venta al Público:</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                    value={productForm.precio_venta === 0 ? '' : productForm.precio_venta}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProductForm({ 
                        ...productForm, 
                        precio_venta: val === '' ? 0 : parseFloat(val) || 0 
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold text-emerald-700 outline-none focus:border-emerald-500 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Precio de Costo (Compra):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={productForm.precio_costo === 0 ? '' : productForm.precio_costo}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProductForm({ 
                        ...productForm, 
                        precio_costo: val === '' ? 0 : parseFloat(val) || 0 
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono outline-none focus:border-emerald-500 shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Stock Actual:</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={productForm.stock_actual === 0 ? '' : productForm.stock_actual}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProductForm({ 
                        ...productForm, 
                        stock_actual: val === '' ? 0 : parseFloat(val) || 0 
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono outline-none focus:border-emerald-500 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Stock Mínimo (Alerta):</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="5"
                    value={productForm.stock_minimo === 0 ? '' : productForm.stock_minimo}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProductForm({ 
                        ...productForm, 
                        stock_minimo: val === '' ? 0 : parseFloat(val) || 0 
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono outline-none focus:border-emerald-500 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Unidad Medida:</label>
                  <select
                    value={productForm.unidad_medida}
                    onChange={(e) => setProductForm({ ...productForm, unidad_medida: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-500 shadow-xs"
                  >
                    {unidades.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.es_frecuente}
                    onChange={(e) => setProductForm({ ...productForm, es_frecuente: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 border-slate-300"
                  />
                  <span>Mostrar en Botonera Táctil Rápida (Frecuente)</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{editingProduct ? 'GUARDAR CAMBIOS' : 'CREAR PRODUCTO'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
