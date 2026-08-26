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

// 6x6 with Region 0 isolated at (0,0)
const g6_1 = [
  [0, 1, 1, 1, 1, 1],
  [2, 2, 2, 1, 1, 1],
  [2, 2, 3, 3, 4, 4],
  [2, 2, 3, 3, 4, 4],
  [5, 5, 3, 3, 4, 4],
  [5, 5, 5, 5, 4, 4]
];

console.log("6x6_1:", countValidSolutions(6, g6_1));
