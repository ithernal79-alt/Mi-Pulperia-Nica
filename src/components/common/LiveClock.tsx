import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

interface LiveClockProps {
  className?: string;
  showDate?: boolean;
  showSeconds?: boolean;
  compact?: boolean;
}

export const LiveClock: React.FC<LiveClockProps> = ({
  className = '',
  showDate = true,
  showSeconds = true,
  compact = false,
}) => {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    // Actualizar cada segundo en vivo
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Formato de hora en español de 12 horas con AM/PM
  const timeString = time.toLocaleTimeString('es-NI', {
    hour: '2-digit',
    minute: '2-digit',
    second: showSeconds ? '2-digit' : undefined,
    hour12: true,
  });

  // Formato de fecha descriptiva en español
  const dateString = time.toLocaleDateString('es-NI', {
    weekday: compact ? 'short' : 'short',
    day: 'numeric',
    month: compact ? 'short' : 'short',
    year: compact ? undefined : 'numeric',
  });

  const capitalizedDate = dateString.charAt(0).toUpperCase() + dateString.slice(1);

  if (compact) {
    return (
      <div 
        id="live-clock-compact" 
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100/90 border border-slate-200/80 text-slate-800 text-xs font-semibold ${className}`}
        title="Hora actual del sistema sincronizada"
      >
        <Clock className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
        <span className="font-mono font-bold tracking-tight text-slate-900">{timeString}</span>
      </div>
    );
  }

  return (
    <div 
      id="live-clock-badge"
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/80 border border-slate-200/90 shadow-2xs select-none ${className}`}
      title="Hora y fecha en vivo sincronizadas con tu dispositivo"
    >
      <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
        <Clock className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
      </div>
      <div className="flex flex-col text-left leading-tight">
        <div className="flex items-center gap-1">
          <span className="font-mono font-black text-xs sm:text-sm text-slate-900 tracking-tight">
            {timeString}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
        </div>
        {showDate && (
          <span className="text-[10px] text-slate-500 font-medium capitalize flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5 text-slate-400" />
            {capitalizedDate}
          </span>
        )}
      </div>
    </div>
  );
};
