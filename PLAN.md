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
- **Serving**: Caddy (auto-HTTPS, gzip, SPA fallback)
- **Deployment**: Docker (multi-stage: Bun build → Caddy serve)

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
├── uno.config.ts            # UnoCSS presets & content globs
├── Dockerfile               # multi-stage: bun build → caddy serve
├── Caddyfile                # static files + SPA fallback
├── public/
│   ├── index.html           # mount point, links /index.css + /uno.css + /index.js
│   └── CNAME
├── src/
│   ├── index.tsx            # imports reset CSS, mounts CharView on #app
│   ├── global.d.ts
│   ├── components/
│   │   └── SyllableView.tsx # the whole UI
│   └── data/
│       ├── unicode.ts       # syllable → jamo decomposition + encodings
│       └── unicode.test.ts  # bun:test
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
- **Idle auto-scroll**: after `5 s` of no input, advance 1 char per `600 ms`
  until the next user event.
- **Wrap-around**: index wraps modulo 11,172 in both directions.

## URL hash / deep-linking

On load and on `hashchange`:

- `#가` (literal syllable, URL-decoded) → jump to that syllable.
- `#AC00` (hex code point) → jump to that code point.
- Out-of-range or empty → start at index 0 (`가`).

On every step, the hash is rewritten via `history.replaceState` to the literal
syllable (so sharing a URL shows the character). Writes are throttled to one per
`120 ms` during rapid motion, with a trailing flush so the final position is
always persisted.

## Display

Three vertical zones in a full-viewport flex column:

1. **Top**: `index+1 / 11,172` counter.
2. **Center**: the syllable, sized `min(35vw, 45vh, 20rem)` so it always fits.
3. **Bottom**: code point (`U+XXXX`), UTF-8 / UTF-16 / UTF-32 bytes, and a
   7-column grid showing `L + V [+ T] = syllable` with compatibility jamo and
   role labels (초성 / 중성 / 종성).

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
- **Output**: `dist/index.js`, `dist/index.css` (reset), `dist/uno.css`
  (utilities), `dist/index.html`, `dist/CNAME`

## Deployment

- **Caddyfile**: serves `/srv`, `try_files {path} /index.html`, `encode gzip`.
- **Dockerfile**: stage 1 `oven/bun` runs `bun install && bun run build`; stage
  2 `caddy:alpine` copies `dist/` to `/srv`.

## Future ideas

Not planned, but plausible:

- Expose the other Korean Unicode blocks as separate scrollers (would bring back
  `BlockNav` / routing).
- PWA / offline support (small bundle, static data — good fit).

## Notes

- No backend, no API, no Hono, no Zod — all data is computed in the browser.
- Mithril is ~10 KB gzipped; UnoCSS emits only the utilities actually used (~4
  KB). The entire bundle is tiny.
- Zero hand-written CSS: all styling lives as utility classes in JSX.
