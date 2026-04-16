# Build kongli.sh, step by step

A hands-on tutorial that walks from "display one Hangul syllable in a browser"
all the way to the app you see on [kongli.sh](https://kongli.sh): 11,172
syllables, jamo decomposition, URL deep-linking, auto-scroll, view transitions,
bookmarks, offline support, and vibrant color themes.

This is for people who already write a little JavaScript/TypeScript and want to
see how a small static web app grows into something that actually feels good to
use. Each chapter adds **one** concept. Code snippets are complete enough to
paste in, but the finished source is right next to you in this repo — compare
whenever you're stuck.

**Conventions**

- `bun` is the runtime + bundler + test runner. You could swap in Node + Vite +
  Jest and the lessons still apply.
- File paths are relative to the project root.
- "Current" means the shipped version in this repo; "ours" means what we've
  written so far in the tutorial.

---

## Chapter 0 — What are we building?

One-page app. Scroll through every precomposed Korean syllable in Unicode —
there are exactly **11,172** of them, from `가` (U+AC00) to `힣` (U+D7A3). For
each one we show:

- the syllable itself, big and centered,
- its Unicode code point and UTF-8/16/32 bytes,
- its **jamo decomposition**: initial (초성), vowel (중성), optional trailing
  (종성),
- common example words that use it.

No backend, no database, no accounts. It's just math.

You don't need to speak Korean. The interesting parts are Unicode, state, input,
and UX.

---

## Chapter 1 — "Hello, 가"

Our first version is a single HTML file:

```html
<!-- public/index.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>kongli</title>
    <style>
      body {
        display: grid;
        place-items: center;
        height: 100vh;
        margin: 0;
      }
      .glyph {
        font-size: 40vmin;
      }
    </style>
  </head>
  <body>
    <div class="glyph">가</div>
  </body>
</html>
```

Open it in a browser. Done. This is our spec: one huge character, centered, on
an empty page.

Everything from here on is making that same thing _better_: more syllables,
keyboard navigation, deep-linking, offline caching, eight themes, etc. If you
never add anything beyond this chapter, you have a working web page.

**Lesson:** always start from something that works, however small.

---

## Chapter 2 — `bun init` and a real project

Install [Bun](https://bun.sh), then:

```bash
mkdir kongli && cd kongli
bun init -y
```

You now have a `package.json` and can run `bun run <script>`. Add a `public/`
folder and paste in the HTML from Chapter 1.

**Scripts** are just named shell commands. Our shipped `package.json` has:

```json
{
  "scripts": {
    "dev": "bun run dev.ts",
    "build": "bun run build.ts",
    "test": "bun test src",
    "lint": "oxlint",
    "format": "prettier --write .",
    "check": "bun run format:check && bun run lint && bun run test"
  }
}
```

Take a minute to look at `package.json`, `tsconfig.json`, and `bun.lock` in this
repo. Every dependency has a reason. The whole stack in production is just:

- **`mithril`** — SPA framework (~10 KB gzipped), our only runtime dep apart
  from the UnoCSS reset.
- **`unocss`** — on-demand atomic CSS; we write classes in JSX and it generates
  the styles we actually use.
- Dev-only: `prettier`, `oxlint`, `happy-dom` for tests, `@napi-rs/canvas` for
  the OG image script, `simple-git-hooks` for the pre-commit gate.

**Lesson:** keep the dep list short. Every package is a thing you're promising
to maintain.

---

## Chapter 3 — TypeScript that compiles itself

Bun runs `.ts` and `.tsx` directly. Add `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react",
    "jsxFactory": "m",
    "jsxFragmentFactory": "'['",
    "types": ["bun-types"]
  }
}
```

The non-obvious bits:

- `"jsxFactory": "m"` — JSX compiles to `m(...)` calls instead of
  `React.createElement`. Mithril's `m` _is_ that factory. No React needed.
- `"strict": true` — catches half your bugs at edit time. Non-negotiable.

**Lesson:** TypeScript pays for itself. Configure strict mode on day one.

---

## Chapter 4 — Mithril: JSX without React

A minimal Mithril component:

```tsx
// src/index.tsx
import m from "mithril";

const App = {
  view: () => <div class="glyph">가</div>,
};

m.mount(document.getElementById("app")!, App);
```

What Mithril gives us that plain DOM doesn't:

- A **virtual DOM diff**: we re-render the whole view on every state change, and
  Mithril patches only the parts that differ. We never manually mutate the DOM.
- **`m.redraw()`**: "re-run the view function". We'll call it after state
  changes.

Mithril's entire API fits on a napkin. That's the point.

**Lesson:** pick the smallest framework that lets you stop thinking about the
DOM.

---

## Chapter 5 — The Unicode math

Every precomposed Hangul syllable is a deterministic function of three jamo:

```
syllable_index = (L × 21 + V) × 28 + T
code_point     = 0xAC00 + syllable_index

L ∈ [0, 18]  — 19 initial consonants (초성)
V ∈ [0, 20]  — 21 vowels (중성)
T ∈ [0, 27]  — 28 trailing consonants (종성), 0 = none
```

`19 × 21 × 28 = 11,172`. The inverse gives us decomposition:

```ts
// src/data/unicode.ts
export function decompose(index: number): [number, number, number] {
  const L = Math.floor(index / (21 * 28));
  const V = Math.floor((index % (21 * 28)) / 28);
  const T = index % 28;
  return [L, V, T];
}
```

Inverse (`compose`) is just the formula above. See `src/nav.ts` for the pure,
tested helpers we settled on.

**Lesson:** before you pick a framework or a database, look for the math.
Problems with a closed-form solution don't need storage.

---

## Chapter 6 — Showing any syllable by index

Wire the math into the component:

```tsx
const HANGUL_BASE = 0xac00;
const COUNT = 11_172;

let index = 0;

const App = {
  view: () => {
    const cp = HANGUL_BASE + index;
    return <div class="glyph">{String.fromCodePoint(cp)}</div>;
  },
};
```

Next button:

```tsx
<button
  onclick={() => {
    index = (index + 1) % COUNT;
  }}
>
  next
</button>
```

Mithril auto-calls `m.redraw()` after DOM event handlers, so the view updates.

**Lesson:** your first app state is a single integer. Don't reach for a state
library until one integer actually stops being enough.

---

## Chapter 7 — Keyboard input

Hook keydown on `document`, not on the element — the user might not have focused
anything:

```ts
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") index = (index + 1) % COUNT;
  if (e.key === "ArrowUp") index = (index - 1 + COUNT) % COUNT;
  m.redraw();
});
```

The `% COUNT` and `+ COUNT` make the index wrap around cleanly at both ends.
JavaScript's `%` is _remainder_, not modulo, so `-1 % 11172` is `-1`, not
`11171`. Adding `COUNT` before the modulo fixes it.

**Lesson:** know your language's quirks. Wrapping integers is a classic trap.

---

## Chapter 8 — Smooth scrolling wheel input

The wheel fires many events per second. Naive `+=1 per event` feels sluggish on
a trackpad and crazy on a mouse.

```ts
let lastWheelTime = 0;
let streak = 0;

window.addEventListener(
  "wheel",
  (e) => {
    const now = performance.now();
    if (now - lastWheelTime < 150) streak++;
    else streak = 0;
    lastWheelTime = now;

    const mag = Math.min(256, 2 ** Math.floor(streak / 3)); // exponential
    const dir = e.deltaY > 0 ? 1 : -1;
    index = (index + dir * mag + COUNT) % COUNT;
    m.redraw();
  },
  { passive: true },
);
```

`{ passive: true }` promises the browser we won't call `preventDefault`; it lets
the page scroll without a jank penalty. We don't because scrolling _is_ our
navigation; the wheel isn't doing anything else.

**Lesson:** input is about feeling, not fidelity. Cap things, debounce things,
accelerate things. Measure in "does it feel right?".

---

## Chapter 9 — Deep-linkable URLs via the hash

The URL fragment (`#가`) is free, client-only state. Browsers never send it to
the server, but `location.hash` is readable and `"hashchange"` fires on
back/forward.

```ts
function readHash() {
  const raw = decodeURIComponent(location.hash.slice(1));
  if (!raw) return 0;
  const cp = raw.codePointAt(0)!;
  if (cp >= 0xac00 && cp <= 0xd7a3) return cp - 0xac00;
  // hex? "AC00" → 0xAC00
  const hex = parseInt(raw, 16);
  if (!isNaN(hex) && hex >= 0xac00 && hex <= 0xd7a3) return hex - 0xac00;
  return 0;
}

function writeHash() {
  history.replaceState(null, "", "#" + String.fromCodePoint(0xac00 + index));
}
```

Now `kongli.sh/#한` shares _exactly_ this syllable. Users can bookmark
individual characters. Routing, for free.

See `src/nav.ts:parseGoto` for the richer version we ship (hex, position,
romanization).

**Lesson:** the URL is state. Use it.

---

## Chapter 10 — Throttling hash writes

Rapid scrolling hammers `history.replaceState`, which is relatively expensive
and can even rate-limit the page. Write at most once per 120 ms, with a trailing
flush so the _final_ position always sticks:

```ts
let hashTimer: ReturnType<typeof setTimeout> | null = null;
let hashPending = false;
function writeHash() {
  hashPending = true;
  if (hashTimer) return;
  doWrite();
  hashTimer = setTimeout(() => {
    hashTimer = null;
    if (hashPending) doWrite();
  }, 120);
}
function doWrite() {
  hashPending = false;
  history.replaceState(null, "", "#" + ...);
}
```

This pattern (leading edge + trailing flush) is the right shape for almost every
"write-behind" throttle you'll ever need.

**Lesson:** throttle side effects, not pure computations.

---

## Chapter 11 — UnoCSS: styles as data

Instead of writing CSS, we tag JSX with utility classes:

```tsx
<div class="flex items-center justify-center h-screen bg-white text-black">
  ...
</div>
```

UnoCSS scans our source files and emits only the classes we used. Setup:

```ts
// uno.config.ts
import { defineConfig, presetWind3 } from "unocss";
export default defineConfig({
  presets: [presetWind3({ dark: "class" })],
  content: { filesystem: ["src/**/*.{tsx,ts}", "public/**/*.html"] },
});
```

Build step: `bunx unocss "src/**/*.{tsx,ts}" -o dist/uno.css --minify`.

The payoff: zero hand-written CSS files. Our whole style bundle is ~2.4 KB
because that's how many utilities we actually use. Dark mode is "slap `.dark` on
the `<html>` and swap Tailwind-style `dark:bg-black` variants."

**Lesson:** atomic CSS scales to a single-person project beautifully. The rigor
of "tokens only" matters more than your favorite methodology.

---

## Chapter 12 — Jamo decomposition in the UI

We already have the math. Now render it as a row of cells:

```tsx
const [L, V, T] = decompose(index);
return (
  <div class="grid grid-cols-7 gap-2">
    <Cell char={COMPAT_L[L]} role="초성" />
    <Plus />
    <Cell char={COMPAT_V[V]} role="중성" />
    <Plus />
    <Cell char={T === 0 ? "∅" : COMPAT_T[T]} role="종성" />
    <Equals />
    <Cell char={String.fromCodePoint(0xac00 + index)} role="음절" />
  </div>
);
```

The `COMPAT_*` arrays live in `src/data/unicode.ts`. They map L/V/T indices to
the _standalone_ compatibility jamo (`ㄱ`, `ㅏ`, etc.) — which are a separate
Unicode block from the _conjoining_ jamo used inside a syllable.

**Lesson:** Unicode has multiple encodings of the same concept. Pick whichever
one renders legibly.

---

## Chapter 13 — Touch input on mobile

The wheel doesn't exist on touch devices. A vertical drag should feel the same.

```ts
let touchY = 0;
let touchAcc = 0;
const STEP_PX = 30;

window.addEventListener("touchstart", (e) => {
  touchY = e.touches[0].clientY;
});
window.addEventListener("touchmove", (e) => {
  const dy = touchY - e.touches[0].clientY;
  touchY = e.touches[0].clientY;
  touchAcc += dy;
  while (Math.abs(touchAcc) >= STEP_PX) {
    const dir = Math.sign(touchAcc);
    touchAcc -= dir * STEP_PX;
    index = (index + dir + COUNT) % COUNT;
  }
  m.redraw();
});
```

The accumulator preserves sub-threshold motion so the experience isn't jittery
when someone drags slowly.

Also set `touch-action: none` on the scroll surface so the browser doesn't also
try to scroll the page.

**Lesson:** touch events are deltas. Accumulate and threshold — don't listen for
"gestures" until you need them.

---

## Chapter 14 — Bookmarks in localStorage

```ts
const KEY = "kongli.bookmarks";

function load(): Set<number> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}
function save(s: Set<number>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...s]));
  } catch {
    /* quota, private mode — ignore */
  }
}
```

Every single `localStorage` call in this project is wrapped in `try/catch`. In
private browsing on Safari, any write throws. In some embedded webviews, storage
is disabled entirely. The app has to work anyway.

**Lesson:** I/O that _can_ fail _will_ fail. Wrap it.

---

## Chapter 15 — Overlays: help, go-to, bookmarks

Three modals in `SyllableView.tsx`. They share a pattern:

1. A module-level boolean: `let helpOpen = false`.
2. A toggle function:
   `function toggleHelp() { helpOpen = !helpOpen; m.redraw(); }`.
3. A keyboard handler: `if (e.key === "?") toggleHelp()`.
4. A component that renders `null` when closed, so it's trivial to mount
   unconditionally.

```tsx
function HelpOverlay() {
  if (!helpOpen) return null;
  return (
    <div
      class="fixed inset-0 z-30 bg-black/60 flex items-center justify-center"
      onclick={() => (helpOpen = false)}
    >
      <div class="..." onclick={(e) => e.stopPropagation()}>
        {/* content */}
      </div>
    </div>
  );
}
```

Clicking the backdrop closes the modal (`onclick` bubbles up); clicking the card
itself doesn't (`stopPropagation`). Pressing Escape closes any overlay.

**Lesson:** modals are just conditional rendering. Resist any library that
claims otherwise.

---

## Chapter 16 — Auto-scroll ("play mode")

A button that starts a `setInterval`:

```ts
let autoScrollTimer: ReturnType<typeof setInterval> | null = null;

function startAutoScroll() {
  if (autoScrollTimer) return;
  autoScrollTimer = setInterval(tick, 600);
  tick();
}
function stopAutoScroll() {
  if (autoScrollTimer) clearInterval(autoScrollTimer);
  autoScrollTimer = null;
}
function tick() {
  index = (index + 1) % COUNT;
  writeHash();
  m.redraw();
}
```

Any keyboard/wheel/touch input calls `stopAutoScroll()` first thing. That rule —
"user input always wins" — is what makes it feel like a polite companion instead
of something that fights you.

See `SyllableView.tsx` for the full version: configurable speed, mute toggle, a
tiny pentatonic synth via `AudioContext` for audible ticks, and a HUD that
replaces the toolbar while playing so there's no mobile overlap.

Two gotchas worth copying if you build something similar:

- **Respect locks in the tick.** The naive `(index + 1) % COUNT` ignores any
  jamo locks the user set, so locking `L=ㅎ` would have playback walking
  straight out of the locked subset. Call `stepWithLocks(1)` instead — same
  helper the keyboard uses — so one code path owns "what's the next syllable".
- **HUD buttons fire on `pointerdown`, not `click`.** A `click` is pointerdown +
  pointerup on the _same_ element. At 20 Hz Mithril redraws the HUD between
  those two events often enough that taps get dropped. Binding to `pointerdown`
  (with `preventDefault` + `stopPropagation`) makes the HUD feel instant and
  also kills the 300 ms mobile click delay.
- **Pitch has to react to what's changing.** Our first pentatonic picked notes
  from the leading consonant only. Locking `L` then pinned the pitch even though
  V and T kept moving. Mix all three (`l*3 + v*2 + t`) so the melody still walks
  when any single slot is locked.

**Lesson:** timers should always have a kill switch bound to _every_ user-input
path. Lean on a single `stopAutoScroll()` helper and call it everywhere.

---

## Chapter 17 — View transitions

When the big glyph changes, browsers can crossfade old→new for us — one line of
CSS + one API call:

```css
html {
  view-transition-name: none;
}
.big-glyph {
  view-transition-name: big-glyph;
}
```

```ts
function withViewTransition(fn: () => void) {
  const doc = document as any;
  if (!doc.startViewTransition || reducedMotion()) return fn();
  doc.startViewTransition(fn);
}

withViewTransition(() => {
  index = next;
  m.redraw();
});
```

Only the big glyph participates — we opt the `html` root out with
`view-transition-name: none`. We skip transitions on fast auto-scroll (every
<400 ms tick) because the crossfade would pile up and swallow clicks on the HUD.

See `uno.config.ts` for our tuned pseudo-element CSS that keeps clicks landing
during the 120 ms fade.

**Lesson:** progressive enhancement is alive and well. Check for features, fall
back gracefully, and don't punish older browsers.

---

## Chapter 18 — Jamo locks

Click any jamo cell to "lock" it — navigation now only visits syllables where
that slot matches:

```ts
let lockL: number | null = null;
let lockV: number | null = null;
let lockT: number | null = null;

function matchesLock(idx: number): boolean {
  const [L, V, T] = decompose(idx);
  if (lockL !== null && L !== lockL) return false;
  if (lockV !== null && V !== lockV) return false;
  if (lockT !== null && T !== lockT) return false;
  return true;
}

function stepWithLocks(delta: number): number {
  let i = index;
  for (let k = 0; k < COUNT; k++) {
    i = (i + Math.sign(delta) + COUNT) % COUNT;
    if (matchesLock(i)) return i;
  }
  return index;
}
```

Three nullable slots, one predicate, one linear search. The counter under the
glyph switches from `1234 / 11172` to `42 / 408` when you've locked L=ㅎ.

One UI detail worth calling out: make the whole jamo _cell_ the click target,
not just the glyph. Our first version wrapped the character in a `<button>` that
shrank to fit — so users had to aim at a 40 px-wide letter inside a 120 px grid
cell. Setting `w-full h-full` on the button and
`items-stretch justify-items-stretch` on the grid turns the full cell into one
obvious tap target, with a subtle `hover:bg-black/5` tint so it reads as
clickable.

**Lesson:** features often reduce to "add one more thing the predicate checks".
Resist the urge to model "a filter system".

---

## Chapter 19 — The neighbor strip

Small row of surrounding syllables under the big glyph. Axis is auto-picked:

- If exactly one jamo is locked, vary the _unlocked_ axis with the most
  candidates — e.g. lock `L=ㅎ`, neighbors vary V.
- Otherwise, vary the last axis you touched.

See `pickNeighborAxis` in `src/nav.ts`. It's a small heuristic, fully
unit-tested.

**Lesson:** heuristics deserve tests. If "what's the expected axis when
everything is locked?" isn't obvious to you, it won't be obvious to your future
self either.

---

## Chapter 20 — Theme system: from dark mode to vibrant palettes

Phase 1 — class-on-html dark mode:

```ts
document.documentElement.classList.toggle("dark", isDark);
```

UnoCSS's `dark:bg-black` variant flips when the class is present.

Phase 2 — named palettes via CSS vars:

```css
html { --k-chrome-bg: rgba(255,255,255,0.7); --k-glow: none; }
html.theme-sunset {
  background: linear-gradient(135deg, #ff2e63, #ff7f50, #ffd23f) fixed;
  --k-chrome-bg: rgba(255,70,110,0.35);
  --k-glow: 0 0 32px rgba(255,220,150,0.85);
}
html[class*="theme-"] .kongli-pill {
  background: var(--k-chrome-bg) !important;
  ...
}
.kongli-glyph { text-shadow: var(--k-glow); }
```

Components get marker classes (`kongli-pill`, `kongli-panel`, `kongli-toast`).
Palettes override them through specificity + `!important`. Eight themes in a few
dozen lines of CSS.

**Lesson:** CSS variables are the right primitive for theming. Classes + vars
compose. Component props for colors don't.

---

## Chapter 21 — Build pipeline

`build.ts` orchestrates four steps:

1. `Bun.build({ entrypoints: ["src/index.tsx"], outdir: "dist", minify: true })`
   — bundles our TS/TSX into one `dist/index.js`.
2. `cpSync("public", "dist", { recursive: true })` — copies static assets
   (`index.html`, favicon, manifest, etc.).
3. `writeFileSync(sw.js, sw.js.replace("__CACHE_VERSION__", Date.now()))` —
   stamps the service worker with a unique cache key so updates invalidate
   correctly.
4. `Bun.spawnSync(["bunx", "unocss", ..., "-o", "dist/uno.css", "--minify"])` —
   generates the CSS.

Everything is one file. No webpack.config.js, no rollup.config.js. If you
outgrow it, Bun's loader API is there; we never needed it.

**Lesson:** a build script is just a program. Write it that way.

---

## Chapter 22 — Per-syllable pages for SEO and OG images

`scripts/gen-syllable-pages.ts` emits 22,344 HTML files — one per syllable,
under `/syllable/가/index.html` etc. Each is a stub page with the right
`<title>`, `<meta>` OG tags (image, description), and a client-side redirect
into the SPA at `/#가`. Google indexes them; sharing a link to Slack/Discord
produces a rich preview.

OG images are pre-rendered too via `scripts/gen-og.ts` using `@napi-rs/canvas` —
the Korean system font is loaded server-side, the syllable is drawn at 1200×630,
saved to `public/syllable/가/og.png`.

This is "static site generation" without a framework. We have a `for` loop.

**Lesson:** SSG is just "your build script writes files". Don't pull in Next.js
for that alone.

---

## Chapter 23 — Offline: the service worker

`public/sw.js` (~60 lines total):

- On `install`: precache the key static files (`index.html`, `index.js`, CSS).
- On `fetch`: cache-first for same-origin, network fallback, then the precached
  `index.html` as navigation fallback.
- On `activate`: delete any old caches whose key doesn't match the current
  build.

The cache key is stamped by `build.ts` with the build timestamp, so every deploy
minimally invalidates. `src/index.tsx` listens for an updated SW and shows a
"New version available — Reload" toast with a dismiss button.

```ts
// src/index.tsx
navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
```

`updateViaCache: "none"` tells the browser never to cache the SW script itself,
which is the classic footgun for "users stuck on an old version forever".

**Lesson:** caching is the _hard_ part of the web. Invest 30 minutes in
understanding `Cache-Control` headers and SW lifecycle states before you ship a
PWA.

---

## Chapter 24 — The daily syllable at `/today/`

`public/today/index.html` is a redirect page. Its inline `<script>` hashes
"days-since-UTC-epoch" with Knuth's multiplicative constant to pick a
deterministic syllable that changes every UTC midnight:

```ts
const day = Math.floor(Date.now() / 86400000);
const idx = (Math.imul(day, 2654435761) >>> 0) % 11172;
const cp = 0xac00 + idx;
location.replace(`/#${encodeURIComponent(String.fromCodePoint(cp))}`);
```

- `Math.imul` gives a proper 32-bit integer multiplication.
- `>>> 0` coerces to unsigned so `% 11172` is always positive.
- `2654435761 ≈ 2^32 / φ` (golden-ratio hash) — spreads consecutive integers
  evenly across the output space. (Our first attempt, djb2 over the date string,
  produced _consecutive_ syllables on consecutive days — the good-spread test
  was worth the 10 minutes.)

**Lesson:** test your randomness by looking at the output. "Random-looking" and
"evenly spread" are different properties.

---

## Chapter 25 — Testing what's worth testing

Two kinds of tests.

**Pure unit tests** for logic — `src/nav.test.ts`, `src/data/unicode.test.ts`.
These are fast, deterministic, and exercise the tricky math: wrap/clamp,
decompose/compose round trip, `stepWithLocks` with every lock combination, parse
random inputs for the go-to dialog.

**Smoke tests** for the app — `src/app.smoke.test.ts` uses happy-dom to mount
`SyllableView`, dispatch keyboard events, and check that the hash/localStorage
updated:

```ts
import { mount } from "../index-like-harness";
test("arrow down advances", async () => {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
  await sleep(150); // hash writes are throttled at 120 ms
  expect(location.hash).toBe("#%EA%B0%81"); // 각
});
```

Gotchas we learned the hard way:

- `SyllableView` reads `location.hash` at module _import_ time, so the DOM
  globals need to be set up before `await import(...)`.
- Every `m.mount()` adds keydown listeners to `document`; wiping `document.body`
  doesn't remove them. Mount once in `beforeAll`, close overlays with Esc in
  `beforeEach`.

74 tests. Total runtime 2.6 seconds.

**Lesson:** test the units that aren't self-evident from reading the code.
Smoke-test the rest end-to-end. Everything in between is a bad trade.

---

## Chapter 26 — CI: lint, test, Lighthouse, deploy

`.github/workflows/deploy.yml` runs on every push to `main`:

```yaml
- run: bun install --frozen-lockfile
- run: bun run check # format:check + lint + test
- run: bun run build
- uses: actions/upload-pages-artifact@...
- uses: actions/deploy-pages@...
```

`.github/workflows/lighthouse.yml` runs on every PR and asserts performance,
accessibility, best-practices, and SEO are all ≥ 0.95:

```yaml
- uses: treosh/lighthouse-ci-action@...
  with: { configPath: ./.github/lighthouserc.json, runs: 3 }
```

If any of those drops, the PR is blocked until you fix the regression. This is
cheap insurance against "small tweak" turning into 200 ms of JavaScript bloat.

**Lesson:** automate the smell test. The bar is hard to hold by hand; a machine
will.

---

## Chapter 27 — Refactoring as your app grows

`SyllableView.tsx` is ~1500 lines of module-level state and handlers. Two
approaches we _didn't_ take:

- Split into 20 components with prop-drilling — would have hidden the state, not
  reduced it.
- Reach for Redux/Zustand/signals — would have replaced 30 `let`s with more
  ceremony and the same cognitive load.

What we _did_: extract the **pure** parts — anything that's a function of its
arguments, no side effects — into `src/nav.ts`. Now those functions have unit
tests, and `SyllableView.tsx` is a thin skin of "wire DOM events to those
functions, call `m.redraw()`."

**Lesson:** code complexity comes from state × branches × side effects. You can
pull _pure_ code out without touching anything else, and that's where you get
the biggest testability win for the least risk.

### Reuse the code that already works

While adding auto-scroll (Chapter 16), the tick wrote a fresh copy of the
wrap/clamp logic from `setIndex` — `index = next` — and in one branch of
`nav.stepWithLocks` the step returned `from + delta` with no wrap at all. So
pressing ArrowDown worked perfectly, but a MIDI tick could walk `index` past
11171 at the end of the range, and the counter showed "11173 / 11172" for a
frame. The fix wasn't new math, it was routing the tick through the same
normalization everything else uses (a single `wrapOrClamp` helper).
`setIndexSmooth` had the same shape of bug — it _always_ wrapped, ignoring
`cycleWrap`, so clamp mode silently wrapped during smooth scroll.

**Lesson:** when a new code path misbehaves next to an old one that works, the
answer is almost always "call the thing the working path calls." Don't invent a
parallel copy of wrap, bounds, state updates, or side effects — extract a helper
and share it. A stray `return from + delta` with no wrap is a trap waiting for
the next caller.

---

## Chapter 28 — Accessibility, reduced motion, and other details

Things we added on top that are easy to miss but matter:

- `aria-label` on buttons, `aria-live="polite"` on the big glyph,
  `role="dialog"` on overlays with `aria-modal`.
- `prefers-reduced-motion: reduce` short-circuits view transitions and smooth
  scrolling.
- `prefers-color-scheme` powers `theme: auto`.
- A `<link rel="canonical">` on every static syllable page.
- `manifest.webmanifest` + a maskable icon so "Add to home screen" gives a
  proper app on iOS and Android.
- `<meta name="theme-color">` per theme (light `#fff`, dark `#000`).

**Lesson:** accessibility isn't a phase. It's a list you keep, and you tick
items off forever.

---

## Where to go from here

The current TODO.md has things we haven't shipped:

- **Quiz mode** — hide jamo, let the user type or pick.
- **Typing trainer** — Dubeolsik keyboard overlay.
- **Stroke-order animation** on the glyph.
- **KRDict gloss** for syllables that are also words.
- **SVG/PNG export** for designers.

Any of those would be a good 2–3-hour weekend project on top of what's here. If
you've built along with this tutorial, you now know every system in the app — go
pick one.

---

## The shape of small software

There's nothing architecturally clever in this codebase. A single file. A single
integer of state. A predictable build script. ~400 lines of actual logic + jamo
data, the rest is UI. It went from "one centered character" to a PWA with view
transitions and eight themes without ever crossing a complexity cliff.

That's the point. Most apps want to be small. They grow because someone added a
framework that wants to be used, a library that wants a config, a pattern that
wants to be applied. Resist. Keep the pieces replaceable. Let the math do the
work.

Happy hacking.
