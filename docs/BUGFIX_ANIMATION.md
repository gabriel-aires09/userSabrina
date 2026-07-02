# Bug: Character stuck on a single frame (walk & idle)

## Symptom
- Character stays static when idle.
- When walking, only the **first frame** of the sprite array ever shows — animation never advances.

## Root cause
The bug is in [js/sprites.js](js/sprites.js) inside `loadSprites()`, specifically this block:

```js
const img = new Image();
img.src = path;                     // (1) src is assigned immediately

await new Promise((resolve, reject) => {
    img.onload = () => {            // (2) handlers attached AFTER src was set
        newSprites[type][dir].push(path);
        resolve();
    };
    img.onerror = () => reject();
    setTimeout(reject, 100);        // (3) very short, unconditional timeout
});
```

Two problems combine to produce the exact symptom described:

1. **Race condition (line order):** `img.src` is set *before* `onload`/`onerror` are attached. If the image is already cached by the browser (or loads fast enough), the `load` event can fire before the handler exists to catch it. That load event is lost forever — `resolve()` never runs.
2. **Unconditional 100 ms timeout:** Because of (1), the promise frequently falls through to `setTimeout(reject, 100)`, which rejects the promise even though the image loaded successfully.

In `loadSprites()`, a rejection is caught here:

```js
} catch (error) {
    break;   // stops loading further frames for this direction/type
}
```

`break` exits the `for (let i = 1; i <= 10; i++)` loop **for that direction**, so as soon as frame `2.png` (or any frame after the first) hits the race/timeout, the loop stops and `newSprites[type][dir]` ends up with only **1 entry** (frame `1.png`), even though [assets/sabrina/walk-right/](assets/sabrina/walk-right/) actually has 7+ frames on disk.

This is confirmed by [js/player.js](js/player.js):

```js
const frame = gameState.currentFrame % sprites.length;
```

If `sprites.length === 1`, `frame` is always `0` no matter how much `currentFrame` increments in [js/game.js](js/game.js) (`animateFrames()`), so the same single `<img>` is re-rendered every tick — which is exactly the "static" behavior observed, for both `idle` and `walk` states (the loader has the same bug for all 8 folders).

## Why it looks intermittent
Because the bug depends on image load timing (cache state, disk/network speed), the exact frame count that survives can vary between page loads — sometimes 1 frame gets through, which matches "it seems to trigger only the first frame of the array and stop."

## Why this shows up specifically on GitHub Pages
Locally (e.g. opening the file straight from disk or via a local dev server), images load from disk in a couple of milliseconds, so the race in `loadSprites()` may go unnoticed most of the time. On **GitHub Pages** every `assets/sabrina/.../N.png` is fetched over a real network (CDN + TLS + possible cold cache), which routinely takes longer than the hard-coded `setTimeout(reject, 100)`. That means:
- Frame `1.png` for a given direction often loads fast enough (or is the first request, sometimes primed by preloading/caching) to squeak in before the 100ms timeout.
- Frame `2.png` onward is much more likely to still be in flight when the timeout fires, so the promise rejects, `break` fires, and `newSprites[type][dir]` is left with just that first frame.

This is why the bug is consistently reproducible on the deployed GitHub Pages site (higher, more variable network latency) even if it's intermittent or invisible when running locally — the 100ms window is the culprit either way, GitHub Pages just makes it far more likely to be hit on nearly every load.

## Fix

Attach the `onload`/`onerror` handlers **before** setting `img.src`, and remove the arbitrary timeout so a real (slow) load isn't treated as a failure.

### File: `js/sprites.js` — lines 15–32

**Before:**
```js
            for (let i = 1; i <= 10; i++) {
                const path = `assets/sabrina/${folderPath}/${i}.png`;
                try {
                    const img = new Image();
                    img.src = path;
                    
                    await new Promise((resolve, reject) => {
                        img.onload = () => {
                            newSprites[type][dir].push(path);
                            resolve();
                        };
                        img.onerror = () => reject();
                        setTimeout(reject, 100);
                    });
                } catch (error) {
                    break;
                }
            }
```

**After:**
```js
            for (let i = 1; i <= 10; i++) {
                const path = `assets/sabrina/${folderPath}/${i}.png`;
                const img = new Image();

                const loaded = await new Promise((resolve) => {
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);
                    img.src = path;
                });

                if (!loaded) break;
                newSprites[type][dir].push(path);
            }
```

### Line-by-line diff

| Line(s) | Before | After |
|---|---|---|
| 17 | `try {` | *(removed — no longer needed, no more `reject`/`catch`)* |
| 18 | `const img = new Image();` | `const img = new Image();` *(unchanged, just no longer inside `try`)* |
| 19 | `img.src = path;` | *(moved — now set last, inside the promise, after handlers)* |
| 20 | *(blank line)* | *(removed)* |
| 21 | `await new Promise((resolve, reject) => {` | `const loaded = await new Promise((resolve) => {` — drop the `reject` param, capture the result |
| 22–25 | `img.onload = () => { newSprites[type][dir].push(path); resolve(); };` | `img.onload = () => resolve(true);` — no longer pushes to the array here |
| 26 | `img.onerror = () => reject();` | `img.onerror = () => resolve(false);` — resolve with `false` instead of rejecting |
| 27 | `setTimeout(reject, 100);` | *(deleted — this line is the root cause and is removed entirely)* |
| — | *(n/a)* | `img.src = path;` — **new**: added here, as the last statement inside the executor, so it runs only after both handlers are already attached |
| 28 | `});` | `});` *(unchanged)* |
| 29 | `} catch (error) {` | *(removed)* |
| 30 | `break;` | `if (!loaded) break;` — moved out of the `catch`, now a plain `if` right after the `await` |
| 31 | `}` | *(removed, was closing the `catch`)* |
| — | *(n/a)* | `newSprites[type][dir].push(path);` — **new**: pushing the frame is now done here, only once we know `loaded === true` |
| 32 | `}` | `}` *(closes the `for` loop, unchanged)* |

### What to manually verify after editing
1. `img.src = path;` must be the **last line inside** the `new Promise((resolve) => { ... })` executor — not before it, and not outside the promise.
2. There should be no more `try`/`catch`/`reject` left in this block — only `resolve(true)` / `resolve(false)`.
3. `newSprites[type][dir].push(path);` should only appear **once**, after the `if (!loaded) break;` line — not inside `onload` anymore.

No changes are needed in [js/player.js](js/player.js) or [js/game.js](js/game.js) — their frame-cycling logic (`currentFrame % sprites.length`, `animateFrames()`) is correct; it only misbehaves because `sprites.length` is wrongly truncated to `1` by the loader bug above.
