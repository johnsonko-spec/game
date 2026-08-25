/**
 * Classic Poker Memory Match Controller (撲克牌記憶翻牌)
 * 16 Cards (8 Pairs of 1~8), 0.5s delay on mismatch, 3D CSS Card Flip, Daily Seed Shuffle
 */

class MemoryGameController {
  constructor(container, dateStr, playerName, onCloseCallback) {
    this.container = container;
    this.dateStr = dateStr;
    this.playerName = playerName;
    this.onClose = onCloseCallback;

    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.movesCount = 0;
    this.isLock = false;

    this.timerInterval = null;
    this.startTime = null;
    this.elapsedMs = 0;
    this.isCompleted = false;
  }

  init() {
    this.generateCards();
    this.render();
    this.startTimer();
  }

  generateCards() {
    // 8 Pairs of Poker Cards (Numbers 1~8)
    const basePairs = [
      { num: 1, label: 'A', suit1: '♠', suit2: '♥' },
      { num: 2, label: '2', suit1: '♣', suit2: '♦' },
      { num: 3, label: '3', suit1: '♠', suit2: '♥' },
      { num: 4, label: '4', suit1: '♣', suit2: '♦' },
      { num: 5, label: '5', suit1: '♠', suit2: '♥' },
      { num: 6, label: '6', suit1: '♣', suit2: '♦' },
      { num: 7, label: '7', suit1: '♠', suit2: '♥' },
      { num: 8, label: '8', suit1: '♣', suit2: '♦' }
    ];

    let deck = [];
    basePairs.forEach((pair, idx) => {
      deck.push({
        id: `${pair.num}_1`,
        pairId: pair.num,
        label: pair.label,
        suit: pair.suit1,
        isRed: pair.suit1 === '♥' || pair.suit1 === '♦',
        isFlipped: false,
        isMatched: false
      });
      deck.push({
        id: `${pair.num}_2`,
        pairId: pair.num,
        label: pair.label,
        suit: pair.suit2,
        isRed: pair.suit2 === '♥' || pair.suit2 === '♦',
        isFlipped: false,
        isMatched: false
      });
    });

    // Seeded Fisher-Yates Shuffle
    const seed = window.DailySeed.getSeedFromDate(`${this.dateStr}_memory`);
    const rng = window.DailySeed.createSeededRandom(seed);

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    this.cards = deck;
  }

  startTimer() {
    if (this.startTime) return;
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      this.elapsedMs = Date.now() - this.startTime;
      const timerEl = this.container.querySelector('#mem-timer-display');
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
    const cardsGridHtml = this.cards.map((card, idx) => {
      return `
        <div class="mem-card" data-index="${idx}">
          <div class="mem-card-face mem-card-back">
            <div class="mem-card-back-pattern">🃏</div>
          </div>
          <div class="mem-card-face mem-card-front ${card.isRed ? 'suit-red' : 'suit-black'}">
            <div class="mem-card-corner">
              <span>${card.label}</span>
              <span>${card.suit}</span>
            </div>
            <div class="mem-card-center-icon">${card.suit}</div>
            <div class="mem-card-corner" style="transform: rotate(180deg);">
              <span>${card.label}</span>
              <span>${card.suit}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="memory-game-panel">
        <div class="mem-header">
          <div class="mem-header-left">
            <button id="mem-back-btn" class="btn-icon" title="返回首頁">← 返回</button>
            <h2 class="mem-title">🃏 撲克記憶 每日關卡</h2>
          </div>
          <div class="mem-stats-bar">
            <div class="mem-stat-item">
              <span>⏱ 用時:</span>
              <span id="mem-timer-display" class="mem-stat-val">00:00.0</span>
            </div>
            <div class="mem-stat-item">
              <span>🎯 翻牌:</span>
              <span id="mem-moves-display" class="mem-stat-val">0</span> 次
            </div>
            <div class="mem-stat-item">
              <span>✨ 配對:</span>
              <span id="mem-pairs-display" class="mem-stat-val">0</span> / 8 對
            </div>
          </div>
        </div>

        <div class="mem-grid-container">
          ${cardsGridHtml}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Back button
    const backBtn = this.container.querySelector('#mem-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.stopTimer();
        if (this.onClose) this.onClose();
      });
    }

    // Card click event listeners
    const cardEls = this.container.querySelectorAll('.mem-card');
    cardEls.forEach(cardEl => {
      cardEl.addEventListener('click', () => {
        const idx = parseInt(cardEl.getAttribute('data-index'), 10);
        this.handleCardClick(idx, cardEl);
      });
    });
  }

  handleCardClick(index, cardEl) {
    if (this.isLock || this.isCompleted) return;

    const card = this.cards[index];
    if (card.isFlipped || card.isMatched) return;

    // Start timer on first card flip
    this.startTimer();

    // Flip card
    card.isFlipped = true;
    cardEl.classList.add('is-flipped');
    this.flippedCards.push({ index, card, el: cardEl });

    if (this.flippedCards.length === 2) {
      this.movesCount++;
      const movesEl = this.container.querySelector('#mem-moves-display');
      if (movesEl) movesEl.textContent = this.movesCount;

      this.checkMatch();
    }
  }

  checkMatch() {
    this.isLock = true;
    const [c1, c2] = this.flippedCards;

    if (c1.card.pairId === c2.card.pairId) {
      // --- MATCH SUCCESS ---
      c1.card.isMatched = true;
      c2.card.isMatched = true;

      c1.el.classList.add('is-matched');
      c2.el.classList.add('is-matched');

      this.matchedPairs++;
      const pairsEl = this.container.querySelector('#mem-pairs-display');
      if (pairsEl) pairsEl.textContent = this.matchedPairs;

      this.flippedCards = [];
      this.isLock = false;

      // Check win condition (all 8 pairs matched)
      if (this.matchedPairs === 8) {
        this.handleGameCompletion();
      }
    } else {
      // --- MATCH FAILURE (Wait 0.5s / 500ms then flip back) ---
      c1.el.classList.add('is-mismatched');
      c2.el.classList.add('is-mismatched');

      setTimeout(() => {
        c1.card.isFlipped = false;
        c2.card.isFlipped = false;

        c1.el.classList.remove('is-flipped', 'is-mismatched');
        c2.el.classList.remove('is-flipped', 'is-mismatched');

        this.flippedCards = [];
        this.isLock = false;
      }, 500); // 0.5 seconds delay as requested in PRD
    }
  }

  handleGameCompletion() {
    this.isCompleted = true;
    this.stopTimer();

    // Save completion record
    window.GameStorage.recordGameCompletion(
      'memory',
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

window.MemoryGameController = MemoryGameController;
