# Party Pack — 5 Games, One Phone

A single-page web app for offline, pass-and-play games with friends.
No accounts, no server, no internet needed while playing (once loaded).

## Games
1. **Ludo** (2–4 players) — full board, capture on non-safe squares, home stretch,
   extra turn on a 6, a capture, or finishing a token. Simplified: no 3-sixes rule.
2. **Tic-Tac-Toe** (2 players) — first to 3 in a row wins the round.
3. **Connect Four** (2 players) — tap a column, first to connect 4 wins.
4. **Dots & Boxes** (2–4 players) — claim edges, complete a box to claim it and go again.
   Most boxes wins.
5. **Battleship** (2 players, hotseat) — place ships [Carrier 4, Cruiser 3, Destroyer 3,
   Patrol 2], with a "pass the phone, don't peek" screen between placements.
   A hit gives another shot. Sink the whole fleet to win.

## Scoreboard
Wins across all games are tracked on the home screen and saved in the browser
(localStorage), so a party champion emerges across games.

## How to play
- Open `index.html` in any phone browser, or host the folder as a static site
  (Vercel, GitHub Pages, Netlify — no build step, no backend).
- Enter 2–4 player names, tap Save players, pick a game.
- Pass the phone around. Battleship hides the board between placements.

## Offline
When hosted, a service worker (`sw.js`) caches the files so the app keeps
working offline after the first load.
