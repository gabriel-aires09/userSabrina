# Guideline: Keeping Game Elements (Character, Items, Background) Confined to the Game Area

This is a guide only — no source files were changed. Apply the changes manually in the files referenced below.

## Current structure (for context)

In [index.html](../index.html), the layout is:

```
.game-container (flex row)
├── .game-area           ← background image, obstacles, player, touch controls
│   ├── .controls
│   ├── #obstacles        (items: box, gift, star…)
│   ├── .player            (character)
│   └── .touch-controls
└── .story-panel          ← user-story text (sibling, not a child of .game-area)
```

`#obstacles` and `.player` are already DOM **children** of `.game-area`, and `.game-area` has `position: relative` ([css/game.css](../css/game.css)), so items and the character are positioned relative to the game area, not the whole page. The background image is also applied directly to `.game-area` via `background-image`, so it's naturally confined to that box already. Structurally, this part is correct.

## The actual leak: movement bounds, not the DOM

The problem is that **how far the character/items are allowed to move** is computed from the wrong reference box. In [js/game.js](../js/game.js), `gameLoop()` clamps position like this:

```js
newX = Math.min(window.innerWidth - 100, newX);   // moveRight
newY = Math.min(window.innerHeight - 80, newY);   // moveDown
```

These clamps use `window.innerWidth` / `window.innerHeight` — the size of the **entire browser viewport**, including the space occupied by `.story-panel`. But `.game-area` is only `flex: 1` inside `.game-container`, meaning its actual width is `window.innerWidth - storyPanelWidth` (384px on desktop, or less/stacked on the mobile layout added in `RESPONSIVE_GUIDE.md`).

Because the clamp doesn't know about `.story-panel`'s width, the character is currently allowed to walk **past the right edge of `.game-area` and visually on top of `.story-panel`**, since:
- `.player` is `position: absolute` with no `overflow: hidden` on its parent (`.game-area`) to clip it, so nothing stops it from rendering outside the game-area's box once its `left`/`top` exceeds that box.
- The same applies to any obstacle whose `x`/`y` in [js/data/obstacles.js](../js/data/obstacles.js) is close to or beyond the game-area's real width (currently `500`, `550`, `800`, which can exceed a narrow `.game-area` on smaller/mobile viewports).

This is the "intrusion" you're seeing: game elements aren't sandboxed by their real container size — they're sandboxed by the *whole window* size, which is bigger than `.game-area` whenever the story panel takes up space.

## Recommended changes, file by file

### 1. `css/game.css` — hard visual clip as a safety net
Add `overflow: hidden` to `.game-area`. Even if a future bug lets `x`/`y` go out of bounds again, nothing will visually render past the game area's edges into the story panel:

```css
.game-area {
    flex: 1;
    position: relative;
    overflow: hidden;   /* add this line */
    background-image: url('../assets/background/scenario.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
}
```
This is a **visual safety net**, not the fix for movement logic — pair it with the JS change below so the character actually *stops* at the edge instead of just getting invisibly clipped while still being "logically" past it (which would look like the character freezing mid-air at the game-area border).

### 2. `js/game.js` — clamp against the game-area's real size, not the window

**Status: ✅ Implemented.** Read the actual rendered box of `.game-area` and clamp against that instead of `window.innerWidth`/`innerHeight`.

#### 2a. Cache the `.game-area` reference once — line 16

**Before:**
```js
let gameInitialized = false;
```

**After:**
```js
let gameInitialized = false;
const gameArea = document.querySelector('.game-area');
```

#### 2b. `gameLoop()` — compute bounds once per frame, clamp against it — lines 137–182

**Before:**
```js
function gameLoop() {
    const speed = 3;
    let newX = gameState.playerPos.x;
    let newY = gameState.playerPos.y;
    let action = '';
    let scenarios = [];
    let moving = false;
    let newDirection = gameState.direction;

    if (gameState.keys['arrowleft'] || gameState.keys['a']) {
        newX -= speed;
        action = 'moveLeft';
        newDirection = 'left';
        moving = true;
        scenarios = [gameStories.moveLeft.scenarios[0]];
        newX = Math.max(0, newX); // antes: 60 → agora pode ir até o limite esquerdo da tela
    }

    if (gameState.keys['arrowright'] || gameState.keys['d']) {
        newX += speed;
        action = 'moveRight';
        newDirection = 'right';
        moving = true;
        scenarios = [gameStories.moveRight.scenarios[0]];
        newX = Math.min(window.innerWidth - 100, newX); // antes: -460 → permite andar mais à direita
    }

    if (gameState.keys['arrowup'] || gameState.keys['w']) {
        newY -= speed;
        action = 'moveUp';
        newDirection = 'up';
        moving = true;
        scenarios = [gameStories.moveUp.scenarios[0]];
        newY = Math.max(0, newY); // antes: 320 → permite subir até o topo
    }

    if (gameState.keys['arrowdown'] || gameState.keys['s']) {
        newY += speed;
        action = 'moveDown';
        newDirection = 'down';
        moving = true;
        scenarios = [gameStories.moveDown.scenarios[0]];
        newY = Math.min(window.innerHeight - 80, newY); 
        // antes: 520 → agora Sabrina pode ir até o final da tela
    }
```

**After:**
```js
function gameLoop() {
    const speed = 3;
    const bounds = gameArea.getBoundingClientRect();
    let newX = gameState.playerPos.x;
    let newY = gameState.playerPos.y;
    let action = '';
    let scenarios = [];
    let moving = false;
    let newDirection = gameState.direction;

    if (gameState.keys['arrowleft'] || gameState.keys['a']) {
        newX -= speed;
        action = 'moveLeft';
        newDirection = 'left';
        moving = true;
        scenarios = [gameStories.moveLeft.scenarios[0]];
        newX = Math.max(0, newX); // antes: 60 → agora pode ir até o limite esquerdo da .game-area
    }

    if (gameState.keys['arrowright'] || gameState.keys['d']) {
        newX += speed;
        action = 'moveRight';
        newDirection = 'right';
        moving = true;
        scenarios = [gameStories.moveRight.scenarios[0]];
        newX = Math.min(bounds.width - 100, newX); // antes: window.innerWidth - 100 → agora respeita a largura real da .game-area
    }

    if (gameState.keys['arrowup'] || gameState.keys['w']) {
        newY -= speed;
        action = 'moveUp';
        newDirection = 'up';
        moving = true;
        scenarios = [gameStories.moveUp.scenarios[0]];
        newY = Math.max(0, newY); // antes: 320 → permite subir até o topo da .game-area
    }

    if (gameState.keys['arrowdown'] || gameState.keys['s']) {
        newY += speed;
        action = 'moveDown';
        newDirection = 'down';
        moving = true;
        scenarios = [gameStories.moveDown.scenarios[0]];
        newY = Math.min(bounds.height - 80, newY);
        // antes: window.innerHeight - 80 → agora respeita a altura real da .game-area
    }
```

| Line | Before | After |
|---|---|---|
| 139 (new) | *(n/a)* | `const bounds = gameArea.getBoundingClientRect();` — computed once per `gameLoop()` tick |
| 161 (moveRight) | `newX = Math.min(window.innerWidth - 100, newX);` | `newX = Math.min(bounds.width - 100, newX);` |
| 179 (moveDown) | `newY = Math.min(window.innerHeight - 80, newY);` | `newY = Math.min(bounds.height - 80, newY);` |

`moveLeft`/`moveUp` (`Math.max(0, ...)`) didn't need a change — `0` is already the left/top edge of `.game-area` itself, not the window.

#### 2c. `resize` listener — clamp against fresh bounds and reflow obstacles

**Before:**
```js
window.addEventListener('resize', () => {
    gameState.playerPos.x = Math.min(window.innerWidth - 100, gameState.playerPos.x);
    gameState.playerPos.y = Math.min(window.innerHeight - 80, gameState.playerPos.y);
    updatePlayerPosition(gameState.playerPos.x, gameState.playerPos.y);
    renderObstacles();
});
```

**After:**
```js
window.addEventListener('resize', () => {
    const bounds = gameArea.getBoundingClientRect();
    gameState.playerPos.x = Math.max(0, Math.min(bounds.width - 100, gameState.playerPos.x));
    gameState.playerPos.y = Math.max(0, Math.min(bounds.height - 80, gameState.playerPos.y));
    updatePlayerPosition(gameState.playerPos.x, gameState.playerPos.y);
    renderObstacles();
});
```

This also adds a lower clamp (`Math.max(0, ...)`) that wasn't there before, so shrinking the window can't push the player to a negative (off-screen) position either.

Notes:
- `getBoundingClientRect()` reflects the *current* rendered size, so it automatically adapts to the desktop layout (game-area narrowed by the 384px story panel) and the mobile stacked layout (game-area height reduced to `55vh`) from `RESPONSIVE_GUIDE.md`, without hardcoding either case.
- `gameArea` is cached once at module scope (2a) rather than queried every frame inside `gameLoop()`.
- `renderObstacles()` (from the `js/data/obstacles.js` guidance below) already re-clamps obstacle positions against the same `.game-area` bounds, so calling it from `resize` keeps items correctly placed too.

### 3. `js/data/obstacles.js` — keep item coordinates inside the game area
Since obstacle `x`/`y`/`width`/`height` are static values, an obstacle placed near the right/bottom edge (e.g. `{ x: 800, y: 440, ... }`) can end up outside a narrowed `.game-area` on smaller screens. Two options:
- **Simplest**: keep obstacle coordinates comfortably inside the smallest expected `.game-area` width (e.g. design for a ~375–600px wide game area, since that's the realistic minimum once the story panel or mobile stacking is accounted for).
- **More robust**: in `renderObstacles()` ([js/game.js](../js/game.js)), skip or reposition obstacles whose `x + width` exceeds the current `.game-area` bounds before rendering, similar to the player clamp above.

## Why both the CSS and JS changes matter together
- CSS `overflow: hidden` guarantees items/character are never *visible* outside `.game-area`, even under an edge case (e.g. a resize event firing between frames).
- JS bounds-clamping against `.game-area`'s real size guarantees the character *logically* stops at the edge, so it doesn't look like it's "hitting an invisible wall" mid-game-area or getting silently clipped while the game still thinks it's walking further right.

Together, the story panel stays purely for narrative content, and all gameplay visuals (background, items, character) are provably confined to `.game-area`, on both desktop and the mobile stacked layout.

## Testing checklist once changes are made
- [ ] Walk the character to the far right/bottom repeatedly — it should stop exactly at the visible edge of `.game-area`, never overlapping `.story-panel`.
- [ ] Resize the browser window narrower (simulating a smaller desktop) — character should never end up outside the now-smaller `.game-area`.
- [ ] On the mobile stacked layout, walk down — character should stop before the `.game-area`/`.story-panel` seam, not slide under it.
- [ ] Obstacles near the edges (`box`, `gift`, `star` in `obstacles.js`) should remain fully visible inside `.game-area` at both desktop and mobile widths.
