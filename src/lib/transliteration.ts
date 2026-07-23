// IAST to Devanagari transliteration for Sanskrit vocabulary
// Supports standard vowels, consonants, and common diacritics.

// Strip diacritics from IAST text for fuzzy search matching
// e.g. "Vyāsadeva" -> "vyasadeva", "Nārada" -> "narada"
const diacriticMap: Record<string, string> = {
  ā: "a", ī: "i", ū: "u", ṛ: "r", ṝ: "r", ḷ: "l",
  ṅ: "n", ñ: "n", ṇ: "n", ṭ: "t", ḍ: "d", ś: "s", ṣ: "s",
  ṃ: "m", ḥ: "h",
};

export function stripDiacritics(input: string): string {
  return Array.from(input.toLowerCase())
    .map((ch) => diacriticMap[ch] ?? ch)
    .join("");
}

const vowelMap: Record<string, string> = {
  a: "अ",
  ā: "आ",
  i: "इ",
  ī: "ई",
  u: "उ",
  ū: "ऊ",
  ṛ: "ऋ",
  ṝ: "ॄ",
  ḷ: "ऌ",
  e: "ए",
  ai: "ऐ",
  o: "ओ",
  au: "औ",
};

const consonantMap: Record<string, string> = {
  k: "क",
  kh: "ख",
  g: "ग",
  gh: "घ",
  ṅ: "ङ",
  c: "च",
  ch: "छ",
  j: "ज",
  jh: "झ",
  ñ: "ञ",
  ṭ: "ट",
  ṭh: "ठ",
  ḍ: "ड",
  ḍh: "ढ",
  ṇ: "ण",
  t: "त",
  th: "थ",
  d: "द",
  dh: "ध",
  n: "न",
  p: "प",
  ph: "फ",
  b: "ब",
  bh: "भ",
  m: "म",
  y: "य",
  r: "र",
  l: "ल",
  v: "व",
  ś: "श",
  ṣ: "ष",
  s: "स",
  h: "ह",
  ṃ: "ं",
  ḥ: "ः",
  "'": "ऽ",
  "·": "।",
  ".": "।",
  "0": "०",
  "1": "१",
  "2": "२",
  "3": "३",
  "4": "४",
  "5": "५",
  "6": "६",
  "7": "७",
  "8": "८",
  "9": "९",
};

const vowelDiacritics: Record<string, string> = {
  a: "",
  ā: "ा",
  i: "ि",
  ī: "ी",
  u: "ु",
  ū: "ू",
  ṛ: "ृ",
  ṝ: "ॄ",
  ḷ: "ॢ",
  e: "े",
  ai: "ै",
  o: "ो",
  au: "ौ",
};

const consonantOrder = [
  "kh", "gh", "ch", "jh", "ṭh", "ḍh", "th", "dh", "ph", "bh",
  "k", "g", "ṅ", "c", "j", "ñ", "ṭ", "ḍ", "ṇ", "t", "d", "n",
  "p", "b", "m", "y", "r", "l", "v", "ś", "ṣ", "s", "h",
  "ṃ", "ḥ", "'", "·", ".", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
];

export function iastToDevanagari(input: string): string {
  let result = "";
  let i = 0;
  const s = input.toLowerCase();
  let prevWasConsonant = false;

  while (i < s.length) {
    let matched = false;

    // Try compound/long vowels first
    for (const v of ["ai", "au", "ī", "ū", "ā", "ṛ", "ṝ", "ḷ"]) {
      if (s.startsWith(v, i) && vowelDiacritics[v]) {
        if (prevWasConsonant) {
          result += vowelDiacritics[v];
        } else {
          result += vowelMap[v];
        }
        i += v.length;
        prevWasConsonant = false;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Try single-character vowels
    const c = s[i];
    if (vowelMap[c] && c.length === 1 && (c === "a" || c === "i" || c === "u" || c === "e" || c === "o")) {
      if (prevWasConsonant) {
        result += vowelDiacritics[c];
      } else {
        result += vowelMap[c];
      }
      i += 1;
      prevWasConsonant = false;
      continue;
    }

    // Try two-character consonants first
    for (const con of consonantOrder) {
      if (con.length === 2 && s.startsWith(con, i) && consonantMap[con]) {
        if (prevWasConsonant) {
          result += "्";
        }
        result += consonantMap[con];
        i += 2;
        prevWasConsonant = true;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Single character consonant
    if (consonantMap[c] && c.length === 1) {
      if (prevWasConsonant) {
        result += "्";
      }
      result += consonantMap[c];
      i += 1;
      prevWasConsonant = true;
      continue;
    }

    // Unknown character
    result += c;
    i += 1;
    prevWasConsonant = false;
  }

  // If the input ends with a Devanagari consonant, add a virama so the final consonant
  // has no implicit vowel (e.g. uttamam -> उत्तमम्, not उत्तमम).
  if (prevWasConsonant) {
    const lastChar = result.slice(-1);
    const cp = lastChar.codePointAt(0) ?? 0;
    if (cp >= 0x915 && cp <= 0x939) {
      result += "्";
    }
  }

  return result;
}
