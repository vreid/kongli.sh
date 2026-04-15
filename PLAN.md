# kongli.sh — Korean Unicode Explorer

## Problem

Build a site for **kongli.sh** that lets users scroll through and explore the Korean character Unicode ranges. Pure SPA — all data computed client-side.

## Stack

- **Build**: Bun (bundle TSX → static files)
- **Frontend**: Mithril.js (TSX via Bun's native JSX support)
- **Styling**: PicoCSS only (zero custom CSS)
- **Serving**: Caddy (auto-HTTPS, compression, SPA fallback)
- **Deployment**: Docker (multi-stage: Bun build → Caddy serve)

## Korean Unicode Ranges (core data)

| Block                     | Range         | Count  |
| ------------------------- | ------------- | ------ |
| Hangul Jamo               | U+1100–U+11FF | 256    |
| Hangul Compatibility Jamo | U+3130–U+318F | 96     |
| Hangul Syllables          | U+AC00–U+D7AF | 11,184 |
| Hangul Jamo Extended-A    | U+A960–U+A97F | 32     |
| Hangul Jamo Extended-B    | U+D7B0–U+D7FF | 80     |

## Architecture

```
kongli.sh/
├── package.json
├── tsconfig.json              # jsx: "react", jsxFactory: "m"
├── Dockerfile                 # multi-stage: bun build → caddy serve
├── Caddyfile                  # static files + SPA fallback
├── src/
│   ├── index.tsx              # Mithril app entry, m.route setup
│   ├── components/
│   │   ├── Layout.tsx         # Root layout (nav + main)
│   │   ├── BlockNav.tsx       # Sidebar/nav listing Unicode blocks
│   │   ├── CharGrid.tsx       # Grid of characters with pagination
│   │   └── CharDetail.tsx     # Detail view for a selected character
│   └── data/
│       └── unicode.ts         # Korean Unicode block definitions + char generation
├── public/
│   └── index.html             # Mithril mount point + PicoCSS CDN link
└── test/
    └── unicode.test.ts        # bun:test for Unicode data module
```

## Build pipeline

- **Build**: `bun build ./src/index.tsx --outdir ./dist --minify`
- **Dev**: `bun build ./src/index.tsx --outdir ./dist --watch` + local file server
- **TSX**: Bun natively compiles Mithril JSX via tsconfig (`jsxFactory: "m"`)
- **Output**: `dist/` contains `index.js` + copied `index.html` — that's it

## Todos

### 1. Project scaffolding (`scaffold`)

Initialize Bun project, install `mithril` and `@types/mithril`. Configure tsconfig with `jsx: "react"`, `jsxFactory: "m"`, `jsxFragmentFactory: "'['"`. Create `public/index.html` with PicoCSS CDN link and a mount-point div.

### 2. Unicode data module (`unicode-data`)

Client-side TypeScript module defining Korean Unicode block metadata (id, name, range start/end, description) and functions to generate character info (code point, hex string, rendered character, block name). Support pagination for large blocks (Hangul Syllables = 11K chars). Unit tests with bun:test.

### 3. Mithril client app (`mithril-client`)

**Depends on: unicode-data**
Build the Mithril.js frontend in TSX:

- `Layout`: root component with `<nav>` (block list) + `<main>` (content area)
- `BlockNav`: lists Unicode blocks, click to select, highlights active block
- `CharGrid`: renders paginated grid of characters for the selected block, pagination controls
- `CharDetail`: shows details on character click (code point, hex, UTF-8 bytes, block name) — possibly using `<dialog>` or `<details>`
- Mithril routing: `#!/blocks/:id` for block views
- PicoCSS semantic HTML only — `<nav>`, `<main>`, `<article>`, `<table>`, `<dialog>`, etc.

### 4. Dockerfile + Caddyfile (`docker`)

**Depends on: mithril-client**

- **Caddyfile**: serve from `/srv`, `try_files {path} /index.html` for SPA fallback, encode gzip
- **Dockerfile**: stage 1 = `oven/bun` → `bun install` + `bun build`, stage 2 = `caddy:alpine` → copy `dist/` to `/srv`

### 5. Dev experience (`dev-experience`)

**Depends on: mithril-client**
Add `package.json` scripts: `dev`, `build`, `test`. Write a brief README covering the stack, how to develop, build, and deploy.

## Notes

- No backend, no API, no Hono, no Zod — all data is static Unicode ranges computed in the browser
- Hangul Syllables block has 11K+ characters — pagination is essential, consider 100-200 chars per page
- PicoCSS provides good defaults for semantic HTML — lean into `<table>`, `<details>`, `<dialog>`
- Mithril.js is ~10KB gzipped, has built-in routing and XHR
- Caddy Alpine image is ~40MB, handles HTTPS/compression/caching automatically
- Entire JS build is one command: `bun build ./src/index.tsx --outdir ./dist --minify`
