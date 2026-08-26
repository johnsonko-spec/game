// Verify and generate 100% Unique Solution Color Grids for 6x6, 7x7, 8x8, 9x9, 10x10

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

// 1. Level 0: 6x6 Unique Solution Grid Generator / Verification
const g6 = [
  [0, 1, 1, 1, 2, 2],
  [0, 1, 1, 1, 2, 2],
  [0, 3, 3, 1, 4, 4],
  [3, 3, 3, 4, 4, 4],
  [3, 3, 5, 5, 4, 4],
  [5, 5, 5, 5, 4, 4]
];

console.log("6x6:", countValidSolutions(6, g6));

// 2. Level 1: 7x7 Unique Solution Grid
const g7 = [
  [0, 0, 1, 1, 2, 2, 2],
  [0, 1, 1, 1, 2, 2, 2],
  [0, 3, 3, 4, 4, 2, 5],
  [3, 3, 3, 4, 4, 5, 5],
  [3, 6, 6, 4, 5, 5, 5],
  [3, 6, 6, 6, 5, 5, 5],
  [3, 3, 6, 6, 5, 5, 5]
];

console.log("7x7:", countValidSolutions(7, g7));

// 3. Level 2: 8x8 Unique Solution Grid
const g8 = [
  [0, 0, 1, 1, 2, 2, 3, 3],
  [0, 0, 1, 1, 2, 2, 3, 3],
  [4, 4, 1, 1, 5, 5, 3, 3],
  [4, 4, 4, 5, 5, 5, 3, 3],
  [4, 4, 4, 5, 5, 6, 6, 3],
  [7, 7, 4, 5, 6, 6, 6, 3],
  [7, 7, 7, 6, 6, 6, 6, 3],
  [7, 7, 7, 7, 6, 6, 6, 3]
];

console.log("8x8:", countValidSolutions(8, g8));
