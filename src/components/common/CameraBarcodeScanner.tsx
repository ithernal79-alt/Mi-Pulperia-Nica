import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import {
  Camera,
  X,
  RotateCw,
  Flashlight,
  Plus,
  CheckCircle2,
  AlertCircle,
  Search,
  Package,
  Upload,
  Link,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Producto } from '../../types';
import { audioSpeech } from '../../services/audioSpeech';
import { db } from '../../services/db';

interface CameraBarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  productos: Producto[];
  mode?: 'sales' | 'inventory';
  onProductScanned?: (producto: Producto, cantidad?: number) => void;
  onNewBarcodeScanned?: (barcode: string) => void;
  onBarcodeLinked?: (producto: Producto) => void;
  title?: string;
  subtitle?: string;
}

export const CameraBarcodeScanner: React.FC<CameraBarcodeScannerProps> = ({
  isOpen,
  onClose,
  productos,
  mode = 'inventory',
  onProductScanned,
  onNewBarcodeScanned,
  onBarcodeLinked,
  title,
  subtitle,
}) => {
  const [scannerActive, setScannerActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [scannedResult, setScannedResult] = useState<{
    code: string;
    producto?: Producto;
    timestamp: number;
  } | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);
  const [sessionScannedCount, setSessionScannedCount] = useState(0);

  // Estado para vincular código a producto existente
  const [isLinking, setIsLinking] = useState(false);
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const [customAddQty, setCustomAddQty] = useState('1');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<{ code: string; time: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerId = 'barcode-scanner-viewport';

  const defaultTitle = mode === 'sales' ? 'Escanear para Venta' : 'Escanear Código de Barras';
  const defaultSubtitle =
    mode === 'sales'
      ? 'Apunta la cámara al código. Se agregará de inmediato al carrito.'
      : 'Apunta la cámara al código de barras del producto.';

  // 1. INICIALIZAR Y CONTROLAR CÁMARA
  useEffect(() => {
    let isMounted = true;

    if (!isOpen) {
      stopScanner();
      setScannedResult(null);
      setAddedFeedback(null);
      setIsLinking(false);
      setSessionScannedCount(0);
      return;
    }

    // Esperar a que el modal y el contenedor estén en el DOM
    const timer = setTimeout(() => {
      if (isMounted) {
        initScanner();
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  // Detener escáner con seguridad
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error deteniendo escáner:', err);
      }
      scannerRef.current = null;
    }
    setScannerActive(false);
    setIsInitializing(false);
    setTorchOn(false);
  };

  // Iniciar escáner con reintentos automáticos
  const initScanner = async () => {
    const element = document.getElementById(containerId);
    if (!element) {
      console.warn('Contenedor de escáner aún no listo');
      return;
    }

    setIsInitializing(true);
    setErrorMessage(null);

    try {
      await stopScanner();

      const html5QrCode = new Html5Qrcode(containerId, {
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      // Obtener lista de cámaras para selector
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices.map((d) => ({ id: d.id, label: d.label || 'Cámara' })));
        }
      } catch (e) {
        console.warn('No se pudieron listar cámaras previamente:', e);
      }

      // Configuración de escaneo (óptima para códigos 1D y 2D en retail)
      const config = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          // Marco horizontal amplio para códigos de barras alargados (EAN-13, UPC)
          const width = Math.min(Math.floor(viewfinderWidth * 0.88), 340);
          const height = Math.min(Math.floor(viewfinderHeight * 0.55), 200);
          return { width, height };
        },
        aspectRatio: 1.333333,
      };

      // Intentar primero con cámara trasera (environment)
      try {
        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => handleBarcodeDetected(decodedText.trim()),
          () => {
            // Frame sin lectura (normal)
          }
        );
        setCurrentCameraId('environment');
        setScannerActive(true);
      } catch (backCamError) {
        console.warn('Fallo cámara trasera, intentando con cámara disponible...', backCamError);

        // Fallback: cámara frontal o primera cámara disponible
        await html5QrCode.start(
          { facingMode: 'user' },
          config,
          (decodedText) => handleBarcodeDetected(decodedText.trim()),
          () => {}
        );
        setCurrentCameraId('user');
        setScannerActive(true);
      }
    } catch (err: any) {
      console.error('Error definitivo al iniciar cámara:', err);
      setScannerActive(false);

      const msg = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
        ? 'Permiso de cámara denegado. Revisa los permisos de tu navegador o usa el botón para subir foto del código.'
        : err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError'
        ? 'No se detectó cámara en este dispositivo. Puedes subir una foto o escribir el código.'
        : 'No se pudo activar la cámara. Puedes subir una foto o ingresar el código manualmente.';

      setErrorMessage(msg);
    } finally {
      setIsInitializing(false);
    }
  };

  // Buscar producto por código de barras (con tolerancia a ceros a la izquierda)
  const findProductByCode = (code: string): Producto | undefined => {
    const cleanCode = code.trim().toLowerCase();
    const withoutLeadingZeros = cleanCode.replace(/^0+/, '');

    return productos.find((p) => {
      const pCode = p.codigo_barras.trim().toLowerCase();
      const pWithoutZeros = pCode.replace(/^0+/, '');
      return (
        pCode === cleanCode ||
        (withoutLeadingZeros.length >= 6 && pWithoutZeros === withoutLeadingZeros) ||
        pCode.includes(cleanCode) ||
        cleanCode.includes(pCode)
      );
    });
  };

  // 2. PROCESAR CÓDIGO DETECTADO
  const handleBarcodeDetected = (code: string) => {
    if (!code) return;

    // Evitar lecturas duplicadas continuas en ráfaga (cooldown de 1.8 segundos para el mismo código)
    const now = Date.now();
    if (lastScanRef.current && lastScanRef.current.code === code && now - lastScanRef.current.time < 1800) {
      return;
    }
    lastScanRef.current = { code, time: now };

    const found = findProductByCode(code);

    if (found) {
      // PRODUCTO ENCONTRADO
      audioSpeech.playSuccessSound();

      if (mode === 'sales') {
        // EN MODO VENTA: AGREGAR DIRECTAMENTE AL CARRITO
        if (onProductScanned) {
          onProductScanned(found, 1);
        }
        setSessionScannedCount((prev) => prev + 1);
        setAddedFeedback(`✅ ¡Agregado! ${found.nombre} (C$ ${found.precio_venta.toFixed(2)})`);
        audioSpeech.speak(`${found.nombre}`);

        setScannedResult({
          code,
          producto: found,
          timestamp: now,
        });

        // Limpiar feedback tras 3.5 segundos para seguir escaneando
        setTimeout(() => {
          setAddedFeedback(null);
        }, 3500);
      } else {
        // EN MODO INVENTARIO: MOSTRAR RESULTADO Y PREPARAR ACCIONES
        audioSpeech.speak(found.nombre);
        setScannedResult({
          code,
          producto: found,
          timestamp: now,
        });
      }
    } else {
      // PRODUCTO NO RECONOCIDO EN CATÁLOGO
      audioSpeech.playAlertSound();
      setScannedResult({
        code,
        producto: undefined,
        timestamp: now,
      });
      setIsLinking(false);
    }
  };

  // 3. ESCANEAR ARCHIVO / FOTO DESDE GALERÍA O CÁMARA
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMessage(null);
      setAddedFeedback('Procesando foto...');

      // Crear instancia temporal o usar la existente para escanear imagen
      let scanner = scannerRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode(containerId, { verbose: false });
        scannerRef.current = scanner;
      }

      const decodedText = await scanner.scanFile(file, true);
      setAddedFeedback(null);
      handleBarcodeDetected(decodedText.trim());
    } catch (err: any) {
      setAddedFeedback(null);
      audioSpeech.playAlertSound();
      setErrorMessage('No se encontró ningún código de barras en esa imagen. Asegúrate que la foto sea nítida y tenga buena luz.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 4. CAMBIAR DE CÁMARA (TRASERA / FRONTAL)
  const handleSwitchCamera = async () => {
    if (!scannerRef.current || isInitializing) return;

    try {
      setIsInitializing(true);
      await stopScanner();

      const nextMode = currentCameraId === 'environment' ? 'user' : 'environment';
      const html5QrCode = new Html5Qrcode(containerId, {
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: nextMode },
        {
          fps: 15,
          qrbox: (w: number, h: number) => ({
            width: Math.min(Math.floor(w * 0.88), 340),
            height: Math.min(Math.floor(h * 0.55), 200),
          }),
        },
        (decodedText) => handleBarcodeDetected(decodedText.trim()),
        () => {}
      );
      setCurrentCameraId(nextMode);
      setScannerActive(true);
    } catch (err) {
      console.warn('Error alternando cámara:', err);
      // Reintentar volver a la cámara previa
      initScanner();
    } finally {
      setIsInitializing(false);
    }
  };

  // 5. ENCENDER / APAGAR LINTERNA
  const handleToggleTorch = async () => {
    if (scannerRef.current && scannerActive) {
      try {
        // @ts-ignore
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ torch: !torchOn }],
        });
        setTorchOn(!torchOn);
      } catch (e) {
        console.warn('Linterna no soportada por el dispositivo');
      }
    }
  };

  // 6. SUMAR STOCK EN MODO INVENTARIO
  const handleAddStock = (cantidad: number) => {
    if (!scannedResult?.producto) return;
    const prod = scannedResult.producto;

    if (onProductScanned) {
      onProductScanned(prod, cantidad);
    }

    setAddedFeedback(`✅ Sumadas ${cantidad} unidades a ${prod.nombre}`);
    audioSpeech.playSuccessSound();

    setTimeout(() => {
      setAddedFeedback(null);
      setScannedResult(null);
    }, 2500);
  };

  // 7. VINCULAR CÓDIGO ESCANEADO A UN PRODUCTO EXISTENTE
  const handleLinkToProduct = (prod: Producto) => {
    if (!scannedResult?.code) return;

    const updated = db.assignBarcodeToProduct(prod.id, scannedResult.code);
    if (updated) {
      audioSpeech.playSuccessSound();
      audioSpeech.speak(`Código vinculado a ${updated.nombre}`);

      if (onBarcodeLinked) {
        onBarcodeLinked(updated);
      }

      if (mode === 'sales' && onProductScanned) {
        onProductScanned(updated, 1);
        setSessionScannedCount((prev) => prev + 1);
      }

      setAddedFeedback(`✅ Código ${scannedResult.code} vinculado con éxito a "${updated.nombre}"`);
      setIsLinking(false);
      setScannedResult({
        code: scannedResult.code,
        producto: updated,
        timestamp: Date.now(),
      });

      setTimeout(() => {
        setAddedFeedback(null);
      }, 3000);
    }
  };

  // Filtro de productos para vinculación
  const linkingFilteredProducts = productos
    .filter((p) => {
      if (!linkSearchQuery.trim()) return false;
      const q = linkSearchQuery.toLowerCase();
      return p.nombre.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q);
    })
    .slice(0, 8);

  // 8. BÚSQUEDA MANUAL POR CÓDIGO
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleBarcodeDetected(manualCode.trim());
    setManualCode('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center shadow-xs ${
                mode === 'sales' ? 'bg-emerald-600' : 'bg-purple-600'
              }`}
            >
              {mode === 'sales' ? <ShoppingBag className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                  {title || defaultTitle}
                </h3>
                {mode === 'sales' && sessionScannedCount > 0 && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
                    {sessionScannedCount} en carrito
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                {subtitle || defaultSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            title="Cerrar escáner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport de la Cámara */}
        <div className="relative bg-slate-950 flex flex-col items-center justify-center min-h-[250px] sm:min-h-[290px] overflow-hidden select-none shrink-0">
          
          {/* Elemento que contiene el video del escáner */}
          <div
            id={containerId}
            className="w-full max-w-md h-full flex items-center justify-center overflow-hidden"
          />

          {/* Estado Cargando */}
          {isInitializing && (
            <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2 text-white z-10">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs font-semibold text-slate-300">Activando cámara...</p>
            </div>
          )}

          {/* Mira o marco visual de escaneo */}
          {scannerActive && !errorMessage && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
              <div className="relative w-64 sm:w-72 h-32 sm:h-36 border-2 border-emerald-400 rounded-2xl shadow-[0_0_15px_rgba(52,211,153,0.3)] flex items-center justify-center">
                {/* Línea láser animada */}
                <div className="absolute left-2 right-2 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
                
                {/* Esquinas decorativas */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl-sm" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr-sm" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl-sm" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br-sm" />

                <span className="text-[10px] font-black text-white bg-slate-900/90 px-2.5 py-0.5 rounded-full border border-white/20 tracking-wider uppercase backdrop-blur-xs">
                  Centra el código de barras
                </span>
              </div>
            </div>
          )}

          {/* Alerta de Error / Permiso */}
          {errorMessage && (
            <div className="absolute inset-0 bg-slate-950 p-4 flex flex-col items-center justify-center text-center space-y-3 z-10">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-200 font-medium max-w-xs leading-relaxed">
                {errorMessage}
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={initScanner}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reintentar Cámara</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tomar / Subir Foto</span>
                </button>
              </div>
            </div>
          )}

          {/* Barra de Controles sobre la Cámara */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-auto z-20">
            <button
              type="button"
              onClick={handleSwitchCamera}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 text-white text-xs font-medium flex items-center gap-1.5 backdrop-blur-xs border border-white/10 hover:bg-slate-800 transition-colors"
              title="Cambiar entre cámara trasera y frontal"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cambiar Cámara</span>
            </button>

            <div className="flex items-center gap-1.5">
              {/* Botón Tomar / Subir Foto de Código */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 text-white text-xs font-medium flex items-center gap-1.5 backdrop-blur-xs border border-white/10 hover:bg-slate-800 transition-colors"
                title="Tomar o seleccionar foto de código de barras"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Foto</span>
              </button>

              {/* Botón Linterna */}
              <button
                type="button"
                onClick={handleToggleTorch}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 backdrop-blur-xs border transition-colors ${
                  torchOn
                    ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold'
                    : 'bg-slate-900/80 text-white border-white/10 hover:bg-slate-800'
                }`}
                title="Encender linterna"
              >
                <Flashlight className="w-3.5 h-3.5" />
                <span>{torchOn ? 'Flash ON' : 'Flash'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Input oculto para subir o capturar foto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Panel Inferior de Resultados y Acciones */}
        <div className="p-3.5 sm:p-4 space-y-3 flex-1 overflow-y-auto bg-slate-50/50">
          
          {/* Notificación de feedback temporal */}
          {addedFeedback && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2 text-emerald-900 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{addedFeedback}</span>
            </div>
          )}

          {/* TARJETA DE CÓDIGO DETECTADO */}
          {scannedResult && (
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs space-y-3 animate-in slide-in-from-bottom-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">
                    Código de barras: {scannedResult.code}
                  </span>

                  {scannedResult.producto ? (
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base mt-0.5 leading-snug">
                        {scannedResult.producto.nombre}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Categoría: <span className="font-semibold text-slate-700">{scannedResult.producto.categoria}</span> • 
                        Stock: <span className="font-bold text-emerald-600">{scannedResult.producto.stock_actual} {scannedResult.producto.unidad_medida}</span>
                      </p>
                      <p className="text-sm font-black text-emerald-700 mt-1">
                        Precio: C$ {scannedResult.producto.precio_venta.toFixed(2)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-extrabold text-amber-700 text-sm mt-0.5 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span>Código no registrado en el sistema</span>
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        Este código no coincide con ningún producto actual. Puedes vincularlo a un producto existente o registrarlo como nuevo.
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setScannedResult(null);
                    setIsLinking(false);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg shrink-0"
                >
                  Continuar
                </button>
              </div>

              {/* OPCIONES SI EL PRODUCTO EXISTE */}
              {scannedResult.producto && (
                <div className="pt-2.5 border-t border-slate-100">
                  {mode === 'sales' ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>¡Agregado al carrito de venta!</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (onProductScanned) onProductScanned(scannedResult.producto!, 1);
                            setSessionScannedCount((p) => p + 1);
                            setAddedFeedback(`+1 ${scannedResult.producto!.nombre}`);
                          }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold"
                        >
                          + Agregar otro (+1)
                        </button>
                      </div>

                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            stopScanner();
                            onClose();
                          }}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                        >
                          <span>Listo, Ir al Carrito / Cobrar</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* En Modo Inventario: Botones rápidos para sumar stock */
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-700 block">
                        ⚡ Sumar existencias al inventario:
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAddStock(1)}
                          className="py-2 bg-slate-100 hover:bg-emerald-100 text-slate-800 hover:text-emerald-900 border border-slate-200 rounded-xl font-bold text-xs transition-colors"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddStock(5)}
                          className="py-2 bg-slate-100 hover:bg-emerald-100 text-slate-800 hover:text-emerald-900 border border-slate-200 rounded-xl font-bold text-xs transition-colors"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddStock(12)}
                          className="py-2 bg-slate-100 hover:bg-emerald-100 text-slate-800 hover:text-emerald-900 border border-slate-200 rounded-xl font-bold text-xs transition-colors"
                        >
                          +12 (Docena)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddStock(24)}
                          className="py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
                        >
                          +24 (Caja)
                        </button>
                      </div>

                      {/* Cantidad personalizada */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="number"
                          min="1"
                          value={customAddQty}
                          onChange={(e) => setCustomAddQty(e.target.value)}
                          className="w-20 px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-center outline-none focus:border-purple-500"
                          placeholder="Cant."
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const q = parseInt(customAddQty, 10);
                            if (q > 0) handleAddStock(q);
                          }}
                          className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-colors"
                        >
                          Sumar Cantidad Personalizada
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* OPCIONES SI EL PRODUCTO NO EXISTE (Vincular o Crear) */}
              {!scannedResult.producto && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  {!isLinking ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsLinking(true)}
                        className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Link className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Vincular a Producto Existente</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (onNewBarcodeScanned) {
                            onNewBarcodeScanned(scannedResult.code);
                          }
                          stopScanner();
                          onClose();
                        }}
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Plus className="w-4 h-4 shrink-0" />
                        <span>Registrar como Nuevo</span>
                      </button>
                    </div>
                  ) : (
                    /* Buscador para vincular a un producto existente del catálogo */
                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900">
                          Busca el producto para vincularle este código:
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsLinking(false)}
                          className="text-[11px] text-slate-500 hover:text-slate-800 font-bold"
                        >
                          Cancelar
                        </button>
                      </div>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Escribe el nombre (ej. Coca, Arroz, Jabón)..."
                          value={linkSearchQuery}
                          onChange={(e) => setLinkSearchQuery(e.target.value)}
                          className="w-full bg-white border border-amber-300 rounded-lg pl-8 pr-2 py-1.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      {/* Lista de sugerencias para vincular */}
                      <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-amber-100">
                        {linkingFilteredProducts.length > 0 ? (
                          linkingFilteredProducts.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleLinkToProduct(p)}
                              className="w-full text-left p-1.5 hover:bg-amber-100/70 rounded-lg flex items-center justify-between text-xs transition-colors"
                            >
                              <div>
                                <p className="font-bold text-slate-800">{p.nombre}</p>
                                <p className="text-[10px] text-slate-500">
                                  {p.categoria} • C$ {p.precio_venta.toFixed(2)}
                                </p>
                              </div>
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md shrink-0">
                                Vincular 🔗
                              </span>
                            </button>
                          ))
                        ) : linkSearchQuery.trim() ? (
                          <p className="text-[11px] text-slate-500 text-center py-2">
                            No se encontraron coincidencias.
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400 text-center py-1">
                            Escribe el nombre del producto arriba para seleccionarlo.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Entrada Manual de Código o Barra de Búsqueda */}
          <div className="pt-1">
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="O escribe / pega el código aquí..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 font-mono transition-colors shadow-2xs"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shrink-0 transition-colors shadow-2xs"
              >
                Buscar
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
