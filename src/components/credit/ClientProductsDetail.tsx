import React, { useState, useMemo } from 'react';
import { 
  Package, 
  ShoppingCart, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  ListOrdered, 
  Clock, 
  Receipt,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Cliente, Venta, ConfiguracionPulperia } from '../../types';

interface ClientProductsDetailProps {
  cliente: Cliente;
  ventas: Venta[];
  config: ConfiguracionPulperia;
  onOpenWhatsApp: () => void;
}

export const ClientProductsDetail: React.FC<ClientProductsDetailProps> = ({
  cliente,
  ventas,
  config,
  onOpenWhatsApp,
}) => {
  const [viewStyle, setViewStyle] = useState<'tickets' | 'consolidado'>('tickets');
  // Estado para tickets expandidos/colapsados (por defecto todos expandidos para lectura rápida)
  const [expandedTickets, setExpandedTickets] = useState<Record<string, boolean>>({});

  const toggleTicket = (ticketId: string) => {
    setExpandedTickets((prev) => ({
      ...prev,
      [ticketId]: prev[ticketId] !== undefined ? !prev[ticketId] : false, // por defecto true
    }));
  };

  const isTicketExpanded = (ticketId: string) => {
    return expandedTickets[ticketId] !== undefined ? expandedTickets[ticketId] : true;
  };

  // Calcular artículos consolidados acumulados
  const articulosConsolidados = useMemo(() => {
    const map = new Map<string, {
      producto_nombre: string;
      unidad_medida: string;
      cantidad_total: number;
      monto_total: number;
      precio_promedio: number;
      veces_comprado: number;
    }>();

    ventas.forEach((v) => {
      if (v.items) {
        v.items.forEach((item) => {
          const key = item.producto_id || item.producto_nombre.toLowerCase();
          const existing = map.get(key);
          if (existing) {
            existing.cantidad_total += item.cantidad;
            existing.monto_total += item.subtotal;
            existing.veces_comprado += 1;
          } else {
            map.set(key, {
              producto_nombre: item.producto_nombre,
              unidad_medida: item.unidad_medida || 'unidad',
              cantidad_total: item.cantidad,
              monto_total: item.subtotal,
              precio_promedio: item.precio_unitario,
              veces_comprado: 1,
            });
          }
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.monto_total - a.monto_total);
  }, [ventas]);

  const totalArticulos = useMemo(() => {
    return articulosConsolidados.reduce((acc, it) => acc + it.cantidad_total, 0);
  }, [articulosConsolidados]);

  const totalMontoVentas = useMemo(() => {
    return ventas.reduce((acc, v) => acc + v.total, 0);
  }, [ventas]);

  return (
    <div className="space-y-3">
      {/* BARRA SUPERIOR DE RESUMEN Y SELECTOR DE VISTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
        <div>
          <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
            Productos Adquiridos al Fiado
          </span>
          <p className="text-xs text-emerald-950 font-medium">
            <strong className="font-extrabold">{totalArticulos} artículos</strong> adquiridos en <strong className="font-extrabold">{ventas.length} compras</strong>
          </p>
        </div>

        {ventas.length > 0 && (
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-emerald-200 text-xs">
            <button
              type="button"
              onClick={() => setViewStyle('tickets')}
              className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 transition-all ${
                viewStyle === 'tickets'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Por Ticket</span>
            </button>
            <button
              type="button"
              onClick={() => setViewStyle('consolidado')}
              className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 transition-all ${
                viewStyle === 'consolidado'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Consolidado</span>
            </button>
          </div>
        )}
      </div>

      {/* CASO: NO HAY VENTAS REGISTRADAS */}
      {ventas.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h5 className="font-bold text-slate-800 text-xs sm:text-sm">
            Saldo deudor registrado en libreta
          </h5>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Este cliente tiene un saldo pendiente de <strong>{config.moneda_simbolo} {cliente.saldo_actual.toFixed(2)}</strong> registrado inicialmente. Las nuevas ventas al fiado registradas desde Caja desglosarán automáticamente los productos aquí.
          </p>
          <button
            type="button"
            onClick={onOpenWhatsApp}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Enviar Saldo por WhatsApp</span>
          </button>
        </div>
      ) : viewStyle === 'tickets' ? (
        /* VISTA 1: DESGLOSE POR TICKET */
        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
          {ventas.map((venta) => {
            const isExpanded = isTicketExpanded(venta.id);
            const folio = venta.id.length > 6 ? venta.id.slice(-6) : venta.id;
            const cantidadArticulosTicket = venta.items ? venta.items.reduce((s, it) => s + it.cantidad, 0) : 0;

            return (
              <div 
                key={venta.id} 
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition-colors"
              >
                {/* Cabecera del ticket */}
                <div 
                  onClick={() => toggleTicket(venta.id)}
                  className="p-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs font-mono">
                      #{folio}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">
                          Ticket #{folio}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          ({cantidadArticulosTicket} {cantidadArticulosTicket === 1 ? 'artículo' : 'artículos'})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{venta.fecha_hora}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Compra</span>
                      <span className="text-sm font-black font-mono text-amber-700">
                        {config.moneda_simbolo} {venta.total.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Lista de productos desplegada */}
                {isExpanded && (
                  <div className="p-3 space-y-1.5 bg-white">
                    {(!venta.items || venta.items.length === 0) ? (
                      <p className="text-xs text-slate-400 italic py-1">Sin desglose de artículos registrado.</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-slate-400 text-[10px] uppercase border-b border-slate-100 pb-1">
                            <th className="text-left font-bold py-1">Producto</th>
                            <th className="text-center font-bold py-1">Cant.</th>
                            <th className="text-right font-bold py-1">Precio Unit.</th>
                            <th className="text-right font-bold py-1">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {venta.items.map((item, idx) => (
                            <tr key={`${venta.id}-it-${idx}`} className="text-slate-700 hover:bg-slate-50/50">
                              <td className="py-1.5 pr-2 font-medium text-slate-900">
                                {item.producto_nombre}
                              </td>
                              <td className="py-1.5 px-1 text-center font-mono font-bold text-slate-700">
                                {item.cantidad} {item.unidad_medida && item.unidad_medida !== 'unidad' ? item.unidad_medida : ''}
                              </td>
                              <td className="py-1.5 px-1 text-right font-mono text-slate-500">
                                {config.moneda_simbolo}{item.precio_unitario.toFixed(2)}
                              </td>
                              <td className="py-1.5 pl-2 text-right font-mono font-extrabold text-slate-900">
                                {config.moneda_simbolo}{item.subtotal.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA 2: LISTA CONSOLIDADA DE ARTÍCULOS */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase border-b border-slate-200">
                <th className="text-left font-bold p-2.5">Artículo / Producto</th>
                <th className="text-center font-bold p-2.5">Cant. Total</th>
                <th className="text-right font-bold p-2.5">Veces Llevado</th>
                <th className="text-right font-bold p-2.5">Monto Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {articulosConsolidados.map((art, idx) => (
                <tr key={`cons-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-2.5 font-bold text-slate-900 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{art.producto_nombre}</span>
                  </td>
                  <td className="p-2.5 text-center font-mono font-extrabold text-slate-800">
                    {art.cantidad_total} {art.unidad_medida !== 'unidad' ? art.unidad_medida : ''}
                  </td>
                  <td className="p-2.5 text-right font-mono text-slate-500">
                    {art.veces_comprado} {art.veces_comprado === 1 ? 'ticket' : 'tickets'}
                  </td>
                  <td className="p-2.5 text-right font-mono font-black text-emerald-800">
                    {config.moneda_simbolo} {art.monto_total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-200 font-extrabold text-slate-900">
                <td className="p-2.5">Total Consolidado</td>
                <td className="p-2.5 text-center font-mono">{totalArticulos} artículos</td>
                <td className="p-2.5 text-right font-mono">{ventas.length} compras</td>
                <td className="p-2.5 text-right font-mono text-amber-800 font-black">
                  {config.moneda_simbolo} {totalMontoVentas.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};
