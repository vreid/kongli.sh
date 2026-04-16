export interface UnicodeBlock {
  id: string;
  name: string;
  rangeStart: number;
  rangeEnd: number;
  description: string;
}

export interface CharInfo {
  codePoint: number;
  hex: string;
  char: string;
  blockName: string;
  utf8Bytes: string;
}

export const HANGUL_SYLLABLES: UnicodeBlock = {
  id: "hangul-syllables",
  name: "Hangul Syllables",
  rangeStart: 0xac00,
  rangeEnd: 0xd7a3,
  description: "Precomposed Hangul syllable blocks (가–힣)",
};

export const SYLLABLE_COUNT = HANGUL_SYLLABLES.rangeEnd - HANGUL_SYLLABLES.rangeStart + 1;

// Hangul Jamo decomposition constants
const S_BASE = 0xac00;
const L_BASE = 0x1100;
const V_BASE = 0x1161;
const T_BASE = 0x11a7;
export const L_COUNT = 19;
export const V_COUNT = 21;
export const T_COUNT = 28;
export const N_COUNT = V_COUNT * T_COUNT;

// Compatibility Jamo for display (these render as standalone letters)
export const COMPAT_L: number[] = [
  0x3131, 0x3132, 0x3134, 0x3137, 0x3138, 0x3139, 0x3141, 0x3142, 0x3143, 0x3145, 0x3146, 0x3147,
  0x3148, 0x3149, 0x314a, 0x314b, 0x314c, 0x314d, 0x314e,
];
export const COMPAT_V: number[] = [
  0x314f, 0x3150, 0x3151, 0x3152, 0x3153, 0x3154, 0x3155, 0x3156, 0x3157, 0x3158, 0x3159, 0x315a,
  0x315b, 0x315c, 0x315d, 0x315e, 0x315f, 0x3160, 0x3161, 0x3162, 0x3163,
];
export const COMPAT_T: number[] = [
  0, // no trailing
  0x3131,
  0x3132,
  0x3133,
  0x3134,
  0x3135,
  0x3136,
  0x3137,
  0x3139,
  0x313a,
  0x313b,
  0x313c,
  0x313d,
  0x313e,
  0x313f,
  0x3140,
  0x3141,
  0x3142,
  0x3144,
  0x3145,
  0x3146,
  0x3147,
  0x3148,
  0x314a,
  0x314b,
  0x314c,
  0x314d,
  0x314e,
];

export interface JamoInfo {
  char: string;
  hex: string;
  compatChar: string;
  compatHex: string;
  role: "leading" | "vowel" | "trailing";
  roleName: string;
}

export interface SyllableDecomposition {
  leading: JamoInfo;
  vowel: JamoInfo;
  trailing: JamoInfo | null;
}

function makeJamoInfo(
  jamoCP: number,
  compatCP: number,
  role: "leading" | "vowel" | "trailing",
  roleName: string,
): JamoInfo {
  return {
    char: String.fromCodePoint(jamoCP),
    hex: "U+" + jamoCP.toString(16).toUpperCase().padStart(4, "0"),
    compatChar: String.fromCodePoint(compatCP),
    compatHex: "U+" + compatCP.toString(16).toUpperCase().padStart(4, "0"),
    role,
    roleName,
  };
}

export function decomposeSyllable(codePoint: number): SyllableDecomposition {
  const sIndex = codePoint - S_BASE;
  const lIndex = Math.floor(sIndex / N_COUNT);
  const vIndex = Math.floor((sIndex % N_COUNT) / T_COUNT);
  const tIndex = sIndex % T_COUNT;

  const leading = makeJamoInfo(L_BASE + lIndex, COMPAT_L[lIndex], "leading", "초성 (Initial)");
  const vowel = makeJamoInfo(V_BASE + vIndex, COMPAT_V[vIndex], "vowel", "중성 (Medial)");
  const trailing =
    tIndex > 0 ? makeJamoInfo(T_BASE + tIndex, COMPAT_T[tIndex], "trailing", "종성 (Final)") : null;

  return { leading, vowel, trailing };
}

export function toUtf8Hex(codePoint: number): string {
  const bytes = new TextEncoder().encode(String.fromCodePoint(codePoint));
  return Array.from(bytes)
    .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
    .join(" ");
}

export interface Encodings {
  utf8: string;
  utf16: string;
  utf32: string;
}

export function getEncodings(codePoint: number): Encodings {
  const char = String.fromCodePoint(codePoint);

  const utf8 = toUtf8Hex(codePoint);

  const utf16Codes: number[] = [];
  for (let i = 0; i < char.length; i++) {
    utf16Codes.push(char.charCodeAt(i));
  }
  const utf16 = utf16Codes.map((c) => c.toString(16).toUpperCase().padStart(4, "0")).join(" ");

  const utf32 = codePoint.toString(16).toUpperCase().padStart(8, "0");

  return { utf8, utf16, utf32 };
}

export function getCharInfo(codePoint: number): CharInfo {
  return {
    codePoint,
    hex: "U+" + codePoint.toString(16).toUpperCase().padStart(4, "0"),
    char: String.fromCodePoint(codePoint),
    blockName: "Hangul Syllables",
    utf8Bytes: toUtf8Hex(codePoint),
  };
}

// Revised Romanization of Korean (국립국어원, 2000), standalone-syllable form.
// Word-level assimilation (ㄱ + ㄴ → ngn etc.) is intentionally not applied —
// we show single syllables in isolation.
const ROM_L = [
  "g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s",
  "ss", "", "j", "jj", "ch", "k", "t", "p", "h",
]; // prettier-ignore
const ROM_V = [
  "a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa",
  "wae", "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i",
]; // prettier-ignore
const ROM_T = [
  "", "k", "k", "kt", "n", "nj", "nh", "t", "l", "lk",
  "lm", "lb", "ls", "lt", "lp", "lh", "m", "p", "bs", "s",
  "ss", "ng", "j", "ch", "k", "t", "p", "h",
]; // prettier-ignore

export function romanize(codePoint: number): string {
  const sIndex = codePoint - S_BASE;
  if (sIndex < 0 || sIndex >= SYLLABLE_COUNT) return String.fromCodePoint(codePoint);
  const lIndex = Math.floor(sIndex / N_COUNT);
  const vIndex = Math.floor((sIndex % N_COUNT) / T_COUNT);
  const tIndex = sIndex % T_COUNT;
  return ROM_L[lIndex] + ROM_V[vIndex] + ROM_T[tIndex];
}

// Reverse romanization lookup, built lazily the first time it's needed.
let romanIndex: Map<string, number> | null = null;
export function romanToIndex(roman: string): number | null {
  if (!romanIndex) {
    romanIndex = new Map();
    for (let i = 0; i < SYLLABLE_COUNT; i++) {
      const r = romanize(S_BASE + i);
      if (!romanIndex.has(r)) romanIndex.set(r, i);
    }
  }
  return romanIndex.get(roman.toLowerCase()) ?? null;
}
