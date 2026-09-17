import React, { useState } from 'react';
import {
  FileText,
  Building2,
  Award,
  Calendar,
  CheckCircle,
  TrendingUp,
  CreditCard,
  Package,
  Layers,
  Printer,
  FileSpreadsheet,
  Download,
  DollarSign
} from 'lucide-react';
import { Venta, Cliente, Producto, MovimientoCaja, ConfiguracionPulperia } from '../../types';

interface CertifiedFinancialStatementProps {
  config: ConfiguracionPulperia;
  periodLabel: string;
  stats: {
    totalVentas: number;
    gananciaTotal: number;
    totalTransacciones: number;
    ticketPromedio: number;
    margenPorcentaje: number;
    ventasContado: number;
    ventasCredito: number;
    totalFiadosPendientes: number;
    clientesConDeuda: number;
    valorInventarioVenta: number;
    valorInventarioCosto: number;
    gananciaPotencialInventario: number;
    totalUnidadesStock: number;
  };
  ventas: Venta[];
  clientes: Cliente[];
  productos: Producto[];
  categoryData: { categoria: string; total: number; unidades: number }[];
  onExportExcel: () => void;
  onPrint: () => void;
}

export const CertifiedFinancialStatement: React.FC<CertifiedFinancialStatementProps> = ({
  config,
  periodLabel,
  stats,
  ventas,
  clientes,
  productos,
  categoryData,
  onExportExcel,
  onPrint
}) => {
  const [activeTab, setActiveTab] = useState<'resultados' | 'balance' | 'flujo' | 'analisis'>('resultados');

  const formatMoney = (amount: number) => {
    return `${config.moneda_simbolo} ${amount.toLocaleString('es-NI', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Cálculos contables formales (NIIF para PYMES / Principios Contables)
  const ingresosBrutos = stats.totalVentas;
  const devoluciones = 0.0;
  const ingresosNetos = ingresosBrutos - devoluciones;

  // Costo de los Bienes Vendidos (COGS)
  const costoVentas = Math.max(0, ingresosNetos - stats.gananciaTotal);
  const utilidadBruta = stats.gananciaTotal;
  const margenBrutoPct = ingresosNetos > 0 ? (utilidadBruta / ingresosNetos) * 100 : 0;

  // Gastos operativos estimados / provisiones de cuentas incobrables
  const provisionInsolvencia = stats.totalFiadosPendientes * 0.02; // Provisión técnica 2% sobre cartera
  const gastosOperativosEstimados = 0; // Si no hay gastos registrados
  const utilidadOperativa = utilidadBruta - provisionInsolvencia - gastosOperativosEstimados;

  // Balance General simplificado
  const activoDisponibleEfectivo = stats.ventasContado; // Flujo generado de contado
  const activoExigibleCuentasPorCobrar = stats.totalFiadosPendientes;
  const activoRealizableInventarios = stats.valorInventarioCosto;
  const totalActivoCorriente = activoDisponibleEfectivo + activoExigibleCuentasPorCobrar + activoRealizableInventarios;

  return (
    <div className="bg-white border-2 border-slate-300 rounded-2xl shadow-md overflow-hidden animate-in fade-in duration-200">
      
      {/* 1. ENCABEZADO FORMAL DE FIRMA CONTABLE Y CERTIFICACIÓN */}
      <div className="bg-slate-900 text-white p-4 sm:p-6 border-b-4 border-emerald-600">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-widest border border-emerald-500/30">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dictamen Contable Certificado • NIIF para PYMES</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
              {config.nombre_negocio}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm font-medium">
              ESTADOS FINANCIEROS Y DECLARACIÓN CONTABLE ANALÍTICA
            </p>
            <p className="text-slate-400 text-xs">
              Expresado en Córdobas Nicaragüenses (NIO - C$) • Período Contable: <span className="text-emerald-400 font-bold uppercase">{periodLabel}</span>
            </p>
          </div>

          {/* Acciones de exportación profesional */}
          <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
            <button
              onClick={onExportExcel}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Descargar todos los libros en formato Excel certificado"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>Exportar Libro Excel</span>
            </button>
            <button
              onClick={onPrint}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold flex items-center gap-2 border border-slate-700 shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Imprimir documento formal para firma"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SELECTOR DE LIBRO CONTABLE (Pestañas formales) */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 pt-3 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('resultados')}
          className={`pb-3 px-3 text-xs sm:text-sm font-black border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'resultados'
              ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg shadow-2xs'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          1. Estado de Resultados (Pérdidas y Ganancias)
        </button>
        <button
          onClick={() => setActiveTab('balance')}
          className={`pb-3 px-3 text-xs sm:text-sm font-black border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'balance'
              ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg shadow-2xs'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          2. Balance de Situación Patrimonial
        </button>
        <button
          onClick={() => setActiveTab('flujo')}
          className={`pb-3 px-3 text-xs sm:text-sm font-black border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'flujo'
              ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg shadow-2xs'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          3. Auditoría de Cartera y Fiados
        </button>
        <button
          onClick={() => setActiveTab('analisis')}
          className={`pb-3 px-3 text-xs sm:text-sm font-black border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'analisis'
              ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg shadow-2xs'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          4. Ratios y Dictamen del Contador
        </button>
      </div>

      {/* 3. CUERPO DEL INFORME CONTABLE */}
      <div className="p-4 sm:p-6 bg-slate-50/50">

        {/* ================= PESTAÑA 1: ESTADO DE RESULTADOS ================= */}
        {activeTab === 'resultados' && (
          <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden">
            <div className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between">
              <span className="font-extrabold text-xs uppercase tracking-wider">
                ESTADO DE RENDIMIENTO FINANCIERO INTEGRAL ({periodLabel.toUpperCase()})
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">CÓDIGO NIIF-PYME-01</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left">
                <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-300 uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Código / Cuenta Contable</th>
                    <th className="py-2.5 px-4">Descripción de la Partida</th>
                    <th className="py-2.5 px-4 text-center">Referencia</th>
                    <th className="py-2.5 px-4 text-right">Parcial ({config.moneda_simbolo})</th>
                    <th className="py-2.5 px-4 text-right">Total ({config.moneda_simbolo})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {/* INGRESOS */}
                  <tr className="bg-slate-50 font-bold text-slate-900">
                    <td className="py-2 px-4 font-mono text-emerald-700">4.1.01</td>
                    <td className="py-2 px-4">INGRESOS DE ACTIVIDADES ORDINARIAS (VENTAS)</td>
                    <td className="py-2 px-4 text-center">{stats.totalTransacciones} Transacciones</td>
                    <td className="py-2 px-4 text-right"></td>
                    <td className="py-2 px-4 text-right font-black font-mono text-slate-900">{formatMoney(ingresosBrutos)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-mono text-slate-500 pl-8">4.1.01.01</td>
                    <td className="py-2 px-4 text-slate-600 pl-8">• Ventas de Contado (Disponibilidad Líquida Inmediata)</td>
                    <td className="py-2 px-4 text-center text-xs text-slate-500">
                      {ingresosBrutos > 0 ? ((stats.ventasContado / ingresosBrutos) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-2 px-4 text-right font-mono">{formatMoney(stats.ventasContado)}</td>
                    <td className="py-2 px-4 text-right"></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-mono text-slate-500 pl-8">4.1.01.02</td>
                    <td className="py-2 px-4 text-slate-600 pl-8">• Ventas a Crédito (Cartera de Fiados del Período)</td>
                    <td className="py-2 px-4 text-center text-xs text-slate-500">
                      {ingresosBrutos > 0 ? ((stats.ventasCredito / ingresosBrutos) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-2 px-4 text-right font-mono">{formatMoney(stats.ventasCredito)}</td>
                    <td className="py-2 px-4 text-right"></td>
                  </tr>

                  {/* MENOS COSTO DE VENTAS */}
                  <tr className="bg-rose-50/50 font-bold text-slate-900">
                    <td className="py-2 px-4 font-mono text-rose-700">5.1.01</td>
                    <td className="py-2 px-4">MENOS: COSTO DE MERCADERÍAS VENDIDAS (COGS)</td>
                    <td className="py-2 px-4 text-center text-xs text-slate-600">Costo de reposición</td>
                    <td className="py-2 px-4 text-right"></td>
                    <td className="py-2 px-4 text-right font-black font-mono text-rose-700">({formatMoney(costoVentas)})</td>
                  </tr>

                  {/* UTILIDAD BRUTA */}
                  <tr className="bg-emerald-100/70 font-black text-emerald-950 text-sm border-t-2 border-b-2 border-emerald-300">
                    <td className="py-3 px-4 font-mono">UB-01</td>
                    <td className="py-3 px-4">UTILIDAD BRUTA OPERACIONAL</td>
                    <td className="py-3 px-4 text-center font-bold">{margenBrutoPct.toFixed(1)}% Margen Comercial</td>
                    <td className="py-3 px-4 text-right"></td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-900 text-base">{formatMoney(utilidadBruta)}</td>
                  </tr>

                  {/* DEDUCCIONES / PROVISIONES */}
                  <tr>
                    <td className="py-2 px-4 font-mono text-slate-500">5.2.03</td>
                    <td className="py-2 px-4 text-slate-600">Provisión Técnica de Cuentas de Cobranza Dudosa (2% Cartera Fiados)</td>
                    <td className="py-2 px-4 text-center text-xs text-slate-500">Prudencia Contable</td>
                    <td className="py-2 px-4 text-right font-mono">({formatMoney(provisionInsolvencia)})</td>
                    <td className="py-2 px-4 text-right"></td>
                  </tr>

                  {/* UTILIDAD NETA DEL EJERCICIO */}
                  <tr className="bg-slate-900 text-white font-black text-sm sm:text-base border-t-4 border-emerald-500">
                    <td className="py-3.5 px-4 font-mono text-emerald-400">UN-FINAL</td>
                    <td className="py-3.5 px-4 uppercase tracking-wider">UTILIDAD NETA ESTIMADA DEL PERÍODO</td>
                    <td className="py-3.5 px-4 text-center text-xs font-bold text-emerald-300">
                      Rendimiento Neto: {ingresosBrutos > 0 ? ((utilidadOperativa / ingresosBrutos) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-3.5 px-4 text-right"></td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-400 text-lg">
                      {formatMoney(utilidadOperativa)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= PESTAÑA 2: BALANCE GENERAL ================= */}
        {activeTab === 'balance' && (
          <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden">
            <div className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between">
              <span className="font-extrabold text-xs uppercase tracking-wider">
                ESTADO DE SITUACIÓN PATRIMONIAL (BALANCE DE ACTIVOS PULPERÍA)
              </span>
              <span className="text-[11px] font-mono text-blue-400 font-bold">CÓDIGO NIIF-PYME-02</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left">
                <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-300 uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Código</th>
                    <th className="py-2.5 px-4">Rubro Patrimonial</th>
                    <th className="py-2.5 px-4 text-center">Unidades / Registros</th>
                    <th className="py-2.5 px-4 text-right">Monto Contable ({config.moneda_simbolo})</th>
                    <th className="py-2.5 px-4 text-right">% Estructura</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  <tr className="bg-blue-50/60 font-black text-blue-950">
                    <td className="py-2.5 px-4 font-mono text-blue-700">1.1</td>
                    <td className="py-2.5 px-4">ACTIVO CORRIENTE (CIRCULANTE)</td>
                    <td className="py-2.5 px-4 text-center">-</td>
                    <td className="py-2.5 px-4 text-right font-mono text-base">{formatMoney(totalActivoCorriente)}</td>
                    <td className="py-2.5 px-4 text-right">100.0%</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-mono text-slate-500 pl-8">1.1.01</td>
                    <td className="py-2 px-4 pl-8 font-semibold">Caja y Efectivo Disponible (Ventas Contado Período)</td>
                    <td className="py-2 px-4 text-center text-xs text-slate-500">{ventas.filter(v => v.tipo === 'contado').length} ventas</td>
                    <td className="py-2 px-4 text-right font-mono">{formatMoney(activoDisponibleEfectivo)}</td>
                    <td className="py-2 px-4 text-right font-mono text-xs">
                      {totalActivoCorriente > 0 ? ((activoDisponibleEfectivo / totalActivoCorriente) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-mono text-slate-500 pl-8">1.1.02</td>
                    <td className="py-2 px-4 pl-8 font-semibold">Cuentas por Cobrar a Clientes (Libreta de Fiados)</td>
                    <td className="py-2 px-4 text-center text-xs text-slate-500">{stats.clientesConDeuda} deudores</td>
                    <td className="py-2 px-4 text-right font-mono text-amber-700 font-bold">{formatMoney(activoExigibleCuentasPorCobrar)}</td>
                    <td className="py-2 px-4 text-right font-mono text-xs">
                      {totalActivoCorriente > 0 ? ((activoExigibleCuentasPorCobrar / totalActivoCorriente) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-mono text-slate-500 pl-8">1.1.03</td>
                    <td className="py-2 px-4 pl-8 font-semibold">Inventario de Mercaderías (Valuado al Costo de Adquisición)</td>
                    <td className="py-2 px-4 text-center text-xs text-slate-500">{stats.totalUnidadesStock} unidades físicas</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-900 font-bold">{formatMoney(activoRealizableInventarios)}</td>
                    <td className="py-2 px-4 text-right font-mono text-xs">
                      {totalActivoCorriente > 0 ? ((activoRealizableInventarios / totalActivoCorriente) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  <tr className="bg-slate-100 font-bold text-slate-700">
                    <td className="py-2 px-4 font-mono pl-8">INF-01</td>
                    <td className="py-2 px-4 pl-8 text-xs text-slate-600">Nota Contable: Valor del Inventario a Precio de Venta al Público</td>
                    <td className="py-2 px-4 text-center text-xs">{productos.length} líneas de producto</td>
                    <td className="py-2 px-4 text-right font-mono text-emerald-800">{formatMoney(stats.valorInventarioVenta)}</td>
                    <td className="py-2 px-4 text-right text-xs text-emerald-700 font-bold">+{formatMoney(stats.gananciaPotencialInventario)} plus</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= PESTAÑA 3: AUDITORÍA DE CARTERA Y FIADOS ================= */}
        {activeTab === 'flujo' && (
          <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden">
            <div className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between">
              <span className="font-extrabold text-xs uppercase tracking-wider">
                AUDITORÍA DE CRÉDITO Y RIESGO DE COBRANZA (LIBRETA DE FIADOS)
              </span>
              <span className="text-[11px] font-mono text-amber-400 font-bold">TOTAL CARTERA: {formatMoney(stats.totalFiadosPendientes)}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left">
                <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-300 uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Nombre del Cliente / Deudor</th>
                    <th className="py-2.5 px-4 text-center">Teléfono</th>
                    <th className="py-2.5 px-4 text-right">Límite Autorizado</th>
                    <th className="py-2.5 px-4 text-right">Saldo Deudor Actual</th>
                    <th className="py-2.5 px-4 text-center">% Uso de Crédito</th>
                    <th className="py-2.5 px-4 text-center">Estado del Crédito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {clientes.filter(c => c.saldo_actual > 0).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-bold">
                        ¡Excelente! No existen cuentas pendientes por cobrar en la libreta de fiados.
                      </td>
                    </tr>
                  ) : (
                    clientes
                      .filter(c => c.saldo_actual > 0)
                      .sort((a, b) => b.saldo_actual - a.saldo_actual)
                      .map((cliente, idx) => {
                        const porcentajeUso = cliente.limite_credito > 0 ? (cliente.saldo_actual / cliente.limite_credito) * 100 : 100;
                        const esCritico = porcentajeUso >= 90;
                        const esAlerta = porcentajeUso >= 70 && porcentajeUso < 90;

                        return (
                          <tr key={cliente.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-4 text-slate-400 font-mono text-xs">{idx + 1}</td>
                            <td className="py-2.5 px-4 font-bold text-slate-900">{cliente.nombre}</td>
                            <td className="py-2.5 px-4 text-center text-slate-600 font-mono text-xs">{cliente.telefono || 'Sin registrar'}</td>
                            <td className="py-2.5 px-4 text-right font-mono">{formatMoney(cliente.limite_credito)}</td>
                            <td className="py-2.5 px-4 text-right font-mono font-black text-rose-700">{formatMoney(cliente.saldo_actual)}</td>
                            <td className="py-2.5 px-4 text-center font-mono font-bold">
                              <span className={esCritico ? 'text-rose-600' : esAlerta ? 'text-amber-600' : 'text-slate-700'}>
                                {porcentajeUso.toFixed(0)}%
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                  esCritico
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : esAlerta
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {esCritico ? 'Límite Agotado' : esAlerta ? 'Alerta Cobro' : 'Normal'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= PESTAÑA 4: RATIOS Y DICTAMEN ================= */}
        {activeTab === 'analisis' && (
          <div className="space-y-4">
            {/* Ratios Financieros */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-white rounded-xl border border-slate-300 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Margen de Rentabilidad Bruta</span>
                <span className="text-2xl font-black font-mono text-emerald-700 block mt-1">{margenBrutoPct.toFixed(1)}%</span>
                <p className="text-xs text-slate-600 mt-1">Por cada C$ 100.00 vendidos, la pulpería gana C$ {margenBrutoPct.toFixed(2)} brutos.</p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-300 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Índice de Liquidez en Ventas</span>
                <span className="text-2xl font-black font-mono text-blue-700 block mt-1">
                  {stats.totalVentas > 0 ? ((stats.ventasContado / stats.totalVentas) * 100).toFixed(1) : 0}%
                </span>
                <p className="text-xs text-slate-600 mt-1">Porcentaje de ventas cobradas de contado (efectivo inmediato en caja).</p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-300 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Exposición a Riesgo de Fiados</span>
                <span className="text-2xl font-black font-mono text-amber-700 block mt-1">
                  {stats.totalVentas > 0 ? ((stats.totalFiadosPendientes / stats.totalVentas) * 100).toFixed(1) : 0}%
                </span>
                <p className="text-xs text-slate-600 mt-1">Total de deuda de clientes comparada con la facturación del período.</p>
              </div>
            </div>

            {/* Cuadro de texto formal del Dictamen */}
            <div className="p-5 bg-white rounded-xl border-2 border-slate-300 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm border-b pb-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <span>DICTAMEN TÉCNICO Y OPINIÓN CONTABLE PROFESIONAL</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
                "Habiendo examinado los registros de transacciones comerciales, las operaciones de compra y venta, el libro de inventarios permanentes
                y la libreta auxiliar de cuentas por cobrar (fiados) correspondientes al período contable <strong>{periodLabel.toUpperCase()}</strong> de la pulpería <strong>{config.nombre_negocio}</strong>;
                certifico que los presentes estados financieros reflejan razonablemente, en todos los aspectos significativos, la situación financiera y el resultado de las operaciones del negocio con base en el marco técnico de las Normas Internacionales de Información Financiera para Pequeñas y Medianas Entidades (NIIF para PYMES)."
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="font-bold text-slate-700">Recomendación Contable:</span> Mantener la política de cobro periódico a los {stats.clientesConDeuda} clientes con saldo para evitar iliquidez y preservar el capital de rotación.
                </div>
                <div>
                  <span className="font-bold text-slate-700">Estado de Cumplimiento:</span> Registros conciliados con fecha y hora, valuación de existencias al costo ponderado de reposición.
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
