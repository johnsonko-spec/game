/**
 * Mini Sudoku 6x6 Game Controller (迷你數獨)
 * 6x6 Grid, 2x3 Blocks, Pencil Note-Taking Mode, Real-Time Conflict Detection, No Hint Feature
 */

class SudokuGameController {
  constructor(container, dateStr, playerName, onCloseCallback) {
    this.container = container;
    this.dateStr = dateStr;
    this.playerName = playerName;
    this.onClose = onCloseCallback;

    this.givenBoard = [];
    this.solutionBoard = [];
    this.userBoard = [];
    this.notesBoard = []; // 6x6 array of Sets

    this.selectedRow = -1;
    this.selectedCol = -1;
    this.isPencilMode = false;

    this.timerInterval = null;
    this.startTime = null;
    this.elapsedMs = 0;
    this.isCompleted = false;
  }

  init() {
    const puzzle = window.SudokuSolver.generateDailySudoku(this.dateStr);
    this.givenBoard = puzzle.givenBoard;
    this.solutionBoard = puzzle.solutionBoard;

    this.userBoard = this.givenBoard.map(row => [...row]);
    this.notesBoard = Array.from({ length: 6 }, () => 
      Array.from({ length: 6 }, () => new Set())
    );

    this.render();
  }

  startTimer() {
    if (this.startTime) return;
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      this.elapsedMs = Date.now() - this.startTime;
      const timerEl = this.container.querySelector('#sdk-timer-display');
      if (timerEl) {
        timerEl.textContent = window.LeaderboardUI.formatTime(this.elapsedMs);
      }
    }, 50);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  render() {
    const conflicts = this.getConflicts();
    const selectedVal = (this.selectedRow >= 0 && this.selectedCol >= 0) ? 
      this.userBoard[this.selectedRow][this.selectedCol] : 0;

    let cellsHtml = '';
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        const val = this.userBoard[r][c];
        const isGiven = this.givenBoard[r][c] !== 0;
        const isSelected = (r === this.selectedRow && c === this.selectedCol);
        const isConflict = conflicts.has(`${r}_${c}`);
        const isSameNum = (val !== 0 && val === selectedVal);

        let cellClasses = 'sdk-cell';
        if (isGiven) cellClasses += ' is-given';
        else if (val !== 0) cellClasses += ' is-user';
        if (isSelected) cellClasses += ' is-selected';
        if (isSameNum && !isSelected) cellClasses += ' is-highlight-num';
        if (isConflict) cellClasses += ' is-conflict';

        // Add 2x3 block boundary borders
        if (c === 2) cellClasses += ' border-right-thick';
        if (r === 1 || r === 3) cellClasses += ' border-bottom-thick';

        let cellContentHtml = '';
        if (val !== 0) {
          cellContentHtml = `<span class="sdk-cell-val">${val}</span>`;
        } else {
          // Render 3x2 pencil notes grid (numbers 1..6)
          const notes = this.notesBoard[r][c];
          let notesGrid = '';
          for (let n = 1; n <= 6; n++) {
            notesGrid += `<span class="sdk-note-num">${notes.has(n) ? n : ''}</span>`;
          }
          cellContentHtml = `<div class="sdk-notes-grid">${notesGrid}</div>`;
        }

        cellsHtml += `
          <div class="${cellClasses}" data-r="${r}" data-c="${c}">
            ${cellContentHtml}
          </div>
        `;
      }
    }

    this.container.innerHTML = `
      <div class="sudoku-game-panel">
        <div class="sdk-header">
          <div class="sdk-header-left">
            <button id="sdk-back-btn" class="btn-icon" title="返回首頁">← 返回</button>
            <h2 class="sdk-title">🧩 迷你數獨 每日關卡</h2>
          </div>
          <div class="sdk-stats-bar">
            <div class="sdk-stat-item">
              <span>⏱ 用時:</span>
              <span id="sdk-timer-display" class="sdk-stat-val">00:00.0</span>
            </div>
          </div>
        </div>

        <div class="sdk-grid-wrapper">
          <div class="sdk-grid-board">
            ${cellsHtml}
          </div>
        </div>

        <div class="sdk-controls">
          <div class="sdk-toolbar">
            <button id="sdk-pencil-btn" class="btn-icon sdk-tool-btn ${this.isPencilMode ? 'is-active' : ''}">
              ✏️ 備註 [${this.isPencilMode ? '開啟' : '關閉'}]
            </button>
            <button id="sdk-erase-btn" class="btn-icon sdk-tool-btn">
              ✕ 清除
            </button>
          </div>

          <div class="sdk-keypad">
            <button class="sdk-key-btn" data-val="1">1</button>
            <button class="sdk-key-btn" data-val="2">2</button>
            <button class="sdk-key-btn" data-val="3">3</button>
            <button class="sdk-key-btn" data-val="4">4</button>
            <button class="sdk-key-btn" data-val="5">5</button>
            <button class="sdk-key-btn" data-val="6">6</button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  getConflicts() {
    const conflicts = new Set();

    // Row check
    for (let r = 0; r < 6; r++) {
      const map = {};
      for (let c = 0; c < 6; c++) {
        const val = this.userBoard[r][c];
        if (val !== 0) {
          if (map[val]) {
            conflicts.add(`${r}_${c}`);
            conflicts.add(`${r}_${map[val] - 1}`);
          } else {
            map[val] = c + 1;
          }
        }
      }
    }

    // Col check
    for (let c = 0; c < 6; c++) {
      const map = {};
      for (let r = 0; r < 6; r++) {
        const val = this.userBoard[r][c];
        if (val !== 0) {
          if (map[val]) {
            conflicts.add(`${r}_${c}`);
            conflicts.add(`${map[val] - 1}_${c}`);
          } else {
            map[val] = r + 1;
          }
        }
      }
    }

    // 2x3 Block check
    for (let blockR = 0; blockR < 3; blockR++) {
      for (let blockC = 0; blockC < 2; blockC++) {
        const map = {};
        const startR = blockR * 2;
        const startC = blockC * 3;
        for (let dr = 0; dr < 2; dr++) {
          for (let dc = 0; dc < 3; dc++) {
            const r = startR + dr;
            const c = startC + dc;
            const val = this.userBoard[r][c];
            if (val !== 0) {
              if (map[val]) {
                conflicts.add(`${r}_${c}`);
                conflicts.add(map[val]);
              } else {
                map[val] = `${r}_${c}`;
              }
            }
          }
        }
      }
    }

    return conflicts;
  }

  bindEvents() {
    // Back button
    const backBtn = this.container.querySelector('#sdk-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.stopTimer();
        if (this.onClose) this.onClose();
      });
    }

    // Cell clicks
    const cells = this.container.querySelectorAll('.sdk-cell');
    cells.forEach(cellEl => {
      cellEl.addEventListener('click', () => {
        const r = parseInt(cellEl.getAttribute('data-r'), 10);
        const c = parseInt(cellEl.getAttribute('data-c'), 10);
        this.selectedRow = r;
        this.selectedCol = c;
        this.render();
      });
    });

    // Keypad numbers 1..6
    const keyBtns = this.container.querySelectorAll('.sdk-key-btn');
    keyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.getAttribute('data-val'), 10);
        this.handleInput(val);
      });
    });

    // Erase button
    const eraseBtn = this.container.querySelector('#sdk-erase-btn');
    if (eraseBtn) {
      eraseBtn.addEventListener('click', () => this.handleErase());
    }

    // Pencil note mode toggle
    const pencilBtn = this.container.querySelector('#sdk-pencil-btn');
    if (pencilBtn) {
      pencilBtn.addEventListener('click', () => {
        this.isPencilMode = !this.isPencilMode;
        this.render();
      });
    }
  }

  handleInput(val) {
    if (this.isCompleted || this.selectedRow === -1 || this.selectedCol === -1) return;
    const r = this.selectedRow;
    const c = this.selectedCol;

    if (this.givenBoard[r][c] !== 0) return; // Cannot edit given numbers

    this.startTimer();

    if (this.isPencilMode) {
      // Toggle draft pencil note
      const notes = this.notesBoard[r][c];
      if (notes.has(val)) {
        notes.delete(val);
      } else {
        notes.add(val);
      }
      this.userBoard[r][c] = 0; // clear main number if pencil notes are added
    } else {
      // Set main number
      this.userBoard[r][c] = (this.userBoard[r][c] === val) ? 0 : val;
      this.notesBoard[r][c].clear();
    }

    this.render();
    this.checkWinCondition();
  }

  handleErase() {
    if (this.isCompleted || this.selectedRow === -1 || this.selectedCol === -1) return;
    const r = this.selectedRow;
    const c = this.selectedCol;

    if (this.givenBoard[r][c] !== 0) return;

    this.userBoard[r][c] = 0;
    this.notesBoard[r][c].clear();
    this.render();
  }

  checkWinCondition() {
    // 1. All cells filled
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (this.userBoard[r][c] === 0) return;
      }
    }

    // 2. Zero conflicts
    const conflicts = this.getConflicts();
    if (conflicts.size > 0) return;

    // --- WIN SUCCESS ---
    this.isCompleted = true;
    this.stopTimer();

    window.GameStorage.recordGameCompletion(
      'sudoku',
      this.dateStr,
      this.playerName,
      this.elapsedMs
    );

    this.triggerConfetti();

    setTimeout(() => {
      if (this.onClose) this.onClose(true);
    }, 1500);
  }

  triggerConfetti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-wrapper';
    for (let i = 0; i < 40; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      p.style.left = `${Math.random() * 100}%`;
      p.style.animationDelay = `${Math.random() * 0.8}s`;
      p.style.backgroundColor = ['#ffd700', '#00e676', '#ff4081', '#00e5ff', '#aa00ff'][Math.floor(Math.random() * 5)];
      confettiContainer.appendChild(p);
    }
    this.container.appendChild(confettiContainer);
    setTimeout(() => confettiContainer.remove(), 2500);
  }
}

window.SudokuGameController = SudokuGameController;
