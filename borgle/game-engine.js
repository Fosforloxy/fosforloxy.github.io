// Borgle game engine — dictionary, trie, board gen, word finding.

const BOARD_SIZE = 5;
const MIN_WORD_LEN = 4;

// English letter frequencies (%), with vowel bonus 1.3x — matches Python version
const LETTER_FREQ = {
  E: 12.7, T: 9.1, A: 8.2, O: 7.5, I: 7.0,
  N: 6.7, S: 6.3, H: 6.1, R: 6.0, D: 4.3,
  L: 4.0, C: 2.8, U: 2.8, M: 2.4, W: 2.4,
  F: 2.2, G: 2.0, Y: 2.0, P: 1.9, B: 1.5,
  V: 1.0, K: 0.8, J: 0.15, X: 0.15, Q: 0.10,
  Z: 0.07,
};
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const ADJ_FREQ = {};
for (const l in LETTER_FREQ) {
  ADJ_FREQ[l] = LETTER_FREQ[l] * (VOWELS.has(l) ? 1.3 : 1.0);
}
const LETTERS = Object.keys(ADJ_FREQ);
const WEIGHTS_TOTAL = LETTERS.reduce((s, l) => s + ADJ_FREQ[l], 0);

function sampleLetter(rng) {
  const r = rng() * WEIGHTS_TOTAL;
  let acc = 0;
  for (const l of LETTERS) {
    acc += ADJ_FREQ[l];
    if (r < acc) return l;
  }
  return LETTERS[LETTERS.length - 1];
}

function makeRNG(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// --- Trie ---
// Each terminal node gets a unique numeric `wid` so we can count unique
// reachable words with a Set<number> in the SA hot loop (no string alloc).
function buildTrie(words) {
  const root = {};
  let nextId = 1;
  for (const w of words) {
    let node = root;
    for (const ch of w) {
      if (!node[ch]) node[ch] = {};
      node = node[ch];
    }
    if (!node.$) { node.$ = true; node.wid = nextId++; }
  }
  return root;
}

// --- Board generation ---
function generateRandomBoard(rng) {
  const board = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    const row = [];
    for (let c = 0; c < BOARD_SIZE; c++) row.push(sampleLetter(rng));
    board.push(row);
  }
  return board;
}

// --- Fast word count (for SA) ---
// Hot path — optimized for SA inner loop:
//   - flat 25-element board array (no row/col indexing)
//   - 25-bit integer visited mask (no Set/array allocation per DFS call)
//   - reuse a single Set for collecting found words
const NEIGHBORS_5x5 = (() => {
  const arr = new Array(25);
  for (let i = 0; i < 25; i++) {
    const r = (i / 5) | 0, c = i % 5;
    const list = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5) list.push(nr * 5 + nc);
      }
    }
    arr[i] = list;
  }
  return arr;
})();

function flattenBoard(board) {
  const f = new Array(25);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) f[r * 5 + c] = board[r][c];
  return f;
}

// Pre-allocated shared state
const _foundBuf = new Set();
const _widBuf = new Set();

// Fast word-count for SA: returns just a count, no strings built.
// Uses trie leaf `wid` to dedupe.
function countBoardWordsFast(flat, trie) {
  _widBuf.clear();

  function dfs(i, node, depth, visited) {
    const tile = flat[i];
    let nextNode, newDepth;
    if (tile === 'Q') {
      const nq = node['Q']; if (!nq) return;
      const nqu = nq['U']; if (!nqu) return;
      nextNode = nqu; newDepth = depth + 2;
    } else {
      nextNode = node[tile]; if (!nextNode) return;
      newDepth = depth + 1;
    }
    if (nextNode.$ && newDepth >= MIN_WORD_LEN) _widBuf.add(nextNode.wid);
    const nv = visited | (1 << i);
    const neighbors = NEIGHBORS_5x5[i];
    for (let k = 0; k < neighbors.length; k++) {
      const n = neighbors[k];
      if ((nv & (1 << n)) === 0) dfs(n, nextNode, newDepth, nv);
    }
  }

  for (let i = 0; i < 25; i++) dfs(i, trie, 0, 0);
  return _widBuf.size;
}

function countBoardWords(boardOrFlat, trie) {
  _foundBuf.clear();
  const flat = Array.isArray(boardOrFlat[0]) ? flattenBoard(boardOrFlat) : boardOrFlat;

  function dfs(i, node, prefix, visited) {
    const tile = flat[i];
    let nextNode, nextPrefix;
    if (tile === 'Q') {
      const nq = node['Q']; if (!nq) return;
      const nqu = nq['U']; if (!nqu) return;
      nextNode = nqu; nextPrefix = prefix + 'QU';
    } else {
      nextNode = node[tile]; if (!nextNode) return;
      nextPrefix = prefix + tile;
    }
    if (nextNode.$ && nextPrefix.length >= MIN_WORD_LEN) _foundBuf.add(nextPrefix);
    const nv = visited | (1 << i);
    const neighbors = NEIGHBORS_5x5[i];
    for (let k = 0; k < neighbors.length; k++) {
      const n = neighbors[k];
      if ((nv & (1 << n)) === 0) dfs(n, nextNode, nextPrefix, nv);
    }
  }

  for (let i = 0; i < 25; i++) dfs(i, trie, '', 0);
  return _foundBuf;
}

// --- Find all words + their paths ---
function findAllWordsAndPaths(board, trie) {
  const rows = board.length, cols = board[0].length;
  const wordPaths = new Map();
  const visited = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const path = [];

  function dfs(r, c, node, prefix) {
    const tile = board[r][c];
    let nextNode, nextPrefix;
    if (tile === 'Q') {
      const nq = node['Q']; if (!nq) return;
      const nqu = nq['U']; if (!nqu) return;
      nextNode = nqu; nextPrefix = prefix + 'QU';
    } else {
      nextNode = node[tile]; if (!nextNode) return;
      nextPrefix = prefix + tile;
    }
    path.push([r, c]);
    visited[r][c] = true;
    if (nextNode.$ && nextPrefix.length >= MIN_WORD_LEN) {
      if (!wordPaths.has(nextPrefix)) {
        wordPaths.set(nextPrefix, path.slice());
      }
    }
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
          dfs(nr, nc, nextNode, nextPrefix);
        }
      }
    }
    visited[r][c] = false;
    path.pop();
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) dfs(r, c, trie, '');
  }
  return wordPaths;
}

// --- Simulated annealing to find rich boards ---
// Stateful optimizer — call step(N) repeatedly in a yielding loop so
// the UI can update between slices. The SA cooling schedule is preserved
// across steps (unlike splitting into independent optimizeBoard calls).
//
// Ported from BoggleBest.py _generate_good_board:
//   T_START=10.0, T_MIN=0.20, COOLING=0.998 multiplicative,
//   15% swap / 85% replace, restart with a fresh random board
//   when T drops below T_MIN. Keeps best across all restarts.
class BoardOptimizer {
  constructor(trie, rng) {
    this.trie = trie;
    this.rng = rng;
    this.T_START = 10.0;
    this.T_MIN = 0.20;
    this.COOLING = 0.998;
    this.N = BOARD_SIZE * BOARD_SIZE;

    this.flat = this._flatten(generateRandomBoard(rng));
    this.curCount = countBoardWordsFast(this.flat, trie);
    this.T = this.T_START;
    this.bestFlat = this.flat.slice();
    this.bestCount = this.curCount;
    this.steps = 0;
    this.restarts = 0;
  }

  _flatten(board) {
    const f = new Array(this.N);
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++) f[r * BOARD_SIZE + c] = board[r][c];
    return f;
  }
  _unflatten(flat) {
    const b = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      const row = [];
      for (let c = 0; c < BOARD_SIZE; c++) row.push(flat[r * BOARD_SIZE + c]);
      b.push(row);
    }
    return b;
  }

  // Run up to `iters` SA iterations. Returns after that budget.
  step(iters) {
    const rng = this.rng, trie = this.trie, N = this.N;
    for (let it = 0; it < iters; it++) {
      if (this.T <= this.T_MIN) {
        // restart: fresh random board, reset T
        this.flat = this._flatten(generateRandomBoard(rng));
        this.curCount = countBoardWordsFast(this.flat, trie);
        this.T = this.T_START;
        this.restarts++;
      }
      // Mutate in place, undo if rejected
      let oldI, oldJ = -1, oldValI, oldValJ;
      if (rng() < 0.15) {
        oldI = Math.floor(rng() * N);
        oldJ = Math.floor(rng() * N);
        if (oldJ === oldI) oldJ = (oldJ + 1) % N;
        oldValI = this.flat[oldI]; oldValJ = this.flat[oldJ];
        this.flat[oldI] = oldValJ; this.flat[oldJ] = oldValI;
      } else {
        oldI = Math.floor(rng() * N);
        oldValI = this.flat[oldI];
        this.flat[oldI] = sampleLetter(rng);
      }

      const newCount = countBoardWordsFast(this.flat, trie);
      const delta = newCount - this.curCount;

      if (delta >= 0 || rng() < Math.exp(delta / this.T)) {
        this.curCount = newCount;
        if (this.curCount > this.bestCount) {
          this.bestCount = this.curCount;
          this.bestFlat = this.flat.slice();
        }
      } else {
        if (oldJ >= 0) {
          this.flat[oldI] = oldValI; this.flat[oldJ] = oldValJ;
        } else {
          this.flat[oldI] = oldValI;
        }
      }
      this.T *= this.COOLING;
      this.steps++;
    }
  }

  get bestBoard() { return this._unflatten(this.bestFlat); }
}

// Legacy sync one-shot — thin wrapper around BoardOptimizer so tests still work.
function optimizeBoard(trie, rng, timeBudgetMs = 15000, targetWords = 800) {
  const opt = new BoardOptimizer(trie, rng);
  const start = performance.now();
  while (performance.now() - start < timeBudgetMs && opt.bestCount < targetWords) {
    opt.step(500);
  }
  return { board: opt.bestBoard, wordCount: opt.bestCount, steps: opt.steps, restarts: opt.restarts };
}

function wordScore(word) {
  if (word.length < MIN_WORD_LEN) return 0;
  return word.length - (MIN_WORD_LEN - 1);
}

// Resolve board cells highlighted by a typed prefix (matches Python behavior)
function getPrefixCells(board, trie, prefix) {
  if (!prefix) return new Set();
  prefix = prefix.toUpperCase();
  const active = new Set();
  const rows = board.length, cols = board[0].length;

  function dfs(r, c, node, remaining, path, visited) {
    const tile = board[r][c];
    let nextNode, nextRem;
    if (tile === 'Q') {
      if (!remaining.startsWith('QU')) return;
      const nq = node['Q']; if (!nq) return;
      const nqu = nq['U']; if (!nqu) return;
      nextNode = nqu; nextRem = remaining.slice(2);
    } else {
      if (!remaining || remaining[0] !== tile) return;
      nextNode = node[tile]; if (!nextNode) return;
      nextRem = remaining.slice(1);
    }
    const newPath = path.concat([[r, c]]);
    if (nextRem === '') {
      for (const [rr, cc] of newPath) active.add(rr + ',' + cc);
      return;
    }
    visited.add(r * 100 + c);
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited.has(nr * 100 + nc)) {
          dfs(nr, nc, nextNode, nextRem, newPath, visited);
        }
      }
    }
    visited.delete(r * 100 + c);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dfs(r, c, trie, prefix, [], new Set());
    }
  }
  return active;
}

window.BorgleEngine = {
  BOARD_SIZE,
  MIN_WORD_LEN,
  buildTrie,
  generateRandomBoard,
  optimizeBoard,
  BoardOptimizer,
  findAllWordsAndPaths,
  countBoardWords,
  countBoardWordsFast,
  wordScore,
  getPrefixCells,
  makeRNG,
  computeTileSequences,
};

// --- High-traffic tile sequences (bigrams/trigrams) for path-map ---
// Port of BoggleBest.show_path_exclusivity selection logic.
function computeTileSequences(wordPathsMap) {
  const seqCounts = new Map();
  for (const path of wordPathsMap.values()) {
    for (const len of [2, 3]) {
      for (let s = 0; s + len <= path.length; s++) {
        const sub = path.slice(s, s + len);
        const key = sub.map(p => p[0] + ',' + p[1]).join('|');
        seqCounts.set(key, (seqCounts.get(key) || 0) + 1);
      }
    }
  }
  const entries = [];
  for (const [k, c] of seqCounts) {
    const coords = k.split('|').map(s => s.split(',').map(Number));
    entries.push({ seq: coords, count: c, len: coords.length });
  }
  const trigrams = entries.filter(e => e.len === 3).sort((a,b) => b.count - a.count);
  const bigrams  = entries.filter(e => e.len === 2).sort((a,b) => b.count - a.count);
  const TOP_N = 12, MAX_TRI = 5, THRESH = 0.25;
  const topBi = bigrams[0]?.count || 1;
  const selTri = [];
  for (const t of trigrams) {
    if (selTri.length === 0 || t.count / topBi >= THRESH) selTri.push(t);
    if (selTri.length >= MAX_TRI) break;
  }
  const triKeys = new Set(selTri.map(t => t.seq.map(p=>p[0]+','+p[1]).join('|')));
  const isSub = (short, long) => {
    const sk = short.seq.map(p=>p[0]+','+p[1]);
    const lk = long.map(p=>p[0]+','+p[1]);
    for (let i = 0; i + sk.length <= lk.length; i++) {
      let ok = true;
      for (let j = 0; j < sk.length; j++) if (sk[j] !== lk[i+j]) { ok = false; break; }
      if (ok) return true;
    }
    return false;
  };
  const selBi = [];
  for (const b of bigrams) {
    if (selTri.some(t => isSub(b, t.seq))) continue;
    selBi.push(b);
    if (selBi.length >= TOP_N - selTri.length) break;
  }
  return [...selTri, ...selBi];
}
