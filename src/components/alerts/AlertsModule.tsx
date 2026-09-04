import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShoppingCart, 
  Share2, 
  Copy, 
  Check, 
  PlusCircle, 
  RefreshCw, 
  TrendingDown, 
  PackageCheck,
  CheckCheck
} from 'lucide-react';
import { Producto, ConfiguracionPulperia } from '../../types';
import { db } from '../../services/db';
import { audioSpeech } from '../../services/audioSpeech';

interface AlertsModuleProps {
  productos: Producto[];
  config: ConfiguracionPulperia;
  onRefresh: () => void;
  audioEnabled: boolean;
}

export const AlertsModule: React.FC<AlertsModuleProps> = ({
  productos,
  config,
  onRefresh,
  audioEnabled,
}) => {
  const [copied, setCopied] = useState(false);
  const [quickRestockQuantities, setQuickRestockQuantities] = useState<Record<string, number>>({});

  // Filtrar productos con stock crítico o bajo
  const lowStockProducts = productos.filter((p) => p.stock_actual <= p.stock_minimo);
  const outOfStockProducts = productos.filter((p) => p.stock_actual <= 0);
  const warningProducts = productos.filter((p) => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo);

  // Calcular lista de reposición sugerida
  const replenishmentItems = lowStockProducts.map((p) => {
    // Sugerencia: rellenar hasta el doble del stock mínimo o al menos 10 unidades
    const targetStock = Math.max(p.stock_minimo * 2, 10);
    const suggestedUnits = Math.max(1, targetStock - p.stock_actual);
    const estimatedCost = suggestedUnits * p.precio_costo;

    return {
      producto: p,
      sugerido: suggestedUnits,
      costoEstimado: estimatedCost,
    };
  });

  const totalEstimatedCost = replenishmentItems.reduce((acc, item) => acc + item.costoEstimado, 0);

  // Generar texto para WhatsApp o Proveedor
  const generateWhatsAppOrderText = () => {
    let text = `📦 *PEDIDO DE REPOSICIÓN - ${config.nombre_negocio.toUpperCase()}*\n`;
    text += `📅 Fecha: ${new Date().toLocaleDateString('es-ES')}\n`;
    text += `👤 Contacto: ${config.propietario} (${config.telefono})\n\n`;
    text += `*Lista de Productos Requeridos:*\n`;

    replenishmentItems.forEach((item, index) => {
      text += `${index + 1}. *${item.producto.nombre}*: ${item.sugerido} ${item.producto.unidad_medida}s (Stock actual: ${item.producto.stock_actual})\n`;
    });

    text += `\n💰 *Total Estimado de Compra:* ${config.moneda_simbolo} ${totalEstimatedCost.toFixed(2)}`;
    return text;
  };

  const handleCopyOrder = () => {
    const text = generateWhatsAppOrderText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (audioEnabled) audioSpeech.playSuccessSound();
    setTimeout(() => setCopied(false), 2500);
  };

  // Reabastecimiento rápido de 1 producto
  const handleQuickRestock = (prodId: string, units: number) => {
    const prod = productos.find(p => p.id === prodId);
    if (!prod) return;

    db.registrarEntradaMercancia({
      proveedor: 'Reposición Rápida Pulpería',
      numero_factura: `AUTO-${Date.now().toString().slice(-4)}`,
      producto_id: prod.id,
      producto_nombre: prod.nombre,
      cantidad_ingresada: units,
      costo_unitario: prod.precio_costo,
      total_costo: units * prod.precio_costo,
      nota: 'Reabastecimiento rápido desde alerta de stock',
    });

    if (audioEnabled) {
      audioSpeech.playSuccessSound();
      audioSpeech.speak(`Reabastecido ${units} ${prod.nombre}`);
    }
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Overview */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              Stock de Seguridad & Alertas de Abastecimiento
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Detección automática de productos agotados y por agotarse con cálculo de reposición sugerida
          </p>
        </div>

        {/* Resumen de Alertas */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-xl text-center">
            <span className="text-[10px] text-rose-700 font-bold uppercase block">Agotados</span>
            <span className="text-lg font-black text-rose-700 font-mono">{outOfStockProducts.length}</span>
          </div>

          <div className="bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl text-center">
            <span className="text-[10px] text-amber-800 font-bold uppercase block">Por Agotarse</span>
            <span className="text-lg font-black text-amber-800 font-mono">{warningProducts.length}</span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-center">
            <span className="text-[10px] text-emerald-800 font-bold uppercase block">Inversión Sugerida</span>
            <span className="text-lg font-black text-emerald-800 font-mono">
              {config.moneda_simbolo}{totalEstimatedCost.toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {productos.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <PackageCheck className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Módulo de Alertas Listo
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Aún no hay productos registrados en el inventario. Cuando agregues tus artículos con sus niveles de stock mínimo, el sistema supervisará automáticamente las existencias y te alertará aquí.
          </p>
        </div>
      ) : lowStockProducts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <PackageCheck className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            ¡Inventario en Niveles Óptimos!
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Todos los productos de la pulpería cuentan con existencias por encima de sus límites mínimos de seguridad.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* COLUMNA IZQUIERDA: TARJETAS DE ALERTAS ROJAS / AMARILLAS (7/12) */}
          <div className="lg:col-span-7 space-y-3">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-amber-600" />
              <span>Artículos que requieren atención ({lowStockProducts.length})</span>
            </h3>

            <div className="space-y-2.5">
              {lowStockProducts.map((p) => {
                const isZero = p.stock_actual <= 0;
                const targetStock = Math.max(p.stock_minimo * 2, 10);
                const suggestedUnits = Math.max(1, targetStock - p.stock_actual);

                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${
                      isZero
                        ? 'bg-rose-50/50 border-rose-200'
                        : 'bg-amber-50/40 border-amber-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isZero ? 'bg-rose-600 text-white' : 'bg-amber-500 text-slate-950'
                        }`}>
                          {isZero ? '⚠️ AGOTADO' : '🟡 STOCK BAJO'}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          Mínimo: {p.stock_minimo} {p.unidad_medida}s
                        </span>
                      </div>

                      <h4 className="font-bold text-sm sm:text-base text-slate-900">
                        {p.nombre}
                      </h4>

                      <p className="text-xs text-slate-600">
                        Existencia actual: <strong className={isZero ? 'text-rose-700 font-bold' : 'text-amber-800 font-bold'}>{p.stock_actual} {p.unidad_medida}s</strong> • Costo de reposición: {config.moneda_simbolo}{p.precio_costo.toFixed(2)} c/u
                      </p>
                    </div>

                    {/* Botón de Reabastecimiento Rápido */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleQuickRestock(p.id, suggestedUnits)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 ${
                          isZero
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                        }`}
                        title={`Surtir +${suggestedUnits} unidades recomendadas`}
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Surtir +{suggestedUnits}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUMNA DERECHA: LISTA DE COMPRAS SUGERIDA & WHATSAPP (5/12) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Lista de Reposición</h3>
              </div>
              <button
                onClick={handleCopyOrder}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4 text-emerald-600" />}
                <span>{copied ? '¡Copiado!' : 'Copiar para WhatsApp'}</span>
              </button>
            </div>

            {/* Listado de Productos Sugeridos */}
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 text-xs">
              {replenishmentItems.map((item, idx) => (
                <div
                  key={item.producto.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {idx + 1}. {item.producto.nombre}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Pedir: <strong className="text-slate-900 font-mono">{item.sugerido} {item.producto.unidad_medida}s</strong> (Quedan {item.producto.stock_actual})
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900 font-mono">
                      {config.moneda_simbolo} {item.costoEstimado.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Inversión Estimada */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-slate-600">
                  Inversión Total Estimada:
                </span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {config.moneda_simbolo} {totalEstimatedCost.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Calculado con base en el costo de adquisición registrado para cada artículo.
              </p>
            </div>

            {/* Botón Acción Proveedor */}
            <button
              onClick={handleCopyOrder}
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 font-bold text-white shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>Enviar Pedido a Proveedores (WhatsApp)</span>
            </button>

          </div>

        </div>
      )}
    </div>
  );
};
