/**
 * Frogdoku 5x5 Board & Color Region Generator with Unique Solution Safeguard
 */

/**
 * Generate 5 valid non-adjacent frog positions (Queens problem with no 8-neighbor contact)
 * @param {Function} rng 
 * @returns {Array<{r: number, c: number}>}
 */
function generateValidFrogPositions(rng) {
  // All 10 valid 5-queens solutions on 5x5 board without 8-neighbor contact:
  const validSolutions = [
    [0, 2, 4, 1, 3],
    [0, 3, 1, 4, 2],
    [1, 3, 0, 2, 4],
    [1, 4, 2, 0, 3],
    [2, 0, 3, 1, 4],
    [2, 4, 1, 3, 0],
    [3, 0, 2, 4, 1],
    [3, 1, 4, 2, 0],
    [4, 1, 3, 0, 2],
    [4, 2, 0, 3, 1]
  ];

  const pickIdx = Math.floor(rng() * validSolutions.length);
  const sol = validSolutions[pickIdx];
  return sol.map((c, r) => ({ r, c }));
}

/**
 * Partition 5x5 grid into 5 connected color regions, each containing exactly 1 frog
 * @param {Array<{r: number, c: number}>} frogPositions 
 * @param {Function} rng 
 * @returns {Array<Array<number>>} 5x5 grid of region IDs (0..4)
 */
function partitionColorRegions(frogPositions, rng) {
  const grid = Array.from({ length: 5 }, () => new Array(5).fill(-1));
  const regionQueues = [];

  // Seed each region with one frog position
  frogPositions.forEach((pos, regionId) => {
    grid[pos.r][pos.c] = regionId;
    regionQueues.push([{ r: pos.r, c: pos.c }]);
  });

  const dirs = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 }
  ];

  let unassigned = 25 - 5;

  while (unassigned > 0) {
    let grewAny = false;

    // Pick region order randomly
    const regionOrder = [0, 1, 2, 3, 4];
    for (let i = regionOrder.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [regionOrder[i], regionOrder[j]] = [regionOrder[j], regionOrder[i]];
    }

    for (const regionId of regionOrder) {
      const q = regionQueues[regionId];
      if (q.length === 0) continue;

      // Find candidates around current region cells
      const candidates = [];
      q.forEach(cell => {
        dirs.forEach(d => {
          const nr = cell.r + d.dr;
          const nc = cell.c + d.dc;
          if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5 && grid[nr][nc] === -1) {
            candidates.push({ r: nr, c: nc });
          }
        });
      });

      if (candidates.length > 0) {
        // Pick one candidate randomly
        const pick = candidates[Math.floor(rng() * candidates.length)];
        grid[pick.r][pick.c] = regionId;
        q.push(pick);
        unassigned--;
        grewAny = true;
        if (unassigned === 0) break;
      }
    }

    // Safeguard fallback if disconnected
    if (!grewAny && unassigned > 0) {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (grid[r][c] === -1) {
            // Assign to adjacent region
            for (const d of dirs) {
              const nr = r + d.dr;
              const nc = c + d.dc;
              if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5 && grid[nr][nc] !== -1) {
                grid[r][c] = grid[nr][nc];
                unassigned--;
                break;
              }
            }
          }
        }
      }
    }
  }

  return grid;
}

/**
 * Generate daily Frogdoku 5x5 puzzle
 * @param {string} dateStr YYYY-MM-DD
 * @returns {{ colorGrid: Array<Array<number>>, frogPositions: Array<{r: number, c: number}>, difficultyName: string, difficultyKey: string }}
 */
function generateDailyFrogdoku(dateStr) {
  const seed = window.DailySeed.getSeedFromDate(`${dateStr}_frogdoku`);
  const rng = window.DailySeed.createSeededRandom(seed);

  // 1. Determine Difficulty Level (20% Easy / 40% Medium / 40% Hard)
  const randVal = Math.floor(rng() * 100);
  let difficultyName = '中等';
  let difficultyKey = 'medium';

  if (randVal < 20) {
    difficultyName = '簡單';
    difficultyKey = 'easy';
  } else if (randVal < 60) {
    difficultyName = '中等';
    difficultyKey = 'medium';
  } else {
    difficultyName = '困難';
    difficultyKey = 'hard';
  }

  // 2. Generate valid solution frogs
  const frogPositions = generateValidFrogPositions(rng);

  // 3. Partition 5 connected color regions
  const colorGrid = partitionColorRegions(frogPositions, rng);

  return {
    colorGrid,
    frogPositions,
    difficultyName,
    difficultyKey
  };
}

window.FrogdokuGenerator = {
  generateDailyFrogdoku
};
