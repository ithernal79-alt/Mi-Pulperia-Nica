import React from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div 
      id="pwa-offline-banner"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900/90 text-white px-3.5 py-2 text-xs font-semibold shadow-xl border border-slate-700 backdrop-blur-md animate-in slide-in-from-bottom-3"
    >
      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Modo sin conexión activo • Tus datos e inventario se guardan localmente</span>
    </div>
  );
};
