// Regenerates src/data/examples.json from a word-frequency list.
//
// Input: a plain-text file with one "word freq" pair per line, sorted by
// frequency descending. The companion list we use is hermitdave's Korean
// subtitle frequency list (CC BY-SA 4.0):
//
//   https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/ko/ko_50k.txt
//
// Usage:
//   curl -sL <url-above> -o /tmp/ko50k.txt
//   bun run scripts/gen-examples.ts /tmp/ko50k.txt
//
// The resulting JSON maps (syllable-index → up to N common words that
// _contain_ that syllable), where syllable-index = codePoint - 0xAC00.
// We index by every syllable in a word (not just the first), because many
// Korean syllables never occur word-initially — indexing only by first
// syllable leaves ~90% of them without any example.

import { readFileSync, writeFileSync } from "fs";

const raw = readFileSync(process.argv[2], "utf-8");
const MAX_PER_SYLLABLE = 3;
const MIN_FREQ = 5;

const byContained: Record<number, string[]> = {};

for (const line of raw.split(/\r?\n/)) {
  const [word, freqStr] = line.split(/\s+/);
  if (!word || !freqStr) continue;
  const freq = parseInt(freqStr, 10);
  if (!freq || freq < MIN_FREQ) continue;
  if (!/^[\uAC00-\uD7A3]+$/.test(word)) continue;
  if (word.length < 1 || word.length > 6) continue;
  const seenInWord = new Set<number>();
  for (const ch of word) {
    const idx = ch.codePointAt(0)! - 0xac00;
    if (seenInWord.has(idx)) continue;
    seenInWord.add(idx);
    const bucket = byContained[idx] ?? (byContained[idx] = []);
    if (bucket.length < MAX_PER_SYLLABLE && !bucket.includes(word)) {
      bucket.push(word);
    }
  }
}

const covered = Object.keys(byContained).length;
const total = Object.values(byContained).reduce((s, a) => s + a.length, 0);
writeFileSync("src/data/examples.json", JSON.stringify(byContained));
console.log(`covered syllables: ${covered} / 11172`);
console.log(`total words: ${total}`);
console.log(`output size: ${(JSON.stringify(byContained).length / 1024).toFixed(1)} KB`);
