/**
 * LocalStorage Data Management Module
 */

const STORAGE_KEYS = {
  PLAYER_NAME: 'daily_game_player_name',
  COMPLETED_PREFIX: 'daily_game_completed_',
  LEADERBOARD_PREFIX: 'daily_game_leaderboard_'
};

/**
 * Get saved player name
 * @returns {string}
 */
function getPlayerName() {
  return localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || '';
}

/**
 * Save player name
 * @param {string} name 
 */
function setPlayerName(name) {
  localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name.trim());
}

/**
 * Check if a game was completed today
 * @param {string} gameId 
 * @param {string} dateStr 
 * @returns {object|null} completion info or null
 */
function getGameCompletion(gameId, dateStr) {
  const key = `${STORAGE_KEYS.COMPLETED_PREFIX}${gameId}_${dateStr}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Mark a game as completed today and record to leaderboard
 * @param {string} gameId 
 * @param {string} dateStr 
 * @param {string} playerName 
 * @param {number} completionTimeMs 
 */
function recordGameCompletion(gameId, dateStr, playerName, completionTimeMs) {
  const completionData = {
    playerName,
    completionTimeMs,
    completedAt: new Date().toISOString()
  };

  // Mark completed
  const completedKey = `${STORAGE_KEYS.COMPLETED_PREFIX}${gameId}_${dateStr}`;
  localStorage.setItem(completedKey, JSON.stringify(completionData));

  // Add to leaderboard
  const lbKey = `${STORAGE_KEYS.LEADERBOARD_PREFIX}${gameId}_${dateStr}`;
  let leaderboard = getLeaderboard(gameId, dateStr);

  // Check if player already in leaderboard (update if better or append)
  const existingIdx = leaderboard.findIndex(item => item.playerName === playerName);
  if (existingIdx >= 0) {
    if (completionTimeMs < leaderboard[existingIdx].completionTimeMs) {
      leaderboard[existingIdx] = completionData;
    }
  } else {
    leaderboard.push(completionData);
  }

  // Sort by time ascending
  leaderboard.sort((a, b) => a.completionTimeMs - b.completionTimeMs);

  localStorage.setItem(lbKey, JSON.stringify(leaderboard));
  return completionData;
}

/**
 * Get leaderboard for a game on a date
 * @param {string} gameId 
 * @param {string} dateStr 
 * @returns {Array<object>}
 */
function getLeaderboard(gameId, dateStr) {
  const lbKey = `${STORAGE_KEYS.LEADERBOARD_PREFIX}${gameId}_${dateStr}`;
  const data = localStorage.getItem(lbKey);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

window.GameStorage = {
  getPlayerName,
  setPlayerName,
  getGameCompletion,
  recordGameCompletion,
  getLeaderboard
};
