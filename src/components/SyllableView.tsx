import m from "mithril";
import {
  HANGUL_SYLLABLES,
  SYLLABLE_COUNT,
  L_COUNT,
  V_COUNT,
  N_COUNT,
  T_COUNT,
  getCharInfo,
  getEncodings,
  decomposeSyllable,
  romanize,
  romanToIndex,
  type JamoInfo,
} from "../data/unicode";
import examplesData from "../data/examples.json";

const examples = examplesData as Record<string, string[]>;

let index = 0;

function readHash(): number {
  const h = location.hash.slice(1);
  if (!h) return 0;
  const parsed = parseGoto(decodeURIComponent(h));
  return parsed ?? 0;
}

// Throttle hash writes during rapid motion; flush trailing edge
let hashTimer: ReturnType<typeof setTimeout> | null = null;
let lastHashWrite = 0;
const HASH_MIN_INTERVAL = 120;

function doWriteHash() {
  const cp = HANGUL_SYLLABLES.rangeStart + index;
  history.replaceState(null, "", "#" + String.fromCodePoint(cp));
  lastHashWrite = Date.now();
}

function writeHash() {
  const now = Date.now();
  const elapsed = now - lastHashWrite;
  if (hashTimer) {
    clearTimeout(hashTimer);
    hashTimer = null;
  }
  if (elapsed >= HASH_MIN_INTERVAL) {
    doWriteHash();
  } else {
    hashTimer = setTimeout(() => {
      hashTimer = null;
      doWriteHash();
    }, HASH_MIN_INTERVAL - elapsed);
  }
}

index = readHash();

// Optical centering: measure each glyph's ink bounding box and translate
// the big character so its visual centroid sits at the same screen position,
// no matter whether the syllable has a trailing consonant or not.
const glyphOffsetCache = new Map<string, { dx: number; dy: number }>();
const MEASURE_PX = 1000;
const BIG_GLYPH_FONT =
  '"Nanum Gothic Coding", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
let measureCanvas: HTMLCanvasElement | null = null;
let fontsReady = false;

function getMeasureCtx(): CanvasRenderingContext2D | null {
  if (!measureCanvas) measureCanvas = document.createElement("canvas");
  return measureCanvas.getContext("2d");
}

function computeGlyphOffset(char: string): { dx: number; dy: number } {
  const cached = glyphOffsetCache.get(char);
  if (cached) return cached;
  const ctx = getMeasureCtx();
  if (!ctx) return { dx: 0, dy: 0 };
  ctx.font = `${MEASURE_PX}px ${BIG_GLYPH_FONT}`;
  ctx.textBaseline = "alphabetic";
  const tm = ctx.measureText(char);
  const abl = tm.actualBoundingBoxLeft ?? 0;
  const abr = tm.actualBoundingBoxRight ?? tm.width;
  const aba = tm.actualBoundingBoxAscent ?? MEASURE_PX * 0.8;
  const abd = tm.actualBoundingBoxDescent ?? 0;
  const fba = tm.fontBoundingBoxAscent ?? MEASURE_PX * 0.8;

  const inkCxPx = (-abl + abr) / 2;
  const inkCyPx = fba + (-aba + abd) / 2;
  const divCxPx = tm.width / 2;
  const divCyPx = MEASURE_PX / 2;

  const result = {
    dx: (divCxPx - inkCxPx) / MEASURE_PX,
    dy: (divCyPx - inkCyPx) / MEASURE_PX,
  };
  if (fontsReady) glyphOffsetCache.set(char, result);
  return result;
}

let lastScrollTime = 0;
let scrollStreak = 0;

function getStep(): number {
  return Math.min(256, Math.pow(2, Math.floor(scrollStreak / 3)));
}

function setIndex(next: number) {
  index = ((next % SYLLABLE_COUNT) + SYLLABLE_COUNT) % SYLLABLE_COUNT;
  writeHash();
  stopAutoScroll();
  m.redraw();
}

function advance(delta: number) {
  const now = Date.now();
  if (now - lastScrollTime < 150) {
    scrollStreak++;
  } else {
    scrollStreak = 0;
  }
  lastScrollTime = now;
  setIndex(index + getStep() * delta);
}

function jumpBy(delta: number) {
  scrollStreak = 0;
  lastScrollTime = 0;
  setIndex(index + delta);
}

// Composable navigation: cycle a single jamo component (leading / vowel /
// trailing) while keeping the other two fixed. Scrolling the trailing
// includes the "no trailing" slot (28 options).
function decompose(i: number): [number, number, number] {
  return [Math.floor(i / N_COUNT), Math.floor((i % N_COUNT) / T_COUNT), i % T_COUNT];
}

function compose(l: number, v: number, t: number): number {
  return l * N_COUNT + v * T_COUNT + t;
}

function cycleLeading(delta: number) {
  const [l, v, t] = decompose(index);
  setIndex(compose((((l + delta) % L_COUNT) + L_COUNT) % L_COUNT, v, t));
}

function cycleVowel(delta: number) {
  const [l, v, t] = decompose(index);
  setIndex(compose(l, (((v + delta) % V_COUNT) + V_COUNT) % V_COUNT, t));
}

function cycleTrailing(delta: number) {
  const [l, v, t] = decompose(index);
  setIndex(compose(l, v, (((t + delta) % T_COUNT) + T_COUNT) % T_COUNT));
}

// Text-to-speech was tried but disabled: browser voice availability for
// single Korean syllables is unreliable (often silent or wrong voice).
// Kept intentionally unimplemented; see TODO.md for any future retry.

// Bookmarks (starred syllables, persisted in localStorage)
const BOOKMARKS_KEY = "kongli.bookmarks";
let bookmarks: Set<number> = new Set();

function loadBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) bookmarks = new Set(arr.filter((n) => typeof n === "number"));
  } catch {
    // ignore
  }
}

function saveBookmarks() {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...bookmarks]));
  } catch {
    // ignore
  }
}

function toggleBookmark() {
  if (bookmarks.has(index)) {
    bookmarks.delete(index);
    showToast("Removed bookmark");
  } else {
    bookmarks.add(index);
    showToast("Bookmarked");
  }
  saveBookmarks();
  m.redraw();
}

let listOpen = false;

function openList() {
  listOpen = true;
  stopAutoScroll();
  m.redraw();
}

function closeList() {
  listOpen = false;
  m.redraw();
}

function snapToInitialStart() {
  scrollStreak = 0;
  const lIndex = Math.floor(index / N_COUNT);
  setIndex(lIndex * N_COUNT);
}

function snapToInitialEnd() {
  scrollStreak = 0;
  const lIndex = Math.floor(index / N_COUNT);
  setIndex(lIndex * N_COUNT + N_COUNT - 1);
}

const AUTO_SCROLL_INTERVAL = 600;
let autoScrollTimer: ReturnType<typeof setInterval> | null = null;

function isAutoScrolling(): boolean {
  return autoScrollTimer !== null;
}

function startAutoScroll() {
  if (autoScrollTimer) return;
  autoScrollTimer = setInterval(() => {
    index = (index + 1) % SYLLABLE_COUNT;
    writeHash();
    m.redraw();
  }, AUTO_SCROLL_INTERVAL);
  m.redraw();
}

function stopAutoScroll() {
  if (autoScrollTimer) {
    clearInterval(autoScrollTimer);
    autoScrollTimer = null;
    m.redraw();
  }
}

function toggleAutoScroll() {
  if (isAutoScrolling()) stopAutoScroll();
  else startAutoScroll();
}

// Theme
type Theme = "auto" | "light" | "dark";
const THEME_KEY = "kongli.theme";
let theme: Theme = "auto";
let mediaQuery: MediaQueryList | null = null;

function loadTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "light" || v === "dark" || v === "auto") return v;
  } catch {
    // ignore
  }
  return "auto";
}

function applyTheme(t: Theme) {
  const root = document.documentElement;
  const dark = t === "dark" || (t === "auto" && !!mediaQuery?.matches);
  root.classList.toggle("dark", dark);
}

function setTheme(t: Theme) {
  theme = t;
  try {
    localStorage.setItem(THEME_KEY, t);
  } catch {
    // ignore
  }
  applyTheme(t);
  m.redraw();
}

function cycleTheme() {
  const next: Theme = theme === "auto" ? "light" : theme === "light" ? "dark" : "auto";
  setTheme(next);
}

// Overlays / toast
let helpOpen = false;
let gotoOpen = false;
let gotoValue = "";
let gotoError: string | null = null;
let toastMessage: string | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(msg: string) {
  toastMessage = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage = null;
    toastTimer = null;
    m.redraw();
  }, 1500);
  m.redraw();
}

async function copyCurrent(char: string) {
  try {
    await navigator.clipboard.writeText(char);
    showToast(`Copied ${char}`);
  } catch {
    showToast("Copy failed");
  }
}

function openHelp() {
  helpOpen = true;
  stopAutoScroll();
  m.redraw();
}

function closeHelp() {
  helpOpen = false;
  m.redraw();
}

function openGoto() {
  gotoOpen = true;
  gotoValue = "";
  gotoError = null;
  stopAutoScroll();
  m.redraw();
}

function closeGoto() {
  gotoOpen = false;
  gotoError = null;
  m.redraw();
}

function parseGoto(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  // Literal syllable character
  if (s.length <= 2) {
    const cp = s.codePointAt(0);
    if (cp && cp >= HANGUL_SYLLABLES.rangeStart && cp <= HANGUL_SYLLABLES.rangeEnd) {
      return cp - HANGUL_SYLLABLES.rangeStart;
    }
  }
  // "position/N" or "pos/N"
  const posMatch = s.match(/^(?:position|pos)[/:=](\d+)$/i);
  if (posMatch) {
    const pos = parseInt(posMatch[1], 10);
    if (pos >= 1 && pos <= SYLLABLE_COUNT) return pos - 1;
  }
  // Hex code point (U+AC00, 0xAC00, #AC00, AC00)
  const hexMatch = s.match(/^(?:u\+|0x|#)?([0-9a-f]+)$/i);
  if (hexMatch) {
    const n = parseInt(hexMatch[1], 16);
    if (n >= HANGUL_SYLLABLES.rangeStart && n <= HANGUL_SYLLABLES.rangeEnd) {
      return n - HANGUL_SYLLABLES.rangeStart;
    }
  }
  // 1-based position (plain digits)
  if (/^\d+$/.test(s)) {
    const pos = parseInt(s, 10);
    if (pos >= 1 && pos <= SYLLABLE_COUNT) return pos - 1;
  }
  // Revised-Romanization lookup (e.g. "han", "ga", "geul")
  if (/^[a-z]+$/i.test(s)) {
    const idx = romanToIndex(s);
    if (idx !== null) return idx;
  }
  return null;
}

function submitGoto() {
  const target = parseGoto(gotoValue);
  if (target === null) {
    gotoError = "Enter a syllable (가), hex (AC00), or position (1–11172).";
    m.redraw();
    return;
  }
  setIndex(target);
  closeGoto();
}

function renderJamo(jamo: JamoInfo) {
  return (
    <div class="text-center">
      <div class="text-[clamp(1.8rem,8vw,3.5rem)] leading-[1.1]">{jamo.compatChar}</div>
      <small class="opacity-60 text-[clamp(0.55rem,2.5vw,0.75rem)]">{jamo.roleName}</small>
      <br />
      <small class="opacity-50 font-mono text-[clamp(0.5rem,2vw,0.7rem)]">{jamo.compatHex}</small>
    </div>
  );
}

const iconBtn =
  "w-9 h-9 flex items-center justify-center rounded-md border border-current/15 " +
  "bg-white/70 dark:bg-black/70 backdrop-blur-sm opacity-60 hover:opacity-100 " +
  "transition-opacity text-[1rem] leading-none select-none cursor-pointer";

function themeIcon(): string {
  if (theme === "light") return "☀";
  if (theme === "dark") return "☾";
  return "◐";
}

function Toolbar() {
  const bookmarked = bookmarks.has(index);
  const playing = isAutoScrolling();
  return (
    <div class="fixed top-2 right-2 flex gap-1.5 z-20">
      <button
        type="button"
        class={iconBtn}
        aria-label={playing ? "Pause auto-scroll" : "Start auto-scroll"}
        title={playing ? "Pause (a)" : "Auto-scroll (a)"}
        aria-pressed={playing}
        onclick={toggleAutoScroll}
      >
        {playing ? "⏸" : "▶"}
      </button>
      <button
        type="button"
        class={iconBtn}
        aria-label={bookmarked ? "Remove bookmark" : "Bookmark this syllable"}
        title={bookmarked ? "Unbookmark (b)" : "Bookmark (b)"}
        aria-pressed={bookmarked}
        onclick={toggleBookmark}
      >
        {bookmarked ? "★" : "☆"}
      </button>
      <button
        type="button"
        class={iconBtn}
        aria-label="List bookmarks"
        title="List bookmarks (l)"
        onclick={openList}
      >
        ≡
      </button>
      <button
        type="button"
        class={iconBtn}
        aria-label={`Theme: ${theme} (click to cycle)`}
        title={`Theme: ${theme}`}
        onclick={cycleTheme}
      >
        {themeIcon()}
      </button>
      <button
        type="button"
        class={iconBtn}
        aria-label="Go to syllable"
        title="Go to (/)"
        onclick={openGoto}
      >
        /
      </button>
      <button type="button" class={iconBtn} aria-label="Help" title="Help (?)" onclick={openHelp}>
        ?
      </button>
    </div>
  );
}

function HelpOverlay() {
  if (!helpOpen) return null;
  return (
    <div
      class="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4"
      onclick={closeHelp}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        class="max-w-md w-full rounded-lg bg-white text-black dark:bg-neutral-900 dark:text-white p-5 shadow-xl border border-current/10"
        onclick={(e: MouseEvent) => e.stopPropagation()}
      >
        <div class="flex items-center justify-between mb-3">
          <h2 class="m-0 text-lg font-semibold">Keyboard shortcuts</h2>
          <button
            type="button"
            class="opacity-60 hover:opacity-100 text-xl leading-none cursor-pointer"
            aria-label="Close"
            onclick={closeHelp}
          >
            ×
          </button>
        </div>
        <table class="w-full text-sm">
          <tbody>
            {[
              ["↑ / ↓", "Previous / next syllable"],
              ["← / →", "±28 (vowel row)"],
              ["PgUp / PgDn", "±588 (initial row)"],
              ["Home / End", "Start / end of current initial"],
              ["Shift + ↑ / ↓", "Cycle initial consonant"],
              ["Shift + ← / →", "Cycle vowel"],
              ["Shift + PgUp / PgDn", "Cycle trailing consonant"],
              ["/", "Go to syllable, hex, position, or romanization"],
              ["?", "Toggle this help"],
              ["c", "Copy current syllable"],
              ["a", "Toggle auto-scroll (play/pause)"],
              ["b", "Bookmark current syllable"],
              ["l", "List bookmarks"],
              ["t", "Cycle theme"],
              ["Esc", "Close overlay"],
            ].map(([k, v]) => (
              <tr class="border-t border-current/10">
                <td class="py-1.5 pr-3 font-mono whitespace-nowrap">{k}</td>
                <td class="py-1.5 opacity-80">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p class="mt-3 text-xs opacity-60">
          Also: click the big syllable to copy it. Scroll, swipe, or press{" "}
          <kbd class="font-mono">a</kbd> to auto-advance.
        </p>
      </div>
    </div>
  );
}

const GotoOverlay: m.Component = {
  oncreate() {
    const el = document.getElementById("goto-input") as HTMLInputElement | null;
    if (el) el.focus();
  },
  view() {
    if (!gotoOpen) return null;
    return (
      <div
        class="fixed inset-0 z-30 flex items-start justify-center bg-black/60 p-4 pt-[20vh]"
        onclick={closeGoto}
        role="dialog"
        aria-modal="true"
        aria-label="Go to syllable"
      >
        <div
          class="max-w-md w-full rounded-lg bg-white text-black dark:bg-neutral-900 dark:text-white p-5 shadow-xl border border-current/10"
          onclick={(e: MouseEvent) => e.stopPropagation()}
        >
          <label class="block text-sm mb-2 opacity-80" for="goto-input">
            Go to: syllable (가), hex (AC00), position (1–11172), or romanization (han)
          </label>
          <input
            id="goto-input"
            type="text"
            class="w-full px-3 py-2 rounded border border-current/20 bg-transparent font-mono outline-none focus:border-current/60"
            value={gotoValue}
            autocomplete="off"
            spellcheck={false}
            oninput={(e: InputEvent) => {
              gotoValue = (e.target as HTMLInputElement).value;
              gotoError = null;
            }}
            onkeydown={(e: KeyboardEvent) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitGoto();
              } else if (e.key === "Escape") {
                e.preventDefault();
                closeGoto();
              }
            }}
          />
          {gotoError && <p class="mt-2 text-sm text-red-500">{gotoError}</p>}
          <div class="mt-3 flex justify-end gap-2">
            <button
              type="button"
              class="px-3 py-1.5 rounded border border-current/20 opacity-70 hover:opacity-100 cursor-pointer"
              onclick={closeGoto}
            >
              Cancel
            </button>
            <button
              type="button"
              class="px-3 py-1.5 rounded bg-black text-white dark:bg-white dark:text-black cursor-pointer"
              onclick={submitGoto}
            >
              Go
            </button>
          </div>
        </div>
      </div>
    );
  },
};

function BookmarksOverlay() {
  if (!listOpen) return null;
  const items = [...bookmarks].toSorted((a, b) => a - b);
  return (
    <div
      class="fixed inset-0 z-30 flex items-start justify-center bg-black/60 p-4 pt-[10vh]"
      onclick={closeList}
      role="dialog"
      aria-modal="true"
      aria-label="Bookmarks"
    >
      <div
        class="max-w-md w-full rounded-lg bg-white text-black dark:bg-neutral-900 dark:text-white p-5 shadow-xl border border-current/10 max-h-[75vh] overflow-auto"
        onclick={(e: MouseEvent) => e.stopPropagation()}
      >
        <div class="flex items-center justify-between mb-3">
          <h2 class="m-0 text-lg font-semibold">Bookmarks ({items.length})</h2>
          <button
            type="button"
            class="opacity-60 hover:opacity-100 text-xl leading-none cursor-pointer"
            aria-label="Close"
            onclick={closeList}
          >
            ×
          </button>
        </div>
        {items.length === 0 ? (
          <p class="opacity-60 text-sm m-0">
            No bookmarks yet. Press <kbd class="font-mono">b</kbd> to bookmark the current syllable.
          </p>
        ) : (
          <div class="grid grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] gap-2">
            {items.map((i) => {
              const c = String.fromCodePoint(HANGUL_SYLLABLES.rangeStart + i);
              return (
                <button
                  type="button"
                  class="flex flex-col items-center gap-0.5 py-2 rounded border border-current/10 hover:bg-current/5 cursor-pointer"
                  onclick={() => {
                    setIndex(i);
                    closeList();
                  }}
                  title={`${c} · ${romanize(HANGUL_SYLLABLES.rangeStart + i)}`}
                >
                  <span class="text-2xl leading-none">{c}</span>
                  <span class="font-mono text-[0.65rem] opacity-60">
                    {romanize(HANGUL_SYLLABLES.rangeStart + i)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Toast() {
  if (!toastMessage) return null;
  return (
    <div
      class="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-3 py-1.5 rounded-md bg-black text-white dark:bg-white dark:text-black text-sm shadow-lg"
      role="status"
      aria-live="polite"
    >
      {toastMessage}
    </div>
  );
}

const SyllableView: m.Component = {
  oncreate(vnode: any) {
    // Theme init
    theme = loadTheme();
    mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    applyTheme(theme);
    loadBookmarks();
    const mqListener = () => {
      if (theme === "auto") applyTheme("auto");
    };
    mediaQuery.addEventListener("change", mqListener);
    vnode._mq = mqListener;

    const wheel = (e: WheelEvent) => {
      if (helpOpen || gotoOpen || listOpen) return;
      e.preventDefault();
      advance(e.deltaY > 0 ? 1 : -1);
    };
    vnode.dom.addEventListener("wheel", wheel, { passive: false });
    vnode._wheel = wheel;

    let touchY = 0;
    let touchAccum = 0;
    const TOUCH_THRESHOLD = 30;
    const touchStart = (e: TouchEvent) => {
      if (helpOpen || gotoOpen || listOpen) return;
      touchY = e.touches[0].clientY;
      touchAccum = 0;
    };
    const touchMove = (e: TouchEvent) => {
      if (helpOpen || gotoOpen || listOpen) return;
      e.preventDefault();
      const y = e.touches[0].clientY;
      touchAccum += touchY - y;
      touchY = y;
      while (Math.abs(touchAccum) >= TOUCH_THRESHOLD) {
        const dir = touchAccum > 0 ? 1 : -1;
        advance(dir);
        touchAccum -= dir * TOUCH_THRESHOLD;
      }
    };
    vnode.dom.addEventListener("touchstart", touchStart, { passive: true });
    vnode.dom.addEventListener("touchmove", touchMove, { passive: false });
    vnode._touchStart = touchStart;
    vnode._touchMove = touchMove;

    const key = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      if (e.key === "Escape") {
        if (listOpen) {
          e.preventDefault();
          closeList();
          return;
        }
        if (gotoOpen) {
          e.preventDefault();
          closeGoto();
          return;
        }
        if (helpOpen) {
          e.preventDefault();
          closeHelp();
          return;
        }
      }

      if (helpOpen || gotoOpen || listOpen) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Composable explorer: Shift + ↑/↓/←/→ cycles a single jamo
      if (e.shiftKey) {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            cycleLeading(1);
            return;
          case "ArrowUp":
            e.preventDefault();
            cycleLeading(-1);
            return;
          case "ArrowRight":
            e.preventDefault();
            cycleVowel(1);
            return;
          case "ArrowLeft":
            e.preventDefault();
            cycleVowel(-1);
            return;
          case "PageDown":
            e.preventDefault();
            cycleTrailing(1);
            return;
          case "PageUp":
            e.preventDefault();
            cycleTrailing(-1);
            return;
        }
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          advance(1);
          break;
        case "ArrowUp":
          e.preventDefault();
          advance(-1);
          break;
        case "ArrowRight":
          e.preventDefault();
          jumpBy(T_COUNT);
          break;
        case "ArrowLeft":
          e.preventDefault();
          jumpBy(-T_COUNT);
          break;
        case "PageDown":
          e.preventDefault();
          jumpBy(N_COUNT);
          break;
        case "PageUp":
          e.preventDefault();
          jumpBy(-N_COUNT);
          break;
        case "Home":
          e.preventDefault();
          snapToInitialStart();
          break;
        case "End":
          e.preventDefault();
          snapToInitialEnd();
          break;
        case "?":
        case "h":
        case "H":
          e.preventDefault();
          openHelp();
          break;
        case "/":
        case "g":
        case "G":
          e.preventDefault();
          openGoto();
          break;
        case "c":
        case "C": {
          e.preventDefault();
          const cp = HANGUL_SYLLABLES.rangeStart + index;
          copyCurrent(String.fromCodePoint(cp));
          break;
        }
        case "t":
        case "T":
          e.preventDefault();
          cycleTheme();
          break;
        case "a":
        case "A":
          e.preventDefault();
          toggleAutoScroll();
          break;
        case "b":
        case "B":
          e.preventDefault();
          toggleBookmark();
          break;
        case "l":
        case "L":
          e.preventDefault();
          openList();
          break;
      }
    };
    document.addEventListener("keydown", key);
    vnode._key = key;

    const hashChange = () => {
      index = readHash();
      m.redraw();
    };
    window.addEventListener("hashchange", hashChange);
    vnode._hash = hashChange;

    // Warm up optical centering once the font is ready
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        fontsReady = true;
        glyphOffsetCache.clear();
        m.redraw();
        return undefined;
      });
    }
  },

  onremove(vnode: any) {
    vnode.dom.removeEventListener("wheel", vnode._wheel);
    vnode.dom.removeEventListener("touchstart", vnode._touchStart);
    vnode.dom.removeEventListener("touchmove", vnode._touchMove);
    document.removeEventListener("keydown", vnode._key);
    window.removeEventListener("hashchange", vnode._hash);
    if (mediaQuery && vnode._mq) mediaQuery.removeEventListener("change", vnode._mq);
    if (autoScrollTimer) clearInterval(autoScrollTimer);
    if (hashTimer) clearTimeout(hashTimer);
    if (toastTimer) clearTimeout(toastTimer);
  },

  view() {
    const cp = HANGUL_SYLLABLES.rangeStart + index;
    const info = getCharInfo(cp);
    const jamo = decomposeSyllable(cp);
    const enc = getEncodings(cp);
    const roman = romanize(cp);
    const words = examples[String(index)] ?? [];
    document.title = `${info.char} — kongli.sh`;

    return (
      <div class="flex flex-col items-center h-screen h-dvh overflow-hidden select-none cursor-ns-resize touch-none px-2 box-border bg-white text-black dark:bg-black dark:text-white transition-colors">
        {Toolbar()}

        <small class="opacity-40 font-mono py-2 text-[clamp(0.7rem,2.5vw,0.9rem)] flex-shrink-0">
          {index + 1}/{SYLLABLE_COUNT.toLocaleString()}
        </small>

        <div
          class="flex-1 flex items-center justify-center min-h-0 overflow-hidden w-full"
          aria-live="polite"
          aria-atomic="true"
          aria-label={`Hangul syllable ${info.char}, code point ${info.hex}`}
        >
          <div
            class="text-[min(35vw,45vh,20rem)] leading-none cursor-pointer will-change-transform"
            style={`transform: translate(${computeGlyphOffset(info.char).dx}em, ${computeGlyphOffset(info.char).dy}em)`}
            title="Click to copy"
            onclick={(e: MouseEvent) => {
              e.stopPropagation();
              copyCurrent(info.char);
            }}
          >
            {info.char}
          </div>
        </div>

        <div class="flex-shrink-0 flex flex-col items-center w-full pb-[env(safe-area-inset-bottom,0.5rem)]">
          <p class="m-0 font-mono opacity-70 text-[clamp(0.9rem,3.5vw,1.4rem)]">
            {info.hex} · <span class="italic">{roman}</span>
          </p>
          <small class="opacity-45 font-mono text-center leading-relaxed text-[clamp(0.6rem,2.5vw,0.85rem)]">
            UTF-8: {enc.utf8} · UTF-16: {enc.utf16} · UTF-32: {enc.utf32}
          </small>
          <div
            class="flex flex-wrap gap-x-2 gap-y-1 justify-center mt-1 opacity-70 text-[clamp(0.75rem,2.8vw,1rem)] min-h-[1.5em]"
            aria-label={words.length > 0 ? `Example words: ${words.join(", ")}` : undefined}
          >
            {words.length === 0 ? (
              <span aria-hidden="true" class="opacity-0 select-none">
                &nbsp;
              </span>
            ) : (
              words.map((w, i) => [
                i > 0 && (
                  <span class="opacity-40 select-none" aria-hidden="true">
                    ·
                  </span>
                ),
                <span class="whitespace-nowrap">{w}</span>,
              ])
            )}
          </div>

          <div class="grid grid-cols-7 items-center justify-items-center w-full max-w-[40rem] mt-2 py-2 border-t border-current/10">
            {renderJamo(jamo.leading)}
            <span class="text-[clamp(0.9rem,3vw,1.5rem)] opacity-30">+</span>
            {renderJamo(jamo.vowel)}
            <span
              class={
                "text-[clamp(0.9rem,3vw,1.5rem)] opacity-30 " +
                (jamo.trailing ? "visible" : "invisible")
              }
            >
              +
            </span>
            <div class={jamo.trailing ? "text-center" : "text-center invisible"}>
              {renderJamo(jamo.trailing || jamo.vowel)}
            </div>
            <span class="text-[clamp(0.9rem,3vw,1.5rem)] opacity-30">=</span>
            <div class="text-center">
              <div class="text-[clamp(1.8rem,8vw,3.5rem)] leading-[1.1]">{info.char}</div>
              <small class="opacity-60 text-[clamp(0.55rem,2.5vw,0.75rem)]">Syllable</small>
            </div>
          </div>
        </div>

        {HelpOverlay()}
        {m(GotoOverlay)}
        {BookmarksOverlay()}
        {Toast()}
      </div>
    );
  },
};

export default SyllableView;
