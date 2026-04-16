// Pure navigation and parsing helpers. No DOM, no localStorage, no Mithril,
// no module-level state. Extracted from SyllableView so they can be unit
// tested and re-used. All callers pass the state they care about explicitly.

import {
  HANGUL_SYLLABLES,
  SYLLABLE_COUNT,
  L_COUNT,
  V_COUNT,
  N_COUNT,
  T_COUNT,
  romanToIndex,
} from "./data/unicode";

export interface Locks {
  l: number | null;
  v: number | null;
  t: number | null;
}

export const NO_LOCKS: Locks = { l: null, v: null, t: null };

export type NeighborAxis = "L" | "V" | "T";

export function wrapIndex(n: number, idx: number): number {
  return ((idx % n) + n) % n;
}

export function clampIndex(n: number, idx: number): number {
  return Math.max(0, Math.min(n - 1, idx));
}

export function decompose(i: number): [number, number, number] {
  return [Math.floor(i / N_COUNT), Math.floor((i % N_COUNT) / T_COUNT), i % T_COUNT];
}

export function compose(l: number, v: number, t: number): number {
  return l * N_COUNT + v * T_COUNT + t;
}

export function anyLock(locks: Locks): boolean {
  return locks.l !== null || locks.v !== null || locks.t !== null;
}

export function matchesLock(idx: number, locks: Locks): boolean {
  const [l, v, t] = decompose(idx);
  if (locks.l !== null && l !== locks.l) return false;
  if (locks.v !== null && v !== locks.v) return false;
  if (locks.t !== null && t !== locks.t) return false;
  return true;
}

export function lockedTotal(locks: Locks): number {
  let total = 1;
  if (locks.l === null) total *= L_COUNT;
  if (locks.v === null) total *= V_COUNT;
  if (locks.t === null) total *= T_COUNT;
  return total;
}

export function lockedPosition(idx: number, locks: Locks): number {
  const [l, v, t] = decompose(idx);
  let pos = 0;
  if (locks.l === null) pos = pos * L_COUNT + l;
  if (locks.v === null) pos = pos * V_COUNT + v;
  if (locks.t === null) pos = pos * T_COUNT + t;
  return pos;
}

// Step `delta` positions forward/back through the syllable space, skipping
// over any syllable that does not match the active locks. Wraps modulo
// SYLLABLE_COUNT.
export function stepWithLocks(from: number, delta: number, locks: Locks): number {
  if (!anyLock(locks)) return from + delta;
  const dir = delta > 0 ? 1 : -1;
  let remaining = Math.abs(delta);
  let cur = from;
  const n = SYLLABLE_COUNT;
  let safety = n;
  while (remaining > 0 && safety-- > 0) {
    cur = wrapIndex(n, cur + dir);
    if (matchesLock(cur, locks)) remaining--;
  }
  return cur;
}

// Axis heuristic for the neighbor strip. See comment in SyllableView for
// the design rationale.
export function pickNeighborAxis(locks: Locks): NeighborAxis | null {
  const lCount = locks.l !== null ? 1 : 0;
  const vCount = locks.v !== null ? 1 : 0;
  const tCount = locks.t !== null ? 1 : 0;
  const locked = lCount + vCount + tCount;
  if (locked === 3) return null;
  if (locked === 2) {
    if (!lCount) return "L";
    if (!vCount) return "V";
    return "T";
  }
  if (lCount) return "V";
  if (vCount) return "L";
  return "V";
}

export function neighborIndex(axis: NeighborAxis, currentIdx: number, delta: number): number {
  const [l, v, t] = decompose(currentIdx);
  if (axis === "L") {
    const nl = wrapIndex(L_COUNT, l + delta);
    return compose(nl, v, t);
  }
  if (axis === "V") {
    const nv = wrapIndex(V_COUNT, v + delta);
    return compose(l, nv, t);
  }
  const nt = wrapIndex(T_COUNT, t + delta);
  return compose(l, v, nt);
}

// Parse a user-supplied "go to" string. Supports:
//   - literal syllable character (가 …)
//   - "position/N" or "pos/N" or plain digits (1-based)
//   - hex code point (U+AC00, 0xAC00, #AC00, AC00)
//   - revised-romanization lookup (han, ga, geul …)
// Returns 0-based syllable index or null on failure.
export function parseGoto(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  if (s.length <= 2) {
    const cp = s.codePointAt(0);
    if (cp && cp >= HANGUL_SYLLABLES.rangeStart && cp <= HANGUL_SYLLABLES.rangeEnd) {
      return cp - HANGUL_SYLLABLES.rangeStart;
    }
  }
  const posMatch = s.match(/^(?:position|pos)[/:=](\d+)$/i);
  if (posMatch) {
    const pos = parseInt(posMatch[1], 10);
    if (pos >= 1 && pos <= SYLLABLE_COUNT) return pos - 1;
  }
  const hexMatch = s.match(/^(?:u\+|0x|#)?([0-9a-f]+)$/i);
  if (hexMatch) {
    const n = parseInt(hexMatch[1], 16);
    if (n >= HANGUL_SYLLABLES.rangeStart && n <= HANGUL_SYLLABLES.rangeEnd) {
      return n - HANGUL_SYLLABLES.rangeStart;
    }
  }
  if (/^\d+$/.test(s)) {
    const pos = parseInt(s, 10);
    if (pos >= 1 && pos <= SYLLABLE_COUNT) return pos - 1;
  }
  if (/^[a-z]+$/i.test(s)) {
    const idx = romanToIndex(s);
    if (idx !== null) return idx;
  }
  return null;
}
