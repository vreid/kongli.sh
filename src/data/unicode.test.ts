import { describe, expect, test } from "bun:test";
import {
  HANGUL_SYLLABLES,
  SYLLABLE_COUNT,
  getCharInfo,
  toUtf8Hex,
  decomposeSyllable,
} from "./unicode";

describe("HANGUL_SYLLABLES", () => {
  test("has correct range", () => {
    expect(HANGUL_SYLLABLES.rangeStart).toBe(0xac00);
    expect(HANGUL_SYLLABLES.rangeEnd).toBe(0xd7a3);
  });

  test("has 11172 syllables", () => {
    expect(SYLLABLE_COUNT).toBe(11172);
  });
});

describe("getCharInfo", () => {
  test("returns correct info for 가 (U+AC00)", () => {
    const info = getCharInfo(0xac00);
    expect(info.hex).toBe("U+AC00");
    expect(info.char).toBe("가");
    expect(info.blockName).toBe("Hangul Syllables");
    expect(info.utf8Bytes).toBe("EA B0 80");
  });
});

describe("toUtf8Hex", () => {
  test("ASCII range", () => {
    expect(toUtf8Hex(0x41)).toBe("41");
  });

  test("Korean character", () => {
    expect(toUtf8Hex(0xac00)).toBe("EA B0 80");
  });
});

describe("decomposeSyllable", () => {
  test("가 = ㄱ + ㅏ (no trailing)", () => {
    const d = decomposeSyllable(0xac00);
    expect(d.leading.compatChar).toBe("ㄱ");
    expect(d.vowel.compatChar).toBe("ㅏ");
    expect(d.trailing).toBeNull();
  });

  test("한 = ㅎ + ㅏ + ㄴ", () => {
    const d = decomposeSyllable(0xd55c);
    expect(d.leading.compatChar).toBe("ㅎ");
    expect(d.vowel.compatChar).toBe("ㅏ");
    expect(d.trailing).not.toBeNull();
    expect(d.trailing!.compatChar).toBe("ㄴ");
  });

  test("글 = ㄱ + ㅡ + ㄹ", () => {
    const d = decomposeSyllable(0xae00);
    expect(d.leading.compatChar).toBe("ㄱ");
    expect(d.vowel.compatChar).toBe("ㅡ");
    expect(d.trailing).not.toBeNull();
    expect(d.trailing!.compatChar).toBe("ㄹ");
  });

  test("roles are correct", () => {
    const d = decomposeSyllable(0xd55c);
    expect(d.leading.role).toBe("leading");
    expect(d.vowel.role).toBe("vowel");
    expect(d.trailing!.role).toBe("trailing");
  });

  test("last syllable 힣 decomposes correctly", () => {
    const d = decomposeSyllable(0xd7a3);
    expect(d.leading.compatChar).toBe("ㅎ");
    expect(d.vowel.compatChar).toBe("ㅣ");
    expect(d.trailing).not.toBeNull();
    expect(d.trailing!.compatChar).toBe("ㅎ");
  });
});
