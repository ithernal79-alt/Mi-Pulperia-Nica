import { Producto } from '../types';
import { LISTA_CATEGORIAS } from '../data/listaProductos';

export interface InventoryVoiceCommand {
  rawText: string;
  action: 'ADD_STOCK' | 'NEW_PRODUCT' | 'UPDATE_PRICE' | 'UNKNOWN';
  productoExistente?: Producto;
  cantidad: number;
  precioVenta?: number;
  precioCosto?: number;
  categoriaSugerida?: string;
  nombreSugerido?: string;
  unidadMedida?: string;
  resumen: string;
}

const SPANISH_NUMBER_WORDS: Record<string, number> = {
  'un': 1,
  'uno': 1,
  'una': 1,
  'dos': 2,
  'tres': 3,
  'cuatro': 4,
  'cinco': 5,
  'seis': 6,
  'siete': 7,
  'ocho': 8,
  'nueve': 9,
  'diez': 10,
  'once': 11,
  'doce': 12,
  'docena': 12,
  'media docena': 6,
  'trece': 13,
  'catorce': 14,
  'quince': 15,
  'dieciseis': 16,
  'dieciséis': 16,
  'veinte': 20,
  'veinticuatro': 24,
  'veinticinco': 25,
  'treinta': 30,
  'cuarenta': 40,
  'cincuenta': 50,
  'cien': 100,
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sugiere una de las 37 categorías basadas en palabras clave
 */
export function sugerirCategoria(nombre: string): string {
  const norm = normalizeText(nombre);

  if (/arroz|frijol|frijoles|maiz|avena|cebada|trigo|sorgo/.test(norm)) return 'Granos básicos';
  if (/harina|maseca|pancake|maizena/.test(norm)) return 'Harinas';
  if (/azucar|sal|miel|endulzante|dulce/.test(norm)) return 'Azúcar, sal y endulzantes';
  if (/aceite|manteca|margarina|mantequilla/.test(norm)) return 'Aceites y grasas';
  if (/pasta|espagueti|codito|macarron|fideo/.test(norm)) return 'Pastas';
  if (/sopa|maruchan|ramen|maggi|consome|sopita/.test(norm)) return 'Sopas y alimentos instantáneos';
  if (/atun|sardina|enlatado|chile|jalapeno|maiz dulce|guisante/.test(norm)) return 'Enlatados';
  if (/salsa|ketchup|mostaza|mayonesa|chiltoma|tabasco/.test(norm)) return 'Salsas';
  if (/pimienta|comino|oregano|curi|canela|especias|achiote/.test(norm)) return 'Especias y condimentos';
  if (/cafe|presto|nescafe|cacao|pinolillo|te|tiste/.test(norm)) return 'Café, cacao y bebidas calientes';
  if (/leche|queso|cuajada|crema|natilla|yogurt|mora/.test(norm)) return 'Lácteos';
  if (/huevo|huevos/.test(norm)) return 'Huevos';
  if (/pan|pan dulce|reposteria|pico|baguette|torta/.test(norm)) return 'Panadería';
  if (/galleta|oreo|club social|chiky|maria|wafer/.test(norm)) return 'Galletas';
  if (/chiveria|platanitos|churros|yuca|chicharron|papas|doritos|snack/.test(norm)) return 'Chiverías / Bocadillos';
  if (/confite|dulce|caramelo|chicle|paleta|bombom/.test(norm)) return 'Confitería';
  if (/coca|pepsi|roji|fanta|sprite|gaseosa|kolashanpan/.test(norm)) return 'Gaseosas';
  if (/agua|purificada|botellon|hielo/.test(norm)) return 'Agua';
  if (/jugo|nectar|valle|tampico|fresca/.test(norm)) return 'Jugos y bebidas';
  if (/monster|red bull|raptor|electrolit|gatorade|volt/.test(norm)) return 'Energizantes e isotónicas';
  if (/carne|pollo|salchicha|jamon|mortadela|chorizo/.test(norm)) return 'Carnes y embutidos';
  if (/detergente|jabon|xedex|ariel|rinso|suavitel|cloro/.test(norm)) return 'Detergentes';
  if (/desinfectante|fabuloso|escoba|trapeador|esponja|limpieza/.test(norm)) return 'Limpieza del hogar';
  if (/papel higienico|toalla|servilleta|vaso desechable|plato/.test(norm)) return 'Papel y desechables';
  if (/pasta dental|shampoo|desodorante|toalla sanitaria|cepillo/.test(norm)) return 'Higiene personal';
  if (/panal|panales|toallitas|talco|biberon/.test(norm)) return 'Productos para bebés';
  if (/perro|gato|alpo|concentrado|pet|mascota/.test(norm)) return 'Mascotas';
  if (/baygon|raid|insecticida|plaga|mata moscas/.test(norm)) return 'Insecticidas';
  if (/curita|alcohol|gasas|aspirina|panadol|acetaminofen/.test(norm)) return 'Primeros auxilios';
  if (/fosforo|vela|candela|encendedor|bateria|pila/.test(norm)) return 'Productos de uso diario';
  if (/bombillo|foco|tomacorriente|alambre|cinta/.test(norm)) return 'Electricidad básica';
  if (/clavo|tornillo|martillo|lija|pega/.test(norm)) return 'Ferretería básica';
  if (/cuaderno|lapiz|lapicero|borrador|sacapunta|regla|papel/.test(norm)) return 'Papelería';
  if (/recarga|minutos|claro|tigo|servicio/.test(norm)) return 'Servicios';

  return 'Granos básicos';
}

export function parseInventoryVoiceCommand(raw: string, catalog: Producto[]): InventoryVoiceCommand {
  const norm = normalizeText(raw);
  const words = norm.split(' ');

  const isExplicitNew = /nuevo producto|crear producto|registrar producto|meter producto/.test(norm);

  // 1. Extraer cantidad
  let cantidad = 1;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const nextW = i < words.length - 1 ? `${w} ${words[i + 1]}` : '';

    if (nextW in SPANISH_NUMBER_WORDS) {
      cantidad = SPANISH_NUMBER_WORDS[nextW];
      break;
    } else if (w in SPANISH_NUMBER_WORDS) {
      cantidad = SPANISH_NUMBER_WORDS[w];
      break;
    } else if (!isNaN(Number(w)) && Number(w) > 0 && Number(w) < 10000) {
      // Excluir si viene inmediatamente después de "precio", "venta" o "costo"
      const prevW = i > 0 ? words[i - 1] : '';
      if (!['precio', 'venta', 'costo', 'valor', 'a'].includes(prevW)) {
        cantidad = Number(w);
        break;
      }
    }
  }

  // 2. Extraer precios si se mencionan
  let precioVenta: number | undefined;
  let precioCosto: number | undefined;

  const ventaMatch = norm.match(/(?:precio venta|venta|vender a|precio de|precio)\s+(?:de\s+)?(\d+(?:\.\d+)?)/);
  if (ventaMatch) {
    precioVenta = parseFloat(ventaMatch[1]);
  }

  const costoMatch = norm.match(/(?:costo|compra|precio costo|comprado a)\s+(?:de\s+)?(\d+(?:\.\d+)?)/);
  if (costoMatch) {
    precioCosto = parseFloat(costoMatch[1]);
  }

  // 3. Buscar coincidencia en productos existentes si no es explícito 'nuevo'
  let matchedProduct: Producto | undefined;
  let highestScore = 0;

  // Filtrar palabras que no son parte del nombre
  const ignoreKeywords = new Set([
    'llegaron', 'llego', 'llegaron', 'entrada', 'sumar', 'agrega', 'agregar', 'nuevo', 'producto',
    'crear', 'registrar', 'unidades', 'piezas', 'libras', 'kilos', 'litros', 'cajas', 'docenas',
    'de', 'la', 'el', 'los', 'las', 'un', 'una', 'dos', 'tres', 'precio', 'venta', 'costo', 'en',
    'al', 'inventario', 'stock', 'por', 'favor'
  ]);

  const searchWords = words.filter(w => !ignoreKeywords.has(w) && isNaN(Number(w)));
  const searchStr = searchWords.join(' ');

  if (!isExplicitNew && searchWords.length > 0) {
    for (const prod of catalog) {
      const prodNorm = normalizeText(prod.nombre);
      const prodWords = prodNorm.split(' ');
      let score = 0;

      if (prodNorm.includes(searchStr) && searchStr.length > 2) {
        score += 15;
      }

      searchWords.forEach(kw => {
        if (prodWords.some(pw => pw.includes(kw) || kw.includes(pw))) {
          score += 4;
        }
      });

      if (score > highestScore && score >= 4) {
        highestScore = score;
        matchedProduct = prod;
      }
    }
  }

  // Determinar acción
  if (matchedProduct && !isExplicitNew) {
    return {
      rawText: raw,
      action: 'ADD_STOCK',
      productoExistente: matchedProduct,
      cantidad,
      precioVenta: precioVenta || matchedProduct.precio_venta,
      precioCosto: precioCosto || matchedProduct.precio_costo,
      resumen: `Sumar ${cantidad} unidades a "${matchedProduct.nombre}" (Stock actual: ${matchedProduct.stock_actual} -> ${matchedProduct.stock_actual + cantidad})`,
    };
  }

  // Es un nuevo producto o no se encontró en catálogo
  const cleanName = searchWords.length > 0 
    ? searchWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : raw;

  const catSugerida = sugerirCategoria(cleanName);

  return {
    rawText: raw,
    action: 'NEW_PRODUCT',
    nombreSugerido: cleanName || 'Nuevo Producto',
    cantidad: cantidad || 10,
    precioVenta: precioVenta || 20,
    precioCosto: precioCosto || (precioVenta ? Number((precioVenta * 0.8).toFixed(2)) : 15),
    categoriaSugerida: catSugerida,
    unidadMedida: /libra|libras/.test(norm) ? 'libra' : /litro|litros/.test(norm) ? 'litro' : 'unidad',
    resumen: `Crear nuevo producto: "${cleanName}" en categoría "${catSugerida}" con ${cantidad} unidades`,
  };
}
