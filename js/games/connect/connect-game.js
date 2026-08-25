/**
 * Animal Onet Connect Game Controller (動物連連看)
 * 6x8 Grid (48 Tiles / 24 Pairs), SVG Line Path Drawing, Zero-Deadlock Guarantee
 */

class ConnectGameController {
  constructor(container, dateStr, playerName, onCloseCallback) {
    this.container = container;
    this.dateStr = dateStr;
    this.playerName = playerName;
    this.onClose = onCloseCallback;

    this.rows = 6;
    this.cols = 8;
    this.gridRows = 8; // Including padding (0..7)
    this.gridCols = 10; // Including padding (0..9)

    this.grid = [];
    this.selectedTile = null;
    this.remainingPairs = 24;
    this.isLock = false;

    this.timerInterval = null;
    this.startTime = null;
    this.elapsedMs = 0;
    this.isCompleted = false;

    this.rng = null;
  }

  init() {
    const seed = window.DailySeed.getSeedFromDate(`${this.dateStr}_connect`);
    this.rng = window.DailySeed.createSeededRandom(seed);

    this.generateGrid();
    this.render();
    this.startTimer();
  }

  generateGrid() {
    // 12 Animal Emojis x 4 Tiles each = 48 Tiles
    const icons = ['🐶', '🐱', '🐼', '🦁', '🐯', '🐰', '🦊', '🐮', '🐷', '🐵', '🐥', '🐸'];
    let tilePool = [];
    icons.forEach((icon, i) => {
      for (let k = 0; k < 4; k++) {
        tilePool.push({ id: `${i}_${k}`, icon });
      }
    });

    // Shuffle pool
    for (let i = tilePool.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [tilePool[i], tilePool[j]] = [tilePool[j], tilePool[i]];
    }

    // Build 8x10 padded grid (0..7, 0..9)
    this.grid = [];
    for (let r = 0; r < this.gridRows; r++) {
      const row = [];
      for (let c = 0; c < this.gridCols; c++) {
        if (r >= 1 && r <= 6 && c >= 1 && c <= 8) {
          const idx = (r - 1) * 8 + (c - 1);
          row.push(tilePool[idx]);
        } else {
          row.push(null); // Padding boundary cell
        }
      }
      this.grid.push(row);
    }

    // Ensure initial layout is solvable (Zero-Deadlock Guarantee)
    window.ConnectPathfinder.ensureSolvable(this.grid, this.rng);
  }

  startTimer() {
    if (this.startTime) return;
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      this.elapsedMs = Date.now() - this.startTime;
      const timerEl = this.container.querySelector('#cnt-timer-display');
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
    // Render 6x8 inner tiles grid
    let tilesHtml = '';
    for (let r = 1; r <= 6; r++) {
      for (let c = 1; c <= 8; c++) {
        const tile = this.grid[r][c];
        if (tile) {
          tilesHtml += `
            <div class="cnt-tile" data-r="${r}" data-c="${c}">
              <span class="cnt-tile-icon">${tile.icon}</span>
            </div>
          `;
        } else {
          tilesHtml += `<div class="cnt-tile is-empty" data-r="${r}" data-c="${c}"></div>`;
        }
      }
    }

    this.container.innerHTML = `
      <div class="connect-game-panel">
        <div class="cnt-header">
          <div class="cnt-header-left">
            <button id="cnt-back-btn" class="btn-icon" title="返回首頁">← 返回</button>
            <h2 class="cnt-title">🐶 動物連連看 每日關卡</h2>
          </div>
          <div class="cnt-stats-bar">
            <div class="cnt-stat-item">
              <span>⏱ 用時:</span>
              <span id="cnt-timer-display" class="cnt-stat-val">00:00.0</span>
            </div>
            <div class="cnt-stat-item">
              <span>✨ 剩餘:</span>
              <span id="cnt-pairs-display" class="cnt-stat-val">24</span> / 24 對
            </div>
          </div>
        </div>

        <div id="cnt-shuffle-banner" class="cnt-toast hidden">🔀 無感自動洗牌：確保隨時有牌可消！</div>

        <div class="cnt-board-wrapper">
          <svg id="cnt-svg-overlay" class="cnt-svg-overlay"></svg>
          <div class="cnt-grid-board">
            ${tilesHtml}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Back button
    const backBtn = this.container.querySelector('#cnt-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.stopTimer();
        if (this.onClose) this.onClose();
      });
    }

    // Tile clicks
    const tileEls = this.container.querySelectorAll('.cnt-grid-board .cnt-tile');
    tileEls.forEach(tileEl => {
      tileEl.addEventListener('click', () => {
        const r = parseInt(tileEl.getAttribute('data-r'), 10);
        const c = parseInt(tileEl.getAttribute('data-c'), 10);
        this.handleTileClick(r, c, tileEl);
      });
    });
  }

  handleTileClick(r, c, tileEl) {
    if (this.isLock || this.isCompleted) return;
    const tile = this.grid[r][c];
    if (!tile) return; // empty cell

    this.startTimer();

    if (!this.selectedTile) {
      // First selection
      this.selectedTile = { r, c, tile, el: tileEl };
      tileEl.classList.add('is-selected');
    } else {
      // Second selection
      if (this.selectedTile.r === r && this.selectedTile.c === c) {
        // Deselect same tile
        this.selectedTile.el.classList.remove('is-selected');
        this.selectedTile = null;
        return;
      }

      const t1 = this.selectedTile;
      const t2 = { r, c, tile, el: tileEl };

      // Check connection
      const connResult = window.ConnectPathfinder.canConnect(this.grid, t1.r, t1.c, t2.r, t2.c);

      if (connResult.can) {
        this.isLock = true;
        t2.el.classList.add('is-selected');

        // Draw line animation along path
        this.drawConnectingPath(connResult.path);

        setTimeout(() => {
          // Clear SVG path
          this.clearConnectingPath();

          // Eliminate tiles
          this.grid[t1.r][t1.c] = null;
          this.grid[t2.r][t2.c] = null;

          t1.el.className = 'cnt-tile is-empty';
          t1.el.innerHTML = '';
          t2.el.className = 'cnt-tile is-empty';
          t2.el.innerHTML = '';

          this.selectedTile = null;
          this.remainingPairs--;

          const pairsEl = this.container.querySelector('#cnt-pairs-display');
          if (pairsEl) pairsEl.textContent = this.remainingPairs;

          this.isLock = false;

          if (this.remainingPairs === 0) {
            this.handleGameCompletion();
          } else {
            // Check deadlock safeguard
            this.checkDeadlockSafeguard();
          }
        }, 250); // 250ms line display
      } else {
        // Cannot connect -> flash mismatch shake
        t2.el.classList.add('is-mismatched');
        setTimeout(() => {
          t1.el.classList.remove('is-selected');
          t2.el.classList.remove('is-mismatched');
          this.selectedTile = null;
        }, 300);
      }
    }
  }

  checkDeadlockSafeguard() {
    const validPair = window.ConnectPathfinder.findAnyValidPair(this.grid);
    if (!validPair) {
      // Deadlock detected! Trigger auto-shuffle
      window.ConnectPathfinder.ensureSolvable(this.grid, this.rng);

      // Show auto-shuffle toast & re-render board
      const toast = this.container.querySelector('#cnt-shuffle-banner');
      if (toast) {
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 1500);
      }

      this.reRenderTilesOnly();
    }
  }

  reRenderTilesOnly() {
    const gridBoard = this.container.querySelector('.cnt-grid-board');
    if (!gridBoard) return;

    let tilesHtml = '';
    for (let r = 1; r <= 6; r++) {
      for (let c = 1; c <= 8; c++) {
        const tile = this.grid[r][c];
        if (tile) {
          tilesHtml += `
            <div class="cnt-tile cnt-tile-shuffle" data-r="${r}" data-c="${c}">
              <span class="cnt-tile-icon">${tile.icon}</span>
            </div>
          `;
        } else {
          tilesHtml += `<div class="cnt-tile is-empty" data-r="${r}" data-c="${c}"></div>`;
        }
      }
    }
    gridBoard.innerHTML = tilesHtml;
    this.bindEvents();
  }

  drawConnectingPath(path) {
    const svg = this.container.querySelector('#cnt-svg-overlay');
    if (!svg || !path || path.length < 2) return;

    const board = this.container.querySelector('.cnt-grid-board');
    const boardRect = board.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();

    // Map grid (r, c) into center coordinates of SVG (including padding margin)
    // Board is 6x8 tiles inside, grid is 8x10 with padding
    const cellW = boardRect.width / 8;
    const cellH = boardRect.height / 6;

    const points = path.map(p => {
      // p.r (0..7), p.c (0..9)
      const x = (p.c - 0.5) * cellW;
      const y = (p.r - 0.5) * cellH;
      return `${x},${y}`;
    }).join(' ');

    svg.innerHTML = `
      <polyline points="${points}" class="cnt-path-line" />
    `;
  }

  clearConnectingPath() {
    const svg = this.container.querySelector('#cnt-svg-overlay');
    if (svg) svg.innerHTML = '';
  }

  handleGameCompletion() {
    this.isCompleted = true;
    this.stopTimer();

    // Save completion record
    window.GameStorage.recordGameCompletion(
      'connect',
      this.dateStr,
      this.playerName,
      this.elapsedMs
    );

    // Confetti Celebration
    this.triggerConfetti();

    // Transition to 5s Sponsor Ad then Leaderboard
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

window.ConnectGameController = ConnectGameController;
