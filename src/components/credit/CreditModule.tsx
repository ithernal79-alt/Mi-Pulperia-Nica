import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  DollarSign, 
  Phone, 
  Search, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowDownLeft, 
  Send, 
  Printer, 
  Receipt,
  UserCheck
} from 'lucide-react';
import { Cliente, Venta, MovimientoCaja, ConfiguracionPulperia } from '../../types';
import { db } from '../../services/db';
import { audioSpeech } from '../../services/audioSpeech';

interface CreditModuleProps {
  clientes: Cliente[];
  ventas: Venta[];
  movimientos: MovimientoCaja[];
  config: ConfiguracionPulperia;
  onRefresh: () => void;
  audioEnabled: boolean;
  onShowReceipt: (receiptData: any) => void;
}

export const CreditModule: React.FC<CreditModuleProps> = ({
  clientes,
  ventas,
  movimientos,
  config,
  onRefresh,
  audioEnabled,
  onShowReceipt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'con_deuda' | 'al_dia' | 'todos'>('con_deuda');
  
  // Cliente seleccionado para ver Estado de Cuenta
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  // Modales
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [abonoAmount, setAbonoAmount] = useState<string>('');
  const [abonoNota, setAbonoNota] = useState<string>('');

  // Formulario nuevo cliente
  const [clientForm, setClientForm] = useState({
    nombre: '',
    telefono: '',
    limite_credito: 500,
    saldo_actual: 0,
    direccion_nota: '',
  });

  // Filtrado de clientes
  const filteredClientes = clientes.filter((c) => {
    const matchesSearch = 
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.telefono.includes(searchTerm);
    if (!matchesSearch) return false;

    if (filterType === 'con_deuda') return c.saldo_actual > 0;
    if (filterType === 'al_dia') return c.saldo_actual === 0;
    return true;
  });

  // Totales
  const totalFiadosActivo = clientes.reduce((acc, c) => acc + c.saldo_actual, 0);
  const totalClientesConDeuda = clientes.filter(c => c.saldo_actual > 0).length;

  // Manejar Nuevo Cliente
  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.nombre) {
      alert('Por favor ingrese el nombre del cliente');
      return;
    }

    const newClient: Cliente = {
      id: `cli-${Date.now().toString().slice(-6)}`,
      nombre: clientForm.nombre,
      telefono: clientForm.telefono || 'Sin teléfono',
      limite_credito: Number(clientForm.limite_credito) || 500,
      saldo_actual: Number(clientForm.saldo_actual) || 0,
      direccion_nota: clientForm.direccion_nota,
      fecha_registro: new Date().toISOString().split('T')[0],
      ultimo_movimiento: new Date().toISOString().split('T')[0],
    };

    db.saveCliente(newClient);
    if (audioEnabled) audioSpeech.playSuccessSound();
    setShowNewClientModal(false);
    setClientForm({
      nombre: '',
      telefono: '',
      limite_credito: 500,
      saldo_actual: 0,
      direccion_nota: '',
    });
    onRefresh();
  };

  // Abrir modal de abono
  const handleOpenAbono = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setAbonoAmount(cliente.saldo_actual.toString());
    setAbonoNota('');
    setShowAbonoModal(true);
  };

  // Registrar Abono
  const handleSaveAbono = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCliente) return;
    const monto = parseFloat(abonoAmount);
    if (isNaN(monto) || monto <= 0) {
      alert('Por favor ingrese un monto de abono válido');
      return;
    }

    const { cliente: updatedCliente, movimiento } = db.registrarAbonoCliente(
      selectedCliente.id,
      monto,
      abonoNota || `Abono de ${selectedCliente.nombre}`
    );

    if (audioEnabled) {
      audioSpeech.playSuccessSound();
      audioSpeech.speak(`Abono de ${config.moneda_simbolo} ${monto} registrado con éxito`);
    }

    setShowAbonoModal(false);
    onRefresh();

    // Mostrar Comprobante de Pago Digital
    onShowReceipt({
      tipo_comprobante: 'ABONO',
      cliente: updatedCliente,
      montoAbono: monto,
      saldoAnterior: selectedCliente.saldo_actual,
      saldoNuevo: updatedCliente.saldo_actual,
      fecha: movimiento.fecha_hora,
      folio: movimiento.id,
    });
  };

  // Generar Recordatorio de WhatsApp
  const handleSendWhatsAppReminder = (cliente: Cliente) => {
    const text = `Hola estimado/a *${cliente.nombre}*, le saludamos cordialmente de *${config.nombre_negocio}* para recordarle que su saldo pendiente de fiado es de *${config.moneda_simbolo} ${cliente.saldo_actual.toFixed(2)}*. Agradecemos su preferencia. ¡Que tenga un excelente día!`;
    const cleanPhone = cliente.telefono.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Obtener historial del cliente seleccionado
  const clientVentas = selectedCliente
    ? ventas.filter((v) => v.cliente_id === selectedCliente.id)
    : [];
  const clientAbonos = selectedCliente
    ? movimientos.filter((m) => m.tipo_movimiento === 'abono_cliente' && m.referencia_id === selectedCliente.id)
    : [];

  return (
    <div className="space-y-4">
      {/* Top Banner Overview */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Users className="w-5 h-5" />
            </div>
            <span>Módulo de Clientes & Libreta de Fiados</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Control de cuentas por cobrar, límites de crédito autorizado y registro de abonos con comprobante
          </p>
        </div>

        {/* Acciones y Métricas */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="bg-blue-50 border border-blue-200 px-3.5 py-2 rounded-xl text-center">
            <span className="text-[10px] text-blue-700 font-bold uppercase block">Total en Fiados</span>
            <span className="text-lg font-black text-blue-800 font-mono">
              {config.moneda_simbolo} {totalFiadosActivo.toFixed(2)}
            </span>
          </div>

          <button
            onClick={() => setShowNewClientModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all select-none"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Grid Principal: Lista de Clientes vs Estado de Cuenta Individual */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* COLUMNA IZQUIERDA: LISTA DE CLIENTES (6/12) */}
        <div className="lg:col-span-6 space-y-3">
          
          {/* Buscador y Filtros */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar cliente por nombre o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setFilterType('con_deuda')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filterType === 'con_deuda' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Con Deuda ({totalClientesConDeuda})
              </button>
              <button
                onClick={() => setFilterType('todos')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filterType === 'todos' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Todos ({clientes.length})
              </button>
            </div>
          </div>

          {/* Cards de Clientes */}
          {filteredClientes.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  {clientes.length === 0 ? 'Libreta de fiados lista para registrar clientes' : 'No se encontraron clientes'}
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                  {clientes.length === 0 
                    ? 'Registra tus clientes de confianza para llevar el control de sus compras al crédito y abonos.'
                    : 'Intenta con otro nombre o cambia el filtro de búsqueda.'}
                </p>
              </div>
              {clientes.length === 0 && (
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-xs transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Registrar Primer Cliente</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
              {filteredClientes.map((cliente) => {
                const isSelected = selectedCliente?.id === cliente.id;
                const hasDebt = cliente.saldo_actual > 0;
                const creditUsage = Math.min(100, (cliente.saldo_actual / cliente.limite_credito) * 100);

                return (
                  <div
                    key={cliente.id}
                    onClick={() => setSelectedCliente(cliente)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 shadow-xs ${
                      isSelected
                        ? 'bg-emerald-50/40 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                          <span>{cliente.nombre}</span>
                          {hasDebt ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Debe
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Al Día
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {cliente.telefono} • {cliente.direccion_nota || 'Sin dirección'}
                        </p>
                      </div>

                      {/* Saldo Actual Deudor */}
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Saldo Pendiente</span>
                        <span className={`text-base font-black font-mono ${hasDebt ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {config.moneda_simbolo} {cliente.saldo_actual.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Barra de progreso de crédito autorizado */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Límite: {config.moneda_simbolo}{cliente.limite_credito.toFixed(2)}</span>
                        <span>{creditUsage.toFixed(0)}% Utilizado</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            creditUsage >= 90 ? 'bg-rose-500' : creditUsage >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${creditUsage}%` }}
                        />
                      </div>
                    </div>

                    {/* Botones de Acción Rápida */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendWhatsAppReminder(cliente);
                        }}
                        className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Recordar por WhatsApp</span>
                      </button>

                      {hasDebt && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAbono(cliente);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1 text-[11px] shadow-xs"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span>Abonar a Cuenta</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* COLUMNA DERECHA: ESTADO DE CUENTA INDIVIDUAL (6/12) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
          
          {selectedCliente ? (
            <div className="space-y-4">
              {/* Header Cliente Seleccionado */}
              <div className="border-b border-slate-200 pb-3 flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                    Estado de Cuenta Individual
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {selectedCliente.nombre}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Teléfono: {selectedCliente.telefono} • Registrado: {selectedCliente.fecha_registro}
                  </p>
                </div>

                {selectedCliente.saldo_actual > 0 && (
                  <button
                    onClick={() => handleOpenAbono(selectedCliente)}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>Registrar Abono</span>
                  </button>
                )}
              </div>

              {/* Resumen Financiero del Cliente */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Deuda Actual</span>
                  <span className="text-sm sm:text-base font-black text-amber-700 font-mono">
                    {config.moneda_simbolo} {selectedCliente.saldo_actual.toFixed(2)}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Límite Crédito</span>
                  <span className="text-sm sm:text-base font-black text-slate-900 font-mono">
                    {config.moneda_simbolo} {selectedCliente.limite_credito.toFixed(2)}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Cupo Libre</span>
                  <span className="text-sm sm:text-base font-black text-emerald-700 font-mono">
                    {config.moneda_simbolo} {Math.max(0, selectedCliente.limite_credito - selectedCliente.saldo_actual).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Historial de Compras al Fiado y Abonos */}
              <div>
                <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Historial de Movimientos de la Cuenta</span>
                </h4>

                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 text-xs">
                  {clientVentas.length === 0 && clientAbonos.length === 0 ? (
                    <p className="text-slate-400 text-center py-6">No hay transacciones registradas para este cliente.</p>
                  ) : (
                    <>
                      {/* Ventas a Crédito */}
                      {clientVentas.map((venta) => (
                        <div key={venta.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                              Compra al Fiado
                            </span>
                            <p className="font-bold text-slate-800 mt-0.5">Venta #{venta.id}</p>
                            <p className="text-[10px] text-slate-400">{venta.fecha_hora}</p>
                          </div>
                          <span className="font-mono font-bold text-amber-700">
                            +{config.moneda_simbolo} {venta.total.toFixed(2)}
                          </span>
                        </div>
                      ))}

                      {/* Abonos Recibidos */}
                      {clientAbonos.map((abono) => (
                        <div key={abono.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                              Abono Recibido
                            </span>
                            <p className="font-bold text-slate-800 mt-0.5">{abono.descripcion}</p>
                            <p className="text-[10px] text-slate-400">{abono.fecha_hora}</p>
                          </div>
                          <span className="font-mono font-bold text-emerald-700">
                            -{config.moneda_simbolo} {abono.monto.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Users className="w-10 h-10 text-slate-300 mb-2" />
              <p className="font-bold text-slate-700">Selecciona un cliente de la lista</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Podrás consultar su estado de cuenta individual, registrar pagos parciales y enviar recordatorios.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* ========================================================
          MODAL: REGISTRAR ABONO / PAGO A CUENTA
      ======================================================== */}
      {showAbonoModal && selectedCliente && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                <span>Registrar Abono a Fiado</span>
              </h3>
              <button 
                onClick={() => setShowAbonoModal(false)}
                className="text-slate-500 hover:text-slate-800 text-xs font-bold px-2 py-1 bg-slate-100 rounded-lg"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSaveAbono} className="space-y-3 text-xs sm:text-sm">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <p className="text-slate-500">Cliente:</p>
                <p className="font-black text-slate-900 text-base">{selectedCliente.nombre}</p>
                <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Deuda actual:</span>
                  <span className="font-mono font-bold text-amber-700">
                    {config.moneda_simbolo} {selectedCliente.saldo_actual.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Monto a Abonar ({config.moneda_simbolo}):</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono">
                    {config.moneda_simbolo}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={selectedCliente.saldo_actual}
                    required
                    placeholder="0.00"
                    value={abonoAmount}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setAbonoAmount(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2.5 text-slate-900 font-mono font-black text-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Botones de sugerencia rápida */}
              <div className="flex items-center gap-1.5 justify-end">
                <button
                  type="button"
                  onClick={() => setAbonoAmount(selectedCliente.saldo_actual.toString())}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-emerald-700 font-bold text-xs rounded-lg border border-slate-200"
                >
                  Pagar Todo ({config.moneda_simbolo}{selectedCliente.saldo_actual.toFixed(2)})
                </button>
                <button
                  type="button"
                  onClick={() => setAbonoAmount('50')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg font-mono border border-slate-200"
                >
                  50
                </button>
                <button
                  type="button"
                  onClick={() => setAbonoAmount('100')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg font-mono border border-slate-200"
                >
                  100
                </button>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nota o Comentario (Opcional):</label>
                <input
                  type="text"
                  placeholder="Ej. Pago en efectivo por Don Juan..."
                  value={abonoNota}
                  onChange={(e) => setAbonoNota(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <div className="flex justify-between">
                  <span>Nuevo saldo tras abono:</span>
                  <span className="font-bold font-mono">
                    {config.moneda_simbolo} {Math.max(0, selectedCliente.saldo_actual - (parseFloat(abonoAmount) || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-white shadow-md flex items-center justify-center gap-2"
              >
                <Receipt className="w-4 h-4" />
                <span>CONFIRMAR ABONO Y EMITIR COMPROBANTE</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: REGISTRAR NUEVO CLIENTE
      ======================================================== */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <span>Registrar Cliente de Fiado</span>
              </h3>
              <button 
                onClick={() => setShowNewClientModal(false)}
                className="text-slate-500 hover:text-slate-800 text-xs font-bold px-2 py-1 bg-slate-100 rounded-lg"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nombre Completo del Cliente:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Don Roberto Hernández..."
                  value={clientForm.nombre}
                  onChange={(e) => setClientForm({ ...clientForm, nombre: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Número de Teléfono (WhatsApp):</label>
                <input
                  type="text"
                  placeholder="+504 9876-5432"
                  value={clientForm.telefono}
                  onChange={(e) => setClientForm({ ...clientForm, telefono: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Límite de Crédito ({config.moneda_simbolo}):</label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    placeholder="500.00"
                    required
                    value={clientForm.limite_credito === 0 ? '' : clientForm.limite_credito}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setClientForm({ 
                        ...clientForm, 
                        limite_credito: val === '' ? 0 : parseFloat(val) || 0 
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Saldo Inicial Deuda:</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={clientForm.saldo_actual === 0 ? '' : clientForm.saldo_actual}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setClientForm({ 
                        ...clientForm, 
                        saldo_actual: val === '' ? 0 : parseFloat(val) || 0 
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Dirección / Referencia de Ubicación:</label>
                <textarea
                  rows={2}
                  placeholder="Ej. Casa de esquina frente a la pulpería vieja..."
                  value={clientForm.direccion_nota}
                  onChange={(e) => setClientForm({ ...clientForm, direccion_nota: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-white shadow-md flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>GUARDAR CLIENTE</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
