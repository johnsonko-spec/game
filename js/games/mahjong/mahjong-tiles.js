/**
 * Mahjong Tile Definitions & Render Helper
 * 34 Unique Tile Types (no flowers)
 */

const TILE_TYPES = [];

// 1m ~ 9m (萬)
for (let i = 1; i <= 9; i++) {
  TILE_TYPES.push({ id: `${i}m`, category: 'wan', number: i, label: `${i}萬`, text: `${i}萬` });
}

// 1s ~ 9s (條)
for (let i = 1; i <= 9; i++) {
  TILE_TYPES.push({ id: `${i}s`, category: 'tiao', number: i, label: `${i}條`, text: `${i}條` });
}

// 1p ~ 9p (餅)
for (let i = 1; i <= 9; i++) {
  TILE_TYPES.push({ id: `${i}p`, category: 'bing', number: i, label: `${i}餅`, text: `${i}餅` });
}

// 字牌 (Honours)
const HONOURS = [
  { id: 'E', label: '東', text: '東' },
  { id: 'S', label: '南', text: '南' },
  { id: 'W', label: '西', text: '西' },
  { id: 'N', label: '北', text: '北' },
  { id: 'C', label: '中', text: '中' },
  { id: 'F', label: '發', text: '發' },
  { id: 'P', label: '白', text: '白' }
];

HONOURS.forEach(h => {
  TILE_TYPES.push({ id: h.id, category: 'zi', number: 0, label: h.label, text: h.text });
});

const TILE_MAP = {};
TILE_TYPES.forEach((t, index) => {
  t.index = index;
  TILE_MAP[t.id] = t;
});

/**
 * Chinese character representation for Wan numbers
 */
const NUM_CN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

/**
 * Render Mahjong Tile HTML element
 * @param {string} tileId 
 * @param {object} options { selectable: boolean, selected: boolean, disabled: boolean }
 * @returns {string} HTML string
 */
function createTileHtml(tileId, options = {}) {
  const tile = TILE_MAP[tileId];
  if (!tile) return '';

  let mainDisplay = '';
  let subDisplay = '';
  let tileClass = `mj-tile mj-${tile.category}`;

  if (tile.category === 'wan') {
    mainDisplay = NUM_CN[tile.number];
    subDisplay = '萬';
  } else if (tile.category === 'tiao') {
    mainDisplay = tile.number;
    subDisplay = '條';
  } else if (tile.category === 'bing') {
    mainDisplay = tile.number;
    subDisplay = '餅';
  } else {
    mainDisplay = tile.text;
    if (tileId === 'C') tileClass += ' color-red';
    else if (tileId === 'F') tileClass += ' color-green';
    else if (tileId === 'P') tileClass += ' color-white';
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
      <div class="mj-tile-face">
        <span class="mj-main">${mainDisplay}</span>
        ${subDisplay ? `<span class="mj-sub">${subDisplay}</span>` : ''}
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
