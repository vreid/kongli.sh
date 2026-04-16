// Generate per-syllable OG previews. For each of the 11,172 Hangul
// syllables we emit:
//
//   dist/og/<HEX>.svg  — a 1200×630 SVG showing the syllable
//   dist/s/<HEX>.html  — a tiny HTML page with per-syllable OpenGraph
//                         meta that redirects to the SPA at "/#<HEX>"
//
// These files let deep links like https://kongli.sh/s/D55C render a rich
// preview on Slack / Discord / Telegram / Bluesky while keeping the SPA
// itself a single-page app.
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

import { HANGUL_SYLLABLES, SYLLABLE_COUNT, romanize } from "../src/data/unicode";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function svgFor(char: string, hex: string, roman: string, pos: number): string {
  const glyph = escapeXml(char);
  const subtitle = `${hex}  ·  ${escapeXml(roman)}  ·  ${pos.toLocaleString()} / 11,172`;
  const fontStack =
    '"Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans CJK KR", "Noto Sans KR", system-ui, sans-serif';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="#000"/>
  <text x="600" y="330" fill="#fff" font-family='${fontStack}' font-weight="700" font-size="420" text-anchor="middle" dominant-baseline="central">${glyph}</text>
  <text x="600" y="540" fill="#fff" fill-opacity="0.85" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="42" text-anchor="middle">kongli.sh</text>
  <text x="600" y="585" fill="#fff" fill-opacity="0.55" font-family="ui-monospace, Menlo, Consolas, monospace" font-weight="400" font-size="24" text-anchor="middle">${subtitle}</text>
</svg>
`;
}

function htmlFor(char: string, hex: string, roman: string): string {
  const glyph = escapeXml(char);
  const og = `https://kongli.sh/og/${hex}.svg`;
  const url = `https://kongli.sh/s/${hex}`;
  const title = `${glyph} · kongli.sh`;
  const desc = `${glyph} (${hex}, ${escapeXml(roman)}) in the 11,172-syllable Hangul block.`;
  // The redirect target is the SPA with the hex in the hash fragment, so
  // readers who follow the link land on the exact syllable.
  const target = `/#${hex}`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${desc}" />
    <link rel="canonical" href="${url}" />
    <meta http-equiv="refresh" content="0; url=${target}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:image" content="${og}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/svg+xml" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${desc}" />
    <meta name="twitter:image" content="${og}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <script>location.replace(${JSON.stringify(target)});</script>
  </head>
  <body>
    <p>
      Redirecting to <a href="${target}">${glyph}</a>…
    </p>
  </body>
</html>
`;
}

export function generateSyllablePages(distDir: string): { files: number; bytes: number } {
  const ogDir = join(distDir, "og");
  const sDir = join(distDir, "s");
  mkdirSync(ogDir, { recursive: true });
  mkdirSync(sDir, { recursive: true });

  let files = 0;
  let bytes = 0;
  for (let i = 0; i < SYLLABLE_COUNT; i++) {
    const cp = HANGUL_SYLLABLES.rangeStart + i;
    const char = String.fromCodePoint(cp);
    const hex = cp.toString(16).toUpperCase();
    const roman = romanize(cp);
    const svg = svgFor(char, hex, roman, i + 1);
    const html = htmlFor(char, hex, roman);
    writeFileSync(join(ogDir, `${hex}.svg`), svg);
    writeFileSync(join(sDir, `${hex}.html`), html);
    files += 2;
    bytes += svg.length + html.length;
  }
  return { files, bytes };
}

if (import.meta.main) {
  const out = join(process.cwd(), "dist");
  mkdirSync(out, { recursive: true });
  const { files, bytes } = generateSyllablePages(out);
  console.log(`Wrote ${files.toLocaleString()} files (${(bytes / 1024 / 1024).toFixed(1)} MB)`);
}
