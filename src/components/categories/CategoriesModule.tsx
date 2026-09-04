import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Package, 
  Search, 
  ShoppingCart, 
  Tag, 
  ChevronRight, 
  ChevronDown, 
  RotateCcw,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Store,
  DollarSign
} from 'lucide-react';
import { Producto, ConfiguracionPulperia } from '../../types';
import { LISTA_CATEGORIAS, CATEGORIA_COLORS } from '../../data/listaProductos';
import { db } from '../../services/db';

interface CategoriesModuleProps {
  productos: Producto[];
  config: ConfiguracionPulperia;
  onSelectCategory?: (categoria: string) => void;
  onNavigateToSales?: (categoria?: string) => void;
  onNavigateToInventory?: (categoria?: string) => void;
  onRefresh: () => void;
  audioEnabled?: boolean;
}

// Iconos temáticos o emojis representativos por categoría
const CATEGORIA_EMOJIS: Record<string, string> = {
  'Granos básicos': '🌾',
  'Pastas y sopas': '🍜',
  'Enlatados y conservas': '🥫',
  'Salsas y condimentos': '🧂',
  'Aceites y grasas': '🫒',
  'Lácteos y huevos': '🥛',
  'Panadería': '🍞',
  'Galletas y snacks': '🍪',
  'Bebidas': '🥤',
  'Agua': '💧',
  'Café y té': '☕',
  'Embutidos y carnes': '🥩',
  'Frutas y verduras': '🥦',
  'Limpieza de ropa': '🧺',
  'Limpieza del hogar': '🧹',
  'Papel y desechables': '🧻',
  'Higiene personal': '🧼',
  'Bebés': '👶',
  'Mascotas': '🐾',
  'Primeros auxilios': '🩹',
  'Control de plagas': '🦟',
  'Ferretería básica': '🔨',
  'Papelería': '✏️',
  'Tecnología': '🔌',
  'Productos nicaragüenses': '🇳🇮',
  'Servicios': '⚡',
};

export const CategoriesModule: React.FC<CategoriesModuleProps> = ({
  productos,
  config,
  onNavigateToSales,
  onNavigateToInventory,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Agrupación de productos por categoría
  const categoryStats = useMemo(() => {
    // Tomar la lista canónica de 26 categorías más cualquier otra existente en productos
    const allCategoryNames = Array.from(new Set([...LISTA_CATEGORIAS, ...productos.map(p => p.categoria)]));

    return allCategoryNames.map((catName) => {
      const items = productos.filter(p => p.categoria.toLowerCase() === catName.toLowerCase());
      const totalStock = items.reduce((sum, p) => sum + p.stock_actual, 0);
      const totalValor = items.reduce((sum, p) => sum + (p.stock_actual * p.precio_venta), 0);
      const minPrice = items.length > 0 ? Math.min(...items.map(p => p.precio_venta)) : 0;
      const maxPrice = items.length > 0 ? Math.max(...items.map(p => p.precio_venta)) : 0;
      const color = CATEGORIA_COLORS[catName] || '#10B981';
      const emoji = CATEGORIA_EMOJIS[catName] || '📦';

      return {
        nombre: catName,
        items,
        totalProductos: items.length,
        totalStock,
        totalValor,
        minPrice,
        maxPrice,
        color,
        emoji,
      };
    });
  }, [productos]);

  // Filtrar categorías según término de búsqueda
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categoryStats;
    const term = searchTerm.toLowerCase();

    return categoryStats.filter(c => 
      c.nombre.toLowerCase().includes(term) ||
      c.items.some(p => p.nombre.toLowerCase().includes(term) || p.codigo_barras.includes(term))
    );
  }, [categoryStats, searchTerm]);

  // Métricas globales
  const totalCategorias = categoryStats.length;
  const totalProductos = productos.length;
  const totalStockGlobal = productos.reduce((sum, p) => sum + p.stock_actual, 0);
  const totalValorGlobal = productos.reduce((sum, p) => sum + (p.stock_actual * p.precio_venta), 0);

  const handleRestaurar = () => {
    if (window.confirm('¿Deseas restaurar la lista oficial de 278 productos y 26 categorías?')) {
      db.recargarCatalogoBase();
      onRefresh();
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. HEADER Y RESUMEN GENERAL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-black">
                <Layers className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="font-black text-slate-900 text-lg sm:text-xl">
                Catálogo de Categorías ({totalCategorias})
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Organización integral de todos los productos por categoría oficial de la pulpería
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRestaurar}
              title="Restaurar las 26 categorías y 278 productos"
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>Restaurar Catálogo (278)</span>
            </button>

            {onNavigateToInventory && (
              <button
                onClick={() => onNavigateToInventory()}
                className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 transition-colors"
              >
                <Package className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ir a Inventario</span>
              </button>
            )}

            {onNavigateToSales && (
              <button
                onClick={() => onNavigateToSales()}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Punto de Venta</span>
              </button>
            )}
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-slate-500 font-medium block">Total Categorías</span>
            <span className="font-extrabold text-slate-900 text-base sm:text-lg">{totalCategorias}</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-slate-500 font-medium block">Productos Registrados</span>
            <span className="font-extrabold text-slate-900 text-base sm:text-lg">{totalProductos}</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-slate-500 font-medium block">Unidades en Stock</span>
            <span className="font-extrabold text-emerald-700 text-base sm:text-lg">{totalStockGlobal}</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-slate-500 font-medium block">Valoración de Stock</span>
            <span className="font-extrabold text-slate-900 text-base sm:text-lg font-mono">
              {config.moneda_simbolo} {totalValorGlobal.toLocaleString('es-NI', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* BUSCADOR DE CATEGORÍA O PRODUCTO */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar categoría o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
          />
        </div>
      </div>

      {/* 2. GRID DE LAS 26 CATEGORÍAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredCategories.map((cat) => {
          const isExpanded = expandedCategory === cat.nombre;

          return (
            <div
              key={cat.nombre}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Header de Categoría con Franja de Color */}
              <div 
                className="p-3.5 text-white flex items-center justify-between"
                style={{ backgroundColor: cat.color }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl drop-shadow-sm">{cat.emoji}</span>
                  <div>
                    <h3 className="font-black text-sm sm:text-base leading-tight drop-shadow-xs">
                      {cat.nombre}
                    </h3>
                    <p className="text-[11px] opacity-90 font-medium">
                      {cat.totalProductos} {cat.totalProductos === 1 ? 'producto' : 'productos'} registrados
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full bg-white/25 text-white text-[11px] font-bold backdrop-blur-xs">
                  {cat.totalStock} unid.
                </span>
              </div>

              {/* Contenido / Resumen de la Categoría */}
              <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Rango de Precios</span>
                    <span className="font-bold text-slate-900 font-mono text-[11px]">
                      {config.moneda_simbolo} {cat.minPrice.toFixed(0)} - {config.moneda_simbolo} {cat.maxPrice.toFixed(0)}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Valor en Stock</span>
                    <span className="font-bold text-emerald-700 font-mono text-[11px]">
                      {config.moneda_simbolo} {cat.totalValor.toLocaleString('es-NI', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                {/* Vista previa de productos (los primeros 3) */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Artículos en esta categoría:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {cat.items.slice(0, 4).map((item) => (
                      <span
                        key={item.id}
                        className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                      >
                        {item.nombre}
                      </span>
                    ))}
                    {cat.items.length > 4 && (
                      <span className="text-[10px] text-slate-500 font-bold self-center">
                        +{cat.items.length - 4} más
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones para interactuar con la categoría */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedCategory(isExpanded ? null : cat.nombre)}
                    className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 py-1.5 px-2.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <span>{isExpanded ? 'Ocultar lista' : `Ver todos (${cat.totalProductos})`}</span>
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex items-center gap-1">
                    {onNavigateToInventory && (
                      <button
                        type="button"
                        onClick={() => onNavigateToInventory(cat.nombre)}
                        title={`Ver ${cat.nombre} en inventario`}
                        className="text-[11px] font-semibold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Package className="w-3 h-3" />
                        <span className="hidden sm:inline">Inventario</span>
                      </button>
                    )}

                    {onNavigateToSales && (
                      <button
                        type="button"
                        onClick={() => onNavigateToSales(cat.nombre)}
                        title={`Cobrar productos de ${cat.nombre}`}
                        className="text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span>Vender</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Desplegable interactivo con todos los productos de esta categoría */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-200 space-y-2 max-h-60 overflow-y-auto pr-1">
                    <div className="divide-y divide-slate-100">
                      {cat.items.map((prod) => (
                        <div
                          key={prod.id}
                          className="py-1.5 flex items-center justify-between text-xs hover:bg-slate-50 px-1 rounded"
                        >
                          <div>
                            <p className="font-bold text-slate-800">{prod.nombre}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {prod.unidad_medida} • Stock: {prod.stock_actual}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-slate-900 font-mono">
                              {config.moneda_simbolo} {prod.precio_venta.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
