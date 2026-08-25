/**
 * Mahjong Tile Definitions & SVG Graphic Pattern Render Helper
 * Graphic representation for Wan (萬), Bing (餅/筒), Tiao (條/索) and Honours (字)
 */

const TILE_TYPES = [];

// 1m ~ 9m (萬)
for (let i = 1; i <= 9; i++) {
  TILE_TYPES.push({ id: `${i}m`, category: 'wan', number: i, label: `${i}萬` });
}

// 1s ~ 9s (條)
for (let i = 1; i <= 9; i++) {
  TILE_TYPES.push({ id: `${i}s`, category: 'tiao', number: i, label: `${i}條` });
}

// 1p ~ 9p (餅)
for (let i = 1; i <= 9; i++) {
  TILE_TYPES.push({ id: `${i}p`, category: 'bing', number: i, label: `${i}餅` });
}

// 字牌 (Honours)
const HONOURS = [
  { id: 'E', label: '東' },
  { id: 'S', label: '南' },
  { id: 'W', label: '西' },
  { id: 'N', label: '北' },
  { id: 'C', label: '中' },
  { id: 'F', label: '發' },
  { id: 'P', label: '白' }
];

HONOURS.forEach(h => {
  TILE_TYPES.push({ id: h.id, category: 'zi', number: 0, label: h.label });
});

const TILE_MAP = {};
TILE_TYPES.forEach((t, index) => {
  t.index = index;
  TILE_MAP[t.id] = t;
});

const NUM_CN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

/**
 * Generate SVG pattern for Bing (餅 / Circles)
 */
function getBingSvg(num) {
  const blue = "#1565c0";
  const red = "#d32f2f";
  const green = "#2e7d32";

  // Circle helper with concentric ring detail
  const circle = (cx, cy, r, color) => `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="#ffffff" stroke-width="1"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.4}" fill="#ffffff" opacity="0.8"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.2}" fill="${color}"/>
  `;

  let content = "";
  if (num === 1) {
    // Large center circle with intricate wheel pattern
    content = `
      <circle cx="20" cy="25" r="14" fill="${red}" stroke="#b71c1c" stroke-width="1.5"/>
      <circle cx="20" cy="25" r="10" fill="none" stroke="#ffffff" stroke-width="1" stroke-dasharray="2 2"/>
      <circle cx="20" cy="25" r="6" fill="${blue}"/>
      <circle cx="20" cy="25" r="2.5" fill="#ffffff"/>
    `;
  } else if (num === 2) {
    content = circle(20, 14, 6.5, green) + circle(20, 36, 6.5, blue);
  } else if (num === 3) {
    content = circle(10, 10, 5.5, blue) + circle(20, 25, 5.5, red) + circle(30, 40, 5.5, green);
  } else if (num === 4) {
    content = circle(12, 14, 5.5, blue) + circle(28, 14, 5.5, green) +
              circle(12, 36, 5.5, green) + circle(28, 36, 5.5, blue);
  } else if (num === 5) {
    content = circle(11, 13, 5, blue) + circle(29, 13, 5, green) +
              circle(20, 25, 5, red) +
              circle(11, 37, 5, green) + circle(29, 37, 5, blue);
  } else if (num === 6) {
    content = circle(13, 12, 4.5, green) + circle(27, 12, 4.5, green) +
              circle(13, 25, 4.5, red)   + circle(27, 25, 4.5, red) +
              circle(13, 38, 4.5, red)   + circle(27, 38, 4.5, red);
  } else if (num === 7) {
    content = circle(10, 10, 4, green) + circle(20, 14, 4, green) + circle(30, 18, 4, green) +
              circle(13, 31, 4.5, red) + circle(27, 31, 4.5, red) +
              circle(13, 41, 4.5, red) + circle(27, 41, 4.5, red);
  } else if (num === 8) {
    content = circle(13, 10, 4, blue) + circle(27, 10, 4, blue) +
              circle(13, 20, 4, blue) + circle(27, 20, 4, blue) +
              circle(13, 30, 4, blue) + circle(27, 30, 4, blue) +
              circle(13, 40, 4, blue) + circle(27, 40, 4, blue);
  } else if (num === 9) {
    content = circle(11, 11, 4, green) + circle(20, 11, 4, green) + circle(29, 11, 4, green) +
              circle(11, 25, 4, red)   + circle(20, 25, 4, red)   + circle(29, 25, 4, red) +
              circle(11, 39, 4, blue)  + circle(20, 39, 4, blue)  + circle(29, 39, 4, blue);
  }

  return `<svg class="mj-svg-pattern" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

/**
 * Generate SVG pattern for Tiao (條 / Bamboo Sticks)
 */
function getTiaoSvg(num) {
  const green = "#2e7d32";
  const red = "#d32f2f";
  const blue = "#1565c0";

  // Bamboo stick SVG element
  const bamboo = (x, y, w, h, color) => `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${color}"/>
    <line x1="${x}" y1="${y + h*0.5}" x2="${x + w}" y2="${y + h*0.5}" stroke="#ffffff" stroke-width="1"/>
  `;

  let content = "";
  if (num === 1) {
    // 1-Tiao traditional Peacock / Bird Graphic
    content = `
      <path d="M20 8 C14 8, 10 14, 12 22 C14 30, 8 36, 6 42 L34 42 C32 36, 26 30, 28 22 C30 14, 26 8, 20 8 Z" fill="${green}"/>
      <circle cx="20" cy="14" r="3" fill="${red}"/>
      <circle cx="20" cy="26" r="4" fill="${blue}"/>
      <path d="M12 42 L20 32 L28 42 Z" fill="${red}"/>
    `;
  } else if (num === 2) {
    content = bamboo(17, 8, 6, 15, green) + bamboo(17, 27, 6, 15, blue);
  } else if (num === 3) {
    content = bamboo(17, 7, 6, 11, blue) + bamboo(10, 26, 6, 15, green) + bamboo(24, 26, 6, 15, green);
  } else if (num === 4) {
    content = bamboo(10, 7, 6, 15, green) + bamboo(24, 7, 6, 15, blue) +
              bamboo(10, 27, 6, 15, blue)  + bamboo(24, 27, 6, 15, green);
  } else if (num === 5) {
    content = bamboo(8, 7, 5, 14, green)  + bamboo(27, 7, 5, 14, blue) +
              bamboo(17.5, 17, 5, 14, red) +
              bamboo(8, 28, 5, 14, blue)  + bamboo(27, 28, 5, 14, green);
  } else if (num === 6) {
    content = bamboo(8, 7, 5, 14, green) + bamboo(17.5, 7, 5, 14, green) + bamboo(27, 7, 5, 14, green) +
              bamboo(8, 28, 5, 14, blue)  + bamboo(17.5, 28, 5, 14, blue)  + bamboo(27, 28, 5, 14, blue);
  } else if (num === 7) {
    content = bamboo(17.5, 5, 5, 11, red) +
              bamboo(8, 19, 5, 12, green) + bamboo(17.5, 19, 5, 12, green) + bamboo(27, 19, 5, 12, green) +
              bamboo(8, 34, 5, 12, blue)  + bamboo(17.5, 34, 5, 12, blue)  + bamboo(27, 34, 5, 12, blue);
  } else if (num === 8) {
    // Slanted/M-shape bamboos for 8-Tiao
    content = bamboo(8, 7, 5, 13, green) + bamboo(17.5, 7, 5, 13, green) + bamboo(27, 7, 5, 13, green) +
              bamboo(8, 28, 5, 13, blue)  + bamboo(17.5, 28, 5, 13, blue)  + bamboo(27, 28, 5, 13, blue) +
              `<line x1="5" y1="20" x2="35" y2="20" stroke="${red}" stroke-width="2"/>`;
  } else if (num === 9) {
    content = bamboo(8, 6, 5, 11, green) + bamboo(17.5, 6, 5, 11, blue) + bamboo(27, 6, 5, 11, red) +
              bamboo(8, 20, 5, 11, green) + bamboo(17.5, 20, 5, 11, blue) + bamboo(27, 20, 5, 11, red) +
              bamboo(8, 34, 5, 11, green) + bamboo(17.5, 34, 5, 11, blue) + bamboo(27, 34, 5, 11, red);
  }

  return `<svg class="mj-svg-pattern" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

/**
 * Render Mahjong Tile HTML element with SVG pattern graphics
 * @param {string} tileId 
 * @param {object} options 
 * @returns {string} HTML string
 */
function createTileHtml(tileId, options = {}) {
  const tile = TILE_MAP[tileId];
  if (!tile) return '';

  let tileClass = `mj-tile mj-${tile.category}`;
  let innerGraphicHtml = '';

  if (tile.category === 'wan') {
    innerGraphicHtml = `
      <div class="mj-tile-wan-face">
        <span class="mj-wan-num">${NUM_CN[tile.number]}</span>
        <span class="mj-wan-char">萬</span>
      </div>
    `;
  } else if (tile.category === 'bing') {
    innerGraphicHtml = getBingSvg(tile.number);
  } else if (tile.category === 'tiao') {
    innerGraphicHtml = getTiaoSvg(tile.number);
  } else {
    // 字牌 (Honours)
    let charClass = '';
    if (tileId === 'C') charClass = 'color-red';
    else if (tileId === 'F') charClass = 'color-green';
    else if (tileId === 'P') charClass = 'color-white';

    innerGraphicHtml = `
      <div class="mj-tile-zi-face ${charClass}">
        <span class="mj-zi-char">${tile.label}</span>
      </div>
    `;
  }

  const extraAttrs = [];
  if (options.selectable) tileClass += ' is-selectable';
  if (options.selected) tileClass += ' is-selected';
  if (options.disabled) {
    tileClass += ' is-disabled';
    extraAttrs.push('disabled');
  }

  return `
    <div class="${tileClass}" data-tile="${tileId}" ${extraAttrs.join(' ')}>
      <div class="mj-tile-body">
        ${innerGraphicHtml}
      </div>
    </div>
  `;
}

/**
 * Sort hand array in standard Taiwan mahjong order: Wan -> Tiao -> Bing -> Honours
 * @param {Array<string>} hand 
 * @returns {Array<string>}
 */
function sortHand(hand) {
  return [...hand].sort((a, b) => {
    return TILE_MAP[a].index - TILE_MAP[b].index;
  });
}

window.MahjongTiles = {
  TILE_TYPES,
  TILE_MAP,
  createTileHtml,
  sortHand
};
