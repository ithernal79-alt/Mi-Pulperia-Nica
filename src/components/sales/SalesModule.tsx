import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Mic, 
  MicOff, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle, 
  CreditCard, 
  Banknote, 
  Sparkles, 
  Barcode, 
  UserCheck, 
  AlertCircle,
  Volume2,
  X,
  RotateCcw,
  Package
} from 'lucide-react';
import { Producto, Cliente, CartItem, Venta, ConfiguracionPulperia } from '../../types';
import { parseVoiceOrder } from '../../services/voiceParser';
import { audioSpeech } from '../../services/audioSpeech';
import { db } from '../../services/db';
import { LiveClock } from '../common/LiveClock';
import { LISTA_CATEGORIAS, CATEGORIA_COLORS } from '../../data/listaProductos';

interface SalesModuleProps {
  productos: Producto[];
  clientes: Cliente[];
  config: ConfiguracionPulperia;
  initialCategory?: string;
  onVentaCompletada: (venta: Venta) => void;
  audioEnabled: boolean;
}

export const SalesModule: React.FC<SalesModuleProps> = ({
  productos,
  clientes,
  config,
  initialCategory,
  onVentaCompletada,
  audioEnabled,
}) => {
  // Estado del Carrito
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'Todos');

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  // Estado de Pago y Cobro
  const [paymentType, setPaymentType] = useState<'contado' | 'credito'>('contado');
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [cashGiven, setCashGiven] = useState<string>('');
  
  // Estado de Voz (Bomba de Voz)
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const [voiceParsedSuggestions, setVoiceParsedSuggestions] = useState<any[]>([]);

  // Categorías de productos completas (26 oficiales + personalizadas)
  const categories = useMemo(() => {
    const fromProds = productos.map((p) => p.categoria).filter(Boolean);
    const combined = Array.from(new Set([...LISTA_CATEGORIAS, ...fromProds])).sort();
    return ['Todos', 'Frecuentes', ...combined];
  }, [productos]);

  // Frases de prueba para pulsar con 1 clic (ideal si no hay micrófono disponible)
  const quickVoicePhrases = [
    "Dos tarros de leche y una libra de arroz",
    "Tres cocacolas y dos bolsas de churros",
    "Un pan molde y media libra de queso",
    "5 huevos y un aceite vegetal",
    "Un carton de huevos y dos azucares",
    "Al fiado de Don Juan dos tarros de leche",
  ];

  // Filtrar productos
  const filteredProducts = productos.filter((prod) => {
    const matchesSearch = 
      prod.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.codigo_barras.includes(searchQuery) ||
      prod.categoria.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (selectedCategory === 'Todos') return true;
    if (selectedCategory === 'Frecuentes') return prod.es_frecuente;
    return prod.categoria.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  // Totales
  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const total = subtotal;
  const cashNum = parseFloat(cashGiven) || 0;
  const vuelto = Math.max(0, cashNum - total);
  const faltaPagar = Math.max(0, total - cashNum);

  // Cliente seleccionado para crédito
  const selectedCliente = clientes.find(c => c.id === selectedClienteId);
  const nuevoSaldoCliente = selectedCliente ? selectedCliente.saldo_actual + total : 0;
  const superaLimite = selectedCliente ? nuevoSaldoCliente > selectedCliente.limite_credito : false;

  // Funciones de Carrito
  const addToCart = (producto: Producto, cantidadToAdd = 1) => {
    if (producto.stock_actual <= 0) {
      if (audioEnabled) audioSpeech.playAlertSound();
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.producto.id === producto.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        const newQty = updated[existingIndex].cantidad + cantidadToAdd;
        // Limitar a stock disponible
        const clampedQty = Math.min(newQty, producto.stock_actual);
        updated[existingIndex] = {
          ...updated[existingIndex],
          cantidad: clampedQty,
          subtotal: Number((clampedQty * producto.precio_venta).toFixed(2)),
        };
        return updated;
      } else {
        const clampedQty = Math.min(cantidadToAdd, producto.stock_actual);
        return [
          ...prev,
          {
            producto,
            cantidad: clampedQty,
            subtotal: Number((clampedQty * producto.precio_venta).toFixed(2)),
          },
        ];
      }
    });

    if (audioEnabled) audioSpeech.playBeep(950, 0.05);
  };

  const updateQuantity = (productoId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productoId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.producto.id === productoId) {
          const clamped = Math.min(newQty, item.producto.stock_actual);
          return {
            ...item,
            cantidad: clamped,
            subtotal: Number((clamped * item.producto.precio_venta).toFixed(2)),
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productoId: string) => {
    setCart((prev) => prev.filter((item) => item.producto.id !== productoId));
    if (audioEnabled) audioSpeech.playBeep(400, 0.04);
  };

  const clearCart = () => {
    setCart([]);
    setCashGiven('');
    setVoiceParsedSuggestions([]);
  };

  // Procesar Frase de Voz (ya sea del micro o de un botón rápido)
  const processVoiceText = (text: string) => {
    setVoiceTranscript(text);
    const parsed = parseVoiceOrder(text, productos);

    if (parsed.clienteTarget) {
      // Buscar cliente coincidente
      const foundClient = clientes.find(c => 
        c.nombre.toLowerCase().includes(parsed.clienteTarget!.toLowerCase())
      );
      if (foundClient) {
        setPaymentType('credito');
        setSelectedClienteId(foundClient.id);
      }
    }

    if (parsed.items.length > 0) {
      setVoiceParsedSuggestions(parsed.items);
      
      // Auto-agregar productos reconocidos con alta confianza
      let addedNames: string[] = [];
      parsed.items.forEach((item) => {
        if (item.producto) {
          addToCart(item.producto, item.cantidad);
          addedNames.push(`${item.cantidad} ${item.producto.nombre}`);
        }
      });

      if (addedNames.length > 0) {
        setVoiceStatus(`Agregado: ${addedNames.join(', ')}`);
        if (audioEnabled) {
          audioSpeech.playSuccessSound();
          audioSpeech.speak(`Agregado ${addedNames.join(', ')}`);
        }
      } else {
        setVoiceStatus('No se reconoció ningún producto del inventario en la frase.');
        if (audioEnabled) audioSpeech.playAlertSound();
      }
    } else {
      setVoiceStatus('No se identificaron productos.');
    }
  };

  // Iniciar / Detener Reconocimiento de Voz
  const toggleVoiceListening = () => {
    if (isListening) {
      audioSpeech.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setVoiceStatus('Escuchando... Hable ahora (ej: "Dos tarros de leche y una libra de arroz")');
    setVoiceTranscript('');

    const started = audioSpeech.startListening(
      (text, isFinal) => {
        setVoiceTranscript(text);
        if (isFinal) {
          processVoiceText(text);
          setIsListening(false);
        }
      },
      (err) => {
        setVoiceStatus(`Aviso: ${err}. Puedes usar los botones de voz rápida abajo.`);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (!started) {
      setIsListening(false);
    }
  };

  // Lector de código de barras manual
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const found = db.getProductoByBarcode(searchQuery.trim());
    if (found) {
      addToCart(found, 1);
      setSearchQuery('');
      if (audioEnabled) audioSpeech.playBeep(1200, 0.08);
    }
  };

  // Manejar Cobro y Finalización de Venta
  const handleCompleteSale = () => {
    if (cart.length === 0) return;

    if (paymentType === 'credito' && !selectedClienteId) {
      alert('Por favor seleccione el cliente para la venta al fiado.');
      return;
    }

    const venta = db.registrarVenta(
      paymentType,
      cart,
      total,
      paymentType === 'contado' ? (cashNum || total) : 0,
      paymentType === 'contado' ? vuelto : 0,
      paymentType === 'credito' ? selectedClienteId : null
    );

    if (audioEnabled) {
      audioSpeech.playSuccessSound();
      if (paymentType === 'contado' && vuelto > 0) {
        audioSpeech.speak(`Venta realizada. Vuelto ${config.moneda_simbolo} ${vuelto.toFixed(0)}`);
      } else {
        audioSpeech.speak(`Venta registrada`);
      }
    }

    // Limpiar carrito y disparar modal de ticket
    clearCart();
    onVentaCompletada(venta);
  };

  return (
    <div className="space-y-4">
      {/* ========================================================
          1. BOMBA DE VOZ INTERACTIVA (Top Banner)
      ======================================================== */}
      <section className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-4 sm:p-5 shadow-lg shadow-emerald-600/15 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Micrófono Principal (Bomba de Voz) */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={toggleVoiceListening}
              className={`relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full font-bold transition-all shadow-xl select-none shrink-0 ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/40 ring-4 ring-rose-300 scale-105'
                  : 'bg-white hover:bg-emerald-50 text-emerald-700 shadow-lg hover:scale-105 active:scale-95'
              }`}
              title="Bomba de Voz: Presiona y habla para agregar productos al instante"
            >
              {isListening ? (
                <Mic className="w-7 h-7 sm:w-8 sm:h-8 animate-bounce" />
              ) : (
                <Mic className="w-7 h-7 sm:w-8 sm:h-8" />
              )}
              {isListening && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600"></span>
                </span>
              )}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base sm:text-lg flex items-center gap-1.5">
                  <span>Bomba de Voz</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black bg-white/20 text-white backdrop-blur-xs">
                    Voz a Carrito
                  </span>
                </h3>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                {isListening ? (
                  <span className="text-white font-bold animate-pulse">
                    ● Grabando en vivo... Diga los productos y cantidades
                  </span>
                ) : (
                  <span>
                    Presiona el micrófono y pide: <strong>"Dos tarros de leche y una libra de arroz"</strong>
                  </span>
                )}
              </p>
              {voiceTranscript && (
                <div className="mt-1.5 text-xs text-emerald-900 bg-emerald-100/90 px-3 py-1 rounded-lg font-mono font-medium shadow-xs">
                  🗣️ "{voiceTranscript}"
                </div>
              )}
            </div>
          </div>

          {/* Quick Voice Simulation Buttons (Ideal para pruebas instantáneas) */}
          <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-emerald-500/40 pt-2.5 md:pt-0 md:pl-4">
            <span className="text-[11px] font-bold text-emerald-100 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              Prueba rápida con 1 clic (Voz simulada):
            </span>
            <div className="flex flex-wrap gap-1.5 max-w-xl">
              {quickVoicePhrases.slice(0, 3).map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => processVoiceText(phrase)}
                  className="text-xs bg-emerald-700/60 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl border border-emerald-500/30 transition-all text-left truncate max-w-[200px] sm:max-w-none shadow-xs font-medium"
                  title={`Cargar orden: "${phrase}"`}
                >
                  💬 "{phrase}"
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Feedback Alert if any */}
        {voiceStatus && (
          <div className="mt-3 text-xs bg-emerald-900/80 border border-emerald-500/40 p-2.5 rounded-xl text-white flex items-center justify-between">
            <span>{voiceStatus}</span>
            <button onClick={() => setVoiceStatus(null)} className="text-emerald-200 hover:text-white p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* ========================================================
          2. SECCIÓN PRINCIPAL: BOTONERA TÁCTIL + CARRITO
      ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* COLUMNA IZQUIERDA: CATÁLOGO TÁCTIL Y BUSCADOR (7/12) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          
          {/* Buscador & Scanner Bar */}
          <div className="flex items-center gap-2">
            <form onSubmit={handleBarcodeSubmit} className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar producto o código de barras..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Selector desplegable directo de categorías */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filtrar por categoría"
              className="bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-2.5 py-2.5 text-xs text-slate-800 font-semibold outline-none shadow-xs cursor-pointer max-w-[150px] sm:max-w-[200px]"
            >
              {categories.map((cat) => {
                const count = cat === 'Todos'
                  ? productos.length
                  : cat === 'Frecuentes'
                  ? productos.filter(p => p.es_frecuente).length
                  : productos.filter(p => p.categoria.toLowerCase() === cat.toLowerCase()).length;
                return (
                  <option key={cat} value={cat}>
                    {cat} ({count})
                  </option>
                );
              })}
            </select>

            <button
              onClick={() => {
                // Simular escaneo de código de barras rápido
                const random = productos[Math.floor(Math.random() * productos.length)];
                if (random) addToCart(random, 1);
              }}
              title="Simular escáner de código de barras"
              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 flex items-center gap-1.5 text-xs font-semibold shrink-0 transition-colors"
            >
              <Barcode className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Escanear</span>
            </button>
          </div>

          {/* Categorías Pills (Con conteo y todas las categorías disponibles) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 text-xs scrollbar-thin">
            {categories.map((cat) => {
              const count = cat === 'Todos'
                ? productos.length
                : cat === 'Frecuentes'
                ? productos.filter(p => p.es_frecuente).length
                : productos.filter(p => p.categoria.toLowerCase() === cat.toLowerCase()).length;
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all select-none flex items-center gap-1.5 shadow-2xs ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
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

          {/* Grid de Botones Táctiles Grandes para Productos */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  {productos.length === 0 ? 'Inventario listo para ingresar información' : 'No se encontraron productos'}
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                  {productos.length === 0 
                    ? 'Aún no hay productos registrados. Ve al módulo de Inventario para agregar tus artículos con sus precios y stock.'
                    : 'Intenta con otro término de búsqueda o selecciona otra categoría.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 max-h-[500px] overflow-y-auto p-1 pr-1.5 scrollbar-thin scrollbar-thumb-slate-200">
              {filteredProducts.map((producto) => {
                const inCartItem = cart.find(c => c.producto.id === producto.id);
                const isLowStock = producto.stock_actual <= producto.stock_minimo;
                const isOutOfStock = producto.stock_actual <= 0;

                return (
                  <button
                    key={producto.id}
                    onClick={() => addToCart(producto, 1)}
                    disabled={isOutOfStock}
                    style={{ borderLeftColor: producto.color_tag || '#10B981' }}
                    className={`group relative text-left p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/90 active:scale-[0.98] transition-all flex flex-col justify-between min-h-[125px] border-l-4 shadow-xs select-none ${
                      isOutOfStock ? 'opacity-40 cursor-not-allowed bg-slate-50' : ''
                    } ${inCartItem ? 'ring-2 ring-emerald-500 bg-emerald-50/40 border-slate-300' : ''}`}
                  >
                    <div>
                      {/* Header del producto (Categoría, Unidad & Badges) */}
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span 
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded truncate max-w-[85px] sm:max-w-[120px]"
                          style={{
                            backgroundColor: `${producto.color_tag || '#10B981'}15`,
                            color: producto.color_tag || '#065F46',
                          }}
                          title={`Categoría: ${producto.categoria}`}
                        >
                          {producto.categoria}
                        </span>
                        
                        {isOutOfStock ? (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                            Agotado
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Stock: {producto.stock_actual}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-medium">
                            {producto.unidad_medida}
                          </span>
                        )}
                      </div>

                      {/* Nombre */}
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-tight">
                        {producto.nombre}
                      </h4>
                    </div>

                    {/* Precio & Cantidad en Carrito */}
                    <div className="flex items-end justify-between mt-2 pt-2 border-t border-slate-100">
                      <span className="font-black text-sm sm:text-base text-slate-900 font-mono">
                        {config.moneda_simbolo} {producto.precio_venta.toFixed(2)}
                      </span>
                      {inCartItem ? (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-xs font-black shadow-xs">
                          x{inCartItem.cantidad}
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

        </div>

        {/* COLUMNA DERECHA: CARRITO & COBRO RÁPIDO (5/12) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-4">
          
          {/* Header Carrito */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base">Carrito de Venta</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {cart.reduce((a, b) => a + b.cantidad, 0)} artículos
              </span>
            </div>
            <div className="flex items-center gap-2">
              <LiveClock compact={true} showSeconds={false} className="hidden sm:inline-flex" />
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Vaciar
                </button>
              )}
            </div>
          </div>

          {/* Lista de Items en Carrito */}
          <div className="flex-1 overflow-y-auto max-h-[260px] space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
            {cart.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center p-4 text-slate-400">
                <Mic className="w-8 h-8 text-emerald-600 mb-2 animate-bounce opacity-80" />
                <p className="text-sm font-semibold text-slate-700">Carrito vacío</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Usa la <strong>Bomba de Voz</strong> o toca los productos frecuentes para vender.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.producto.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {item.producto.nombre}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {config.moneda_simbolo} {item.producto.precio_venta.toFixed(2)} x {item.cantidad} {item.producto.unidad_medida}
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
                    <button
                      onClick={() => updateQuantity(item.producto.id, item.cantidad - 1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-black text-slate-900 font-mono">
                      {item.cantidad}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.producto.id, item.cantidad + 1)}
                      disabled={item.cantidad >= item.producto.stock_actual}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 disabled:opacity-30"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Subtotal Item */}
                  <div className="text-right min-w-[65px]">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono block">
                      {config.moneda_simbolo} {item.subtotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Delete Item */}
                  <button
                    onClick={() => removeFromCart(item.producto.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* ========================================================
              3. PANEL DE COBRO (Contado vs Fiado + Vuelto)
          ======================================================== */}
          <div className="border-t border-slate-200 pt-3 space-y-3">
            
            {/* Total Display */}
            <div className="flex items-baseline justify-between bg-slate-900 text-white p-3.5 rounded-xl shadow-sm">
              <span className="text-xs uppercase font-bold text-slate-300 tracking-wider">
                Total a Cobrar:
              </span>
              <span className="text-2xl font-black text-white font-mono">
                {config.moneda_simbolo} {total.toFixed(2)}
              </span>
            </div>

            {/* Selector: Contado vs Fiado */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentType('contado')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all select-none ${
                  paymentType === 'contado'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Contado (Efectivo)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('credito')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all select-none ${
                  paymentType === 'credito'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Al Fiado (Crédito)</span>
              </button>
            </div>

            {/* CONTADO: Cálculo de Vuelto y Billetes Rápidos */}
            {paymentType === 'contado' && (
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs text-slate-700 font-semibold">Paga con efectivo:</label>
                  <div className="relative w-36">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono font-bold">
                      {config.moneda_simbolo}
                    </span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={cashGiven}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setCashGiven(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-7 pr-2 py-1.5 text-right font-mono font-bold text-sm text-slate-900 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Botones de billetes rápidos */}
                <div className="flex items-center gap-1.5 justify-end">
                  <button
                    onClick={() => setCashGiven(total.toString())}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded border border-slate-300 transition-colors"
                  >
                    Exacto
                  </button>
                  {[20, 50, 100, 500].map((bill) => (
                    <button
                      key={bill}
                      onClick={() => setCashGiven(bill.toString())}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-mono font-bold rounded border border-slate-300 transition-colors"
                    >
                      +{bill}
                    </button>
                  ))}
                </div>

                {/* Resumen de Vuelto */}
                {cashNum > 0 && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-xs text-slate-600 font-medium">Vuelto al cliente:</span>
                    <span className={`text-base font-black font-mono ${cashNum >= total ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {cashNum >= total ? (
                        `${config.moneda_simbolo} ${vuelto.toFixed(2)}`
                      ) : (
                        `Faltan ${config.moneda_simbolo} ${faltaPagar.toFixed(2)}`
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* CRÉDITO / FIADO: Selección de Cliente y Comprobación de Límite */}
            {paymentType === 'credito' && (
              <div className="space-y-2 bg-blue-50/70 p-3 rounded-xl border border-blue-200">
                <label className="text-xs text-blue-900 font-semibold block">
                  Seleccionar Cliente de la libreta de fiados:
                </label>
                <select
                  value={selectedClienteId}
                  onChange={(e) => setSelectedClienteId(e.target.value)}
                  className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-500 outline-none"
                >
                  <option value="">-- Seleccionar cliente --</option>
                  {clientes.map((cli) => (
                    <option key={cli.id} value={cli.id}>
                      {cli.nombre} (Debe: {config.moneda_simbolo}{cli.saldo_actual.toFixed(2)} / Límite: {config.moneda_simbolo}{cli.limite_credito.toFixed(2)})
                    </option>
                  ))}
                </select>

                {selectedCliente && (
                  <div className="text-xs space-y-1 pt-1 text-slate-700">
                    <div className="flex justify-between">
                      <span>Deuda previa:</span>
                      <span className="font-mono text-slate-900 font-bold">{config.moneda_simbolo} {selectedCliente.saldo_actual.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-blue-900">
                      <span>Nuevo saldo con esta venta:</span>
                      <span className="font-mono">{config.moneda_simbolo} {nuevoSaldoCliente.toFixed(2)}</span>
                    </div>
                    {superaLimite && (
                      <div className="p-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded text-[11px] font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                        ¡Atención! Supera el límite de {config.moneda_simbolo}{selectedCliente.limite_credito.toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* BOTÓN FINAL DE REGISTRO */}
            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || (paymentType === 'credito' && !selectedClienteId)}
              className="w-full py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-md select-none disabled:opacity-40 disabled:cursor-not-allowed bg-slate-900 hover:bg-slate-800 text-white active:scale-[0.99]"
            >
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span>CONFIRMAR VENTA Y DESCONTAR STOCK</span>
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};
