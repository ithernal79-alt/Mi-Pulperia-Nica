import React from 'react';
import { 
  BarChart3,
  ShoppingCart, 
  Package, 
  Layers,
  AlertTriangle, 
  Users, 
  Calculator,
  Mic
} from 'lucide-react';
import { ActiveTab } from '../types';
import { LiveClock } from './common/LiveClock';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  lowStockCount: number;
  fiadosCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  lowStockCount,
  fiadosCount,
}) => {
  const tabs = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard & Gráficas',
      shortLabel: 'Dashboard',
      icon: BarChart3,
    },
    {
      id: 'ventas' as ActiveTab,
      label: 'Ventas & Voz',
      shortLabel: 'Ventas',
      icon: ShoppingCart,
      badge: '🎤',
      highlight: true,
    },
    {
      id: 'inventario' as ActiveTab,
      label: 'Inventario',
      shortLabel: 'Inventario',
      icon: Package,
    },
    {
      id: 'categorias' as ActiveTab,
      label: 'Categorías (26)',
      shortLabel: 'Categorías',
      icon: Layers,
      count: 26,
      countColor: 'bg-amber-600 text-white',
    },
    {
      id: 'alertas' as ActiveTab,
      label: 'Stock & Alertas',
      shortLabel: 'Alertas',
      icon: AlertTriangle,
      count: lowStockCount,
      countColor: 'bg-rose-500 text-white',
    },
    {
      id: 'fiados' as ActiveTab,
      label: 'Clientes Fiados',
      shortLabel: 'Fiados',
      icon: Users,
      count: fiadosCount,
      countColor: 'bg-blue-600 text-white',
    },
    {
      id: 'reportes' as ActiveTab,
      label: 'Corte de Caja',
      shortLabel: 'Caja',
      icon: Calculator,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 lg:static lg:bg-white lg:border lg:border-slate-200 lg:rounded-2xl lg:p-1.5 lg:shadow-xs py-2 px-2 sm:px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-around lg:justify-start lg:gap-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col lg:flex-row items-center justify-center gap-1 lg:gap-2 py-1.5 px-3 sm:px-4 lg:py-2.5 lg:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all select-none touch-manipulation flex-1 lg:flex-initial ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[10px] font-black shadow-xs ${tab.countColor}`}>
                    {tab.count}
                  </span>
                )}
              </div>
              <span className="leading-tight">
                <span className="lg:hidden">{tab.shortLabel}</span>
                <span className="hidden lg:inline">{tab.label}</span>
              </span>
              {tab.badge && !isActive && (
                <span className="hidden xl:inline text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Reloj en vivo en barra de navegación superior en pantallas grandes */}
        <div className="hidden lg:flex ml-auto items-center pl-2">
          <LiveClock compact={false} />
        </div>
      </div>
    </nav>
  );
};
