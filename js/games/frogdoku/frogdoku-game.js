/**
 * Frogdoku 5x5 Game Controller (青蛙擺放)
 * Clean Empty Starting Board, Manual Toggle (0->1->2->0), Real-Time Conflict Highlighting, Unlimited Retries (No Auto-Cross, No Hearts)
 */

class FrogdokuGameController {
  constructor(container, dateStr, playerName, onCloseCallback) {
    this.container = container;
    this.dateStr = dateStr;
    this.playerName = playerName;
    this.onClose = onCloseCallback;

    this.colorGrid = [];
    this.userGrid = Array.from({ length: 5 }, () => new Array(5).fill(0)); // 0: Empty, 1: Frog 🐸, 2: Cross ❌
    this.placedFrogs = 0;

    this.difficultyName = '中等';
    this.difficultyKey = 'medium';

    this.timerInterval = null;
    this.startTime = null;
    this.elapsedMs = 0;
    this.isCompleted = false;
  }

  init() {
    const puzzle = window.FrogdokuGenerator.generateDailyFrogdoku(this.dateStr);
    this.colorGrid = puzzle.colorGrid;
    this.difficultyName = puzzle.difficultyName;
    this.difficultyKey = puzzle.difficultyKey;

    this.render();
  }

  startTimer() {
    if (this.startTime) return;
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      this.elapsedMs = Date.now() - this.startTime;
      const timerEl = this.container.querySelector('#fgd-timer-display');
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

    let cellsHtml = '';
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const regionId = this.colorGrid[r][c];
        const state = this.userGrid[r][c];
        const isConflict = conflicts.has(`${r}_${c}`);

        let content = '';
        if (state === 1) content = '🐸';
        else if (state === 2) content = '❌';

        cellsHtml += `
          <div class="fgd-cell region-color-${regionId} ${state === 1 ? 'has-frog' : ''} ${state === 2 ? 'has-cross' : ''} ${isConflict ? 'is-collision' : ''}" data-r="${r}" data-c="${c}">
            <span class="fgd-cell-content">${content}</span>
          </div>
        `;
      }
    }

    const diffBadgeClass = `sdk-diff-${this.difficultyKey}`;

    this.container.innerHTML = `
      <div class="frogdoku-game-panel">
        <div class="fgd-header">
          <div class="fgd-header-left">
            <button id="fgd-back-btn" class="btn-icon" title="返回首頁">← 返回</button>
            <h2 class="fgd-title">🐸 青蛙擺放 每日關卡</h2>
          </div>
          <div class="fgd-stats-bar">
            <div class="fgd-stat-item">
              <span>⚡ 難度:</span>
              <span class="sdk-diff-badge ${diffBadgeClass}">${this.difficultyName}</span>
            </div>
            <div class="fgd-stat-item">
              <span>⏱ 用時:</span>
              <span id="fgd-timer-display" class="fgd-stat-val">00:00.0</span>
            </div>
            <div class="fgd-stat-item">
              <span>🐸 進度:</span>
              <span id="fgd-frogs-display" class="fgd-stat-val">${this.placedFrogs}</span> / 5 隻
            </div>
          </div>
        </div>

        <div class="fgd-rules-tags">
          <span class="fgd-tag">1. 每色 1 隻蛙</span>
          <span class="fgd-tag">2. 每行列 1 隻蛙</span>
          <span class="fgd-tag">3. 青蛙不能相鄰(含對角)</span>
        </div>

        <div class="fgd-board-wrapper">
          <div class="fgd-grid-board">
            ${cellsHtml}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  getConflicts() {
    const conflicts = new Set();
    const frogList = [];

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (this.userGrid[r][c] === 1) {
          frogList.push({ r, c, region: this.colorGrid[r][c] });
        }
      }
    }

    for (let i = 0; i < frogList.length; i++) {
      for (let j = i + 1; j < frogList.length; j++) {
        const f1 = frogList[i];
        const f2 = frogList[j];

        const sameRow = (f1.r === f2.r);
        const sameCol = (f1.c === f2.c);
        const sameRegion = (f1.region === f2.region);
        const isAdjacent = (Math.abs(f1.r - f2.r) <= 1 && Math.abs(f1.c - f2.c) <= 1);

        if (sameRow || sameCol || sameRegion || isAdjacent) {
          conflicts.add(`${f1.r}_${f1.c}`);
          conflicts.add(`${f2.r}_${f2.c}`);
        }
      }
    }

    return conflicts;
  }

  bindEvents() {
    // Back button
    const backBtn = this.container.querySelector('#fgd-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.stopTimer();
        if (this.onClose) this.onClose();
      });
    }

    if (this.isCompleted) return;

    // Cell clicks
    const cells = this.container.querySelectorAll('.fgd-cell');
    cells.forEach(cellEl => {
      cellEl.addEventListener('click', () => {
        const r = parseInt(cellEl.getAttribute('data-r'), 10);
        const c = parseInt(cellEl.getAttribute('data-c'), 10);
        this.handleCellClick(r, c);
      });
    });
  }

  handleCellClick(r, c) {
    this.startTimer();

    const currentState = this.userGrid[r][c];
    let nextState = 0;

    if (currentState === 0) nextState = 1; // Empty -> Frog 🐸
    else if (currentState === 1) nextState = 2; // Frog -> Cross ❌
    else if (currentState === 2) nextState = 0; // Cross -> Empty

    this.userGrid[r][c] = nextState;

    this.recountFrogs();
    this.render();
    this.checkWinCondition();
  }

  recountFrogs() {
    let count = 0;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (this.userGrid[r][c] === 1) count++;
      }
    }
    this.placedFrogs = count;
  }

  checkWinCondition() {
    if (this.placedFrogs === 5) {
      const conflicts = this.getConflicts();
      if (conflicts.size === 0) {
        // WIN SUCCESS!
        this.isCompleted = true;
        this.stopTimer();

        window.GameStorage.recordGameCompletion(
          'frogdoku',
          this.dateStr,
          this.playerName,
          this.elapsedMs
        );

        this.triggerConfetti();

        setTimeout(() => {
          if (this.onClose) this.onClose(true);
        }, 1500);
      }
    }
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

window.FrogdokuGameController = FrogdokuGameController;
