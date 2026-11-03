/* Battleship — hotseat, 2 players, 8x8 grid, ships [4,3,3,2] */
var ships = null;
var SHIP_DEFS = [
  { name: 'Carrier', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Destroyer', size: 3 },
  { name: 'Patrol Boat', size: 2 }
];
function startShips() {
  showGame('ships', '🚢 Battleship');
  ships = { phase: 'place', placer: 0, shipIdx: 0, horizontal: true,
    boards: [emptyShipBoard(), emptyShipBoard()], shots: [emptyShotBoard(), emptyShotBoard()],
    turn: 0, over: false };
  renderShips();
}
function emptyShipBoard() { var g = []; for (var i = 0; i < 8; i++) g.push(Array(8).fill(0)); return g; }
function emptyShotBoard() { var g = []; for (var i = 0; i < 8; i++) g.push(Array(8).fill('')); return g; }

function renderShips() {
  var controls = $('shipsControls'); controls.innerHTML = '';
  var hint = $('shipsHint');
  if (ships.phase === 'hide') {
    setTurn('🙈 Pass the phone!');
    setMsg('');
    hint.textContent = 'The next player is about to place ships. Everyone else, look away!';
    var btn = el('button', 'btn gold', "I'm " + players[ships.placer].name + ' — show my board');
    btn.onclick = function() { ships.phase = 'place'; renderShips(); };
    controls.appendChild(btn);
    $('shipsBoard').innerHTML = '';
    return;
  }
  if (ships.phase === 'place') {
    var p = players[ships.placer], def = SHIP_DEFS[ships.shipIdx];
    setTurn('🚢 ' + p.name + ', place your ships');
    setMsg('Placing: ' + def.name + ' (' + def.size + ' squares). Tap a square to place it.');
    hint.textContent = 'Ships cannot overlap or go off the board. A hit gives an extra turn in battle.';
    var orient = el('button', 'btn ghost', ships.horizontal ? '↔ Horizontal' : '↕ Vertical');
    orient.onclick = function() { ships.horizontal = !ships.horizontal; renderShips(); };
    controls.appendChild(orient);
    var remaining = el('span', 'hint', 'Ships left: ' + SHIP_DEFS.slice(ships.shipIdx).map(function(s) { return s.name + ' (' + s.size + ')'; }).join(', '));
    controls.appendChild(remaining);
    renderShipGrid(ships.boards[ships.placer], true);
    return;
  }
  // battle phase
  var shooter = players[ships.turn], target = 1 - ships.turn;
  setTurn('🎯 ' + shooter.name + ', take your shot at ' + players[target].name);
  setMsg('🔴 = hit, ⚪ = miss. Sink all enemy ships to win. A hit gives another shot.');
  hint.textContent = 'Your remaining ships: ' + shipsRemaining(target, ships.turn) + ' squares of ' + players[target].name + ' still afloat (your ships: ' + shipsRemaining(ships.turn, target) + ' squares left).';
  renderShipGrid(ships.shots[ships.turn], false);
}
function shipsRemaining(ownerIdx, viewerIdx) {
  var count = 0;
  for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
    if (ships.boards[ownerIdx][r][c] === 1 && ships.shots[viewerIdx][r][c] !== 'hit') count++;
  }
  return count;
}
function renderShipGrid(grid, isPlacement) {
  var b = $('shipsBoard'); b.innerHTML = '';
  b.style.gridTemplateColumns = 'repeat(8, 1fr)';
  for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) (function(r, c) {
    var cell = el('div', 'ship-cell');
    cell.tabIndex = 0; cell.setAttribute('role', 'button');
    if (isPlacement) {
      if (grid[r][c] === 1) { cell.style.background = players[ships.placer].color; cell.textContent = '🚢'; }
      cell.setAttribute('aria-label', 'Place ship here');
      cell.onclick = function() { placeShip(r, c); };
      cell.onkeydown = function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); placeShip(r, c); } };
    } else {
      var s = grid[r][c];
      if (s === 'hit') { cell.style.background = '#e74c3c'; cell.textContent = '💥'; }
      else if (s === 'miss') { cell.style.background = '#555'; cell.textContent = '⚪'; }
      cell.setAttribute('aria-label', 'Shoot this square');
      cell.onclick = function() { fireShot(r, c); };
      cell.onkeydown = function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fireShot(r, c); } };
    }
    b.appendChild(cell);
  })(r, c);
}
function placeShip(r, c) {
  if (ships.phase !== 'place') return;
  var def = SHIP_DEFS[ships.shipIdx], board = ships.boards[ships.placer];
  var cells = [];
  for (var i = 0; i < def.size; i++) {
    var rr = ships.horizontal ? r : r + i, cc = ships.horizontal ? c + i : c;
    if (rr > 7 || cc > 7 || board[rr][cc] === 1) { setMsg('Does not fit there — try another square or switch orientation.'); return; }
    cells.push([rr, cc]);
  }
  cells.forEach(function(pos) { board[pos[0]][pos[1]] = 1; });
  setMsg('');
  ships.shipIdx++;
  if (ships.shipIdx >= SHIP_DEFS.length) {
    if (ships.placer === 0) { ships.placer = 1; ships.shipIdx = 0; ships.phase = 'hide'; }
    else { ships.phase = 'battle'; ships.turn = 0; }
  }
  renderShips();
}
function fireShot(r, c) {
  if (ships.phase !== 'battle' || ships.over) return;
  var shooter = ships.turn, target = 1 - shooter;
  if (ships.shots[shooter][r][c]) { setMsg('You already shot there — pick another square.'); return; }
  var hit = ships.boards[target][r][c] === 1;
  ships.shots[shooter][r][c] = hit ? 'hit' : 'miss';
  var sunk = hit && shipsRemaining(target, shooter) === 0;
  if (sunk) {
    ships.over = true;
    renderShips();
    setTurn('🎉 ' + players[shooter].name + ' sinks the fleet!');
    showGameOver('🎉 ' + players[shooter].name + ' wins Battleship — the whole enemy fleet is sunk!', shooter);
  } else if (hit) {
    renderShips();
    setMsg('💥 Hit! ' + players[shooter].name + ' shoots again.');
  } else {
    ships.turn = target;
    renderShips();
  }
}
