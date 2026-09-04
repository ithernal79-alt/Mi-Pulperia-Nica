import { Producto, Cliente, ConfiguracionPulperia, MovimientoCaja, Venta } from '../types';
import { LISTA_PRODUCTOS_PULPERIA } from './listaProductos';

export const INITIAL_CONFIG: ConfiguracionPulperia = {
  nombre_negocio: "Mi Pulpería",
  propietario: "",
  telefono: "",
  moneda_simbolo: "C$", // Córdobas nicaragüenses (C$)
  direccion: "",
  mensaje_ticket: "¡Gracias por su compra! Vuelva pronto.",
  caja_abierta: true,
  efectivo_inicial: 0.00,
  fecha_apertura_caja: new Date().toISOString().split('T')[0] + ' 08:00:00',
};

// Catálogo completo de productos para la base de datos de la pulpería
export const INITIAL_PRODUCTOS: Producto[] = LISTA_PRODUCTOS_PULPERIA;

// Lista de clientes limpia para registrar nuevos fiados
export const INITIAL_CLIENTES: Cliente[] = [];

// Movimientos de caja iniciales limpios
export const INITIAL_MOVIMIENTOS: MovimientoCaja[] = [];

// Historial de ventas limpio
export const INITIAL_VENTAS: Venta[] = [];

