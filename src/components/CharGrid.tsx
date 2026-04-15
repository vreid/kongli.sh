import m from "mithril";
import {
  HANGUL_SYLLABLES,
  SYLLABLE_COUNT,
  getCharInfo,
  getEncodings,
  decomposeSyllable,
  type JamoInfo,
} from "../data/unicode";

let index = 0;

// Read index from hash on load: #AC00 or #가
function readHash(): number {
  const h = location.hash.slice(1);
  if (!h) return 0;
  // Try hex code point first (e.g. #AC00)
  const cp = parseInt(h, 16);
  if (!isNaN(cp) && cp >= HANGUL_SYLLABLES.rangeStart && cp <= HANGUL_SYLLABLES.rangeEnd) {
    return cp - HANGUL_SYLLABLES.rangeStart;
  }
  // Try literal character (e.g. #가)
  const decoded = decodeURIComponent(h);
  if (decoded.length === 1 || decoded.length === 2) {
    const charCp = decoded.codePointAt(0)!;
    if (charCp >= HANGUL_SYLLABLES.rangeStart && charCp <= HANGUL_SYLLABLES.rangeEnd) {
      return charCp - HANGUL_SYLLABLES.rangeStart;
    }
  }
  return 0;
}

function writeHash() {
  const cp = HANGUL_SYLLABLES.rangeStart + index;
  history.replaceState(null, "", "#" + String.fromCodePoint(cp));
}

index = readHash();

// Scroll acceleration: rapid scrolling increases step size
let lastScrollTime = 0;
let scrollStreak = 0;

function getStep(): number {
  // Exponential: 1, 2, 4, 8, 16, 32, 64... capped at 200
  return Math.min(256, Math.pow(2, Math.floor(scrollStreak / 3)));
}

function resetIdle() {
  lastActivityTime = Date.now();
  if (autoScrollTimer) {
    clearInterval(autoScrollTimer);
    autoScrollTimer = null;
  }
  startIdleTimer();
}

function advance(delta: number) {
  const now = Date.now();
  if (now - lastScrollTime < 150) {
    scrollStreak++;
  } else {
    scrollStreak = 0;
  }
  lastScrollTime = now;

  const step = getStep() * delta;
  index = ((index + step) % SYLLABLE_COUNT + SYLLABLE_COUNT) % SYLLABLE_COUNT;
  writeHash();
  resetIdle();
  m.redraw();
}

// Auto-scroll after idle
const IDLE_TIMEOUT = 5000;
const AUTO_SCROLL_INTERVAL = 600;
let lastActivityTime = Date.now();
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let autoScrollTimer: ReturnType<typeof setInterval> | null = null;

function startAutoScroll() {
  if (autoScrollTimer) return;
  autoScrollTimer = setInterval(() => {
    index = (index + 1) % SYLLABLE_COUNT;
    writeHash();
    m.redraw();
  }, AUTO_SCROLL_INTERVAL);
}

function startIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    startAutoScroll();
  }, IDLE_TIMEOUT);
}

function renderJamo(jamo: JamoInfo) {
  return (
    <div style="text-align:center">
      <div style="font-size:min(8vw,8vh);line-height:1.1">{jamo.compatChar}</div>
      <small style="opacity:0.6">{jamo.roleName}</small>
      <br />
      <small style="opacity:0.5;font-family:monospace">{jamo.compatHex}</small>
    </div>
  );
}

const CharView: m.Component = {
  oncreate(vnode: any) {
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      advance(e.deltaY > 0 ? 1 : -1);
    };
    vnode.dom.addEventListener("wheel", wheel, { passive: false });
    (vnode as any)._wheel = wheel;

    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); advance(1); }
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); advance(-1); }
    };
    document.addEventListener("keydown", key);
    (vnode as any)._key = key;

    const hashChange = () => {
      index = readHash();
      m.redraw();
    };
    window.addEventListener("hashchange", hashChange);
    (vnode as any)._hash = hashChange;

    // Start idle timer on load
    startIdleTimer();
  },

  onremove(vnode: any) {
    vnode.dom.removeEventListener("wheel", (vnode as any)._wheel);
    document.removeEventListener("keydown", (vnode as any)._key);
    window.removeEventListener("hashchange", (vnode as any)._hash);
    if (idleTimer) clearTimeout(idleTimer);
    if (autoScrollTimer) clearInterval(autoScrollTimer);
  },

  view() {
    const cp = HANGUL_SYLLABLES.rangeStart + index;
    const info = getCharInfo(cp);
    const jamo = decomposeSyllable(cp);
    const enc = getEncodings(cp);
    document.title = `${info.char} — kongli.sh`;

    return (
      <div
        style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;overflow:hidden;user-select:none;cursor:ns-resize"
      >
        {/* Counter at top */}
        <small style="opacity:0.4;font-family:monospace;position:absolute;top:1rem">
          {index + 1}/{SYLLABLE_COUNT.toLocaleString()}
        </small>

        {/* The character */}
        <div style="font-size:min(50vw,50vh);line-height:1">{info.char}</div>

        {/* Code point + encodings */}
        <p style="margin:0.5rem 0 0;font-size:1.4rem;font-family:monospace;opacity:0.7">
          {info.hex}
        </p>
        <small style="opacity:0.45;font-family:monospace;text-align:center;line-height:1.8">
          UTF-8: {enc.utf8} · UTF-16: {enc.utf16} · UTF-32: {enc.utf32}
        </small>

        {/* Jamo decomposition — fixed 7-column grid: L + V + T = S */}
        <div
          style="display:grid;grid-template-columns:5rem 1.5rem 5rem 1.5rem 5rem 1.5rem 5rem;gap:0.5rem;align-items:center;justify-items:center;margin-top:1.5rem;padding:1rem;border-top:1px solid var(--pico-muted-border-color)"
        >
          {renderJamo(jamo.leading)}
          <span style="font-size:1.5rem;opacity:0.3">+</span>
          {renderJamo(jamo.vowel)}
          <span style={`font-size:1.5rem;opacity:0.3;visibility:${jamo.trailing ? "visible" : "hidden"}`}>+</span>
          <div style={`visibility:${jamo.trailing ? "visible" : "hidden"}`}>
            {renderJamo(jamo.trailing || jamo.vowel)}
          </div>
          <span style="font-size:1.5rem;opacity:0.3">=</span>
          <div style="text-align:center">
            <div style="font-size:min(8vw,8vh);line-height:1.1">{info.char}</div>
            <small style="opacity:0.6">Syllable</small>
          </div>
        </div>
      </div>
    );
  },
};

export default CharView;
