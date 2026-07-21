// Borgle main app.
(function () {
  const { applyBorgleTheme, BORGLE_THEMES, BORGLE_FONTS } = window.BorgleThemes;
  const { BOARD_SIZE, MIN_WORD_LEN, buildTrie, optimizeBoard, findAllWordsAndPaths,
          wordScore, getPrefixCells, makeRNG, computeTileSequences } = window.BorgleEngine;
  const { playDing, playBuzz, playStart, playGameOver, playTick } = window.BorgleSounds;

  // --- State ---
  const state = {
    theme: 'hearth',
    font: 'rounded',
    dict: null,
    trie: null,
    board: null,
    allWords: null,         // Map<word, path>
    foundWords: new Set(),
    totalScore: 0,
    timeLeft: 180,
    timerId: null,
    timerPaused: true,
    started: false,
    gameOver: false,
    saved: false,
    muted: false,
  };

  // --- Tweaks: sync with TWEAK_DEFAULTS ---
  function applyTweaks(obj) {
    if (obj.theme) state.theme = obj.theme;
    if (obj.font) state.font = obj.font;
    applyBorgleTheme(state.theme, state.font);
    renderTweaks();
  }

  // --- DOM refs ---
  const $ = (id) => document.getElementById(id);
  const boardEl = $('board');
  const scoreEl = $('score');
  const foundCountEl = $('found-count');
  const totalCountEl = $('total-count');
  const timerEl = $('timer');
  const pauseBtn = $('btn-pause');
  const entryEl = $('entry');
  const entryBox = $('entry-box');
  const entryBadge = $('entry-badge');
  const statusEl = $('status');
  const wordsListEl = $('words-list');
  const wordsEmptyEl = $('words-empty');
  const wordsStreakEl = $('words-streak');
  const ringFill = $('ring-fill');
  const ringPct = $('ring-pct');
  const progressBig = $('progress-big');
  const progressSmall = $('progress-small');
  const splash = $('splash');
  const splashStatus = $('splash-status');

  // --- Build tile DOM ---
  const tiles = [];
  let pathOverlay = null;
  function buildBoardDOM() {
    boardEl.innerHTML = '';
    tiles.length = 0;
    // SVG overlay for drawing word paths (pixel-space)
    pathOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    pathOverlay.setAttribute('class', 'path-overlay');
    boardEl.appendChild(pathOverlay);
    for (let r = 0; r < BOARD_SIZE; r++) {
      const row = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        const t = document.createElement('div');
        t.className = 'tile';
        t.dataset.r = r; t.dataset.c = c;
        t.dataset.num = r + ',' + c;
        boardEl.appendChild(t);
        row.push(t);
      }
      tiles.push(row);
    }
  }

  function renderBoard() {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const letter = state.board[r][c];
        const el = tiles[r][c];
        el.classList.remove('highlight-prefix', 'highlight-valid', 'shake', 'path-pop');
        if (letter === 'Q') {
          el.innerHTML = 'Q<span class="qu-u">u</span>';
        } else {
          el.textContent = letter;
        }
      }
    }
  }

  // --- Timer ---
  function startTimer() {
    if (state.gameOver) return;
    stopTimer();
    state.timerPaused = false;
    state.started = true;
    pauseBtn.textContent = '⏸ Pause';
    pauseBtn.classList.remove('active');
    timerEl.classList.remove('paused');
    entryEl.disabled = false;
    entryEl.focus();
    setStatus('info', 'Tiles must be adjacent (including diagonals), and each tile used at most once per word.');
    if (!state.muted) playStart();
    tick();
  }

  function tick() {
    state.timerId = setTimeout(() => {
      state.timeLeft -= 1;
      updateTimer();
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        updateTimer();
        endGame();
        return;
      }
      if (state.timeLeft <= 10 && !state.muted) playTick();
      tick();
    }, 1000);
  }

  function stopTimer() {
    if (state.timerId) { clearTimeout(state.timerId); state.timerId = null; }
  }

  function updateTimer() {
    const m = Math.floor(state.timeLeft / 60);
    const s = state.timeLeft % 60;
    timerEl.textContent = m + ':' + String(s).padStart(2, '0');
    timerEl.classList.remove('warn', 'danger', 'paused');
    if (state.timerPaused) timerEl.classList.add('paused');
    else if (state.timeLeft <= 30) timerEl.classList.add('danger');
    else if (state.timeLeft <= 60) timerEl.classList.add('warn');
  }

  function togglePause() {
    if (state.gameOver) return;
    if (!state.started || state.timerPaused) {
      startTimer();
    } else {
      stopTimer();
      state.timerPaused = true;
      pauseBtn.textContent = '▶ Resume';
      timerEl.classList.add('paused');
      setStatus('info', 'Paused.');
    }
  }

  // --- Status ---
  function setStatus(kind, html) {
    statusEl.className = 'status ' + kind;
    statusEl.innerHTML = html;
  }

  // --- Entry handling ---
  function onEntryChange() {
    clearHighlights();
    const prefix = entryEl.value.trim().toUpperCase();
    entryEl.value = prefix;
    if (!prefix) {
      entryBox.classList.remove('valid');
      entryBadge.classList.remove('valid');
      entryBadge.textContent = '4+ letters';
      return;
    }
    const cells = getPrefixCells(state.board, state.trie, prefix);
    const isValid = state.allWords && state.allWords.has(prefix);
    for (const key of cells) {
      const [r, c] = key.split(',').map(Number);
      const cls = isValid ? 'highlight-valid' : 'highlight-prefix';
      tiles[r][c].classList.add(cls);
    }
    if (isValid) {
      entryBox.classList.add('valid');
      entryBadge.classList.add('valid');
      entryBadge.textContent = state.foundWords.has(prefix) ? 'already found' : '+' + wordScore(prefix) + ' pts';
    } else {
      entryBox.classList.remove('valid');
      entryBadge.classList.remove('valid');
      if (prefix.length < MIN_WORD_LEN) entryBadge.textContent = (MIN_WORD_LEN - prefix.length) + ' more';
      else entryBadge.textContent = cells.size ? 'keep going' : 'not a path';
    }
  }

  function clearHighlights() {
    for (const row of tiles) for (const t of row) t.classList.remove('highlight-prefix', 'highlight-valid');
  }

  // --- Path map: draw a traced word path on the board ---
  function clearPath() {
    if (!pathOverlay) return;
    pathOverlay.innerHTML = '';
    for (const row of tiles) for (const t of row) t.classList.remove('path-step');
  }

  function drawPath(path, opts = {}) {
    if (!pathOverlay || !path || !path.length) return;
    clearPath();
    // Resize overlay to match board's current pixel size
    const bw = boardEl.clientWidth;
    const bh = boardEl.clientHeight;
    pathOverlay.setAttribute('viewBox', `0 0 ${bw} ${bh}`);
    pathOverlay.setAttribute('width', bw);
    pathOverlay.setAttribute('height', bh);

    // Compute tile centers (relative to board element)
    const boardRect = boardEl.getBoundingClientRect();
    const pts = path.map(([r, c]) => {
      const el = tiles[r][c];
      const rect = el.getBoundingClientRect();
      return [
        rect.left - boardRect.left + rect.width / 2,
        rect.top - boardRect.top + rect.height / 2,
      ];
    });

    const ns = 'http://www.w3.org/2000/svg';

    // Subtle tile tint
    for (const [r, c] of path) tiles[r][c].classList.add('path-step');

    // Connecting line (polyline)
    if (pts.length > 1) {
      const poly = document.createElementNS(ns, 'polyline');
      poly.setAttribute('class', 'path-line');
      poly.setAttribute('points', pts.map(p => p.join(',')).join(' '));
      // Path length for dasharray animation
      pathOverlay.appendChild(poly);
      try {
        const len = poly.getTotalLength();
        poly.style.strokeDasharray = len;
        poly.style.strokeDashoffset = len;
        // Animate
        requestAnimationFrame(() => {
          poly.style.transition = 'stroke-dashoffset 0.55s cubic-bezier(.4,.6,.2,1)';
          poly.style.strokeDashoffset = 0;
        });
      } catch (e) { /* fallback: CSS keyframe */ }
    }

    // Numbered dots
    pts.forEach(([x, y], i) => {
      const r = 12;
      const circle = document.createElementNS(ns, 'circle');
      circle.setAttribute('class', i === 0 ? 'path-dot path-start' : 'path-dot');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', r);
      circle.style.transformOrigin = `${x}px ${y}px`;
      circle.style.animationDelay = (i * 55) + 'ms';
      pathOverlay.appendChild(circle);

      const num = document.createElementNS(ns, 'text');
      num.setAttribute('class', 'path-num');
      num.setAttribute('x', x);
      num.setAttribute('y', y);
      num.style.animationDelay = (i * 55) + 'ms';
      num.textContent = (i + 1);
      pathOverlay.appendChild(num);
    });
  }

  function submitWord() {
    if (!state.started || state.gameOver) {
      if (!state.started) { startTimer(); }
    }
    const w = entryEl.value.trim().toUpperCase();
    if (!w) return;
    if (w.length < MIN_WORD_LEN) { shake('Too short — 4+ letters'); return; }
    if (!state.allWords.has(w)) { shake('Not on this board'); return; }
    if (state.foundWords.has(w)) { shake('Already found'); return; }

    // Accept!
    state.foundWords.add(w);
    // Track globally across all boards
    try {
      const cw = JSON.parse(localStorage.getItem('borgle.commonWords') || '{}');
      cw[w] = (cw[w] || 0) + 1;
      localStorage.setItem('borgle.commonWords', JSON.stringify(cw));
    } catch(e){}
    const pts = wordScore(w);
    state.totalScore += pts;
    updateStats();
    addFoundWord(w, pts);
    playPathAnimation(state.allWords.get(w));
    if (!state.muted) playDing();
    entryEl.value = '';
    clearHighlights();
    entryBox.classList.remove('valid');
    entryBadge.classList.remove('valid');
    entryBadge.textContent = '4+ letters';
    setStatus('success', '<span class="icon">✓</span> ' + w + ' <span style="opacity:0.6;margin-left:6px">+' + pts + ' pts</span>');
    spawnScoreDing('+' + pts);
  }

  function shake(msg) {
    for (const row of tiles) for (const t of row) {
      if (t.classList.contains('highlight-prefix') || t.classList.contains('highlight-valid')) t.classList.add('shake');
    }
    setTimeout(() => {
      for (const row of tiles) for (const t of row) t.classList.remove('shake');
    }, 400);
    setStatus('error', '<span class="icon">×</span> ' + msg);
    entryBox.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 250 });
    if (!state.muted) playBuzz();
  }

  function playPathAnimation(path) {
    if (!path) return;
    drawPath(path);
    // Pop each tile in sequence (adds warmth to the trace)
    path.forEach(([r, c], i) => {
      setTimeout(() => {
        tiles[r][c].classList.add('path-pop');
        setTimeout(() => tiles[r][c].classList.remove('path-pop'), 500);
      }, i * 55);
    });
    // Clear the path after ~2s
    clearTimeout(playPathAnimation._t);
    playPathAnimation._t = setTimeout(() => clearPath(), 2000);
  }

  function spawnScoreDing(text) {
    const d = document.createElement('div');
    d.className = 'score-ding';
    d.textContent = text;
    const rect = boardEl.getBoundingClientRect();
    d.style.left = (rect.left + rect.width / 2) + 'px';
    d.style.top = (rect.top + rect.height / 2 - 20) + 'px';
    d.style.position = 'fixed';
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 1000);
  }

  // --- Stats display ---
  function updateStats() {
    scoreEl.textContent = state.totalScore;
    foundCountEl.textContent = state.foundWords.size;
    totalCountEl.textContent = state.allWords ? state.allWords.size : '—';
    wordsStreakEl.textContent = state.totalScore + ' pts';

    // progress ring
    const total = state.allWords ? state.allWords.size : 1;
    const pct = state.foundWords.size / total;
    const circ = 2 * Math.PI * 32;
    ringFill.setAttribute('stroke-dasharray', circ);
    ringFill.setAttribute('stroke-dashoffset', circ * (1 - pct));
    ringPct.textContent = Math.round(pct * 100) + '%';

    if (state.foundWords.size === 0) {
      progressBig.textContent = 'Let\'s play';
      progressSmall.textContent = 'A fresh board is waiting.';
    } else {
      const tierMsg = pct >= 0.25 ? 'Masterful.' : pct >= 0.1 ? 'Great pace!' : pct >= 0.03 ? 'Nicely going.' : 'Keep going!';
      progressBig.textContent = tierMsg;
      progressSmall.textContent = state.foundWords.size + ' of ' + total + ' possible words';
    }
  }

  function addFoundWord(word, pts) {
    wordsEmptyEl.style.display = 'none';
    const row = document.createElement('div');
    row.className = 'word-row';
    row.innerHTML = '<span class="w">' + word + '</span><span class="pts">+' + pts + '</span>';
    row.title = 'Hover to see the path';
    row.addEventListener('mouseenter', () => {
      const p = state.allWords.get(word);
      if (p) drawPath(p);
    });
    row.addEventListener('mouseleave', () => clearPath());
    // column-reverse stacks newest on top
    wordsListEl.prepend(row);
  }

  // --- End game ---
  function endGame() {
    if (state.gameOver) return;
    state.gameOver = true;
    stopTimer();
    state.timerPaused = true;
    pauseBtn.textContent = '⏸ Pause';
    pauseBtn.disabled = true;
    timerEl.classList.add('paused');
    entryEl.disabled = true;
    if (!state.muted) playGameOver();
    setStatus('info', 'Time\'s up! Start a new board to play again.');
    saveScore();
    showEndgameModal();
  }

  function saveScore() {
    if (state.saved) return;
    state.saved = true;
    try {
      const scores = JSON.parse(localStorage.getItem('borgle.scores') || '[]');
      scores.push({
        date: new Date().toISOString(),
        score: state.totalScore,
        words_found: state.foundWords.size,
        total_words: state.allWords.size,
        pct: +(state.foundWords.size / state.allWords.size * 100).toFixed(1),
      });
      localStorage.setItem('borgle.scores', JSON.stringify(scores.slice(-200)));
    } catch (e) {}
  }

  function showEndgameModal() {
    const total = state.allWords.size;
    const pct = (state.foundWords.size / total * 100).toFixed(1);
    const best = (() => {
      try {
        const scores = JSON.parse(localStorage.getItem('borgle.scores') || '[]');
        return scores.reduce((m, s) => Math.max(m, s.score || 0), 0);
      } catch { return 0; }
    })();
    const isPB = state.totalScore > 0 && state.totalScore >= best;

    const msg = state.totalScore >= 100 ? 'Nicely done.' :
                state.totalScore >= 50 ? 'Solid round.' :
                state.totalScore >= 15 ? 'Good effort.' :
                state.totalScore > 0 ? 'Every round counts.' :
                'The board won this one.';

    const html = `
      <div class="endgame">
        <div class="tag">${isPB ? '★ New personal best' : 'Round complete'}</div>
        <div class="big-num">${state.totalScore}</div>
        <div class="msg">${msg}</div>
        <div class="row">
          <div><div class="k">Words</div><div class="v">${state.foundWords.size}</div></div>
          <div><div class="k">On board</div><div class="v">${total}</div></div>
          <div><div class="k">Caught</div><div class="v">${pct}%</div></div>
        </div>
        <div class="actions">
          <button class="ghost" id="end-reveal">See all words</button>
          <button class="primary" id="end-new">Play again</button>
        </div>
      </div>
    `;
    openModal('Round complete', new Date().toLocaleString(), html);
    setTimeout(() => {
      $('end-new')?.addEventListener('click', () => { closeModal(); newGame(); });
      $('end-reveal')?.addEventListener('click', () => { closeModal(); showRevealModal(); });
    }, 30);
  }

  // --- Modal helpers ---
  const modalEl = $('modal');
  const modalTitle = $('modal-title');
  const modalSub = $('modal-sub');
  const modalBody = $('modal-body');
  $('modal-close').addEventListener('click', closeModal);
  modalEl.addEventListener('click', (e) => { if (e.target === modalEl) closeModal(); });

  function openModal(title, sub, bodyHTML, opts = {}) {
    modalTitle.textContent = title;
    modalSub.textContent = sub || '';
    modalBody.innerHTML = bodyHTML;
    modalEl.classList.toggle('dock-right', !!opts.dockRight);
    modalEl.classList.add('show');
    // Wire path-on-hover for any word in the modal with data-word
    if (opts.hoverPaths) {
      modalBody.querySelectorAll('[data-word]').forEach(el => {
        const w = el.dataset.word;
        el.style.cursor = 'pointer';
        el.addEventListener('mouseenter', () => {
          const p = state.allWords && state.allWords.get(w);
          if (p) drawPath(p);
        });
        el.addEventListener('mouseleave', () => clearPath());
      });
    }
  }
  function closeModal() { modalEl.classList.remove('show'); clearPath(); }

  // --- Word reveal ---
  function showRevealModal() {
    const byLen = {};
    for (const w of state.allWords.keys()) {
      const l = w.length;
      (byLen[l] = byLen[l] || []).push(w);
    }
    const lens = Object.keys(byLen).map(Number).sort((a, b) => b - a);
    let html = '<p class="modal-hint">Hover any word to see its path on the board.</p>';
    for (const l of lens) {
      byLen[l].sort();
      html += `<div class="len-group"><h4>${l}-letter · ${byLen[l].filter(w => state.foundWords.has(w)).length}/${byLen[l].length}</h4><div class="word-grid">`;
      for (const w of byLen[l]) {
        const cls = state.foundWords.has(w) ? 'found' : 'missed';
        html += `<span class="w ${cls}" data-word="${w}">${w}</span>`;
      }
      html += '</div></div>';
    }
    openModal('All words on this board', `${state.allWords.size} words total · ${state.foundWords.size} found`, html, { dockRight: true, hoverPaths: true });
  }

  function showFoundModal() {
    if (state.foundWords.size === 0) {
      openModal('Words I\'ve found', '0 words', '<p style="color:var(--ink-mute); text-align:center; padding: 40px 0;">No words yet — start typing!</p>');
      return;
    }
    const byLen = {};
    for (const w of state.foundWords) {
      const l = w.length;
      (byLen[l] = byLen[l] || []).push(w);
    }
    const lens = Object.keys(byLen).map(Number).sort((a, b) => b - a);
    let html = '<p class="modal-hint">Hover any word to see its path on the board.</p>';
    for (const l of lens) {
      byLen[l].sort();
      html += `<div class="len-group"><h4>${l}-letter · ${byLen[l].length} word${byLen[l].length>1?'s':''}</h4><div class="word-grid">`;
      for (const w of byLen[l]) html += `<span class="w found" data-word="${w}">${w}</span>`;
      html += '</div></div>';
    }
    openModal('Words I\'ve found', state.foundWords.size + ' · ' + state.totalScore + ' pts', html, { dockRight: true, hoverPaths: true });
  }

  function showRulesModal() {
    const html = `
      <p style="color:var(--ink-dim); line-height:1.6; margin:0 0 14px;">Find as many words as you can in <strong>3 minutes</strong>. Words must:</p>
      <ul style="color:var(--ink-dim); line-height:1.7; margin:0 0 18px; padding-left:20px;">
        <li>Be <strong>4 or more letters</strong></li>
        <li>Connect tiles that touch — horizontally, vertically, or diagonally</li>
        <li>Use each tile <strong>at most once</strong> per word</li>
      </ul>
      <div style="padding: 14px 18px; background: var(--bg); border-radius: 12px; display:flex; gap:24px; justify-content:center; align-items:center; flex-wrap: wrap;">
        <div><span style="font-family:var(--font-mono); font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-mute)">Scoring</span><br/>
          <span style="font-family:var(--font-display); font-size:14px">word length − 3</span></div>
        <div style="display:flex; gap:14px; font-family:var(--font-mono); font-size:12px; color:var(--ink-dim)">
          <span>4 → +1</span><span>5 → +2</span><span>7 → +4</span><span>10 → +7</span>
        </div>
      </div>
      <p style="color:var(--ink-mute); margin-top:14px; font-size:13px; text-align:center; line-height:1.5;">
        Tip: typing a prefix highlights matching paths on the board.<br/>
        Tile <strong>Qu</strong> counts as the two-letter sequence <strong>QU</strong>.
      </p>
    `;
    openModal('How to play', 'Borgle · 5×5', html);
  }

  // --- Heatmap ---
  function showHeatmap() {
    // Count words passing through each tile
    const counts = Array.from({ length: BOARD_SIZE }, () => new Array(BOARD_SIZE).fill(0));
    const foundCounts = Array.from({ length: BOARD_SIZE }, () => new Array(BOARD_SIZE).fill(0));
    for (const [w, path] of state.allWords.entries()) {
      const isFound = state.foundWords.has(w);
      for (const [r, c] of path) {
        counts[r][c]++;
        if (isFound) foundCounts[r][c]++;
      }
    }
    let maxCount = 0;
    for (let r = 0; r < BOARD_SIZE; r++) for (let c = 0; c < BOARD_SIZE; c++) maxCount = Math.max(maxCount, counts[r][c]);

    function renderGrid(values, title) {
      let h = `<div class="heat-cell"><h4>${title}</h4><div class="heat-board">`;
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const v = values[r][c];
          const t = maxCount > 0 ? v / maxCount : 0;
          // lerp warm colors
          const bg = `color-mix(in oklab, var(--accent) ${Math.round(t * 80)}%, var(--bg))`;
          const fg = t > 0.45 ? 'var(--paper)' : 'var(--ink)';
          const letter = state.board[r][c] === 'Q' ? 'Qu' : state.board[r][c];
          h += `<div class="heat-tile" style="background:${bg}; color:${fg}">${letter}<span class="tile-count">${v}</span></div>`;
        }
      }
      h += '</div></div>';
      return h;
    }

    // Top 20 longest words
    const topWords = Array.from(state.allWords.keys()).sort((a, b) => b.length - a.length).slice(0, 15);
    const maxLen = topWords.length ? topWords[0].length : 1;
    let bars = '<div class="heat-cell" style="grid-column: 1 / -1"><h4>Longest words · green = found</h4><div class="bar-chart">';
    for (const w of topWords) {
      const isFound = state.foundWords.has(w);
      const pct = (w.length / maxLen) * 100;
      const color = isFound ? 'var(--forest)' : 'color-mix(in oklab, var(--ink) 20%, transparent)';
      bars += `<div class="bar-row">
        <span class="label">${w.length}</span>
        <div class="bar-bg" style="background: color-mix(in oklab, var(--ink) 4%, transparent)">
          <div class="bar-fill-found" style="width:${pct}%; background:${color}"></div>
          <span style="position:absolute; left:10px; top:50%; transform: translateY(-50%); font-family: var(--font-display); font-weight: 600; font-size: 12px; letter-spacing: 0.04em; color: ${isFound ? 'var(--paper)' : 'var(--ink)'}; z-index: 1;">${w}</span>
        </div>
        <span class="val">+${wordScore(w)}</span>
      </div>`;
    }
    bars += '</div></div>';

    const html = `<div class="heat-wrap">
      ${renderGrid(counts, 'Tile density — all words')}
      ${renderGrid(foundCounts, 'Tile density — your words')}
      ${bars}
    </div>`;
    openModal('Board heatmap', 'Hotter tiles pass through more words', html);
  }

  // --- Path Map (high-traffic tile sub-paths) ---
  function showPathMapModal() {
    if (!state.allWords || state.allWords.size === 0) {
      openModal('Path map', '—', '<p style="color:var(--ink-mute); text-align:center; padding:40px 0;">No board yet.</p>');
      return;
    }
    const selected = computeTileSequences(state.allWords);
    if (!selected.length) {
      openModal('Path map', '—', '<p style="color:var(--ink-mute); text-align:center; padding:40px 0;">Not enough data.</p>');
      return;
    }
    const COLORS = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff922b','#cc5de8','#20c997','#f06595','#74c0fc','#a9e34b','#ff8fab','#b5e48c'];
    const maxCount = selected[0].count;

    // SVG board: 5x5 grid, cell size 64
    const S = 64, P = 20; // cell, padding
    const W = BOARD_SIZE * S + P * 2;
    const H = W;
    const cx = (c) => P + c * S + S / 2;
    const cy = (r) => P + r * S + S / 2;
    const seqToLetters = (seq) => seq.map(([r,c]) => state.board[r][c] === 'Q' ? 'Qu' : state.board[r][c]).join('');

    let svg = `<svg viewBox="0 0 ${W} ${H}" style="width:100%; max-width:520px; display:block; margin:0 auto; background: color-mix(in oklab, var(--ink) 8%, var(--paper)); border-radius: 12px;">`;
    // tiles
    for (let r = 0; r < BOARD_SIZE; r++) for (let c = 0; c < BOARD_SIZE; c++) {
      svg += `<rect x="${P+c*S+4}" y="${P+r*S+4}" width="${S-8}" height="${S-8}" rx="8" fill="color-mix(in oklab, var(--paper) 70%, var(--ink) 5%)" stroke="color-mix(in oklab, var(--ink) 15%, transparent)"/>`;
    }
    // arrows (thinnest first)
    const sortedDraw = [...selected].sort((a,b) => a.count - b.count);
    sortedDraw.forEach((entry, drawIdx) => {
      const idx = selected.indexOf(entry);
      const color = COLORS[idx % COLORS.length];
      const norm = entry.count / maxCount;
      const lw = 2 + norm * 14;
      const pts = entry.seq.map(([r,c]) => [cx(c), cy(r)]);
      // shrink last segment so arrow tip sits near center
      const [px, py] = pts[pts.length-2];
      const [lx, ly] = pts[pts.length-1];
      const dx = lx - px, dy = ly - py;
      const d = Math.hypot(dx, dy) || 1;
      const shrink = 14;
      const tipX = lx - dx/d * shrink, tipY = ly - dy/d * shrink;
      const poly = [...pts.slice(0, -1), [tipX, tipY]].map(p => p.join(',')).join(' ');
      svg += `<polyline points="${poly}" fill="none" stroke="${color}" stroke-width="${lw}" stroke-linecap="round" stroke-linejoin="round" opacity="0.78"/>`;
      // arrowhead
      const ah = 8 + norm * 10;
      const ang = Math.atan2(dy, dx);
      const ax1 = tipX - ah * Math.cos(ang - 0.5);
      const ay1 = tipY - ah * Math.sin(ang - 0.5);
      const ax2 = tipX - ah * Math.cos(ang + 0.5);
      const ay2 = tipY - ah * Math.sin(ang + 0.5);
      svg += `<polygon points="${tipX},${tipY} ${ax1},${ay1} ${ax2},${ay2}" fill="${color}"/>`;
    });
    // letters on top
    for (let r = 0; r < BOARD_SIZE; r++) for (let c = 0; c < BOARD_SIZE; c++) {
      const letter = state.board[r][c] === 'Q' ? 'Qu' : state.board[r][c];
      svg += `<text x="${cx(c)}" y="${cy(r)+6}" text-anchor="middle" font-family="var(--font-display)" font-weight="700" font-size="22" fill="var(--ink)">${letter}</text>`;
    }
    svg += '</svg>';

    // legend
    let legend = '<div class="pathmap-legend">';
    selected.forEach((entry, idx) => {
      const color = COLORS[idx % COLORS.length];
      const letters = seqToLetters(entry.seq);
      const norm = entry.count / maxCount;
      const lw = Math.max(3, Math.min(10, 3 + norm * 9));
      legend += `<div class="pathmap-row" data-seq-idx="${idx}">
        <svg width="44" height="16" style="flex:0 0 44px"><line x1="4" y1="8" x2="36" y2="8" stroke="${color}" stroke-width="${lw}" stroke-linecap="round"/><polygon points="42,8 34,4 34,12" fill="${color}"/></svg>
        <span class="pathmap-letters">${letters}</span>
        <span class="pathmap-count">${entry.count} word${entry.count===1?'':'s'}</span>
        <span class="pathmap-len">${entry.len} tiles</span>
      </div>`;
    });
    legend += '</div>';

    const html = `<div class="pathmap-wrap">
      <div class="pathmap-board">${svg}<p class="pathmap-hint">Thicker line = more words traverse this sub-path. Hover a legend row to highlight it.</p></div>
      <div class="pathmap-side">${legend}</div>
    </div>`;
    openModal('Path map', `Top ${selected.length} high-traffic tile sub-paths`, html);

    // hover interactions: highlight path on the real board
    const rows = document.querySelectorAll('.pathmap-row');
    rows.forEach(row => {
      row.addEventListener('mouseenter', () => {
        const i = +row.dataset.seqIdx;
        drawPath(selected[i].seq);
      });
      row.addEventListener('mouseleave', () => clearPath && clearPath());
    });
  }

  // --- Common Words Across Boards ---
  function showCommonWordsModal(initialTab = 'found') {
    const html = `
      <div class="cw-tabs">
        <button class="cw-tab" data-tab="found">Words I find most</button>
        <button class="cw-tab" data-tab="atlas">Words that appear most</button>
      </div>
      <div class="cw-body" id="cw-body"></div>
    `;
    openModal('Common words', 'Across all boards you\'ve played', html);

    const renderTab = (tab) => {
      const body = document.getElementById('cw-body');
      if (!body) return;
      document.querySelectorAll('.cw-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
      body.innerHTML = tab === 'atlas' ? renderAtlas() : renderFound();
      body.querySelector('#btn-common-reset')?.addEventListener('click', () => {
        if (confirm('Reset words you\'ve found history?')) {
          localStorage.removeItem('borgle.commonWords');
          renderTab(tab);
        }
      });
      body.querySelector('#btn-atlas-reset')?.addEventListener('click', () => {
        if (confirm('Reset board occurrence atlas? This clears the record of every word that has appeared on a board.')) {
          localStorage.removeItem('borgle.wordAtlas');
          localStorage.removeItem('borgle.seenBoards');
          localStorage.removeItem('borgle.atlasMeta');
          renderTab(tab);
        }
      });
      body.querySelectorAll('.atlas-len-pill').forEach(p => {
        p.addEventListener('click', () => {
          atlasFilterLen = +p.dataset.len;
          renderTab('atlas');
        });
      });
    };

    document.querySelectorAll('.cw-tab').forEach(btn => {
      btn.addEventListener('click', () => renderTab(btn.dataset.tab));
    });
    renderTab(initialTab);
  }

  let atlasFilterLen = 0; // 0 = all (≥7 by default)

  function renderFound() {
    let cw = {};
    try { cw = JSON.parse(localStorage.getItem('borgle.commonWords') || '{}'); } catch(e){}
    const entries = Object.entries(cw).sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    if (!entries.length) {
      return '<p style="color:var(--ink-mute); text-align:center; padding:40px 0;">Find some words first — this tracks the words you find most often across every board you play.</p>';
    }
    const totalFinds = entries.reduce((s, [,n]) => s + n, 0);
    const uniq = entries.length;
    const topN = entries.slice(0, 60);
    const maxN = topN[0][1];

    const byLen = {};
    for (const [w,n] of entries) byLen[w.length] = (byLen[w.length] || 0) + n;
    const lens = Object.keys(byLen).map(Number).sort((a,b)=>a-b);
    const maxLenVal = Math.max(...Object.values(byLen));

    let barsHtml = '<div class="common-cell"><h4>Most-found words across boards</h4><div class="bar-chart">';
    topN.forEach(([w, n]) => {
      const pct = (n / maxN) * 100;
      barsHtml += `<div class="bar-row">
        <span class="label">${n}×</span>
        <div class="bar-bg" style="background: color-mix(in oklab, var(--ink) 4%, transparent)">
          <div class="bar-fill-found" style="width:${pct}%; background: var(--accent)"></div>
          <span style="position:absolute; left:10px; top:50%; transform:translateY(-50%); font-family: var(--font-display); font-weight: 600; font-size: 12px; letter-spacing: 0.04em; color: ${pct > 40 ? 'var(--paper)' : 'var(--ink)'}; z-index:1;">${w}</span>
        </div>
        <span class="val">+${wordScore(w)}</span>
      </div>`;
    });
    barsHtml += '</div></div>';

    let lenHtml = '<div class="common-cell"><h4>Length of common words</h4><div class="bar-chart">';
    lens.forEach(L => {
      const v = byLen[L];
      const pct = (v / maxLenVal) * 100;
      lenHtml += `<div class="bar-row">
        <span class="label">${L} ltr</span>
        <div class="bar-bg" style="background: color-mix(in oklab, var(--ink) 4%, transparent)">
          <div class="bar-fill-found" style="width:${pct}%; background: var(--forest)"></div>
        </div>
        <span class="val">${v}</span>
      </div>`;
    });
    lenHtml += '</div></div>';

    const statsHtml = `<div class="common-stats">
      <div class="stat"><div class="stat-num">${uniq}</div><div class="stat-lbl">unique words</div></div>
      <div class="stat"><div class="stat-num">${totalFinds}</div><div class="stat-lbl">total finds</div></div>
      <div class="stat"><div class="stat-num">${topN[0][0]}</div><div class="stat-lbl">most found (${maxN}×)</div></div>
    </div>`;

    return `<div class="common-wrap">
      ${statsHtml}${barsHtml}${lenHtml}
      <div class="common-actions"><button class="ghost" id="btn-common-reset">Reset find history</button></div>
    </div>`;
  }

  function renderAtlas() {
    let atlas = {};
    let meta = { boards: 0 };
    try { atlas = JSON.parse(localStorage.getItem('borgle.wordAtlas') || '{}'); } catch(e){}
    try { meta = JSON.parse(localStorage.getItem('borgle.atlasMeta') || '{"boards":0}'); } catch(e){}
    const totalBoards = meta.boards || 0;
    const allEntries = Object.entries(atlas);
    if (!allEntries.length) {
      return '<p style="color:var(--ink-mute); text-align:center; padding:40px 0;">Play a few boards first — this tracks every word that has appeared on any board, whether you found it or not.</p>';
    }

    // Length filter pills (default 7 to focus on longer words)
    const allLens = [...new Set(allEntries.map(([w]) => w.length))].sort((a,b) => a - b);
    const minLenAvailable = allLens[0] || 4;
    const maxLenAvailable = allLens[allLens.length-1] || 12;
    if (atlasFilterLen === 0) {
      // default: 7+ if there are any 7+ words, else minLen
      atlasFilterLen = allEntries.some(([w]) => w.length >= 7) ? 7 : minLenAvailable;
    }

    const filtered = allEntries
      .filter(([w]) => w.length >= atlasFilterLen)
      .sort((a,b) => b[1] - a[1] || b[0].length - a[0].length || a[0].localeCompare(b[0]));

    const topN = filtered.slice(0, 60);
    const maxN = topN[0]?.[1] || 1;
    const uniqAtThisLen = filtered.length;

    // Pills
    const pillOptions = [4, 5, 6, 7, 8, 9, 10].filter(L => L >= minLenAvailable && L <= maxLenAvailable);
    let pills = '<div class="atlas-pills">';
    pills += `<span class="atlas-pills-lbl">min length</span>`;
    for (const L of pillOptions) {
      const active = L === atlasFilterLen ? 'active' : '';
      const count = allEntries.filter(([w]) => w.length >= L).length;
      pills += `<button class="atlas-len-pill ${active}" data-len="${L}">${L}+ <span class="pill-count">${count}</span></button>`;
    }
    pills += '</div>';

    // Top word bars
    let bars = '<div class="common-cell"><h4>Most common words on boards (length ' + atlasFilterLen + '+)</h4><div class="bar-chart">';
    topN.forEach(([w, n]) => {
      const pct = (n / maxN) * 100;
      const freq = totalBoards > 0 ? (n / totalBoards * 100).toFixed(1) + '%' : '—';
      bars += `<div class="bar-row atlas-row">
        <span class="label">${n}×</span>
        <div class="bar-bg" style="background: color-mix(in oklab, var(--ink) 4%, transparent)">
          <div class="bar-fill-found" style="width:${pct}%; background: linear-gradient(90deg, var(--forest), color-mix(in oklab, var(--forest) 75%, var(--accent)))"></div>
          <span style="position:absolute; left:10px; top:50%; transform:translateY(-50%); font-family: var(--font-display); font-weight: 600; font-size: 12px; letter-spacing: 0.04em; color: ${pct > 35 ? 'var(--paper)' : 'var(--ink)'}; z-index:1;">${w}</span>
        </div>
        <span class="val">${freq}</span>
      </div>`;
    });
    bars += '</div></div>';

    // Length distribution of UNIQUE words seen
    const byLenUniq = {};
    for (const [w] of allEntries) byLenUniq[w.length] = (byLenUniq[w.length] || 0) + 1;
    const dlens = Object.keys(byLenUniq).map(Number).sort((a,b)=>a-b);
    const maxLenVal = Math.max(...Object.values(byLenUniq));
    let lenHtml = '<div class="common-cell"><h4>Unique words seen, by length</h4><div class="bar-chart">';
    dlens.forEach(L => {
      const v = byLenUniq[L];
      const pct = (v / maxLenVal) * 100;
      lenHtml += `<div class="bar-row">
        <span class="label">${L} ltr</span>
        <div class="bar-bg" style="background: color-mix(in oklab, var(--ink) 4%, transparent)">
          <div class="bar-fill-found" style="width:${pct}%; background: var(--accent)"></div>
        </div>
        <span class="val">${v}</span>
      </div>`;
    });
    lenHtml += '</div></div>';

    const statsHtml = `<div class="common-stats">
      <div class="stat"><div class="stat-num">${totalBoards}</div><div class="stat-lbl">boards seen</div></div>
      <div class="stat"><div class="stat-num">${allEntries.length.toLocaleString()}</div><div class="stat-lbl">unique words</div></div>
      <div class="stat"><div class="stat-num">${uniqAtThisLen.toLocaleString()}</div><div class="stat-lbl">${atlasFilterLen}+ letters</div></div>
    </div>`;

    return `<div class="common-wrap">
      ${statsHtml}${pills}${bars}${lenHtml}
      <div class="common-actions"><button class="ghost" id="btn-atlas-reset">Reset board atlas</button></div>
    </div>`;
  }

  // --- Stats ---
  function showStatsModal() {
    const byLen = {};
    for (const [w] of state.allWords) {
      const l = w.length;
      if (!byLen[l]) byLen[l] = { total: 0, found: 0, pts_total: 0, pts_found: 0 };
      const pts = wordScore(w);
      byLen[l].total++;
      byLen[l].pts_total += pts;
      if (state.foundWords.has(w)) { byLen[l].found++; byLen[l].pts_found += pts; }
    }
    const lens = Object.keys(byLen).map(Number).sort((a, b) => a - b);
    const maxTotal = Math.max(...lens.map(l => byLen[l].total));

    const total = state.allWords.size;
    const pct = (state.foundWords.size / total * 100);
    const potentialScore = lens.reduce((s, l) => s + byLen[l].pts_total, 0);

    let html = `
      <div style="display:grid; grid-template-columns: 1fr 2fr; gap: 20px; margin-bottom: 20px;">
        <div style="padding: 18px; background: var(--bg); border-radius: 14px; text-align:center;">
          <div style="font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.1em; color:var(--ink-mute); text-transform:uppercase;">Your score</div>
          <div style="font-family: var(--font-display); font-weight:800; font-size: 48px; color: var(--accent); letter-spacing:-0.03em; line-height:1;">${state.totalScore}</div>
          <div style="font-family: var(--font-mono); font-size: 11px; color:var(--ink-mute); margin-top:6px;">of ${potentialScore} possible</div>
        </div>
        <div style="padding: 18px; background: var(--bg); border-radius: 14px;">
          <div style="font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.1em; color:var(--ink-mute); text-transform:uppercase;">Words caught</div>
          <div style="display:flex; align-items:baseline; gap:8px; margin-top:4px;">
            <span style="font-family: var(--font-display); font-weight:700; font-size: 32px; color: var(--forest);">${state.foundWords.size}</span>
            <span style="font-family: var(--font-mono); font-size: 12px; color:var(--ink-mute);">/ ${total}</span>
            <span style="flex:1"></span>
            <span style="font-family: var(--font-display); font-weight:700; font-size: 24px; color: var(--ink);">${pct.toFixed(1)}%</span>
          </div>
          <div style="height:8px; background: color-mix(in oklab, var(--ink) 8%, transparent); border-radius: 999px; margin-top:10px; overflow:hidden;">
            <div style="height:100%; width:${Math.max(pct, 0.5)}%; background: var(--forest); border-radius: 999px; transition: width 0.5s;"></div>
          </div>
        </div>
      </div>
      <h4 style="font-family: var(--font-mono); font-size:10.5px; letter-spacing:0.1em; color:var(--ink-mute); text-transform:uppercase; margin: 0 0 10px; font-weight:600;">Words by length</h4>
      <div class="bar-chart">
    `;
    for (const l of lens) {
      const g = byLen[l];
      const totalPct = (g.total / maxTotal) * 100;
      const foundPct = (g.found / maxTotal) * 100;
      html += `<div class="bar-row">
        <span class="label">${l} ltr</span>
        <div class="bar-bg">
          <div class="bar-fill-total" style="width:${totalPct}%"></div>
          <div class="bar-fill-found" style="width:${foundPct}%"></div>
        </div>
        <span class="val">${g.found}/${g.total}</span>
      </div>`;
    }
    html += '</div>';
    openModal('Game stats', 'Analysis of this board', html);
  }

  // --- Scores ---
  function showScoresModal() {
    let scores;
    try { scores = JSON.parse(localStorage.getItem('borgle.scores') || '[]'); } catch { scores = []; }
    if (!scores.length) {
      openModal('Score history', 'No scores yet', '<p style="color:var(--ink-mute); text-align:center; padding:40px 0;">Finish a round to start tracking scores.</p>');
      return;
    }
    const best = Math.max(...scores.map(s => s.score));
    const sorted = scores.slice().sort((a, b) => b.score - a.score);
    let html = '<div class="scores-list">';
    sorted.slice(0, 20).forEach((s, i) => {
      const cls = s.score === best && i === 0 ? 'best' : '';
      const d = new Date(s.date);
      const dstr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      html += `<div class="score-row ${cls}">
        <span class="rank">#${i + 1}</span>
        <span class="date">${dstr}</span>
        <span class="meta">${s.words_found}/${s.total_words} · ${s.pct}%</span>
        <span class="pts">${s.score}</span>
      </div>`;
    });
    html += '</div>';
    openModal('Score history', 'Top 20 · best: ' + best, html);
  }

  // --- New game ---
  async function newGame() {
    state.gameOver = false;
    state.saved = false;
    state.foundWords = new Set();
    state.totalScore = 0;
    state.timeLeft = 180;
    state.timerPaused = true;
    state.started = false;
    stopTimer();
    pauseBtn.disabled = false;
    pauseBtn.textContent = '▶ Start';
    entryEl.disabled = false;
    entryEl.value = '';
    clearHighlights();
    updateTimer();

    splashStatus.textContent = 'Finding a rich board…';
    splash.classList.remove('hide');

    // Let splash paint before we start the (long) synchronous SA.
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise(r => setTimeout(r, 30));

    // Run SA as a single, long-lived cooling schedule, yielding to the UI
    // every ~1500 iterations so the splash status can update. Unlike
    // splitting into multiple optimizeBoard() calls, this preserves the
    // temperature state and matches BoggleBest.py's behavior.
    const TOTAL_BUDGET_MS = 15000;
    const TARGET = 2000;
    const seed = (Date.now() & 0x7fffffff);
    const rng = makeRNG(seed);
    const optimizer = new window.BorgleEngine.BoardOptimizer(state.trie, rng);
    const t0 = performance.now();
    while (performance.now() - t0 < TOTAL_BUDGET_MS && optimizer.bestCount < TARGET) {
      optimizer.step(1500);
      const elapsed = performance.now() - t0;
      const pct = Math.min(100, (elapsed / TOTAL_BUDGET_MS) * 100);
      splashStatus.textContent = `searching… best ${optimizer.bestCount} words (${pct.toFixed(0)}%)`;
      await new Promise(r => setTimeout(r, 16));
    }
    state.board = optimizer.bestBoard;
    state.allWords = findAllWordsAndPaths(state.board, state.trie);
    splashStatus.textContent = `Found a board with ${state.allWords.size} words`;

    // Record every word on this board into the global atlas (once per unique board)
    try {
      const boardKey = state.board.flat().join('');
      const seen = JSON.parse(localStorage.getItem('borgle.seenBoards') || '{}');
      if (!seen[boardKey]) {
        seen[boardKey] = Date.now();
        // cap stored boards so localStorage doesn't grow unbounded
        const keys = Object.keys(seen);
        if (keys.length > 1000) {
          keys.sort((a,b) => seen[a] - seen[b]);
          for (let i = 0; i < keys.length - 1000; i++) delete seen[keys[i]];
        }
        localStorage.setItem('borgle.seenBoards', JSON.stringify(seen));
        const atlas = JSON.parse(localStorage.getItem('borgle.wordAtlas') || '{}');
        for (const w of state.allWords.keys()) atlas[w] = (atlas[w] || 0) + 1;
        localStorage.setItem('borgle.wordAtlas', JSON.stringify(atlas));
        const meta = JSON.parse(localStorage.getItem('borgle.atlasMeta') || '{"boards":0}');
        meta.boards = (meta.boards || 0) + 1;
        localStorage.setItem('borgle.atlasMeta', JSON.stringify(meta));
      }
    } catch(e){}

    renderBoard();
    wordsListEl.innerHTML = '';
    wordsListEl.appendChild(wordsEmptyEl);
    wordsEmptyEl.style.display = 'block';
    updateStats();
    setStatus('info', 'Press <span class="kbd">▶ Start</span> to begin.');

    setTimeout(() => splash.classList.add('hide'), 500);
  }

  // --- Tweaks UI ---
  function renderTweaks() {
    const tt = $('tweak-themes');
    tt.innerHTML = '';
    for (const k in BORGLE_THEMES) {
      const opt = document.createElement('button');
      opt.className = 'tweak-opt' + (state.theme === k ? ' active' : '');
      const sw = document.createElement('span');
      sw.className = 'swatch';
      sw.style.background = BORGLE_THEMES[k]['--accent'];
      opt.appendChild(sw);
      opt.appendChild(document.createTextNode(BORGLE_THEMES[k].name));
      opt.onclick = () => setTweak('theme', k);
      tt.appendChild(opt);
    }
    const tf = $('tweak-fonts');
    tf.innerHTML = '';
    for (const k in BORGLE_FONTS) {
      const opt = document.createElement('button');
      opt.className = 'tweak-opt' + (state.font === k ? ' active' : '');
      opt.textContent = BORGLE_FONTS[k].name;
      opt.style.fontFamily = BORGLE_FONTS[k].display;
      opt.onclick = () => setTweak('font', k);
      tf.appendChild(opt);
    }
  }

  function setTweak(key, val) {
    state[key] = val;
    applyBorgleTheme(state.theme, state.font);
    renderTweaks();
    // persist
    window.parent?.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: val } }, '*');
  }

  // --- Edit-mode protocol ---
  let editModeActive = false;
  window.addEventListener('message', (e) => {
    if (!e.data) return;
    if (e.data.type === '__activate_edit_mode') {
      editModeActive = true;
      $('tweaks').classList.add('show');
    } else if (e.data.type === '__deactivate_edit_mode') {
      editModeActive = false;
      $('tweaks').classList.remove('show');
    }
  });
  // announce availability AFTER listener is up
  window.parent?.postMessage({ type: '__edit_mode_available' }, '*');

  // --- Bindings ---
  pauseBtn.addEventListener('click', togglePause);
  $('btn-new').addEventListener('click', () => {
    if (state.started && !state.gameOver && state.foundWords.size > 0 && !confirm('Abandon this round and start a new board?')) return;
    newGame();
  });
  $('btn-submit').addEventListener('click', submitWord);
  $('btn-found').addEventListener('click', showFoundModal);
  $('btn-reveal').addEventListener('click', showRevealModal);
  $('btn-rules').addEventListener('click', showRulesModal);
  $('btn-heat').addEventListener('click', showHeatmap);
  $('btn-stats').addEventListener('click', showStatsModal);
  $('btn-scores').addEventListener('click', showScoresModal);
  $('btn-pathmap')?.addEventListener('click', showPathMapModal);
  $('btn-common')?.addEventListener('click', showCommonWordsModal);
  entryEl.addEventListener('input', onEntryChange);
  entryEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submitWord(); }
    else if (e.key === 'Escape') { entryEl.value = ''; onEntryChange(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.target === entryEl) return;
    if (e.key === ' ' && !modalEl.classList.contains('show')) { e.preventDefault(); togglePause(); }
    else if (e.key === 'Escape') closeModal();
  });

  // --- Boot ---
  async function boot() {
    buildBoardDOM();
    applyTweaks(TWEAK_DEFAULTS);
    try {
      splashStatus.textContent = 'Loading dictionary';
      const resp = await fetch('dictionary.txt');
      const txt = await resp.text();
      const words = txt.split('\n').map(w => w.trim()).filter(Boolean);
      state.dict = new Set(words);
      splashStatus.textContent = 'Building trie';
      await new Promise(r => setTimeout(r, 20));
      state.trie = buildTrie(words);
      await newGame();
    } catch (e) {
      splashStatus.textContent = 'Error: ' + e.message;
      console.error(e);
    }
  }

  boot();
})();
