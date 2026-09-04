import React, { useState } from 'react';
import { 
  Store, 
  DollarSign, 
  AlertTriangle, 
  Database, 
  Volume2, 
  VolumeX, 
  Sparkles,
  Info
} from 'lucide-react';
import { ConfiguracionPulperia, Producto, Cliente } from '../types';
import { LiveClock } from './common/LiveClock';
import { PWAInstallButton } from './pwa/PWAInstallButton';

interface HeaderProps {
  config: ConfiguracionPulperia;
  productos: Producto[];
  clientes: Cliente[];
  onOpenBackupModal: () => void;
  onOpenConfigModal: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  productos,
  clientes,
  onOpenBackupModal,
  onOpenConfigModal,
  audioEnabled,
  onToggleAudio
}) => {
  const [showInfo, setShowInfo] = useState(false);

  // Calcular alertas de stock
  const lowStockCount = productos.filter(p => p.stock_actual <= p.stock_minimo).length;
  // Calcular total adeudado en fiados
  const totalFiados = clientes.reduce((acc, c) => acc + c.saldo_actual, 0);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-3 sm:px-6 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & Store Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-600/20 text-white font-black text-lg">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg text-slate-900 leading-tight tracking-tight">
                {config.nombre_negocio}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                100% Offline
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {config.propietario} • {config.direccion}
            </p>
          </div>
        </div>

        {/* Status Indicators & Action Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Reloj en Vivo Actualizado (En móvil versión compacta y en escritorio completa) */}
          <div className="sm:hidden">
            <LiveClock compact={true} />
          </div>
          <div className="hidden sm:flex">
            <LiveClock compact={false} />
          </div>

          {/* Alertas de Stock Badge */}
          {lowStockCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="hidden md:inline">Stock bajo:</span>
              <span className="font-bold">{lowStockCount}</span>
            </div>
          )}

          {/* Total Fiados Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold">
            <span>Fiados por cobrar:</span>
            <span className="font-bold text-blue-900 font-mono">
              {config.moneda_simbolo} {totalFiados.toFixed(2)}
            </span>
          </div>

          {/* Audio voice feedback toggle */}
          <button
            onClick={onToggleAudio}
            title={audioEnabled ? "Voz y sonidos activados" : "Sonidos silenciados"}
            className={`p-2 rounded-xl transition-colors border ${
              audioEnabled 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Botón PWA para Instalar en Celular / Tablet */}
          <PWAInstallButton />

          {/* Backup Database */}
          <button
            onClick={onOpenBackupModal}
            title="Base de datos SQLite local / Respaldo"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">BD Local</span>
          </button>

          {/* Info Modal Button */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
            title="Información del Sistema"
          >
            <Info className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Info Popover */}
      {showInfo && (
        <div className="max-w-7xl mx-auto mt-2.5 p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Sistema Integral para Pulperías y Tiendas de Barrio</p>
              <p className="text-slate-300 mt-0.5">
                Usa la <strong>Bomba de Voz</strong> para decir comandos en lenguaje natural como: <em>"Dos tarros de leche y una libra de arroz"</em>. El sistema descuenta stock, gestiona fiados y realiza el arqueo de caja automáticamente.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowInfo(false)}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg shrink-0 font-semibold"
          >
            Entendido
          </button>
        </div>
      )}
    </header>
  );
};
