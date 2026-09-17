import React, { useState, useMemo } from 'react';
import { 
  Send, 
  Copy, 
  Check, 
  X, 
  MessageSquare, 
  Phone, 
  Calendar, 
  Package, 
  CheckCircle2, 
  ExternalLink,
  Edit3
} from 'lucide-react';
import { Cliente, Venta, MovimientoCaja, ConfiguracionPulperia } from '../../types';

interface WhatsAppStatementModalProps {
  cliente: Cliente;
  ventas: Venta[];
  abonos: MovimientoCaja[];
  config: ConfiguracionPulperia;
  isOpen: boolean;
  onClose: () => void;
}

const COUNTRY_CODES = [
  { code: '505', name: 'Nicaragua (+505)', flag: '🇳🇮' },
  { code: '504', name: 'Honduras (+504)', flag: '🇭🇳' },
  { code: '503', name: 'El Salvador (+503)', flag: '🇸🇻' },
  { code: '502', name: 'Guatemala (+502)', flag: '🇬🇹' },
  { code: '506', name: 'Costa Rica (+506)', flag: '🇨🇷' },
  { code: '52', name: 'México (+52)', flag: '🇲🇽' },
  { code: '1', name: 'EE.UU. (+1)', flag: '🇺🇸' },
];

export const WhatsAppStatementModal: React.FC<WhatsAppStatementModalProps> = ({
  cliente,
  ventas,
  abonos,
  config,
  isOpen,
  onClose,
}) => {
  // Configuración del mensaje
  const [includeProducts, setIncludeProducts] = useState(true);
  const [includeAbonos, setIncludeAbonos] = useState(true);
  const [customNote, setCustomNote] = useState('');
  const [copied, setCopied] = useState(false);

  // Teléfono y código de país
  const defaultCountryCode = '505'; // Predeterminado Nicaragua
  const [selectedCountryCode, setSelectedCountryCode] = useState(defaultCountryCode);
  
  // Limpiar número inicial
  const initialPhoneDigits = useMemo(() => {
    let raw = (cliente.telefono || '').replace(/[^0-9]/g, '');
    // Si ya empieza con 505 y tiene más de 8 dígitos, extraer
    if (raw.startsWith('505') && raw.length > 8) {
      return raw.slice(3);
    }
    return raw;
  }, [cliente.telefono]);

  const [phoneDigits, setPhoneDigits] = useState(initialPhoneDigits);

  // Calcular teléfono internacional limpio
  const fullPhoneNumber = useMemo(() => {
    const cleanDigits = phoneDigits.replace(/[^0-9]/g, '');
    if (!cleanDigits) return '';
    // Si el usuario ya incluyó el código de país (más de 9 dígitos y empieza con código)
    if (cleanDigits.length > 10) {
      return cleanDigits;
    }
    return `${selectedCountryCode}${cleanDigits}`;
  }, [selectedCountryCode, phoneDigits]);

  // Generar texto completo formateado para WhatsApp
  const messageText = useMemo(() => {
    const lineas: string[] = [];
    const moneda = config.moneda_simbolo || 'C$';
    const negocio = (config.nombre_negocio || 'Nuestra Pulpería').toUpperCase();

    lineas.push(`🏪 *${negocio}*`);
    lineas.push(`📋 *ESTADO DE CUENTA Y DETALLE DE COMPRAS*`);
    lineas.push(`----------------------------------------`);
    lineas.push(`Estimado/a *${cliente.nombre}*, reciba un cordial saludo.`);
    lineas.push(`Le compartimos el detalle de los productos adquiridos al fiado y su cuenta actual:\n`);

    // Detalle de productos por compra
    if (includeProducts && ventas.length > 0) {
      lineas.push(`🛒 *PRODUCTOS ADQUIRIDOS AL FIADO:*`);
      
      ventas.forEach((v) => {
        const fecha = v.fecha_hora ? v.fecha_hora.split(' ')[0] : 'Reciente';
        const folio = v.id.length > 6 ? v.id.slice(-6) : v.id;
        lineas.push(`\n📅 *Ticket #${folio}* (${fecha}) - *${moneda} ${v.total.toFixed(2)}*`);
        
        if (v.items && v.items.length > 0) {
          v.items.forEach((item) => {
            const unidadStr = item.unidad_medida && item.unidad_medida !== 'unidad' ? ` ${item.unidad_medida}` : '';
            lineas.push(`  • ${item.cantidad}${unidadStr} ${item.producto_nombre} (${moneda} ${item.precio_unitario.toFixed(2)} c/u) = *${moneda} ${item.subtotal.toFixed(2)}*`);
          });
        }
      });
      lineas.push('');
    } else if (ventas.length === 0) {
      lineas.push(`📝 *Detalle:* Saldo deudor registrado en la libreta de cuentas de la pulpería.\n`);
    }

    // Detalle de abonos recientes
    if (includeAbonos && abonos.length > 0) {
      lineas.push(`💵 *ÚLTIMOS ABONOS REGISTRADOS:*`);
      abonos.slice(0, 3).forEach((ab) => {
        const fecha = ab.fecha_hora ? ab.fecha_hora.split(' ')[0] : '';
        lineas.push(`  ✓ ${fecha}: -${moneda} ${ab.monto.toFixed(2)} (${ab.descripcion})`);
      });
      lineas.push('');
    }

    // Resumen financiero
    lineas.push(`💰 *RESUMEN DE CUENTA:*`);
    const totalComprasCredito = ventas.reduce((acc, v) => acc + v.total, 0);
    const totalAbonos = abonos.reduce((acc, a) => acc + a.monto, 0);

    if (totalComprasCredito > 0) {
      lineas.push(`• Total facturado en crédito: ${moneda} ${totalComprasCredito.toFixed(2)}`);
    }
    if (totalAbonos > 0) {
      lineas.push(`• Total abonos aplicados: ${moneda} ${totalAbonos.toFixed(2)}`);
    }
    lineas.push(`🔴 *TOTAL SALDO PENDIENTE: ${moneda} ${cliente.saldo_actual.toFixed(2)}*`);

    if (cliente.limite_credito > 0) {
      const disponible = Math.max(0, cliente.limite_credito - cliente.saldo_actual);
      lineas.push(`💳 Límite de crédito disponible: ${moneda} ${disponible.toFixed(2)}`);
    }

    // Nota opcional
    if (customNote.trim()) {
      lineas.push(`\n📌 *Nota:* ${customNote.trim()}`);
    }

    lineas.push(`\n🙏 ¡Agradecemos su preferencia y puntualidad!`);
    lineas.push(`Si tiene alguna consulta o desea pasar abonando a su cuenta, estamos a su orden.`);
    if (config.telefono) {
      lineas.push(`📞 Contacto / Pulpería: ${config.telefono}`);
    }

    return lineas.join('\n');
  }, [cliente, ventas, abonos, config, includeProducts, includeAbonos, customNote]);

  if (!isOpen) return null;

  // Copiar texto al portapapeles
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  // Abrir WhatsApp Web o App
  const handleOpenWhatsApp = () => {
    if (!fullPhoneNumber) {
      alert('Por favor ingrese un número de teléfono válido para enviar por WhatsApp.');
      return;
    }
    const url = `https://wa.me/${fullPhoneNumber}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
  };

  // Contar productos totales
  const totalArticulos = ventas.reduce((acc, v) => {
    return acc + (v.items ? v.items.reduce((s, it) => s + it.cantidad, 0) : 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* ENCABEZADO MODAL */}
        <div className="bg-[#075E54] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-md">
              <MessageSquare className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white flex items-center gap-2">
                <span>Enviar Cuenta y Productos por WhatsApp</span>
              </h3>
              <p className="text-xs text-emerald-100">
                Cliente: <span className="font-bold text-white">{cliente.nombre}</span> • Deuda: <span className="font-black font-mono text-emerald-200">{config.moneda_simbolo} {cliente.saldo_actual.toFixed(2)}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENIDO SCROLLABLE */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          
          {/* CONFIGURACIÓN DE DESTINATARIO */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Número de WhatsApp del Cliente
            </label>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Selector de país */}
              <select
                value={selectedCountryCode}
                onChange={(e) => setSelectedCountryCode(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>

              {/* Input del teléfono */}
              <div className="relative flex-1">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="Número (ej. 8888-1234)"
                  value={phoneDigits}
                  onChange={(e) => setPhoneDigits(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-mono font-bold text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Destino internacional: <strong className="font-mono text-emerald-800">+{fullPhoneNumber || 'Sin número'}</strong></span>
              <span className="text-slate-400">{ventas.length} compras ({totalArticulos} artículos)</span>
            </div>
          </div>

          {/* OPCIONES DEL MENSAJE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={includeProducts}
                onChange={(e) => setIncludeProducts(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-xs font-semibold text-slate-700">
                Incluir lista detallada de productos ({totalArticulos} arts.)
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={includeAbonos}
                onChange={(e) => setIncludeAbonos(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-xs font-semibold text-slate-700">
                Incluir historial de abonos ({abonos.length} reg.)
              </span>
            </label>
          </div>

          {/* NOTA PERSONALIZADA ADICIONAL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
              <span>Nota o recordatorio personalizado (opcional):</span>
            </label>
            <input
              type="text"
              placeholder="Ej. Favor pasar cancelando el viernes por la tarde, ¡muchas gracias!"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-500"
            />
          </div>

          {/* VISTA PREVIA DEL MENSAJE ESTILO WHATSAPP */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>Vista Previa del Mensaje</span>
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-[#EFEAE2] p-3 sm:p-4 rounded-2xl border border-slate-300 max-h-60 overflow-y-auto">
              <div className="bg-white rounded-xl p-3.5 shadow-sm text-xs font-sans text-slate-800 whitespace-pre-wrap leading-relaxed border-l-4 border-[#25D366]">
                {messageText}
              </div>
            </div>
          </div>

        </div>

        {/* PIE Y BOTONES DE ACCIÓN */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            Se abrirá WhatsApp con el mensaje listo para enviar con un solo clic.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>ABRIR EN WHATSAPP</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
