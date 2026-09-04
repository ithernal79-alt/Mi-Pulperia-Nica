import React, { useState } from 'react';
import { 
  Calculator, 
  Banknote, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Filter, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  TrendingUp, 
  Receipt,
  FileSpreadsheet
} from 'lucide-react';
import { Venta, MovimientoCaja, ConfiguracionPulperia, ResumenCorteCaja } from '../../types';
import { db } from '../../services/db';
import { audioSpeech } from '../../services/audioSpeech';
import { LiveClock } from '../common/LiveClock';

interface ReportsModuleProps {
  ventas: Venta[];
  movimientos: MovimientoCaja[];
  config: ConfiguracionPulperia;
  onRefresh: () => void;
  audioEnabled: boolean;
  onShowReceipt: (receiptData: any) => void;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  ventas,
  movimientos,
  config,
  onRefresh,
  audioEnabled,
  onShowReceipt,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterMetodo, setFilterMetodo] = useState<'todos' | 'contado' | 'credito'>('todos');
  const [filterHour, setFilterHour] = useState<string>('todos');

  // Arqueo de Caja Físico
  const [physicalCashCounted, setPhysicalCashCounted] = useState<string>('');
  
  // Modal Movimiento Manual
  const [showManualMovementModal, setShowManualMovementModal] = useState(false);
  const [movementForm, setMovementForm] = useState<{
    tipo: 'entrada_dinero' | 'salida_gasto';
    monto: number;
    descripcion: string;
  }>({
    tipo: 'salida_gasto',
    monto: 0,
    descripcion: '',
  });

  // Resumen del corte del día
  const resumen: ResumenCorteCaja = db.getResumenCorteDelDia(selectedDate);
  const countedNum = parseFloat(physicalCashCounted) || 0;
  const hasCounted = physicalCashCounted.trim() !== '';
  const diferenciaCaja = countedNum - resumen.efectivo_esperado_caja;

  // Filtrar transacciones
  const filteredVentas = ventas.filter((v) => {
    if (!v.fecha_hora.startsWith(selectedDate)) return false;
    if (filterMetodo !== 'todos' && v.tipo !== filterMetodo) return false;
    if (filterHour !== 'todos') {
      const saleHour = v.fecha_hora.split(' ')[1]?.slice(0, 2);
      if (saleHour !== filterHour) return false;
    }
    return true;
  });

  const filteredMovimientos = movimientos.filter((m) => m.fecha_hora.startsWith(selectedDate));

  // Registrar movimiento manual
  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementForm.descripcion || movementForm.monto <= 0) {
      alert('Por favor complete la descripción y un monto válido');
      return;
    }

    db.registrarMovimientoManual(
      movementForm.tipo,
      Number(movementForm.monto),
      movementForm.descripcion
    );

    if (audioEnabled) {
      audioSpeech.playSuccessSound();
      audioSpeech.speak(`Movimiento registrado: ${movementForm.descripcion}`);
    }

    setShowManualMovementModal(false);
    setMovementForm({
      tipo: 'salida_gasto',
      monto: 0,
      descripcion: '',
    });
    onRefresh();
  };

  // Generar Ticket de Corte de Caja
  const handlePrintCorte = () => {
    onShowReceipt({
      tipo_comprobante: 'CORTE_CAJA',
      resumen,
      fecha: selectedDate,
      efectivoContado: hasCounted ? countedNum : undefined,
      diferencia: hasCounted ? diferenciaCaja : undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Overview */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Calculator className="w-5 h-5" />
            </div>
            <span>Corte de Caja Diario & Reportes de la Jornada</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Resumen contable en tiempo real, arqueo de efectivo físico y registro detallado de transacciones
          </p>
        </div>

        {/* Date Selector & Manual Movement Action */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-between md:justify-end">
          <LiveClock compact={false} />

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-900 font-semibold outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => setShowManualMovementModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all select-none"
          >
            <Banknote className="w-4 h-4 text-emerald-400" />
            <span>Gasto / Entrada</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          PANEL PRINCIPAL DE CORTE DE CAJA (ARQUEO)
      ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* COLUMNA IZQUIERDA: RESUMEN FINANCIERO Y CUADRE (7/12) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-600" />
              <span>Arqueo y Cierre de Caja del Día</span>
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {resumen.cantidad_transacciones} ventas realizadas
            </span>
          </div>

          {/* Fórmulas y Desglose Contable */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* 1. Efectivo Inicial */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-0.5 font-medium">1. Efectivo Inicial (Fondo)</span>
              <span className="text-base font-black font-mono text-slate-900">
                {config.moneda_simbolo} {resumen.efectivo_inicial.toFixed(2)}
              </span>
            </div>

            {/* 2. Ventas en Efectivo */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-0.5 font-medium">2. (+) Ventas Contado (Efectivo)</span>
              <span className="text-base font-black font-mono text-emerald-700">
                +{config.moneda_simbolo} {resumen.total_ventas_efectivo.toFixed(2)}
              </span>
            </div>

            {/* 3. Abonos Recibidos de Fiados */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-0.5 font-medium">3. (+) Abonos de Clientes Fiados</span>
              <span className="text-base font-black font-mono text-blue-700">
                +{config.moneda_simbolo} {resumen.total_abonos_recibidos.toFixed(2)}
              </span>
            </div>

            {/* 4. Ventas a Crédito (Informativo) */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-0.5 font-medium">4. (ℹ️) Ventas a Crédito (Por Cobrar)</span>
              <span className="text-base font-black font-mono text-amber-700">
                {config.moneda_simbolo} {resumen.total_ventas_credito.toFixed(2)}
              </span>
            </div>

            {/* 5. Entradas Extras */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-0.5 font-medium">5. (+) Entradas Manuales de Dinero</span>
              <span className="text-base font-black font-mono text-cyan-700">
                +{config.moneda_simbolo} {resumen.total_entradas_extras.toFixed(2)}
              </span>
            </div>

            {/* 6. Salidas y Gastos */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-0.5 font-medium">6. (-) Gastos y Salidas de Caja</span>
              <span className="text-base font-black font-mono text-rose-700">
                -{config.moneda_simbolo} {resumen.total_salidas_gastos.toFixed(2)}
              </span>
            </div>
          </div>

          {/* TOTAL EFECTIVO ESPERADO EN CAJA */}
          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase font-extrabold text-emerald-900 tracking-wider">
                Total de Dinero que Debe Haber Físicamente en Caja:
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-800 font-mono">
                {config.moneda_simbolo} {resumen.efectivo_esperado_caja.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              (Inicial {config.moneda_simbolo}{resumen.efectivo_inicial} + Ventas Contado {config.moneda_simbolo}{resumen.total_ventas_efectivo} + Abonos {config.moneda_simbolo}{resumen.total_abonos_recibidos} - Gastos {config.moneda_simbolo}{resumen.total_salidas_gastos})
            </p>
          </div>

          {/* CUADRE / CONTEO FÍSICO REAL */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700">
                Conteo Físico Real de Billetes y Monedas:
              </label>
              <div className="relative w-48">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono font-bold">
                  {config.moneda_simbolo}
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={physicalCashCounted}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setPhysicalCashCounted(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-right font-mono font-black text-slate-900 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {hasCounted && (
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                diferenciaCaja === 0
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : diferenciaCaja > 0
                  ? 'bg-blue-50 border-blue-300 text-blue-800'
                  : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}>
                <span>
                  {diferenciaCaja === 0
                    ? '✅ ¡Caja Cuadrada Perfectamente!'
                    : diferenciaCaja > 0
                    ? `🟢 Sobrante en caja (+)`
                    : `🔴 Faltante en caja (-)`}
                </span>
                <span className="font-mono text-base font-black">
                  {config.moneda_simbolo} {Math.abs(diferenciaCaja).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Ganancia Estimada del Día */}
          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-700" />
              <span className="text-slate-700 font-semibold">Ganancia Neta Estimada de la Jornada:</span>
            </div>
            <span className="font-bold font-mono text-amber-800 text-sm">
              +{config.moneda_simbolo} {resumen.ganancia_total_dia.toFixed(2)}
            </span>
          </div>

          {/* Botón Imprimir Ticket de Corte */}
          <button
            onClick={handlePrintCorte}
            className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>EMITIR TICKET DE CORTE DE CAJA</span>
          </button>
        </div>

        {/* COLUMNA DERECHA: HISTORIAL DE TRANSACCIONES DEL DÍA (5/12) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span>Historial del Día</span>
            </h3>

            {/* Filtro Tipo de Pago */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] border border-slate-200">
              <button
                onClick={() => setFilterMetodo('todos')}
                className={`px-2 py-0.5 rounded font-semibold transition-all ${
                  filterMetodo === 'todos' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterMetodo('contado')}
                className={`px-2 py-0.5 rounded font-semibold transition-all ${
                  filterMetodo === 'contado' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Contado
              </button>
              <button
                onClick={() => setFilterMetodo('credito')}
                className={`px-2 py-0.5 rounded font-semibold transition-all ${
                  filterMetodo === 'credito' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Fiado
              </button>
            </div>
          </div>

          {/* Lista de Transacciones */}
          <div className="flex-1 overflow-y-auto max-h-[500px] space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-slate-200 text-xs">
            {filteredVentas.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No hay ventas registradas para esta fecha.</p>
            ) : (
              filteredVentas.map((venta) => (
                <div
                  key={venta.id}
                  onClick={() => onShowReceipt({ tipo_comprobante: 'VENTA', venta })}
                  className="bg-slate-50 p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer space-y-1.5 shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          venta.tipo === 'contado'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {venta.tipo === 'contado' ? 'Contado' : 'Fiado'}
                        </span>
                        <span className="font-bold text-slate-800">Venta #{venta.id}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {venta.cliente_nombre} • {venta.fecha_hora.split(' ')[1]}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black font-mono text-slate-900 block">
                        {config.moneda_simbolo} {venta.total.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-mono font-medium">
                        Ganancia: +{config.moneda_simbolo}{venta.ganancia_estimada.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Items resumidos */}
                  <div className="text-[11px] text-slate-500 truncate bg-white px-2 py-1 rounded border border-slate-200">
                    {venta.items.map(i => `${i.cantidad}x ${i.producto_nombre}`).join(', ')}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* ========================================================
          MODAL: REGISTRAR ENTRADA / GASTO MANUAL DE CAJA
      ======================================================== */}
      {showManualMovementModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-amber-600" />
                <span>Registrar Gasto o Entrada Extra</span>
              </h3>
              <button 
                onClick={() => setShowManualMovementModal(false)}
                className="text-slate-500 hover:text-slate-800 text-xs font-bold px-2 py-1 bg-slate-100 rounded-lg"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMovementForm({ ...movementForm, tipo: 'salida_gasto' })}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    movementForm.tipo === 'salida_gasto'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Salida / Gasto (-)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMovementForm({ ...movementForm, tipo: 'entrada_dinero' })}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    movementForm.tipo === 'entrada_dinero'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Entrada Extra (+)</span>
                </button>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Monto ({config.moneda_simbolo}):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  required
                  placeholder="0.00"
                  value={movementForm.monto === 0 ? '' : movementForm.monto}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMovementForm({ 
                      ...movementForm, 
                      monto: val === '' ? 0 : parseFloat(val) || 0 
                    });
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold text-base outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Concepto o Descripción:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pago de hielo para refrescos, bolsas, flete..."
                  value={movementForm.descripcion}
                  onChange={(e) => setMovementForm({ ...movementForm, descripcion: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>GUARDAR MOVIMIENTO EN CAJA</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
