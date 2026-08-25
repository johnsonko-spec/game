/**
 * Interstitial Sponsor Ad Controller
 * Manages multi-ad rotation (Roo Financial Card & JUJI Bill Reminder)
 * Handles 5-second countdown & redirect to https://roo.cash/
 */

const AD_POOL = [
  {
    id: 'roo-card',
    title: '袋鼠金融 2026 海外消費卡推薦',
    image: 'assets/images/ad-banner.jpg',
    link: 'https://roo.cash/'
  },
  {
    id: 'juji-bill',
    title: 'JUJI 的這期帳單快到期了，請記得繳費',
    image: 'assets/images/juji-bill-ad.png',
    link: 'https://roo.cash/'
  }
];

/**
 * Deterministically pick an ad from AD_POOL based on dateStr + gameId
 * Ensures different days or different games show alternating ad images!
 * @param {string} dateStr 
 * @param {string} gameId 
 * @returns {object}
 */
function getSponsorAd(dateStr, gameId) {
  const seedString = `${dateStr}_${gameId}`;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = ((hash << 5) - hash) + seedString.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AD_POOL.length;
  return AD_POOL[index];
}

/**
 * Render 5-second Interstitial Sponsor Ad inside container
 * @param {HTMLElement} container 
 * @param {string} dateStr 
 * @param {string} gameId 
 * @param {Function} onComplete 
 */
function renderSponsorAd(container, dateStr, gameId, onComplete) {
  const ad = getSponsorAd(dateStr, gameId);
  let countdown = 5;
  let timerInterval = null;

  function finish() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    if (onComplete) onComplete();
  }

  container.innerHTML = `
    <div class="ad-sponsor-wrapper">
      <div class="ad-top-bar">
        <div class="ad-timer-tag">
          ⏳ 贊助廣告 | <span id="ad-countdown-num" class="ad-num">${countdown}</span> 秒後進入排行榜...
        </div>
        <button id="ad-skip-btn" class="btn-icon ad-skip-btn">跳過廣告 →</button>
      </div>

      <div class="ad-banner-card">
        <a href="${ad.link}" target="_blank" rel="noopener noreferrer" class="ad-banner-link" title="點擊前往：${ad.link}">
          <div class="ad-img-wrapper">
            <img src="${ad.image}" alt="${ad.title}" class="ad-banner-img" />
            <div class="ad-click-overlay">
              <span>🔗 點擊圖片了解更多 ↗</span>
            </div>
          </div>
        </a>
      </div>

      <div class="ad-bottom-hint">
        📢 贊助展示 · 點擊廣告可開啟新視窗前往指定網頁
      </div>
    </div>
  `;

  // Bind countdown timer
  const numEl = container.querySelector('#ad-countdown-num');
  timerInterval = setInterval(() => {
    countdown--;
    if (numEl) numEl.textContent = countdown;
    if (countdown <= 0) {
      finish();
    }
  }, 1000);

  // Bind skip button
  const skipBtn = container.querySelector('#ad-skip-btn');
  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.preventDefault();
      finish();
    });
  }
}

window.SponsorAd = {
  AD_POOL,
  getSponsorAd,
  renderSponsorAd
};
