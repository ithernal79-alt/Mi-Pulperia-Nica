import {
  Producto,
  Cliente,
  Venta,
  DetalleVenta,
  MovimientoCaja,
  EntradaMercancia,
  ConfiguracionPulperia,
  ResumenCorteCaja
} from '../types';
import {
  INITIAL_CONFIG,
  INITIAL_PRODUCTOS,
  INITIAL_CLIENTES,
  INITIAL_MOVIMIENTOS,
  INITIAL_VENTAS
} from '../data/initialData';

const STORAGE_KEYS = {
  PRODUCTOS: 'pulperia_db_v2_productos',
  CLIENTES: 'pulperia_db_v2_clientes',
  VENTAS: 'pulperia_db_v2_ventas',
  MOVIMIENTOS: 'pulperia_db_v2_movimientos',
  ENTRADAS: 'pulperia_db_v2_entradas',
  CONFIG: 'pulperia_db_v2_config',
};

const CATALOG_VERSION = 'v3_278_productos';
const VERSION_KEY = 'pulperia_catalogo_ver';

class LocalDBService {
  constructor() {
    // Inicializar productos si el almacenamiento local está vacío o desactualizado
    try {
      if (typeof window !== 'undefined') {
        const storedVer = localStorage.getItem(VERSION_KEY);
        const storedProds = localStorage.getItem(STORAGE_KEYS.PRODUCTOS);
        
        if (!storedVer || storedVer !== CATALOG_VERSION || !storedProds || storedProds === '[]' || storedProds === 'null') {
          localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(INITIAL_PRODUCTOS));
          localStorage.setItem(VERSION_KEY, CATALOG_VERSION);
        }
      }
    } catch (e) {
      console.warn('Storage init error:', e);
    }
  }

  private getStorage<T>(key: string, defaultVal: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        localStorage.setItem(key, JSON.stringify(defaultVal));
        return defaultVal;
      }
      return JSON.parse(data) as T;
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return defaultVal;
    }
  }

  private setStorage<T>(key: string, val: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      // Dispatch custom storage event for in-tab reactive updates
      window.dispatchEvent(new Event('pulperia_db_updated'));
    } catch (e) {
      console.error(`Error writing ${key} to storage:`, e);
    }
  }

  // --- CONFIGURACIÓN ---
  getConfig(): ConfiguracionPulperia {
    const config = this.getStorage<ConfiguracionPulperia>(STORAGE_KEYS.CONFIG, INITIAL_CONFIG);
    // Garantizar que la moneda por defecto sea en Córdobas nicaragüenses C$
    if (!config.moneda_simbolo || config.moneda_simbolo === 'L') {
      config.moneda_simbolo = 'C$';
      this.setStorage(STORAGE_KEYS.CONFIG, config);
    }
    return config;
  }

  updateConfig(config: Partial<ConfiguracionPulperia>): ConfiguracionPulperia {
    const current = this.getConfig();
    const updated = { ...current, ...config };
    this.setStorage(STORAGE_KEYS.CONFIG, updated);
    return updated;
  }

  // --- PRODUCTOS (Inventario) ---
  getProductos(): Producto[] {
    const list = this.getStorage<Producto[]>(STORAGE_KEYS.PRODUCTOS, INITIAL_PRODUCTOS);
    if ((!list || list.length === 0) && INITIAL_PRODUCTOS.length > 0) {
      this.setStorage(STORAGE_KEYS.PRODUCTOS, INITIAL_PRODUCTOS);
      return INITIAL_PRODUCTOS;
    }
    return list;
  }

  recargarCatalogoBase(): void {
    this.setStorage(STORAGE_KEYS.PRODUCTOS, INITIAL_PRODUCTOS);
  }

  getProductoById(id: string): Producto | undefined {
    return this.getProductos().find(p => p.id === id);
  }

  getProductoByBarcode(barcode: string): Producto | undefined {
    const code = barcode.trim().toLowerCase();
    return this.getProductos().find(p => p.codigo_barras.toLowerCase() === code);
  }

  saveProducto(producto: Producto): void {
    const productos = this.getProductos();
    const idx = productos.findIndex(p => p.id === producto.id);
    if (idx >= 0) {
      productos[idx] = producto;
    } else {
      productos.unshift(producto);
    }
    this.setStorage(STORAGE_KEYS.PRODUCTOS, productos);
  }

  deleteProducto(id: string): void {
    const productos = this.getProductos().filter(p => p.id !== id);
    this.setStorage(STORAGE_KEYS.PRODUCTOS, productos);
  }

  // --- ENTRADA DE MERCANCÍA / COMPRAS PROVEEDORES ---
  getEntradas(): EntradaMercancia[] {
    return this.getStorage<EntradaMercancia[]>(STORAGE_KEYS.ENTRADAS, []);
  }

  registrarEntradaMercancia(entrada: Omit<EntradaMercancia, 'id' | 'fecha_hora'>): EntradaMercancia {
    const now = new Date();
    const newEntrada: EntradaMercancia = {
      ...entrada,
      id: `ENT-${Date.now().toString().slice(-6)}`,
      fecha_hora: now.toISOString().replace('T', ' ').slice(0, 19),
    };

    // 1. Guardar registro de entrada
    const entradas = this.getEntradas();
    entradas.unshift(newEntrada);
    this.setStorage(STORAGE_KEYS.ENTRADAS, entradas);

    // 2. Aumentar stock del producto y actualizar costo
    const productos = this.getProductos();
    const prodIndex = productos.findIndex(p => p.id === entrada.producto_id);
    if (prodIndex >= 0) {
      productos[prodIndex].stock_actual += entrada.cantidad_ingresada;
      if (entrada.costo_unitario > 0) {
        productos[prodIndex].precio_costo = entrada.costo_unitario;
      }
      this.setStorage(STORAGE_KEYS.PRODUCTOS, productos);
    }

    return newEntrada;
  }

  // --- CLIENTES & FIADOS ---
  getClientes(): Cliente[] {
    return this.getStorage<Cliente[]>(STORAGE_KEYS.CLIENTES, INITIAL_CLIENTES);
  }

  getClienteById(id: string): Cliente | undefined {
    return this.getClientes().find(c => c.id === id);
  }

  saveCliente(cliente: Cliente): void {
    const clientes = this.getClientes();
    const idx = clientes.findIndex(c => c.id === cliente.id);
    if (idx >= 0) {
      clientes[idx] = cliente;
    } else {
      clientes.unshift(cliente);
    }
    this.setStorage(STORAGE_KEYS.CLIENTES, clientes);
  }

  deleteCliente(id: string): void {
    const clientes = this.getClientes().filter(c => c.id !== id);
    this.setStorage(STORAGE_KEYS.CLIENTES, clientes);
  }

  registrarAbonoCliente(clienteId: string, montoAbono: number, descripcion?: string): { cliente: Cliente; movimiento: MovimientoCaja } {
    const clientes = this.getClientes();
    const clienteIdx = clientes.findIndex(c => c.id === clienteId);
    if (clienteIdx === -1) {
      throw new Error('Cliente no encontrado');
    }

    const cliente = clientes[clienteIdx];
    const nuevoSaldo = Math.max(0, cliente.saldo_actual - montoAbono);
    cliente.saldo_actual = Number(nuevoSaldo.toFixed(2));
    cliente.ultimo_movimiento = new Date().toISOString().split('T')[0];
    clientes[clienteIdx] = cliente;
    this.setStorage(STORAGE_KEYS.CLIENTES, clientes);

    // Registrar en movimientos de caja (Entra efectivo a la pulpería)
    const now = new Date();
    const movimiento: MovimientoCaja = {
      id: `MOV-${Date.now().toString().slice(-6)}`,
      fecha_hora: now.toISOString().replace('T', ' ').slice(0, 19),
      tipo_movimiento: 'abono_cliente',
      monto: montoAbono,
      descripcion: descripcion || `Abono de ${cliente.nombre} a su cuenta de fiado`,
      referencia_id: cliente.id,
      cliente_nombre: cliente.nombre,
    };

    const movimientos = this.getMovimientos();
    movimientos.unshift(movimiento);
    this.setStorage(STORAGE_KEYS.MOVIMIENTOS, movimientos);

    return { cliente, movimiento };
  }

  // --- VENTAS & DESCUENTO AUTOMÁTICO DE STOCK ---
  getVentas(): Venta[] {
    return this.getStorage<Venta[]>(STORAGE_KEYS.VENTAS, INITIAL_VENTAS);
  }

  registrarVenta(
    tipo: 'contado' | 'credito',
    items: { producto: Producto; cantidad: number; subtotal: number }[],
    total: number,
    pagoCon: number,
    vuelto: number,
    clienteId?: string | null
  ): Venta {
    const now = new Date();
    const ventaId = `V-${Date.now().toString().slice(-5)}`;
    
    // Obtener información del cliente si es al crédito
    let clienteNombre: string | null = 'Cliente Mostrador';
    if (tipo === 'credito' && clienteId) {
      const cliente = this.getClienteById(clienteId);
      if (cliente) {
        clienteNombre = cliente.nombre;
        // Validar límite de crédito
        if (cliente.saldo_actual + total > cliente.limite_credito) {
          console.warn(`Venta supera límite de crédito de ${cliente.nombre}`);
        }
        // Aumentar saldo adeudado del cliente
        cliente.saldo_actual = Number((cliente.saldo_actual + total).toFixed(2));
        cliente.ultimo_movimiento = now.toISOString().split('T')[0];
        this.saveCliente(cliente);
      }
    }

    // Calcular ganancia estimada y armar detalle_ventas
    let gananciaTotal = 0;
    const detalles: DetalleVenta[] = items.map((item, idx) => {
      const gananciaItem = (item.producto.precio_venta - item.producto.precio_costo) * item.cantidad;
      gananciaTotal += gananciaItem;
      return {
        id: `DET-${ventaId}-${idx + 1}`,
        venta_id: ventaId,
        producto_id: item.producto.id,
        producto_nombre: item.producto.nombre,
        cantidad: item.cantidad,
        unidad_medida: item.producto.unidad_medida,
        precio_unitario: item.producto.precio_venta,
        precio_costo: item.producto.precio_costo,
        subtotal: item.subtotal,
      };
    });

    const nuevaVenta: Venta = {
      id: ventaId,
      fecha_hora: now.toISOString().replace('T', ' ').slice(0, 19),
      tipo,
      cliente_id: clienteId || null,
      cliente_nombre: clienteNombre,
      total: Number(total.toFixed(2)),
      pago_con: tipo === 'contado' ? pagoCon : 0,
      vuelto: tipo === 'contado' ? vuelto : 0,
      items: detalles,
      ganancia_estimada: Number(gananciaTotal.toFixed(2)),
    };

    // 1. Guardar la venta en historial
    const ventas = this.getVentas();
    ventas.unshift(nuevaVenta);
    this.setStorage(STORAGE_KEYS.VENTAS, ventas);

    // 2. DESCUENTO AUTOMÁTICO EN TIEMPO REAL DE STOCK
    const productos = this.getProductos();
    items.forEach(item => {
      const prodIdx = productos.findIndex(p => p.id === item.producto.id);
      if (prodIdx >= 0) {
        productos[prodIdx].stock_actual = Math.max(0, productos[prodIdx].stock_actual - item.cantidad);
      }
    });
    this.setStorage(STORAGE_KEYS.PRODUCTOS, productos);

    // 3. Si fue al contado, registrar movimiento de entrada en caja
    if (tipo === 'contado') {
      const movimiento: MovimientoCaja = {
        id: `MOV-${Date.now().toString().slice(-6)}`,
        fecha_hora: now.toISOString().replace('T', ' ').slice(0, 19),
        tipo_movimiento: 'venta_efectivo',
        monto: total,
        descripcion: `Venta al contado #${ventaId}`,
        referencia_id: ventaId,
      };
      const movimientos = this.getMovimientos();
      movimientos.unshift(movimiento);
      this.setStorage(STORAGE_KEYS.MOVIMIENTOS, movimientos);
    }

    return nuevaVenta;
  }

  // --- MOVIMIENTOS DE CAJA & CORTE DIARIO ---
  getMovimientos(): MovimientoCaja[] {
    return this.getStorage<MovimientoCaja[]>(STORAGE_KEYS.MOVIMIENTOS, INITIAL_MOVIMIENTOS);
  }

  registrarMovimientoManual(tipo: 'entrada_dinero' | 'salida_gasto', monto: number, descripcion: string): MovimientoCaja {
    const now = new Date();
    const movimiento: MovimientoCaja = {
      id: `MOV-${Date.now().toString().slice(-6)}`,
      fecha_hora: now.toISOString().replace('T', ' ').slice(0, 19),
      tipo_movimiento: tipo,
      monto,
      descripcion,
    };
    const movimientos = this.getMovimientos();
    movimientos.unshift(movimiento);
    this.setStorage(STORAGE_KEYS.MOVIMIENTOS, movimientos);
    return movimiento;
  }

  getResumenCorteDelDia(fechaFiltro?: string): ResumenCorteCaja {
    const today = fechaFiltro || new Date().toISOString().split('T')[0];
    const config = this.getConfig();
    const movimientos = this.getMovimientos().filter(m => m.fecha_hora.startsWith(today));
    const ventas = this.getVentas().filter(v => v.fecha_hora.startsWith(today));

    let ventasEfectivo = 0;
    let ventasCredito = 0;
    let abonos = 0;
    let salidas = 0;
    let entradasExtras = 0;
    let gananciaTotal = 0;

    ventas.forEach(v => {
      if (v.tipo === 'contado') {
        ventasEfectivo += v.total;
      } else {
        ventasCredito += v.total;
      }
      gananciaTotal += v.ganancia_estimada;
    });

    movimientos.forEach(m => {
      if (m.tipo_movimiento === 'abono_cliente') {
        abonos += m.monto;
      } else if (m.tipo_movimiento === 'salida_gasto') {
        salidas += m.monto;
      } else if (m.tipo_movimiento === 'entrada_dinero') {
        entradasExtras += m.monto;
      }
    });

    const efectivoInicial = config.efectivo_inicial || 0;
    const efectivoEsperado = efectivoInicial + ventasEfectivo + abonos + entradasExtras - salidas;

    return {
      fecha: today,
      efectivo_inicial: efectivoInicial,
      total_ventas_efectivo: Number(ventasEfectivo.toFixed(2)),
      total_ventas_credito: Number(ventasCredito.toFixed(2)),
      total_abonos_recibidos: Number(abonos.toFixed(2)),
      total_salidas_gastos: Number(salidas.toFixed(2)),
      total_entradas_extras: Number(entradasExtras.toFixed(2)),
      efectivo_esperado_caja: Number(efectivoEsperado.toFixed(2)),
      ganancia_total_dia: Number(gananciaTotal.toFixed(2)),
      cantidad_transacciones: ventas.length,
    };
  }

  // --- REINICIAR / RESTAURAR DATOS POR DEFECTO ---
  resetToDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTOS);
    localStorage.removeItem(STORAGE_KEYS.CLIENTES);
    localStorage.removeItem(STORAGE_KEYS.VENTAS);
    localStorage.removeItem(STORAGE_KEYS.MOVIMIENTOS);
    localStorage.removeItem(STORAGE_KEYS.ENTRADAS);
    localStorage.removeItem(STORAGE_KEYS.CONFIG);
    window.dispatchEvent(new Event('pulperia_db_updated'));
  }

  // Exportar base de datos completa como archivo JSON / SQLite compatible
  exportDatabaseJSON(): string {
    const backup = {
      fecha_respaldo: new Date().toISOString(),
      config: this.getConfig(),
      productos: this.getProductos(),
      clientes: this.getClientes(),
      ventas: this.getVentas(),
      movimientos: this.getMovimientos(),
      entradas: this.getEntradas(),
    };
    return JSON.stringify(backup, null, 2);
  }

  importDatabaseJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.productos) this.setStorage(STORAGE_KEYS.PRODUCTOS, data.productos);
      if (data.clientes) this.setStorage(STORAGE_KEYS.CLIENTES, data.clientes);
      if (data.ventas) this.setStorage(STORAGE_KEYS.VENTAS, data.ventas);
      if (data.movimientos) this.setStorage(STORAGE_KEYS.MOVIMIENTOS, data.movimientos);
      if (data.entradas) this.setStorage(STORAGE_KEYS.ENTRADAS, data.entradas);
      if (data.config) this.setStorage(STORAGE_KEYS.CONFIG, data.config);
      return true;
    } catch (e) {
      console.error('Error importing backup:', e);
      return false;
    }
  }
}

export const db = new LocalDBService();
