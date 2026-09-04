/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardModule } from './components/dashboard/DashboardModule';
import { SalesModule } from './components/sales/SalesModule';
import { InventoryModule } from './components/inventory/InventoryModule';
import { CategoriesModule } from './components/categories/CategoriesModule';
import { AlertsModule } from './components/alerts/AlertsModule';
import { CreditModule } from './components/credit/CreditModule';
import { ReportsModule } from './components/reports/ReportsModule';
import { ReceiptModal } from './components/modals/ReceiptModal';
import { BackupModal } from './components/modals/BackupModal';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { db } from './services/db';
import { Producto, Cliente, Venta, MovimientoCaja, ConfiguracionPulperia, ActiveTab } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  // Estados reactivos sincronizados con la Base de Datos SQLite Local
  const [config, setConfig] = useState<ConfiguracionPulperia>(db.getConfig());
  const [productos, setProductos] = useState<Producto[]>(db.getProductos());
  const [clientes, setClientes] = useState<Cliente[]>(db.getClientes());
  const [ventas, setVentas] = useState<Venta[]>(db.getVentas());
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>(db.getMovimientos());

  // Modal states
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);
  const [showBackupModal, setShowBackupModal] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');

  // Recargar datos desde la BD local
  const refreshData = useCallback(() => {
    setConfig(db.getConfig());
    setProductos(db.getProductos());
    setClientes(db.getClientes());
    setVentas(db.getVentas());
    setMovimientos(db.getMovimientos());
  }, []);

  // Escuchar actualizaciones de la base de datos
  useEffect(() => {
    const handleDbUpdate = () => {
      refreshData();
    };

    window.addEventListener('pulperia_db_updated', handleDbUpdate);
    window.addEventListener('storage', handleDbUpdate);

    return () => {
      window.removeEventListener('pulperia_db_updated', handleDbUpdate);
      window.removeEventListener('storage', handleDbUpdate);
    };
  }, [refreshData]);

  // Contadores para badges
  const lowStockCount = productos.filter((p) => p.stock_actual <= p.stock_minimo).length;
  const fiadosCount = clientes.filter((c) => c.saldo_actual > 0).length;

  // Manejador al completar venta
  const handleVentaCompletada = (venta: Venta) => {
    refreshData();
    setActiveReceipt({
      tipo_comprobante: 'VENTA',
      venta,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* 1. TOP HEADER */}
      <Header
        config={config}
        productos={productos}
        clientes={clientes}
        onOpenBackupModal={() => setShowBackupModal(true)}
        onOpenConfigModal={() => setShowBackupModal(true)}
        audioEnabled={audioEnabled}
        onToggleAudio={() => setAudioEnabled(!audioEnabled)}
      />

      {/* 2. SUBHEADER / DESKTOP TAB NAVIGATION */}
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 pt-3">
        <Navigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          lowStockCount={lowStockCount}
          fiadosCount={fiadosCount}
        />
      </div>

      {/* 3. MAIN CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 flex-1 pb-24 lg:pb-8">
        {/* MÓDULO 0: DASHBOARD & INFORMES CON GRÁFICAS */}
        {activeTab === 'dashboard' && (
          <DashboardModule
            ventas={ventas}
            productos={productos}
            clientes={clientes}
            movimientos={movimientos}
            config={config}
            onNavigateToSales={() => setActiveTab('ventas')}
            onNavigateToInventory={() => setActiveTab('inventario')}
            onNavigateToCredit={() => setActiveTab('fiados')}
          />
        )}

        {/* MÓDULO 1: VENTAS CON ENTRADA DE VOZ */}
        {activeTab === 'ventas' && (
          <SalesModule
            productos={productos}
            clientes={clientes}
            config={config}
            initialCategory={categoryFilter}
            onVentaCompletada={handleVentaCompletada}
            audioEnabled={audioEnabled}
          />
        )}

        {/* MÓDULO 2: INVENTARIO & DESCUENTO AUTOMÁTICO */}
        {activeTab === 'inventario' && (
          <InventoryModule
            productos={productos}
            config={config}
            initialCategory={categoryFilter}
            onRefresh={refreshData}
            audioEnabled={audioEnabled}
          />
        )}

        {/* MÓDULO 2.5: CATÁLOGO DE CATEGORÍAS */}
        {activeTab === 'categorias' && (
          <CategoriesModule
            productos={productos}
            config={config}
            onRefresh={refreshData}
            audioEnabled={audioEnabled}
            onNavigateToSales={(cat) => {
              if (cat) setCategoryFilter(cat);
              setActiveTab('ventas');
            }}
            onNavigateToInventory={(cat) => {
              if (cat) setCategoryFilter(cat);
              setActiveTab('inventario');
            }}
          />
        )}

        {/* MÓDULO 3: STOCK & ALERTAS DE ABASTECIMIENTO */}
        {activeTab === 'alertas' && (
          <AlertsModule
            productos={productos}
            config={config}
            onRefresh={refreshData}
            audioEnabled={audioEnabled}
          />
        )}

        {/* MÓDULO 4: CLIENTES DE CRÉDITO (FIADOS) */}
        {activeTab === 'fiados' && (
          <CreditModule
            clientes={clientes}
            ventas={ventas}
            movimientos={movimientos}
            config={config}
            onRefresh={refreshData}
            audioEnabled={audioEnabled}
            onShowReceipt={(receipt) => setActiveReceipt(receipt)}
          />
        )}

        {/* MÓDULO 5: CORTE DE CAJA & REPORTES */}
        {activeTab === 'reportes' && (
          <ReportsModule
            ventas={ventas}
            movimientos={movimientos}
            config={config}
            onRefresh={refreshData}
            audioEnabled={audioEnabled}
            onShowReceipt={(receipt) => setActiveReceipt(receipt)}
          />
        )}
      </main>

      {/* 4. FOOTER STATUS BAR */}
      <footer className="hidden lg:flex bg-white border-t border-slate-200 px-6 py-2.5 items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-800">Sistema 100% Offline</span>
          </div>
          {lowStockCount > 0 ? (
            <div className="flex items-center gap-1.5 text-rose-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span>{lowStockCount} alertas de stock bajo</span>
            </div>
          ) : (
            <div className="text-slate-500">
              <span>Inventario al 100% en niveles de seguridad</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <span>Pulpería: <strong className="text-slate-800 font-semibold">{config.nombre_negocio}</strong></span>
          <span>•</span>
          <span>Propietario: <strong className="text-slate-800 font-semibold">{config.propietario}</strong></span>
        </div>
      </footer>

      {/* 5. MODALS GLOBALES */}
      {activeReceipt && (
        <ReceiptModal
          receiptData={activeReceipt}
          config={config}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      {showBackupModal && (
        <BackupModal
          config={config}
          onClose={() => setShowBackupModal(false)}
          onRefresh={refreshData}
          audioEnabled={audioEnabled}
        />
      )}

      {/* Indicador de estado sin conexión PWA */}
      <OfflineIndicator />

    </div>
  );
}
