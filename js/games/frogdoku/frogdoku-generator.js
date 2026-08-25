/**
 * Frogdoku Board & Color Region Generator with Dynamic Sizes (4x4, 5x5, 6x6)
 */

/**
 * Generate N valid non-adjacent frog positions for grid size N
 * @param {number} size 4, 5, or 6
 * @param {Function} rng 
 * @returns {Array<{r: number, c: number}>}
 */
function generateValidFrogPositions(size, rng) {
  const solutionsMap = {
    4: [
      [1, 3, 0, 2],
      [2, 0, 3, 1]
    ],
    5: [
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
    ],
    6: [
      [1, 4, 0, 3, 5, 2],
      [2, 5, 1, 4, 0, 3],
      [3, 0, 4, 1, 5, 2],
      [4, 1, 5, 2, 0, 3],
      [0, 2, 4, 1, 5, 3],
      [0, 3, 1, 4, 2, 5],
      [0, 4, 2, 5, 1, 3],
      [3, 5, 1, 4, 2, 0],
      [5, 2, 4, 1, 3, 0],
      [5, 3, 1, 4, 0, 2]
    ]
  };

  const pool = solutionsMap[size] || solutionsMap[5];
  const pickIdx = Math.floor(rng() * pool.length);
  const sol = pool[pickIdx];

  return sol.map((c, r) => ({ r, c }));
}

/**
 * Partition N x N grid into N connected color regions, each containing exactly 1 frog
 * @param {number} size N
 * @param {Array<{r: number, c: number}>} frogPositions 
 * @param {Function} rng 
 * @returns {Array<Array<number>>} N x N grid of region IDs (0..N-1)
 */
function partitionColorRegions(size, frogPositions, rng) {
  const grid = Array.from({ length: size }, () => new Array(size).fill(-1));
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

  let unassigned = (size * size) - size;

  while (unassigned > 0) {
    let grewAny = false;

    // Pick region order randomly
    const regionOrder = Array.from({ length: size }, (_, i) => i);
    for (let i = regionOrder.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [regionOrder[i], regionOrder[j]] = [regionOrder[j], regionOrder[i]];
    }

    for (const regionId of regionOrder) {
      const q = regionQueues[regionId];
      if (q.length === 0) continue;

      const candidates = [];
      q.forEach(cell => {
        dirs.forEach(d => {
          const nr = cell.r + d.dr;
          const nc = cell.c + d.dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === -1) {
            candidates.push({ r: nr, c: nc });
          }
        });
      });

      if (candidates.length > 0) {
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
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (grid[r][c] === -1) {
            for (const d of dirs) {
              const nr = r + d.dr;
              const nc = c + d.dc;
              if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] !== -1) {
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
 * Generate daily Frogdoku puzzle with dynamic size based on difficulty:
 * 20% Easy (4x4), 40% Medium (5x5), 40% Hard (6x6)
 * @param {string} dateStr YYYY-MM-DD
 * @returns {{ size: number, colorGrid: Array<Array<number>>, frogPositions: Array<{r: number, c: number}>, difficultyName: string, difficultyKey: string }}
 */
function generateDailyFrogdoku(dateStr) {
  const seed = window.DailySeed.getSeedFromDate(`${dateStr}_frogdoku`);
  const rng = window.DailySeed.createSeededRandom(seed);

  // 1. Determine Difficulty Level & Size (20% Easy 4x4 / 40% Medium 5x5 / 40% Hard 6x6)
  const randVal = Math.floor(rng() * 100);
  let difficultyName = '中等 (5x5)';
  let difficultyKey = 'medium';
  let size = 5;

  if (randVal < 20) {
    difficultyName = '簡單 (4x4)';
    difficultyKey = 'easy';
    size = 4;
  } else if (randVal < 60) {
    difficultyName = '中等 (5x5)';
    difficultyKey = 'medium';
    size = 5;
  } else {
    difficultyName = '困難 (6x6)';
    difficultyKey = 'hard';
    size = 6;
  }

  // 2. Generate valid solution frogs for grid size
  const frogPositions = generateValidFrogPositions(size, rng);

  // 3. Partition N connected color regions
  const colorGrid = partitionColorRegions(size, frogPositions, rng);

  return {
    size,
    colorGrid,
    frogPositions,
    difficultyName,
    difficultyKey
  };
}

window.FrogdokuGenerator = {
  generateDailyFrogdoku
};
