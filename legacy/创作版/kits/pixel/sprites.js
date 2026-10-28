// 像素风零件库 · 调色板与精灵图（全部原创）
export const PAL = [
  '#0b0d1a', '#1f2440', '#33407a', '#4b6fc4', '#6fa8f0', '#b8e1ff', '#ffffff', '#2b1d2e', '#6b2f4f', '#c2415a', '#f2735c', '#ffb26b',
  '#ffe08a', '#1d3b2f', '#2f6b3a', '#57a64b', '#a5d86a', '#4a2e22', '#8a5a3a', '#c88a52', '#f1c99b', '#5c5f73', '#9aa0b8', '#8f5fd1',
  '#d9a3ff', '#3a2a5c', '#ff6fa8', '#7ee0c3',
];
const KEY = { k: 0, n: 1, c: 3, C: 2, w: 6, h: 17, s: 20, S: 19, e: 0, b: 11, B: 10, r: 9, R: 8, p: 2, P: 1, o: 17, y: 12, g: 15, G: 14, l: 16, t: 18, T: 17, x: 22, X: 21, v: 23, V: 25, m: 24, z: 26, q: 27, u: 4, U: 5, a: 7 };

// 字符画 → 画布
export function sprite(rows, key = KEY) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '.' || ch === ' ') return; const k = key[ch]; if (k == null) return; x.fillStyle = PAL[k]; x.fillRect(i, j, 1, 1); }));
  return c;
}
export function flipX(c) { const o = document.createElement('canvas'); o.width = c.width; o.height = c.height; const x = o.getContext('2d'); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return o; }

// 主角「小蓝帽」：蓝帽子、橙衣服、红书包，面朝右
const HEAD = [
  '....kkkkkk....',
  '...kccccwcck..',
  '..kccccccccck.',
  '..kCCCCCCCCCCk',
  '..khhsssssskk.',
  '..khsssssesk..',
  '..khhssssssk..',
  '...kksssskk...',
];
const BODY = [
  '..krrbbbbbk...',
  '.krRrbbbbbbk..',
  '.krRrbbybbsk..',
  '.kkRrBbbbbsk..',
];
const LEGS = {
  stand: ['..kpppppppk...', '..kpppkpppk...', '..kooko.kook..', '..kkkk..kkkk..'],
  run1: ['..kppppppk....', '.kpppkkpppk...', 'kook...kpook..', 'kkk.....kkkk..'],
  run2: ['..kppppppk....', '...kppppk.....', '...kpppok.....', '...kkkkkk.....'],
  run3: ['..kppppppk....', '..kpppkpppk...', '.kook...kook..', '.kkk.....kkk..'],
  jump: ['..kpppppppk...', '.kppk..kppk...', '.kook..kook...', '..kk....kk....'],
};
export const HERO = Object.fromEntries(Object.entries(LEGS).map(([k, l]) => [k, sprite([...HEAD, ...BODY, ...l])]));
HERO.cheer = sprite([...HEAD.slice(0, 7), '..sk.sssskk.s.', '.ks.krrbbbbks.', '..skrRrbbbbk..', '...krRrbybbk..', '...kkRrBbbbk..', ...LEGS.stand]);

// 史莱姆（小怪）
export const SLIME = [sprite([
  '....kkkk....', '..kkvvvvkk..', '.kvvmmvvvvk.', '.kvmvvvvvvk.', 'kvvvvkvvkvvk', 'kvvvvkvvkvvk', 'kvvvvvvvvvvk', '.kkkkkkkkkk.']),
  sprite(['............', '....kkkk....', '..kkvvvvkk..', '.kvmmvvvvvk.', 'kvvvvkvvkvvk', 'kvvvvkvvkvvk', 'kvvvvvvvvvvk', 'kkkkkkkkkkkk'])];

// Boss：大眼机器人（拿来演「问题」）
export const BOSS = sprite([
  '........kk..........',
  '........kzk.........',
  '.........k..........',
  '...kkkkkkkkkkkkkk...',
  '..kxxxxxxxxxxxxxxk..',
  '..kxXXXXXXXXXXXXxk..',
  '..kxXkkkkkkkkkkXxk..',
  '..kxXkwwwkkwwwkXxk..',
  '..kxXkwzzkkwzzkXxk..',
  '..kxXkwzzkkwzzkXxk..',
  '..kxXkkkkkkkkkkXxk..',
  '..kxXXXXXXXXXXXXxk..',
  '..kxXXkkkkkkkkXXxk..',
  '..kxXXkzkzkzkzXXxk..',
  '..kxXXkkkkkkkkXXxk..',
  '..kxxxxxxxxxxxxxxk..',
  '...kkkkkkkkkkkkkk...',
  '.kxxk.kXXXXXXk.kxxk.',
  'kxXXk.kXXXXXXk.kXXxk',
  'kxXXk.kkkkkkkk.kXXxk',
  '.kkk...kXk.kXk..kkk.',
  '......kXXk.kXXk.....',
  '......kkkk.kkkk.....',
]);

// 顶砖块、金币、宝箱、旗子、星星、心
export const QBLOCK = [sprite([
  'kkkkkkkkkkkk', 'kyyyyyyyyyBk', 'kyBkkkkkyyBk', 'kyykyyyykyBk', 'kyyyyyykkyBk', 'kyyyyykkyyBk', 'kyyyyykyyyBk', 'kyyyyyyyyyBk', 'kyyyyykyyyBk', 'kyyyyyyyyyBk', 'kBBBBBBBBBBk', 'kkkkkkkkkkkk']),
  sprite(['kkkkkkkkkkkk', 'kTTTTTTTTTTk', 'kTttttttttTk', 'kTtTTTTTTtTk', 'kTtTttttTtTk', 'kTtTttttTtTk', 'kTtTttttTtTk', 'kTtTttttTtTk', 'kTtTTTTTTtTk', 'kTttttttttTk', 'kTTTTTTTTTTk', 'kkkkkkkkkkkk'])];
export const COIN = [sprite(['..kkkk..', '.kyyyyk.', 'kyywyyBk', 'kywyyyBk', 'kywyyyBk', 'kyyyyyBk', '.kBBBBk.', '..kkkk..']),
  sprite(['..kkk...', '.kyyBk..', '.kwyBk..', '.kwyBk..', '.kwyBk..', '.kyyBk..', '.kBBBk..', '..kkk...']),
  sprite(['...kk...', '...kyk..', '...kwk..', '...kwk..', '...kwk..', '...kyk..', '...kBk..', '...kk...'])];
export const CHEST = {
  closed: sprite(['.kkkkkkkkkkkkkk.', 'ktttttttttttttTk', 'ktTTTTTTTTTTTTTk', 'kkkkkkkkkkkkkkkk', 'kyyyyyykkyyyyyyk', 'kttttttkyktttttk', 'ktTTTTTkkkTTTTTk', 'kttttttttttttttk', 'ktTTTTTTTTTTTTTk', 'kttttttttttttttk', 'kTTTTTTTTTTTTTTk', 'kkkkkkkkkkkkkkkk']),
  open: sprite(['kkkkkkkkkkkkkkkk', 'kTTTTTTTTTTTTTTk', 'kyyyyyyyyyyyyyyk', 'kkkkkkkkkkkkkkkk', 'kyyyyyyyyyyyyyyk', 'ktttttttttttttTk', 'ktTTTTTTTTTTTTTk', 'kttttttttttttttk', 'ktTTTTTTTTTTTTTk', 'kttttttttttttttk', 'kTTTTTTTTTTTTTTk', 'kkkkkkkkkkkkkkkk']),
};
export const FLAG = sprite(['kk......', 'kxkkkkk.', 'kxzzzzzk', 'kxzwzzzk', 'kxzzzzk.', 'kxkkkk..', 'kx......', 'kx......']);
export const HEART = [sprite(['.kk.kk.', 'krrkrrk', 'krwrrrk', 'krrrrrk', '.krrrk.', '..krk..', '...k...']), sprite(['.kk.kk.', 'kXXkXXk', 'kXXXXXk', 'kXXXXXk', '.kXXXk.', '..kXk..', '...k...'])];
export const STAR = sprite(['...k...', '..kyk..', 'kkkykkk', 'kyyyyyk', '.kyyyk.', 'kyykyyk', 'kk...kk']);
export const SPARK = [sprite(['..w..', '..w..', 'wwwww', '..w..', '..w..']), sprite(['w...w', '.w.w.', '..w..', '.w.w.', 'w...w']), sprite(['.....', '..w..', '.www.', '..w..', '.....'])];

// 导师 NPC：紫袍老法师（对话镜头用）
export const SAGE = sprite([
  '.....kk.......', '....kvvk......', '...kvvvvk.....', '..kvvvyvvk....', '.kvvvvvvvvk...', 'kkkkkkkkkkkk..',
  '..kswsswsk....', '..ksssssssk...', '..kwwwwwwwk...', '..kwwwwwwwk...', '.kvvwwwwwvvk..', 'kvvvvwwwvvvvk.',
  'kvVvvvwvvvVvk.', 'kvVvvvvvvvVvk.', '.kvvvvvvvvvk..', '..kkkkkkkkk...',
]);
