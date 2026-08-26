// Exact search for 100% STRICTLY UNIQUE SOLUTION (count === 1) grids for N=6,7,8,9,10

function countValidSolutions(size, colorGrid) {
  let count = 0;
  let solution = null;

  function isValid(frogs) {
    const r = frogs.length - 1;
    const c = frogs[r];
    const reg = colorGrid[r][c];

    for (let prevR = 0; prevR < r; prevR++) {
      const prevC = frogs[prevR];
      const prevReg = colorGrid[prevR][prevC];

      if (prevC === c) return false;
      if (prevReg === reg) return false;
      if (Math.abs(prevR - r) <= 1 && Math.abs(prevC - c) <= 1) return false;
    }
    return true;
  }

  function solve(r, currentFrogs) {
    if (r === size) {
      count++;
      solution = [...currentFrogs];
      return;
    }

    for (let c = 0; c < size; c++) {
      const nextFrogs = [...currentFrogs, c];
      if (isValid(nextFrogs)) {
        solve(r + 1, nextFrogs);
        if (count >= 2) return;
      }
    }
  }

  solve(0, []);
  return { count, solution };
}

function findForSize(size, sol) {
  const targetFrogs = sol.map((c, r) => ({ r, c }));

  for (let trial = 0; trial < 100000; trial++) {
    const grid = Array.from({ length: size }, () => new Array(size).fill(-1));
    
    // Assign 1 anchor for each region
    targetFrogs.forEach((pos, regId) => {
      grid[pos.r][pos.c] = regId;
    });

    // Randomly assign remaining cells to nearest region
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === -1) {
          // Find closest frog pos with random noise
          let bestDist = 999;
          let bestReg = 0;
          targetFrogs.forEach((pos, regId) => {
            const dist = Math.abs(pos.r - r) + Math.abs(pos.c - c) + (Math.random() * 0.8);
            if (dist < bestDist) {
              bestDist = dist;
              bestReg = regId;
            }
          });
          grid[r][c] = bestReg;
        }
      }
    }

    const res = countValidSolutions(size, grid);
    if (res.count === 1) {
      console.log(`EXACT_UNIQUE_N${size}:`, JSON.stringify(grid));
      return grid;
    }
  }
  console.log(`FAIL N=${size}`);
  return null;
}

findForSize(6, [1, 4, 0, 2, 5, 3]);
findForSize(7, [0, 3, 5, 1, 6, 2, 4]);
findForSize(8, [0, 3, 6, 1, 4, 7, 2, 5]);
findForSize(9, [0, 3, 6, 1, 4, 7, 2, 5, 8]);
findForSize(10, [0, 3, 6, 9, 1, 4, 7, 2, 5, 8]);
