import React, { useState, useMemo, useRef } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Calendar,
  CreditCard,
  Wallet,
  Clock,
  Printer,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Producto, Cliente, Venta, MovimientoCaja, ConfiguracionPulperia } from '../../types';
import { LiveClock } from '../common/LiveClock';

interface DashboardModuleProps {
  ventas: Venta[];
  productos: Producto[];
  clientes: Cliente[];
  movimientos: MovimientoCaja[];
  config: ConfiguracionPulperia;
  onNavigateToSales?: () => void;
  onNavigateToInventory?: () => void;
  onNavigateToCredit?: () => void;
}

type PeriodFilter = 'hoy' | '7d' | '30d' | 'todo';

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  ventas,
  productos,
  clientes,
  movimientos,
  config,
  onNavigateToSales,
  onNavigateToInventory,
  onNavigateToCredit
}) => {
  const [period, setPeriod] = useState<PeriodFilter>('7d');
  const printRef = useRef<HTMLDivElement>(null);

  // Formateador de moneda en Córdobas Nicaragüenses (C$)
  const formatMoney = (amount: number) => {
    return `${config.moneda_simbolo} ${amount.toLocaleString('es-NI', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Filtrado de ventas por período
  const filteredVentas = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (period === 'hoy') {
      return ventas.filter(v => v.fecha_hora.startsWith(todayStr));
    }

    if (period === '7d') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
      return ventas.filter(v => v.fecha_hora >= sevenDaysAgoStr);
    }

    if (period === '30d') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      return ventas.filter(v => v.fecha_hora >= thirtyDaysAgoStr);
    }

    return ventas;
  }, [ventas, period]);

  // Métricas principales
  const stats = useMemo(() => {
    const totalVentas = filteredVentas.reduce((sum, v) => sum + v.total, 0);
    const gananciaTotal = filteredVentas.reduce((sum, v) => sum + (v.ganancia_estimada || 0), 0);
    const totalTransacciones = filteredVentas.length;
    const ticketPromedio = totalTransacciones > 0 ? totalVentas / totalTransacciones : 0;
    const margenPorcentaje = totalVentas > 0 ? (gananciaTotal / totalVentas) * 100 : 0;

    // Ventas por tipo
    const ventasContado = filteredVentas.filter(v => v.tipo === 'contado').reduce((sum, v) => sum + v.total, 0);
    const ventasCredito = filteredVentas.filter(v => v.tipo === 'credito').reduce((sum, v) => sum + v.total, 0);

    // Cuentas por cobrar
    const totalFiadosPendientes = clientes.reduce((sum, c) => sum + c.saldo_actual, 0);
    const clientesConDeuda = clientes.filter(c => c.saldo_actual > 0).length;

    // Valoración del inventario actual
    const valorInventarioVenta = productos.reduce((sum, p) => sum + (p.precio_venta * p.stock_actual), 0);
    const valorInventarioCosto = productos.reduce((sum, p) => sum + (p.precio_costo * p.stock_actual), 0);
    const gananciaPotencialInventario = valorInventarioVenta - valorInventarioCosto;
    const totalUnidadesStock = productos.reduce((sum, p) => sum + p.stock_actual, 0);

    return {
      totalVentas,
      gananciaTotal,
      totalTransacciones,
      ticketPromedio,
      margenPorcentaje,
      ventasContado,
      ventasCredito,
      totalFiadosPendientes,
      clientesConDeuda,
      valorInventarioVenta,
      valorInventarioCosto,
      gananciaPotencialInventario,
      totalUnidadesStock
    };
  }, [filteredVentas, clientes, productos]);

  // Datos para gráfico de tendencia de ventas (Día a Día)
  const timelineData = useMemo(() => {
    const map = new Map<string, { fecha: string; label: string; ventas: number; ganancia: number; contado: number; credito: number }>();

    // Ordenar de más antigua a más reciente
    const sorted = [...filteredVentas].sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora));

    sorted.forEach(v => {
      const dateKey = v.fecha_hora.split(' ')[0];
      const parts = dateKey.split('-');
      const shortLabel = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateKey;

      if (!map.has(dateKey)) {
        map.set(dateKey, {
          fecha: dateKey,
          label: shortLabel,
          ventas: 0,
          ganancia: 0,
          contado: 0,
          credito: 0
        });
      }

      const item = map.get(dateKey)!;
      item.ventas += v.total;
      item.ganancia += (v.ganancia_estimada || 0);
      if (v.tipo === 'contado') item.contado += v.total;
      else item.credito += v.total;
    });

    return Array.from(map.values());
  }, [filteredVentas]);

  // Datos para distribución por método de pago (Donut Chart)
  const paymentTypeData = useMemo(() => {
    const contado = stats.ventasContado;
    const credito = stats.ventasCredito;

    if (contado === 0 && credito === 0) {
      return [
        { name: 'Contado (Efectivo)', value: 0, color: '#10B981' },
        { name: 'Crédito (Fiado)', value: 0, color: '#3B82F6' }
      ];
    }

    return [
      { name: 'Contado (Efectivo)', value: Number(contado.toFixed(2)), color: '#059669' },
      { name: 'Crédito (Fiado)', value: Number(credito.toFixed(2)), color: '#2563EB' }
    ];
  }, [stats.ventasContado, stats.ventasCredito]);

  // Top 5 Productos más vendidos
  const topProductsData = useMemo(() => {
    const productSales = new Map<string, { id: string; nombre: string; cantidad: number; total: number; unidad: string }>();

    filteredVentas.forEach(v => {
      v.items.forEach(item => {
        if (!productSales.has(item.producto_id)) {
          productSales.set(item.producto_id, {
            id: item.producto_id,
            nombre: item.producto_nombre,
            cantidad: 0,
            total: 0,
            unidad: item.unidad_medida
          });
        }
        const p = productSales.get(item.producto_id)!;
        p.cantidad += item.cantidad;
        p.total += item.subtotal;
      });
    });

    return Array.from(productSales.values())
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 6);
  }, [filteredVentas]);

  // Ventas agrupadas por categoría
  const categoryData = useMemo(() => {
    const map = new Map<string, { categoria: string; total: number; unidades: number }>();

    filteredVentas.forEach(v => {
      v.items.forEach(item => {
        const prod = productos.find(p => p.id === item.producto_id);
        const cat = prod?.categoria || 'Abarrotes y Varios';

        if (!map.has(cat)) {
          map.set(cat, { categoria: cat, total: 0, unidades: 0 });
        }
        const c = map.get(cat)!;
        c.total += item.subtotal;
        c.unidades += item.cantidad;
      });
    });

    const colors = ['#059669', '#2563EB', '#D97706', '#9333EA', '#DC2626', '#0891B2', '#4F46E5', '#EA580C'];

    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .map((item, idx) => ({
        ...item,
        total: Number(item.total.toFixed(2)),
        color: colors[idx % colors.length]
      }));
  }, [filteredVentas, productos]);

  // Horas pico de venta
  const hourlyData = useMemo(() => {
    const hoursCount: { [hour: string]: number } = {
      '06:00': 0, '07:00': 0, '08:00': 0, '09:00': 0, '10:00': 0, '11:00': 0,
      '12:00': 0, '13:00': 0, '14:00': 0, '15:00': 0, '16:00': 0, '17:00': 0,
      '18:00': 0, '19:00': 0, '20:00': 0, '21:00': 0
    };

    filteredVentas.forEach(v => {
      const timePart = v.fecha_hora.split(' ')[1];
      if (timePart) {
        const hour = timePart.split(':')[0] + ':00';
        if (hoursCount[hour] !== undefined) {
          hoursCount[hour] += v.total;
        }
      }
    });

    return Object.entries(hoursCount).map(([hora, total]) => ({
      hora,
      total: Number(total.toFixed(2))
    }));
  }, [filteredVentas]);

  // Clientes con mayor deuda de fiado
  const topDebtors = useMemo(() => {
    return [...clientes]
      .filter(c => c.saldo_actual > 0)
      .sort((a, b) => b.saldo_actual - a.saldo_actual)
      .slice(0, 5);
  }, [clientes]);

  // Imprimir reporte
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. HEADER DE INFORME & FILTROS DE TIEMPO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Dashboard & Informe Financiero</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {config.moneda_simbolo} (NIO)
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Métricas en tiempo real en <strong>Córdobas Nicaragüenses</strong> • {config.nombre_negocio}
              </p>
            </div>
          </div>
        </div>

        {/* Filtros de período y acción de imprimir */}
        <div className="flex items-center flex-wrap gap-2">
          <LiveClock compact={false} />

          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setPeriod('hoy')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === 'hoy'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setPeriod('7d')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === '7d'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Días
            </button>
            <button
              onClick={() => setPeriod('30d')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === '30d'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Días
            </button>
            <button
              onClick={() => setPeriod('todo')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === 'todo'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todo
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
            title="Imprimir o guardar reporte PDF"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Imprimir Informe</span>
          </button>
        </div>
      </div>

      {/* 2. TARJETAS KPI PRINCIPALES */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* KPI 1: Ventas Totales */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Ventas Totales
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight block">
              {formatMoney(stats.totalVentas)}
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
              <span>{stats.totalTransacciones} ventas registradas</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Ganancia Neta Estimada */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Ganancia Neta
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-blue-700 font-mono tracking-tight block">
              {formatMoney(stats.gananciaTotal)}
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
              <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">
                {stats.margenPorcentaje.toFixed(1)}% Margen
              </span>
              <span>utilidad estimada</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Cuentas por Cobrar (Fiados) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Fiados Pendientes
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-amber-700 font-mono tracking-tight block">
              {formatMoney(stats.totalFiadosPendientes)}
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>{stats.clientesConDeuda} clientes con saldo</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Valoración de Inventario */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Valor en Inventario
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight block">
              {formatMoney(stats.valorInventarioVenta)}
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
              <span>Costo: {formatMoney(stats.valorInventarioCosto)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. GRÁFICOS PRINCIPALES: TENDENCIA & MÉTODO DE PAGO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* GRÁFICO 1: Evolución de Ventas y Ganancias (2 Columnas) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Evolución de Ventas y Ganancias</span>
              </h3>
              <p className="text-xs text-slate-500">
                Flujo diario expresado en {config.moneda_simbolo} (Córdobas)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                <span className="font-semibold text-slate-700">Ventas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
                <span className="font-semibold text-slate-700">Ganancia</span>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {timelineData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <BarChart3 className="w-10 h-10 text-slate-400 mb-2" />
                <p className="font-bold text-slate-700 text-sm">Sin ventas en este período</p>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Las gráficas se actualizarán dinámicamente cada vez que registres una venta.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorGanancia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `${config.moneda_simbolo}${val}`} />
                  <Tooltip
                    formatter={(val: any) => [`${config.moneda_simbolo} ${Number(val).toFixed(2)}`, '']}
                    labelFormatter={(label) => `Fecha: ${label}`}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="ventas"
                    name="Ventas Totales"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorVentas)"
                  />
                  <Area
                    type="monotone"
                    dataKey="ganancia"
                    name="Ganancia Neta"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorGanancia)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* GRÁFICO 2: Distribución Contado vs Fiado (1 Columna) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-blue-600" />
              <span>Contado vs. Crédito Fiado</span>
            </h3>
            <p className="text-xs text-slate-500 mb-2">
              Distribución del ingreso por modalidad de cobro
            </p>
          </div>

          <div className="h-48 sm:h-52 w-full flex items-center justify-center relative">
            {stats.totalVentas === 0 ? (
              <div className="text-center p-4">
                <p className="text-xs font-semibold text-slate-500">Sin datos de cobro aún</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${config.moneda_simbolo} ${Number(val).toFixed(2)}`, 'Monto']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      fontSize: '11px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Leyenda y detalles */}
          <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span className="text-slate-700 font-medium">Contado (Efectivo)</span>
              </div>
              <span className="font-black font-mono text-slate-900">
                {formatMoney(stats.ventasContado)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span className="text-slate-700 font-medium">Crédito (Fiado)</span>
              </div>
              <span className="font-black font-mono text-slate-900">
                {formatMoney(stats.ventasCredito)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 4. SEGUNDA FILA DE GRÁFICOS: TOP PRODUCTOS & CATEGORÍAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* GRÁFICO 3: Top Productos Más Vendidos */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                <span>Productos Más Vendidos</span>
              </h3>
              <p className="text-xs text-slate-500">
                Artículos con mayor rotación en unidades
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            {topProductsData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Package className="w-8 h-8 text-slate-400 mb-2" />
                <p className="font-bold text-slate-700 text-xs">No hay ventas registradas</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProductsData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    dataKey="nombre"
                    type="category"
                    stroke="#475569"
                    fontSize={11}
                    tickLine={false}
                    width={110}
                    tickFormatter={(val) => (val.length > 14 ? `${val.substring(0, 14)}...` : val)}
                  />
                  <Tooltip
                    formatter={(val: any, name: any, item: any) => [
                      `${val} unidades (${config.moneda_simbolo} ${item.payload.total.toFixed(2)})`,
                      'Cantidad'
                    ]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      fontSize: '11px'
                    }}
                  />
                  <Bar dataKey="cantidad" fill="#059669" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* GRÁFICO 4: Ventas por Categoría */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Ingresos por Categoría</span>
              </h3>
              <p className="text-xs text-slate-500">
                Contribución de cada rubro en ventas ({config.moneda_simbolo})
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            {categoryData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Layers className="w-8 h-8 text-slate-400 mb-2" />
                <p className="font-bold text-slate-700 text-xs">Sin categorías procesadas aún</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="categoria"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `${config.moneda_simbolo}${val}`} />
                  <Tooltip
                    formatter={(val: any) => [`${config.moneda_simbolo} ${Number(val).toFixed(2)}`, 'Total']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      fontSize: '11px'
                    }}
                  />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* 5. RESUMEN OPERATIVO & SALUD DE CRÉDITOS FIADOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Tabla: Clientes con mayor saldo pendiente */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              <span>Cuentas por Cobrar Clave</span>
            </h3>
            {onNavigateToCredit && (
              <button
                onClick={onNavigateToCredit}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <span>Ver Libreta Completa</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {topDebtors.length === 0 ? (
            <div className="p-6 text-center bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <p className="text-xs font-bold text-emerald-900">¡Libreta de fiados al día!</p>
              <p className="text-[11px] text-slate-500">No hay deudas pendientes en este momento.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {topDebtors.map(cliente => (
                <div key={cliente.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">{cliente.nombre}</h4>
                    <p className="text-[11px] text-slate-500">{cliente.telefono} • Límite: {formatMoney(cliente.limite_credito)}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black font-mono text-sm text-amber-700 block">
                      {formatMoney(cliente.saldo_actual)}
                    </span>
                    <span className="text-[10px] text-slate-400">Saldo pendiente</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumen de Inventario y Salud Financiera */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>Resumen Ejecutivo de Negocio</span>
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200">
              <span className="text-slate-600 font-medium">Margen Promedio de Ganancia:</span>
              <span className="font-black font-mono text-emerald-700 text-sm">
                {stats.margenPorcentaje.toFixed(1)}%
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200">
              <span className="text-slate-600 font-medium">Ticket Promedio por Cliente:</span>
              <span className="font-black font-mono text-slate-900 text-sm">
                {formatMoney(stats.ticketPromedio)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200">
              <span className="text-slate-600 font-medium">Total de Artículos en Stock Físico:</span>
              <span className="font-black font-mono text-slate-900 text-sm">
                {stats.totalUnidadesStock} unidades ({productos.length} productos)
              </span>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl flex items-center justify-between border border-emerald-200">
              <span className="text-emerald-900 font-medium">Utilidad Potencial en Stock:</span>
              <span className="font-black font-mono text-emerald-800 text-sm">
                {formatMoney(stats.gananciaPotencialInventario)}
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
