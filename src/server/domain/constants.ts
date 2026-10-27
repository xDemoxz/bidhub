// Todos los números de negocio del enunciado en UN solo lugar.
//
// ADAPTAR: si la prueba nueva cambia un límite (por ejemplo "máximo 3
// subastas activas" o "extender 10 minutos"), se cambia aquí y todo el
// backend se ajusta, porque ningún otro archivo repite estos valores.

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const RULES = {
  // REGLA 2: el cierre debe estar entre 1 hora y 7 días desde la publicación.
  minAuctionDurationMs: HOUR,
  maxAuctionDurationMs: 7 * DAY,
  // REGLA 4: máximo de subastas activas por vendedor.
  maxActiveAuctionsPerSeller: 5,
  // REGLA 11: si llega una oferta cuando faltan <= 5 minutos, el cierre se
  // extiende 5 minutos más.
  extensionWindowMs: 5 * MINUTE,
  extensionMs: 5 * MINUTE,
} as const;
