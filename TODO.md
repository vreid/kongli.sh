# TODO

Ideas for future iterations, roughly ordered by impact. Items we already shipped
are not listed — the currently-shipped feature set is described in `PLAN.md` and
`README.md`.

## Learning & pedagogy

- **Stroke-order animation** overlaid on the big glyph, toggled with `s`. Data
  from Hanziwriter-style SVG sets for Hangul, or a `jamo-strokes` project.
- **Jamo etymology / origin** — show the historical shape origin of each jamo
  (ㄱ = tongue-root shape, ㄴ = tongue-tip, …). Click a jamo for a small info
  card.
- **Frequency indicator** — how common is this syllable in modern Korean?
  Color-code the counter or show a percentile based on a public corpus.
- **Dictionary link** to Naver / KRDict / Wiktionary for the current syllable.
- **Quiz mode** — show a syllable with its jamo hidden, let the user type them
  or pick from options. Track score in localStorage.

## Navigation & UX

- **Drag-to-scrub scrollbar** on the right edge showing position across all
  11,172 (hover previews the target syllable).
- **Index grid view** — press `i` to open a dense grid of all 11,172 (or all
  combinations of current leading + vowel) for fast jumping.
- **History back/forward** via `history.pushState` so browser back moves
  syllable-by-syllable (landed syllables only, not mid-scroll).
- **Lock by jamo filter** — "show me all syllables with 종성=ㅇ" or
  "leading=ㅂ". Dropdown or hotkeys.
- **Cycle direction toggle** — clamped vs wrap when scrolling past the ends.
- **Smooth scroll animation** between syllables on big jumps.

## Visual polish

- **Jamo decomposition inside the big glyph on hover** — colored regions
  (초성/중성/종성) like an anatomy chart.
- **Neighbor strip** — tiny horizontal thumbnails showing "neighbors" (same
  leading, different vowels; or same vowel, different trailing).
- **Per-syllable OG images** — generate for each syllable so `kongli.sh/#한`
  gets a rich preview. Pre-generate or use SVG OG images.
- **CSS view transitions** (`@view-transition`) — animate the syllable swap with
  a short crossfade.
- **Dark-mode font tuning** — slightly heavier weight or text-shadow so Nanum
  Gothic Coding doesn't look thin on dark backgrounds.

## Accessibility

- **Richer screen-reader output** — `aria-describedby` with "consists of giyeok,
  a, trailing niuen" in addition to the syllable + hex.
- **Honor `prefers-reduced-motion`** — disable auto-advance-after-idle.
- **Keyboard-only focus rings** — confirm all toolbar buttons have visible
  `focus-visible:` outlines.
- **`forced-colors` / high-contrast mode** support.

## Performance

- **Further font subsetting** — the shipped woff2 is ~655 KB. Subset to just
  Hangul Syllables + ASCII printable via `pyftsubset` / `subset-font` to get it
  down to ~400 KB.
- **Split into two unicode-range subsets** — tiny Latin-only subset for instant
  UI chrome + larger Hangul subset loaded async.
- **Eager-warm `glyphOffsetCache`** — after `document.fonts.ready`, measure all
  11,172 syllables in an `requestIdleCallback` loop so there is zero jitter on
  the first visit to each character.

## Code / DX

- **Component tests** with happy-dom — index bounds, keyboard handlers, bookmark
  toggling.
- **Playwright smoke test in CI** — page loads, arrow-down advances hash.
- **Typed state container** — extract the module-level `let`s (`index`, `theme`,
  `helpOpen`, …) into a small typed `state.ts` for testability.
- **Lighthouse CI** — enforce 100s for performance/accessibility/best
  practices/SEO.

## Content / meta

- **/about page** explaining 11,172 = 19 × 21 × 28 and Unicode ordering.
- **humans.txt** with author credit.
- **Sitemap** for `/` and `/about` (one entry per syllable is overkill).

## Wilder ideas

- **Typing trainer** — hidden Dubeolsik keyboard layout overlay; press the keys
  that form the current syllable.
- **Daily syllable** — `/today` deterministic per UTC day, posted to an RSS
  feed.
- **Animate through all 11,172** mode (`Shift+A`) at a configurable speed, with
  MIDI-style tick.
- **Export syllable as SVG / PNG** for designers making Hangul artwork.
- **Ink-density bar** — visualize "heavy" vs "light" syllables using the glyph's
  pixel count.
- **Hangul history toggle** — switch between modern Hangul, 훈민정음 forms, and
  archaic letters (ㆍ, ㅿ, ㆁ, ㅸ).
- **Standalone-word meanings** — for syllables that are also words (가, 집, 밥
  …), pull a short gloss from KRDict.
