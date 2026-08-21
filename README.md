# 24 Card Game

A card-style 24-point puzzle game (Vue 3 + Vite, pure front-end, no backend). Immersive wooden-table + charcoal hand-drawn UI with **stack-and-combine** gameplay and **time-based scoring**.

## Run

```bash
npm install        # install dependencies
npm run dev        # dev server (http://localhost:5173)
npm run build      # production build → dist/
npm run preview    # preview production build
npm test           # run unit tests (Vitest)
```

## How to play

- The game deals 4 cards (values 1–10; a 10 may show as 10 / J / Q / K / JOKER, all worth 10), always guaranteed solvable to the target 24.
- **Difficulty**: Easy = integer cards solvable with + − × only; Medium = integer path (all intermediate values are integers); Hard = integer cards whose solution **requires fractional/decimal steps** (e.g. 8 ÷ (3 − 8 ÷ 3)).
- **Stack cards**: drag a card onto another; the dragged card stacks on top and stays overlapped.
- **Pick an operation**: tap the `+ − × ÷` buttons at the bottom; the result shows faintly below the stack (hand-written charcoal). You can switch operations to preview freely (order is fixed: **top card op bottom card**).
- Drag a third card onto a stack to commit its current value and form a new stack; when all 4 cards are in one stack and the result equals 24 you win (+score, auto-deal next hand).
- **Scoring**: the faster you solve a hand, the more points you earn — `Incredible! (<5s, +100) / Amazing! (<10s, +80) / Great job! (<20s, +60) / Good job! (<40s, +40) / Nice try! (≥40s, +20)`.
- `Undo` reverts the last stack; `Hint` suggests the first merge; `New Hand` / `Restart` reset.

## Tech notes

- `src/core/rational.js` — rational (fraction) arithmetic to avoid floating-point errors.
- `src/core/merge.js` — stack model: `makeStack`, `applyOp` (top op bottom), `groupIsSolved`, `formatGroupTree`.
- `src/core/solver.js` — subset-DP solver for any target (24/36/48/random), used for solvable dealing and hints.
- `src/core/scoring.js` — time-band scoring + praise tiers.
- `src/composables/useGame.js` — game state machine (deal/stack/operation preview/auto-settle/undo), provide/inject.
- Drag uses **Pointer Events** (mouse + touch unified); `CardTable` hit-tests per stack.
- Visuals: immersive single-screen layout, wooden table (CSS wood-grain gradients + feTurbulence noise + vignette) + charcoal/paper cards.

## Roadmap

- Phase 2: switchable targets 36 / 48 (solver and UI target are already parameterized).
- Phase 3: random-target mode (random target + random cards, validated solvable by the same solver).
- Later: 54/108-card physical deck (J/Q/K/jokers = 10), discard area, deck exhaustion, sound effects, card wear.

