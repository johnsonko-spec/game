/**
 * LocalStorage & Firebase Realtime Database Cross-Device Storage Manager
 */

const DB_URL = "https://minigame-759c4-default-rtdb.firebaseio.com";

// LocalStorage Keys Prefix
const PLAYER_NAME_KEY = "daily_challenge_player_name";
const GAME_RECORD_PREFIX = "game_record_";

/**
 * Sanitize player name for Firebase key paths (replaces . # $ [ ])
 */
function sanitizeKey(str) {
  return (str || "Anonymous").replace(/[.#$\[\]]/g, "_");
}

/**
 * Save / Get Player Name
 */
function getPlayerName() {
  return localStorage.getItem(PLAYER_NAME_KEY) || "";
}

function setPlayerName(name) {
  localStorage.setItem(PLAYER_NAME_KEY, name.trim());
}

/**
 * Local Game Record Storage Functions
 */
function getGameCompletion(gameId, dateStr) {
  const raw = localStorage.getItem(`${GAME_RECORD_PREFIX}${gameId}_${dateStr}`);
  return raw ? JSON.parse(raw) : null;
}

function recordGameCompletion(gameId, dateStr, playerName, completionTimeMs) {
  const record = {
    gameId,
    dateStr,
    playerName: playerName || "匿名玩家",
    completionTimeMs,
    timestamp: Date.now()
  };

  // Save to LocalStorage
  localStorage.setItem(`${GAME_RECORD_PREFIX}${gameId}_${dateStr}`, JSON.stringify(record));

  // Sync to Firebase Realtime Database asynchronously
  syncToFirebaseRealtime(record);

  return record;
}

/**
 * Clear all local completion records
 */
function clearAllLocalRecords() {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(GAME_RECORD_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}

/**
 * Sync record to Firebase Realtime Database path: /leaderboards/{gameId}/{dateStr}/{sanitizedPlayerName}
 */
function syncToFirebaseRealtime(record) {
  const sanitizedName = sanitizeKey(record.playerName);
  const endpoint = `${DB_URL}/leaderboards/${record.gameId}/${record.dateStr}/${sanitizedName}.json`;

  fetch(endpoint, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record)
  }).catch(err => {
    console.warn("Firebase sync warning:", err);
  });
}

/**
 * Real-time subscription listener to Firebase leaderboard
 * @param {string} gameId 
 * @param {string} dateStr 
 * @param {Function} callback (Array of records sorted by completionTimeMs)
 */
function subscribeRealtimeLeaderboard(gameId, dateStr, callback) {
  if (typeof firebase === "undefined" || !firebase.apps || firebase.apps.length === 0) {
    fetch(`${DB_URL}/leaderboards/${gameId}/${dateStr}.json`)
      .then(res => res.json())
      .then(data => {
        const list = data ? Object.values(data) : [];
        list.sort((a, b) => a.completionTimeMs - b.completionTimeMs);
        callback(list);
      })
      .catch(() => callback([]));
    return;
  }

  const db = firebase.database();
  const ref = db.ref(`leaderboards/${gameId}/${dateStr}`);

  ref.on("value", snapshot => {
    const data = snapshot.val();
    const list = data ? Object.values(data) : [];
    list.sort((a, b) => a.completionTimeMs - b.completionTimeMs);
    callback(list);
  });
}

window.GameStorage = {
  getPlayerName,
  setPlayerName,
  getGameCompletion,
  recordGameCompletion,
  clearAllLocalRecords,
  subscribeRealtimeLeaderboard
};
