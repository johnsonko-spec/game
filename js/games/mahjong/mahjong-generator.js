/**
 * Mahjong Daily Puzzle Generator
 * Generates seed-based daily mahjong waiting tile puzzles with difficulty filtering
 */

/**
 * Generate a random 17-tile winning hand using given PRNG
 * @param {Function} rng 
 * @returns {Array<string>|null}
 */
function buildRandomWinningHand(rng) {
  const counts = new Array(34).fill(0);
  const tiles = window.MahjongTiles.TILE_TYPES;

  function canAdd(tileIndex, count = 1) {
    return counts[tileIndex] + count <= 4;
  }

  // 1. Pick a Pair (雀頭)
  const pairCandidates = [];
  for (let i = 0; i < 34; i++) pairCandidates.push(i);
  // Shuffle pair candidates
  for (let i = pairCandidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pairCandidates[i], pairCandidates[j]] = [pairCandidates[j], pairCandidates[i]];
  }

  let pairIdx = -1;
  for (const idx of pairCandidates) {
    if (canAdd(idx, 2)) {
      pairIdx = idx;
      counts[idx] += 2;
      break;
    }
  }
  if (pairIdx === -1) return null;

  // 2. Pick 5 Melds (面子 - Chow or Pong)
  let meldsAdded = 0;
  let attempts = 0;

  while (meldsAdded < 5 && attempts < 100) {
    attempts++;
    const isChow = rng() < 0.6; // 60% Chow, 40% Pong for more complex shapes

    if (isChow) {
      // Pick random number tile start (1~7)
      const categories = ['wan', 'tiao', 'bing'];
      const cat = categories[Math.floor(rng() * categories.length)];
      const num = Math.floor(rng() * 7) + 1; // 1 ~ 7
      
      const t1 = tiles.find(t => t.category === cat && t.number === num);
      const t2 = tiles.find(t => t.category === cat && t.number === num + 1);
      const t3 = tiles.find(t => t.category === cat && t.number === num + 2);

      if (t1 && t2 && t3 && canAdd(t1.index) && canAdd(t2.index) && canAdd(t3.index)) {
        counts[t1.index]++;
        counts[t2.index]++;
        counts[t3.index]++;
        meldsAdded++;
      }
    } else {
      // Pong
      const randomIdx = Math.floor(rng() * 34);
      if (canAdd(randomIdx, 3)) {
        counts[randomIdx] += 3;
        meldsAdded++;
      }
    }
  }

  if (meldsAdded < 5) return null;

  // Flatten counts to 17 tiles array
  const hand17 = [];
  for (let i = 0; i < 34; i++) {
    for (let c = 0; c < counts[i]; c++) {
      hand17.push(tiles[i].id);
    }
  }

  return hand17;
}

/**
 * Check if candidate hand meets difficulty criteria for mahjong veterans (1-2s thought required)
 * @param {Array<string>} hand16 
 * @param {Array<string>} waitingList 
 * @returns {boolean}
 */
function meetsDifficultyCriteria(hand16, waitingList) {
  // 1. Must have at least 2 waiting tiles (多面聽: 2~9 聽)
  if (waitingList.length < 2) return false;

  // 2. Hand must involve at least 2 categories (萬/條/餅/字)
  const categories = new Set(hand16.map(id => window.MahjongTiles.TILE_MAP[id].category));
  if (categories.size < 2) return false;

  // 3. Exclude hands where waiting tiles are too trivially obvious (e.g. 15 single cards)
  // Check if hand has interesting combinations (e.g. at least 3 waiting tiles OR 2+ composite waits)
  if (waitingList.length >= 3) return true;

  // If 2 waiting tiles, make sure they are not just a simple double-sided wait like 2m3m (waiting 1m, 4m)
  // Check if waiting tiles belong to different suits or involve honours
  const waitCats = new Set(waitingList.map(id => window.MahjongTiles.TILE_MAP[id].category));
  if (waitCats.size > 1) return true; // e.g. waiting for a Wan AND a Tiao or Honour

  // If wait tiles are same suit, check distance between them (e.g. not consecutive 1-4, but like 1-7 or 2-5)
  const waitNums = waitingList.map(id => window.MahjongTiles.TILE_MAP[id].number).sort((a, b) => a - b);
  if (waitNums.length >= 2 && Math.abs(waitNums[1] - waitNums[0]) >= 3) {
    return true; // Non-adjacent wait
  }

  return false;
}

/**
 * Generate daily mahjong puzzle based on date string
 * @param {string} dateStr YYYY-MM-DD
 * @returns {{ hand: Array<string>, answers: Array<string>, date: string }}
 */
function generateDailyPuzzle(dateStr) {
  const seed = window.DailySeed.getSeedFromDate(dateStr);
  const rng = window.DailySeed.createSeededRandom(seed);

  let hand16 = null;
  let waitingList = [];
  let maxAttempts = 500;

  while (maxAttempts-- > 0) {
    const hand17 = buildRandomWinningHand(rng);
    if (!hand17) continue;

    // Remove 1 tile randomly
    const removeIdx = Math.floor(rng() * 17);
    const candidate16 = [...hand17];
    candidate16.splice(removeIdx, 1);

    // Solve waiting tiles
    const waits = window.MahjongSolver.findWaitingTiles(candidate16);

    // Check difficulty
    if (meetsDifficultyCriteria(candidate16, waits)) {
      hand16 = candidate16;
      waitingList = waits;
      break;
    }
  }

  // Fallback fallback if high difficulty constraints fail (safeguard)
  if (!hand16) {
    // Standard default complex puzzle: 1m 2m 3m 4m 5m 6m 7m 8m 9m 1s 2s 3s 4s 5s 6s 7s (Nine Gates variant waiting 1s, 4s, 7s)
    hand16 = ['1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m', '1s', '2s', '3s', '4s', '5s', '6s', '7s'];
    waitingList = window.MahjongSolver.findWaitingTiles(hand16);
  }

  const sortedHand = window.MahjongTiles.sortHand(hand16);

  return {
    hand: sortedHand,
    answers: waitingList,
    date: dateStr
  };
}

window.MahjongGenerator = {
  generateDailyPuzzle
};
