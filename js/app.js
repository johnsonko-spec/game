/**
 * Main Application Entrance & Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const playerInput = document.getElementById('player-name-input');
  const resetBtn = document.getElementById('reset-all-records-btn');
  const cardsGrid = document.getElementById('cards-grid');
  const fullOverlay = document.getElementById('full-game-overlay');

  const todayStr = window.DailySeed.getTodayDateString();

  // 1. Initialize Player Name
  const savedName = window.GameStorage.getPlayerName();
  if (savedName) {
    playerInput.value = savedName;
  }

  // Auto-save on input change without submit button
  playerInput.addEventListener('input', (e) => {
    window.GameStorage.setPlayerName(e.target.value);
    playerInput.classList.remove('input-error');
  });

  // Reset all records button
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('確定要清除所有本機遊玩紀錄與跨裝置排行榜，以便重新測試嗎？')) {
        window.GameStorage.clearAllLocalRecords();

        // Wipe Firebase Realtime Database leaderboards
        fetch('https://minigame-759c4-default-rtdb.firebaseio.com/leaderboards.json', {
          method: 'DELETE'
        }).then(() => {
          alert('🧹 所有遊玩紀錄與全網排行榜已成功清除！可開始全新測試。');
          renderCards();
        }).catch(() => {
          alert('🧹 本機遊玩紀錄已成功清除！');
          renderCards();
        });
      }
    });
  }

  // 2. Define 6 Game Cards Metadata
  const gamesList = [
    {
      id: 'mahjong',
      name: '麻將聽牌',
      icon: '🀄',
      desc: '給定 16 張聽牌手牌，點擊找出所有能胡的牌！',
      status: 'active'
    },
    {
      id: 'memory',
      name: '撲克記憶',
      icon: '🃏',
      desc: '翻牌尋找 8 對相同撲克數字，考驗極速記憶！',
      status: 'active'
    },
    {
      id: 'connect',
      name: '動物連連看',
      icon: '🐶',
      desc: '配對相同可愛動物，連線轉折不超過 2 次！',
      status: 'active'
    },
    {
      id: 'sudoku',
      name: '迷你數獨',
      icon: '🧩',
      desc: '填入 1~6 數字，同行同列同宮不重複！',
      status: 'active'
    },
    {
      id: 'frogdoku',
      name: '青蛙擺放',
      icon: '🐸',
      desc: '每行每列每色1隻青蛙，青蛙不能相鄰！',
      status: 'active'
    },
    { id: 'game6', name: '記憶矩陣', icon: '🧠', desc: '空間與順序記憶挑戰', status: 'coming_soon' }
  ];

  // 3. Render Game Cards
  function renderCards() {
    cardsGrid.innerHTML = gamesList.map(game => {
      if (game.status === 'coming_soon') {
        return `
          <div class="game-card is-coming-soon">
            <div class="card-header">
              <span class="card-badge badge-soon">建立中</span>
            </div>
            <div class="card-body">
              <div class="card-icon">${game.icon}</div>
              <div class="card-title">${game.name}</div>
              <div class="card-desc">敬請期待，關卡籌備中...</div>
            </div>
            <div class="card-footer">
              <span>🚧 尚未開放</span>
            </div>
          </div>
        `;
      }

      // Active Game
      const completion = window.GameStorage.getGameCompletion(game.id, todayStr);
      const isDone = !!completion;

      return `
        <div class="game-card is-active" data-game-id="${game.id}">
          <div class="card-header">
            <span class="card-badge ${isDone ? 'badge-completed' : 'badge-active'}">
              ${isDone ? '🏆 今日已通關' : '🟢 每日關卡'}
            </span>
          </div>
          <div class="card-body">
            <div class="card-icon">${game.icon}</div>
            <div class="card-title">${game.name}</div>
            <div class="card-desc">${game.desc}</div>
          </div>
          <div class="card-footer">
            <span>${isDone ? '查看排行榜' : '點擊開始遊戲'}</span>
            <span class="cta-arrow">→</span>
          </div>
        </div>
      `;
    }).join('');

    // Bind card click listeners
    const activeCards = cardsGrid.querySelectorAll('.game-card.is-active');
    activeCards.forEach(cardEl => {
      cardEl.addEventListener('click', () => {
        const gameId = cardEl.getAttribute('data-game-id');
        handleGameCardClick(gameId);
      });
    });
  }

  // 4. Handle Active Game Card Click
  function handleGameCardClick(gameId) {
    const playerName = playerInput.value.trim();
    if (!playerName) {
      playerInput.focus();
      playerInput.classList.add('input-error');
      alert('請先輸入玩家姓名再開始遊戲！');
      return;
    }

    const completion = window.GameStorage.getGameCompletion(gameId, todayStr);

    cardsGrid.style.display = 'none';
    fullOverlay.classList.add('is-visible');

    if (completion) {
      // Show 5s Sponsor Ad first, then Leaderboard
      showAdThenLeaderboard(gameId);
    } else {
      if (gameId === 'mahjong') {
        const controller = new window.MahjongGameController(
          fullOverlay,
          todayStr,
          playerName,
          (completed) => {
            if (completed) {
              showAdThenLeaderboard(gameId);
            } else {
              collapseToHomeGrid();
            }
          }
        );
        controller.init();
      } else if (gameId === 'memory') {
        const controller = new window.MemoryGameController(
          fullOverlay,
          todayStr,
          playerName,
          (completed) => {
            if (completed) {
              showAdThenLeaderboard(gameId);
            } else {
              collapseToHomeGrid();
            }
          }
        );
        controller.init();
      } else if (gameId === 'connect') {
        const controller = new window.ConnectGameController(
          fullOverlay,
          todayStr,
          playerName,
          (completed) => {
            if (completed) {
              showAdThenLeaderboard(gameId);
            } else {
              collapseToHomeGrid();
            }
          }
        );
        controller.init();
      } else if (gameId === 'sudoku') {
        const controller = new window.SudokuGameController(
          fullOverlay,
          todayStr,
          playerName,
          (completed) => {
            if (completed) {
              showAdThenLeaderboard(gameId);
            } else {
              collapseToHomeGrid();
            }
          }
        );
        controller.init();
      } else if (gameId === 'frogdoku') {
        const controller = new window.FrogdokuGameController(
          fullOverlay,
          todayStr,
          playerName,
          (completed) => {
            if (completed) {
              showAdThenLeaderboard(gameId);
            } else {
              collapseToHomeGrid();
            }
          }
        );
        controller.init();
      }
    }
  }

  function collapseToHomeGrid() {
    fullOverlay.classList.remove('is-visible');
    fullOverlay.innerHTML = '';
    cardsGrid.style.display = 'grid';
    renderCards();
  }

  // 5. Show 5s Sponsor Ad then transition to Leaderboard
  function showAdThenLeaderboard(gameId) {
    cardsGrid.style.display = 'none';
    fullOverlay.classList.add('is-visible');
    window.SponsorAd.renderSponsorAd(fullOverlay, todayStr, gameId, () => {
      showLeaderboardView(gameId);
    });
  }

  // 6. Display Leaderboard in Full Overlay View with Realtime Sync
  function showLeaderboardView(gameId) {
    const playerName = playerInput.value.trim();
    const gameObj = gamesList.find(g => g.id === gameId);
    const titleText = gameObj ? gameObj.name : '每日遊戲';

    fullOverlay.innerHTML = `
      <div class="lb-view-wrapper">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
          <button id="lb-back-btn" class="btn-icon">← 返回首頁</button>
          <span style="color:var(--text-muted); font-size:0.9rem;">📅 日期: ${todayStr}</span>
        </div>
        <div id="lb-mount"></div>
      </div>
    `;

    const mount = fullOverlay.querySelector('#lb-mount');

    // Realtime subscription to Firebase cross-device database
    window.GameStorage.subscribeRealtimeLeaderboard(gameId, todayStr, (realtimeList) => {
      window.LeaderboardUI.renderLeaderboard(mount, realtimeList, playerName, `${titleText} 今日跨裝置實時排行榜`);
    });

    const backBtn = fullOverlay.querySelector('#lb-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        collapseToHomeGrid();
      });
    }
  }

  // Initial render
  renderCards();
});
