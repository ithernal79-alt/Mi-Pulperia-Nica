import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  writeBatch,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Venta, Cliente, Producto, MovimientoCaja } from '../types';

// Inicializar la app de Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Inicializar Firestore con la base de datos provisionada
export const firestore = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || undefined
);

// Habilitar persistencia sin conexión (Offline Persistence) en el navegador
if (typeof window !== 'undefined') {
  try {
    enableIndexedDbPersistence(firestore).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Múltiples pestañas abiertas, persistencia limitada a una pestaña activa.');
      } else if (err.code === 'unimplemented') {
        console.warn('El navegador no soporta IndexedDB persistence.');
      }
    });
  } catch (e) {
    console.warn('Error inicializando persistencia local de Firestore:', e);
  }
}

export type SyncStatus = 'idle' | 'syncing' | 'online' | 'offline' | 'error';

export interface CloudSyncState {
  status: SyncStatus;
  lastSyncTime: string | null;
  pendingCount: number;
  isOnline: boolean;
  errorMessage?: string;
}

class CloudSyncService {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: ((state: CloudSyncState) => void)[] = [];
  private isSyncInProgress = false;
  private lastSyncTime: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.lastSyncTime = localStorage.getItem('pulperia_last_cloud_sync');

      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyState();
        // Sincronizar automáticamente en cuanto se detecta conexión
        this.syncAllToCloud();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyState();
      });
    }
  }

  public subscribe(cb: (state: CloudSyncState) => void) {
    this.listeners.push(cb);
    cb(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public getState(): CloudSyncState {
    const pending = this.getPendingCount();
    return {
      status: this.isSyncInProgress
        ? 'syncing'
        : this.isOnline
        ? 'online'
        : 'offline',
      lastSyncTime: this.lastSyncTime,
      pendingCount: pending,
      isOnline: this.isOnline,
    };
  }

  private notifyState(err?: string) {
    const state = this.getState();
    if (err) state.errorMessage = err;
    this.listeners.forEach((cb) => cb(state));
  }

  public getPendingCount(): number {
    try {
      const pendingVentas = JSON.parse(localStorage.getItem('pulperia_pending_ventas') || '[]');
      const pendingClientes = JSON.parse(localStorage.getItem('pulperia_pending_clientes') || '[]');
      const pendingProds = JSON.parse(localStorage.getItem('pulperia_pending_productos') || '[]');
      return pendingVentas.length + pendingClientes.length + pendingProds.length;
    } catch {
      return 0;
    }
  }

  /**
   * Encolar una venta para sincronización a la nube
   */
  public enqueueVenta(venta: Venta) {
    try {
      const pending: Venta[] = JSON.parse(localStorage.getItem('pulperia_pending_ventas') || '[]');
      const exists = pending.findIndex((v) => v.id === venta.id);
      if (exists >= 0) {
        pending[exists] = venta;
      } else {
        pending.push(venta);
      }
      localStorage.setItem('pulperia_pending_ventas', JSON.stringify(pending));
      this.notifyState();

      if (this.isOnline) {
        this.syncAllToCloud();
      }
    } catch (e) {
      console.error('Error encolando venta:', e);
    }
  }

  /**
   * Encolar un cliente (cambio de saldo o nuevo) para sincronización
   */
  public enqueueCliente(cliente: Cliente) {
    try {
      const pending: Cliente[] = JSON.parse(localStorage.getItem('pulperia_pending_clientes') || '[]');
      const exists = pending.findIndex((c) => c.id === cliente.id);
      if (exists >= 0) {
        pending[exists] = cliente;
      } else {
        pending.push(cliente);
      }
      localStorage.setItem('pulperia_pending_clientes', JSON.stringify(pending));
      this.notifyState();

      if (this.isOnline) {
        this.syncAllToCloud();
      }
    } catch (e) {
      console.error('Error encolando cliente:', e);
    }
  }

  /**
   * Encolar producto actualizado (por ejemplo, stock o código de barras)
   */
  public enqueueProducto(producto: Producto) {
    this.enqueueProductos([producto]);
  }

  /**
   * Encolar lote de productos actualizados o nuevos
   */
  public enqueueProductos(productosBatch: Producto[]) {
    if (!productosBatch || productosBatch.length === 0) return;
    try {
      const pending: Producto[] = JSON.parse(localStorage.getItem('pulperia_pending_productos') || '[]');
      const map = new Map<string, Producto>();
      pending.forEach(p => map.set(p.id, p));
      productosBatch.forEach(p => map.set(p.id, p));
      const updated = Array.from(map.values());

      localStorage.setItem('pulperia_pending_productos', JSON.stringify(updated));
      this.notifyState();

      if (this.isOnline) {
        this.syncAllToCloud();
      }
    } catch (e) {
      console.error('Error encolando productos en lote:', e);
    }
  }

  /**
   * Sube todos los datos pendientes a Firestore por lotes (Batches)
   */
  public async syncAllToCloud(): Promise<{ success: boolean; syncedCount: number; message: string }> {
    if (this.isSyncInProgress) {
      return { success: false, syncedCount: 0, message: 'Sincronización en curso...' };
    }

    if (!navigator.onLine) {
      this.isOnline = false;
      this.notifyState();
      return { success: false, syncedCount: 0, message: 'Sin conexión a internet' };
    }

    this.isSyncInProgress = true;
    this.notifyState();

    let totalSynced = 0;

    try {
      // 1. Sincronizar Ventas
      const pendingVentas: Venta[] = JSON.parse(localStorage.getItem('pulperia_pending_ventas') || '[]');
      if (pendingVentas.length > 0) {
        const batch = writeBatch(firestore);
        for (const venta of pendingVentas) {
          const docRef = doc(firestore, 'ventas', venta.id);
          batch.set(docRef, { ...venta, updatedAt: new Date().toISOString() }, { merge: true });
        }
        await batch.commit();
        totalSynced += pendingVentas.length;
        localStorage.setItem('pulperia_pending_ventas', '[]');
      }

      // 2. Sincronizar Clientes / Fiados
      const pendingClientes: Cliente[] = JSON.parse(localStorage.getItem('pulperia_pending_clientes') || '[]');
      if (pendingClientes.length > 0) {
        const batch = writeBatch(firestore);
        for (const cliente of pendingClientes) {
          const docRef = doc(firestore, 'clientes', cliente.id);
          batch.set(docRef, { ...cliente, updatedAt: new Date().toISOString() }, { merge: true });
        }
        await batch.commit();
        totalSynced += pendingClientes.length;
        localStorage.setItem('pulperia_pending_clientes', '[]');
      }

      // 3. Sincronizar Productos
      const pendingProds: Producto[] = JSON.parse(localStorage.getItem('pulperia_pending_productos') || '[]');
      if (pendingProds.length > 0) {
        const batch = writeBatch(firestore);
        for (const prod of pendingProds) {
          const docRef = doc(firestore, 'productos', prod.id);
          batch.set(docRef, { ...prod, updatedAt: new Date().toISOString() }, { merge: true });
        }
        await batch.commit();
        totalSynced += pendingProds.length;
        localStorage.setItem('pulperia_pending_productos', '[]');
      }

      const nowStr = new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });
      this.lastSyncTime = nowStr;
      localStorage.setItem('pulperia_last_cloud_sync', nowStr);

      this.isSyncInProgress = false;
      this.notifyState();

      return {
        success: true,
        syncedCount: totalSynced,
        message: totalSynced > 0 ? `Se sincronizaron ${totalSynced} registros en la nube` : 'Todo al día en la nube',
      };
    } catch (error: any) {
      console.error('Error sincronizando a Firebase:', error);
      this.isSyncInProgress = false;
      this.notifyState(error.message || 'Error en la sincronización');
      return { success: false, syncedCount: totalSynced, message: error.message || 'Error de sincronización' };
    }
  }

  /**
   * Respaldo completo manual: sube todo el catálogo, clientes y ventas existentes a la nube
   */
  public async backupEntireDatabase(allVentas: Venta[], allClientes: Cliente[], allProds: Producto[]): Promise<{ success: boolean; message: string }> {
    if (!navigator.onLine) {
      return { success: false, message: 'Se requiere conexión a internet para el respaldo completo.' };
    }

    this.isSyncInProgress = true;
    this.notifyState();

    try {
      // Subir clientes
      const chunkSize = 400;
      for (let i = 0; i < allClientes.length; i += chunkSize) {
        const chunk = allClientes.slice(i, i + chunkSize);
        const batch = writeBatch(firestore);
        chunk.forEach((c) => {
          batch.set(doc(firestore, 'clientes', c.id), { ...c, updatedAt: new Date().toISOString() }, { merge: true });
        });
        await batch.commit();
      }

      // Subir ventas
      for (let i = 0; i < allVentas.length; i += chunkSize) {
        const chunk = allVentas.slice(i, i + chunkSize);
        const batch = writeBatch(firestore);
        chunk.forEach((v) => {
          batch.set(doc(firestore, 'ventas', v.id), { ...v, updatedAt: new Date().toISOString() }, { merge: true });
        });
        await batch.commit();
      }

      // Subir productos
      for (let i = 0; i < allProds.length; i += chunkSize) {
        const chunk = allProds.slice(i, i + chunkSize);
        const batch = writeBatch(firestore);
        chunk.forEach((p) => {
          batch.set(doc(firestore, 'productos', p.id), { ...p, updatedAt: new Date().toISOString() }, { merge: true });
        });
        await batch.commit();
      }

      const nowStr = new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });
      this.lastSyncTime = nowStr;
      localStorage.setItem('pulperia_last_cloud_sync', nowStr);
      localStorage.setItem('pulperia_pending_ventas', '[]');
      localStorage.setItem('pulperia_pending_clientes', '[]');
      localStorage.setItem('pulperia_pending_productos', '[]');

      this.isSyncInProgress = false;
      this.notifyState();

      return { success: true, message: 'Respaldo completo guardado en Firebase en la nube con éxito' };
    } catch (e: any) {
      this.isSyncInProgress = false;
      this.notifyState(e.message);
      return { success: false, message: e.message || 'Error al respaldar en la nube' };
    }
  }
}

export const cloudSync = new CloudSyncService();
