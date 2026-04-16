# kongli.sh — Korean Unicode Explorer

[![Deploy](https://github.com/vreid/kongli.sh/actions/workflows/deploy.yml/badge.svg)](https://github.com/vreid/kongli.sh/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

**Live demo: [kongli.sh](https://kongli.sh)**

Scroll through every one of the 11,172 precomposed Hangul syllables
(`U+AC00`–`U+D7A3`) one at a time, with live jamo decomposition (초성 / 중성 /
종성), UTF-8 / UTF-16 / UTF-32 encodings, Revised Romanization, and common
example words. Entirely client-side — no backend, no tracking.

## Stack

- **Bun** — build, test, package manager (version pinned in `.bun-version`)
- **Mithril.js** — SPA framework (~10 KB gzipped)
- **UnoCSS** (preset-wind3) — on-demand utility classes (~4 KB generated)
- **oxlint** + **Prettier** — lint & format
- **GitHub Pages** — static hosting (deploys on push to `main`)

## Development

```bash
bun install
bun run dev    # parallel bun build --watch + unocss --watch → dist/
```

Open `dist/index.html` in a browser (or any local file server).

## Scripts

| Script                 | What it does                                             |
| ---------------------- | -------------------------------------------------------- |
| `bun run dev`          | Watch mode for code + styles                             |
| `bun run build`        | Minified production bundle → `dist/`                     |
| `bun test`             | Run `bun:test` suite                                     |
| `bun run lint`         | oxlint (correctness + suspicious + perf)                 |
| `bun run format`       | Prettier (write)                                         |
| `bun run format:check` | Prettier (check, CI-friendly)                            |
| `bun run check`        | format:check + lint + test (what CI and git hooks run)   |
| `bun run og`           | Regenerate `public/og.png` (requires Korean system font) |
| `bun run upgrade`      | `bun upgrade` + `bunx actions-up -y` (pin GH Actions)    |

## Pre-commit hook

Installed automatically via `simple-git-hooks` on `bun install`. Blocks commits
that fail `bun run format:check` or `bun run lint`.

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which runs
format/lint/test/build and deploys `dist/` to GitHub Pages. The custom domain
(`public/CNAME`) is `kongli.sh`.

## Interaction

- **Wheel / trackpad**: ±1 with exponential acceleration on rapid input
- **Touch**: vertical drag (30 px = 1 step)
- **Keyboard** (jamo-aware):
  - `↑` / `↓` — ±1 syllable
  - `←` / `→` — ±28 (next / previous vowel row)
  - `PageUp` / `PageDown` — ±588 (next / previous initial row)
  - `Home` / `End` — snap to start / end of the current initial
  - `Shift+↑/↓`, `Shift+←/→`, `Shift+PgUp/PgDn` — cycle the initial / vowel /
    trailing jamo independently (composable explorer)
  - `/` or `g` — **go to** a syllable (가), hex (AC00), position (1–11172), or
    romanization (han)
  - `?` or `h` — **help** overlay
  - `c` — **copy** current syllable (also: click the big glyph)
  - `a` — toggle **auto-advance** (play/pause, ~600 ms per step)
  - `b` — **bookmark** / unbookmark current syllable (persisted in localStorage)
  - `l` — **list** bookmarks; click to jump
  - `d` — open current syllable on **Wiktionary**
  - `w` — toggle **wrap** vs clamp at either end of the block
  - `t` — cycle **theme** (auto / light / dark, remembered in localStorage)
  - `Esc` — close overlay
- **Auto-scroll**: opt-in — press `a` or the ▶ toolbar button; any input pauses.
- **Lock a jamo**: click any of the three jamo cells (initial / vowel / final)
  under the big syllable to lock that slot — navigation will only visit
  syllables matching the locked jamo(s), and the `X / Y` counter narrows to the
  filtered universe. Click again to unlock; 🔓 button clears all.
- **History**: every landed syllable gets a real `history.pushState` entry, so
  browser back/forward steps between visited syllables.
- **Hash**: URL hash = current syllable (`#가`), hex (`#AC00`), position
  (`#pos/1234`), or romanization (`#han`), throttled to 120 ms

## Unicode scope

Only **Hangul Syllables** (`U+AC00`–`U+D7A3`, 11,172 chars) is browsable. The
other Korean blocks appear only as the decomposition pieces under each syllable.

| Block                     | Range         | Count  |
| ------------------------- | ------------- | ------ |
| Hangul Jamo               | U+1100–U+11FF | 256    |
| Hangul Compatibility Jamo | U+3130–U+318F | 96     |
| Hangul Syllables          | U+AC00–U+D7A3 | 11,172 |
| Hangul Jamo Extended-A    | U+A960–U+A97F | 32     |
| Hangul Jamo Extended-B    | U+D7B0–U+D7FF | 80     |

## License

[MIT](./LICENSE)
