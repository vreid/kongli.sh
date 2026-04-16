# kongli.sh — Korean Unicode Explorer

[![Deploy](https://github.com/vreid/kongli.sh/actions/workflows/deploy.yml/badge.svg)](https://github.com/vreid/kongli.sh/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

**Live demo: [kongli.sh](https://kongli.sh)**

Scroll through every one of the 11,172 precomposed Hangul syllables
(`U+AC00`–`U+D7A3`) one at a time, with live jamo decomposition (초성 / 중성 /
종성) and UTF-8 / UTF-16 / UTF-32 encodings. Entirely client-side — no backend,
no tracking, no build-time character data.

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
  - `/` or `g` — **go to** a syllable (가), hex (AC00), or position (1–11172)
  - `?` or `h` — **help** overlay
  - `c` — **copy** current syllable (also: click the big glyph)
  - `t` — cycle **theme** (auto / light / dark, remembered in localStorage)
  - `Esc` — close overlay
- **Idle**: auto-advances after 5 s of no input
- **Hash**: URL hash = current syllable (`#가`) or hex (`#AC00`), throttled to
  120 ms

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
