import React, { useMemo } from 'react';
import { Zap, Plus, AlertCircle, ShoppingBag } from 'lucide-react';
import { Producto } from '../../types';
import { CATEGORIA_EMOJIS } from '../../data/listaProductos';
import { audioSpeech } from '../../services/audioSpeech';

interface OneTouchKeypadProps {
  productos: Producto[];
  onAddToCart: (producto: Producto, cantidad: number) => void;
  monedaSimbolo?: string;
  audioEnabled?: boolean;
}

export const OneTouchKeypad: React.FC<OneTouchKeypadProps> = ({
  productos,
  onAddToCart,
  monedaSimbolo = 'C$',
  audioEnabled = true,
}) => {
  // Obtener los productos esenciales más frecuentes y vendidos en pulperías nicas
  const essentialProducts = useMemo(() => {
    // Primero filtrar frecuentes
    const frecuentes = productos.filter((p) => p.es_frecuente);
    if (frecuentes.length >= 8) {
      return frecuentes.slice(0, 12);
    }

    // Si hay pocos frecuentes, buscar por nombres clave típicos
    const keywords = ['arroz', 'frijol', 'azúcar', 'azucar', 'aceite', 'huevo', 'leche', 'coca', 'pan', 'queso', 'sal'];
    const matched = productos.filter((p) => {
      const lower = p.nombre.toLowerCase();
      return keywords.some(kw => lower.includes(kw));
    });

    const combined = Array.from(new Set([...frecuentes, ...matched]));
    return combined.length > 0 ? combined.slice(0, 12) : productos.slice(0, 12);
  }, [productos]);

  const handleTap = (prod: Producto, qty: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (prod.stock_actual <= 0) {
      if (audioEnabled) audioSpeech.playAlertSound();
      return;
    }
    onAddToCart(prod, qty);
    if (audioEnabled) {
      audioSpeech.playBeep(900 + qty * 40, 0.05);
    }
  };

  if (essentialProducts.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-transparent border border-amber-300/60 rounded-2xl p-3 sm:p-4 shadow-xs space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs">
            <Zap className="w-4 h-4 fill-slate-950" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
              <span>Botonera Táctil de 1 Toque</span>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.2 rounded-full border border-amber-300">
                100% Sin Internet
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Venta instantánea de productos básicos con un solo toque
            </p>
          </div>
        </div>
        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
          {essentialProducts.length} básicos
        </span>
      </div>

      {/* Grid táctil de botones grandes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {essentialProducts.map((prod) => {
          const isOutOfStock = prod.stock_actual <= 0;
          const isLowStock = prod.stock_actual <= prod.stock_minimo;
          const emoji = CATEGORIA_EMOJIS[prod.categoria] || '📦';

          return (
            <div
              key={prod.id}
              onClick={(e) => handleTap(prod, 1, e)}
              className={`group relative p-2.5 rounded-xl border bg-white hover:bg-amber-50/40 active:scale-[0.97] transition-all flex flex-col justify-between shadow-xs cursor-pointer select-none text-left ${
                isOutOfStock
                  ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200'
                  : isLowStock
                  ? 'border-amber-300 hover:border-amber-400'
                  : 'border-slate-200 hover:border-emerald-400'
              }`}
            >
              {/* Top row: Emoji & Price */}
              <div className="flex items-start justify-between gap-1">
                <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">
                  {emoji}
                </span>
                <span className="font-mono font-black text-xs sm:text-sm text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded-md">
                  {monedaSimbolo}{prod.precio_venta.toFixed(0)}
                </span>
              </div>

              {/* Title & Unit */}
              <div className="my-1.5">
                <p className="font-bold text-slate-900 text-xs leading-tight line-clamp-2">
                  {prod.nombre}
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {prod.unidad_medida} • {isOutOfStock ? (
                    <span className="text-rose-600 font-bold">Agotado</span>
                  ) : (
                    <span className={isLowStock ? 'text-amber-700 font-bold' : 'text-slate-600'}>
                      Stock: {prod.stock_actual}
                    </span>
                  )}
                </p>
              </div>

              {/* Quick Multi-Unit Chips (+1, +2, +5) */}
              {!isOutOfStock && (
                <div className="flex items-center gap-1 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={(e) => handleTap(prod, 1, e)}
                    className="flex-1 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] flex items-center justify-center gap-0.5 shadow-2xs"
                    title="Agregar 1 unidad"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleTap(prod, 2, e)}
                    className="flex-1 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] flex items-center justify-center shadow-2xs"
                    title="Agregar 2 unidades"
                  >
                    +2
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleTap(prod, 5, e)}
                    className="flex-1 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] flex items-center justify-center shadow-2xs"
                    title="Agregar 5 unidades"
                  >
                    +5
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
