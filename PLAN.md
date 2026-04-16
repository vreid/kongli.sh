# kongli.sh — Korean Unicode Explorer

## Product

A single-page, full-viewport **scroll-through** of all 11,172 precomposed Hangul
syllables (`U+AC00`–`U+D7A3`). One syllable fills the screen; scroll, swipe, or
arrow-key to move. Deep-linkable via URL hash. Zero backend, zero API, purely
client-side.

## Stack

- **Build**: Bun — `build.ts` wraps `Bun.build` + invokes `unocss` CLI, copies
  `public/` to `dist/`
- **Frontend**: Mithril.js (TSX via `tsconfig.json` `jsxFactory: "m"`)
- **Styling**: UnoCSS (preset-wind3) — utility classes in JSX, zero hand-written
  CSS. `@unocss/reset/tailwind.css` for normalization.
- **Font**: self-hosted **Nanum Gothic Coding** (SIL OFL) at
  `public/fonts/NanumGothicCoding-Regular.woff2` (~655 KB). Korean monospace so
  every syllable fills an identical cell. Declared in `public/fonts.css`,
  preloaded from `index.html`, wired as the default `font-sans` family in
  `uno.config.ts`, and precached by the SW.
- **Optical centering**: the big centerpiece character is translated per-glyph
  using Canvas `measureText` ink-bounding-box metrics so the _visual_ centroid
  (not just the em-box) lands at the same screen position for every syllable.
  Offsets are cached per character after `document.fonts.ready`. Keeps scrolling
  through 가 → 힣 visually stable even though different syllables (e.g. 가 vs
  갛) place their ink in different regions of the em-box.
- **Serving**: GitHub Pages (static hosting) with custom domain via
  `public/CNAME`
- **Deployment**: `.github/workflows/deploy.yml` runs format/lint/test/build on
  every push and PR; deploys `dist/` on pushes to `main`

## Unicode scope

Only **Hangul Syllables** (`U+AC00`–`U+D7A3`, 11,172 chars) are exposed in the
UI. The data module computes the Unicode-standard decomposition into leading
(초성), vowel (중성), and optional trailing (종성) jamo, and displays both the
conjoining form (`U+1100`+) and the compatibility form (`U+3130`+).

Other Korean blocks (Hangul Jamo, Compatibility Jamo, Extended-A/B) are
intentionally **not** a browsable surface — they appear only as the
decomposition pieces under each syllable. See "Future ideas" if we want to
change that.

## Architecture

```
kongli.sh/
├── build.ts                 # Bun.build + unocss CLI + public/ copy
├── dev.ts                   # parallel bun build --watch + unocss --watch
├── uno.config.ts            # UnoCSS presets & content globs (dark: 'class')
├── scripts/
│   ├── gen-og.ts            # renders 1200×630 public/og.png via @napi-rs/canvas
│   └── gen-examples.ts      # rebuilds src/data/examples.json from hermitdave ko_50k.txt
├── public/
│   ├── index.html           # mount point, links /fonts.css + /index.css + /uno.css + /index.js
│   ├── favicon.svg
│   ├── manifest.webmanifest
│   ├── fonts.css            # @font-face for Nanum Gothic Coding
│   ├── fonts/
│   │   └── NanumGothicCoding-Regular.woff2
│   ├── og.png               # committed OG image (regenerate with `bun run og`)
│   ├── robots.txt
│   ├── sw.js                # service worker (precache + cache-first)
│   └── CNAME
├── src/
│   ├── index.tsx            # imports reset CSS, mounts CharView on #app
│   ├── global.d.ts
│   ├── components/
│   │   └── SyllableView.tsx # the whole UI
│   └── data/
│       ├── unicode.ts       # syllable → jamo + romanization + encodings
│       ├── unicode.test.ts  # bun:test
│       └── examples.json    # syllable index → top ~3 Korean example words
└── dist/                    # build output (index.js, index.css, uno.css, index.html)
```

## Interaction model

- **Wheel / trackpad**: each event = one step; rapid consecutive events (< 150
  ms apart) accelerate the step exponentially: `2^floor(streak/3)`, capped
  at 256. Resets on pause.
- **Touch drag**: vertical drag; every `30 px` = one step. Accumulator preserves
  sub-threshold motion.
- **Keyboard** (jamo-aware):
  - `↑` / `↓` — ±1 syllable (with acceleration)
  - `←` / `→` — ±28 (next / previous vowel row, same initial)
  - `PageUp` / `PageDown` — ±588 (next / previous initial row)
  - `Home` / `End` — snap to first / last syllable of the current initial
  - `Shift+↑/↓` — cycle the initial consonant only (keep vowel + trailing)
  - `Shift+←/→` — cycle the vowel only
  - `Shift+PgUp/PgDn` — cycle the trailing consonant only (including "none")
  - `/` or `g` — open "go to" input (syllable, hex, position, or romanization)
  - `?` or `h` — toggle help overlay
  - `c` — copy current syllable to clipboard
  - `a` — toggle auto-advance (play / pause, ~600 ms per step)
  - `b` — bookmark / unbookmark current syllable
  - `l` — list bookmarks (click to jump)
  - `t` — cycle theme (auto / light / dark)
  - `Esc` — close any open overlay
- **Click-to-copy**: clicking the big glyph copies it to the clipboard and shows
  a transient toast.
- **Theme**: `auto` follows `prefers-color-scheme`; explicit overrides are
  persisted in `localStorage` under `kongli.theme`. The root element gets
  `.dark` when dark mode is active; UnoCSS is configured with
  `presetWind3({ dark: 'class' })`.
- **Auto-scroll**: opt-in only. Press `a` or click the ▶ button to start
  advancing 1 char per `600 ms`; any navigation input (wheel, touch, arrow keys,
  go-to, bookmarks overlay) pauses it.
- **Wrap-around**: index wraps modulo 11,172 in both directions.

## URL hash / deep-linking

On load and on `hashchange`:

- `#가` (literal syllable, URL-decoded) → jump to that syllable.
- `#AC00` (hex code point) → jump to that code point.
- `#han` / `#ga` / `#geul` (Revised-Romanization) → jump to that syllable.
- `#pos/1234` or just `#1234` → jump to that 1-based position.
- Out-of-range or empty → start at index 0 (`가`).

On every step, the hash is rewritten via `history.replaceState` to the literal
syllable (so sharing a URL shows the character). Writes are throttled to one per
`120 ms` during rapid motion, with a trailing flush so the final position is
always persisted.

## Display

Three vertical zones in a full-viewport flex column:

1. **Top**: `index+1 / 11,172` counter.
2. **Center**: the syllable, sized `min(35vw, 45vh, 20rem)` so it always fits.
3. **Bottom**: code point + Revised-Romanization (`U+AC00 · ga`), UTF-8 / UTF-16
   / UTF-32 bytes, up to three common example words (from
   `src/data/examples.json`), and a 7-column grid showing
   `L + V [+ T] = syllable` with compatibility jamo and role labels (초성 / 중성
   / 종성).

`document.title` is updated to `"<char> — kongli.sh"` on each step.

## Build pipeline

- **Dev**: `bun run dev` → `bun run dev.ts` (parallel `bun build --watch` +
  `unocss --watch`)
- **Prod**: `bun run build` → `bun run build.ts` (minified bundle +
  `unocss --minify` + copy `public/`)
- **Test**: `bun test` → runs `src/data/unicode.test.ts`
- **Lint**: `bun run lint` → `oxlint` (strict `correctness` + `suspicious` +
  `perf`, see `.oxlintrc.json`)
- **Format**: `bun run format` / `bun run format:check` → Prettier (see
  `.prettierrc.json`)
- **OG image**: `bun run og` regenerates `public/og.png` (1200×630) via
  `@napi-rs/canvas` using the system's Korean font (committed to the repo; not
  run in CI).
- **Service worker**: `build.ts` stamps `public/sw.js` with a unique
  `CACHE_VERSION` (build timestamp) when copying to `dist/`. The SW precaches
  the static assets and serves them cache-first, with `/index.html` as the
  navigation fallback. A new version triggers an in-page "New version available
  — Reload" toast. Registration is skipped on `localhost` / `file://` so dev is
  unaffected.
- **Output**: `dist/index.js`, `dist/index.css` (reset), `dist/uno.css`
  (utilities), `dist/index.html`, `dist/favicon.svg`,
  `dist/manifest.webmanifest`, `dist/og.png`, `dist/robots.txt`, `dist/sw.js`,
  `dist/CNAME`

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which runs
`format:check`, `lint`, `test`, `build`, then uploads `dist/` to GitHub Pages.
PRs run the same checks without deploying. The custom domain (`kongli.sh`) is
configured via `public/CNAME`.

## Future ideas

Not planned, but plausible:

- Expose the other Korean Unicode blocks as separate scrollers (would bring back
  `BlockNav` / routing).

## Notes

- No backend, no API, no Hono, no Zod — all data is computed in the browser.
- Mithril is ~10 KB gzipped; UnoCSS emits only the utilities actually used (~4
  KB). The entire bundle is tiny.
- Zero hand-written CSS: all styling lives as utility classes in JSX.
