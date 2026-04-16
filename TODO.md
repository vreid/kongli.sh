# TODO

Ideas for future iterations, roughly ordered by impact. Items we already shipped
are not listed — the currently-shipped feature set is described in `PLAN.md` and
`README.md`.

## Learning & pedagogy

- **Stroke-order animation** overlaid on the big glyph, toggled with `s`. Data
  from Hanziwriter-style SVG sets for Hangul, or a `jamo-strokes` project.
- **Quiz mode** — show a syllable with its jamo hidden, let the user type them
  or pick from options. Track score in localStorage.

## Navigation & UX

- **Neighbor strip** — tiny horizontal thumbnails showing "neighbors" (same
  leading, different vowels; or same vowel, different trailing).

## Visual polish

- **Per-syllable OG images** — generate for each syllable so `kongli.sh/#한`
  gets a rich preview. Pre-generate or use SVG OG images.
- **CSS view transitions** (`@view-transition`) — animate the syllable swap with
  a short crossfade.

## Accessibility

- **Richer screen-reader output** — `aria-describedby` with "consists of giyeok,
  a, trailing niuen" in addition to the syllable + hex.
- **Honor `prefers-reduced-motion`** — disable smooth-scroll animations.
- **Keyboard-only focus rings** — confirm all toolbar buttons have visible
  `focus-visible:` outlines.
- **`forced-colors` / high-contrast mode** support.

## Performance

- **Eager-warm `glyphOffsetCache`** — after `document.fonts.ready`, measure all
  11,172 syllables in an `requestIdleCallback` loop so there is zero jitter on
  the first visit to each character.

## Code / DX

- **Component tests** with happy-dom — index bounds, keyboard handlers, bookmark
  toggling, locks.
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
