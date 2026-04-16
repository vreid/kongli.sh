# kongli.sh — Korean Unicode Explorer

Browse and explore Korean character Unicode ranges, entirely client-side.

## Stack

- **Bun** — build & test
- **Mithril.js** — SPA framework (~10KB gzipped)
- **UnoCSS** — on-demand utility classes (preset-wind3, ~4 KB generated)
- **Caddy** — production server (auto-HTTPS, gzip, SPA fallback)
- **Docker** — multi-stage build → deploy

## Development

```bash
bun install
bun run dev       # watch mode, outputs to dist/
```

Open `dist/index.html` in a browser (or use any local file server).

## Build

```bash
bun run build     # minified production bundle → dist/
```

## Test

```bash
bun test          # runs bun:test suite
```

## Lint

```bash
bun run lint      # oxlint (strict correctness + suspicious + perf)
```

## Format

```bash
bun run format        # prettier --write .
bun run format:check  # prettier --check . (CI-friendly)
```

## Deploy with Docker

```bash
docker build -t kongli .
docker run -p 80:80 -p 443:443 kongli
```

Caddy auto-serves from `/srv` with gzip and SPA fallback.

## Unicode Blocks

| Block                     | Range         | Count  |
| ------------------------- | ------------- | ------ |
| Hangul Jamo               | U+1100–U+11FF | 256    |
| Hangul Compatibility Jamo | U+3130–U+318F | 96     |
| Hangul Syllables          | U+AC00–U+D7AF | 11,184 |
| Hangul Jamo Extended-A    | U+A960–U+A97F | 32     |
| Hangul Jamo Extended-B    | U+D7B0–U+D7FF | 80     |
