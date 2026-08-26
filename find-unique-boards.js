// Generator to construct 100% Strictly Unique Solution (count === 1) Frogdoku grids for N = 6, 7, 8, 9, 10

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

function generateRandomGrid(size) {
  const sols = {
    6: [1, 4, 0, 2, 5, 3],
    7: [0, 3, 5, 1, 6, 2, 4],
    8: [0, 3, 6, 1, 4, 7, 2, 5],
    9: [0, 3, 6, 1, 4, 7, 2, 5, 8],
    10: [0, 3, 6, 9, 1, 4, 7, 2, 5, 8]
  };

  const sol = sols[size];
  const frogPositions = sol.map((c, r) => ({ r, c }));

  const grid = Array.from({ length: size }, () => new Array(size).fill(-1));
  const activeCells = [];

  frogPositions.forEach((pos, regId) => {
    grid[pos.r][pos.c] = regId;
    activeCells.push({ r: pos.r, c: pos.c, regId });
  });

  const dirs = [
    { dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }
  ];

  let filled = size;
  while (filled < size * size) {
    // Pick random active cell
    const cell = activeCells[Math.floor(Math.random() * activeCells.length)];
    const neighbors = [];
    dirs.forEach(d => {
      const nr = cell.r + d.dr;
      const nc = cell.c + d.dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === -1) {
        neighbors.push({ r: nr, c: nc });
      }
    });

    if (neighbors.length > 0) {
      const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
      grid[pick.r][pick.c] = cell.regId;
      activeCells.push({ r: pick.r, c: pick.pick, regId: cell.regId });
      filled++;
    }
  }

  return grid;
}

function findUniqueGrid(size) {
  for (let attempts = 1; attempts <= 20000; attempts++) {
    const grid = generateRandomGrid(size);
    const res = countValidSolutions(size, grid);
    if (res.count === 1) {
      console.log(`FOUND_UNIQUE_N_${size}:`, JSON.stringify(grid));
      return grid;
    }
  }
  console.log(`Failed N=${size}`);
  return null;
}

[6, 7, 8, 9, 10].forEach(s => findUniqueGrid(s));
