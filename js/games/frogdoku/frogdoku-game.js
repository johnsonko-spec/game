/**
 * Frogdoku 5x5 Game Controller (青蛙擺放)
 * Clean Empty Starting Board, 4 Core Rules, Auto-Cross Assist, 3 Hearts Counter
 */

class FrogdokuGameController {
  constructor(container, dateStr, playerName, onCloseCallback) {
    this.container = container;
    this.dateStr = dateStr;
    this.playerName = playerName;
    this.onClose = onCloseCallback;

    this.colorGrid = [];
    this.userGrid = Array.from({ length: 5 }, () => new Array(5).fill(0)); // 0: Empty, 1: Frog 🐸, 2: Cross ❌
    this.heartsLeft = 3;
    this.placedFrogs = 0;

    this.difficultyName = '中等';
    this.difficultyKey = 'medium';

    this.timerInterval = null;
    this.startTime = null;
    this.elapsedMs = 0;
    this.isCompleted = false;
    this.isGameOver = false;
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
    let heartsHtml = '';
    for (let i = 0; i < 3; i++) {
      heartsHtml += i < this.heartsLeft ? '<span class="fgd-heart">❤️</span>' : '<span class="fgd-heart is-lost">💔</span>';
    }

    let cellsHtml = '';
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const regionId = this.colorGrid[r][c];
        const state = this.userGrid[r][c];

        let content = '';
        if (state === 1) content = '🐸';
        else if (state === 2) content = '❌';

        cellsHtml += `
          <div class="fgd-cell region-color-${regionId} ${state === 1 ? 'has-frog' : ''} ${state === 2 ? 'has-cross' : ''}" data-r="${r}" data-c="${c}">
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
            <div class="fgd-stat-item fgd-hearts-box">
              ${heartsHtml}
            </div>
          </div>
        </div>

        <div class="fgd-rules-tags">
          <span class="fgd-tag">1. 每色 1 隻蛙</span>
          <span class="fgd-tag">2. 每行列 1 隻蛙</span>
          <span class="fgd-tag">3. 青蛙不能相鄰(含對角)</span>
        </div>

        <div id="fgd-toast-banner" class="fgd-toast hidden"></div>

        <div class="fgd-board-wrapper">
          <div class="fgd-grid-board">
            ${cellsHtml}
          </div>
        </div>

        ${this.isGameOver ? `
          <div class="fgd-gameover-overlay">
            <div class="fgd-gameover-card">
              <h3>💔 任務失敗 (生命值扣完)</h3>
              <p>青蛙擺放違反了規則，請重新挑戰！</p>
              <button id="fgd-retry-btn" class="btn-primary">🔄 重新挑戰</button>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    this.bindEvents();
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

    // Retry button on Game Over
    const retryBtn = this.container.querySelector('#fgd-retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.userGrid = Array.from({ length: 5 }, () => new Array(5).fill(0));
        this.heartsLeft = 3;
        this.placedFrogs = 0;
        this.isGameOver = false;
        this.startTime = null;
        this.elapsedMs = 0;
        this.render();
      });
    }

    if (this.isGameOver || this.isCompleted) return;

    // Cell clicks
    const cells = this.container.querySelectorAll('.fgd-cell');
    cells.forEach(cellEl => {
      cellEl.addEventListener('click', () => {
        const r = parseInt(cellEl.getAttribute('data-r'), 10);
        const c = parseInt(cellEl.getAttribute('data-c'), 10);
        this.handleCellClick(r, c, cellEl);
      });
    });
  }

  handleCellClick(r, c, cellEl) {
    this.startTimer();

    const currentState = this.userGrid[r][c];
    let nextState = 0;

    if (currentState === 0) nextState = 1; // Empty -> Frog 🐸
    else if (currentState === 1) nextState = 2; // Frog -> Cross ❌
    else if (currentState === 2) nextState = 0; // Cross -> Empty

    if (nextState === 1) {
      // Validate rule placement
      const ruleViolation = this.validateFrogPlacement(r, c);

      if (ruleViolation) {
        // Heart Deduction!
        this.heartsLeft--;
        cellEl.classList.add('is-collision');

        this.showToast(`💔 規則衝突: ${ruleViolation} (剩餘 ${this.heartsLeft} 顆心)`, 'error');

        if (this.heartsLeft <= 0) {
          this.isGameOver = true;
          this.stopTimer();
        }
        this.render();
        return;
      }

      // Valid Frog Placement!
      this.userGrid[r][c] = 1;
      this.autoCrossAssist(r, c);
    } else {
      this.userGrid[r][c] = nextState;
    }

    // Recount placed frogs
    this.recountFrogs();
    this.render();
    this.checkWinCondition();
  }

  validateFrogPlacement(r, c) {
    const regionId = this.colorGrid[r][c];

    // Rule 1: Same region already has a frog?
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if ((i !== r || j !== c) && this.colorGrid[i][j] === regionId && this.userGrid[i][j] === 1) {
          return '同顏色區塊已有青蛙！';
        }
      }
    }

    // Rule 2: Same row already has a frog?
    for (let col = 0; col < 5; col++) {
      if (col !== c && this.userGrid[r][col] === 1) {
        return '同一橫行已有青蛙！';
      }
    }

    // Rule 3: Same col already has a frog?
    for (let row = 0; row < 5; row++) {
      if (row !== r && this.userGrid[row][c] === 1) {
        return '同一直列已有青蛙！';
      }
    }

    // Rule 4: 8 Surrounding adjacent cells already have a frog?
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5 && this.userGrid[nr][nc] === 1) {
          return '青蛙不能相鄰接觸 (含對角)！';
        }
      }
    }

    return null; // Valid!
  }

  autoCrossAssist(r, c) {
    const regionId = this.colorGrid[r][c];

    // 1. Same row -> fill ❌ in empty cells
    for (let col = 0; col < 5; col++) {
      if (this.userGrid[r][col] === 0) this.userGrid[r][col] = 2;
    }

    // 2. Same col -> fill ❌ in empty cells
    for (let row = 0; row < 5; row++) {
      if (this.userGrid[row][c] === 0) this.userGrid[row][c] = 2;
    }

    // 3. Same region -> fill ❌ in empty cells
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if (this.colorGrid[i][j] === regionId && this.userGrid[i][j] === 0) {
          this.userGrid[i][j] = 2;
        }
      }
    }

    // 4. 8 surrounding cells -> fill ❌ in empty cells
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5 && this.userGrid[nr][nc] === 0) {
          this.userGrid[nr][nc] = 2;
        }
      }
    }
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

  showToast(msg, type = 'info') {
    const toast = this.container.querySelector('#fgd-toast-banner');
    if (toast) {
      toast.className = `fgd-toast ${type === 'error' ? 'error-toast' : ''}`;
      toast.textContent = msg;
      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('hidden'), 2000);
    }
  }

  checkWinCondition() {
    if (this.placedFrogs === 5 && this.heartsLeft > 0) {
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
