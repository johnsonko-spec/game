/**
 * Mahjong Embedded Game Controller
 */

class MahjongGameController {
  constructor(container, dateStr, playerName, onCloseCallback) {
    this.container = container;
    this.dateStr = dateStr;
    this.playerName = playerName;
    this.onClose = onCloseCallback;

    this.puzzle = null;
    this.selectedAnswers = new Set();
    this.timerInterval = null;
    this.startTime = null;
    this.elapsedMs = 0;
    this.isCompleted = false;
  }

  init() {
    // Generate today's puzzle
    this.puzzle = window.MahjongGenerator.generateDailyPuzzle(this.dateStr);
    this.render();
    this.startTimer();
  }

  startTimer() {
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      this.elapsedMs = Date.now() - this.startTime;
      const timerEl = this.container.querySelector('#mj-timer-display');
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
    const tilesHtml = this.puzzle.hand.map(tileId => {
      return window.MahjongTiles.createTileHtml(tileId);
    }).join('');

    // Hand tile count map to disable options with 4 tiles in hand
    const handCounts = {};
    this.puzzle.hand.forEach(id => {
      handCounts[id] = (handCounts[id] || 0) + 1;
    });

    // Generate answer selection grids for 4 categories
    const categories = [
      { key: 'wan', title: '萬子', tiles: ['1m','2m','3m','4m','5m','6m','7m','8m','9m'] },
      { key: 'tiao', title: '條子', tiles: ['1s','2s','3s','4s','5s','6s','7s','8s','9s'] },
      { key: 'bing', title: '餅子', tiles: ['1p','2p','3p','4p','5p','6p','7p','8p','9p'] },
      { key: 'zi', title: '字牌', tiles: ['E','S','W','N','C','F','P'] }
    ];

    const gridSectionsHtml = categories.map(cat => {
      const optionsHtml = cat.tiles.map(tileId => {
        const isSelected = this.selectedAnswers.has(tileId);
        const isDisabled = (handCounts[tileId] || 0) >= 4;
        return window.MahjongTiles.createTileHtml(tileId, {
          selectable: true,
          selected: isSelected,
          disabled: isDisabled
        });
      }).join('');

      return `
        <div class="option-row">
          <div class="option-row-label">${cat.title}</div>
          <div class="option-row-tiles">${optionsHtml}</div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="mahjong-game-panel">
        <div class="mj-header">
          <div class="mj-header-left">
            <button id="mj-back-btn" class="btn-icon" title="返回首頁">← 返回</button>
            <h2 class="mj-title">🀄 麻將聽牌 每日關卡</h2>
          </div>
          <div class="mj-timer-box">
            <span class="mj-timer-label">⏱ 用時</span>
            <span id="mj-timer-display" class="mj-timer-val">00:00.0</span>
          </div>
        </div>

        <div id="mj-feedback-banner" class="mj-feedback hidden"></div>

        <div class="mj-section">
          <div class="mj-section-header">
            <span>📋 你的手牌 (16張暗牌)</span>
            <span class="mj-hint-tag">請找出所有能胡的牌</span>
          </div>
          <div class="mj-hand-container">
            ${tilesHtml}
          </div>
        </div>

        <div class="mj-section">
          <div class="mj-section-header">
            <span>🎯 選擇答案 (點擊選擇所有聽牌)</span>
            <span class="selected-count">已選擇 ${this.selectedAnswers.size} 張</span>
          </div>
          <div class="mj-options-container">
            ${gridSectionsHtml}
          </div>
        </div>

        <div class="mj-actions">
          <button id="mj-submit-btn" class="btn-primary btn-submit">
            🚀 送出答案
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Back button
    const backBtn = this.container.querySelector('#mj-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.stopTimer();
        if (this.onClose) this.onClose();
      });
    }

    // Selectable options click
    const optionTiles = this.container.querySelectorAll('.mj-options-container .mj-tile');
    optionTiles.forEach(tileEl => {
      tileEl.addEventListener('click', (e) => {
        if (tileEl.classList.contains('is-disabled') || this.isCompleted) return;
        const tileId = tileEl.getAttribute('data-tile');
        if (this.selectedAnswers.has(tileId)) {
          this.selectedAnswers.delete(tileId);
        } else {
          this.selectedAnswers.add(tileId);
        }
        this.updateSelectionUI();
      });
    });

    // Submit button
    const submitBtn = this.container.querySelector('#mj-submit-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.handleSubmit());
    }
  }

  updateSelectionUI() {
    // Update count display
    const countEl = this.container.querySelector('.selected-count');
    if (countEl) {
      countEl.textContent = `已選擇 ${this.selectedAnswers.size} 張`;
    }

    // Toggle selected class on tile elements
    const optionTiles = this.container.querySelectorAll('.mj-options-container .mj-tile');
    optionTiles.forEach(tileEl => {
      const tileId = tileEl.getAttribute('data-tile');
      if (this.selectedAnswers.has(tileId)) {
        tileEl.classList.add('is-selected');
      } else {
        tileEl.classList.remove('is-selected');
      }
    });
  }

  handleSubmit() {
    if (this.isCompleted) return;

    const userSelected = Array.from(this.selectedAnswers);
    const correctAnswers = this.puzzle.answers;

    // Check equivalence
    const isCorrect = userSelected.length === correctAnswers.length &&
      userSelected.every(id => correctAnswers.includes(id));

    const panel = this.container.querySelector('.mahjong-game-panel');
    const feedback = this.container.querySelector('#mj-feedback-banner');

    if (isCorrect) {
      this.isCompleted = true;
      this.stopTimer();

      // Save record
      window.GameStorage.recordGameCompletion(
        'mahjong',
        this.dateStr,
        this.playerName,
        this.elapsedMs
      );

      // Feedback animation & text
      feedback.className = 'mj-feedback success-banner';
      feedback.innerHTML = `
        <div class="feedback-content">
          <span>🎉 恭喜答對！你花了 <strong>${window.LeaderboardUI.formatTime(this.elapsedMs)}</strong> 通關！</span>
        </div>
      `;
      feedback.classList.remove('hidden');

      // Trigger Confetti
      this.triggerConfetti();

      // Transition to Leaderboard view after 1.8 seconds
      setTimeout(() => {
        if (this.onClose) this.onClose(true); // completed transition
      }, 1800);

    } else {
      // Wrong answer
      panel.classList.remove('shake');
      void panel.offsetWidth; // trigger reflow
      panel.classList.add('shake');

      feedback.className = 'mj-feedback error-banner';
      feedback.innerHTML = `
        <div class="feedback-content">
          <span>❌ 答錯了！聽牌組合不正確，請再試試！</span>
        </div>
      `;
      feedback.classList.remove('hidden');
    }
  }

  triggerConfetti() {
    // Simple festive visual particles
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

window.MahjongGameController = MahjongGameController;
