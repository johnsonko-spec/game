/**
 * Daily Seed & Seeded PRNG Generator (Mulberry32)
 */

/**
 * Gets local date string in YYYY-MM-DD format
 * @param {Date} [date] 
 * @returns {string}
 */
function getTodayDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts date string into a 32-bit integer seed
 * @param {string} dateStr 
 * @returns {number}
 */
function getSeedFromDate(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Returns a Mulberry32 seeded random function returning numbers between 0 and 1
 * @param {number} seed 
 * @returns {() => number}
 */
function createSeededRandom(seed) {
  let s = seed | 0;
  return function() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

window.DailySeed = {
  getTodayDateString,
  getSeedFromDate,
  createSeededRandom
};
