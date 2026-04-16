import { expect, test, describe } from "bun:test";
import {
  decompose,
  compose,
  wrapIndex,
  clampIndex,
  anyLock,
  matchesLock,
  lockedTotal,
  lockedPosition,
  stepWithLocks,
  pickNeighborAxis,
  neighborIndex,
  parseGoto,
  NO_LOCKS,
  type Locks,
} from "./nav";
import { SYLLABLE_COUNT, L_COUNT, V_COUNT, T_COUNT } from "./data/unicode";

// 가 = AC00, index 0
// 한 = D55C, index = D55C - AC00 = 0x95C = 2396
const 가 = 0;
const 한 = 0xd55c - 0xac00;

describe("wrapIndex / clampIndex", () => {
  test("wraps negative", () => expect(wrapIndex(10, -1)).toBe(9));
  test("wraps positive", () => expect(wrapIndex(10, 11)).toBe(1));
  test("clamps below", () => expect(clampIndex(10, -5)).toBe(0));
  test("clamps above", () => expect(clampIndex(10, 99)).toBe(9));
});

describe("decompose / compose round-trip", () => {
  test("0 → [0,0,0]", () => expect(decompose(0)).toEqual([0, 0, 0]));
  test("한 decomposes", () => {
    const [l, v, t] = decompose(한);
    expect(l).toBe(18); // ㅎ
    expect(v).toBe(0); // ㅏ
    expect(t).toBe(4); // ㄴ
  });
  test("compose(decompose(i)) === i for random indices", () => {
    for (const i of [0, 1, 99, 1000, 한, SYLLABLE_COUNT - 1]) {
      const [l, v, t] = decompose(i);
      expect(compose(l, v, t)).toBe(i);
    }
  });
});

describe("locks", () => {
  test("anyLock: NO_LOCKS is false", () => expect(anyLock(NO_LOCKS)).toBe(false));
  test("anyLock: one set is true", () => expect(anyLock({ l: 0, v: null, t: null })).toBe(true));
  test("matchesLock: unlocked matches everything", () =>
    expect(matchesLock(12345, NO_LOCKS)).toBe(true));
  test("matchesLock: mismatched L rejects", () =>
    expect(matchesLock(한, { l: 0, v: null, t: null })).toBe(false));
  test("matchesLock: matched L + V accepts", () =>
    expect(matchesLock(한, { l: 18, v: 0, t: null })).toBe(true));
  test("lockedTotal: no locks is full count", () =>
    expect(lockedTotal(NO_LOCKS)).toBe(SYLLABLE_COUNT));
  test("lockedTotal: L locked → V_COUNT * T_COUNT", () =>
    expect(lockedTotal({ l: 0, v: null, t: null })).toBe(V_COUNT * T_COUNT));
  test("lockedTotal: all locked → 1", () => expect(lockedTotal({ l: 0, v: 0, t: 0 })).toBe(1));
  test("lockedPosition monotonic under L lock", () => {
    const locks: Locks = { l: 18, v: null, t: null };
    let prev = -1;
    for (let v = 0; v < V_COUNT; v++) {
      for (let t = 0; t < T_COUNT; t++) {
        const i = compose(18, v, t);
        const p = lockedPosition(i, locks);
        expect(p).toBeGreaterThan(prev);
        prev = p;
      }
    }
  });
});

describe("stepWithLocks", () => {
  test("no locks: identity + delta", () => expect(stepWithLocks(100, 5, NO_LOCKS)).toBe(105));
  test("no locks: negative delta", () => expect(stepWithLocks(100, -5, NO_LOCKS)).toBe(95));
  test("L-locked: stays within leading-ㅎ cluster forward", () => {
    const locks: Locks = { l: 18, v: null, t: null };
    // Starting at 한 (l=18,v=0,t=4), +1 should land on next matching index (ㅎ_).
    const next = stepWithLocks(한, 1, locks);
    expect(decompose(next)[0]).toBe(18);
    expect(next).toBeGreaterThan(한);
  });
  test("L-locked: backward also respects lock", () => {
    const locks: Locks = { l: 18, v: null, t: null };
    const prev = stepWithLocks(한, -1, locks);
    expect(decompose(prev)[0]).toBe(18);
  });
  test("all-matching lock: deterministic", () => {
    const locks: Locks = { l: 0, v: 0, t: 0 };
    // Only one matching syllable (가). Stepping +1 wraps back to 가.
    expect(stepWithLocks(가, 1, locks)).toBe(가);
  });
});

describe("pickNeighborAxis", () => {
  test("all unlocked → V", () => expect(pickNeighborAxis(NO_LOCKS)).toBe("V"));
  test("L locked alone → V", () => expect(pickNeighborAxis({ l: 0, v: null, t: null })).toBe("V"));
  test("V locked alone → L", () => expect(pickNeighborAxis({ l: null, v: 0, t: null })).toBe("L"));
  test("T locked alone → V", () => expect(pickNeighborAxis({ l: null, v: null, t: 0 })).toBe("V"));
  test("L+V locked → T", () => expect(pickNeighborAxis({ l: 0, v: 0, t: null })).toBe("T"));
  test("L+T locked → V", () => expect(pickNeighborAxis({ l: 0, v: null, t: 0 })).toBe("V"));
  test("V+T locked → L", () => expect(pickNeighborAxis({ l: null, v: 0, t: 0 })).toBe("L"));
  test("all locked → null", () => expect(pickNeighborAxis({ l: 0, v: 0, t: 0 })).toBe(null));
});

describe("neighborIndex", () => {
  test("L axis +1 changes leading only", () => {
    const i = neighborIndex("L", 한, 1);
    const [l, v, t] = decompose(i);
    expect(l).toBe((18 + 1) % L_COUNT);
    expect(v).toBe(0);
    expect(t).toBe(4);
  });
  test("V axis -1 wraps", () => {
    const i = neighborIndex("V", 가, -1);
    const [l, v, t] = decompose(i);
    expect(l).toBe(0);
    expect(v).toBe(V_COUNT - 1);
    expect(t).toBe(0);
  });
  test("T axis 0 returns self", () => expect(neighborIndex("T", 한, 0)).toBe(한));
});

describe("parseGoto", () => {
  test("empty → null", () => expect(parseGoto("")).toBe(null));
  test("literal 가 → 0", () => expect(parseGoto("가")).toBe(0));
  test("literal 한 → correct index", () => expect(parseGoto("한")).toBe(한));
  test("hex U+AC00 → 0", () => expect(parseGoto("U+AC00")).toBe(0));
  test("hex 0xAC00 → 0", () => expect(parseGoto("0xAC00")).toBe(0));
  test("hex #AC00 → 0", () => expect(parseGoto("#AC00")).toBe(0));
  test("hex bare AC00 → 0", () => expect(parseGoto("AC00")).toBe(0));
  test("hex out of range → null", () => expect(parseGoto("U+1234")).toBe(null));
  test("position/N (1-based)", () => expect(parseGoto("position/1")).toBe(0));
  test("pos/N (1-based)", () => expect(parseGoto("pos/11172")).toBe(SYLLABLE_COUNT - 1));
  test("plain digit 1 → 0", () => expect(parseGoto("1")).toBe(0));
  test("plain digit 11172 → last", () => expect(parseGoto("11172")).toBe(SYLLABLE_COUNT - 1));
  test("plain digit 11173 → null", () => expect(parseGoto("11173")).toBe(null));
  test("romanization han → 한", () => expect(parseGoto("han")).toBe(한));
  test("romanization ga → 가", () => expect(parseGoto("ga")).toBe(0));
  test("romanization bogus → null", () => expect(parseGoto("xyzzy")).toBe(null));
  test("trims whitespace", () => expect(parseGoto("  한  ")).toBe(한));
});
