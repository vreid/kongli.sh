// Short etymology / origin note for each Hangul jamo, keyed by compatibility
// jamo character (U+3130 block). Sources: Hunminjeongeum Haerye (1446),
// Wikipedia's Hangul articles.
//
// Consonants depict the articulator making the sound:
//   ㄱ tongue-root, ㄴ tongue-tip, ㅁ mouth, ㅅ incisor, ㅇ throat.
// All other consonants derive from these five by adding strokes (aspiration)
// or doubling (tensed).
//
// Vowels combine three cosmological strokes:
//   · heaven (now a short stroke/dot), ㅡ earth, ㅣ person.

export const ETYMOLOGY: Record<string, string> = {
  // Basic consonants (five shapes of articulation)
  ㄱ: "Shape of the tongue-root blocking the throat (velar).",
  ㄴ: "Shape of the tongue-tip touching the upper palate (alveolar).",
  ㅁ: "Shape of the closed mouth (bilabial).",
  ㅅ: "Shape of an incisor tooth (sibilant).",
  ㅇ: "Shape of the open throat (null / velar nasal).",
  // Derived by adding strokes (aspiration/reinforcement)
  ㄷ: "ㄴ + stroke — stronger alveolar stop.",
  ㅌ: "ㄷ + stroke — aspirated alveolar stop.",
  ㄹ: "Derivative of ㄴ — flowing liquid (lateral/flap).",
  ㅂ: "ㅁ + strokes — bilabial stop.",
  ㅍ: "ㅂ/ㅁ with added strokes — aspirated bilabial stop.",
  ㅈ: "ㅅ + stroke — affricate.",
  ㅊ: "ㅈ + stroke — aspirated affricate.",
  ㅋ: "ㄱ + stroke — aspirated velar stop.",
  ㅎ: "ㅇ + strokes — glottal fricative.",
  // Tensed (doubled) consonants
  ㄲ: "Doubled ㄱ — tensed velar.",
  ㄸ: "Doubled ㄷ — tensed alveolar.",
  ㅃ: "Doubled ㅂ — tensed bilabial.",
  ㅆ: "Doubled ㅅ — tensed sibilant.",
  ㅉ: "Doubled ㅈ — tensed affricate.",
  // Cluster finals (trailing only)
  ㄳ: "ㄱ + ㅅ cluster (trailing only).",
  ㄵ: "ㄴ + ㅈ cluster (trailing only).",
  ㄶ: "ㄴ + ㅎ cluster (trailing only).",
  ㄺ: "ㄹ + ㄱ cluster (trailing only).",
  ㄻ: "ㄹ + ㅁ cluster (trailing only).",
  ㄼ: "ㄹ + ㅂ cluster (trailing only).",
  ㄽ: "ㄹ + ㅅ cluster (trailing only).",
  ㄾ: "ㄹ + ㅌ cluster (trailing only).",
  ㄿ: "ㄹ + ㅍ cluster (trailing only).",
  ㅀ: "ㄹ + ㅎ cluster (trailing only).",
  ㅄ: "ㅂ + ㅅ cluster (trailing only).",
  // Basic vowels (three cosmological strokes)
  ㅡ: "A horizontal line — 'earth'.",
  ㅣ: "A vertical line — 'person'.",
  // Yang vowels (dot to the right / above)
  ㅏ: "ㅣ + dot to the right — 'person with sun' (yang).",
  ㅑ: "ㅏ + extra dot — iotated yang.",
  ㅗ: "ㅡ + dot above — 'earth with sun' (yang).",
  ㅛ: "ㅗ + extra dot — iotated yang.",
  // Yin vowels (dot to the left / below)
  ㅓ: "ㅣ + dot to the left — 'person facing sun' (yin).",
  ㅕ: "ㅓ + extra dot — iotated yin.",
  ㅜ: "ㅡ + dot below — 'earth under sun' (yin).",
  ㅠ: "ㅜ + extra dot — iotated yin.",
  // Compound vowels
  ㅐ: "ㅏ + ㅣ — compound.",
  ㅒ: "ㅑ + ㅣ — compound.",
  ㅔ: "ㅓ + ㅣ — compound.",
  ㅖ: "ㅕ + ㅣ — compound.",
  ㅘ: "ㅗ + ㅏ — compound.",
  ㅙ: "ㅗ + ㅐ — compound.",
  ㅚ: "ㅗ + ㅣ — compound.",
  ㅝ: "ㅜ + ㅓ — compound.",
  ㅞ: "ㅜ + ㅔ — compound.",
  ㅟ: "ㅜ + ㅣ — compound.",
  ㅢ: "ㅡ + ㅣ — compound.",
};
