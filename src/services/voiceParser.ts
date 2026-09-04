import { Producto, VoiceParsedItem } from '../types';

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
  'diecisiete': 17,
  'dieciocho': 18,
  'diecinueve': 19,
  'veinte': 20,
  'veinticinco': 25,
  'treinta': 30,
  'cincuenta': 50,
  'cien': 100,
  'medio': 1,
  'media': 1,
};

const STOP_WORDS = new Set([
  'de', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'e', 'con', 
  'por', 'para', 'favor', 'dame', 'pon', 'quiero', 'agrega', 'sumame', 'mete',
  'al', 'carrito', 'tarro', 'tarros', 'libra', 'libras', 'kilo', 'kilos', 'litro', 
  'litros', 'bolsa', 'bolsas', 'botella', 'botellas', 'paquete', 'paquetes', 'unid', 'unidades'
]);

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents for matching
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parsea un segmento de texto individual (e.g. "dos tarros de leche")
 */
export function parseSingleItemPhrase(phrase: string, catalog: Producto[]): VoiceParsedItem {
  const normPhrase = normalizeText(phrase);
  const words = normPhrase.split(' ');

  let quantity = 1;
  let parsedUnit = '';
  let wordsForProduct: string[] = [];

  // Check initial quantity
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const twoWords = i < words.length - 1 ? `${word} ${words[i + 1]}` : '';

    if (twoWords in SPANISH_NUMBER_WORDS) {
      quantity = SPANISH_NUMBER_WORDS[twoWords];
      i++; // skip next word
      continue;
    } else if (word in SPANISH_NUMBER_WORDS) {
      quantity = SPANISH_NUMBER_WORDS[word];
      continue;
    } else if (!isNaN(Number(word)) && Number(word) > 0) {
      quantity = Number(word);
      continue;
    }

    // Units
    if (['tarro', 'tarros', 'libra', 'libras', 'litro', 'litros', 'bolsa', 'bolsas', 'botella', 'botellas', 'carton', 'cartones', 'paquete', 'paquetes'].includes(word)) {
      parsedUnit = word;
      continue;
    }

    wordsForProduct.push(word);
  }

  // Si no quedaron palabras, intentar con la frase original
  if (wordsForProduct.length === 0) {
    wordsForProduct = words;
  }

  const queryKeywords = wordsForProduct.filter(w => !STOP_WORDS.has(w) && isNaN(Number(w)));
  const searchStr = queryKeywords.join(' ');

  // Fuzzy score matching with catalog
  let bestMatch: Producto | undefined;
  let highestScore = 0;

  for (const prod of catalog) {
    const prodNorm = normalizeText(prod.nombre + ' ' + prod.categoria);
    const prodWords = prodNorm.split(' ');
    
    let score = 0;

    // Exact full name match bonus
    if (prodNorm.includes(searchStr) && searchStr.length > 2) {
      score += 10;
    }

    // Keyword hits
    queryKeywords.forEach(kw => {
      if (prodWords.some(pw => pw.includes(kw) || kw.includes(pw))) {
        score += 3;
      }
    });

    // Unit match bonus
    if (parsedUnit && prodNorm.includes(parsedUnit)) {
      score += 2;
    }

    // Specific pulpería common alias matches
    if (searchStr.includes('coca') || searchStr.includes('refresco')) {
      if (prodNorm.includes('coca')) score += 5;
    }
    if (searchStr.includes('leche')) {
      if (parsedUnit.includes('tarro') && prodNorm.includes('polvo')) score += 6;
      if (parsedUnit.includes('litro') && prodNorm.includes('liquida')) score += 6;
    }
    if (searchStr.includes('huevo') || searchStr.includes('huevos')) {
      if (parsedUnit.includes('carton') && prodNorm.includes('carton')) score += 6;
      if (!parsedUnit.includes('carton') && prodNorm.includes('individual')) score += 4;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = prod;
    }
  }

  return {
    raw_text: phrase,
    producto: highestScore >= 3 ? bestMatch : undefined,
    cantidad: quantity,
    confianza: highestScore,
    unidad: parsedUnit,
    matched_name: bestMatch?.nombre,
  };
}

/**
 * Parsea una frase hablada compleja con múltiples productos
 * Ej: "Dos tarros de leche y una libra de arroz con una coca cola"
 */
export function parseVoiceOrder(speechText: string, catalog: Producto[]): {
  items: VoiceParsedItem[];
  clienteTarget?: string;
} {
  const cleanSpeech = speechText.trim();
  if (!cleanSpeech) return { items: [] };

  // Detectar si va dirigido a un cliente / fiado: "al fiado de Don Juan", "cuenta de María"
  let clienteTarget: string | undefined;
  const clienteMatch = cleanSpeech.match(/(?:al fiado de|a la cuenta de|para)\s+([A-Za-zÁÉÍÓÚáéíóúñÑ\s]+?)(?:,|y\s+dos|y\s+un|y\s+\d|\s+me das|\s+dame|$)/i);
  if (clienteMatch && clienteMatch[1]) {
    clienteTarget = clienteMatch[1].trim();
  }

  // Dividir por conectores en español: ' y ', ',', ' mas ', ' con ', ' tambien '
  const phrases = cleanSpeech
    .replace(/(?:al fiado de|a la cuenta de)\s+[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+/i, '')
    .split(/,|\s+y\s+|\s+mas\s+|\s+con\s+|\s+tambien\s+|\s+e\s+/i)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const parsedItems: VoiceParsedItem[] = [];

  for (const phrase of phrases) {
    const parsed = parseSingleItemPhrase(phrase, catalog);
    if (parsed.producto) {
      parsedItems.push(parsed);
    } else {
      // Intentar una segunda pasada si la frase no encontró nada
      const alt = parseSingleItemPhrase(phrase.replace(/(dame|quiero|ponme|agrega)\s+/gi, ''), catalog);
      if (alt.producto) {
        parsedItems.push(alt);
      } else {
        parsedItems.push(parsed);
      }
    }
  }

  return {
    items: parsedItems,
    clienteTarget,
  };
}
