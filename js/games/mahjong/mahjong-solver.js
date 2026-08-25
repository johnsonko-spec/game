/**
 * Mahjong Solver Engine
 * Checks 17-tile winning hands and calculates 16-tile waiting tiles (聽牌)
 * Taiwanese 16-tile Mahjong (5 Melds + 1 Pair = 17 Tiles, No Seven Pairs)
 */

/**
 * Checks if 17 tiles form a winning hand (5 melds + 1 pair)
 * @param {Array<string>} hand17 
 * @returns {boolean}
 */
function canWin(hand17) {
  if (!hand17 || hand17.length !== 17) return false;

  const counts = new Array(34).fill(0);
  for (const tileId of hand17) {
    const tile = window.MahjongTiles.TILE_MAP[tileId];
    if (!tile) return false;
    counts[tile.index]++;
  }

  // Try each possible pair (雀頭)
  for (let i = 0; i < 34; i++) {
    if (counts[i] >= 2) {
      counts[i] -= 2;
      if (canFormMelds(counts, 5)) {
        return true; // Found a valid 5-meld + 1-pair structure
      }
      counts[i] += 2;
    }
  }

  return false;
}

/**
 * Backtracking algorithm to check if counts can form target number of melds (Chow or Pong)
 * @param {Array<number>} counts 
 * @param {number} meldsNeeded 
 * @returns {boolean}
 */
function canFormMelds(counts, meldsNeeded) {
  if (meldsNeeded === 0) return true;

  // Find first non-zero tile
  let firstIdx = -1;
  for (let i = 0; i < 34; i++) {
    if (counts[i] > 0) {
      firstIdx = i;
      break;
    }
  }

  if (firstIdx === -1) return meldsNeeded === 0;

  // Option 1: Form a Pong (刻子)
  if (counts[firstIdx] >= 3) {
    counts[firstIdx] -= 3;
    if (canFormMelds(counts, meldsNeeded - 1)) {
      counts[firstIdx] += 3;
      return true;
    }
    counts[firstIdx] += 3;
  }

  // Option 2: Form a Chow (順子) - only for number tiles (Wan, Tiao, Bing)
  const tile = window.MahjongTiles.TILE_TYPES[firstIdx];
  if (tile.category !== 'zi' && tile.number <= 7) {
    const idx2 = firstIdx + 1;
    const idx3 = firstIdx + 2;

    const tile2 = window.MahjongTiles.TILE_TYPES[idx2];
    const tile3 = window.MahjongTiles.TILE_TYPES[idx3];

    // Check same category and consecutive numbers
    if (tile2.category === tile.category && tile3.category === tile.category &&
        tile2.number === tile.number + 1 && tile3.number === tile.number + 2) {
      
      if (counts[idx2] > 0 && counts[idx3] > 0) {
        counts[firstIdx]--;
        counts[idx2]--;
        counts[idx3]--;

        if (canFormMelds(counts, meldsNeeded - 1)) {
          counts[firstIdx]++;
          counts[idx2]++;
          counts[idx3]++;
          return true;
        }

        counts[firstIdx]++;
        counts[idx2]++;
        counts[idx3]++;
      }
    }
  }

  return false;
}

/**
 * Finds all waiting tiles for a 16-tile hand
 * @param {Array<string>} hand16 
 * @returns {Array<string>} list of tile IDs that complete a win
 */
function findWaitingTiles(hand16) {
  if (!hand16 || hand16.length !== 16) return [];

  const handCounts = new Array(34).fill(0);
  for (const tileId of hand16) {
    const tile = window.MahjongTiles.TILE_MAP[tileId];
    if (tile) handCounts[tile.index]++;
  }

  const waitingList = [];

  for (let i = 0; i < 34; i++) {
    // Cannot draw a 5th tile of any type
    if (handCounts[i] >= 4) continue;

    const testTile = window.MahjongTiles.TILE_TYPES[i];
    const testHand17 = [...hand16, testTile.id];

    if (canWin(testHand17)) {
      waitingList.push(testTile.id);
    }
  }

  return waitingList;
}

window.MahjongSolver = {
  canWin,
  findWaitingTiles
};
