import m from "mithril";
import {
  HANGUL_SYLLABLES,
  SYLLABLE_COUNT,
  N_COUNT,
  T_COUNT,
  getCharInfo,
  getEncodings,
  decomposeSyllable,
  type JamoInfo,
} from "../data/unicode";

let index = 0;

function readHash(): number {
  const h = location.hash.slice(1);
  if (!h) return 0;
  const cp = parseInt(h, 16);
  if (!isNaN(cp) && cp >= HANGUL_SYLLABLES.rangeStart && cp <= HANGUL_SYLLABLES.rangeEnd) {
    return cp - HANGUL_SYLLABLES.rangeStart;
  }
  const decoded = decodeURIComponent(h);
  if (decoded.length === 1 || decoded.length === 2) {
    const charCp = decoded.codePointAt(0)!;
    if (charCp >= HANGUL_SYLLABLES.rangeStart && charCp <= HANGUL_SYLLABLES.rangeEnd) {
      return charCp - HANGUL_SYLLABLES.rangeStart;
    }
  }
  return 0;
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

let lastScrollTime = 0;
let scrollStreak = 0;

function getStep(): number {
  return Math.min(256, Math.pow(2, Math.floor(scrollStreak / 3)));
}

function setIndex(next: number) {
  index = ((next % SYLLABLE_COUNT) + SYLLABLE_COUNT) % SYLLABLE_COUNT;
  writeHash();
  resetIdle();
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

const IDLE_TIMEOUT = 5000;
const AUTO_SCROLL_INTERVAL = 600;
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

function resetIdle() {
  if (autoScrollTimer) {
    clearInterval(autoScrollTimer);
    autoScrollTimer = null;
  }
  startIdleTimer();
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

const SyllableView: m.Component = {
  oncreate(vnode: any) {
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      advance(e.deltaY > 0 ? 1 : -1);
    };
    vnode.dom.addEventListener("wheel", wheel, { passive: false });
    vnode._wheel = wheel;

    let touchY = 0;
    let touchAccum = 0;
    const TOUCH_THRESHOLD = 30;
    const touchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
      touchAccum = 0;
      resetIdle();
    };
    const touchMove = (e: TouchEvent) => {
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

    startIdleTimer();
  },

  onremove(vnode: any) {
    vnode.dom.removeEventListener("wheel", vnode._wheel);
    vnode.dom.removeEventListener("touchstart", vnode._touchStart);
    vnode.dom.removeEventListener("touchmove", vnode._touchMove);
    document.removeEventListener("keydown", vnode._key);
    window.removeEventListener("hashchange", vnode._hash);
    if (idleTimer) clearTimeout(idleTimer);
    if (autoScrollTimer) clearInterval(autoScrollTimer);
    if (hashTimer) clearTimeout(hashTimer);
  },

  view() {
    const cp = HANGUL_SYLLABLES.rangeStart + index;
    const info = getCharInfo(cp);
    const jamo = decomposeSyllable(cp);
    const enc = getEncodings(cp);
    document.title = `${info.char} — kongli.sh`;

    return (
      <div class="flex flex-col items-center h-screen h-dvh overflow-hidden select-none cursor-ns-resize touch-none px-2 box-border">
        <small class="opacity-40 font-mono py-2 text-[clamp(0.7rem,2.5vw,0.9rem)] flex-shrink-0">
          {index + 1}/{SYLLABLE_COUNT.toLocaleString()}
        </small>

        <div
          class="flex-1 flex items-center justify-center min-h-0 overflow-hidden w-full"
          aria-live="polite"
          aria-atomic="true"
          aria-label={`Hangul syllable ${info.char}, code point ${info.hex}`}
        >
          <div class="text-[min(35vw,45vh,20rem)] leading-none">{info.char}</div>
        </div>

        <div class="flex-shrink-0 flex flex-col items-center w-full pb-[env(safe-area-inset-bottom,0.5rem)]">
          <p class="m-0 font-mono opacity-70 text-[clamp(0.9rem,3.5vw,1.4rem)]">{info.hex}</p>
          <small class="opacity-45 font-mono text-center leading-relaxed text-[clamp(0.6rem,2.5vw,0.85rem)]">
            UTF-8: {enc.utf8} · UTF-16: {enc.utf16} · UTF-32: {enc.utf32}
          </small>

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
      </div>
    );
  },
};

export default SyllableView;
