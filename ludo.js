/* Ludo — 2-4 players, classic 15x15 board, simplified rules (no 3-sixes rule).
   Performance note: the board and token elements are built ONCE per game.
   Rolls and moves only move existing token elements between cells — the old
   version rebuilt all 225 cells (plus a 52-square scan per cell) on every
   roll, which is what made the board flash and stutter on phones. */
var ludo = null;
var LUDO_PATH = [
  [6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],
  [1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],
  [8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],
  [13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0]
];
var LUDO_START = [0, 13, 26, 39]; // red, green, yellow, blue
var LUDO_HOME = [
  [[7,1],[7,2],[7,3],[7,4],[7,5]],
  [[1,7],[2,7],[3,7],[4,7],[5,7]],
  [[7,13],[7,12],[7,11],[7,10],[7,9]],
  [[13,7],[12,7],[11,7],[10,7],[9,7]]
];
var LUDO_YARD = [
  [[1,1],[1,4],[4,1],[4,4]],
  [[1,10],[1,13],[4,10],[4,13]],
  [[10,10],[10,13],[13,10],[13,13]],
  [[10,1],[10,4],[13,1],[13,4]]
];
var LUDO_SAFE = [0, 8, 13, 21, 26, 34, 39, 47];
var LUDO_DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

function startLudo() {
  showGame('ludo', '🎲 Ludo');
  var n = Math.max(2, Math.min(4, players.length));
  ludo = { nPlayers: n, turn: 0, dice: 0, rolled: false, over: false, tokens: [], cells: {}, tokenEls: [] };
  for (var p = 0; p < n; p++) ludo.tokens.push([-1, -1, -1, -1]);
  $('ludoDice').textContent = '🎲';
  $('ludoRollInfo').textContent = '';
  buildLudoBoard();
  renderLudoTokens(null);
  setTurn(players[0].name + "'s turn — roll the dice!");
}
function ludoTokenCell(p, progress) {
  if (progress <= 51) return LUDO_PATH[(LUDO_START[p] + progress) % 52];
  if (progress <= 56) return LUDO_HOME[p][progress - 52];
  return [7, 7]; // finished, centre
}
function ludoMovable(p, progress, dice) {
  if (progress === -1) return dice === 6;
  if (progress === 57) return false;
  return progress + dice <= 57;
}
function buildLudoBoard() {
  var board = $('ludoBoard'); board.innerHTML = '';
  ludo.cells = {}; ludo.tokenEls = [];
  for (var r = 0; r < 15; r++) for (var c = 0; c < 15; c++) {
    var cell = el('div', 'ludo-cell');
    var bg = '#f2f2f2';
    if (r <= 5 && c <= 5) bg = PLAYER_COLORS[0];
    else if (r <= 5 && c >= 9) bg = PLAYER_COLORS[1];
    else if (r >= 9 && c >= 9) bg = PLAYER_COLORS[2];
    else if (r >= 9 && c <= 5) bg = PLAYER_COLORS[3];
    else if (r >= 6 && r <= 8 && c >= 6 && c <= 8) bg = '#d4af37';
    else {
      if (r === 7 && c >= 1 && c <= 5) bg = PLAYER_COLORS[0];
      else if (c === 7 && r >= 1 && r <= 5) bg = PLAYER_COLORS[1];
      else if (r === 7 && c >= 9 && c <= 13) bg = PLAYER_COLORS[2];
      else if (c === 7 && r >= 9 && r <= 13) bg = PLAYER_COLORS[3];
    }
    cell.style.background = bg;
    var pathIdx = -1;
    for (var i = 0; i < 52; i++) if (LUDO_PATH[i][0] === r && LUDO_PATH[i][1] === c) pathIdx = i;
    if (pathIdx >= 0 && LUDO_SAFE.indexOf(pathIdx) >= 0) cell.style.outline = '2px solid #ffd700';
    for (var p = 0; p < 4; p++) if (LUDO_PATH[LUDO_START[p]][0] === r && LUDO_PATH[LUDO_START[p]][1] === c) cell.style.background = PLAYER_COLORS[p];
    ludo.cells[r + ',' + c] = cell;
    board.appendChild(cell);
  }
  for (var p = 0; p < ludo.nPlayers; p++) {
    ludo.tokenEls.push([]);
    for (var t = 0; t < 4; t++) {
      var tok = el('div', 'ludo-token', String(t + 1));
      tok.style.background = players[p].color;
      ludo.tokenEls[p].push(tok);
    }
  }
}
function renderLudoTokens(movedKey) {
  for (var p = 0; p < ludo.nPlayers; p++) {
    for (var t = 0; t < 4; t++) (function(p, t) {
      var progress = ludo.tokens[p][t];
      var pos = (progress === -1) ? LUDO_YARD[p][t] : ludoTokenCell(p, progress);
      var tok = ludo.tokenEls[p][t];
      var target = ludo.cells[pos[0] + ',' + pos[1]];
      if (tok.parentNode !== target) target.appendChild(tok);
      if (p === ludo.turn && ludo.rolled && !ludo.over && ludoMovable(p, progress, ludo.dice)) {
        tok.classList.add('movable');
        tok.onclick = function() { ludoMove(t); };
      } else {
        tok.classList.remove('movable');
        tok.onclick = null;
      }
      if (movedKey === p + '-' + t) {
        tok.classList.remove('token-moved'); void tok.offsetWidth; tok.classList.add('token-moved');
      }
    })(p, t);
  }
}
function ludoMove(t) {
  if (!ludo.rolled || ludo.over) return;
  var p = ludo.turn, progress = ludo.tokens[p][t];
  if (!ludoMovable(p, progress, ludo.dice)) return;
  var next = (progress === -1) ? 0 : progress + ludo.dice;
  var captured = false;
  if (next <= 51) {
    var idx = (LUDO_START[p] + next) % 52;
    if (LUDO_SAFE.indexOf(idx) === -1) {
      for (var op = 0; op < ludo.nPlayers; op++) {
        if (op === p) continue;
        for (var ot = 0; ot < 4; ot++) {
          var oprog = ludo.tokens[op][ot];
          if (oprog >= 0 && oprog <= 51 && (LUDO_START[op] + oprog) % 52 === idx) {
            ludo.tokens[op][ot] = -1; captured = true;
          }
        }
      }
    }
  }
  ludo.tokens[p][t] = next;
  ludo.rolled = false;
  $('ludoRollInfo').textContent = '';
  if (ludo.tokens[p].every(function(v) { return v === 57; })) {
    ludo.over = true;
    renderLudoTokens(null);
    setTurn('🎉 ' + players[p].name + ' wins Ludo!');
    showGameOver('🎉 ' + players[p].name + ' wins Ludo — all 4 tokens home!', p);
    return;
  }
  var extra = (ludo.dice === 6) || captured || next === 57;
  if (!extra) ludo.turn = (ludo.turn + 1) % ludo.nPlayers;
  renderLudoTokens(p + '-' + t);
  setTurn(players[ludo.turn].name + "'s turn — roll the dice!" + (captured ? ' (Captured! Extra turn.)' : ''));
  if (captured) setMsg('💥 ' + players[p].name + ' captured a token! Extra turn.');
  else setMsg('');
}
function ludoRollDice() {
  if (currentGame !== 'ludo' || ludo.over || ludo.rolled) return;
  ludo.dice = 1 + Math.floor(Math.random() * 6);
  ludo.rolled = true;
  $('ludoDice').textContent = LUDO_DICE_FACES[ludo.dice - 1];
  var diceEl = $('ludoDice');
  diceEl.classList.remove('dice-pop'); void diceEl.offsetWidth; diceEl.classList.add('dice-pop');
  $('ludoRollInfo').textContent = 'Rolled a ' + ludo.dice;
  var p = ludo.turn;
  var any = ludo.tokens[p].some(function(pr) { return ludoMovable(p, pr, ludo.dice); });
  renderLudoTokens(null);
  if (!any) {
    setMsg('No moves possible — turn passes to the next player.');
    ludo.rolled = false;
    ludo.turn = (ludo.turn + 1) % ludo.nPlayers;
    setTurn(players[ludo.turn].name + "'s turn — roll the dice!");
    renderLudoTokens(null);
  } else {
    setTurn(players[p].name + ' rolled ' + ludo.dice + ' — tap a highlighted token!');
    setMsg('');
  }
}
// Both the dice itself and the Roll button roll — tapping the dice is a first-class control.
$('ludoRoll').onclick = ludoRollDice;
$('ludoDice').onclick = ludoRollDice;
$('ludoDice').addEventListener('keydown', function(e) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ludoRollDice(); }
});
