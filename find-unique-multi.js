// Generator searching across multiple valid frog solutions for N=7,8,9,10 to find 100% strictly unique grids

function countValidSolutions(size, colorGrid) {
  let count = 0;

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
  return count;
}

function findForN(size) {
  // Valid frog solutions for size
  const solutionsPool = [];

  function solvePerm(r, current) {
    if (r === size) {
      solutionsPool.push([...current]);
      return;
    }
    for (let c = 0; c < size; c++) {
      let ok = true;
      for (let prevR = 0; prevR < r; prevR++) {
        const prevC = current[prevR];
        if (prevC === c || (Math.abs(prevR - r) <= 1 && Math.abs(prevC - c) <= 1)) {
          ok = false;
          break;
        }
      }
      if (ok) {
        solvePerm(r + 1, [...current, c]);
        if (solutionsPool.length >= 20) return;
      }
    }
  }
  solvePerm(0, []);

  const dirs = [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }];

  for (const sol of solutionsPool) {
    const frogPositions = sol.map((c, r) => ({ r, c }));

    for (let trial = 1; trial <= 5000; trial++) {
      const grid = Array.from({ length: size }, () => new Array(size).fill(-1));
      const queues = [];

      frogPositions.forEach((pos, regId) => {
        grid[pos.r][pos.c] = regId;
        queues.push([{ r: pos.r, c: pos.c }]);
      });

      let unassigned = size * size - size;

      while (unassigned > 0) {
        let grew = false;
        const regOrder = Array.from({ length: size }, (_, i) => i).sort(() => Math.random() - 0.5);

        for (const regId of regOrder) {
          const q = queues[regId];
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
            const pick = candidates[Math.floor(Math.random() * candidates.length)];
            grid[pick.r][pick.c] = regId;
            queues[regId].push(pick);
            unassigned--;
            grew = true;
            if (unassigned === 0) break;
          }
        }

        if (!grew && unassigned > 0) {
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

      if (countValidSolutions(size, grid) === 1) {
        console.log(`FOUND_UNIQUE_STRICT_N_${size}:`);
        console.log(JSON.stringify(grid));
        return grid;
      }
    }
  }

  console.log(`FAIL N=${size}`);
  return null;
}

[7, 8, 9, 10].forEach(s => findForN(s));
