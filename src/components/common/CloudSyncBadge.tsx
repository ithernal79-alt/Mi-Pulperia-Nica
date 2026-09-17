import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { cloudSync, CloudSyncState } from '../../services/cloudSync';

export const CloudSyncBadge: React.FC = () => {
  const [syncState, setSyncState] = useState<CloudSyncState>(cloudSync.getState());
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsub = cloudSync.subscribe((state) => {
      setSyncState(state);
    });
    return unsub;
  }, []);

  const handleManualSync = async () => {
    if (syncState.status === 'syncing') return;
    const res = await cloudSync.syncAllToCloud();
    setFeedback(res.message);
    setTimeout(() => setFeedback(null), 3000);
  };

  const isSyncing = syncState.status === 'syncing';
  const isOnline = syncState.isOnline;
  const pending = syncState.pendingCount;

  return (
    <div className="relative flex items-center">
      <button
        onClick={handleManualSync}
        disabled={isSyncing || !isOnline}
        title={
          isOnline
            ? pending > 0
              ? `${pending} pendientes por subir a la nube. Haz clic para sincronizar ahora.`
              : syncState.lastSyncTime
              ? `Nube conectada y al día (Última sinc: ${syncState.lastSyncTime}). Clic para verificar.`
              : 'Nube conectada. Clic para sincronizar.'
            : 'Sin conexión Wi-Fi/Datos. Guardando en celular, se sincronizará al volver la conexión.'
        }
        className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs ${
          !isOnline
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : isSyncing
            ? 'bg-blue-50 text-blue-700 border-blue-300 animate-pulse'
            : pending > 0
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
        }`}
      >
        {isSyncing ? (
          <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
        ) : !isOnline ? (
          <CloudOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        ) : (
          <Cloud className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        )}

        <span className="hidden sm:inline">
          {isSyncing ? (
            'Sincronizando...'
          ) : !isOnline ? (
            'En Celular (Offline)'
          ) : pending > 0 ? (
            `Nube (${pending} pend.)`
          ) : (
            'Nube al día'
          )}
        </span>

        {/* Punto de estado en móvil */}
        <span
          className={`sm:hidden w-2 h-2 rounded-full ${
            !isOnline
              ? 'bg-amber-500'
              : isSyncing
              ? 'bg-blue-500 animate-ping'
              : pending > 0
              ? 'bg-emerald-500 animate-pulse'
              : 'bg-emerald-500'
          }`}
        />
      </button>

      {/* Popover temporal de confirmación */}
      {feedback && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-slate-900 text-white text-[11px] font-medium px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap flex items-center gap-1.5 border border-slate-700 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
};
