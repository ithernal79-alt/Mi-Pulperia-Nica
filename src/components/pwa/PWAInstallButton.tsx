import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, CheckCircle2, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // If already installed in standalone mode, do not show prompt
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow with beforeinstallprompt
  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all animate-pulse"
        title="Instalar en celular o tablet para usar sin internet"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Instalar App</span>
        <span className="sm:hidden">Instalar</span>
      </button>
    );
  }

  // iOS Safari flow or manual guide for all mobile browsers
  return (
    <>
      <button
        id="pwa-install-guide-btn"
        onClick={() => setShowGuideModal(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all"
        title="Cómo instalar esta app en tu celular o tablet"
      >
        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
        <span className="hidden sm:inline">Instalar en Celular</span>
        <span className="sm:hidden">Instalar</span>
      </button>

      {/* Modal Guía de Instalación */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Instalar en Celular / Tablet
                </h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Instala la aplicación en la pantalla de inicio para usarla a pantalla completa y acceder a tu inventario <strong>sin necesidad de internet</strong>:
            </p>

            {isIOS ? (
              /* Guía para iPhone / iPad en Safari */
              <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="text-slate-700">
                    Toca el botón <strong>Compartir</strong> <Share className="w-3.5 h-3.5 inline text-blue-600 mx-1" /> en la barra inferior de Safari.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="text-slate-700">
                    Baja en las opciones y selecciona <strong>"Agregar a pantalla de inicio"</strong> <PlusSquare className="w-3.5 h-3.5 inline text-slate-700 mx-1" />.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">
                    3
                  </div>
                  <p className="text-slate-700">
                    Toca <strong>"Agregar"</strong> arriba a la derecha. ¡Listo!
                  </p>
                </div>
              </div>
            ) : (
              /* Guía para Android en Chrome u otros navegadores */
              <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="text-slate-700">
                    Toca los <strong>tres puntos ⋮</strong> en la esquina superior del navegador Chrome.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="text-slate-700">
                    Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">
                    3
                  </div>
                  <p className="text-slate-700">
                    Confirma <strong>"Instalar"</strong>. Se creará el ícono directo de la pulpería.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
