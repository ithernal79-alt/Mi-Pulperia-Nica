import React, { useState, useEffect } from 'react';
import { Mic, MicOff, X, Sparkles, CheckCircle2, Package, ArrowRight, WifiOff, HelpCircle, Tag, Plus } from 'lucide-react';
import { Producto } from '../../types';
import { audioSpeech } from '../../services/audioSpeech';
import { parseInventoryVoiceCommand, InventoryVoiceCommand } from '../../services/inventoryVoiceParser';
import { db } from '../../services/db';

interface InventoryVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  productos: Producto[];
  onRefresh: () => void;
  onOpenNewProductWithData?: (data: Partial<Producto>) => void;
  audioEnabled?: boolean;
}

export const InventoryVoiceModal: React.FC<InventoryVoiceModalProps> = ({
  isOpen,
  onClose,
  productos,
  onRefresh,
  onOpenNewProductWithData,
  audioEnabled = true,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedCommand, setParsedCommand] = useState<InventoryVoiceCommand | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isNetworkOffline, setIsNetworkOffline] = useState(!audioSpeech.isOnline());
  const [showOfflineGuide, setShowOfflineGuide] = useState(false);
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  const samplePhrases = [
    "Llegaron 24 Coca Cola medio litro",
    "50 libras de Frijol rojo a costo 28",
    "Sumar 12 a Leche Eskimo",
    "Nuevo producto Café Presto precio 25 costo 19 stock 30",
    "Aceite Corona llegaron 15 unidades",
  ];

  useEffect(() => {
    const handleOnline = () => setIsNetworkOffline(false);
    const handleOffline = () => setIsNetworkOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      audioSpeech.stopListening();
      setIsListening(false);
      setTranscript('');
      setParsedCommand(null);
      setStatusMessage(null);
      setAppliedFeedback(null);
    }
  }, [isOpen]);

  const handleStartListening = () => {
    if (isListening) {
      audioSpeech.stopListening();
      setIsListening(false);
      return;
    }

    setTranscript('');
    setParsedCommand(null);
    setStatusMessage('Escuchando... Hable claro (ej. "Llegaron 24 Coca Cola medio litro")');
    setIsListening(true);

    const started = audioSpeech.startListening(
      (text, isFinal) => {
        setTranscript(text);
        if (isFinal) {
          handleProcessText(text);
          setIsListening(false);
        }
      },
      (error) => {
        setIsListening(false);
        if (error === 'SIN_INTERNET' || !audioSpeech.isOnline()) {
          setIsNetworkOffline(true);
          setStatusMessage(
            '📡 Sin conexión a internet: El micrófono web requiere red. Usa la caja de texto abajo con el micrófono de tu teclado Android (Gboard funciona sin internet).'
          );
        } else {
          setStatusMessage(`Aviso: ${error}`);
        }
      },
      () => {
        setIsListening(false);
      }
    );

    if (!started) {
      setIsListening(false);
    }
  };

  const handleProcessText = (text: string) => {
    setTranscript(text);
    if (!text.trim()) return;

    const parsed = parseInventoryVoiceCommand(text, productos);
    setParsedCommand(parsed);
    setStatusMessage(null);

    if (audioEnabled) {
      audioSpeech.playBeep(900, 0.08);
    }
  };

  const handleApplyCommand = () => {
    if (!parsedCommand) return;

    if (parsedCommand.action === 'ADD_STOCK' && parsedCommand.productoExistente) {
      const prod = parsedCommand.productoExistente;
      const nuevoStock = prod.stock_actual + parsedCommand.cantidad;
      
      db.updateProductoStock(prod.id, nuevoStock);

      // Registrar también entrada formal
      db.registrarEntradaMercancia({
        proveedor: 'Ingreso por Voz',
        numero_factura: `VOZ-${Date.now().toString().slice(-4)}`,
        producto_id: prod.id,
        producto_nombre: prod.nombre,
        cantidad_ingresada: parsedCommand.cantidad,
        costo_unitario: parsedCommand.precioCosto || prod.precio_costo,
        total_costo: parsedCommand.cantidad * (parsedCommand.precioCosto || prod.precio_costo),
        nota: `Ingreso por comando de voz: "${parsedCommand.rawText}"`,
      });

      if (audioEnabled) {
        audioSpeech.playSuccessSound();
        audioSpeech.speak(`Stock actualizado: ${parsedCommand.cantidad} unidades sumadas a ${prod.nombre}`);
      }

      setAppliedFeedback(`¡Listo! Se sumaron ${parsedCommand.cantidad} unidades a "${prod.nombre}".`);
      onRefresh();
      setTimeout(() => {
        setParsedCommand(null);
        setTranscript('');
        setAppliedFeedback(null);
      }, 2500);

    } else if (parsedCommand.action === 'NEW_PRODUCT') {
      // Si tiene callback para abrir modal con datos pre-rellenados
      if (onOpenNewProductWithData) {
        onOpenNewProductWithData({
          nombre: parsedCommand.nombreSugerido,
          categoria: parsedCommand.categoriaSugerida || 'Granos básicos',
          precio_venta: parsedCommand.precioVenta || 20,
          precio_costo: parsedCommand.precioCosto || 15,
          stock_actual: parsedCommand.cantidad || 10,
          unidad_medida: parsedCommand.unidadMedida || 'unidad',
          es_frecuente: true,
        });
        onClose();
      } else {
        // Guardar directamente
        const newId = `prod-${Date.now()}`;
        const newProduct: Producto = {
          id: newId,
          codigo_barras: `7421${Math.floor(100000 + Math.random() * 900000)}`,
          nombre: parsedCommand.nombreSugerido || 'Nuevo Producto',
          categoria: parsedCommand.categoriaSugerida || 'Granos básicos',
          precio_venta: parsedCommand.precioVenta || 20,
          precio_costo: parsedCommand.precioCosto || 15,
          stock_actual: parsedCommand.cantidad || 10,
          stock_minimo: 5,
          unidad_medida: parsedCommand.unidadMedida || 'unidad',
          es_frecuente: true,
          color_tag: '#10B981',
        };

        db.saveProducto(newProduct);
        if (audioEnabled) {
          audioSpeech.playSuccessSound();
          audioSpeech.speak(`Producto ${newProduct.nombre} guardado en el catálogo`);
        }

        setAppliedFeedback(`¡Producto "${newProduct.nombre}" creado exitosamente!`);
        onRefresh();
        setTimeout(() => {
          setParsedCommand(null);
          setTranscript('');
          setAppliedFeedback(null);
        }, 2500);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-tight flex items-center gap-2">
                <span>Ingreso Rápido por Voz</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Dictado
                </span>
              </h3>
              <p className="text-xs text-slate-500">Dicta entradas de mercancía o nuevos productos con tu voz</p>
            </div>
          </div>
          <button
            onClick={() => {
              audioSpeech.stopListening();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Banner de Estado de Red / Offline */}
          {isNetworkOffline && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5 text-xs text-amber-900">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <WifiOff className="w-4 h-4 text-amber-600" />
                  Modo Sin Conexión (Offline)
                </span>
                <button
                  type="button"
                  onClick={() => setShowOfflineGuide(!showOfflineGuide)}
                  className="text-[11px] text-amber-700 underline flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  ¿Cómo dictar sin internet?
                </button>
              </div>
              <p className="text-[11px] text-amber-800">
                El micrófono web del navegador requiere internet. Para dictar sin red, toca la caja de texto abajo y usa el <strong>icono de micrófono de tu teclado Android (Gboard)</strong>.
              </p>

              {showOfflineGuide && (
                <div className="mt-2 p-2.5 bg-white/80 rounded-xl border border-amber-200 text-[11px] text-slate-700 space-y-1">
                  <p className="font-bold text-slate-900">Cómo activar dictado sin internet en tu teléfono:</p>
                  <ol className="list-decimal pl-4 space-y-0.5">
                    <li>Ve a Ajustes ➡️ Idioma y entrada ➡️ Teclado Gboard.</li>
                    <li>Entra en "Dictado por voz".</li>
                    <li>Descarga el paquete "Reconocimiento de voz sin conexión (Español)".</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Feedback de Éxito */}
          {appliedFeedback && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{appliedFeedback}</span>
            </div>
          )}

          {/* Botón Principal del Micrófono */}
          <div className="flex flex-col items-center justify-center py-2 space-y-3">
            <button
              onClick={handleStartListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all transform active:scale-95 ${
                isListening
                  ? 'bg-red-600 text-white ring-8 ring-red-100 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-xl'
              }`}
            >
              {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
            <div className="text-center">
              <p className="text-sm font-extrabold text-slate-900">
                {isListening ? 'Escuchando... Hable ahora' : 'Presione para Dictar'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {isListening
                  ? 'Diga el producto, cantidad y si es nuevo'
                  : 'O escribe / usa el dictado del teclado en la caja'}
              </p>
            </div>
          </div>

          {/* Caja de Texto Editable (Permite dictado nativo de teclado Gboard 100% offline) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Frase escuchada o dictada (puedes editarla):
            </label>
            <div className="relative">
              <input
                type="text"
                value={transcript}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  handleProcessText(e.target.value);
                }}
                placeholder="Ej. Llegaron 24 Coca Cola medio litro..."
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white shadow-xs font-medium"
              />
            </div>
          </div>

          {statusMessage && (
            <p className="text-xs text-slate-600 bg-slate-100 p-2.5 rounded-xl">{statusMessage}</p>
          )}

          {/* Tarjeta de Acción Interpretada */}
          {parsedCommand && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                  {parsedCommand.action === 'ADD_STOCK' ? '⚡ Entrada de Stock' : '✨ Nuevo Producto'}
                </span>
                <span className="text-xs font-bold text-emerald-800">
                  Cantidad: {parsedCommand.cantidad}
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {parsedCommand.action === 'ADD_STOCK' && parsedCommand.productoExistente
                    ? parsedCommand.productoExistente.nombre
                    : parsedCommand.nombreSugerido}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  {parsedCommand.resumen}
                </p>
              </div>

              {parsedCommand.action === 'NEW_PRODUCT' && (
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-white border border-emerald-300 px-2 py-1 rounded-lg font-medium text-slate-700">
                    🏷️ Categoría: <strong>{parsedCommand.categoriaSugerida}</strong>
                  </span>
                  <span className="bg-white border border-emerald-300 px-2 py-1 rounded-lg font-medium text-slate-700">
                    💰 Venta: <strong>C$ {parsedCommand.precioVenta?.toFixed(2)}</strong>
                  </span>
                  <span className="bg-white border border-emerald-300 px-2 py-1 rounded-lg font-medium text-slate-700">
                    📦 Costo: <strong>C$ {parsedCommand.precioCosto?.toFixed(2)}</strong>
                  </span>
                </div>
              )}

              <button
                onClick={handleApplyCommand}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>CONFIRMAR E INGRESAR AL INVENTARIO</span>
              </button>
            </div>
          )}

          {/* Frases Rápidas de Prueba */}
          <div className="pt-2 border-t border-slate-200 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              O toca una frase de ejemplo para probar:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {samplePhrases.map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => handleProcessText(phrase)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl border border-slate-200 transition-colors text-left"
                >
                  "{phrase}"
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
