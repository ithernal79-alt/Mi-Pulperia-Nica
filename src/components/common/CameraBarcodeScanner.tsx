import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, RotateCw, Flashlight, Plus, CheckCircle2, AlertCircle, Search, Package } from 'lucide-react';
import { Producto } from '../../types';
import { audioSpeech } from '../../services/audioSpeech';

interface CameraBarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  productos: Producto[];
  onProductScanned?: (producto: Producto, cantidad?: number) => void;
  onNewBarcodeScanned?: (barcode: string) => void;
  title?: string;
  subtitle?: string;
}

export const CameraBarcodeScanner: React.FC<CameraBarcodeScannerProps> = ({
  isOpen,
  onClose,
  productos,
  onProductScanned,
  onNewBarcodeScanned,
  title = 'Escanear Código de Barras',
  subtitle = 'Apunta la cámara al código de barras del producto',
}) => {
  const [scannerActive, setScannerActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraIndex, setSelectedCameraIndex] = useState(0);
  const [manualCode, setManualCode] = useState('');
  const [scannedResult, setScannedResult] = useState<{
    code: string;
    producto?: Producto;
    timestamp: number;
  } | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'barcode-scanner-viewport';

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setScannedResult(null);
      setAddedFeedback(null);
      return;
    }

    // Al abrir, buscar cámaras disponibles
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices.map(d => ({ id: d.id, label: d.label || 'Cámara' })));
          // Preferir cámara trasera si existe
          const backIndex = devices.findIndex(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('trasera') || 
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraIndex(backIndex >= 0 ? backIndex : devices.length - 1);
        }
      })
      .catch((err) => {
        console.warn('Error listando cámaras:', err);
      });

    // Iniciar escáner con retardo para permitir que el DOM se monte
    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, selectedCameraIndex]);

  const startScanner = async () => {
    try {
      setErrorMessage(null);
      if (scannerRef.current) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode(containerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 280, height: 160 },
        aspectRatio: 1.333333,
      };

      const cameraId = cameras[selectedCameraIndex]?.id || { facingMode: 'environment' };

      await html5QrCode.start(
        cameraId,
        config,
        (decodedText) => {
          handleBarcodeDetected(decodedText.trim());
        },
        () => {
          // Frame sin código detectado (normal, ignorar)
        }
      );

      setScannerActive(true);
    } catch (err: any) {
      console.error('Error al iniciar cámara:', err);
      setScannerActive(false);
      setErrorMessage(
        err?.message || 'No se pudo acceder a la cámara. Revisa los permisos o ingresa el código manualmente.'
      );
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerActive) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        // Ignorar si ya estaba detenido
      }
      scannerRef.current = null;
      setScannerActive(false);
    }
  };

  const handleBarcodeDetected = (code: string) => {
    if (!code) return;
    audioSpeech.playBeep(1100, 0.08);

    // Buscar en inventario
    const found = productos.find(
      (p) => p.codigo_barras.trim() === code.trim() || p.codigo_barras.includes(code)
    );

    setScannedResult({
      code,
      producto: found,
      timestamp: Date.now(),
    });

    if (found && onProductScanned) {
      // Notificar detección
      audioSpeech.speak(`${found.nombre}`);
    } else if (!found) {
      audioSpeech.playAlertSound();
    }
  };

  const switchCamera = () => {
    if (cameras.length > 1) {
      setSelectedCameraIndex((prev) => (prev + 1) % cameras.length);
    }
  };

  const toggleTorch = async () => {
    if (scannerRef.current && scannerActive) {
      try {
        // @ts-ignore
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ torch: !torchOn }],
        });
        setTorchOn(!torchOn);
      } catch (e) {
        console.warn('Linterna no soportada');
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleBarcodeDetected(manualCode.trim());
    setManualCode('');
  };

  const handleQuickAddStock = (cantidad: number) => {
    if (scannedResult?.producto && onProductScanned) {
      onProductScanned(scannedResult.producto, cantidad);
      setAddedFeedback(`+${cantidad} a ${scannedResult.producto.nombre}`);
      setTimeout(() => setAddedFeedback(null), 3000);
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
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-tight">
                {title}
              </h3>
              <p className="text-xs text-slate-500">{subtitle}</p>
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
        <div className="relative bg-slate-950 flex flex-col items-center justify-center min-h-[260px] overflow-hidden">
          {/* Contenedor del video html5-qrcode */}
          <div id={containerId} className="w-full max-w-sm rounded-xl overflow-hidden" />

          {/* Mira o marco visual de escaneo */}
          {scannerActive && !scannedResult && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-64 h-36 border-2 border-dashed border-emerald-400/80 rounded-2xl shadow-lg flex items-center justify-center">
                {/* Láser de escaneo animado */}
                <div className="absolute left-2 right-2 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-bounce" />
                <span className="text-[11px] font-bold text-white bg-slate-900/80 px-2.5 py-1 rounded-full border border-white/20 tracking-wider uppercase">
                  Alinear código aquí
                </span>
              </div>
            </div>
          )}

          {/* Error si no hay cámara */}
          {errorMessage && (
            <div className="p-4 text-center max-w-xs space-y-2">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-xs text-slate-300 font-medium">{errorMessage}</p>
              <button
                onClick={startScanner}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
              >
                Reintentar Cámara
              </button>
            </div>
          )}

          {/* Controles sobre el video */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
            {cameras.length > 1 && (
              <button
                onClick={switchCamera}
                className="px-3 py-1.5 rounded-xl bg-slate-900/80 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-xs border border-white/10 hover:bg-slate-800"
                title="Cambiar entre cámara trasera y delantera"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Cambiar Cámara</span>
              </button>
            )}

            <button
              onClick={toggleTorch}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 backdrop-blur-xs border transition-colors ml-auto ${
                torchOn
                  ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold'
                  : 'bg-slate-900/80 text-white border-white/10 hover:bg-slate-800'
              }`}
              title="Encender o apagar flash"
            >
              <Flashlight className="w-3.5 h-3.5" />
              <span>{torchOn ? 'Linterna ON' : 'Linterna'}</span>
            </button>
          </div>
        </div>

        {/* Sección de Resultados Detectados */}
        <div className="p-4 sm:p-5 space-y-3.5 flex-1 overflow-y-auto">
          {addedFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{addedFeedback}</span>
            </div>
          )}

          {scannedResult ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">
                    Código Detectado: {scannedResult.code}
                  </span>
                  {scannedResult.producto ? (
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base mt-0.5">
                        {scannedResult.producto.nombre}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Categoría: <span className="font-semibold text-slate-700">{scannedResult.producto.categoria}</span> | 
                        Stock actual: <span className="font-bold text-emerald-600">{scannedResult.producto.stock_actual} {scannedResult.producto.unidad_medida}</span>
                      </p>
                      <p className="text-xs font-bold text-emerald-700 mt-1">
                        Precio Venta: C$ {scannedResult.producto.precio_venta.toFixed(2)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-extrabold text-amber-700 text-sm mt-0.5 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        Producto Nuevo (No registrado aún)
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Este código de barras no existe en el catálogo. Puedes registrarlo con 1 clic.
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setScannedResult(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-1 bg-white border border-slate-200 rounded-lg"
                >
                  Escanear Otro
                </button>
              </div>

              {/* Acciones según si existe o no */}
              {scannedResult.producto ? (
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">
                    ⚡ Sumar existencias al inventario:
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => handleQuickAddStock(1)}
                      className="py-2 bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 border border-slate-300 hover:border-emerald-500 rounded-xl font-bold text-xs transition-all shadow-xs"
                    >
                      +1 Unidad
                    </button>
                    <button
                      onClick={() => handleQuickAddStock(5)}
                      className="py-2 bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 border border-slate-300 hover:border-emerald-500 rounded-xl font-bold text-xs transition-all shadow-xs"
                    >
                      +5 Unid
                    </button>
                    <button
                      onClick={() => handleQuickAddStock(12)}
                      className="py-2 bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 border border-slate-300 hover:border-emerald-500 rounded-xl font-bold text-xs transition-all shadow-xs"
                    >
                      +12 (Docena)
                    </button>
                    <button
                      onClick={() => handleQuickAddStock(24)}
                      className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs"
                    >
                      +24 (Caja)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-200">
                  <button
                    onClick={() => {
                      if (onNewBarcodeScanned) {
                        onNewBarcodeScanned(scannedResult.code);
                      }
                      stopScanner();
                      onClose();
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>REGISTRAR ESTE PRODUCTO AL CATÁLOGO</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Guía cuando no hay código detectado aún */
            <div className="text-center py-2">
              <p className="text-xs text-slate-500">
                Sostén el producto frente a la cámara. Se leerá automáticamente y emitirá un sonido al reconocerlo.
              </p>
            </div>
          )}

          {/* Ingreso manual por si falla la cámara */}
          <div className="pt-2 border-t border-slate-200">
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="O escribe el código aquí manualmente..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shrink-0 transition-colors"
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
