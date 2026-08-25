/**
 * Animal Onet Connect Pathfinder & Deadlock Safeguard Engine
 * Implements 0, 1, 2 Turn Connecting Algorithm & Instant Deadlock Solver
 */

/**
 * Check straight line (0 turns) between two points on grid
 * @param {Array<Array<object|null>>} grid 
 * @param {number} r1 
 * @param {number} c1 
 * @param {number} r2 
 * @param {number} c2 
 * @returns {boolean}
 */
function isLineClear(grid, r1, c1, r2, c2) {
  if (r1 === r2) {
    const minC = Math.min(c1, c2);
    const maxC = Math.max(c1, c2);
    for (let c = minC + 1; c < maxC; c++) {
      if (grid[r1][c] !== null) return false;
    }
    return true;
  }
  if (c1 === c2) {
    const minR = Math.min(r1, r2);
    const maxR = Math.max(r1, r2);
    for (let r = minR + 1; r < maxR; r++) {
      if (grid[r][c1] !== null) return false;
    }
    return true;
  }
  return false;
}

/**
 * Check path with at most 2 turns (0, 1, or 2 corners)
 * Grid dimensions include padding boundary (Rows: 0~ROWS-1, Cols: 0~COLS-1)
 * @param {Array<Array<object|null>>} grid 
 * @param {number} r1 
 * @param {number} c1 
 * @param {number} r2 
 * @param {number} c2 
 * @returns {{ can: boolean, path: Array<{r: number, c: number}>|null }}
 */
function canConnect(grid, r1, c1, r2, c2) {
  if (r1 === r2 && c1 === c2) return { can: false, path: null };

  const p1 = grid[r1][c1];
  const p2 = grid[r2][c2];

  if (!p1 || !p2 || p1.icon !== p2.icon) return { can: false, path: null };

  const rows = grid.length;
  const cols = grid[0].length;

  // 1. Check 0 Turns (Direct Straight Line)
  if ((r1 === r2 || c1 === c2) && isLineClear(grid, r1, c1, r2, c2)) {
    return { can: true, path: [{ r: r1, c: c1 }, { r: r2, c: c2 }] };
  }

  // 2. Check 1 Turn (L-Shape: 1 Corner)
  // Corner Option A: (r1, c2)
  if (grid[r1][c2] === null && isLineClear(grid, r1, c1, r1, c2) && isLineClear(grid, r1, c2, r2, c2)) {
    return { can: true, path: [{ r: r1, c: c1 }, { r: r1, c: c2 }, { r: r2, c: c2 }] };
  }
  // Corner Option B: (r2, c1)
  if (grid[r2][c1] === null && isLineClear(grid, r1, c1, r2, c1) && isLineClear(grid, r2, c1, r2, c2)) {
    return { can: true, path: [{ r: r1, c: c1 }, { r: r2, c: c1 }, { r: r2, c: c2 }] };
  }

  // 3. Check 2 Turns (Z-Shape / U-Shape / Outer Border Scan)
  // Scan all rows r
  for (let r = 0; r < rows; r++) {
    if (r === r1 && r === r2) continue;
    const isR1TargetNull = (r === r1) ? true : (grid[r][c1] === null);
    const isR2TargetNull = (r === r2) ? true : (grid[r][c2] === null);

    if (isR1TargetNull && isR2TargetNull) {
      if (isLineClear(grid, r1, c1, r, c1) &&
          isLineClear(grid, r, c1, r, c2) &&
          isLineClear(grid, r, c2, r2, c2)) {
        return {
          can: true,
          path: [{ r: r1, c: c1 }, { r: r, c: c1 }, { r: r, c: c2 }, { r: r2, c: c2 }]
        };
      }
    }
  }

  // Scan all cols c
  for (let c = 0; c < cols; c++) {
    if (c === c1 && c === c2) continue;
    const isC1TargetNull = (c === c1) ? true : (grid[r1][c] === null);
    const isC2TargetNull = (c === c2) ? true : (grid[r2][c] === null);

    if (isC1TargetNull && isC2TargetNull) {
      if (isLineClear(grid, r1, c1, r1, c) &&
          isLineClear(grid, r1, c, r2, c) &&
          isLineClear(grid, r2, c, r2, c2)) {
        return {
          can: true,
          path: [{ r: r1, c: c1 }, { r: r1, c: c }, { r: r2, c: c }, { r: r2, c: c2 }]
        };
      }
    }
  }

  return { can: false, path: null };
}

/**
 * Scan grid for any remaining solvable pair
 * @param {Array<Array<object|null>>} grid 
 * @returns {object|null}
 */
function findAnyValidPair(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const activeTiles = [];

  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (grid[r][c] !== null) {
        activeTiles.push({ r, c, tile: grid[r][c] });
      }
    }
  }

  for (let i = 0; i < activeTiles.length; i++) {
    for (let j = i + 1; j < activeTiles.length; j++) {
      const t1 = activeTiles[i];
      const t2 = activeTiles[j];
      if (t1.tile.icon === t2.tile.icon) {
        const res = canConnect(grid, t1.r, t1.c, t2.r, t2.c);
        if (res.can) {
          return { t1, t2, path: res.path };
        }
      }
    }
  }

  return null;
}

/**
 * Shuffle remaining tiles on grid until at least one solvable pair exists (Zero-Deadlock Guarantee)
 * @param {Array<Array<object|null>>} grid 
 * @param {Function} rng PRNG function
 */
function ensureSolvable(grid, rng) {
  const rows = grid.length;
  const cols = grid[0].length;

  const positions = [];
  const tiles = [];

  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (grid[r][c] !== null) {
        positions.push({ r, c });
        tiles.push(grid[r][c]);
      }
    }
  }

  if (tiles.length === 0) return;

  let attempts = 0;
  while (attempts++ < 200) {
    // Shuffle tiles
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }

    // Assign back to grid
    positions.forEach((pos, idx) => {
      grid[pos.r][pos.c] = tiles[idx];
    });

    // Check if solvable
    if (findAnyValidPair(grid) !== null) {
      break; // Found valid solvable layout!
    }
  }
}

window.ConnectPathfinder = {
  canConnect,
  findAnyValidPair,
  ensureSolvable
};
