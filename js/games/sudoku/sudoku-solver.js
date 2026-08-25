/**
 * 6x6 Mini Sudoku Solver & Daily Unique-Solution Puzzle Generator
 */

/**
 * Get block index for 2x3 sub-grids (0..5)
 * @param {number} r 0..5
 * @param {number} c 0..5
 * @returns {number}
 */
function getBlockIndex(r, c) {
  return Math.floor(r / 2) * 2 + Math.floor(c / 3);
}

/**
 * Check if putting val at (r, c) is valid under 6x6 Sudoku rules
 * @param {Array<Array<number>>} board 
 * @param {number} r 
 * @param {number} c 
 * @param {number} val 1..6
 * @returns {boolean}
 */
function isValidPlacement(board, r, c, val) {
  for (let i = 0; i < 6; i++) {
    if (i !== c && board[r][i] === val) return false; // Row check
    if (i !== r && board[i][c] === val) return false; // Col check
  }

  // 2x3 Block check
  const startR = Math.floor(r / 2) * 2;
  const startC = Math.floor(c / 3) * 3;
  for (let dr = 0; dr < 2; dr++) {
    for (let dc = 0; dc < 3; dc++) {
      const nr = startR + dr;
      const nc = startC + dc;
      if ((nr !== r || nc !== c) && board[nr][nc] === val) return false;
    }
  }

  return true;
}

/**
 * Count solutions up to limit (used to verify unique solution)
 * @param {Array<Array<number>>} board 
 * @param {number} limit 
 * @returns {number}
 */
function countSolutions(board, limit = 2) {
  let count = 0;

  function solve(r, c) {
    if (r === 6) {
      count++;
      return;
    }
    const nextR = c === 5 ? r + 1 : r;
    const nextC = c === 5 ? 0 : c + 1;

    if (board[r][c] !== 0) {
      solve(nextR, nextC);
    } else {
      for (let val = 1; val <= 6; val++) {
        if (isValidPlacement(board, r, c, val)) {
          board[r][c] = val;
          solve(nextR, nextC);
          board[r][c] = 0;
          if (count >= limit) return;
        }
      }
    }
  }

  solve(0, 0);
  return count;
}

/**
 * Solve 6x6 Sudoku board in-place using backtracking
 * @param {Array<Array<number>>} board 
 * @returns {boolean}
 */
function solve6x6(board) {
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (board[r][c] === 0) {
        for (let val = 1; val <= 6; val++) {
          if (isValidPlacement(board, r, c, val)) {
            board[r][c] = val;
            if (solve6x6(board)) return true;
            board[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

/**
 * Generate a daily 6x6 Mini Sudoku puzzle with unique solution guarantee
 * @param {string} dateStr YYYY-MM-DD
 * @returns {{ givenBoard: Array<Array<number>>, solutionBoard: Array<Array<number>> }}
 */
function generateDailySudoku(dateStr) {
  const seed = window.DailySeed.getSeedFromDate(`${dateStr}_sudoku`);
  const rng = window.DailySeed.createSeededRandom(seed);

  // 1. Create a complete valid 6x6 solution board
  const solutionBoard = Array.from({ length: 6 }, () => new Array(6).fill(0));

  // Fill diagonal blocks first with random permutations
  const nums1 = [1, 2, 3, 4, 5, 6];
  for (let i = nums1.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [nums1[i], nums1[j]] = [nums1[j], nums1[i]];
  }

  let idx = 0;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      solutionBoard[r][c] = nums1[idx++];
    }
  }

  solve6x6(solutionBoard);

  // 2. Dig holes while preserving unique solution
  const givenBoard = solutionBoard.map(row => [...row]);
  const cellPositions = [];
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      cellPositions.push({ r, c });
    }
  }

  // Shuffle positions
  for (let i = cellPositions.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cellPositions[i], cellPositions[j]] = [cellPositions[j], cellPositions[i]];
  }

  // Remove about 18~20 cells to leave ~16-18 given numbers
  let holesDug = 0;
  const targetHoles = 19;

  for (const pos of cellPositions) {
    if (holesDug >= targetHoles) break;

    const temp = givenBoard[pos.r][pos.c];
    givenBoard[pos.r][pos.c] = 0;

    // Verify unique solution
    const testBoard = givenBoard.map(row => [...row]);
    if (countSolutions(testBoard, 2) !== 1) {
      givenBoard[pos.r][pos.c] = temp; // Restore if multiple solutions exist
    } else {
      holesDug++;
    }
  }

  return {
    givenBoard,
    solutionBoard
  };
}

window.SudokuSolver = {
  isValidPlacement,
  generateDailySudoku
};
