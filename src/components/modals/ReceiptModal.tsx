import React, { useRef } from 'react';
import { 
  Printer, 
  Share2, 
  X, 
  CheckCircle2, 
  Store, 
  Send,
  Download
} from 'lucide-react';
import { ConfiguracionPulperia, Venta } from '../../types';

interface ReceiptModalProps {
  receiptData: any;
  config: ConfiguracionPulperia;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  receiptData,
  config,
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!receiptData) return null;

  const isVenta = receiptData.tipo_comprobante === 'VENTA' || !!receiptData.items || !!receiptData.total;
  const isAbono = receiptData.tipo_comprobante === 'ABONO';
  const isCorte = receiptData.tipo_comprobante === 'CORTE_CAJA';

  const venta: Venta | undefined = receiptData.venta || (isVenta ? receiptData : undefined);

  // Imprimir
  const handlePrint = () => {
    window.print();
  };

  // Compartir por WhatsApp
  const handleShareWhatsApp = () => {
    let msg = `🧾 *COMPROBANTE DIGITAL*\n*${config.nombre_negocio.toUpperCase()}*\n`;
    msg += `📍 ${config.direccion}\n`;
    msg += `📞 Tel: ${config.telefono}\n----------------------------\n`;

    if (isVenta && venta) {
      msg += `*Venta #${venta.id}* - ${venta.fecha_hora}\n`;
      msg += `Cliente: ${venta.cliente_nombre || 'Cliente Mostrador'}\n`;
      msg += `Tipo: ${venta.tipo === 'contado' ? 'Contado' : 'Al Fiado'}\n\n`;
      msg += `*DETALLE:*\n`;
      venta.items.forEach(i => {
        msg += `• ${i.cantidad}x ${i.producto_nombre} = ${config.moneda_simbolo} ${i.subtotal.toFixed(2)}\n`;
      });
      msg += `----------------------------\n`;
      msg += `*TOTAL:* ${config.moneda_simbolo} ${venta.total.toFixed(2)}\n`;
      if (venta.tipo === 'contado') {
        msg += `Pagó con: ${config.moneda_simbolo} ${venta.pago_con.toFixed(2)}\n`;
        msg += `Vuelto: ${config.moneda_simbolo} ${venta.vuelto.toFixed(2)}\n`;
      }
    } else if (isAbono) {
      msg += `*RECIBO DE ABONO A FIADO*\n`;
      msg += `Cliente: ${receiptData.cliente?.nombre}\n`;
      msg += `Fecha: ${receiptData.fecha}\n`;
      msg += `Folio: ${receiptData.folio}\n----------------------------\n`;
      msg += `*Monto Abonado:* ${config.moneda_simbolo} ${receiptData.montoAbono?.toFixed(2)}\n`;
      msg += `Saldo Anterior: ${config.moneda_simbolo} ${receiptData.saldoAnterior?.toFixed(2)}\n`;
      msg += `*NUEVO SALDO DEUDOR:* ${config.moneda_simbolo} ${receiptData.saldoNuevo?.toFixed(2)}\n`;
    } else if (isCorte) {
      msg += `*CORTE DE CAJA DIARIO*\nFecha: ${receiptData.fecha}\n----------------------------\n`;
      msg += `Efectivo Inicial: ${config.moneda_simbolo} ${receiptData.resumen?.efectivo_inicial.toFixed(2)}\n`;
      msg += `Ventas Efectivo: +${config.moneda_simbolo} ${receiptData.resumen?.total_ventas_efectivo.toFixed(2)}\n`;
      msg += `Abonos Fiados: +${config.moneda_simbolo} ${receiptData.resumen?.total_abonos_recibidos.toFixed(2)}\n`;
      msg += `Gastos / Salidas: -${config.moneda_simbolo} ${receiptData.resumen?.total_salidas_gastos.toFixed(2)}\n`;
      msg += `*EFECTIVO ESPERADO:* ${config.moneda_simbolo} ${receiptData.resumen?.efectivo_esperado_caja.toFixed(2)}\n`;
    }

    msg += `----------------------------\n${config.mensaje_ticket}`;

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        
        {/* Modal Top Bar */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Comprobante Digital
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Receipt Preview Paper */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-100/70">
          <div
            ref={receiptRef}
            className="bg-white text-slate-900 p-5 rounded-2xl shadow-xs border border-slate-200 font-mono text-xs space-y-3 select-text"
          >
            {/* Store Header */}
            <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-900">{config.nombre_negocio}</h3>
              <p className="text-[11px] text-slate-600 leading-tight">{config.direccion}</p>
              <p className="text-[11px] text-slate-600">Tel: {config.telefono}</p>
              <p className="text-[10px] text-slate-500">Propietario: {config.propietario}</p>
            </div>

            {/* VENTA CONTENT */}
            {isVenta && venta && (
              <>
                <div className="space-y-0.5 text-[11px] border-b border-dashed border-slate-300 pb-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-900">VENTA #{venta.id}</span>
                    <span className="text-slate-600">{venta.fecha_hora.split(' ')[0]}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Hora: {venta.fecha_hora.split(' ')[1]}</span>
                    <span className="font-bold uppercase text-slate-800">
                      {venta.tipo === 'contado' ? 'Efectivo' : 'Crédito/Fiado'}
                    </span>
                  </div>
                  <p className="text-slate-700 font-medium truncate">
                    Cliente: {venta.cliente_nombre || 'Cliente Mostrador'}
                  </p>
                </div>

                {/* Items Table */}
                <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
                  <div className="flex justify-between font-bold text-[10px] uppercase text-slate-500">
                    <span>Cant / Producto</span>
                    <span>Total</span>
                  </div>
                  {venta.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-[11px] leading-tight">
                      <div className="pr-2 truncate">
                        <span className="font-bold">{item.cantidad}x</span> {item.producto_nombre}
                      </div>
                      <span className="font-bold shrink-0">
                        {config.moneda_simbolo} {item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-1 pt-1 text-[11px]">
                  <div className="flex justify-between font-black text-sm pt-1 text-slate-900">
                    <span>TOTAL A PAGAR:</span>
                    <span>{config.moneda_simbolo} {venta.total.toFixed(2)}</span>
                  </div>
                  {venta.tipo === 'contado' ? (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>Efectivo Recibido:</span>
                        <span>{config.moneda_simbolo} {venta.pago_con.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-700">
                        <span>Vuelto Entregado:</span>
                        <span>{config.moneda_simbolo} {venta.vuelto.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="bg-blue-50 p-2 rounded text-blue-800 text-[10px] font-bold text-center border border-blue-200">
                      Cargado a la cuenta de fiado de {venta.cliente_nombre}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ABONO CONTENT */}
            {isAbono && (
              <>
                <div className="text-center py-1 bg-emerald-50 rounded border border-emerald-200">
                  <span className="font-black text-emerald-800 text-xs uppercase">
                    COMPROBANTE DE ABONO
                  </span>
                </div>
                <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
                  <p><strong>Cliente:</strong> {receiptData.cliente?.nombre}</p>
                  <p><strong>Fecha y Hora:</strong> {receiptData.fecha}</p>
                  <p><strong>Folio Movimiento:</strong> {receiptData.folio}</p>
                </div>
                <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
                  <div className="flex justify-between font-bold text-emerald-700 text-sm">
                    <span>MONTO ABONADO:</span>
                    <span>{config.moneda_simbolo} {receiptData.montoAbono?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Saldo Anterior:</span>
                    <span>{config.moneda_simbolo} {receiptData.saldoAnterior?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-1">
                    <span>NUEVO SALDO PENDIENTE:</span>
                    <span>{config.moneda_simbolo} {receiptData.saldoNuevo?.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}

            {/* CORTE DE CAJA CONTENT */}
            {isCorte && (
              <>
                <div className="text-center py-1 bg-slate-100 rounded border border-slate-300">
                  <span className="font-black text-slate-800 text-xs uppercase">
                    CORTE DIARIO DE CAJA
                  </span>
                </div>
                <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
                  <p><strong>Fecha:</strong> {receiptData.fecha}</p>
                  <p><strong>Ventas Totales:</strong> {receiptData.resumen?.cantidad_transacciones}</p>
                </div>
                <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
                  <div className="flex justify-between">
                    <span>Fondo Inicial:</span>
                    <span>{config.moneda_simbolo} {receiptData.resumen?.efectivo_inicial.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>(+) Ventas Efectivo:</span>
                    <span>+{config.moneda_simbolo} {receiptData.resumen?.total_ventas_efectivo.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-blue-700">
                    <span>(+) Abonos Fiados:</span>
                    <span>+{config.moneda_simbolo} {receiptData.resumen?.total_abonos_recibidos.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-rose-700">
                    <span>(-) Gastos / Salidas:</span>
                    <span>-{config.moneda_simbolo} {receiptData.resumen?.total_salidas_gastos.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-200">
                    <span>EFECTIVO ESPERADO:</span>
                    <span>{config.moneda_simbolo} {receiptData.resumen?.efectivo_esperado_caja.toFixed(2)}</span>
                  </div>
                  {receiptData.efectivoContado !== undefined && (
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>Efectivo Contado:</span>
                      <span>{config.moneda_simbolo} {receiptData.efectivoContado.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Footer Greeting */}
            <div className="text-center text-[10px] text-slate-500 pt-2 leading-tight">
              <p>{config.mensaje_ticket}</p>
              <p className="text-[9px] text-slate-400 mt-1">*** Pulpería POS Offline ***</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
        </div>

      </div>
    </div>
  );
};
