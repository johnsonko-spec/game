/**
 * Leaderboard UI Renderer
 */

/**
 * Format milliseconds into MM:SS.s format
 * @param {number} ms 
 * @returns {string}
 */
function formatTime(ms) {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((ms % 1000) / 100);

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${mm}:${ss}.${tenths}`;
}

/**
 * Render leaderboard HTML into target container
 * @param {HTMLElement} container 
 * @param {Array<object>} list 
 * @param {string} currentPlayerName 
 * @param {string} gameTitle 
 */
function renderLeaderboard(container, list, currentPlayerName, gameTitle = '今日排行榜') {
  if (!list || list.length === 0) {
    container.innerHTML = `
      <div class="leaderboard-card">
        <div class="leaderboard-header">
          <span class="lb-title">🏆 ${gameTitle}</span>
        </div>
        <div class="leaderboard-empty">
          <p>尚無玩家完成遊戲，快成為第一個挑戰者吧！</p>
        </div>
      </div>
    `;
    return;
  }

  let rowsHtml = list.map((item, idx) => {
    const rank = idx + 1;
    const isCurrentPlayer = item.playerName === currentPlayerName;
    const rankBadgeClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
    const rankSymbol = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;

    return `
      <div class="lb-row ${isCurrentPlayer ? 'is-self' : ''}">
        <div class="lb-rank ${rankBadgeClass}">${rankSymbol}</div>
        <div class="lb-name">
          ${item.playerName}
          ${isCurrentPlayer ? '<span class="self-tag">(你)</span>' : ''}
        </div>
        <div class="lb-time">${formatTime(item.completionTimeMs)}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="leaderboard-card">
      <div class="leaderboard-header">
        <span class="lb-title">🏆 ${gameTitle}</span>
        <span class="lb-count">共 ${list.length} 人通關</span>
      </div>
      <div class="lb-list">
        ${rowsHtml}
      </div>
    </div>
  `;
}

window.LeaderboardUI = {
  formatTime,
  renderLeaderboard
};
