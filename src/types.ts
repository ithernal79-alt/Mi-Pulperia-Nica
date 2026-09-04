export interface Producto {
  id: string;
  codigo_barras: string;
  nombre: string;
  categoria: string;
  precio_venta: number;
  precio_costo: number;
  stock_actual: number;
  stock_minimo: number;
  unidad_medida: string; // 'unidad', 'libra', 'tarro', 'bolsa', 'litro', 'botella', 'paquete'
  es_frecuente: boolean;
  color_tag?: string;
  marca?: string;
  proveedor?: string;
  estado?: 'Activo' | 'Inactivo' | string;
}

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  limite_credito: number;
  saldo_actual: number; // Saldo deudor pendiente
  direccion_nota?: string;
  fecha_registro: string;
  ultimo_movimiento?: string;
}

export type ActiveTab = 'dashboard' | 'ventas' | 'inventario' | 'categorias' | 'alertas' | 'fiados' | 'reportes';

export interface DetalleVenta {
  id: string;
  venta_id: string;
  producto_id: string;
  producto_nombre: string;
  cantidad: number;
  unidad_medida: string;
  precio_unitario: number;
  precio_costo: number;
  subtotal: number;
}

export interface Venta {
  id: string;
  fecha_hora: string;
  tipo: 'contado' | 'credito';
  cliente_id: string | null;
  cliente_nombre: string | null;
  total: number;
  pago_con: number;
  vuelto: number;
  items: DetalleVenta[];
  ganancia_estimada: number;
}

export type TipoMovimientoCaja = 
  | 'apertura' 
  | 'venta_efectivo' 
  | 'abono_cliente' 
  | 'entrada_dinero' 
  | 'salida_gasto' 
  | 'cierre';

export interface MovimientoCaja {
  id: string;
  fecha_hora: string;
  tipo_movimiento: TipoMovimientoCaja;
  monto: number;
  descripcion: string;
  referencia_id?: string | null; // ID de venta o cliente
  cliente_nombre?: string | null;
}

export interface EntradaMercancia {
  id: string;
  fecha_hora: string;
  proveedor: string;
  numero_factura: string;
  producto_id: string;
  producto_nombre: string;
  cantidad_ingresada: number;
  costo_unitario: number;
  total_costo: number;
  nota?: string;
}

export interface ConfiguracionPulperia {
  nombre_negocio: string;
  propietario: string;
  telefono: string;
  moneda_simbolo: string; // L, $, Q, C$, etc.
  direccion: string;
  mensaje_ticket: string;
  caja_abierta: boolean;
  efectivo_inicial: number;
  fecha_apertura_caja: string;
}

export interface CartItem {
  producto: Producto;
  cantidad: number;
  subtotal: number;
}

export interface VoiceParsedItem {
  raw_text: string;
  producto?: Producto;
  cantidad: number;
  confianza: number;
  unidad?: string;
  matched_name?: string;
}

export interface ResumenCorteCaja {
  fecha: string;
  efectivo_inicial: number;
  total_ventas_efectivo: number;
  total_ventas_credito: number;
  total_abonos_recibidos: number;
  total_salidas_gastos: number;
  total_entradas_extras: number;
  efectivo_esperado_caja: number;
  ganancia_total_dia: number;
  cantidad_transacciones: number;
}
