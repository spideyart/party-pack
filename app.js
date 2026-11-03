/* Party Pack — shared shell + Tic-Tac-Toe + Connect Four + Dots and Boxes */
var PLAYER_COLORS = ['#e74c3c', '#27ae60', '#f1c40f', '#3498db'];
var PLAYER_EMOJI = ['🔴', '🟢', '🟡', '🔵'];
var players = [];       // [{name, color}]
var wins = {};          // name -> wins
/* Shared game sounds (tiny WebAudio tones, no audio files) + sound toggle */
var soundMuted = false;
try { soundMuted = localStorage.getItem('partyPackMuted') === '1'; } catch (e) {}
var audioCtx = null;
function playTone(freq, dur, type, delay, vol) {
  try {
    if (soundMuted) return;
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    var t = audioCtx.currentTime + (delay || 0);
    var o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.09, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t + dur);
  } catch (e) {}
}
function playSound(name) {
  if (name === 'tap') playTone(700, 0.06, 'sine');
  else if (name === 'place') playTone(520, 0.08, 'sine');
  else if (name === 'drop') { playTone(300, 0.1, 'triangle'); playTone(200, 0.12, 'triangle', 0.05); }
  else if (name === 'claim') playTone(660, 0.1, 'sine');
  else if (name === 'box') { playTone(660, 0.1, 'sine'); playTone(880, 0.14, 'sine', 0.09); }
  else if (name === 'hit') playTone(900, 0.1, 'triangle');
  else if (name === 'miss') playTone(180, 0.12, 'sine');
  else if (name === 'win') { playTone(523, 0.14, 'sine'); playTone(659, 0.14, 'sine', 0.12); playTone(784, 0.22, 'sine', 0.24); }
}
function updateSoundButtons() {
  var b1 = $('btnSound'); if (b1) b1.textContent = soundMuted ? '🔇' : '🔊';
  var b2 = $('ludoMuteBtn');
  if (b2) { b2.textContent = soundMuted ? '🔇' : '🔊'; b2.setAttribute('aria-label', soundMuted ? 'Unmute sound' : 'Mute sound'); }
}
function setMuted(m) {
  soundMuted = m;
  try { localStorage.setItem('partyPackMuted', soundMuted ? '1' : '0'); } catch (e) {}
  updateSoundButtons();
}
/* Viewport zoom: allowed everywhere except Ludo, which does not need it */
function setViewportZoomable() { var m = document.querySelector('meta[name=viewport]'); if (m) m.setAttribute('content', 'width=device-width, initial-scale=1.0'); }
function setViewportNoZoom() { var m = document.querySelector('meta[name=viewport]'); if (m) m.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'); }
var currentGame = null; // 'ttt' | 'c4' | 'dots' | 'ships' | 'ludo'
var gameOver = false;

function $(id) { return document.getElementById(id); }
function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }

function defaultName(i) { return 'Player ' + (i + 1); }
function readPlayers() {
  var list = [];
  for (var i = 0; i < 4; i++) {
    var v = $('pname' + i).value.trim();
    if (v) list.push({ name: v, color: PLAYER_COLORS[i] });
  }
  if (list.length < 2) { // fall back to defaults so games are always playable
    list = [{ name: defaultName(0), color: PLAYER_COLORS[0] }, { name: defaultName(1), color: PLAYER_COLORS[1] }];
    var v2 = $('pname2').value.trim(), v3 = $('pname3').value.trim();
    if (v2) list.push({ name: v2, color: PLAYER_COLORS[2] });
    if (v3) list.push({ name: v3, color: PLAYER_COLORS[3] });
  }
  return list.slice(0, 4);
}
function savePlayers() {
  players = readPlayers();
  try { localStorage.setItem('partyPackPlayers', JSON.stringify(players.map(function(p) { return p.name; }))); } catch (e) {}
  renderScoreboard();
}
function loadSaved() {
  try {
    var p = JSON.parse(localStorage.getItem('partyPackPlayers') || 'null');
    if (p) p.forEach(function(n, i) { if ($('pname' + i)) $('pname' + i).value = n; });
    wins = JSON.parse(localStorage.getItem('partyPackWins') || '{}');
  } catch (e) {}
  players = readPlayers();
}
function renderScoreboard() {
  var box = $('scoreboard'); box.innerHTML = '';
  if (!players.length) { box.appendChild(el('span', 'hint', 'Save player names to start the scoreboard.')); return; }
  players.slice().sort(function(a, b) { return (wins[b.name] || 0) - (wins[a.name] || 0); }).forEach(function(p) {
    var c = el('span', 'score-chip');
    c.innerHTML = '<span style="color:' + p.color + '">●</span> ' + p.name + ' — <b>' + (wins[p.name] || 0) + '</b>';
    box.appendChild(c);
  });
}
function addWin(playerIndex) {
  var p = players[playerIndex]; if (!p) return;
  wins[p.name] = (wins[p.name] || 0) + 1;
  try { localStorage.setItem('partyPackWins', JSON.stringify(wins)); } catch (e) {}
  renderScoreboard();
}
function setTurn(text) { $('turnBanner').textContent = text; }
function setMsg(text) { $('gameMsg').textContent = text || ''; }
function showGameOver(text, winnerIndex) {
  gameOver = true;
  if (winnerIndex !== null && winnerIndex !== undefined) addWin(winnerIndex);
  $('gameOverText').textContent = text;
  $('gameOver').classList.remove('hidden');
}
function hideGameOver() { gameOver = false; $('gameOver').classList.add('hidden'); }

function showHome() {
  currentGame = null;
  $('view-home').classList.remove('hidden');
  $('view-game').classList.add('hidden');
  setViewportZoomable();
  renderScoreboard();
}
function showGame(game, title) {
  currentGame = game; hideGameOver(); setMsg(''); setViewportZoomable();
  $('view-home').classList.add('hidden');
  $('view-game').classList.remove('hidden');
  $('gameTitle').textContent = title;
  ['ttt', 'c4', 'dots', 'ships', 'ludo'].forEach(function(g) {
    $('game-' + g).classList.toggle('hidden', g !== game);
  });
}

/* ---------------- Tic-Tac-Toe ---------------- */
var ttt = null;
function startTTT() {
  showGame('ttt', '❌ Tic-Tac-Toe');
  ttt = { board: Array(9).fill(''), turn: 0, over: false };
  var marks = ['X', 'O'];
  var b = $('tttBoard'); b.innerHTML = '';
  for (var i = 0; i < 9; i++) (function(i) {
    var c = el('button', 'ttt-cell');
    c.onclick = function() {
      if (ttt.over || ttt.board[i]) return;
      ttt.board[i] = marks[ttt.turn]; c.textContent = marks[ttt.turn];
      c.style.color = players[ttt.turn].color;
      playSound('place');
      var w = tttWinner();
      if (w) { ttt.over = true; playSound('win'); setTurn('🎉 ' + players[ttt.turn].name + ' wins the round!'); showGameOver('🎉 ' + players[ttt.turn].name + ' wins Tic-Tac-Toe!', ttt.turn); }
      else if (ttt.board.every(Boolean)) { ttt.over = true; setTurn("It's a draw!"); showGameOver("It's a draw — no winner this round.", null); }
      else { ttt.turn = 1 - ttt.turn; setTurn(players[ttt.turn].name + "'s turn (" + marks[ttt.turn] + ')'); }
    };
    b.appendChild(c);
  })(i);
  setTurn(players[0].name + "'s turn (X)");
}
function tttWinner() {
  var lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  return lines.some(function(l) { return ttt.board[l[0]] && ttt.board[l[0]] === ttt.board[l[1]] && ttt.board[l[0]] === ttt.board[l[2]]; });
}

/* ---------------- Connect Four ---------------- */
var c4 = null;
function startC4() {
  showGame('c4', '🔴 Connect Four');
  c4 = { grid: [], turn: 0, over: false };
  for (var r = 0; r < 6; r++) c4.grid.push(Array(7).fill(-1));
  renderC4();
  setTurn(players[0].name + "'s turn");
}
function renderC4() {
  var b = $('c4Board'); b.innerHTML = '';
  for (var r = 0; r < 6; r++) for (var col = 0; col < 7; col++) (function(r, col) {
    var c = el('div', 'c4-cell');
    var v = c4.grid[r][col];
    if (v >= 0) c.style.background = players[v].color;
    c.tabIndex = 0; c.setAttribute('role', 'button'); c.setAttribute('aria-label', 'Drop disc in column ' + (col + 1));
    c.onclick = function() { c4Drop(col); };
    c.onkeydown = function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c4Drop(col); } };
    b.appendChild(c);
  })(r, col);
}
function c4Drop(col) {
  if (c4.over) return;
  var row = -1;
  for (var r = 5; r >= 0; r--) if (c4.grid[r][col] === -1) { row = r; break; }
  if (row === -1) { setMsg('That column is full — try another one.'); return; }
  setMsg('');
  c4.grid[row][col] = c4.turn;
  playSound('drop');
  var winCells = c4WinCells(row, col, c4.turn);
  renderC4();
  if (winCells) {
    c4.over = true; playSound('win');
    var cells = $('c4Board').children;
    winCells.forEach(function(pos) { cells[pos[0] * 7 + pos[1]].classList.add('win'); });
    setTurn('🎉 ' + players[c4.turn].name + ' connects four!');
    showGameOver('🎉 ' + players[c4.turn].name + ' wins Connect Four!', c4.turn);
  } else if (c4.grid.every(function(rowArr) { return rowArr.every(function(v) { return v >= 0; }); })) {
    c4.over = true; setTurn("It's a draw!"); showGameOver("It's a draw — board full.", null);
  } else { c4.turn = 1 - c4.turn; setTurn(players[c4.turn].name + "'s turn"); }
}
function c4WinCells(row, col, p) {
  var dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (var d = 0; d < dirs.length; d++) {
    var cells = [[row, col]];
    [[1,1],[-1,-1]].forEach(function(s) {
      var r = row + s[0] * dirs[d][0], cc = col + s[1] * dirs[d][1];
      while (r >= 0 && r < 6 && cc >= 0 && cc < 7 && c4.grid[r][cc] === p) { cells.push([r, cc]); r += s[0] * dirs[d][0]; cc += s[1] * dirs[d][1]; }
    });
    if (cells.length >= 4) return cells.slice(0, 4);
  }
  return null;
}

/* ---------------- Dots and Boxes ---------------- */
var dots = null;
function startDots() {
  showGame('dots', '⬜ Dots & Boxes');
  var n = Math.max(2, Math.min(4, players.length));
  dots = { size: 4, turn: 0, nPlayers: n, over: false,
    h: [], v: [], boxes: [] };
  for (var i = 0; i <= 4; i++) dots.h.push(Array(4).fill(-1)); // 5 rows x 4 cols
  for (var i = 0; i < 4; i++) dots.v.push(Array(5).fill(-1));   // 4 rows x 5 cols
  for (var r = 0; r < 4; r++) dots.boxes.push(Array(4).fill(-1));
  renderDots();
  setTurn(players[0].name + "'s turn");
}
function renderDots() {
  var b = $('dotsBoard'); b.innerHTML = '';
  b.style.gridTemplateColumns = 'repeat(9, 34px)';
  b.style.gridTemplateRows = 'repeat(9, 34px)';
  for (var gr = 0; gr < 9; gr++) for (var gc = 0; gc < 9; gc++) (function(gr, gc) {
    var cell;
    if (gr % 2 === 0 && gc % 2 === 0) { cell = el('div', 'dots-cell'); cell.appendChild(el('span', 'dot')); }
    else if (gr % 2 === 0) { // horizontal edge: dot-row gr/2, box-col (gc-1)/2
      var hr = gr / 2, hc = (gc - 1) / 2, owner = dots.h[hr][hc];
      cell = el('div', 'dots-cell edge' + (owner >= 0 ? ' claimed' : ''));
      if (owner >= 0) cell.style.background = players[owner].color;
      cell.onclick = function() { dotsClaim('h', hr, hc); };
      if (owner < 0) { cell.tabIndex = 0; cell.setAttribute('role', 'button'); cell.setAttribute('aria-label', 'Claim this edge'); cell.onkeydown = function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dotsClaim('h', hr, hc); } }; }
    }
    else if (gc % 2 === 0) { // vertical edge
      var vr = (gr - 1) / 2, vc = gc / 2, owner2 = dots.v[vr][vc];
      cell = el('div', 'dots-cell edge' + (owner2 >= 0 ? ' claimed' : ''));
      if (owner2 >= 0) cell.style.background = players[owner2].color;
      cell.onclick = function() { dotsClaim('v', vr, vc); };
      if (owner2 < 0) { cell.tabIndex = 0; cell.setAttribute('role', 'button'); cell.setAttribute('aria-label', 'Claim this edge'); cell.onkeydown = function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dotsClaim('v', vr, vc); } }; }
    }
    else { // box
      var br = (gr - 1) / 2, bc = (gc - 1) / 2, bo = dots.boxes[br][bc];
      cell = el('div', 'dots-cell box');
      if (bo >= 0) { cell.style.background = players[bo].color + '55'; cell.textContent = players[bo].name.charAt(0).toUpperCase(); }
    }
    b.appendChild(cell);
  })(gr, gc);
}
function dotsClaim(kind, r, c) {
  if (dots.over) return;
  if (kind === 'h' && dots.h[r][c] >= 0) return;
  if (kind === 'v' && dots.v[r][c] >= 0) return;
  if (kind === 'h') dots.h[r][c] = dots.turn; else dots.v[r][c] = dots.turn;
  var claimed = 0;
  for (var br = 0; br < 4; br++) for (var bc = 0; bc < 4; bc++) {
    if (dots.boxes[br][bc] >= 0) continue;
    // box (br,bc): top h[br][bc], bottom h[br+1][bc], left v[br][bc], right v[br][bc+1]
    if (dots.h[br][bc] >= 0 && dots.h[br + 1][bc] >= 0 && dots.v[br][bc] >= 0 && dots.v[br][bc + 1] >= 0) {
      dots.boxes[br][bc] = dots.turn; claimed++;
    }
  }
  renderDots();
  if (dots.boxes.every(function(rowArr) { return rowArr.every(function(v) { return v >= 0; }); })) {
    dots.over = true; playSound('win');
    var counts = players.slice(0, dots.nPlayers).map(function() { return 0; });
    dots.boxes.forEach(function(rowArr) { rowArr.forEach(function(v) { counts[v]++; }); });
    var best = 0; for (var i = 1; i < counts.length; i++) if (counts[i] > counts[best]) best = i;
    var scoreText = players.slice(0, dots.nPlayers).map(function(p, i) { return p.name + ': ' + counts[i]; }).join(' · ');
    setTurn('🏆 ' + players[best].name + ' wins Dots & Boxes! (' + scoreText + ')');
    showGameOver('🏆 ' + players[best].name + ' wins Dots & Boxes! ' + scoreText, best);
  } else if (claimed > 0) {
    playSound('box');
    setTurn(players[dots.turn].name + ' completed a box — go again!');
    setMsg('Nice! ' + claimed + ' box(es) claimed. Same player goes again.');
  } else {
    playSound('claim');
    dots.turn = (dots.turn + 1) % dots.nPlayers;
    setTurn(players[dots.turn].name + "'s turn");
  }
}

/* ---------------- Wiring ---------------- */
document.querySelectorAll('.game-card').forEach(function(card) {
  card.addEventListener('click', function() {
    savePlayers();
    pendingGame = card.getAttribute('data-game');
    showHowTo(pendingGame, 'start');
  });
});
$('btnSavePlayers').onclick = function() { savePlayers(); $('saveNote').textContent = '✓ Players saved'; setTimeout(function() { $('saveNote').textContent = ''; }, 2000); };
$('btnResetScores').onclick = function() { wins = {}; try { localStorage.removeItem('partyPackWins'); } catch (e) {} renderScoreboard(); };
$('btnBack').onclick = showHome;
$('btnHome2').onclick = showHome;
$('btnPlayAgain').onclick = function() {
  if (currentGame === 'ttt') startTTT();
  else if (currentGame === 'c4') startC4();
  else if (currentGame === 'dots') startDots();
  else if (currentGame === 'ships') startShips();
  else if (currentGame === 'ludo') startLudo();
};
$('btnRestart').onclick = function() { $('btnPlayAgain').onclick(); };
/* How-to-play: a note before the game opens, with Skip & Play; also reopenable from the top bar */
var HOW_TO = {
  ttt: { title: '❌ Tic-Tac-Toe', text: 'Tap a square. First to 3 in a row wins the round.' },
  c4: { title: '🔴 Connect Four', text: 'Tap a column to drop your disc. First to connect 4 wins.' },
  dots: { title: '⬜ Dots & Boxes', text: 'Tap an edge to claim it. Complete a box to claim it — and go again!' },
  ships: { title: '🚢 Battleship', text: 'Place your ships: tap a square to place each ship, switching orientation when you need to. Then take turns shooting — a hit gives another shot. Sink the whole enemy fleet to win. Pass the phone between placements, and don\'t peek!' },
  ludo: { title: '🎲 Ludo', text: 'Roll, then tap one of your highlighted tokens to move it. Land on an enemy (not on a ⭐ safe square) to send them home. Get all 4 tokens to the centre to win. A 6, a capture, or finishing a token gives an extra turn.' }
};
var pendingGame = null;
function startGameByKey(g) {
  if (g === 'ttt') startTTT();
  else if (g === 'c4') startC4();
  else if (g === 'dots') startDots();
  else if (g === 'ships') startShips();
  else if (g === 'ludo') startLudo();
}
function showHowTo(game, mode) {
  $('howToTitle').textContent = HOW_TO[game].title;
  $('howToText').textContent = HOW_TO[game].text;
  $('btnHowToAction').textContent = mode === 'info' ? 'Close' : 'Skip & Play';
  $('btnHowToAction').onclick = function() {
    $('howToOverlay').classList.add('hidden');
    if (mode !== 'info' && pendingGame) startGameByKey(pendingGame);
  };
  $('howToOverlay').classList.remove('hidden');
}
$('btnHowTo').onclick = function() { if (currentGame) showHowTo(currentGame, 'info'); };
$('btnSound').onclick = function() { setMuted(!soundMuted); };
function updateFullscreenBtn() { var b = $('btnFullscreen'); if (b) b.textContent = document.fullscreenElement ? '⛶ Exit fullscreen' : '⛶ Fullscreen'; }
$('btnFullscreen').onclick = function() {
  try {
    if (document.fullscreenElement) { var p1 = document.exitFullscreen(); if (p1 && p1.catch) p1.catch(function() {}); }
    else { var p2 = document.documentElement.requestFullscreen(); if (p2 && p2.catch) p2.catch(function() {}); }
  } catch (e) {}
};
document.addEventListener('fullscreenchange', updateFullscreenBtn);
if (!document.fullscreenEnabled) $('btnFullscreen').style.display = 'none';
updateSoundButtons();
loadSaved();
renderScoreboard();
