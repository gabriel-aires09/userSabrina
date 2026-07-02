# Guideline: Making the Game Responsive (Mobile + Desktop)

This is a guide only — no source files were changed. Apply the changes manually in the files referenced below.

## Current state (why it isn't responsive today)

- [index.html](../index.html) already has `<meta name="viewport" content="width=device-width, initial-scale=1.0">`, which is good and required — keep it.
- [css/game.css](../css/game.css): `.game-container` is a `flex` row of `.game-area` (flexible) + `.story-panel` (**fixed** `width: 384px`). On a narrow phone screen, the story panel alone would eat the entire viewport width, squeezing the game area to nothing.
- `.player` has a **fixed** pixel size (`96px × 144px`), and [js/player.js](../js/player.js) `updatePlayerPosition()` offsets the sprite by hardcoded `48`/`72` (half of that fixed size) to center it on the player's `x`/`y`. If you scale the player down for small screens, this offset math must scale with it or the character will visually drift off its logical position.
- `.controls` is pinned with `position: absolute; top: 1rem; left: 1rem;` with no max-width — on very small screens it can overlap the player/scenario.
- `.menu-title` is `4rem` (~64px) and `.menu-subtitle` is `1.5rem`; on a phone (~375px wide) this wraps awkwardly and can overflow.
- Movement is keyboard-only ([js/game.js](../js/game.js) listens to `keydown`/`keyup` for WASD/arrows). **There is no touch input at all**, so the game is currently unplayable on mobile regardless of layout — this is the biggest gap, bigger than CSS.
- Boundary checks in `gameLoop()` already use `window.innerWidth` / `window.innerHeight` dynamically (good), but there's no `resize`/`orientationchange` listener, so if the player rotates their phone mid-game the bounds only update on the next move.

## Recommended changes, file by file

### 1. `css/game.css` — stacking layout on small screens
Add a breakpoint (suggest `max-width: 900px` or `768px`) that:
- Changes `.game-container` from `flex-direction: row` to `column` so `.story-panel` moves below (or is collapsed/hidden until a story triggers) instead of squeezing the game area.
- Gives `.story-panel` a responsive width (`width: 100%` on mobile instead of the fixed `384px`), with a capped `max-height` (e.g. `40vh`) since it will now stack under the game area.
- Scales `.player` down (e.g. `64px × 96px` on mobile) — see the JS note below about keeping the position offset in sync.
- Adds `max-width` / `font-size` clamps to `.controls` so the overlay box doesn't dominate a small screen (consider `clamp()` for font sizes, e.g. `font-size: clamp(0.65rem, 2vw, 0.875rem);`).

### 2. `css/menu.css` — scale text and spacing down
- Use `clamp()` for `.menu-title` (e.g. `font-size: clamp(2rem, 8vw, 4rem);`) and `.menu-subtitle` (`clamp(1rem, 4vw, 1.5rem)`), so both scale smoothly instead of needing many fixed breakpoints.
- Reduce `.menu-container` padding on narrow screens (a `max-width: 480px` media query lowering `padding: 2rem` to `1rem` is enough).
- `.menu-buttons` are already `flex-direction: column`, so the buttons themselves are already mobile-friendly — no change needed there.

### 3. `css/modal.css` — cap modal size on mobile
- `.modal-content` uses `max-width: 800px; max-height: 80vh;` which is already reasonable, but add a small-screen override so `padding: 2rem` becomes `1rem` and width uses `95vw` instead of relying only on `max-width`, to avoid edge-to-edge crowding.

### 4. `js/game.js` — add touch controls
This is the functional gap, not just styling. Options, roughly in order of effort:
- **Minimal**: add an on-screen D-pad (4–8 buttons) rendered only when a touch/mobile viewport is detected, wired to the same `gameState.keys[...]` flags that `keydown`/`keyup` already set — e.g. a button's `touchstart` sets `gameState.keys['arrowright'] = true` and `touchend` sets it back to `false`. This reuses all existing movement/collision logic untouched.
- **Alternative**: swipe/drag gesture detection on the `.game-area` translated into the same `gameState.keys` flags.
- Either way, add a `resize`/`orientationchange` listener that re-clamps `gameState.playerPos.x/y` into the new `window.innerWidth`/`innerHeight` bounds immediately, instead of waiting for the next keypress-driven `gameLoop()` tick.

### 5. `js/player.js` — keep sprite centering in sync with responsive size
- The `48` / `72` offsets in `updatePlayerPosition()` are half of the `.player` CSS size (`96/144`). If `.player` becomes responsive (media query or `clamp()`-based sizing), read the actual rendered size at runtime (e.g. `player.offsetWidth / 2`, `player.offsetHeight / 2`) instead of hardcoded numbers, so the offset always matches whatever CSS currently applies.

## Suggested breakpoint convention
Pick one consistent breakpoint across all three CSS files to avoid mismatched behavior (e.g. layout stacks at `768px` in `game.css` but text doesn't shrink until `600px` in `menu.css`). A common mobile-first convention:
- `≤ 480px`: phones
- `481px – 768px`: small tablets / large phones landscape
- `> 768px`: desktop/tablet (current fixed layout)

## Testing checklist once changes are made
- [ ] Portrait phone (~375×667): menu readable, no horizontal scroll, story panel doesn't crowd out the game area.
- [ ] Landscape phone (~667×375): game area + story panel both usable.
- [ ] Touch controls move the character and trigger the same collision/story logic as keyboard.
- [ ] Rotating the device mid-game keeps the player within bounds.
- [ ] Desktop (existing keyboard flow) still works unchanged.
