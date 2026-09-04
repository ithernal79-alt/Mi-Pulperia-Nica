import { Producto } from '../types';

interface RawItem {
  categoria: string;
  nombre: string;
  unidad_medida: string;
  precio_venta: number;
  precio_costo: number;
  es_frecuente?: boolean;
}

const RAW_PRODUCTOS: RawItem[] = [
  // Granos básicos (15)
  { categoria: 'Granos básicos', nombre: 'Arroz', unidad_medida: 'libra', precio_venta: 18.00, precio_costo: 14.50, es_frecuente: true },
  { categoria: 'Granos básicos', nombre: 'Frijoles rojos', unidad_medida: 'libra', precio_venta: 32.00, precio_costo: 26.00, es_frecuente: true },
  { categoria: 'Granos básicos', nombre: 'Frijoles negros', unidad_medida: 'libra', precio_venta: 28.00, precio_costo: 22.00 },
  { categoria: 'Granos básicos', nombre: 'Maíz', unidad_medida: 'libra', precio_venta: 12.00, precio_costo: 9.00 },
  { categoria: 'Granos básicos', nombre: 'Maizena', unidad_medida: 'caja', precio_venta: 15.00, precio_costo: 11.50 },
  { categoria: 'Granos básicos', nombre: 'Avena', unidad_medida: 'bolsa', precio_venta: 20.00, precio_costo: 15.00, es_frecuente: true },
  { categoria: 'Granos básicos', nombre: 'Harina de maíz', unidad_medida: 'bolsa', precio_venta: 25.00, precio_costo: 19.50 },
  { categoria: 'Granos básicos', nombre: 'Harina de trigo', unidad_medida: 'bolsa', precio_venta: 22.00, precio_costo: 17.00 },
  { categoria: 'Granos básicos', nombre: 'Azúcar', unidad_medida: 'libra', precio_venta: 15.00, precio_costo: 12.00, es_frecuente: true },
  { categoria: 'Granos básicos', nombre: 'Sal', unidad_medida: 'bolsa', precio_venta: 10.00, precio_costo: 7.00, es_frecuente: true },
  { categoria: 'Granos básicos', nombre: 'Café molido', unidad_medida: 'bolsa', precio_venta: 45.00, precio_costo: 35.00, es_frecuente: true },
  { categoria: 'Granos básicos', nombre: 'Café instantáneo', unidad_medida: 'tarro', precio_venta: 60.00, precio_costo: 48.00 },
  { categoria: 'Granos básicos', nombre: 'Cacao', unidad_medida: 'bolsa', precio_venta: 35.00, precio_costo: 27.00, es_frecuente: true },
  { categoria: 'Granos básicos', nombre: 'Pinolillo', unidad_medida: 'bolsa', precio_venta: 25.00, precio_costo: 19.00 },
  { categoria: 'Granos básicos', nombre: 'Tiste', unidad_medida: 'bolsa', precio_venta: 25.00, precio_costo: 19.00 },

  // Pastas y sopas (12)
  { categoria: 'Pastas y sopas', nombre: 'Espagueti', unidad_medida: 'bolsa', precio_venta: 14.00, precio_costo: 10.50, es_frecuente: true },
  { categoria: 'Pastas y sopas', nombre: 'Macarrones', unidad_medida: 'bolsa', precio_venta: 14.00, precio_costo: 10.50 },
  { categoria: 'Pastas y sopas', nombre: 'Coditos', unidad_medida: 'bolsa', precio_venta: 14.00, precio_costo: 10.50 },
  { categoria: 'Pastas y sopas', nombre: 'Fideos', unidad_medida: 'bolsa', precio_venta: 12.00, precio_costo: 9.00 },
  { categoria: 'Pastas y sopas', nombre: 'Lasagna', unidad_medida: 'caja', precio_venta: 65.00, precio_costo: 50.00 },
  { categoria: 'Pastas y sopas', nombre: 'Sopa instantánea', unidad_medida: 'paquete', precio_venta: 12.00, precio_costo: 8.50, es_frecuente: true },
  { categoria: 'Pastas y sopas', nombre: 'Sopa en sobre', unidad_medida: 'sobre', precio_venta: 15.00, precio_costo: 11.00, es_frecuente: true },
  { categoria: 'Pastas y sopas', nombre: 'Sopa en vaso', unidad_medida: 'vaso', precio_venta: 25.00, precio_costo: 19.00 },
  { categoria: 'Pastas y sopas', nombre: 'Crema instantánea', unidad_medida: 'sobre', precio_venta: 18.00, precio_costo: 13.50 },
  { categoria: 'Pastas y sopas', nombre: 'Puré de papa', unidad_medida: 'caja', precio_venta: 35.00, precio_costo: 26.00 },
  { categoria: 'Pastas y sopas', nombre: 'Consomé', unidad_medida: 'caja', precio_venta: 20.00, precio_costo: 15.00 },
  { categoria: 'Pastas y sopas', nombre: 'Cubitos de caldo', unidad_medida: 'caja', precio_venta: 15.00, precio_costo: 11.00, es_frecuente: true },

  // Enlatados y conservas (13)
  { categoria: 'Enlatados y conservas', nombre: 'Atún', unidad_medida: 'lata', precio_venta: 38.00, precio_costo: 29.00, es_frecuente: true },
  { categoria: 'Enlatados y conservas', nombre: 'Sardinas', unidad_medida: 'lata', precio_venta: 25.00, precio_costo: 19.00, es_frecuente: true },
  { categoria: 'Enlatados y conservas', nombre: 'Frijoles enlatados', unidad_medida: 'lata', precio_venta: 28.00, precio_costo: 21.00 },
  { categoria: 'Enlatados y conservas', nombre: 'Maíz dulce', unidad_medida: 'lata', precio_venta: 30.00, precio_costo: 22.50 },
  { categoria: 'Enlatados y conservas', nombre: 'Guisantes', unidad_medida: 'lata', precio_venta: 25.00, precio_costo: 18.50 },
  { categoria: 'Enlatados y conservas', nombre: 'Vegetales mixtos', unidad_medida: 'lata', precio_venta: 28.00, precio_costo: 21.00 },
  { categoria: 'Enlatados y conservas', nombre: 'Champiñones', unidad_medida: 'lata', precio_venta: 42.00, precio_costo: 32.00 },
  { categoria: 'Enlatados y conservas', nombre: 'Jalapeños', unidad_medida: 'lata', precio_venta: 25.00, precio_costo: 18.50 },
  { categoria: 'Enlatados y conservas', nombre: 'Pasta de tomate', unidad_medida: 'lata', precio_venta: 18.00, precio_costo: 13.00, es_frecuente: true },
  { categoria: 'Enlatados y conservas', nombre: 'Puré de tomate', unidad_medida: 'lata', precio_venta: 20.00, precio_costo: 15.00 },
  { categoria: 'Enlatados y conservas', nombre: 'Leche evaporada', unidad_medida: 'lata', precio_venta: 32.00, precio_costo: 24.50 },
  { categoria: 'Enlatados y conservas', nombre: 'Leche condensada', unidad_medida: 'lata', precio_venta: 45.00, precio_costo: 34.00 },
  { categoria: 'Enlatados y conservas', nombre: 'Frutas en almíbar', unidad_medida: 'lata', precio_venta: 55.00, precio_costo: 42.00 },

  // Salsas y condimentos (13)
  { categoria: 'Salsas y condimentos', nombre: 'Ketchup', unidad_medida: 'botella', precio_venta: 30.00, precio_costo: 22.50, es_frecuente: true },
  { categoria: 'Salsas y condimentos', nombre: 'Mayonesa', unidad_medida: 'tarro', precio_venta: 35.00, precio_costo: 26.50, es_frecuente: true },
  { categoria: 'Salsas y condimentos', nombre: 'Mostaza', unidad_medida: 'tarro', precio_venta: 25.00, precio_costo: 18.50 },
  { categoria: 'Salsas y condimentos', nombre: 'Salsa picante', unidad_medida: 'botella', precio_venta: 22.00, precio_costo: 16.50 },
  { categoria: 'Salsas y condimentos', nombre: 'Salsa inglesa', unidad_medida: 'botella', precio_venta: 25.00, precio_costo: 18.50 },
  { categoria: 'Salsas y condimentos', nombre: 'Salsa de soya', unidad_medida: 'botella', precio_venta: 28.00, precio_costo: 21.00 },
  { categoria: 'Salsas y condimentos', nombre: 'Vinagre', unidad_medida: 'botella', precio_venta: 20.00, precio_costo: 14.50 },
  { categoria: 'Salsas y condimentos', nombre: 'Sazonador', unidad_medida: 'sobre', precio_venta: 15.00, precio_costo: 11.00 },
  { categoria: 'Salsas y condimentos', nombre: 'Pimienta', unidad_medida: 'bolsa', precio_venta: 10.00, precio_costo: 7.00 },
  { categoria: 'Salsas y condimentos', nombre: 'Comino', unidad_medida: 'bolsa', precio_venta: 10.00, precio_costo: 7.00 },
  { categoria: 'Salsas y condimentos', nombre: 'Orégano', unidad_medida: 'bolsa', precio_venta: 10.00, precio_costo: 7.00 },
  { categoria: 'Salsas y condimentos', nombre: 'Canela', unidad_medida: 'bolsa', precio_venta: 15.00, precio_costo: 10.50 },
  { categoria: 'Salsas y condimentos', nombre: 'Achiote', unidad_medida: 'bolsa', precio_venta: 12.00, precio_costo: 8.50 },

  // Aceites y grasas (8)
  { categoria: 'Aceites y grasas', nombre: 'Aceite vegetal', unidad_medida: 'litro', precio_venta: 48.00, precio_costo: 38.00, es_frecuente: true },
  { categoria: 'Aceites y grasas', nombre: 'Aceite de soya', unidad_medida: 'litro', precio_venta: 45.00, precio_costo: 35.00 },
  { categoria: 'Aceites y grasas', nombre: 'Aceite de canola', unidad_medida: 'litro', precio_venta: 60.00, precio_costo: 47.00 },
  { categoria: 'Aceites y grasas', nombre: 'Aceite de maíz', unidad_medida: 'litro', precio_venta: 65.00, precio_costo: 50.00 },
  { categoria: 'Aceites y grasas', nombre: 'Aceite de oliva', unidad_medida: 'botella', precio_venta: 140.00, precio_costo: 110.00 },
  { categoria: 'Aceites y grasas', nombre: 'Manteca', unidad_medida: 'libra', precio_venta: 25.00, precio_costo: 19.00 },
  { categoria: 'Aceites y grasas', nombre: 'Margarina', unidad_medida: 'unidad', precio_venta: 18.00, precio_costo: 13.50, es_frecuente: true },
  { categoria: 'Aceites y grasas', nombre: 'Mantequilla', unidad_medida: 'unidad', precio_venta: 25.00, precio_costo: 19.00 },

  // Lácteos y huevos (10)
  { categoria: 'Lácteos y huevos', nombre: 'Leche líquida', unidad_medida: 'litro', precio_venta: 36.00, precio_costo: 28.50, es_frecuente: true },
  { categoria: 'Lácteos y huevos', nombre: 'Leche en polvo', unidad_medida: 'bolsa', precio_venta: 85.00, precio_costo: 68.00, es_frecuente: true },
  { categoria: 'Lácteos y huevos', nombre: 'Yogurt', unidad_medida: 'vaso', precio_venta: 25.00, precio_costo: 19.00 },
  { categoria: 'Lácteos y huevos', nombre: 'Yogurt bebible', unidad_medida: 'botella', precio_venta: 35.00, precio_costo: 27.00 },
  { categoria: 'Lácteos y huevos', nombre: 'Queso', unidad_medida: 'libra', precio_venta: 75.00, precio_costo: 60.00, es_frecuente: true },
  { categoria: 'Lácteos y huevos', nombre: 'Queso fresco', unidad_medida: 'libra', precio_venta: 65.00, precio_costo: 52.00 },
  { categoria: 'Lácteos y huevos', nombre: 'Queso crema', unidad_medida: 'tarro', precio_venta: 45.00, precio_costo: 34.00 },
  { categoria: 'Lácteos y huevos', nombre: 'Crema', unidad_medida: 'libra', precio_venta: 40.00, precio_costo: 31.00, es_frecuente: true },
  { categoria: 'Lácteos y huevos', nombre: 'Mantequilla', unidad_medida: 'libra', precio_venta: 50.00, precio_costo: 39.00 },
  { categoria: 'Lácteos y huevos', nombre: 'Huevos', unidad_medida: 'unidad', precio_venta: 6.00, precio_costo: 4.50, es_frecuente: true },

  // Panadería (9)
  { categoria: 'Panadería', nombre: 'Pan simple', unidad_medida: 'unidad', precio_venta: 3.00, precio_costo: 2.00, es_frecuente: true },
  { categoria: 'Panadería', nombre: 'Pan dulce', unidad_medida: 'unidad', precio_venta: 5.00, precio_costo: 3.50, es_frecuente: true },
  { categoria: 'Panadería', nombre: 'Pan de caja', unidad_medida: 'bolsa', precio_venta: 48.00, precio_costo: 38.00, es_frecuente: true },
  { categoria: 'Panadería', nombre: 'Pan integral', unidad_medida: 'bolsa', precio_venta: 55.00, precio_costo: 43.00 },
  { categoria: 'Panadería', nombre: 'Rosquillas', unidad_medida: 'bolsa', precio_venta: 35.00, precio_costo: 26.00, es_frecuente: true },
  { categoria: 'Panadería', nombre: 'Rosquetes', unidad_medida: 'bolsa', precio_venta: 30.00, precio_costo: 22.00 },
  { categoria: 'Panadería', nombre: 'Polvorones', unidad_medida: 'bolsa', precio_venta: 30.00, precio_costo: 22.00 },
  { categoria: 'Panadería', nombre: 'Bizcotelas', unidad_medida: 'bolsa', precio_venta: 30.00, precio_costo: 22.00 },
  { categoria: 'Panadería', nombre: 'Tortillas', unidad_medida: 'unidad', precio_venta: 2.00, precio_costo: 1.20, es_frecuente: true },

  // Galletas y snacks (13)
  { categoria: 'Galletas y snacks', nombre: 'Galletas saladas', unidad_medida: 'paquete', precio_venta: 15.00, precio_costo: 11.00, es_frecuente: true },
  { categoria: 'Galletas y snacks', nombre: 'Galletas dulces', unidad_medida: 'paquete', precio_venta: 15.00, precio_costo: 11.00, es_frecuente: true },
  { categoria: 'Galletas y snacks', nombre: 'Galletas rellenas', unidad_medida: 'paquete', precio_venta: 18.00, precio_costo: 13.50 },
  { categoria: 'Galletas y snacks', nombre: 'Galletas wafer', unidad_medida: 'paquete', precio_venta: 16.00, precio_costo: 12.00 },
  { categoria: 'Galletas y snacks', nombre: 'Crackers', unidad_medida: 'paquete', precio_venta: 20.00, precio_costo: 15.00 },
  { categoria: 'Galletas y snacks', nombre: 'Papas fritas', unidad_medida: 'bolsa', precio_venta: 22.00, precio_costo: 16.00, es_frecuente: true },
  { categoria: 'Galletas y snacks', nombre: 'Tortillitas', unidad_medida: 'bolsa', precio_venta: 15.00, precio_costo: 11.00 },
  { categoria: 'Galletas y snacks', nombre: 'Chicharrones', unidad_medida: 'bolsa', precio_venta: 20.00, precio_costo: 14.50 },
  { categoria: 'Galletas y snacks', nombre: 'Nachos', unidad_medida: 'bolsa', precio_venta: 25.00, precio_costo: 18.50 },
  { categoria: 'Galletas y snacks', nombre: 'Tajadas', unidad_medida: 'bolsa', precio_venta: 18.00, precio_costo: 13.00, es_frecuente: true },
  { categoria: 'Galletas y snacks', nombre: 'Palomitas', unidad_medida: 'bolsa', precio_venta: 15.00, precio_costo: 10.50 },
  { categoria: 'Galletas y snacks', nombre: 'Maní', unidad_medida: 'bolsa', precio_venta: 15.00, precio_costo: 10.50 },
  { categoria: 'Galletas y snacks', nombre: 'Barras de cereal', unidad_medida: 'unidad', precio_venta: 18.00, precio_costo: 13.00 },

  // Bebidas (15)
  { categoria: 'Bebidas', nombre: 'Gaseosa', unidad_medida: 'botella', precio_venta: 25.00, precio_costo: 19.00, es_frecuente: true },
  { categoria: 'Bebidas', nombre: 'Naranjada', unidad_medida: 'botella', precio_venta: 20.00, precio_costo: 15.00 },
  { categoria: 'Bebidas', nombre: 'Limonada', unidad_medida: 'botella', precio_venta: 20.00, precio_costo: 15.00 },
  { categoria: 'Bebidas', nombre: 'Ginger ale', unidad_medida: 'lata', precio_venta: 25.00, precio_costo: 19.00 },
  { categoria: 'Bebidas', nombre: 'Agua mineral', unidad_medida: 'botella', precio_venta: 22.00, precio_costo: 16.50 },
  { categoria: 'Bebidas', nombre: 'Agua saborizada', unidad_medida: 'botella', precio_venta: 20.00, precio_costo: 15.00 },
  { categoria: 'Bebidas', nombre: 'Jugos', unidad_medida: 'botella', precio_venta: 25.00, precio_costo: 18.50, es_frecuente: true },
  { categoria: 'Bebidas', nombre: 'Néctares', unidad_medida: 'lata', precio_venta: 28.00, precio_costo: 21.00 },
  { categoria: 'Bebidas', nombre: 'Bebidas de frutas', unidad_medida: 'botella', precio_venta: 18.00, precio_costo: 13.50 },
  { categoria: 'Bebidas', nombre: 'Bebidas de soya', unidad_medida: 'caja', precio_venta: 35.00, precio_costo: 26.50 },
  { categoria: 'Bebidas', nombre: 'Bebidas de chocolate', unidad_medida: 'caja', precio_venta: 25.00, precio_costo: 19.00 },
  { categoria: 'Bebidas', nombre: 'Bebida energética', unidad_medida: 'lata', precio_venta: 45.00, precio_costo: 33.00 },
  { categoria: 'Bebidas', nombre: 'Bebida isotónica', unidad_medida: 'botella', precio_venta: 35.00, precio_costo: 26.00 },
  { categoria: 'Bebidas', nombre: 'Té frío', unidad_medida: 'botella', precio_venta: 25.00, precio_costo: 18.50 },
  { categoria: 'Bebidas', nombre: 'Café listo para beber', unidad_medida: 'lata', precio_venta: 30.00, precio_costo: 22.50 },

  // Agua (7)
  { categoria: 'Agua', nombre: 'Agua 330 ml', unidad_medida: 'botella', precio_venta: 12.00, precio_costo: 8.50 },
  { categoria: 'Agua', nombre: 'Agua 500/600 ml', unidad_medida: 'botella', precio_venta: 15.00, precio_costo: 10.50, es_frecuente: true },
  { categoria: 'Agua', nombre: 'Agua 1 litro', unidad_medida: 'botella', precio_venta: 22.00, precio_costo: 15.50 },
  { categoria: 'Agua', nombre: 'Agua 1.5 litros', unidad_medida: 'botella', precio_venta: 28.00, precio_costo: 20.00 },
  { categoria: 'Agua', nombre: 'Agua 2 litros', unidad_medida: 'botella', precio_venta: 35.00, precio_costo: 25.00 },
  { categoria: 'Agua', nombre: 'Agua 5 litros', unidad_medida: 'botella', precio_venta: 65.00, precio_costo: 48.00 },
  { categoria: 'Agua', nombre: 'Garrafón', unidad_medida: 'unidad', precio_venta: 80.00, precio_costo: 58.00, es_frecuente: true },

  // Café y té (8)
  { categoria: 'Café y té', nombre: 'Café molido', unidad_medida: 'bolsa', precio_venta: 48.00, precio_costo: 37.00, es_frecuente: true },
  { categoria: 'Café y té', nombre: 'Café instantáneo', unidad_medida: 'tarro', precio_venta: 65.00, precio_costo: 50.00 },
  { categoria: 'Café y té', nombre: 'Azúcar', unidad_medida: 'bolsa', precio_venta: 18.00, precio_costo: 14.00 },
  { categoria: 'Café y té', nombre: 'Sustituto de azúcar', unidad_medida: 'caja', precio_venta: 45.00, precio_costo: 34.00 },
  { categoria: 'Café y té', nombre: 'Crema para café', unidad_medida: 'tarro', precio_venta: 55.00, precio_costo: 42.00 },
  { categoria: 'Café y té', nombre: 'Chocolate en polvo', unidad_medida: 'bolsa', precio_venta: 35.00, precio_costo: 26.50 },
  { categoria: 'Café y té', nombre: 'Cacao', unidad_medida: 'bolsa', precio_venta: 35.00, precio_costo: 27.00 },
  { categoria: 'Café y té', nombre: 'Té', unidad_medida: 'caja', precio_venta: 30.00, precio_costo: 22.00 },

  // Embutidos y carnes (9)
  { categoria: 'Embutidos y carnes', nombre: 'Jamón', unidad_medida: 'libra', precio_venta: 85.00, precio_costo: 68.00, es_frecuente: true },
  { categoria: 'Embutidos y carnes', nombre: 'Mortadela', unidad_medida: 'libra', precio_venta: 45.00, precio_costo: 35.00 },
  { categoria: 'Embutidos y carnes', nombre: 'Salchichas', unidad_medida: 'paquete', precio_venta: 40.00, precio_costo: 31.00, es_frecuente: true },
  { categoria: 'Embutidos y carnes', nombre: 'Chorizo', unidad_medida: 'paquete', precio_venta: 50.00, precio_costo: 39.00 },
  { categoria: 'Embutidos y carnes', nombre: 'Tocino', unidad_medida: 'paquete', precio_venta: 80.00, precio_costo: 62.00 },
  { categoria: 'Embutidos y carnes', nombre: 'Carne molida', unidad_medida: 'libra', precio_venta: 85.00, precio_costo: 68.00 },
  { categoria: 'Embutidos y carnes', nombre: 'Pollo', unidad_medida: 'libra', precio_venta: 45.00, precio_costo: 36.00, es_frecuente: true },
  { categoria: 'Embutidos y carnes', nombre: 'Carne de res', unidad_medida: 'libra', precio_venta: 110.00, precio_costo: 90.00 },
  { categoria: 'Embutidos y carnes', nombre: 'Carne de cerdo', unidad_medida: 'libra', precio_venta: 90.00, precio_costo: 72.00 },

  // Frutas y verduras (16)
  { categoria: 'Frutas y verduras', nombre: 'Tomate', unidad_medida: 'libra', precio_venta: 20.00, precio_costo: 15.00, es_frecuente: true },
  { categoria: 'Frutas y verduras', nombre: 'Cebolla', unidad_medida: 'libra', precio_venta: 25.00, precio_costo: 19.00, es_frecuente: true },
  { categoria: 'Frutas y verduras', nombre: 'Chiltoma', unidad_medida: 'unidad', precio_venta: 5.00, precio_costo: 3.50, es_frecuente: true },
  { categoria: 'Frutas y verduras', nombre: 'Chile', unidad_medida: 'bolsa', precio_venta: 10.00, precio_costo: 7.00 },
  { categoria: 'Frutas y verduras', nombre: 'Ajo', unidad_medida: 'unidad', precio_venta: 8.00, precio_costo: 5.50 },
  { categoria: 'Frutas y verduras', nombre: 'Papa', unidad_medida: 'libra', precio_venta: 22.00, precio_costo: 17.00, es_frecuente: true },
  { categoria: 'Frutas y verduras', nombre: 'Yuca', unidad_medida: 'libra', precio_venta: 12.00, precio_costo: 8.50 },
  { categoria: 'Frutas y verduras', nombre: 'Quequisque', unidad_medida: 'libra', precio_venta: 20.00, precio_costo: 15.00 },
  { categoria: 'Frutas y verduras', nombre: 'Plátano', unidad_medida: 'unidad', precio_venta: 10.00, precio_costo: 7.00, es_frecuente: true },
  { categoria: 'Frutas y verduras', nombre: 'Banano', unidad_medida: 'unidad', precio_venta: 3.00, precio_costo: 2.00, es_frecuente: true },
  { categoria: 'Frutas y verduras', nombre: 'Limón', unidad_medida: 'unidad', precio_venta: 5.00, precio_costo: 3.00 },
  { categoria: 'Frutas y verduras', nombre: 'Naranja', unidad_medida: 'unidad', precio_venta: 5.00, precio_costo: 3.50 },
  { categoria: 'Frutas y verduras', nombre: 'Aguacate', unidad_medida: 'unidad', precio_venta: 25.00, precio_costo: 18.00 },
  { categoria: 'Frutas y verduras', nombre: 'Repollo', unidad_medida: 'unidad', precio_venta: 30.00, precio_costo: 22.00 },
  { categoria: 'Frutas y verduras', nombre: 'Zanahoria', unidad_medida: 'libra', precio_venta: 18.00, precio_costo: 13.50 },
  { categoria: 'Frutas y verduras', nombre: 'Pepino', unidad_medida: 'unidad', precio_venta: 12.00, precio_costo: 8.50 },

  // Limpieza de ropa (9)
  { categoria: 'Limpieza de ropa', nombre: 'Detergente en polvo', unidad_medida: 'bolsa', precio_venta: 35.00, precio_costo: 26.50, es_frecuente: true },
  { categoria: 'Limpieza de ropa', nombre: 'Detergente líquido', unidad_medida: 'botella', precio_venta: 65.00, precio_costo: 50.00 },
  { categoria: 'Limpieza de ropa', nombre: 'Jabón para lavar ropa', unidad_medida: 'unidad', precio_venta: 18.00, precio_costo: 13.50, es_frecuente: true },
  { categoria: 'Limpieza de ropa', nombre: 'Jabón de barra', unidad_medida: 'unidad', precio_venta: 16.00, precio_costo: 12.00 },
  { categoria: 'Limpieza de ropa', nombre: 'Suavizante', unidad_medida: 'botella', precio_venta: 45.00, precio_costo: 34.00 },
  { categoria: 'Limpieza de ropa', nombre: 'Cloro', unidad_medida: 'botella', precio_venta: 22.00, precio_costo: 16.50, es_frecuente: true },
  { categoria: 'Limpieza de ropa', nombre: 'Blanqueador', unidad_medida: 'botella', precio_venta: 25.00, precio_costo: 19.00 },
  { categoria: 'Limpieza de ropa', nombre: 'Quitamanchas', unidad_medida: 'botella', precio_venta: 48.00, precio_costo: 36.00 },
  { categoria: 'Limpieza de ropa', nombre: 'Almidón', unidad_medida: 'tarro', precio_venta: 28.00, precio_costo: 21.00 },

  // Limpieza del hogar (18)
  { categoria: 'Limpieza del hogar', nombre: 'Desinfectante', unidad_medida: 'botella', precio_venta: 35.00, precio_costo: 26.00, es_frecuente: true },
  { categoria: 'Limpieza del hogar', nombre: 'Limpiador multiuso', unidad_medida: 'botella', precio_venta: 42.00, precio_costo: 32.00 },
  { categoria: 'Limpieza del hogar', nombre: 'Limpiavidrios', unidad_medida: 'botella', precio_venta: 45.00, precio_costo: 34.00 },
  { categoria: 'Limpieza del hogar', nombre: 'Desengrasante', unidad_medida: 'botella', precio_venta: 55.00, precio_costo: 42.00 },
  { categoria: 'Limpieza del hogar', nombre: 'Limpiador de baño', unidad_medida: 'botella', precio_venta: 48.00, precio_costo: 36.50 },
  { categoria: 'Limpieza del hogar', nombre: 'Limpiador de pisos', unidad_medida: 'botella', precio_venta: 38.00, precio_costo: 28.50 },
  { categoria: 'Limpieza del hogar', nombre: 'Jabón para platos', unidad_medida: 'tarro', precio_venta: 28.00, precio_costo: 21.00, es_frecuente: true },
  { categoria: 'Limpieza del hogar', nombre: 'Esponjas', unidad_medida: 'unidad', precio_venta: 18.00, precio_costo: 12.50, es_frecuente: true },
  { categoria: 'Limpieza del hogar', nombre: 'Fibras', unidad_medida: 'unidad', precio_venta: 15.00, precio_costo: 10.00 },
  { categoria: 'Limpieza del hogar', nombre: 'Guantes', unidad_medida: 'paquete', precio_venta: 35.00, precio_costo: 25.00 },
  { categoria: 'Limpieza del hogar', nombre: 'Escobas', unidad_medida: 'unidad', precio_venta: 85.00, precio_costo: 65.00 },
  { categoria: 'Limpieza del hogar', nombre: 'Trapeadores', unidad_medida: 'unidad', precio_venta: 95.00, precio_costo: 72.00 },
  { categoria: 'Limpieza del hogar', nombre: 'Recogedores', unidad_medida: 'unidad', precio_venta: 60.00, precio_costo: 45.00 },
  { categoria: 'Limpieza del hogar', nombre: 'Cepillos', unidad_medida: 'unidad', precio_venta: 40.00, precio_costo: 29.00 },
  { categoria: 'Limpieza del hogar', nombre: 'Cubetas', unidad_medida: 'unidad', precio_venta: 75.00, precio_costo: 55.00 },
  { categoria: 'Limpieza del hogar', nombre: 'Bolsas para basura', unidad_medida: 'paquete', precio_venta: 30.00, precio_costo: 22.00 },
  { categoria: 'Limpieza del hogar', nombre: 'Aromatizantes', unidad_medida: 'unidad', precio_venta: 55.00, precio_costo: 41.00 },
  { categoria: 'Limpieza del hogar', nombre: 'Insecticida', unidad_medida: 'unidad', precio_venta: 75.00, precio_costo: 58.00 },

  // Papel y desechables (12)
  { categoria: 'Papel y desechables', nombre: 'Papel higiénico', unidad_medida: 'paquete', precio_venta: 18.00, precio_costo: 13.50, es_frecuente: true },
  { categoria: 'Papel y desechables', nombre: 'Papel toalla', unidad_medida: 'rollo', precio_venta: 35.00, precio_costo: 26.00 },
  { categoria: 'Papel y desechables', nombre: 'Servilletas', unidad_medida: 'paquete', precio_venta: 22.00, precio_costo: 16.00, es_frecuente: true },
  { categoria: 'Papel y desechables', nombre: 'Pañuelos', unidad_medida: 'paquete', precio_venta: 15.00, precio_costo: 10.50 },
  { categoria: 'Papel y desechables', nombre: 'Toallas húmedas', unidad_medida: 'paquete', precio_venta: 45.00, precio_costo: 33.00 },
  { categoria: 'Papel y desechables', nombre: 'Bolsas plásticas', unidad_medida: 'paquete', precio_venta: 20.00, precio_costo: 14.00 },
  { categoria: 'Papel y desechables', nombre: 'Vasos descartables', unidad_medida: 'paquete', precio_venta: 25.00, precio_costo: 18.00 },
  { categoria: 'Papel y desechables', nombre: 'Platos descartables', unidad_medida: 'paquete', precio_venta: 30.00, precio_costo: 22.00 },
  { categoria: 'Papel y desechables', nombre: 'Cubiertos descartables', unidad_medida: 'paquete', precio_venta: 25.00, precio_costo: 18.00 },
  { categoria: 'Papel y desechables', nombre: 'Pajillas', unidad_medida: 'paquete', precio_venta: 15.00, precio_costo: 10.50 },
  { categoria: 'Papel y desechables', nombre: 'Papel aluminio', unidad_medida: 'rollo', precio_venta: 45.00, precio_costo: 33.00 },
  { categoria: 'Papel y desechables', nombre: 'Film plástico', unidad_medida: 'rollo', precio_venta: 40.00, precio_costo: 29.00 },

  // Higiene personal (17)
  { categoria: 'Higiene personal', nombre: 'Jabón de baño', unidad_medida: 'unidad', precio_venta: 22.00, precio_costo: 16.50, es_frecuente: true },
  { categoria: 'Higiene personal', nombre: 'Shampoo', unidad_medida: 'botella', precio_venta: 65.00, precio_costo: 49.00, es_frecuente: true },
  { categoria: 'Higiene personal', nombre: 'Acondicionador', unidad_medida: 'botella', precio_venta: 65.00, precio_costo: 49.00 },
  { categoria: 'Higiene personal', nombre: 'Pasta dental', unidad_medida: 'unidad', precio_venta: 38.00, precio_costo: 28.50, es_frecuente: true },
  { categoria: 'Higiene personal', nombre: 'Cepillo dental', unidad_medida: 'unidad', precio_venta: 20.00, precio_costo: 14.00, es_frecuente: true },
  { categoria: 'Higiene personal', nombre: 'Enjuague bucal', unidad_medida: 'botella', precio_venta: 60.00, precio_costo: 45.00 },
  { categoria: 'Higiene personal', nombre: 'Desodorante', unidad_medida: 'unidad', precio_venta: 45.00, precio_costo: 34.00, es_frecuente: true },
  { categoria: 'Higiene personal', nombre: 'Talco', unidad_medida: 'tarro', precio_venta: 40.00, precio_costo: 29.00 },
  { categoria: 'Higiene personal', nombre: 'Crema corporal', unidad_medida: 'botella', precio_venta: 65.00, precio_costo: 49.00 },
  { categoria: 'Higiene personal', nombre: 'Protector solar', unidad_medida: 'tubo', precio_venta: 120.00, precio_costo: 92.00 },
  { categoria: 'Higiene personal', nombre: 'Vaselina', unidad_medida: 'tarro', precio_venta: 25.00, precio_costo: 18.00 },
  { categoria: 'Higiene personal', nombre: 'Alcohol', unidad_medida: 'botella', precio_venta: 30.00, precio_costo: 22.00, es_frecuente: true },
  { categoria: 'Higiene personal', nombre: 'Gel antibacterial', unidad_medida: 'botella', precio_venta: 28.00, precio_costo: 20.50 },
  { categoria: 'Higiene personal', nombre: 'Algodón', unidad_medida: 'bolsa', precio_venta: 18.00, precio_costo: 13.00 },
  { categoria: 'Higiene personal', nombre: 'Hisopos', unidad_medida: 'caja', precio_venta: 20.00, precio_costo: 14.00 },
  { categoria: 'Higiene personal', nombre: 'Rastrillos', unidad_medida: 'paquete', precio_venta: 35.00, precio_costo: 25.00, es_frecuente: true },
  { categoria: 'Higiene personal', nombre: 'Crema de afeitar', unidad_medida: 'unidad', precio_venta: 65.00, precio_costo: 49.00 },

  // Bebés (11)
  { categoria: 'Bebés', nombre: 'Pañales', unidad_medida: 'paquete', precio_venta: 120.00, precio_costo: 95.00, es_frecuente: true },
  { categoria: 'Bebés', nombre: 'Toallitas húmedas', unidad_medida: 'paquete', precio_venta: 50.00, precio_costo: 38.00, es_frecuente: true },
  { categoria: 'Bebés', nombre: 'Fórmula infantil', unidad_medida: 'lata', precio_venta: 280.00, precio_costo: 230.00 },
  { categoria: 'Bebés', nombre: 'Cereal infantil', unidad_medida: 'caja', precio_venta: 55.00, precio_costo: 42.00 },
  { categoria: 'Bebés', nombre: 'Papillas', unidad_medida: 'tarro', precio_venta: 35.00, precio_costo: 26.00 },
  { categoria: 'Bebés', nombre: 'Biberones', unidad_medida: 'unidad', precio_venta: 65.00, precio_costo: 48.00 },
  { categoria: 'Bebés', nombre: 'Chupetes', unidad_medida: 'unidad', precio_venta: 35.00, precio_costo: 25.00 },
  { categoria: 'Bebés', nombre: 'Talco para bebé', unidad_medida: 'tarro', precio_venta: 45.00, precio_costo: 33.00 },
  { categoria: 'Bebés', nombre: 'Shampoo infantil', unidad_medida: 'botella', precio_venta: 55.00, precio_costo: 41.00 },
  { categoria: 'Bebés', nombre: 'Jabón infantil', unidad_medida: 'unidad', precio_venta: 25.00, precio_costo: 18.00 },
  { categoria: 'Bebés', nombre: 'Crema para bebé', unidad_medida: 'tubo', precio_venta: 60.00, precio_costo: 45.00 },

  // Mascotas (6)
  { categoria: 'Mascotas', nombre: 'Concentrado para perro', unidad_medida: 'libra', precio_venta: 25.00, precio_costo: 19.00, es_frecuente: true },
  { categoria: 'Mascotas', nombre: 'Concentrado para gato', unidad_medida: 'libra', precio_venta: 28.00, precio_costo: 21.00 },
  { categoria: 'Mascotas', nombre: 'Alimento húmedo', unidad_medida: 'lata', precio_venta: 32.00, precio_costo: 24.00 },
  { categoria: 'Mascotas', nombre: 'Galletas para perros', unidad_medida: 'paquete', precio_venta: 45.00, precio_costo: 33.00 },
  { categoria: 'Mascotas', nombre: 'Arena para gatos', unidad_medida: 'bolsa', precio_venta: 95.00, precio_costo: 72.00 },
  { categoria: 'Mascotas', nombre: 'Shampoo para mascotas', unidad_medida: 'botella', precio_venta: 75.00, precio_costo: 55.00 },

  // Primeros auxilios (9)
  { categoria: 'Primeros auxilios', nombre: 'Curitas', unidad_medida: 'caja', precio_venta: 25.00, precio_costo: 18.00, es_frecuente: true },
  { categoria: 'Primeros auxilios', nombre: 'Gasas', unidad_medida: 'paquete', precio_venta: 20.00, precio_costo: 14.50 },
  { categoria: 'Primeros auxilios', nombre: 'Algodón', unidad_medida: 'bolsa', precio_venta: 20.00, precio_costo: 14.50 },
  { categoria: 'Primeros auxilios', nombre: 'Alcohol', unidad_medida: 'botella', precio_venta: 32.00, precio_costo: 23.50, es_frecuente: true },
  { categoria: 'Primeros auxilios', nombre: 'Agua oxigenada', unidad_medida: 'botella', precio_venta: 25.00, precio_costo: 18.00 },
  { categoria: 'Primeros auxilios', nombre: 'Antiséptico', unidad_medida: 'botella', precio_venta: 40.00, precio_costo: 29.50 },
  { categoria: 'Primeros auxilios', nombre: 'Vendas', unidad_medida: 'unidad', precio_venta: 25.00, precio_costo: 18.00 },
  { categoria: 'Primeros auxilios', nombre: 'Esparadrapo', unidad_medida: 'rollo', precio_venta: 30.00, precio_costo: 22.00 },
  { categoria: 'Primeros auxilios', nombre: 'Guantes desechables', unidad_medida: 'paquete', precio_venta: 65.00, precio_costo: 48.00 },

  // Control de plagas (1)
  { categoria: 'Control de plagas', nombre: 'Repelente', unidad_medida: 'botella', precio_venta: 65.00, precio_costo: 49.00 },

  // Ferretería básica (15)
  { categoria: 'Ferretería básica', nombre: 'Velas', unidad_medida: 'paquete', precio_venta: 25.00, precio_costo: 18.00, es_frecuente: true },
  { categoria: 'Ferretería básica', nombre: 'Pilas AA', unidad_medida: 'par', precio_venta: 30.00, precio_costo: 22.00, es_frecuente: true },
  { categoria: 'Ferretería básica', nombre: 'Pilas AAA', unidad_medida: 'par', precio_venta: 30.00, precio_costo: 22.00 },
  { categoria: 'Ferretería básica', nombre: 'Pilas C/D', unidad_medida: 'par', precio_venta: 55.00, precio_costo: 41.00 },
  { categoria: 'Ferretería básica', nombre: 'Bombillos', unidad_medida: 'unidad', precio_venta: 35.00, precio_costo: 25.00, es_frecuente: true },
  { categoria: 'Ferretería básica', nombre: 'Extensión eléctrica', unidad_medida: 'unidad', precio_venta: 85.00, precio_costo: 62.00 },
  { categoria: 'Ferretería básica', nombre: 'Cinta aislante', unidad_medida: 'rollo', precio_venta: 25.00, precio_costo: 18.00 },
  { categoria: 'Ferretería básica', nombre: 'Cinta adhesiva', unidad_medida: 'rollo', precio_venta: 20.00, precio_costo: 14.50 },
  { categoria: 'Ferretería básica', nombre: 'Pegamento', unidad_medida: 'unidad', precio_venta: 25.00, precio_costo: 18.00 },
  { categoria: 'Ferretería básica', nombre: 'Silicón', unidad_medida: 'unidad', precio_venta: 15.00, precio_costo: 10.50 },
  { categoria: 'Ferretería básica', nombre: 'Clavos', unidad_medida: 'libra', precio_venta: 25.00, precio_costo: 18.00 },
  { categoria: 'Ferretería básica', nombre: 'Tornillos', unidad_medida: 'paquete', precio_venta: 20.00, precio_costo: 14.00 },
  { categoria: 'Ferretería básica', nombre: 'Mecate', unidad_medida: 'rollo', precio_venta: 15.00, precio_costo: 10.50 },
  { categoria: 'Ferretería básica', nombre: 'Alambre', unidad_medida: 'rollo', precio_venta: 35.00, precio_costo: 25.00 },
  { categoria: 'Ferretería básica', nombre: 'Adaptadores eléctricos', unidad_medida: 'unidad', precio_venta: 25.00, precio_costo: 18.00 },

  // Papelería (16)
  { categoria: 'Papelería', nombre: 'Cuadernos', unidad_medida: 'unidad', precio_venta: 35.00, precio_costo: 26.00, es_frecuente: true },
  { categoria: 'Papelería', nombre: 'Lapiceros', unidad_medida: 'unidad', precio_venta: 10.00, precio_costo: 6.50, es_frecuente: true },
  { categoria: 'Papelería', nombre: 'Lápices', unidad_medida: 'unidad', precio_venta: 8.00, precio_costo: 5.00 },
  { categoria: 'Papelería', nombre: 'Borradores', unidad_medida: 'unidad', precio_venta: 8.00, precio_costo: 5.00 },
  { categoria: 'Papelería', nombre: 'Sacapuntas', unidad_medida: 'unidad', precio_venta: 10.00, precio_costo: 6.50 },
  { categoria: 'Papelería', nombre: 'Marcadores', unidad_medida: 'paquete', precio_venta: 45.00, precio_costo: 33.00 },
  { categoria: 'Papelería', nombre: 'Crayones', unidad_medida: 'caja', precio_venta: 35.00, precio_costo: 25.00 },
  { categoria: 'Papelería', nombre: 'Colores', unidad_medida: 'caja', precio_venta: 50.00, precio_costo: 37.00 },
  { categoria: 'Papelería', nombre: 'Reglas', unidad_medida: 'unidad', precio_venta: 15.00, precio_costo: 10.00 },
  { categoria: 'Papelería', nombre: 'Pegamento', unidad_medida: 'bote', precio_venta: 20.00, precio_costo: 14.00 },
  { categoria: 'Papelería', nombre: 'Tijeras', unidad_medida: 'unidad', precio_venta: 25.00, precio_costo: 18.00 },
  { categoria: 'Papelería', nombre: 'Cartulina', unidad_medida: 'pliego', precio_venta: 12.00, precio_costo: 8.00 },
  { categoria: 'Papelería', nombre: 'Papel', unidad_medida: 'paquete', precio_venta: 55.00, precio_costo: 42.00 },
  { categoria: 'Papelería', nombre: 'Carpetas', unidad_medida: 'unidad', precio_venta: 15.00, precio_costo: 10.00 },
  { categoria: 'Papelería', nombre: 'Sobres', unidad_medida: 'paquete', precio_venta: 15.00, precio_costo: 10.00 },
  { categoria: 'Papelería', nombre: 'Cinta adhesiva', unidad_medida: 'rollo', precio_venta: 20.00, precio_costo: 14.00 },

  // Tecnología (2)
  { categoria: 'Tecnología', nombre: 'Cable USB', unidad_medida: 'unidad', precio_venta: 65.00, precio_costo: 45.00 },
  { categoria: 'Tecnología', nombre: 'Cargador', unidad_medida: 'unidad', precio_venta: 110.00, precio_costo: 80.00 },

  // Productos nicaragüenses (12)
  { categoria: 'Productos nicaragüenses', nombre: 'Cacao', unidad_medida: 'bolsa', precio_venta: 40.00, precio_costo: 30.00, es_frecuente: true },
  { categoria: 'Productos nicaragüenses', nombre: 'Semilla de jícaro', unidad_medida: 'bolsa', precio_venta: 35.00, precio_costo: 26.00 },
  { categoria: 'Productos nicaragüenses', nombre: 'Rosquillas', unidad_medida: 'bolsa', precio_venta: 40.00, precio_costo: 30.00, es_frecuente: true },
  { categoria: 'Productos nicaragüenses', nombre: 'Rosquetes', unidad_medida: 'bolsa', precio_venta: 35.00, precio_costo: 26.00 },
  { categoria: 'Productos nicaragüenses', nombre: 'Polvorones', unidad_medida: 'bolsa', precio_venta: 35.00, precio_costo: 26.00 },
  { categoria: 'Productos nicaragüenses', nombre: 'Cajeta', unidad_medida: 'unidad', precio_venta: 20.00, precio_costo: 14.50 },
  { categoria: 'Productos nicaragüenses', nombre: 'Dulces tradicionales', unidad_medida: 'paquete', precio_venta: 30.00, precio_costo: 22.00 },
  { categoria: 'Productos nicaragüenses', nombre: 'Queso', unidad_medida: 'libra', precio_venta: 80.00, precio_costo: 65.00, es_frecuente: true },
  { categoria: 'Productos nicaragüenses', nombre: 'Quesillo', unidad_medida: 'unidad', precio_venta: 45.00, precio_costo: 35.00, es_frecuente: true },
  { categoria: 'Productos nicaragüenses', nombre: 'Tortillas', unidad_medida: 'paquete', precio_venta: 24.00, precio_costo: 16.00, es_frecuente: true },
  { categoria: 'Productos nicaragüenses', nombre: 'Chicha', unidad_medida: 'botella', precio_venta: 25.00, precio_costo: 18.00 },
  { categoria: 'Productos nicaragüenses', nombre: 'Café nicaragüense', unidad_medida: 'bolsa', precio_venta: 55.00, precio_costo: 42.00, es_frecuente: true },

  // Servicios (2)
  { categoria: 'Servicios', nombre: 'Recargas celulares', unidad_medida: 'unidad', precio_venta: 50.00, precio_costo: 47.50, es_frecuente: true },
  { categoria: 'Servicios', nombre: 'Pago de servicios', unidad_medida: 'unidad', precio_venta: 20.00, precio_costo: 15.00 }
];

// Mapa de colores temáticos por categoría
export const CATEGORIA_COLORS: Record<string, string> = {
  'Granos básicos': '#D97706',
  'Pastas y sopas': '#EA580C',
  'Enlatados y conservas': '#B45309',
  'Salsas y condimentos': '#DC2626',
  'Aceites y grasas': '#CA8A04',
  'Lácteos y huevos': '#0284C7',
  'Panadería': '#92400E',
  'Galletas y snacks': '#F59E0B',
  'Bebidas': '#059669',
  'Agua': '#06B6D4',
  'Café y té': '#78350F',
  'Embutidos y carnes': '#BE123C',
  'Frutas y verduras': '#16A34A',
  'Limpieza de ropa': '#4F46E5',
  'Limpieza del hogar': '#6366F1',
  'Papel y desechables': '#64748B',
  'Higiene personal': '#0D9488',
  'Bebés': '#EC4899',
  'Mascotas': '#8B5CF6',
  'Primeros auxilios': '#E11D48',
  'Control de plagas': '#334155',
  'Ferretería básica': '#475569',
  'Papelería': '#2563EB',
  'Tecnología': '#1E293B',
  'Productos nicaragüenses': '#047857',
  'Servicios': '#7C3AED',
};

// Lista canónica de las 26 categorías
export const LISTA_CATEGORIAS: string[] = Object.keys(CATEGORIA_COLORS);

// Generar array final de productos tipados para la base de datos
export const LISTA_PRODUCTOS_PULPERIA: Producto[] = RAW_PRODUCTOS.map((item, index) => {
  const num = (index + 1).toString().padStart(4, '0');
  const isService = item.categoria === 'Servicios';
  
  return {
    id: `prod-${num}`,
    codigo_barras: `74300000${num}`,
    nombre: item.nombre,
    categoria: item.categoria,
    precio_venta: item.precio_venta,
    precio_costo: item.precio_costo,
    stock_actual: isService ? 999 : 25,
    stock_minimo: isService ? 0 : 5,
    unidad_medida: item.unidad_medida,
    es_frecuente: !!item.es_frecuente,
    color_tag: CATEGORIA_COLORS[item.categoria] || '#10B981',
    estado: 'Activo'
  };
});
