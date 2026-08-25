/**
 * LocalStorage & Firebase Realtime Database Data Management Module
 * Enables cross-device real-time leaderboard sharing
 */

const STORAGE_KEYS = {
  PLAYER_NAME: 'daily_game_player_name',
  COMPLETED_PREFIX: 'daily_game_completed_',
  LEADERBOARD_PREFIX: 'daily_game_leaderboard_'
};

const firebaseConfig = {
  apiKey: "AIzaSyDcUWWl6OsIKsU4h1XOM9Oom3iCb1jGc3Q",
  authDomain: "minigame-759c4.firebaseapp.com",
  databaseURL: "https://minigame-759c4-default-rtdb.firebaseio.com",
  projectId: "minigame-759c4",
  storageBucket: "minigame-759c4.firebasestorage.app",
  messagingSenderId: "329552831574",
  appId: "1:329552831574:web:8e15f328e0f90efb7e47f7"
};

let db = null;
let realtimeListeners = {};

// Initialize Firebase Realtime Database
try {
  if (window.firebase) {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.database();
    console.log("Firebase Realtime Database initialized successfully!");
  }
} catch (e) {
  console.warn("Firebase initialization warning:", e);
}

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
 * Check if a game was completed today locally
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
 * Record game completion to localStorage & Firebase Realtime Database
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

  // 1. Save local completion status
  const completedKey = `${STORAGE_KEYS.COMPLETED_PREFIX}${gameId}_${dateStr}`;
  localStorage.setItem(completedKey, JSON.stringify(completionData));

  // 2. Save to local fallback leaderboard
  const lbKey = `${STORAGE_KEYS.LEADERBOARD_PREFIX}${gameId}_${dateStr}`;
  let localLb = getLeaderboard(gameId, dateStr);
  const existingIdx = localLb.findIndex(item => item.playerName === playerName);
  if (existingIdx >= 0) {
    if (completionTimeMs < localLb[existingIdx].completionTimeMs) {
      localLb[existingIdx] = completionData;
    }
  } else {
    localLb.push(completionData);
  }
  localLb.sort((a, b) => a.completionTimeMs - b.completionTimeMs);
  localStorage.setItem(lbKey, JSON.stringify(localLb));

  // 3. Push/Update to Firebase Realtime Database for Cross-Device Sync
  if (db) {
    try {
      const sanitizedName = playerName.replace(/[.#$[\]]/g, '_');
      const playerRef = db.ref(`leaderboards/${gameId}/${dateStr}/${sanitizedName}`);
      
      playerRef.get().then((snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          if (completionTimeMs < val.completionTimeMs) {
            playerRef.set(completionData);
          }
        } else {
          playerRef.set(completionData);
        }
      }).catch((err) => {
        console.error("Firebase write error:", err);
      });
    } catch (err) {
      console.error("Firebase sync exception:", err);
    }
  }

  return completionData;
}

/**
 * Get leaderboard for a game on a date (merged local + Firebase cache)
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

/**
 * Subscribe to realtime leaderboard updates from Firebase
 * @param {string} gameId 
 * @param {string} dateStr 
 * @param {Function} callback (list) => void
 */
function subscribeRealtimeLeaderboard(gameId, dateStr, callback) {
  // First emit local data instantly
  const localList = getLeaderboard(gameId, dateStr);
  if (callback) callback(localList);

  if (!db) return;

  const path = `leaderboards/${gameId}/${dateStr}`;
  const ref = db.ref(path);

  // Unsubscribe existing listener if any
  if (realtimeListeners[path]) {
    ref.off('value', realtimeListeners[path]);
  }

  const listener = ref.on('value', (snapshot) => {
    const val = snapshot.val();
    const list = [];
    if (val) {
      Object.keys(val).forEach(key => {
        list.push(val[key]);
      });
      list.sort((a, b) => a.completionTimeMs - b.completionTimeMs);

      // Save synced list to localStorage cache
      const lbKey = `${STORAGE_KEYS.LEADERBOARD_PREFIX}${gameId}_${dateStr}`;
      localStorage.setItem(lbKey, JSON.stringify(list));
    }
    if (callback) callback(list);
  }, (err) => {
    console.warn("Firebase Realtime read error:", err);
  });

  realtimeListeners[path] = listener;
}

window.GameStorage = {
  getPlayerName,
  setPlayerName,
  getGameCompletion,
  recordGameCompletion,
  getLeaderboard,
  subscribeRealtimeLeaderboard
};
