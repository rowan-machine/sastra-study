// Types and seed data for the Śāstra Study app

// Verse counts per chapter for interpolating daily targets
// Key: lowercase book name (or substring). For books not listed, a default of 40 verses/chapter is used.
export const bookChapterVerseCounts: Record<string, Record<number, number>> = {
  "bhagavad-gītā": {
    1: 46, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47, 7: 30, 8: 28, 9: 34, 10: 42,
    11: 55, 12: 20, 13: 35, 14: 27, 15: 20, 16: 24, 17: 28, 18: 78,
  },
  "bhagavad-gita": {
    1: 46, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47, 7: 30, 8: 28, 9: 34, 10: 42,
    11: 55, 12: 20, 13: 35, 14: 27, 15: 20, 16: 24, 17: 28, 18: 78,
  },
  "śrī īśopaniṣad": {
    1: 19, 2: 19, 3: 19, 4: 19, 5: 19, 6: 19, 7: 19, 8: 19, 9: 19, 10: 19,
    11: 19, 12: 19, 13: 19, 14: 19, 15: 19, 16: 19, 17: 19, 18: 19,
  },
};

// === VERSE REFERENCE PARSING & PROGRESS TRACKING ===

/**
 * Parse a free-form verse reference into a standardized {chapter, verse} pair.
 * Accepts: "3.19", "3:19", "BG 4.5", "ch 3 v 19", "Chapter 4 verse 12", "4.5 purport", etc.
 * Returns null if input cannot be parsed.
 */
export function parseVerseRef(input: string): { chapter: number; verse: number } | null {
  if (!input || !input.trim()) return null;
  const cleaned = input.trim()
    // Strip book prefixes like "BG", "SB", "CC", "NOD" etc.
    .replace(/^(?:BG|SB|CC|NOI|NOD|Īśo|Iso)\s*/i, "")
    // Strip trailing annotations like "purport", "translation", "(halfway)"
    .replace(/\s*(?:purport|translation|word.?meanings?|intro(?:duction)?|\(.*?\))\s*$/i, "");

  // Pattern 1: "3.19" or "3:19" or "3-19" (chapter separator verse)
  const dotMatch = cleaned.match(/^(\d+)\s*[.:]\s*(\d+)/);
  if (dotMatch) return { chapter: parseInt(dotMatch[1]), verse: parseInt(dotMatch[2]) };

  // Pattern 2: "Chapter 3 Verse 19" or "Ch 3 V 19" or "ch3v19"
  const chVMatch = cleaned.match(/ch(?:apter)?\s*(\d+)\s*[,\s]*v(?:erse)?\s*(\d+)/i);
  if (chVMatch) return { chapter: parseInt(chVMatch[1]), verse: parseInt(chVMatch[2]) };

  // Pattern 3: Just a chapter number like "Chapter 4" or "Ch 4" (assume end of chapter)
  const chOnlyMatch = cleaned.match(/^ch(?:apter)?\s*(\d+)\s*$/i);
  if (chOnlyMatch) return { chapter: parseInt(chOnlyMatch[1]), verse: 999 }; // 999 = "end of chapter"

  // Pattern 4: Plain "3.19" but surrounded by other text
  const embeddedMatch = cleaned.match(/(\d+)\s*\.\s*(\d+)/);
  if (embeddedMatch) return { chapter: parseInt(embeddedMatch[1]), verse: parseInt(embeddedMatch[2]) };

  return null;
}

/**
 * Normalize a verse input to the canonical "X.Y" format.
 * Returns the original string if it can't be parsed (graceful degradation).
 */
export function normalizeVerseInput(input: string): string {
  const parsed = parseVerseRef(input);
  if (!parsed) return input.trim();
  if (parsed.verse === 999) return `${parsed.chapter}`;
  return `${parsed.chapter}.${parsed.verse}`;
}

/**
 * Returns true if the input looks like a valid verse reference.
 */
export function isValidVerseRef(input: string): boolean {
  return parseVerseRef(input) !== null;
}

/**
 * Get a short, unambiguous abbreviation for a book name.
 * This handles the full curriculum titles and disambiguates SB cantos and GS/KB.
 */
export function getBookAbbreviation(bookName: string): string {
  if (!bookName) return "";
  const lower = bookName.toLowerCase();
  // Normalized version (strip diacritics) for Unicode-safe matching
  const norm = lower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (lower.includes("bhagavad-gītā") || norm.includes("bhagavad-gita") || norm.includes("bhagavad gita")) return "BG";
  if (lower.includes("bhakti-śāstrī") || norm.includes("bhakti-sastri") || norm.includes("bhakti sastri")) return "B Śāstrī";
  if (norm.includes("bhakti-vaibhava")) return "B Vaibhava";
  if (norm.includes("bhakti-rasamrta-sindhu (full")) return "BRS";
  if (norm.includes("ujjvala-nilamani")) return "UN";
  if (norm.includes("laghu-bhagavatamrta")) return "LBM";
  if (norm.includes("brhad-bhagavatamrta")) return "BB";
  if (norm.includes("brahma-samhita")) return "BS";
  if (norm.includes("caitanya-bhagavata")) return "CC-Bhāg";
  if (norm.includes("caitanya-caritamrta") && norm.includes("adi") && norm.includes("part 1")) return "CC-Ādi P1";
  if (norm.includes("caitanya-caritamrta") && norm.includes("adi") && norm.includes("part 2")) return "CC-Ādi P2";
  if (norm.includes("caitanya-caritamrta") && norm.includes("adi") && norm.includes("part 3")) return "CC-Ādi P3";
  if (norm.includes("caitanya-caritamrta") && norm.includes("adi")) return "CC-Ādi";
  if (norm.includes("caitanya-caritamrta") && norm.includes("madhya")) return "CC-Madhya";
  if (norm.includes("caitanya-caritamrta") && norm.includes("antya")) return "CC-Antya";
  if (norm.includes("caitanya-caritamrta")) return "CC";
  if (norm.includes("caitanya-siksam")) return "CŚ";
  // Garga-saṁhitā — match part-specific first (use norm for Unicode safety)
  const gsPartMatch = norm.match(/garga[- ]?samhita[:\s]*canto\s*(\d+)\s*part\s*(\d+)/);
  if (gsPartMatch) return `GS ${gsPartMatch[1]}.${gsPartMatch[2]}`;
  const gsCanto = norm.match(/garga[- ]?samhita[:\s]*canto\s*(\d+)/);
  if (gsCanto) return `GS ${gsCanto[1]}`;
  if (norm.includes("garga") || norm.includes("krsna's planet")) return "GS";
  if (norm.includes("isopanisad")) return "Īśo";
  if (norm.includes("krsna book")) return "KB";
  if (norm.includes("mukunda-mala")) return "MM";
  if (norm.includes("narada-bhakti")) return "NBS";
  if (norm.includes("nectar of devotion")) return "NOD";
  if (norm.includes("nectar of instruction")) return "NOI";
  if (norm.includes("prabhupada-lilamrta")) return "PL";
  if (norm.includes("songs of the vaisnava")) return "Vaiṣṇava Songs";
  // Śrīmad-Bhāgavatam — match part-specific first, then canto
  // Must NOT match if garga was already handled above, so check norm for "bhagavatam" or "srimad"
  if (norm.includes("bhagavatam") || norm.includes("srimad")) {
    const sbPartMatch = norm.match(/canto\s*(\d+)\s*part\s*(\d+)/);
    if (sbPartMatch) return `SB ${sbPartMatch[1]}.${sbPartMatch[2]}`;
    const sbMatch = norm.match(/canto\s*(\d+)/);
    if (sbMatch) return `SB ${sbMatch[1]}`;
    return "SB";
  }
  // Fallback: raw canto match only if not already handled (safety net)
  const cantoPartMatch = norm.match(/canto\s*(\d+)\s*part\s*(\d+)/);
  if (cantoPartMatch) return `SB ${cantoPartMatch[1]}.${cantoPartMatch[2]}`;
  const cantoMatch = norm.match(/canto\s*(\d+)/);
  if (cantoMatch) return `SB ${cantoMatch[1]}`;
  return "";
}

/**
 * Convert a chapter.verse to an absolute verse position within a book,
 * counting from verse 1 of chapter 1. Used for comparing positions.
 */
export function verseToAbsolutePosition(book: string, chapter: number, verse: number): number {
  let total = 0;
  for (let ch = 1; ch < chapter; ch++) {
    total += getVerseCountForChapter(book, ch);
  }
  // Clamp verse to chapter max (handles "end of chapter" sentinel of 999)
  const maxVerse = getVerseCountForChapter(book, chapter);
  total += Math.min(verse, maxVerse);
  return total;
}

/**
 * Calculate verse-based progress (0–100) for a curriculum week.
 * Compares the latest endLocation from daily logs against the week's target assignment.
 * Returns null if progress can't be determined (missing data or unparseable references).
 */
export function getVerseProgressForWeek(
  book: string,
  assignment: string,
  weekLogEntries: DailyLogEntry[]
): { percent: number; currentRef: string; targetRef: string } | null {
  // Find the latest endLocation in this week's log entries (sorted by date desc)
  const sorted = [...weekLogEntries]
    .filter((e) => e.endLocation && parseVerseRef(e.endLocation))
    .sort((a, b) => b.date.localeCompare(a.date));
  if (sorted.length === 0) return null;

  const latestEntry = sorted[0];
  const currentParsed = parseVerseRef(latestEntry.endLocation)!;

  // Parse the assignment's START and END range
  let startChapter = 1, startVerse = 1;
  let endChapter = startChapter, endVerse = getVerseCountForChapter(book, startChapter);

  const startMatch = assignment.match(/(\d+)\.(\d+)/);
  if (startMatch) {
    startChapter = parseInt(startMatch[1]);
    startVerse = parseInt(startMatch[2]);
  }

  const endVerseMatch = assignment.match(/→\s*(\d+)\.(\d+)/);
  const endChapterMatch = assignment.match(/end\s*(?:of\s*)?chapter\s*(\d+)/i)
    || assignment.match(/chapter\s*(\d+)\s*$/i);
  const chapterRangeMatch = assignment.match(/chapters?\s*(\d+)\s*[–\-−to]+\s*(\d+)/i);

  if (endVerseMatch) {
    endChapter = parseInt(endVerseMatch[1]);
    endVerse = parseInt(endVerseMatch[2]);
  } else if (endChapterMatch) {
    endChapter = parseInt(endChapterMatch[1]);
    endVerse = getVerseCountForChapter(book, endChapter);
  } else if (chapterRangeMatch) {
    startChapter = parseInt(chapterRangeMatch[1]);
    startVerse = 1;
    endChapter = parseInt(chapterRangeMatch[2]);
    endVerse = getVerseCountForChapter(book, endChapter);
  }

  const startPos = verseToAbsolutePosition(book, startChapter, startVerse);
  const endPos = verseToAbsolutePosition(book, endChapter, endVerse);
  const currentPos = verseToAbsolutePosition(book, currentParsed.chapter, currentParsed.verse);

  if (endPos <= startPos) return null; // can't calculate

  const percent = Math.min(100, Math.max(0, Math.round(((currentPos - startPos) / (endPos - startPos)) * 100)));
  const currentRef = normalizeVerseInput(latestEntry.endLocation);
  const targetRef = endVerse === getVerseCountForChapter(book, endChapter)
    ? `End Ch ${endChapter}`
    : `${endChapter}.${endVerse}`;

  return { percent, currentRef, targetRef };
}

function getVerseCountForChapter(book: string, chapter: number): number {
  const lower = book.toLowerCase();
  for (const [key, verses] of Object.entries(bookChapterVerseCounts)) {
    if (lower.includes(key)) return verses[chapter] || 40;
  }
  return 40;
}

/**
 * Get a full-book verse count array for the given book, if available in the
 * `bookChapterVerseCounts` map. Returns null for unknown books.
 */
function getBookVerseCounts(book: string): number[] | null {
  const lower = book.toLowerCase();
  for (const [key, counts] of Object.entries(bookChapterVerseCounts)) {
    if (lower.includes(key)) {
      const chapters = Object.keys(counts)
        .map((n) => parseInt(n))
        .sort((a, b) => a - b);
      const maxChapter = chapters[chapters.length - 1] || 1;
      const arr: number[] = [];
      for (let ch = 1; ch <= maxChapter; ch++) {
        arr.push(counts[ch] ?? 40);
      }
      return arr;
    }
  }
  return null;
}

/**
 * Calculate the reader's position (0-100%) through the whole book based on the
 * latest endLocation in the daily log. Returns null for books we can't map.
 */
export function getPositionPercentForBook(book: string, endLocation: string): number | null {
  const parsed = parseVerseRef(endLocation);
  if (!parsed) return null;
  const counts = getBookVerseCounts(book);
  if (!counts) return null;
  const total = counts.reduce((sum, v) => sum + v, 0);
  if (total === 0) return null;
  const pos = verseToAbsolutePosition(book, parsed.chapter, parsed.verse);
  return Math.min(100, Math.max(0, Math.round((pos / total) * 100)));
}

/**
 * Match a daily log book name against a book-progress/book name.
 * Tries exact substring match, then abbreviation match.
 */
export function bookMatches(logBook: string, progressBook: string): boolean {
  if (!logBook || !progressBook) return false;
  const ll = logBook.toLowerCase();
  const pl = progressBook.toLowerCase();
  if (pl.includes(ll) || ll.includes(pl)) return true;
  const logAbbr = getBookAbbreviation(logBook);
  const progAbbr = getBookAbbreviation(progressBook);
  return logAbbr !== "" && logAbbr === progAbbr;
}

function getBookLabel(book: string): string {
  const lower = book.toLowerCase();
  if (lower.includes("bhagavad") || lower.includes("gītā") || lower.includes("gita")) return "BG";
  if (lower.includes("īśopaniṣad") || lower.includes("isopanisad") || lower.includes("isopanisad")) return "Īśo";
  // Fallback: initials of the first two significant words
  const clean = book.replace(/\(.*?\)/g, "").trim();
  const words = clean.split(/\s+/).filter((w) => w.length > 2 && !["the", "and", "of", "to", "in", "śrī", "sri"].includes(w.toLowerCase()));
  return words.slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "Bk";
}

// Helper: given a fractional position (0–1) through a chapter range, return "Ch.X verse Y"
// startRef: "3.19" means chapter 3 verse 19; endRef: "End Chapter 4" or "4.42"
export function interpolateVerseTarget(
  assignment: string,
  book: string,
  fractionOfWeek: number
): string {
  // Parse start reference
  const startMatch = assignment.match(/(\d+)\.(\d+)/);
  let startChapter = 1, startVerse = 1;
  if (startMatch) {
    startChapter = parseInt(startMatch[1]);
    startVerse = parseInt(startMatch[2]);
  }

  // Parse end reference
  let endChapter = startChapter, endVerse = getVerseCountForChapter(book, startChapter);
  const endChapterMatch = assignment.match(/end\s*(?:of\s*)?chapter\s*(\d+)/i)
    || assignment.match(/chapter\s*(\d+)\s*$/i);
  const endVerseMatch = assignment.match(/→\s*(\d+)\.(\d+)/);
  const chapterRangeMatch = assignment.match(/chapters?\s*(\d+)\s*[–\-−to]+\s*(\d+)/i);

  if (endVerseMatch) {
    endChapter = parseInt(endVerseMatch[1]);
    endVerse = parseInt(endVerseMatch[2]);
  } else if (endChapterMatch) {
    endChapter = parseInt(endChapterMatch[1]);
    endVerse = getVerseCountForChapter(book, endChapter);
  } else if (chapterRangeMatch) {
    startChapter = parseInt(chapterRangeMatch[1]);
    startVerse = 1;
    endChapter = parseInt(chapterRangeMatch[2]);
    endVerse = getVerseCountForChapter(book, endChapter);
  }

  // Count total verses in range
  let totalVerses = 0;
  for (let ch = startChapter; ch <= endChapter; ch++) {
    const chVerses = getVerseCountForChapter(book, ch);
    const from = ch === startChapter ? startVerse : 1;
    const to = ch === endChapter ? endVerse : chVerses;
    totalVerses += (to - from + 1);
  }

  // Find the target verse position
  const targetVerseOffset = Math.floor(totalVerses * fractionOfWeek);

  let accumulated = 0;
  for (let ch = startChapter; ch <= endChapter; ch++) {
    const chVerses = getVerseCountForChapter(book, ch);
    const from = ch === startChapter ? startVerse : 1;
    const to = ch === endChapter ? endVerse : chVerses;
    const versesInThisCh = to - from + 1;

    if (accumulated + versesInThisCh > targetVerseOffset) {
      const verseInCh = from + (targetVerseOffset - accumulated);
      return `${getBookLabel(book)} ${ch}.${verseInCh}`;
    }
    accumulated += versesInThisCh;
  }

  return `${getBookLabel(book)} ${endChapter}.${endVerse}`;
}

export interface SadhanaStandards {
  minScorePercent: number; // minimum daily score to count as "on standard" (e.g. 60)
  requiredItems: string[]; // keys from scheduleItems that are non-negotiable (e.g. ["personalStudy"])
  weeklyMinDays: number; // min days per week that must meet minScorePercent (e.g. 5)
  obeisancesTarget: number; // target obeisances per day (1-3)
  description: string; // human-readable summary of this standard
}

export interface RegulativePrinciples {
  mode: "non-negotiable" | "tracking"; // non-negotiable = must maintain, tracking = working toward
  initiated: boolean; // whether the devotee has taken initiation vows
  principles: {
    noMeatEating: boolean;   // sattvic diet adherence
    noIntoxication: boolean;
    noGambling: boolean;
    noIllicitSex: boolean;
    sixteenRounds: boolean;  // completing 16 rounds daily
  };
}

export interface StandardsChangeEntry {
  date: string;
  field: string; // which field changed
  oldValue: number | string;
  newValue: number | string;
  direction: "up" | "same"; // ratchet: only "up" is allowed
}

export interface Course {
  id: string;
  name: string;
  color: string; // tailwind color name e.g. "sky", "amber", "violet"
  startDate: string;
  endDate: string;
  books: string[]; // books assigned to this course
  firstBookStartChapter?: string; // e.g. "3.19" — where to start in the first book (if already in progress)
  invocationRecordingUrl?: string; // optional link to an invocation/audio recording for this course
  sadhanaStandards: SadhanaStandards; // sādhana performance baseline for this course
  originalBaseline: SadhanaStandards; // locked floor — can never go below this
  standardsHistory: StandardsChangeEntry[]; // permanent audit log of all changes
  regulativePrinciples: RegulativePrinciples; // 4 regs + 16 rounds config
  active: boolean;
}

export const courseColors = [
  { id: "sky", label: "Light Blue", bg: "bg-sky-100", border: "border-sky-300", text: "text-sky-800", accent: "bg-sky-500" },
  { id: "amber", label: "Amber", bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-800", accent: "bg-amber-500" },
  { id: "violet", label: "Violet", bg: "bg-violet-100", border: "border-violet-300", text: "text-violet-800", accent: "bg-violet-500" },
  { id: "emerald", label: "Emerald", bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-800", accent: "bg-emerald-500" },
  { id: "rose", label: "Rose", bg: "bg-rose-100", border: "border-rose-300", text: "text-rose-800", accent: "bg-rose-500" },
  { id: "orange", label: "Orange", bg: "bg-orange-100", border: "border-orange-300", text: "text-orange-800", accent: "bg-orange-500" },
  { id: "teal", label: "Teal", bg: "bg-teal-100", border: "border-teal-300", text: "text-teal-800", accent: "bg-teal-500" },
  { id: "fuchsia", label: "Fuchsia", bg: "bg-fuchsia-100", border: "border-fuchsia-300", text: "text-fuchsia-800", accent: "bg-fuchsia-500" },
] as const;

export const defaultSadhanaStandards: SadhanaStandards = {
  minScorePercent: 55,
  requiredItems: ["personalStudy"],
  weeklyMinDays: 5,
  obeisancesTarget: 1,
  description: "16 rounds daily, 2+ hrs personal study at least 5 days/week, 55% daily score minimum, 1 obeisance a day",
};

export const defaultRegulativePrinciples: RegulativePrinciples = {
  mode: "tracking", // start as "working toward" — switch to "non-negotiable" when ready
  initiated: false,
  principles: {
    noMeatEating: true,
    noIntoxication: true,
    noGambling: true,
    noIllicitSex: true,
    sixteenRounds: true,
  },
};

export const defaultCourse: Course = {
  id: "course-1",
  name: "Foundation Course",
  color: "sky",
  startDate: "2026-07-06",
  endDate: "2027-02-14",
  books: [
    "Bhagavad-gītā As It Is",
    "Nectar of Instruction (Upadeśāmṛta)",
    "Science of Self-Realization",
    "Śrīmad-Bhāgavatam Canto 1 Part 1",
    "Kṛṣṇa Book (Kṛṣṇa, The Supreme Personality of Godhead)",
    "Nectar of Devotion (Bhakti-rasāmṛta-sindhu)",
    "Garga-saṁhitā: Canto 1 Part 1 (Goloka-khaṇḍa)",
  ],
  invocationRecordingUrl: "https://www.youtube.com/watch?v=JVb9Fgo5-J4",
  sadhanaStandards: {
    minScorePercent: 55,
    requiredItems: ["personalStudy"],
    weeklyMinDays: 5,
    obeisancesTarget: 1,
    description: "16 rounds daily, 2+ hrs personal study at least 5 days/week, 55% daily score minimum, 1 obeisance a day",
  },
  originalBaseline: {
    minScorePercent: 55,
    requiredItems: ["personalStudy"],
    weeklyMinDays: 5,
    obeisancesTarget: 1,
    description: "16 rounds daily, 2+ hrs personal study at least 5 days/week, 55% daily score minimum, 1 obeisance a day",
  },
  standardsHistory: [],
  regulativePrinciples: {
    mode: "tracking",
    initiated: false,
    principles: {
      noMeatEating: true,
      noIntoxication: true,
      noGambling: true,
      noIllicitSex: true,
      sixteenRounds: true,
    },
  },
  active: true,
};

export const expansionCourse: Course = {
  id: "course-2",
  name: "Expansion Course",
  color: "violet",
  startDate: "2027-02-15",
  endDate: "2027-10-15",
  books: [
    "Śrī Īśopaniṣad",
    "Nārada-bhakti-sūtra",
    "Journey of Self-Discovery",
    "Śrīmad-Bhāgavatam Canto 1 Part 2",
    "Garga-saṁhitā: Canto 1 Part 2 (Goloka-khaṇḍa)",
    "Teachings of Lord Caitanya",
    "Śrī Caitanya-caritāmṛta: Ādi-līlā Part 1",
    "Teachings of Lord Kapila",
    "Teachings of Queen Kuntī",
    "Teachings of Prahlāda Mahārāja",
  ],
  sadhanaStandards: {
    minScorePercent: 60,
    requiredItems: ["personalStudy"],
    weeklyMinDays: 5,
    obeisancesTarget: 1,
    description: "16 rounds daily, 2+ hrs personal study at least 5 days/week, 60% daily score minimum",
  },
  originalBaseline: {
    minScorePercent: 60,
    requiredItems: ["personalStudy"],
    weeklyMinDays: 5,
    obeisancesTarget: 1,
    description: "16 rounds daily, 2+ hrs personal study at least 5 days/week, 60% daily score minimum",
  },
  standardsHistory: [],
  regulativePrinciples: {
    mode: "tracking",
    initiated: false,
    principles: {
      noMeatEating: true,
      noIntoxication: true,
      noGambling: true,
      noIllicitSex: true,
      sixteenRounds: true,
    },
  },
  active: false,
};

// Prabhupāda Biography — a parallel low-intensity biography track that spans
// across multiple śāstra courses. Not intended as a rigorous doctrinal course,
// but as a slow, continuous read alongside whatever course is currently active.
export const prabhupadaBiographyCourse: Course = {
  id: "course-bio",
  name: "Prabhupāda Biography (Parallel)",
  color: "orange",
  startDate: "2026-07-06", // aligns with Foundation Course start
  endDate: "2029-02-17",   // through the end of Course IV
  books: [
    "Swami in a Strange Land (Prabhupāda biography, Joshua M. Greene)",
    "His Divine Grace (HH Dānavīr Goswami — his own biography & how he met Śrīla Prabhupāda)",
  ],
  sadhanaStandards: {
    minScorePercent: 55,
    requiredItems: ["personalStudy"],
    weeklyMinDays: 5,
    obeisancesTarget: 1,
    description: "Parallel biography track — no independent sādhana standard; defer to the primary active course.",
  },
  originalBaseline: {
    minScorePercent: 55,
    requiredItems: ["personalStudy"],
    weeklyMinDays: 5,
    obeisancesTarget: 1,
    description: "Parallel biography track — no independent sādhana standard; defer to the primary active course.",
  },
  standardsHistory: [],
  regulativePrinciples: {
    mode: "tracking",
    initiated: false,
    principles: {
      noMeatEating: true,
      noIntoxication: true,
      noGambling: true,
      noIllicitSex: true,
      sixteenRounds: true,
    },
  },
  active: false,
};

export const consolidationCourse: Course = {
  id: "course-3",
  name: "Consolidation Course (III)",
  color: "emerald",
  startDate: "2027-10-16",
  endDate: "2028-06-16",
  books: [
    "Śrīmad-Bhāgavatam Canto 2",
    "Śrī Caitanya-caritāmṛta: Ādi-līlā Part 2",
    "Śrīmad-Bhāgavatam Canto 3 Part 1",
    "Garga-saṁhitā: Canto 2",
    "Renunciation Through Wisdom",
    "A Second Chance",
    "The Path of Perfection",
  ],
  sadhanaStandards: {
    minScorePercent: 65,
    requiredItems: ["personalStudy"],
    weeklyMinDays: 5,
    obeisancesTarget: 1,
    description: "16 rounds daily, 2+ hrs personal study at least 5 days/week, 65% daily score minimum",
  },
  originalBaseline: {
    minScorePercent: 65,
    requiredItems: ["personalStudy"],
    weeklyMinDays: 5,
    obeisancesTarget: 1,
    description: "16 rounds daily, 2+ hrs personal study at least 5 days/week, 65% daily score minimum",
  },
  standardsHistory: [],
  regulativePrinciples: {
    mode: "tracking",
    initiated: false,
    principles: {
      noMeatEating: true,
      noIntoxication: true,
      noGambling: true,
      noIllicitSex: true,
      sixteenRounds: true,
    },
  },
  active: false,
};

export const deepeningCourse: Course = {
  id: "course-4",
  name: "Deepening Course (IV — Bhakti-śāstrī-style return)",
  color: "teal",
  startDate: "2028-06-17",
  endDate: "2029-02-17",
  books: [
    "Bhagavad-gītā As It Is — second pass",
    "Nectar of Instruction — deeper pass",
    "Śrī Īśopaniṣad — deeper pass",
    "Nectar of Devotion — selected/deeper study",
    "Śrīmad-Bhāgavatam Canto 3 Part 2",
    "Śrī Caitanya-caritāmṛta: Madhya-līlā Part 1",
  ],
  sadhanaStandards: {
    minScorePercent: 70,
    requiredItems: ["personalStudy"],
    weeklyMinDays: 5,
    obeisancesTarget: 1,
    description: "16 rounds daily, 2+ hrs personal study at least 5 days/week, 70% daily score minimum",
  },
  originalBaseline: {
    minScorePercent: 70,
    requiredItems: ["personalStudy"],
    weeklyMinDays: 5,
    obeisancesTarget: 1,
    description: "16 rounds daily, 2+ hrs personal study at least 5 days/week, 70% daily score minimum",
  },
  standardsHistory: [],
  regulativePrinciples: {
    mode: "tracking",
    initiated: false,
    principles: {
      noMeatEating: true,
      noIntoxication: true,
      noGambling: true,
      noIllicitSex: true,
      sixteenRounds: true,
    },
  },
  active: false,
};

export const continuationCourse: Course = {
  id: "course-5",
  name: "Bhāgavata / Caitanya Continuation (V)",
  color: "rose",
  startDate: "2029-02-18",
  endDate: "2029-10-18",
  books: [
    "Śrīmad-Bhāgavatam Canto 4",
    "Śrīmad-Bhāgavatam Canto 5",
    "Śrī Caitanya-caritāmṛta: Madhya-līlā Part 2",
    "Śrī Caitanya-caritāmṛta: Antya-līlā (selections)",
    "Kṛṣṇa Book — selected reread",
    "Brahma-saṁhitā — deeper reread",
    "Further Garga-saṁhitā",
  ],
  sadhanaStandards: {
    minScorePercent: 75,
    requiredItems: ["personalStudy"],
    weeklyMinDays: 5,
    obeisancesTarget: 1,
    description: "16 rounds daily, 2+ hrs personal study at least 5 days/week, 75% daily score minimum",
  },
  originalBaseline: {
    minScorePercent: 75,
    requiredItems: ["personalStudy"],
    weeklyMinDays: 5,
    obeisancesTarget: 1,
    description: "16 rounds daily, 2+ hrs personal study at least 5 days/week, 75% daily score minimum",
  },
  standardsHistory: [],
  regulativePrinciples: {
    mode: "tracking",
    initiated: false,
    principles: {
      noMeatEating: true,
      noIntoxication: true,
      noGambling: true,
      noIllicitSex: true,
      sixteenRounds: true,
    },
  },
  active: false,
};

// Reading wishlist — books to keep on the radar when planning future courses.
// Not tied to any course; useful for tracking "would like to read" candidates.
export interface WishlistBook {
  id: string;
  title: string;
  author?: string;
  notes?: string;
  addedAt: string;
}

export const defaultReadingWishlist: WishlistBook[] = [
  {
    id: "wl-fortunate-souls",
    title: "Fortunate Souls",
    author: "HH Dānavīr Goswami",
    notes: "Danavir Goswami's account of the early Western devotees Prabhupāda gathered — consider for a future course slot.",
    addedAt: "2026-07-19T00:00:00.000Z",
  },
  {
    id: "wl-bright-side",
    title: "Bright Side",
    author: "HH Dānavīr Goswami",
    notes: "Danavir Goswami — character / dealing with obstacles. Good deepening / anārtha-nivṛtti companion for a return-and-deepen course.",
    addedAt: "2026-07-19T00:00:00.000Z",
  },
];

export interface CustomScheduleItem {
  key: string;
  label: string;
  icon: string;
  linkedToJapa?: boolean;
  committed?: boolean; // locked commitment from Push Myself — cannot be removed during the course
  sundayOnly?: boolean; // only show this item on Sundays
  weekdayOnly?: boolean; // hide this item on Saturdays and Sundays
}

export type Guna = "goodness" | "passion" | "ignorance";
export type HabitMode = "avoid" | "practice";

export interface GunaHabit {
  id: string;
  label: string;
  guna: Guna;
  mode: HabitMode; // avoid: positive = didn't do it; practice: positive = did it
  tracked: boolean;
}

export interface Settings {
  planStartDate: string;
  targetWeeks: number;
  weeklyTargetHours: number;
  minimumDailyStudyHours: number;
  weekendTargetHours: number;
  targetFinishDate: string;
  scheduleItems: CustomScheduleItem[]; // editable daily checklist
  habits: GunaHabit[]; // guna-based habit tracker (anarthas / sādhana practices)
  paceMultiplier: number; // real-time study pace multiplier (0.5 = half pace, 1 = normal, 2 = double)
  ekadashiFastingRequired?: boolean; // auto-add one-off fasting tracker on Ekadashi days
  ashrama?: "brahmacari" | "grhastha" | "vanaprastha" | "sannyasi"; // spiritual-goal mode for projections
  commitments?: string[]; // keys of Push Myself items the user has committed to (cannot be undone)
}

export interface CurriculumWeek {
  week: number;
  startDate: string;
  endDate: string;
  book: string;
  assignment: string;
  targetHours: number;
  actualHours: number;
  complete: boolean;
  reflection: boolean;
  paceStatus: string;
  notes: string;
}

import { addWeeks, format, parseISO, differenceInDays } from "date-fns";

// Chapter breakdowns per book for curriculum generation.
// Keys are substrings matched case-insensitively against book names.
export const bookChapterBreakdown: Record<string, string[]> = {
  // --- Core study ---
  "bhagavad-gītā": [
    "3.19 → End Chapter 4", "Chapters 5–6", "Chapters 7–8", "Chapters 9–10",
    "Chapters 11–12", "Chapters 13–15", "Chapters 16–17", "Finish BG + Finish NOI",
  ],
  "śrīmad-bhāgavatam canto 1 part 1": ["Chapters 1–4", "Chapters 5–8", "Chapters 9–12", "Finish Part One"],
  "śrīmad-bhāgavatam canto 1 part 2": ["Chapters 13–16", "Chapters 17–19", "Finish Canto 1"],
  "bhāgavatam canto 1": ["Chapters 1–4", "Chapters 5–8", "Chapters 9–12", "Chapters 13–19"],
  "bhāgavatam canto 2": ["Chapters 1–4", "Chapters 5–8", "Chapters 9–10"],
  "bhāgavatam canto 3": ["Chapters 1–6", "Chapters 7–12", "Chapters 13–19", "Chapters 20–26", "Chapters 27–33"],
  "bhāgavatam canto 4": ["Chapters 1–6", "Chapters 7–12", "Chapters 13–20", "Chapters 21–28", "Chapters 29–31"],
  "bhāgavatam canto 5": ["Chapters 1–6", "Chapters 7–13", "Chapters 14–20", "Chapters 21–26"],
  "bhāgavatam canto 6": ["Chapters 1–6", "Chapters 7–12", "Chapters 13–19"],
  "bhāgavatam canto 7": ["Chapters 1–5", "Chapters 6–10", "Chapters 11–15"],
  "bhāgavatam canto 8": ["Chapters 1–6", "Chapters 7–12", "Chapters 13–19", "Chapters 20–24"],
  "bhāgavatam canto 9": ["Chapters 1–6", "Chapters 7–12", "Chapters 13–18", "Chapters 19–24"],
  "bhāgavatam canto 10": ["Chapters 1–6", "Chapters 7–12", "Chapters 13–18", "Chapters 19–24", "Chapters 25–31", "Chapters 32–38", "Chapters 39–45", "Chapters 46–52", "Chapters 53–58", "Chapters 59–64", "Chapters 65–72", "Chapters 73–80", "Chapters 81–88", "Chapters 89–90"],
  "bhāgavatam canto 11": ["Chapters 1–5", "Chapters 6–10", "Chapters 11–16", "Chapters 17–22", "Chapters 23–31"],
  "bhāgavatam canto 12": ["Chapters 1–5", "Chapters 6–9", "Chapters 10–13"],
  "caitanya-caritāmṛta": [
    "Ādi-līlā Ch 1–4", "Ādi-līlā Ch 5–8", "Ādi-līlā Ch 9–12", "Ādi-līlā Ch 13–17",
    "Madhya-līlā Ch 1–5", "Madhya-līlā Ch 6–10", "Madhya-līlā Ch 11–15",
    "Madhya-līlā Ch 16–20", "Madhya-līlā Ch 21–25",
    "Antya-līlā Ch 1–5", "Antya-līlā Ch 6–10", "Antya-līlā Ch 11–15",
    "Antya-līlā Ch 16–20", "Finish",
  ],
  "caitanya-caritāmṛta: ādi-līlā part 1": ["Chapters 1–4", "Chapters 5–8", "Finish Part 1"],
  "caitanya-caritāmṛta: ādi-līlā part 2": ["Chapters 9–12", "Chapters 13–14", "Finish Part 2"],
  "caitanya-caritāmṛta: ādi-līlā part 3": ["Chapters 15–17", "Finish Ādi-līlā"],
  "caitanya-caritāmṛta: madhya-līlā": ["Chapters 1–5", "Chapters 6–10", "Chapters 11–15", "Chapters 16–20", "Chapters 21–25"],
  "caitanya-caritāmṛta: antya-līlā": ["Chapters 1–5", "Chapters 6–10", "Chapters 11–15", "Chapters 16–20"],
  // --- Foundational / shorter works ---
  "nectar of instruction": ["Complete text"],
  "nectar of devotion": [
    "Chapters 1–9", "Chapters 10–19", "Chapters 20–29", "Finish book",
  ],
  "science of self-realization": ["Essays 1–12", "Finish book"],
  "beyond birth and death": ["Complete text"],
  "easy journey to other planets": ["Complete text"],
  "perfection of yoga": ["Complete text"],
  "rāja-vidyā": ["Complete text"],
  "elevation to kṛṣṇa consciousness": ["Complete text"],
  "topmost yoga system": ["Complete text"],
  "matchless gift": ["Complete text"],
  "on the way to kṛṣṇa": ["Complete text"],
  "path of perfection": ["Complete text"],
  "life comes from life": ["Complete text"],
  "message of godhead": ["Complete text"],
  "light of the bhāgavata": ["Complete text"],
  "renunciation through wisdom": ["Chapters 1–4", "Finish book"],
  "quest for enlightenment": ["Parts 1–3", "Finish book"],
  "civilization and transcendence": ["Complete text"],
  "second chance": ["Chapters 1–7", "Finish book"],
  "laws of nature": ["Complete text"],
  "journey of self-discovery": ["Parts 1–4", "Finish book"],
  // --- Major works ---
  "kṛṣṇa book": [
    "Chapters 1–12", "Chapters 13–24", "Chapters 25–36", "Finish book",
  ],
  "teachings of lord caitanya": [
    "Chapters 1–8", "Chapters 9–16", "Chapters 17–24", "Chapters 25–32", "Finish book",
  ],
  "teachings of lord kapila": ["Chapters 1–10", "Chapters 11–20", "Finish book"],
  "teachings of queen kuntī": ["Chapters 1–13", "Chapters 14–26", "Finish book"],
  "teachings of prahlāda": ["Chapters 1–7", "Finish book"],
  "nārada-bhakti-sūtra": ["Sūtras 1–40", "Finish book"],
  "mukunda-mālā-stotra": ["Complete text"],
  "śrī īśopaniṣad": ["Complete text"],
  "śvetāśvatara upaniṣad": ["Complete text"],
  // --- Prabhupāda's other writings ---
  "prabhupāda-līlāmṛta": [
    "Volume 1", "Volume 2", "Volume 3", "Volume 4", "Volume 5", "Volume 6 — Finish",
  ],
  "prabhupāda letters": ["Selected letters Part 1", "Part 2", "Finish"],
  "conversations with śrīla prabhupāda": ["Selected conversations Part 1", "Part 2", "Finish"],
  // --- Garga-saṁhitā individual cantos ---
  "garga-saṁhitā: canto 1 part 1": ["Chapters 1–2", "Chapters 3–4", "Chapter 5", "Chapter 6 — Finish"],
  "garga-saṁhitā: canto 1 part 2": ["Chapters 7–8", "Chapters 9–10", "Finish Part Two"],
  "garga-saṁhitā: canto 2": ["Chapters 1–5", "Chapters 6–10", "Finish canto"],
  "garga-saṁhitā: canto 3": ["Chapters 1–5", "Chapters 6–10", "Finish canto"],
  "garga-saṁhitā: canto 4": ["Chapters 1–5", "Chapters 6–10", "Finish canto"],
  "garga-saṁhitā: canto 5": ["Chapters 1–5", "Chapters 6–10", "Finish canto"],
  "garga-saṁhitā: canto 6": ["Chapters 1–5", "Chapters 6–10", "Finish canto"],
  "garga-saṁhitā: canto 7": ["Chapters 1–5", "Chapters 6–10", "Finish canto"],
  "garga-saṁhitā: canto 8": ["Chapters 1–5", "Chapters 6–10", "Finish canto"],
  "garga-saṁhitā: canto 9": ["Chapters 1–5", "Chapters 6–10", "Finish canto"],
  "garga-saṁhitā: canto 10": ["Chapters 1–5", "Chapters 6–10", "Finish canto"],
  "kṛṣṇa's planet": [
    "Chapters 1–2", "Chapters 3–4", "Chapter 5", "Chapter 6 — Finish",
  ],
  "garga-saṁhitā": [
    "Chapters 1–2", "Chapters 3–4", "Chapter 5", "Chapter 6 — Finish",
  ],
  // --- Gosvāmī literature ---
  "bhakti-rasāmṛta-sindhu (full": [
    "Eastern Division (Sāmānya-bhakti)", "Southern Division (Sādhana-bhakti)",
    "Western Division (Bhāva-bhakti)", "Northern Division (Prema-bhakti)",
  ],
  "ujjvala-nīlamaṇi": ["Chapters 1–7", "Chapters 8–15", "Finish book"],
  "laghu-bhāgavatāmṛta": ["Pūrva-khaṇḍa", "Uttara-khaṇḍa — Finish"],
  "vidagdha-mādhava": ["Acts 1–4", "Acts 5–7 — Finish"],
  "lalita-mādhava": ["Acts 1–5", "Acts 6–10 — Finish"],
  "hari-bhakti-vilāsa": [
    "Vilāsas 1–5", "Vilāsas 6–10", "Vilāsas 11–15", "Vilāsas 16–20 — Finish",
  ],
  "bṛhad-bhāgavatāmṛta": [
    "Part 1 Ch 1–3", "Part 1 Ch 4–7", "Part 2 Ch 1–3", "Part 2 Ch 4–7 — Finish",
  ],
  "sat-sandarbha": [
    "Tattva-sandarbha", "Bhagavat-sandarbha", "Paramātma-sandarbha",
    "Kṛṣṇa-sandarbha", "Bhakti-sandarbha", "Prīti-sandarbha — Finish",
  ],
  "gopāla-campū": ["Pūrva-campū (Part 1)", "Uttara-campū (Part 2) — Finish"],
  "mādhurya-kādambinī": ["Showers 1–4", "Showers 5–8 — Finish"],
  "rāga-vartma-candrikā": ["Complete text"],
  "caitanya-bhāgavata": [
    "Ādi-khaṇḍa", "Madhya-khaṇḍa", "Antya-khaṇḍa — Finish",
  ],
  "prema-vivarta": ["Chapters 1–10", "Chapters 11–20 — Finish"],
  // --- Vaiṣṇava ācārya works ---
  "jaiva-dharma": [
    "Chapters 1–8", "Chapters 9–16", "Chapters 17–24",
    "Chapters 25–32", "Chapters 33–40 — Finish",
  ],
  "harināma-cintāmaṇi": ["Chapters 1–8", "Chapters 9–15 — Finish"],
  "caitanya-śikṣāmṛta": ["Parts 1–3", "Parts 4–6", "Parts 7–8 — Finish"],
  "bhaktyāloka": ["Complete text"],
  "brahma-saṁhitā": ["Complete text"],
  // --- Supplementary study ---
  "vaiṣṇava songbook": ["Complete text"],
  "verse memorization guide": ["Complete text"],
  "disciple course": ["Complete course"],
  "bhakti śāstrī": ["Module 1", "Module 2", "Module 3", "Module 4 — Finish"],
  "bhakti vaibhava": ["Module 1", "Module 2", "Module 3", "Module 4 — Finish"],
  "māyāpur-vṛndāvana study": ["Complete text"],
  // --- Prabhupāda Biography track ---
  "swami in a strange land": [
    "Part 1: Chapter 1",
    "Part 1: Chapter 2",
    "Part 1: Chapter 3",
    "Part 2: Chapter 4",
    "Part 2: Chapter 5",
    "Part 2: Chapter 6",
    "Part 2: Chapter 7",
    "Part 3: Chapter 8",
    "Part 3: Chapter 9",
    "Part 3: Chapter 10",
  ],
  "his divine grace": [
    "Chapter 1",
    "Chapter 2",
    "Chapter 3",
    "Chapter 4",
    "Chapter 5",
    "Chapter 6",
    "Chapter 7",
    "Chapter 8",
    "Chapter 9",
  ],
};

export function findChapterBreakdown(bookName: string): string[] | null {
  const lower = bookName.toLowerCase();
  let bestMatch: string[] | null = null;
  let bestLen = 0;
  for (const [key, assignments] of Object.entries(bookChapterBreakdown)) {
    if (lower.includes(key) && key.length > bestLen) {
      bestMatch = assignments;
      bestLen = key.length;
    }
  }
  return bestMatch;
}

const bufferAssignments = [
  "Catch-up", "Catch-up", "Review notes", "Verse memorization",
  "Reflection + unresolved questions", "Celebrate + plan next curriculum",
];

export function generateCurriculum(
  books: string[],
  startDate: string,
  targetWeeks: number,
  weeklyTargetHours: number,
  firstBookStartChapter?: string,
  paceMultiplier: number = 1
): CurriculumWeek[] {
  const activeBooks = books.length > 0 ? [...books] : ["Study"];
  const lastBook = activeBooks[activeBooks.length - 1];
  if (!lastBook?.toLowerCase().includes("buffer") && !lastBook?.toLowerCase().includes("review")) {
    activeBooks.push("Buffer / Review");
  }

  // Determine how many weeks each book needs based on its chapter breakdown
  // When paceMultiplier > 1, compress weeks by merging assignments
  const bookWeekCounts: number[] = [];
  const bookMergedBreakdowns: (string[] | null)[] = []; // store compressed assignments
  let assignedWeeks = 0;
  for (const book of activeBooks) {
    const isBuffer = book.toLowerCase().includes("buffer") || book.toLowerCase().includes("review");
    if (isBuffer) {
      // Buffer gets remaining weeks at the end
      bookWeekCounts.push(0); // placeholder
      bookMergedBreakdowns.push(null);
      continue;
    }
    const breakdown = findChapterBreakdown(book);
    if (breakdown) {
      // With faster pace, compress: e.g. 2x pace means cover 2 weeks of chapters in 1 week
      const compressedWeeks = Math.max(1, Math.ceil(breakdown.length / paceMultiplier));
      bookWeekCounts.push(compressedWeeks);
      assignedWeeks += compressedWeeks;
      // Merge breakdown assignments for compressed schedule
      if (paceMultiplier > 1 && compressedWeeks < breakdown.length) {
        const merged: string[] = [];
        const chunkSize = breakdown.length / compressedWeeks;
        for (let c = 0; c < compressedWeeks; c++) {
          const startIdx = Math.floor(c * chunkSize);
          const endIdx = Math.floor((c + 1) * chunkSize);
          const chunk = breakdown.slice(startIdx, endIdx);
          if (chunk.length === 1) {
            merged.push(chunk[0]);
          } else {
            // Combine first and last assignment labels
            const first = chunk[0].split("→")[0]?.trim() || chunk[0];
            const last = chunk[chunk.length - 1].split("→").pop()?.trim() || chunk[chunk.length - 1];
            merged.push(`${first} → ${last}`);
          }
        }
        bookMergedBreakdowns.push(merged);
      } else {
        bookMergedBreakdowns.push(breakdown);
      }
    } else {
      // Unknown book: allocate proportionally (minimum 1 week), also compress
      const baseWeeks = Math.max(1, Math.floor((targetWeeks - 6) / activeBooks.length));
      const compressedWeeks = Math.max(1, Math.ceil(baseWeeks / paceMultiplier));
      bookWeekCounts.push(compressedWeeks);
      assignedWeeks += compressedWeeks;
      bookMergedBreakdowns.push(null);
    }
  }

  // Allocate remaining weeks to buffer — grows automatically when pace compresses books
  const bufferIdx = activeBooks.findIndex((b) => b.toLowerCase().includes("buffer") || b.toLowerCase().includes("review"));
  if (bufferIdx >= 0) {
    const bufferWeeks = Math.max(1, targetWeeks - assignedWeeks);
    bookWeekCounts[bufferIdx] = bufferWeeks;
  }

  // Generate weeks
  let weekNum = 1;
  const weeks: CurriculumWeek[] = [];

  for (let i = 0; i < activeBooks.length; i++) {
    const book = activeBooks[i];
    const weeksForBook = bookWeekCounts[i];
    const isBuffer = book.toLowerCase().includes("buffer") || book.toLowerCase().includes("review");
    const breakdown = isBuffer ? null : bookMergedBreakdowns[i];

    for (let w = 0; w < weeksForBook; w++) {
      const start = addWeeks(new Date(startDate + "T12:00"), weekNum - 1);
      const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);

      let assignment: string;
      if (isBuffer) {
        assignment = bufferAssignments[w] || (w === weeksForBook - 1 ? "Celebrate + plan next" : "Catch-up / review");
      } else if (breakdown) {
        assignment = breakdown[w] || (w === weeksForBook - 1 ? "Finish book" : `Continue (week ${w + 1})`);
      } else {
        assignment = w === weeksForBook - 1 ? "Finish book" : `Part ${w + 1}`;
      }

      // Override first week of first book if user specified a starting chapter
      if (i === 0 && w === 0 && firstBookStartChapter) {
        assignment = `${firstBookStartChapter} → ${breakdown?.[0]?.replace(/^.*?(?=Ch|End|Finish)/i, "") || assignment}`;
        // If breakdown exists, modify to show "from X → end of breakdown[0] range"
        if (breakdown && breakdown[0]) {
          assignment = `${firstBookStartChapter} → ${breakdown[0].split("→").pop()?.trim() || breakdown[0]}`;
        }
      }

      weeks.push({
        week: weekNum,
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
        book,
        assignment,
        targetHours: Math.round(weeklyTargetHours * paceMultiplier * 2) / 2,
        actualHours: 0,
        complete: false,
        reflection: false,
        paceStatus: "Needs Time",
        notes: "",
      });
      weekNum++;
    }
  }

  return weeks;
}

/**
 * Shift future curriculum assignments down so the current week aligns with the
 * reader's actual position in the book. Past weeks are left unchanged.
 */
export function shiftCurriculumAssignments(
  curriculum: CurriculumWeek[],
  bookProgress: BookProgress[],
  settings: Settings,
  today: Date = new Date()
): CurriculumWeek[] {
  if (curriculum.length === 0) return curriculum;
  const startDate = parseISO(settings.planStartDate);
  const daysSinceStart = Math.max(0, differenceInDays(today, startDate));
  const currentWeekNum = Math.min(curriculum.length, Math.floor(daysSinceStart / 7) + 1);
  const currentIdx = currentWeekNum - 1;
  const currentBook = curriculum[currentIdx]?.book;
  if (!currentBook) return curriculum;

  const bookFirstWeek: Record<string, number> = {};
  for (const week of curriculum) {
    if (!(week.book in bookFirstWeek)) bookFirstWeek[week.book] = week.week;
  }

  // Only count weeks strictly before the current week as "completed" when
  // deciding where the reader is. Using future/current completions would
  // over-advance the schedule when the user is reading ahead or when the
  // current week's assignment changes.
  const completedChaptersByBook: Record<string, number> = {};
  for (const week of curriculum) {
    if (week.week >= currentWeekNum) continue;
    const isComplete = week.complete || /^Complete/i.test(week.paceStatus || "");
    if (isComplete) {
      completedChaptersByBook[week.book] = (completedChaptersByBook[week.book] || 0) + 1;
    }
  }

  const getCurrentChapter = (book: string) => {
    const bp = bookProgress.find((b) => bookMatches(b.book, book));
    const completed = completedChaptersByBook[book] || 0;
    const fromProgress = bp?.currentChapter ?? 1;
    // Prefer the larger of completed-weeks+1 or tracked chapter; this prevents
    // Foundation courses (which don't track currentChapter) from resetting to 1.
    return Math.max(completed + 1, fromProgress);
  };

  let changed = false;

  const next = curriculum.map((week) => {
    if (week.week < currentWeekNum) return week;
    const breakdown = findChapterBreakdown(week.book);
    if (!breakdown) return week;
    const firstWeek = bookFirstWeek[week.book] ?? week.week;
    const currentChapter = getCurrentChapter(week.book);
    const baseWeek = week.book === currentBook ? currentWeekNum : firstWeek;
    let idx = currentChapter - 1 + (week.week - baseWeek);
    idx = Math.max(0, Math.min(breakdown.length - 1, idx));
    const assignment = breakdown[idx] ?? "Finish book";
    if (assignment !== week.assignment) {
      changed = true;
      // Reset auto/manual completion flags because the assignment changed:
      // the user has not (yet) completed the newly assigned material.
      return { ...week, assignment, complete: false, paceStatus: "Needs Time" };
    }
    return { ...week, assignment };
  });

  return changed ? next : curriculum;
}

export interface DailyLogEntry {
  date: string;
  book: string;
  startLocation: string;
  endLocation: string;
  minutes: number | null;
  hours: number | null;
  sixteenRounds: boolean;
  sanskrit: boolean;
  wordMeanings: boolean;
  translation: boolean;
  purport: boolean;
  marked: boolean;
  reflection: boolean;
  dailyStudyComplete: boolean;
  quote: string;
  realization: string;
  notes: string;
  studyFocusLevel?: number | null; // 1-5: 1=distracted, 3=moderate, 5=deep absorption
}

export function getDayTargetHours(date: string, settings: Settings): number {
  const d = parseISO(date);
  const day = d.getDay();
  return day === 0 || day === 6 ? settings.weekendTargetHours : settings.minimumDailyStudyHours;
}

export function emptyDailyLogEntry(date: string): DailyLogEntry {
  return {
    date,
    book: "",
    startLocation: "",
    endLocation: "",
    minutes: null,
    hours: null,
    sixteenRounds: false,
    sanskrit: false,
    wordMeanings: false,
    translation: false,
    purport: false,
    marked: false,
    reflection: false,
    dailyStudyComplete: false,
    quote: "",
    realization: "",
    notes: "",
  };
}

export function recalcDailyStudyComplete(entry: DailyLogEntry, settings: Settings): DailyLogEntry {
  const dailyTarget = getDayTargetHours(entry.date, settings);
  const meetsTime = (entry.hours || 0) >= dailyTarget;
  return {
    ...entry,
    dailyStudyComplete: entry.sanskrit && entry.wordMeanings && entry.translation && entry.purport && entry.marked && entry.reflection && meetsTime,
  };
}

export function getAdjustedWeeklyTarget(settings: Settings): number {
  return (settings.weeklyTargetHours || 16) * (settings.paceMultiplier ?? 1);
}

/**
 * Calculate the number of curriculum weeks allocated to a given book.
 * The curriculum book field may contain multiple titles separated by "+" or "&".
 * Matching is done by abbreviation so full and short titles can be matched.
 */
export function getPlannedWeeksFromCurriculum(bookName: string, curriculum: CurriculumWeek[]): number {
  const targetAbbr = getBookAbbreviation(bookName);
  if (!targetAbbr) return 0;
  return curriculum.reduce((count, week) => {
    const weekAbbrs = week.book
      .split(/[\+&]/)
      .map((b) => getBookAbbreviation(b.trim()))
      .filter(Boolean);
    return weekAbbrs.includes(targetAbbr) ? count + 1 : count;
  }, 0);
}

/**
 * Get a default estimated total hours for a book based on planned weeks and course seed data.
 * For Foundation course, uses seedBookProgress values if the planned weeks match.
 * For other courses, falls back to planned weeks × 10 hours/week.
 */
export function getDefaultEstimatedTotalHours(
  bookName: string,
  plannedWeeks: number,
  activeCourseId: string,
  seedBookProgress: BookProgress[]
): number {
  if (activeCourseId === "course-1") {
    const seed = seedBookProgress.find((p) => p.book === bookName);
    if (seed && seed.plannedWeeks === plannedWeeks) {
      return seed.estimatedTotalHours;
    }
  }
  return plannedWeeks * 10;
}

export function getExpectedHours(daysSinceStart: number, settings: Settings): number {
  return (daysSinceStart / 7) * (settings.weeklyTargetHours || 16);
}

export function getAheadBehind(totalHoursLogged: number, expectedHours: number): number {
  return totalHoursLogged - expectedHours;
}

/**
 * Calculate effective study hours based on both logged time and current reading position.
 * For the current week and any prior weeks, the latest endLocation is compared to the
 * weekly assignment. If the reader is further along than the logged hours imply,
 * the position-based hours are used so the dashboard reflects actual progress.
 */
export function getEffectiveHours(
  dailyLog: DailyLogEntry[],
  curriculum: CurriculumWeek[],
  settings: Settings,
  today: Date = new Date()
): number {
  const totalHoursLogged = dailyLog.reduce((sum, e) => sum + (e.hours || 0), 0);
  const startDate = parseISO(settings.planStartDate);
  const daysSinceStart = Math.max(0, differenceInDays(today, startDate));
  const currentWeekNum = Math.min(curriculum.length || 32, Math.floor(daysSinceStart / 7) + 1);
  const expectedHours = getExpectedHours(daysSinceStart, settings);

  // If we have a reading position, use position-based progress as the source of truth
  // so that logged time cannot make the pace look better than the actual amount read.
  const hasReadingPosition = dailyLog.some((e) => e.endLocation && parseVerseRef(e.endLocation));
  if (hasReadingPosition) {
    let positionHours = 0;
    for (const week of curriculum) {
      if (!week || week.week > currentWeekNum) continue;
      const book = week.book || "";
      // Skip non-reading weeks like Buffer, Review, or Complete
      if (
        book.toLowerCase().includes("buffer") ||
        book.toLowerCase().includes("review") ||
        book.toLowerCase().includes("complete") ||
        book.toLowerCase().includes("celebrate")
      ) {
        continue;
      }
      const progress = getVerseProgressForWeek(book, week.assignment, dailyLog);
      if (progress) {
        positionHours += (progress.percent / 100) * week.targetHours;
      }
    }
    return Math.min(positionHours, expectedHours);
  }

  // Fall back to logged time when no reading position has been recorded.
  return Math.min(totalHoursLogged, expectedHours);
}

/**
 * Sync reading pace from the daily log so that the curriculum's target hours per week
 * reflect the user's actual time and reading position. This is a one-shot calculation:
 * it estimates the total hours each book will need based on logged hours vs position,
 * then sets a pace multiplier so the remaining weeks will require a realistic weekly target.
 */
export function syncReadingPace(
  dailyLog: DailyLogEntry[],
  bookProgress: BookProgress[],
  curriculum: CurriculumWeek[],
  settings: Settings,
  today: Date = new Date()
): { paceMultiplier: number; updatedBookProgress: BookProgress[] } {
  const startDate = parseISO(settings.planStartDate);
  const daysSinceStart = Math.max(0, differenceInDays(today, startDate));
  const currentWeekNum = Math.min(curriculum.length || settings.targetWeeks, Math.floor(daysSinceStart / 7) + 1);
  const remainingWeeks = Math.max(1, settings.targetWeeks - currentWeekNum + 1);

  const updatedBookProgress = bookProgress.map((bp) => {
    const entries = dailyLog.filter((e) => bookMatches(e.book, bp.book));
    const hoursLogged = entries.reduce((sum, e) => {
      const hrs = e.hours != null ? e.hours : e.minutes != null ? e.minutes / 60 : 0;
      return sum + hrs;
    }, 0);

    const latest = [...entries].sort((a, b) => b.date.localeCompare(a.date)).find((e) => e.endLocation);
    const positionPercent = latest ? getPositionPercentForBook(bp.book, latest.endLocation) : null;

    const hoursPercent = bp.estimatedTotalHours > 0 ? (hoursLogged / bp.estimatedTotalHours) * 100 : 0;
    const percentComplete = positionPercent != null ? positionPercent : (bp.percentComplete || hoursPercent || 0);

    const estimatedTotalHours =
      percentComplete > 0
        ? Math.round((hoursLogged / (percentComplete / 100)) * 10) / 10
        : bp.estimatedTotalHours;

    return {
      ...bp,
      hoursLogged: Math.round(hoursLogged * 100) / 100,
      percentComplete: Math.round(percentComplete),
      estimatedTotalHours: estimatedTotalHours > 0 ? estimatedTotalHours : bp.estimatedTotalHours,
    };
  });

  const remainingHours = updatedBookProgress.reduce((sum, bp) => {
    if (bp.complete) return sum;
    const logged = bp.hoursLogged || 0;
    return sum + Math.max(0, (bp.estimatedTotalHours || 0) - logged);
  }, 0);

  const weeklyNeeded = remainingHours / remainingWeeks;
  const baseWeekly = settings.weeklyTargetHours || 16;
  const newPaceMultiplier = baseWeekly > 0 ? weeklyNeeded / baseWeekly : 1;
  const paceMultiplier = Math.max(0.5, Math.min(2.0, Math.round(newPaceMultiplier * 10) / 10));

  return { paceMultiplier, updatedBookProgress };
}

export function getDailyVerseTarget(
  curriculum: CurriculumWeek[],
  settings: Settings,
  dailyLog: DailyLogEntry[],
  today: Date = new Date()
): string {
  const startDate = parseISO(settings.planStartDate);
  const daysSinceStart = Math.max(0, differenceInDays(today, startDate));
  const currentWeekNum = Math.min(32, Math.floor(daysSinceStart / 7) + 1);
  const currentWeek = curriculum.find((w) => w.week === currentWeekNum);
  if (!currentWeek) return "";

  const effectiveHours = getEffectiveHours(dailyLog, curriculum, settings, today);
  const expectedHours = getExpectedHours(daysSinceStart, settings);
  if (effectiveHours >= expectedHours) return "";

  const hoursBehind = expectedHours - effectiveHours;
  if (currentWeek.targetHours <= 0) return "";

  // Start from the reader's current position in the current week so the hint
  // is always ahead of where they already are.
  const currentProgress = getVerseProgressForWeek(currentWeek.book, currentWeek.assignment, dailyLog);
  const currentFraction = currentProgress ? currentProgress.percent / 100 : 0;
  const additionalFraction = Math.max(0, Math.min(1, hoursBehind / currentWeek.targetHours));
  const fractionNeeded = Math.max(0, Math.min(1, currentFraction + additionalFraction));

  const verseTarget = interpolateVerseTarget(currentWeek.assignment, currentWeek.book, fractionNeeded);
  if (!verseTarget) return "";

  return `Catch up to ${verseTarget} today`;
}

export interface BookProgress {
  book: string;
  plannedWeeks: number;
  startDate: string;
  finishDate: string;
  complete: boolean;
  hoursLogged: number;
  percentComplete: number;
  estimatedTotalHours: number;
  progressNotes: string;
  characters?: string[];
  // Optional page-based tracking (useful for parallel low-intensity reads
  // that span multiple courses — e.g. the Prabhupāda biography track):
  totalPages?: number;
  totalParts?: number;
  totalChapters?: number;
  currentPage?: number;
  currentPart?: number;
  currentChapter?: number;
  // "Slow-pace" nightly reading target — pages per day. When set, the book
  // shows a "tonight's reading" nudge and computes a projected finish date.
  dailyPagesTarget?: number;
  // Longest streak of consecutive days meeting the daily target (for
  // motivation — optional and lightweight).
  slowPaceStreak?: number;
  slowPaceLastLoggedDate?: string; // yyyy-MM-dd
}

export const curriculumBooks = [
  // Core study (Prabhupāda's primary books)
  "Bhagavad-gītā As It Is",
  "Śrīmad-Bhāgavatam Canto 1 Part 1",
  "Śrīmad-Bhāgavatam Canto 1 Part 2",
  "Śrīmad-Bhāgavatam Canto 2",
  "Śrīmad-Bhāgavatam Canto 3",
  "Śrīmad-Bhāgavatam Canto 4",
  "Śrīmad-Bhāgavatam Canto 5",
  "Śrīmad-Bhāgavatam Canto 6",
  "Śrīmad-Bhāgavatam Canto 7",
  "Śrīmad-Bhāgavatam Canto 8",
  "Śrīmad-Bhāgavatam Canto 9",
  "Śrīmad-Bhāgavatam Canto 10",
  "Śrīmad-Bhāgavatam Canto 11",
  "Śrīmad-Bhāgavatam Canto 12",
  "Śrī Caitanya-caritāmṛta",
  "Śrī Caitanya-caritāmṛta: Ādi-līlā Part 1",
  "Śrī Caitanya-caritāmṛta: Ādi-līlā Part 2",
  "Śrī Caitanya-caritāmṛta: Ādi-līlā Part 3",
  "Śrī Caitanya-caritāmṛta: Madhya-līlā",
  "Śrī Caitanya-caritāmṛta: Antya-līlā",
  // Foundational (introductory / shorter works)
  "Nectar of Instruction (Upadeśāmṛta)",
  "Nectar of Devotion (Bhakti-rasāmṛta-sindhu)",
  "Science of Self-Realization",
  "Beyond Birth and Death",
  "Easy Journey to Other Planets",
  "Perfection of Yoga",
  "Rāja-Vidyā: The King of Knowledge",
  "Elevation to Kṛṣṇa Consciousness",
  "Kṛṣṇa Consciousness: The Topmost Yoga System",
  "Kṛṣṇa Consciousness: The Matchless Gift",
  "On the Way to Kṛṣṇa",
  "Path of Perfection",
  "Life Comes from Life",
  "Message of Godhead",
  "Light of the Bhāgavata",
  "Renunciation Through Wisdom",
  "Quest for Enlightenment",
  "Civilization and Transcendence",
  "Second Chance",
  "Laws of Nature",
  "Journey of Self-Discovery",
  // Major works
  "Kṛṣṇa Book (Kṛṣṇa, The Supreme Personality of Godhead)",
  "Teachings of Lord Caitanya",
  "Teachings of Lord Kapila",
  "Teachings of Queen Kuntī",
  "Teachings of Prahlāda Mahārāja",
  "Nārada-bhakti-sūtra",
  "Mukunda-mālā-stotra",
  "Śrī Īśopaniṣad",
  "Śvetāśvatara Upaniṣad",
  // Prabhupāda's other writings
  "Prabhupāda-līlāmṛta",
  "Śrīla Prabhupāda Letters",
  "Conversations with Śrīla Prabhupāda",
  // Garga-saṁhitā series
  "Garga-saṁhitā: Canto 1 Part 1 (Goloka-khaṇḍa)",
  "Garga-saṁhitā: Canto 1 Part 2 (Goloka-khaṇḍa)",
  "Garga-saṁhitā: Canto 2 (Vrindāvana-khaṇḍa)",
  "Garga-saṁhitā: Canto 3 (Girirāja-khaṇḍa)",
  "Garga-saṁhitā: Canto 4 (Mādhurya-khaṇḍa)",
  "Garga-saṁhitā: Canto 5 (Mathurā-khaṇḍa)",
  "Garga-saṁhitā: Canto 6 (Dwaraka-khaṇḍa)",
  "Garga-saṁhitā: Canto 7 (Virajā-khaṇḍa)",
  "Garga-saṁhitā: Canto 8 (Balabhadra-khaṇḍa)",
  "Garga-saṁhitā: Canto 9 (Āśvamedhika-khaṇḍa)",
  "Garga-saṁhitā: Canto 10 (Svargārohaṇa-khaṇḍa)",
  "Kṛṣṇa's Planet (Garga-saṁhitā Summary Study)",
  // Gosvāmī literature
  "Bhakti-rasāmṛta-sindhu (full, Rūpa Gosvāmī)",
  "Ujjvala-nīlamaṇi (Rūpa Gosvāmī)",
  "Laghu-bhāgavatāmṛta (Rūpa Gosvāmī)",
  "Vidagdha-mādhava (Rūpa Gosvāmī)",
  "Lalita-mādhava (Rūpa Gosvāmī)",
  "Hari-bhakti-vilāsa (Sanātana Gosvāmī)",
  "Bṛhad-bhāgavatāmṛta (Sanātana Gosvāmī)",
  "Sat-sandarbha (Jīva Gosvāmī)",
  "Gopāla-campū (Jīva Gosvāmī)",
  "Mādhurya-kādambinī (Viśvanātha Cakravartī)",
  "Rāga-vartma-candrikā (Viśvanātha Cakravartī)",
  "Śrī Caitanya-bhāgavata (Vṛndāvana dāsa Ṭhākura)",
  "Prema-vivarta (Jagadānanda Paṇḍita)",
  // Vaiṣṇava ācārya works commonly read in ISKCON
  "Jaiva-dharma (Bhaktivinoda Ṭhākura)",
  "Harināma-cintāmaṇi (Bhaktivinoda Ṭhākura)",
  "Śrī Caitanya-śikṣāmṛta (Bhaktivinoda Ṭhākura)",
  "Bhaktyāloka (Bhaktivinoda Ṭhākura)",
  "Śrī Brahma-saṁhitā (with Bhaktisiddhānta commentary)",
  // Supplementary ISKCON study
  "Vaiṣṇava Songbook (Gītāvalī, Śaraṇāgati, etc.)",
  "Bhagavad-gītā — Verse Memorization Guide",
  "ISKCON Disciple Course Manual",
  "Bhakti Śāstrī Course Materials",
  "Bhakti Vaibhava Course Materials",
  "Māyāpur-Vṛndāvana Study Guides",
  // Course extras
  "Buffer / Review",
] as const;

export type CurriculumBook = (typeof curriculumBooks)[number];

export const bookCategories: { label: string; books: string[] }[] = [
  {
    label: "Core Study",
    books: [
      "Bhagavad-gītā As It Is",
      "Śrīmad-Bhāgavatam Canto 1 Part 1",
      "Śrīmad-Bhāgavatam Canto 1 Part 2",
      "Śrīmad-Bhāgavatam Canto 2",
      "Śrīmad-Bhāgavatam Canto 3",
      "Śrīmad-Bhāgavatam Canto 4",
      "Śrīmad-Bhāgavatam Canto 5",
      "Śrīmad-Bhāgavatam Canto 6",
      "Śrīmad-Bhāgavatam Canto 7",
      "Śrīmad-Bhāgavatam Canto 8",
      "Śrīmad-Bhāgavatam Canto 9",
      "Śrīmad-Bhāgavatam Canto 10",
      "Śrīmad-Bhāgavatam Canto 11",
      "Śrīmad-Bhāgavatam Canto 12",
      "Śrī Caitanya-caritāmṛta",
      "Śrī Caitanya-caritāmṛta: Ādi-līlā Part 1",
      "Śrī Caitanya-caritāmṛta: Ādi-līlā Part 2",
      "Śrī Caitanya-caritāmṛta: Ādi-līlā Part 3",
      "Śrī Caitanya-caritāmṛta: Madhya-līlā",
      "Śrī Caitanya-caritāmṛta: Antya-līlā",
    ],
  },
  {
    label: "Foundational / Introductory",
    books: [
      "Nectar of Instruction (Upadeśāmṛta)", "Nectar of Devotion (Bhakti-rasāmṛta-sindhu)",
      "Science of Self-Realization", "Beyond Birth and Death", "Easy Journey to Other Planets",
      "Perfection of Yoga", "Rāja-Vidyā: The King of Knowledge", "Elevation to Kṛṣṇa Consciousness",
      "Kṛṣṇa Consciousness: The Topmost Yoga System", "Kṛṣṇa Consciousness: The Matchless Gift",
      "On the Way to Kṛṣṇa", "Path of Perfection", "Life Comes from Life", "Message of Godhead",
      "Light of the Bhāgavata", "Renunciation Through Wisdom", "Quest for Enlightenment",
      "Civilization and Transcendence", "Second Chance", "Laws of Nature", "Journey of Self-Discovery",
    ],
  },
  {
    label: "Major Works",
    books: [
      "Kṛṣṇa Book (Kṛṣṇa, The Supreme Personality of Godhead)", "Teachings of Lord Caitanya",
      "Teachings of Lord Kapila", "Teachings of Queen Kuntī", "Teachings of Prahlāda Mahārāja",
      "Nārada-bhakti-sūtra", "Mukunda-mālā-stotra", "Śrī Īśopaniṣad",
    ],
  },
  {
    label: "Prabhupāda's Other Writings",
    books: ["Prabhupāda-līlāmṛta", "Śrīla Prabhupāda Letters", "Conversations with Śrīla Prabhupāda"],
  },
  {
    label: "Garga-saṁhitā",
    books: [
      "Garga-saṁhitā: Canto 1 Part 1 (Goloka-khaṇḍa)", "Garga-saṁhitā: Canto 1 Part 2 (Goloka-khaṇḍa)",
      "Garga-saṁhitā: Canto 2 (Vrindāvana-khaṇḍa)",
      "Garga-saṁhitā: Canto 3 (Girirāja-khaṇḍa)", "Garga-saṁhitā: Canto 4 (Mādhurya-khaṇḍa)",
      "Garga-saṁhitā: Canto 5 (Mathurā-khaṇḍa)", "Garga-saṁhitā: Canto 6 (Dwaraka-khaṇḍa)",
      "Garga-saṁhitā: Canto 7 (Virajā-khaṇḍa)", "Garga-saṁhitā: Canto 8 (Balabhadra-khaṇḍa)",
      "Garga-saṁhitā: Canto 9 (Āśvamedhika-khaṇḍa)", "Garga-saṁhitā: Canto 10 (Svargārohaṇa-khaṇḍa)",
      "Kṛṣṇa's Planet (Garga-saṁhitā Summary Study)",
    ],
  },
  {
    label: "Gosvāmī Literature",
    books: [
      "Bhakti-rasāmṛta-sindhu (full, Rūpa Gosvāmī)", "Ujjvala-nīlamaṇi (Rūpa Gosvāmī)",
      "Laghu-bhāgavatāmṛta (Rūpa Gosvāmī)", "Vidagdha-mādhava (Rūpa Gosvāmī)",
      "Lalita-mādhava (Rūpa Gosvāmī)",
      "Hari-bhakti-vilāsa (Sanātana Gosvāmī)", "Bṛhad-bhāgavatāmṛta (Sanātana Gosvāmī)",
      "Sat-sandarbha (Jīva Gosvāmī)", "Gopāla-campū (Jīva Gosvāmī)",
      "Mādhurya-kādambinī (Viśvanātha Cakravartī)", "Rāga-vartma-candrikā (Viśvanātha Cakravartī)",
      "Śrī Caitanya-bhāgavata (Vṛndāvana dāsa Ṭhākura)", "Prema-vivarta (Jagadānanda Paṇḍita)",
    ],
  },
  {
    label: "Vaiṣṇava Ācārya Works",
    books: [
      "Jaiva-dharma (Bhaktivinoda Ṭhākura)", "Harināma-cintāmaṇi (Bhaktivinoda Ṭhākura)",
      "Śrī Caitanya-śikṣāmṛta (Bhaktivinoda Ṭhākura)", "Bhaktyāloka (Bhaktivinoda Ṭhākura)",
      "Śrī Brahma-saṁhitā (with Bhaktisiddhānta commentary)",
    ],
  },
  {
    label: "ISKCON Study & Course Materials",
    books: [
      "Vaiṣṇava Songbook (Gītāvalī, Śaraṇāgati, etc.)", "Bhagavad-gītā — Verse Memorization Guide",
      "ISKCON Disciple Course Manual", "Bhakti Śāstrī Course Materials",
      "Bhakti Vaibhava Course Materials", "Māyāpur-Vṛndāvana Study Guides",
    ],
  },
  {
    label: "Course Extras",
    books: ["Buffer / Review"],
  },
];

export interface VerseMemory {
  id: string;
  monthPhase: string;
  source: CurriculumBook | string;
  versePassage: string;
  verseText: string;
  theme: string;
  priority: "Core" | "Support" | "Advanced";
  learned: boolean;
  meaningUnderstood: boolean;
  canRecite: boolean;
  review1: boolean;
  review1W: boolean;
  review1M: boolean;
  mastered: boolean;
  contextNotes: string;
  reflection: string;
}

export interface WeeklyReflection {
  week: number;
  biggestRealization: string;
  practicalApplication: string;
  questionForSenior: string;
  completed: boolean;
}

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
}

export interface SevaEntry {
  id: string;
  date: string;
  description: string;
  category: string;
  hours: number | null;
}

export const sevaCategories = [
  "Tulasi",
  "Deity Worship",
  "Cooking",
  "Cleaning",
  "Book Distribution",
  "Harināma",
  "Saṅgha Support",
  "Other",
] as const;

export const seedSevaLog: SevaEntry[] = [
  {
    id: "seed-seva-1",
    date: "2026-07-19",
    description: "Tulasi service — trimming the manjaris",
    category: "Tulasi",
    hours: null,
  },
];

export function emptySevaEntry(date: string): SevaEntry {
  return {
    id: `seva-${date}-${Math.random().toString(36).slice(2, 9)}`,
    date,
    description: "",
    category: "Other",
    hours: null,
  };
}

export interface VaisnavaEvent {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  type: "ekadashi" | "appearance" | "disappearance" | "festival";
  description: string;
  personDeity?: string;
  fastType?: "none" | "till-sunrise" | "till-noon" | "till-sunset" | "till-dusk" | "till-midnight" | "till-moonrise" | "nirjala";
  breakFast?: string;
  breakFastStart?: string;
  breakFastEnd?: string;
}

export const defaultHabits: GunaHabit[] = [
  // Mode of goodness — practices to cultivate
  { id: "bg-read", label: "Read Bhagavad-gītā / Bhāgavatam", guna: "goodness", mode: "practice", tracked: false },
  { id: "bg-16-attentive", label: "Chanted 16 rounds attentively", guna: "goodness", mode: "practice", tracked: false },
  { id: "bg-prasadam", label: "Ate only prasādam", guna: "goodness", mode: "practice", tracked: false },
  { id: "bg-brahma-muhurta", label: "Woke in brāhma-muhūrta", guna: "goodness", mode: "practice", tracked: false },
  { id: "bg-truthful", label: "Spoke truthfully & sweetly", guna: "goodness", mode: "practice", tracked: false },
  { id: "bg-seva", label: "Served others (sevā)", guna: "goodness", mode: "practice", tracked: false },
  { id: "bg-humility", label: "Practiced tolerance & humility", guna: "goodness", mode: "practice", tracked: false },
  // Mode of passion — habits to avoid
  { id: "rp-overeat", label: "Over-eating / sense gratification", guna: "passion", mode: "avoid", tracked: false },
  { id: "rp-anger", label: "Anger / argumentativeness", guna: "passion", mode: "avoid", tracked: false },
  { id: "rp-caffeine", label: "Caffeine / energy drinks", guna: "passion", mode: "avoid", tracked: false },
  { id: "rp-social-media", label: "Excessive social media", guna: "passion", mode: "avoid", tracked: false },
  { id: "rp-vaping", label: "Vaping / nicotine", guna: "passion", mode: "avoid", tracked: false },
  { id: "rp-lust", label: "Lusty thoughts / entertainment", guna: "passion", mode: "avoid", tracked: false },
  { id: "rp-ambition", label: "Excessive work / ambition", guna: "passion", mode: "avoid", tracked: false },
  // Mode of ignorance — habits to avoid
  { id: "ig-meat", label: "Meat eating", guna: "ignorance", mode: "avoid", tracked: false },
  { id: "ig-intoxication", label: "Intoxication (drugs / alcohol)", guna: "ignorance", mode: "avoid", tracked: false },
  { id: "ig-gambling", label: "Gambling", guna: "ignorance", mode: "avoid", tracked: false },
  { id: "ig-oversleep", label: "Sleeping too much", guna: "ignorance", mode: "avoid", tracked: false },
  { id: "ig-laziness", label: "Laziness / procrastination", guna: "ignorance", mode: "avoid", tracked: false },
  { id: "ig-gossip", label: "Gossip / harmful speech", guna: "ignorance", mode: "avoid", tracked: false },
  { id: "ig-heavy-food", label: "Heavy / tamasic food", guna: "ignorance", mode: "avoid", tracked: false },
];

export const defaultSettings: Settings = {
  planStartDate: "2026-07-06",
  targetWeeks: 32,
  weeklyTargetHours: 16,
  minimumDailyStudyHours: 2,
  weekendTargetHours: 3,
  targetFinishDate: "2027-02-14",
  paceMultiplier: 1,
  ekadashiFastingRequired: true,
  scheduleItems: [
    { key: "wakeUp330", label: "Wake up 3:30 AM", icon: "🌅" },
    { key: "showerTilak", label: "Shower, Tilak", icon: "🚿" },
    { key: "mangalaArati", label: "Maṅgala Āratī (4:30 AM)", icon: "🙏", linkedToJapa: true },
    { key: "bhogaArati", label: "Bhoga Āratī (noon)", icon: "🍽️", linkedToJapa: true },
    { key: "morningStudy", label: "Morning Study (8:30–9:00)", icon: "📖" },
    { key: "work", label: "Work (9:00–4:30)", icon: "💼", weekdayOnly: true },
    { key: "personalStudy", label: "Personal Study 2+ hrs (4:45–6:45)", icon: "📚" },
    { key: "gauraArati", label: "Gaura Āratī (evening)", icon: "🕯️", linkedToJapa: true },
    { key: "sanskritClass", label: "Sanskrit Class (Tue/Fri 7:30, Sat 7:30, Sun 8:00)", icon: "🗣️" },
    { key: "homePooja", label: "At-Home Pūjā", icon: "🪔" },
    { key: "sleep9pm", label: "Sleep by 9:00 PM", icon: "😴" },
  ],
  habits: defaultHabits,
};

export const seedCurriculum: CurriculumWeek[] = [
  { week: 1, startDate: "2026-07-06", endDate: "2026-07-12", book: "Bhagavad-gītā", assignment: "3.19 → End Chapter 4", targetHours: 16, actualHours: 1.83, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 2, startDate: "2026-07-13", endDate: "2026-07-19", book: "Bhagavad-gītā", assignment: "Chapters 5–6", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 3, startDate: "2026-07-20", endDate: "2026-07-26", book: "Bhagavad-gītā", assignment: "Chapters 7–8", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 4, startDate: "2026-07-27", endDate: "2026-08-02", book: "Bhagavad-gītā", assignment: "Chapters 9–10", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 5, startDate: "2026-08-03", endDate: "2026-08-09", book: "Bhagavad-gītā", assignment: "Chapters 11–12", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 6, startDate: "2026-08-10", endDate: "2026-08-16", book: "Bhagavad-gītā", assignment: "Chapters 13–15", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 7, startDate: "2026-08-17", endDate: "2026-08-23", book: "Bhagavad-gītā", assignment: "Chapters 16–17", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 8, startDate: "2026-08-24", endDate: "2026-08-30", book: "Bhagavad-gītā + Nectar of Instruction", assignment: "Finish BG + Finish NOI", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 9, startDate: "2026-08-31", endDate: "2026-09-06", book: "Science of Self-Realization", assignment: "Essays 1–12", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 10, startDate: "2026-09-07", endDate: "2026-09-13", book: "Science of Self-Realization", assignment: "Finish book", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 11, startDate: "2026-09-14", endDate: "2026-09-20", book: "Śrīmad-Bhāgavatam Canto 1 Part 1", assignment: "Chapters 1–4", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 12, startDate: "2026-09-21", endDate: "2026-09-27", book: "Śrīmad-Bhāgavatam Canto 1 Part 1", assignment: "Chapters 5–8", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 13, startDate: "2026-09-28", endDate: "2026-10-04", book: "Śrīmad-Bhāgavatam Canto 1 Part 1", assignment: "Chapters 9–12", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 14, startDate: "2026-10-05", endDate: "2026-10-11", book: "Śrīmad-Bhāgavatam Canto 1 Part 1", assignment: "Finish Part One", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 15, startDate: "2026-10-12", endDate: "2026-10-18", book: "Kṛṣṇa Book", assignment: "Chapters 1–12", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 16, startDate: "2026-10-19", endDate: "2026-10-25", book: "Kṛṣṇa Book", assignment: "Chapters 13–24", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 17, startDate: "2026-10-26", endDate: "2026-11-01", book: "Kṛṣṇa Book", assignment: "Chapters 25–36", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 18, startDate: "2026-11-02", endDate: "2026-11-08", book: "Kṛṣṇa Book", assignment: "Finish book", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 19, startDate: "2026-11-09", endDate: "2026-11-15", book: "Nectar of Devotion", assignment: "Chapters 1–9", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 20, startDate: "2026-11-16", endDate: "2026-11-22", book: "Nectar of Devotion", assignment: "Chapters 10–19", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 21, startDate: "2026-11-23", endDate: "2026-11-29", book: "Nectar of Devotion", assignment: "Chapters 20–29", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 22, startDate: "2026-11-30", endDate: "2026-12-06", book: "Nectar of Devotion", assignment: "Finish book", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 23, startDate: "2026-12-07", endDate: "2026-12-13", book: "Garga-saṁhitā: Canto 1 Part 1 (Goloka-khaṇḍa)", assignment: "Chapters 1–2", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 24, startDate: "2026-12-14", endDate: "2026-12-20", book: "Garga-saṁhitā: Canto 1 Part 1 (Goloka-khaṇḍa)", assignment: "Chapters 3–4", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 25, startDate: "2026-12-21", endDate: "2026-12-27", book: "Garga-saṁhitā: Canto 1 Part 1 (Goloka-khaṇḍa)", assignment: "Chapter 5", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 26, startDate: "2026-12-28", endDate: "2027-01-03", book: "Garga-saṁhitā: Canto 1 Part 1 (Goloka-khaṇḍa)", assignment: "Chapter 6 — Finish", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 27, startDate: "2027-01-04", endDate: "2027-01-10", book: "Buffer", assignment: "Catch-up", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 28, startDate: "2027-01-11", endDate: "2027-01-17", book: "Buffer", assignment: "Catch-up", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 29, startDate: "2027-01-18", endDate: "2027-01-24", book: "Buffer", assignment: "Review notes", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 30, startDate: "2027-01-25", endDate: "2027-01-31", book: "Buffer", assignment: "Verse memorization", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 31, startDate: "2027-02-01", endDate: "2027-02-07", book: "Buffer", assignment: "Reflection + unresolved questions", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 32, startDate: "2027-02-08", endDate: "2027-02-14", book: "Complete", assignment: "Celebrate + plan next curriculum", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
];

export const seedDailyLog: DailyLogEntry[] = [
  { date: "2026-06-13", book: "Bhagavad-gītā", startLocation: "1.1", endLocation: "1.46", minutes: 90, hours: 1.5, sixteenRounds: true, sanskrit: true, wordMeanings: true, translation: true, purport: true, marked: false, reflection: false, dailyStudyComplete: false, quote: "", realization: "", notes: "" },
  { date: "2026-06-20", book: "Bhagavad-gītā", startLocation: "2.1", endLocation: "2.30", minutes: 90, hours: 1.5, sixteenRounds: true, sanskrit: true, wordMeanings: true, translation: true, purport: true, marked: false, reflection: false, dailyStudyComplete: false, quote: "", realization: "", notes: "" },
  { date: "2026-06-21", book: "Bhagavad-gītā", startLocation: "2.30", endLocation: "2.72", minutes: 90, hours: 1.5, sixteenRounds: true, sanskrit: true, wordMeanings: true, translation: true, purport: true, marked: false, reflection: false, dailyStudyComplete: false, quote: "", realization: "", notes: "" },
  { date: "2026-07-06", book: "Bhagavad-gītā", startLocation: "3.2", endLocation: "3.35", minutes: 90, hours: 1.5, sixteenRounds: true, sanskrit: true, wordMeanings: true, translation: true, purport: true, marked: true, reflection: true, dailyStudyComplete: false, quote: "", realization: "", notes: "" },
  { date: "2026-07-07", book: "Bhagavad-gītā", startLocation: "3.35", endLocation: "3.38", minutes: 90, hours: 1.5, sixteenRounds: true, sanskrit: false, wordMeanings: false, translation: false, purport: false, marked: false, reflection: false, dailyStudyComplete: false, quote: "", realization: "", notes: "" },
  { date: "2026-07-08", book: "Bhagavad-gītā", startLocation: "3.38", endLocation: "", minutes: null, hours: null, sixteenRounds: false, sanskrit: false, wordMeanings: false, translation: false, purport: false, marked: false, reflection: false, dailyStudyComplete: false, quote: "", realization: "", notes: "" },
];

// Seed for the parallel Prabhupāda Biography course books. Applied via a
// one-time patch effect in page.tsx so existing installs pick them up.
export const seedBiographyBookProgress: BookProgress[] = [
  {
    book: "Swami in a Strange Land (Prabhupāda biography, Joshua M. Greene)",
    plannedWeeks: 40, // ~9 months at 1 page/night for 278 pages
    startDate: "2026-07-06",
    finishDate: "",
    complete: false,
    hoursLogged: 0,
    percentComplete: 0,
    estimatedTotalHours: 20, // ~2 pages/hr × 278 pages, light reading
    progressNotes:
      "Prabhupāda biography by Joshua M. Greene. 278 pages · 3 parts · 10 chapters. Slow-pace read across all courses at ~1 page/night — see the Tonight card in Book Progress.",
    totalPages: 278,
    totalParts: 3,
    totalChapters: 10,
    currentPage: 0,
    currentPart: 1,
    currentChapter: 1,
    dailyPagesTarget: 1,
    characters: [
      "A.C. Bhaktivedānta Swami Prabhupāda — Founder-Ācārya of ISKCON, main subject of the biography",
      "Joshua M. Greene (Yogeśvara Dāsa) — author, disciple of Prabhupāda",
    ],
  },
  {
    book: "His Divine Grace (HH Dānavīr Goswami — his own biography & how he met Śrīla Prabhupāda)",
    plannedWeeks: 28, // ~7 months at 1 page/night for 196 pages
    startDate: "",
    finishDate: "",
    complete: false,
    hoursLogged: 0,
    percentComplete: 0,
    estimatedTotalHours: 14, // ~2 pages/hr × 196 pages
    progressNotes:
      "HH Dānavīr Goswami's own biography, especially how he met Śrīla Prabhupāda. 196 pages · 9 chapters. Read after Swami in a Strange Land completes.",
    totalPages: 196,
    totalParts: 1,
    totalChapters: 9,
    currentPage: 0,
    currentPart: 1,
    currentChapter: 1,
    dailyPagesTarget: 0, // starts inactive; activate once first book is done
  },
];

export const seedBookProgress: BookProgress[] = [
  { book: "Bhagavad-gītā As It Is", plannedWeeks: 8, startDate: "2026-07-06", finishDate: "", complete: false, hoursLogged: 1.83, percentComplete: 15, estimatedTotalHours: 50, progressNotes: "Started at 3.19 (Ch 1–3.18 read before course). Est. hours covers 3.19 → end of Ch 18.", characters: [
    "Kṛṣṇa — Supreme Personality of Godhead, charioteer and teacher of Arjuna",
    "Arjuna — Pāṇḍava warrior and primary student of the Gītā",
    "Sañjaya — Narrator with divine vision, reports the dialogue to Dhṛtarāṣṭra",
    "Dhṛtarāṣṭra — Blind king of the Kurus, father of the Kauravas",
    "Vyāsadeva — Compiler of the Vedas who grants Sañjaya his mystic vision",
    "Duryodhana — Leader of the Kauravas, inspires the war",
    "Bhīṣma — Grandsire of the Kuru dynasty, commander of Kaurava forces",
    "Droṇa — Military teacher of both Pāṇḍavas and Kauravas",
    "Karṇa — Warrior allied with Duryodhana, Arjuna's rival",
    "Hanumān — Present on Arjuna's flag as his emblem",
  ] },
  { book: "Nectar of Instruction (Upadeśāmṛta)", plannedWeeks: 1, startDate: "", finishDate: "", complete: false, hoursLogged: 0, percentComplete: 0, estimatedTotalHours: 8, progressNotes: "", characters: [
    "Rūpa Gosvāmī — Author; foremost disciple of Lord Caitanya, systematizer of devotional science",
    "Lord Caitanya (Śrī Caitanya Mahāprabhu) — Supreme Lord in devotee form, instructor of Rūpa Gosvāmī",
    "Sanātana Gosvāmī — Elder brother of Rūpa, co-establisher of Gauḍīya theology in Vṛndāvana",
    "Haridāsa Ṭhākura — Exemplar of chanting tolerance (referenced in purports)",
    "Raghunātha dāsa Gosvāmī — Exemplar of renunciation and exclusive devotion",
  ] },
  { book: "Science of Self-Realization", plannedWeeks: 2, startDate: "", finishDate: "", complete: false, hoursLogged: 0, percentComplete: 0, estimatedTotalHours: 16, progressNotes: "", characters: [
    "A.C. Bhaktivedanta Swami Prabhupāda — Author, interviews and essays compiled here",
    "Kṛṣṇa — Supreme Lord, central subject of all discussions",
    "Lord Caitanya — Inaugurator of the saṅkīrtana movement, frequently cited",
    "John Lennon — Beatle; featured in a conversation with Prabhupāda",
    "George Harrison — Beatle; contributed foreword and supported the Hare Kṛṣṇa movement",
    "Allen Ginsberg — Poet; conversation partner of Prabhupāda",
    "Bob Cohen (Brahmānanda Dāsa) — Student who asked Prabhupāda key philosophical questions",
  ] },
  { book: "Śrīmad-Bhāgavatam Canto 1 Part 1", plannedWeeks: 4, startDate: "", finishDate: "", complete: false, hoursLogged: 0, percentComplete: 0, estimatedTotalHours: 40, progressNotes: "", characters: [
    "Śukadeva Gosvāmī — Son of Vyāsadeva, born self-realized; primary narrator of the entire Śrīmad-Bhāgavatam to King Parīkṣit. Though a liberated soul from birth, he was attracted by the pastimes of Kṛṣṇa and agreed to speak the Bhāgavatam.",
    "Parīkṣit Mahārāja — Grandson of Arjuna, emperor of the world, cursed by Śṛṅgi to die in seven days from a snakebite. His curse becomes the catalyst for hearing the Bhāgavatam. He represents the ideal listener — attentive, surrendered, and free from material attachment.",
    "Vyāsadeva (Kṛṣṇa Dvaipāyana) — Literary incarnation of Kṛṣṇa who compiled all Vedic literature. Despite this monumental work, he felt dissatisfied until Nārada instructed him to write the Śrīmad-Bhāgavatam, glorifying Kṛṣṇa's personal pastimes.",
    "Nārada Muni — Vyāsa's spiritual master; travels the three worlds singing the glories of Nārāyaṇa on his vīṇā. Instructs Vyāsa on the cause of his dissatisfaction (Ch. 5–6) and narrates his own previous birth as a maidservant's son who served great sages.",
    "Sūta Gosvāmī — Disciple of Śukadeva; recounts the entire Bhāgavatam dialogue to the assembly of sages at Naimiṣāraṇya forest. He is the outermost narrator of the text.",
    "Śaunaka Ṛṣi — Chief of the 60,000 sages performing a long sacrifice at Naimiṣāraṇya; poses the initial questions to Sūta that launch the Bhāgavatam narration (Ch. 1).",
    "Kṛṣṇa (Śrī Kṛṣṇa) — The Supreme Personality of Godhead. His departure from the earth at the end of the Dvāpara-yuga triggers the deterioration of dharma and sets the backdrop for the entire Canto. Protects the Pāṇḍavas throughout.",
    "Arjuna — Third Pāṇḍava, intimate friend and student of Kṛṣṇa. After Kṛṣṇa's departure, he is overcome with grief, loses his mystic powers, and cannot even string his bow (Ch. 7, 14–15). His bewilderment illustrates total dependence on the Lord.",
    "Bhīṣmadeva — Grandsire of the Kuru dynasty, lying on a bed of arrows after the Battle of Kurukṣetra. Delivers profound instructions on dharma and bhakti to Yudhiṣṭhira while meditating on Kṛṣṇa's form at the moment of death (Ch. 9).",
    "Kuntī (Queen Kuntīdevī) — Mother of Yudhiṣṭhira, Bhīma, and Arjuna. Offers celebrated prayers to Kṛṣṇa (Ch. 8), asking for calamities so that she may always remember Him. Her prayers are among the most cherished in the Bhāgavatam.",
    "Yudhiṣṭhira Mahārāja — Eldest Pāṇḍava, embodiment of dharma. After the devastating war he is grief-stricken at the loss of life and must be counseled by Bhīṣma, Kṛṣṇa, and Vyāsa before accepting the throne.",
    "Bhīmasena — Second Pāṇḍava, mighty warrior. Captures Aśvatthāmā after the brahmāstra attack; his rage is tempered by Arjuna's mercy toward the fallen son of Droṇa.",
    "Draupadī — Queen of the Pāṇḍavas; her honor was attacked in the Kuru assembly and protected by Kṛṣṇa. Demands justice against Aśvatthāmā for the murder of her sleeping sons (Ch. 7).",
    "Aśvatthāmā — Son of Droṇācārya. Cowardly attacks the Pāṇḍava camp at night, killing Draupadī's five sons. Fires the brahmāstra at Uttarā's womb to destroy the Pāṇḍava dynasty; Kṛṣṇa personally protects the embryo (Parīkṣit).",
    "Uttarā — Wife of Abhimanyu, mother of Parīkṣit. When Aśvatthāmā's brahmāstra threatens her unborn child, she takes shelter of Kṛṣṇa, who enters her womb to protect the future emperor (Ch. 8).",
    "Abhimanyu — Son of Arjuna and Subhadrā, heroic warrior killed treacherously in the Kurukṣetra battle. His death and the threat to his unborn son Parīkṣit drive key events.",
    "Dhṛtarāṣṭra — Blind king, father of the Kauravas. After the war he stays in Yudhiṣṭhira's palace, served by the very nephews whose sons he failed to protect. His attachment and eventual departure are narrated.",
    "Vidura — Uncle of the Pāṇḍavas, born of Vyāsa and a maidservant. Embodiment of righteousness; he departed the palace to go on pilgrimage. His return and counsel to Dhṛtarāṣṭra are referenced.",
    "Gāndhārī — Wife of Dhṛtarāṣṭra, mother of the hundred Kauravas. Accompanies her husband when he finally leaves for the forest.",
    "Droṇācārya — Preceptor of the Kuru princes in military arts. Father of Aśvatthāmā. His legacy haunts the post-war chapters.",
    "Subhadrā — Sister of Kṛṣṇa, wife of Arjuna, mother of Abhimanyu. Present during the family's grief after the war.",
    "Dharma (Yamarāja) — Personification of religious duty. Appears disguised as a bull in the story of King Parīkṣit's encounter with the age of Kali, where the bull of dharma stands on one leg (referenced in later chapters of Canto 1).",
    "Kali (personified) — The personality of the age of quarrel and hypocrisy, encountered by Parīkṣit disguised as a low-class person beating the bull of dharma and the cow of earth.",
    "Pṛthā — Another name for Kuntī, used frequently in the text; mother of three Pāṇḍavas by the grace of demigods.",
    "Duryodhana — Eldest Kaurava, primary antagonist of the Mahābhārata war. Though dead by Canto 1, his actions and their consequences pervade the narrative.",
    "Karṇa — Warrior allied with Duryodhana, Arjuna's half-brother. Referenced in Bhīṣma's instructions and the war aftermath.",
    "Śṛṅgi — Young brāhmaṇa boy who curses Parīkṣit for placing a dead snake on his meditating father Śamīka. His impulsive curse sets the Bhāgavatam in motion.",
    "Śamīka Ṛṣi — Meditating sage, father of Śṛṅgi. He regrets his son's hasty curse upon the king and sends word to warn Parīkṣit.",
    "Takṣaka — King of the serpents, destined to be the instrument of Parīkṣit's death as ordained by Śṛṅgi's curse.",
    "Hanumān — Present on Arjuna's flag as his emblem and protector; symbolizes Arjuna's divine support in battle.",
    "Nakula and Sahadeva — Youngest Pāṇḍavas, twins born of the Aśvinī-kumāras. Present in post-war events and the coronation of Yudhiṣṭhira.",
  ] },
  { book: "Kṛṣṇa Book (Kṛṣṇa, The Supreme Personality of Godhead)", plannedWeeks: 4, startDate: "", finishDate: "", complete: false, hoursLogged: 0, percentComplete: 0, estimatedTotalHours: 35, progressNotes: "", characters: [
    "Kṛṣṇa — Supreme Lord performing pastimes in Vṛndāvana, Mathurā, and Dvārakā",
    "Balarāma (Baladeva) — Kṛṣṇa's elder brother, first expansion of the Lord",
    "Nanda Mahārāja — Kṛṣṇa's foster father, king of Vraja",
    "Yaśodā — Kṛṣṇa's foster mother, embodies parental love for God",
    "Vasudeva — Kṛṣṇa's birth father, carries Him to Gokula",
    "Devakī — Kṛṣṇa's birth mother, imprisoned by Kaṁsa",
    "Kaṁsa — Demonic king of Mathurā, Kṛṣṇa's maternal uncle and chief antagonist",
    "Rādhārāṇī — Kṛṣṇa's eternal consort, supreme embodiment of devotion",
    "Gopīs — Cowherd maidens of Vraja, topmost devotees in conjugal love",
    "Rukmiṇī — Kṛṣṇa's principal queen in Dvārakā",
    "Satyabhāmā — Another prominent queen of Kṛṣṇa in Dvārakā",
    "Uddhava — Kṛṣṇa's cousin and confidential messenger to the gopīs",
    "Akrūra — Sent by Kaṁsa to bring Kṛṣṇa to Mathurā",
    "Pūtanā — Demoness who tried to poison baby Kṛṣṇa",
    "Brahmā — Creator god who tests Kṛṣṇa by stealing the cowherd boys and calves",
    "Indra — King of heaven; humbled when Kṛṣṇa lifts Govardhana Hill",
    "Śiśupāla — Enemy king killed by Kṛṣṇa at the Rājasūya sacrifice",
    "Jarāsandha — Powerful demon king who besieges Mathurā repeatedly",
    "Sudāmā (Kucela) — Kṛṣṇa's poor brāhmaṇa friend from school days",
    "Narada Muni — Sage who orchestrates events connecting pastimes",
  ] },
  { book: "Nectar of Devotion (Bhakti-rasāmṛta-sindhu)", plannedWeeks: 4, startDate: "", finishDate: "", complete: false, hoursLogged: 0, percentComplete: 0, estimatedTotalHours: 40, progressNotes: "", characters: [
    "Rūpa Gosvāmī — Original author of Bhakti-rasāmṛta-sindhu",
    "A.C. Bhaktivedanta Swami Prabhupāda — Summary study author and commentator",
    "Kṛṣṇa — Object of all rasas (devotional mellows)",
    "Rādhārāṇī — Supreme example of mahābhāva, highest devotional ecstasy",
    "Lord Caitanya — Embodies the mood of Rādhārāṇī; context for the book's mission",
    "Sanātana Gosvāmī — Elder Gosvāmī whose works complement Rūpa's system",
    "Prahlāda Mahārāja — Exemplar of śānta and dāsya-rasa devotion",
    "Hanumān — Exemplar of dāsya-rasa (servitorship)",
    "Arjuna — Exemplar of sakhya-rasa (friendship with Kṛṣṇa)",
    "Yaśodā — Exemplar of vātsalya-rasa (parental love)",
    "Gopīs of Vraja — Exemplars of mādhurya-rasa (conjugal love)",
    "Uddhava — Example of a devotee aspiring to elevate his rasa",
  ] },
  { book: "Garga-saṁhitā: Canto 1 Part 1 (Goloka-khaṇḍa)", plannedWeeks: 4, startDate: "", finishDate: "", complete: false, hoursLogged: 0, percentComplete: 0, estimatedTotalHours: 30, progressNotes: "", characters: [
    "Garga Muni — Narrator and family priest of the Yadu dynasty, author of this saṁhitā. He recounts confidential pastimes of Kṛṣṇa in Goloka Vṛndāvana at Nārada's request. He is uniquely qualified as he performed the secret name-giving ceremony of Kṛṣṇa and Balarāma.",
    "Nārada Muni — The eternal travelling sage and foremost devotee; he asks Garga Muni the questions that frame the entire narrative. His inquiries guide the revelation of the Goloka pastimes.",
    "Kṛṣṇa (Śrī Kṛṣṇa) — The Supreme Personality of Godhead in His original, two-armed form in Goloka Vṛndāvana. The Goloka-khaṇḍa reveals His eternal pastimes that exist beyond creation, including His playful interactions with the gopīs and cowherd boys.",
    "Śrīmatī Rādhārāṇī — Kṛṣṇa's eternal consort and the supreme embodiment of hlādinī-śakti (pleasure potency). Central to the Goloka-khaṇḍa; Her transcendental jealousy (māna) toward Virajā sets major events in motion. She is described as inseparable from Kṛṣṇa and the source of all gopīs.",
    "Balarāma (Baladeva) — Kṛṣṇa's first expansion and elder brother. Present in Goloka as the original spiritual master (ādi-guru). His sandhinī-śakti sustains all existence. He mediates in the conflicts arising from Rādhā's jealous anger.",
    "Virajā — A gopī in Goloka whose intimate pastime with Kṛṣṇa provokes Rādhārāṇī's intense jealous anger. When cursed by Rādhā, she leaves Goloka weeping and her tears form the river Virajā that separates the spiritual and material worlds. A pivotal character whose pastime explains cosmic geography.",
    "Śrīdāmā — Rādhārāṇī's brother and a cowherd companion of Kṛṣṇa. In the Goloka pastime, he defends Virajā and speaks harshly to Rādhā; Rādhā curses him to take birth as a demon, and he curses Her to descend to earth. These mutual curses become the reason for Kṛṣṇa's earthly avatāra.",
    "Lalitā — The foremost of Rādhārāṇī's eight principal sakhīs (girlfriends). Bold and outspoken, she actively supports Rādhā in Her māna and confrontation. Present throughout the Goloka pastimes as Rādhā's closest confidante.",
    "Viśākhā — Another principal sakhī of Rādhārāṇī, gentle and wise. She often counsels Rādhā toward reconciliation and serves as a mediator between the divine couple.",
    "Candrāvalī — A prominent gopī and gentle rival of Rādhā for Kṛṣṇa's attention. Her group of gopīs represents a contrasting mood (praṇaya) to Rādhā's party in the Goloka pastimes.",
    "Brahmā — The first created being and secondary creator of the universe. In the Goloka-khaṇḍa he receives darśana of the spiritual world and instructions about Kṛṣṇa's supreme position. His vision of Goloka establishes the hierarchy of spiritual realms.",
    "Tulasī (Vṛndā Devī) — Goddess presiding over the sacred Tulasī plant and the forests of Vṛndāvana. Her origin in Goloka is narrated; she is an expansion of Rādhārāṇī's potency who facilitates the divine couple's meetings. Without her no worship of Viṣṇu is complete.",
    "Śiva (Mahādeva) — Referenced in the Goloka-khaṇḍa as the greatest Vaiṣṇava, standing at the boundary of the spiritual world. His relationship to Goloka and his devotion to Kṛṣṇa are established.",
    "Lakṣmī Devī — Goddess of fortune, consort of Nārāyaṇa. Her position relative to Rādhārāṇī is clarified — she is an expansion of Rādhā's potency, situated in Vaikuṇṭha but longing for the sweetness of Vṛndāvana.",
    "Sūryadeva (the Sun-god) — Father of Yamunadevī; his lineage and relationship to Goloka are mentioned in the cosmological framework of the text.",
    "Yamunādevī — The personified Yamunā river, daughter of the Sun-god. She appears in Goloka before manifesting on earth; her waters are considered as sacred as Rādhā's tears of love.",
    "Nanda Mahārāja — King of Vraja and Kṛṣṇa's eternal foster father in Goloka. The Goloka-khaṇḍa establishes that the earthly Nanda is identical with the eternal Nanda — his parental love (vātsalya) for Kṛṣṇa is not material.",
    "Yaśodā — Kṛṣṇa's eternal foster mother in Goloka. Her parental affection is so powerful that it binds the Supreme Lord. Her Goloka identity establishes that Kṛṣṇa's childhood pastimes are eternally ongoing.",
    "Gopīs of Goloka — The eternal cowherd maidens of Goloka Vṛndāvana, expansions of Rādhārāṇī's hlādinī-śakti. They exist in groups (yūthas) led by Lalitā, Viśākhā, Candrāvalī, and others. Their love for Kṛṣṇa is the highest form of devotion.",
    "Surabhi Cows — The divine wish-fulfilling cows of Goloka, tended by Kṛṣṇa personally. The Goloka-khaṇḍa describes them as the source of all prosperity and an integral part of Kṛṣṇa's pastoral identity.",
  ] },
];

// Well-known "must memorize" verses that are always Core regardless of source
const coreVerseRefs = new Set([
  "bg 2.13", "bg 2.20", "bg 2.47", "bg 3.9", "bg 4.7", "bg 4.34",
  "bg 7.14", "bg 9.22", "bg 9.26", "bg 18.65", "bg 18.66",
  "sb 1.1.1", "sb 1.2.6", "sb 1.2.17", "sb 1.2.18", "sb 1.3.28",
  "sb 1.2.28", "sb 1.5.11",
  "cc madhya 7.128", "cc adi 1.1", "cc adi 1.3", "cc madhya 6.163",
  "cc madhya 19.151", "cc madhya 20.108", "cc madhya 22.107",
  "noi 1", "nbs 1",
]);

// Books considered foundational — default Support; others default Advanced
const foundationalBookPatterns = [
  "bhagavad-gītā", "bhagavad-gita", "nectar of instruction", "upadeśāmṛta",
  "nectar of devotion", "śrīmad-bhāgavatam", "bhāgavatam",
  "caitanya-caritāmṛta", "science of self-realization",
  "teachings of lord caitanya", "teachings of lord kapila",
  "teachings of queen kuntī", "brahma-saṁhitā", "brahma-samhita",
  "nārada-bhakti-sūtra", "narada-bhakti-sutra",
  "śrī īśopaniṣad", "isopanisad",
  "śvetāśvatara upaniṣad", "svetasvatara upanisad",
];

/**
 * Auto-detect verse priority based on source book and verse reference.
 * Core: well-known essential verses every devotee memorizes.
 * Support: verses from foundational books (BG, SB, CC, NOI, etc.).
 * Advanced: verses from advanced/specialized texts (Gosvāmī literature, Sandarbhas, etc.).
 */
export function autoDetectPriority(versePassage: string, bookName: string): "Core" | "Support" | "Advanced" {
  // Normalize the passage reference to check against known core verses
  const normalizedRef = versePassage.trim().toLowerCase();
  for (const ref of coreVerseRefs) {
    if (normalizedRef.includes(ref) || normalizedRef === ref) return "Core";
  }

  // Check if the book is foundational → Support, otherwise → Advanced
  const lowerBook = bookName.toLowerCase();
  for (const pattern of foundationalBookPatterns) {
    if (lowerBook.includes(pattern)) return "Support";
  }

  return "Advanced";
}

export const seedVerseMemory: VerseMemory[] = [
  { id: "v1", monthPhase: "Month 1", source: "Bhagavad-gītā", versePassage: "BG 2.13", verseText: "As the embodied soul continuously passes, in this body, from boyhood to youth to old age, the soul similarly passes into another body at death. A sober person is not bewildered by such a change.", theme: "Eternal soul / changing bodies", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v2", monthPhase: "Month 1", source: "Bhagavad-gītā", versePassage: "BG 2.20", verseText: "For the soul there is neither birth nor death at any time. He has not come into being, does not come into being, and will not come into being. He is unborn, eternal, ever-existing and primeval. He is not slain when the body is slain.", theme: "The soul is never born or slain", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v3", monthPhase: "Month 1", source: "Bhagavad-gītā", versePassage: "BG 2.47", verseText: "You have a right to perform your prescribed duty, but you are not entitled to the fruits of action. Never consider yourself the cause of the results of your activities, and never be attached to not doing your duty.", theme: "Duty without attachment to results", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v4", monthPhase: "Month 1", source: "Bhagavad-gītā", versePassage: "BG 2.70", verseText: "A person who is not disturbed by the incessant flow of desires — that enter like rivers into the ocean, which is ever being filled but is always still — can alone achieve peace, and not the man who strives to satisfy such desires.", theme: "Peace through detachment", priority: "Support", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v5", monthPhase: "Month 1", source: "Bhagavad-gītā", versePassage: "BG 3.9", verseText: "Work done as a sacrifice for Viṣṇu has to be performed, otherwise work causes bondage in this material world. Therefore, O son of Kuntī, perform your prescribed duties for His satisfaction, and in that way you will always remain free from bondage.", theme: "Work as sacrifice for Viṣṇu", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v6", monthPhase: "Month 1", source: "Bhagavad-gītā", versePassage: "BG 3.21", verseText: "Whatever action a great man performs, common men follow. And whatever standards he sets by exemplary acts, all the world pursues.", theme: "Leading by example", priority: "Support", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v7", monthPhase: "Month 1", source: "Bhagavad-gītā", versePassage: "BG 4.7", verseText: "Whenever and wherever there is a decline in religious practice, O descendant of Bharata, and a predominant rise of irreligion — at that time I descend Myself.", theme: "Kṛṣṇa appears to protect dharma", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v8", monthPhase: "Month 1", source: "Bhagavad-gītā", versePassage: "BG 4.8", verseText: "To deliver the pious and to annihilate the miscreants, as well as to reestablish the principles of religion, I Myself appear, millennium after millennium.", theme: "Kṛṣṇa's mission of descent", priority: "Support", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v9", monthPhase: "Month 1", source: "Bhagavad-gītā", versePassage: "BG 4.9", verseText: "One who knows the transcendental nature of My appearance and activities does not, upon leaving the body, take his birth again in this material world, but attains My eternal abode, O Arjuna.", theme: "Knowing Kṛṣṇa's birth and activities", priority: "Support", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v10", monthPhase: "Month 1", source: "Bhagavad-gītā", versePassage: "BG 4.34", verseText: "Just try to learn the truth by approaching a spiritual master. Inquire from him submissively and render service unto him. The self-realized souls can impart knowledge unto you because they have seen the truth.", theme: "Approaching guru", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v11", monthPhase: "Month 2", source: "Bhagavad-gītā", versePassage: "BG 7.14", verseText: "This divine energy of Mine, consisting of the three modes of material nature, is difficult to overcome. But those who have surrendered unto Me can easily cross beyond it.", theme: "Crossing māyā by surrender", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v12", monthPhase: "Month 2", source: "Bhagavad-gītā", versePassage: "BG 9.22", verseText: "But those who always worship Me with exclusive devotion, meditating on My transcendental form — to them I carry what they lack, and I preserve what they have.", theme: "Kṛṣṇa carries what devotees lack", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v13", monthPhase: "Month 2", source: "Bhagavad-gītā", versePassage: "BG 9.26", verseText: "If one offers Me with love and devotion a leaf, a flower, a fruit or water, I will accept it.", theme: "Offering leaf, flower, fruit, water", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v14", monthPhase: "Month 2", source: "Bhagavad-gītā", versePassage: "BG 10.8", verseText: "I am the source of all spiritual and material worlds. Everything emanates from Me. The wise who perfectly know this engage in My devotional service and worship Me with all their hearts.", theme: "Kṛṣṇa is source of everything", priority: "Support", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v15", monthPhase: "Month 2", source: "Bhagavad-gītā", versePassage: "BG 18.65", verseText: "Always think of Me, become My devotee, worship Me and offer your homage unto Me. Thus you will come to Me without fail. I promise you this because you are My very dear friend.", theme: "Think of Me, become My devotee", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v16", monthPhase: "Month 2", source: "Bhagavad-gītā", versePassage: "BG 18.66", verseText: "Abandon all varieties of religion and just surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.", theme: "Surrender to Kṛṣṇa", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v17", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.2.6", verseText: "The supreme occupation for all humanity is that by which men can attain to loving devotional service unto the transcendent Lord. Such devotional service must be unmotivated and uninterrupted to completely satisfy the self.", theme: "Topmost dharma is pure devotion", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v18", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.2.17", verseText: "Śrī Kṛṣṇa, the Personality of Godhead, who is the Paramātmā in everyone's heart and the benefactor of the truthful devotee, cleanses desire for material enjoyment from the heart of the devotee who has developed the urge to hear His messages.", theme: "Hearing cleanses the heart", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v19", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.2.18", verseText: "By regular attendance in classes on the Bhāgavatam and by rendering of service to the pure devotee, all that is troublesome to the heart is almost completely destroyed, and loving service unto the Personality of Godhead is established as an irrevocable fact.", theme: "Regular hearing establishes bhakti", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v20", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.3.28", verseText: "All of the above-mentioned incarnations are either plenary portions or portions of the plenary portions of the Lord, but Lord Śrī Kṛṣṇa is the original Personality of Godhead.", theme: "Kṛṣṇa is Bhagavān Himself", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v21", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.1.1", verseText: "O my Lord, Śrī Kṛṣṇa, son of Vasudeva, O all-pervading Personality of Godhead, I offer my respectful obeisances unto You. I meditate upon Lord Śrī Kṛṣṇa because He is the Absolute Truth and the primeval cause of all causes of the creation, sustenance and destruction of the manifested universes.", theme: "Maṅgalācaraṇa — invocation to Kṛṣṇa", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v22", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.1.2", verseText: "Completely rejecting all religious activities which are materially motivated, this Bhāgavata Purāṇa propounds the highest truth, which is understandable by those devotees who are fully pure in heart.", theme: "Bhāgavatam rejects cheating religion", priority: "Support", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v23", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.2.7", verseText: "By rendering devotional service unto the Personality of Godhead, Śrī Kṛṣṇa, one immediately acquires causeless knowledge and detachment from the world.", theme: "Bhakti gives knowledge and detachment", priority: "Support", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v24", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.2.19", verseText: "As soon as irrevocable loving service is established in the heart, the effects of nature's modes of passion and ignorance, such as lust, desire and hankering, disappear from the heart. Then the devotee is established in goodness, and he becomes completely happy.", theme: "Bhakti removes passion and ignorance", priority: "Support", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v25", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.2.20", verseText: "Thus established in the mode of unalloyed goodness, the man whose mind has been enlivened by contact with devotional service to the Lord gains positive scientific knowledge of the Personality of Godhead in the stage of liberation from all material association.", theme: "Liberation through pure goodness", priority: "Support", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v26", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.2.28", verseText: "Vāsudeva, or the Personality of Godhead, Śrī Kṛṣṇa, is the cause of all causes. Everything that exists is an emanation from Him, and He is the only enjoyer.", theme: "Vāsudeva is cause of all causes", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v27", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.3.38", verseText: "Just as the sun alone illuminates all this universe, so does the living entity, one within the body, illuminate the entire body by consciousness.", theme: "Consciousness illuminates the body", priority: "Advanced", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v28", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.5.11", verseText: "That literature which is full of descriptions of the transcendental glories of the name, fame, forms, pastimes, etc., of the unlimited Supreme Lord is a different creation, full of transcendental words directed toward bringing about a revolution in the impious lives of this world's misdirected civilization.", theme: "Transcendental literature transforms", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v29", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.5.17", verseText: "One who has not listened to the messages about the prowess and marvelous acts of the Personality of Godhead and has not sung or chanted loudly the worthy songs about the Lord should be considered to possess earholes like the holes of snakes and a tongue like the tongue of a frog.", theme: "Useless senses without Kṛṣṇa", priority: "Advanced", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v30", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.7.5", verseText: "Śrī Vyāsadeva saw the Absolute Truth, the Personality of Godhead, along with His external energy, which was under full control. By knowing the Absolute Truth, one also knows māyā, which acts upon the conditioned souls.", theme: "Vyāsadeva's vision of the Absolute", priority: "Advanced", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v31", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.7.6", verseText: "The material miseries of the living entity, which are superfluous to him, can be directly mitigated by the linking process of devotional service. But the mass of people do not know this, and therefore the learned Vyāsadeva compiled this Vedic literature, Śrīmad-Bhāgavatam, which is in relation to the Supreme Truth.", theme: "Bhāgavatam mitigates miseries", priority: "Support", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v32", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.8.25", verseText: "My Lord, Your Lordship can easily be approached, but only by those who are materially exhausted. One who is on the path of material progress, trying to improve himself with respectable parentage, great opulence, high education and bodily beauty, cannot approach You with sincere feeling.", theme: "Kṛṣṇa approached by the humble", priority: "Advanced", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v33", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.8.26", verseText: "My obeisances are unto You, who are the property of the materially impoverished. You have nothing to do with the actions and reactions of the material modes of nature. You are self-satisfied, and therefore You are the most gentle and are master of the monists.", theme: "Kṛṣṇa — property of the poor in spirit", priority: "Advanced", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v34", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.9.39", verseText: "At the moment of death, let my ultimate attraction be to Śrī Kṛṣṇa, the Personality of Godhead. With eyes fixed on Him, I surrendered my arrows upon the battlefield of Kurukṣetra. He is the object of my meditation at the time of death.", theme: "Bhīṣma's meditation at death", priority: "Advanced", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v35", monthPhase: "Month 3", source: "Śrī Brahma-saṁhitā (with Bhaktisiddhānta commentary)", versePassage: "BS 5.33", verseText: "I worship Govinda, the primeval Lord, who by the agency of His own spiritual potency is the primeval Lord, with an abundance of diverse energies. He is the origin of all, the enjoyer of all, and the friend of all. He is the source of all incarnations, and the cause of all causes. He is the Supreme Personality of Godhead, full in six opulences, and His transcendental form is eternal, blissful and full of knowledge.", theme: "Govinda — the primeval Lord and source of all", priority: "Support", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v36", monthPhase: "Month 4", source: "Śrī Caitanya-caritāmṛta: Madhya-līlā", versePassage: "CC Madhya 7.128", verseText: "Instruct everyone to follow the orders of Lord Śrī Kṛṣṇa as they are given in the Bhagavad-gītā and Śrīmad-Bhāgavatam. In this way become a spiritual master and try to liberate everyone in this land.", theme: "Preaching Kṛṣṇa consciousness", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v37", monthPhase: "Month 4", source: "Śvetāśvatara Upaniṣad", versePassage: "SU 3.8", verseText: "vedāham etaṁ puruṣaṁ mahāntam āditya-varṇaṁ tamasaḥ parastāt / tam eva viditvāti mṛtyum eti nānyaḥ panthā vidyate 'yanāya", theme: "Knowing the Supreme Person to transcend death", priority: "Support", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "Cited by Śrīla Prabhupāda in BG 4.9 purport: one who understands the transcendental nature of the Lord's appearance and activities does not take birth again but attains Him.", reflection: "" },
];

export const seedWeeklyReflections: WeeklyReflection[] = Array.from({ length: 32 }, (_, i) => ({
  week: i + 1,
  biggestRealization: "",
  practicalApplication: "",
  questionForSenior: "",
  completed: false,
}));

// === JAPA TRACKER ===

export interface JapaEntry {
  date: string;
  rounds: number | null;
  mangalaArati: boolean;
  bhogaArati: boolean;
  gauraArati: boolean;
  prasadam: number | null;
  focusLevel?: number | null; // 1-5: 1=distracted, 3=moderate, 5=fully absorbed
}

export const seedJapaLog: JapaEntry[] = [
  { date: "2026-06-19", rounds: 16, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-06-20", rounds: 16, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-06-21", rounds: 16, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-06-22", rounds: 16, mangalaArati: true, bhogaArati: true, gauraArati: false, prasadam: 2 },
  { date: "2026-06-23", rounds: 16, mangalaArati: true, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-06-24", rounds: 16, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-06-25", rounds: 16, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-06-26", rounds: 16, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-06-27", rounds: 11, mangalaArati: false, bhogaArati: true, gauraArati: false, prasadam: 1 },
  { date: "2026-06-28", rounds: 16, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-06-29", rounds: 16, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-06-30", rounds: 16, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-07-01", rounds: 16, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-07-02", rounds: 16, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-07-03", rounds: 16, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-07-04", rounds: 16, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-07-05", rounds: 16, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-07-06", rounds: 16, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-07-07", rounds: 16, mangalaArati: false, bhogaArati: false, gauraArati: true, prasadam: null },
  { date: "2026-07-08", rounds: 16, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-07-09", rounds: null, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-07-10", rounds: null, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-07-11", rounds: null, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-07-12", rounds: null, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-07-13", rounds: null, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-07-14", rounds: null, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-07-15", rounds: null, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-07-16", rounds: null, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-07-17", rounds: null, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-07-18", rounds: null, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
  { date: "2026-07-19", rounds: null, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
];

// === TUTOR & FLASHCARDS ===

export type TutorSessionType = "tutor" | "flashcards";

export interface TutorSession {
  id: string;
  date: string;
  topic: string;
  duration: number; // minutes
  notes: string;
  flashcardsReviewed: number;
  flashcardsNew: number;
  sessionType?: TutorSessionType; // defaults to "tutor"; use "flashcards" for flashcard-only creation/review sessions
}

export function isTutorSession(session: TutorSession): boolean {
  if (session.sessionType === "flashcards") return false;
  if (session.sessionType === "tutor") return true;
  // Fallback for older sessions without sessionType: infer from topic
  return !session.topic.toLowerCase().includes("flashcard");
}

export const seedTutorSessions: TutorSession[] = [
  { id: "tutor-1", date: "2026-07-07", topic: "Sanskrit pronunciation", duration: 60, notes: "First session with tutor", flashcardsReviewed: 0, flashcardsNew: 0, sessionType: "tutor" },
  { id: "tutor-2", date: "2026-07-08", topic: "Flashcard creation — BG Ch.3 vocab", duration: 45, notes: "Made flashcards from today's reading", flashcardsReviewed: 0, flashcardsNew: 20, sessionType: "flashcards" },
];

// === DAILY SCHEDULE ADHERENCE ===

export interface ScheduleDay {
  date: string;
  wakeUp330: boolean;
  showerTilak?: boolean;
  mangalaArati: boolean;
  bhogaArati: boolean;
  gauraArati: boolean;
  morningStudy: boolean;
  work: boolean;
  personalStudy: boolean;
  sanskritClass: boolean;
  sleep9pm: boolean;
  homePooja?: boolean; // at-home deity worship / pūjā
  score: number; // 0-100 calculated
  notes: string;
  // Regulative principles (tracked per day, only used when course mode is "tracking")
  noMeatEating: boolean;
  noIntoxication: boolean;
  noGambling: boolean;
  noIllicitSex: boolean;
  sixteenRounds: boolean;
  obeisances: number; // count of obeisances done (0-3)
  customItems: Record<string, boolean>; // for dynamic schedule items added by the user
  scheduleItemsSnapshot: CustomScheduleItem[]; // snapshot of schedule items used when this day was logged
  habitTracking: Record<string, "positive" | "negative" | null>; // guna-based habit tracker results per day
}

export function calcScore(entry: ScheduleDay, items: readonly { key: string }[], obeisancesTarget?: number): number {
  if (items.length === 0) return 0;
  const completed = items.filter((item) => {
    if (item.key in entry) {
      return entry[item.key as keyof ScheduleDay] as boolean;
    }
    return entry.customItems?.[item.key] ?? false;
  }).length;
  const scoreItems = Math.max(1, items.length);
  let numerator = completed;
  let denominator = scoreItems;
  if (obeisancesTarget && obeisancesTarget > 0) {
    const obeisancesDone = Math.min(3, Math.max(0, entry.obeisances || 0));
    if (obeisancesDone >= obeisancesTarget) numerator += 1;
    denominator += 1;
  }
  return Math.round((numerator / denominator) * 100);
}

export const scheduleItems: CustomScheduleItem[] = [
  { key: "wakeUp330", label: "Wake up 3:30 AM", icon: "🌅" },
  { key: "showerTilak", label: "Shower, Tilak", icon: "🚿" },
  { key: "mangalaArati", label: "Maṅgala Āratī (4:30 AM)", icon: "🙏", linkedToJapa: true },
  { key: "bhogaArati", label: "Bhoga Āratī (noon)", icon: "🍽️", linkedToJapa: true },
  { key: "morningStudy", label: "Morning Study (8:30–9:00)", icon: "📖" },
  { key: "work", label: "Work (9:00–4:30)", icon: "💼", weekdayOnly: true },
  { key: "personalStudy", label: "Personal Study 2+ hrs (4:45–6:45)", icon: "📚" },
  { key: "gauraArati", label: "Gaura Āratī (evening)", icon: "🕯️", linkedToJapa: true },
  { key: "sanskritClass", label: "Sanskrit Class (Tue/Fri 7:30, Sat 7:30, Sun 8:00)", icon: "🗣️" },
  { key: "sundayFeast", label: "Sunday Feast (temple program)", icon: "🎉", sundayOnly: true },
  { key: "sleep9pm", label: "Sleep by 9:00 PM", icon: "😴" },
];

export const seedScheduleLog: ScheduleDay[] = [
  { date: "2026-07-07", wakeUp330: false, showerTilak: false, mangalaArati: false, bhogaArati: false, gauraArati: true, morningStudy: false, work: true, personalStudy: true, sanskritClass: false, sleep9pm: false, score: 30, notes: "", noMeatEating: true, noIntoxication: true, noGambling: true, noIllicitSex: true, sixteenRounds: false, obeisances: 0, customItems: {}, scheduleItemsSnapshot: scheduleItems, habitTracking: {} },
  { date: "2026-07-08", wakeUp330: true, showerTilak: false, mangalaArati: false, bhogaArati: false, gauraArati: false, morningStudy: false, work: true, personalStudy: false, sanskritClass: false, sleep9pm: false, score: 20, notes: "", noMeatEating: true, noIntoxication: true, noGambling: true, noIllicitSex: true, sixteenRounds: false, obeisances: 0, customItems: {}, scheduleItemsSnapshot: scheduleItems, habitTracking: {} },
];

// === DEVOTEE DIRECTORY ===

export interface DevoteeContact {
  id: string;
  name: string;
  role: string; // e.g. "Temple President", "Śikṣā Guru", "Brahmacārī"
  phone: string;
  email: string;
  expertise: string[]; // e.g. ["Sanskrit", "Deity Worship", "SB Canto 1"]
  instructions: string; // guidance received from them
  notes: string;
}

// === SANSKRIT VOCABULARY ===

export interface SanskritTerm {
  id: string;
  term: string; // devanāgarī or IAST
  transliteration: string;
  meaning: string;
  context: string; // where you encountered it, e.g. "BG 2.13 purport"
  dateAdded: string;
}

export const seedVocabulary: SanskritTerm[] = [
  {
    id: "term-seed-1",
    term: "सच्चिदानन्दविग्रह",
    transliteration: "sac-cid-ānanda-vigraha",
    meaning: "The divine form of Śrī Caitanyadeva and the spiritual form of Kṛṣṇa. It signifies the embodiment of existence (sat), consciousness (cit), and bliss (ānanda).",
    context: "BG 4.4 — Kṛṣṇa's transcendental form is sac-cid-ānanda-vigraha, not a material body.",
    dateAdded: "2026-07-09",
  },
  {
    id: "term-seed-2",
    term: "अच्युत",
    transliteration: "acyuta",
    meaning: "Infallible. A name of Kṛṣṇa indicating He never falls down or forgets, unlike the conditioned living entities who fall from their position.",
    context: "BG 4.5 — Kṛṣṇa is acyuta (infallible) whereas living entities forget their past lives.",
    dateAdded: "2026-07-09",
  },
  {
    id: "term-seed-3",
    term: "अद्वैत",
    transliteration: "advaita",
    meaning: "No distinction; non-dual. In the context of Kṛṣṇa, there is no distinction between His body and Himself.",
    context: "BG 4.5 — Kṛṣṇa is advaita: no distinction between His body and Himself, unlike ordinary beings.",
    dateAdded: "2026-07-09",
  },
  {
    id: "term-seed-4",
    term: "आत्मा",
    transliteration: "ātmā",
    meaning: "The self; can also refer to the body in certain contexts. In BG 4.5, it refers to Kṛṣṇa's body being non-different from His Self.",
    context: "BG 4.5 — ātma-māyayā: by His own internal potency He appears in His original body.",
    dateAdded: "2026-07-09",
  },
];

// === QUESTIONS LOG ===

export interface QuestionEntry {
  id: string;
  question: string;
  context: string; // what prompted it, e.g. "BG 3.37 purport"
  dateAsked: string;
  status: "open" | "resolved";
  // Your own provisional working hypothesis / scriptural reflection.
  // Keep this separate from the authoritative answer you receive from guru
  // or a senior devotee.
  potentialResponses: string;
  answer: string; // instruction / response received from guru / senior devotee / śāstra
  source: string; // who answered / where you found it
  // Concrete practices, vows, behavioral changes, or seva/service actions the
  // disciple commits to after receiving instruction.
  actionsToTake: string;
}

// === QUIZ RESULTS ===

export interface QuizResult {
  id: string;
  date: string; // ISO timestamp
  quizDate: string; // yyyy-MM-dd
  score: number;
  total: number;
  percentage: number;
  mode: "recent" | "custom";
  lookbackDays?: number;
  customBook?: string;
  customChapters?: string;
  questionBreakdown: { type: string; category?: string; correct: boolean }[];
}

// === LECTURE & CLASS NOTES ===

export type LectureSpeakerRole = "devotee" | "spiritual-master" | "other";

export interface LectureNote {
  id: string;
  title: string;
  date: string;
  source: string; // e.g. venue, program, or teacher (legacy free-form)
  tags: string[];
  content: string; // legacy free-form notes (still shown as "Personal Notes")
  // Speaker linkage — either to a devotee contact by id, or the spiritual master
  speakerName?: string;
  speakerContactId?: string; // matches DevoteeContact.id when speakerRole === "devotee"
  speakerRole?: LectureSpeakerRole;
  // Rich lecture archive
  summary?: string; // human-written / AI-generated summary in markdown
  transcript?: string; // full transcript in markdown
  keyPoints?: string[]; // short bullets — surfaced as pills for retention
  verseReference?: string; // e.g. "SB 3.26.40" or "BG 7.8"
  book?: string; // e.g. "Bhagavad-gītā", "Śrīmad-Bhāgavatam"
  posterImage?: string; // /images/lecture-posters/*.png
  mediaUrl?: string; // optional link to audio / YouTube
  // Seed hydration hints — used once on first load to fetch the MD files
  summaryUrl?: string;
  transcriptUrl?: string;
}

export interface Poster {
  id: string;
  src: string;
  title: string;
  addedAt: string;
  category?: "general" | "lecture" | "seva";
  lectureId?: string;
  speaker?: string;
  // For seva posters: the service category it belongs to (e.g. "Tulasi").
  service?: string;
  notes?: string;
}

export interface SevaNote {
  id: string;
  service: string; // one of sevaCategories
  title: string;
  content: string;
  date: string; // yyyy-MM-dd — when it was recorded / instruction received
  source?: string; // devotee / speaker who gave the instruction
}

export function emptySevaNote(service: string, date: string): SevaNote {
  return {
    id: `seva-note-${date}-${Math.random().toString(36).slice(2, 9)}`,
    service,
    title: "",
    content: "",
    date,
    source: "",
  };
}

// -------------------------- Disciple Course --------------------------
// ISKCON Disciple Course — a lifelong-reference module living above the
// per-course prefix so its content persists no matter which Śāstra course
// is active.

export interface DiscipleHomework {
  id: string;
  text: string;
  done: boolean;
  dueDate?: string; // yyyy-MM-dd
}

export interface DiscipleExercise {
  id: string;
  prompt: string;
  response: string; // free-form reflection
}

export interface DiscipleAttachment {
  id: string;
  name: string;
  dataUrl: string; // base64 image or file (kept small — teacher handouts)
  addedAt: string;
}

export interface DiscipleLesson {
  id: string;
  lessonNumber: number; // 1–14
  unit: number; // 1–4
  unitTitle: string;
  title: string;
  scheduledDate?: string; // yyyy-MM-dd, when the class is scheduled
  attendedDate?: string; // yyyy-MM-dd, when actually attended
  attended: boolean;
  notes: string; // free-form class notes (Markdown ok)
  homework: DiscipleHomework[];
  exercises: DiscipleExercise[];
  attachments: DiscipleAttachment[];
  teacherQuotes: string;
  updatedAt: string;
}

export interface DiscipleCourseMeta {
  title: string;
  teacher: string;
  cohort: string;
  startDate: string; // yyyy-MM-dd of first class
  classesPerWeek: number;
  hoursPerClass: number;
  totalWeeks: number;
  notes: string;
}

const discipleUnits: { unit: number; unitTitle: string; lessons: string[] }[] = [
  {
    unit: 1,
    unitTitle: "Unit One: Introduction, Theory and Context",
    lessons: [
      "Welcome and Introduction",
      "Guru-tattva and Paramparā",
      "Śrīla Prabhupāda — ISKCON Founder Ācārya",
      "ISKCON Gurus",
    ],
  },
  {
    unit: 2,
    unitTitle: "Unit Two: Establishing the Relationship with Guru",
    lessons: ["Guru-padāśraya", "Selection of Guru", "Initiation Vows"],
  },
  {
    unit: 3,
    unitTitle: "Unit Three: Acting in Relationship with the Guru",
    lessons: ["Guru-pūjā", "Guru-sevā", "Guru Vapu and Vāṇī-sevā", "Guru Tyāga"],
  },
  {
    unit: 4,
    unitTitle: "Unit Four: Co-operatively Fulfilling the Relationship & Consolidation",
    lessons: ["Presenting One's Guru", "Relationship with ISKCON", "Course Round Up"],
  },
];

export const seedDiscipleLessons: DiscipleLesson[] = discipleUnits.flatMap((u, uIdx) => {
  const lessonsBefore = discipleUnits.slice(0, uIdx).reduce((sum, x) => sum + x.lessons.length, 0);
  return u.lessons.map((title, i) => {
    const lessonNumber = lessonsBefore + i + 1;
    return {
      id: `disciple-lesson-${lessonNumber}`,
      lessonNumber,
      unit: u.unit,
      unitTitle: u.unitTitle,
      title,
      attended: false,
      notes: "",
      homework: [],
      exercises: [],
      attachments: [],
      teacherQuotes: "",
      updatedAt: new Date().toISOString(),
    };
  });
});

export const seedDiscipleCourseMeta: DiscipleCourseMeta = {
  title: "ISKCON Disciple Course",
  teacher: "",
  cohort: "",
  startDate: "",
  classesPerWeek: 2,
  hoursPerClass: 1.5,
  totalWeeks: 7,
  notes: "",
};

export function newHomework(text = ""): DiscipleHomework {
  return { id: `hw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text, done: false };
}

export function newExercise(prompt = ""): DiscipleExercise {
  return { id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, prompt, response: "" };
}

// Seed lectures — preloaded on first launch (via migration) so the archive is
// populated with the user's real lectures. Content is loaded lazily from
// /public/lectures/*.md the first time the app boots.
export const seedLectureNotes: LectureNote[] = [
  {
    id: "lecture-water-and-krishna",
    title: "Water & Krishna — Connecting Everything to the Supreme",
    date: "2026-07-11",
    source: "Bhāgavatam class — Magadahri Dāsa",
    tags: ["SB 3.26", "elements", "water", "sankirtan", "psychology"],
    content: "",
    speakerName: "Magadahri Dāsa",
    speakerRole: "devotee",
    book: "Śrīmad-Bhāgavatam",
    verseReference: "SB 3.26 · BG 7.8",
    posterImage: "/images/lecture-posters/water-and-krishna.png",
    keyPoints: [
      "Taste (rasa) is originally one — manifests in six varieties through contact.",
      "Water is the cementing element: moistens, cools, coagulates, sustains life (āpo maya prāṇa).",
      "See Krishna's design in every material building block — connect, don't compartmentalize.",
      "Root of material suffering is envy of Krishna's supreme position.",
      "The mind (mano-ratha) is an unreliable hurricane — needs association to settle.",
      "Saṅkīrtana yajña is spiritual sustenance — the team effort develops sweetness.",
      "Make plans to preach; leave the results to Krishna.",
    ],
    summaryUrl: "/lectures/water-and-krishna_summary.md",
    transcriptUrl: "/lectures/water-and-krishna_transcript.md",
  },
  {
    id: "lecture-fire-and-digestion",
    title: "Fire & Digestion — Connecting the Fire Element to Kṛṣṇa",
    date: "2026-07-11",
    source: "Bhāgavatam class — Magadahri Dāsa",
    tags: ["SB 3.26.40", "elements", "fire", "prasādam", "vibhūti-yoga"],
    content: "",
    speakerName: "Magadahri Dāsa",
    speakerRole: "devotee",
    book: "Śrīmad-Bhāgavatam",
    verseReference: "SB 3.26.40 · BG 15.14",
    posterImage: "/images/lecture-posters/fire-and-digestion.png",
    keyPoints: [
      "Fire (tejas) is Kṛṣṇa's energy — light, heat, cooking, digestion, destruction.",
      "Kṛṣṇa is the digestive fire (jāṭharāgni) — 'ahaṁ vaiśvānaro bhūtvā' (BG 15.14).",
      "Weak fire → undigested food → āma (toxins) → illness.",
      "Consciousness of the cook enters the food — only prasādam nourishes the soul.",
      "Five-step offering: prepare · cook fresh · present · meditate · honor with gratitude.",
      "Real disciple = the mood of following instructions, not just physical proximity.",
      "Body is Kṛṣṇa's property — neither neglect it nor worship it.",
    ],
    summaryUrl: "/lectures/fire-and-digestion_summary.md",
    transcriptUrl: "/lectures/fire-and-digestion_transcript.md",
  },
  {
    id: "lecture-krishna-and-humility",
    title: "Krishna & Humility — The Highest Is the Most Humble",
    date: "2026-07-10",
    source: "Talk by HH Danavir Goswami",
    tags: ["humility", "bhakti", "acintya-bhedābheda", "karma", "surrender"],
    content: "",
    speakerName: "HH Danavir Goswami",
    speakerRole: "spiritual-master",
    book: "Bhagavad Gita",
    verseReference: "Bhagavad-gītā · Kṛṣṇa-līlā",
    posterImage: "/images/lecture-posters/krishna-and-humility.png",
    keyPoints: [
      "Kṛṣṇa Himself is the perfect example of humility — becomes controlled by His devotees.",
      "Acintya-bhedābheda-tattva: God is simultaneously one with and different from His creation.",
      "Yaśodā saw the universe in child Kṛṣṇa's mouth; the binding rope was always two inches too short.",
      "Three requirements: surrender, paripraśna (submissive inquiry), sevā (service).",
      "Karma & reincarnation explain apparent injustices — the soul reaps across lifetimes.",
      "Everyone is already serving someone — redirect that service to the Supreme Master.",
      "Humility attracts Kṛṣṇa's grace; pride is the biggest obstacle.",
    ],
    summaryUrl: "/lectures/krishna-and-humility_summary.md",
    transcriptUrl: "/lectures/krishna-and-humility_transcript.md",
  },
  {
    id: "lecture-srimad-bhagavatam-session-on-creation",
    title: "Srimad Bhagavatam Study Discussion",
    date: "2026-07-20",
    source: "Bhāgavatam class",
    tags: [
      "Śrīmad-Bhāgavatam",
      "Canto 3",
      "Virāṭ-puruṣa",
      "Supersoul",
      "Paramātmā",
      "Bhakti",
      "Seva-bhāva",
      "Spiritual Awakening",
      "Material Nature",
      "Universal Form",
      "Achintya-bhedābheda",
      "Bhagavad-gītā 7.19",
      "Vāsudevaḥ Sarvam Iti",
      "Devotional Service",
      "Detachment",
      "Chanting Hare Kṛṣṇa",
      "Kīrtana",
      "Compassion",
      "Humility",
      "Outreach",
      "Preaching",
      "Kindness",
      "Association of Devotees",
      "Beginner Devotees",
      "Patience",
      "Tolerance",
      "Jīva",
      "Sense Control",
      "Śrīla Prabhupāda",
      "Kṛṣṇa Consciousness",
    ],
    content: "",
    book: "Śrīmad-Bhāgavatam",
    verseReference: "SB 3.26.62-71",
    keyPoints: [
      "Material activities alone cannot awaken our relationship with Kṛṣṇa; only bhakti and detachment can.",
      "The Supersoul within the heart is the one who awakens spiritual consciousness.",
      "The virāṭ-puruṣa is a temporary material manifestation distinct from the eternal Supreme Lord.",
      "The material senses cannot perceive the Absolute without devotional service.",
      "Spiritual awakening comes from seva-bhāva (the mood of service), not material circumstances.",
      "Apparent spiritual experiences are meaningful because of devotion, not because of external stimuli.",
      "After many births, genuine knowledge culminates in surrender to Kṛṣṇa.",
      "Everything rests upon Kṛṣṇa while the jīva remains eternally His part, not the whole.",
      "Devotional outreach should inspire rather than discourage others.",
      "Encourage even small acts of devotion instead of condemning material habits.",
      "Chanting Hare Kṛṣṇa immediately bestows immense spiritual benefit.",
      "Kindness and humility make preaching more effective than harsh correctness.",
      "Every sincere beginner in bhakti should be treated with patience and special care.",
      "Absorption in kīrtana and service relieves the suffering of material existence.",
      "The devotee's role is to help others reconnect with Kṛṣṇa through compassion.",
    ],
    summaryUrl: "/lectures/srimad-bhagavatam-session-on-creation_summary.md",
    transcriptUrl: "/lectures/srimad-bhagavatam-session-on-creation_transcript.md",
  },
  {
    id: "lecture-five-most-potent-forms-of-bhakti",
    title: "Five Most Potent Forms of Bhakti",
    date: "2026-07-20",
    source: "Bhagavad-gītā class",
    tags: [
      "Bhakti",
      "Kṛṣṇa-prema",
      "Caitanya-caritāmṛta",
      "Rūpa Gosvāmī",
      "Nectar of Devotion",
      "Bhagavad-gītā 9.34",
      "Pañca-aṅga Bhakti",
      "Sādhu-saṅga",
      "Nāma-kīrtana",
      "Bhāgavata-śravaṇa",
      "Mathurā-vāsa",
      "Deity Worship",
      "Śrī Mūrti-sevā",
      "Holy Name",
      "Śrīmad-Bhāgavatam",
      "Association of Devotees",
      "Śrī Caitanya Mahāprabhu",
      "Śrīla Prabhupāda",
      "Personalism",
      "Bona Fide Guru",
      "Devotional Service",
      "Kṛṣṇa Consciousness",
      "Vani",
      "Internal Consciousness",
      "Gratitude",
      "Temple Life",
      "Holy Dham",
      "Kṛṣṇa Loka",
      "Bhakti Practice",
      "Spiritual Advancement",
    ],
    content: "",
    book: "Bhagavad-gītā",
    verseReference: "BG 9.34",
    keyPoints: [
      "The ultimate goal of bhakti is awakening pure love for Kṛṣṇa (Kṛṣṇa-prema).",
      "Bhakti unites external devotional practices with an internally grateful heart.",
      "Kṛṣṇa is the original eternal Person, not an impersonal energy.",
      "Loving Kṛṣṇa requires accepting His personal form as described in scripture.",
      "Spiritual knowledge should be received through a bona fide teacher and disciplic succession.",
      "The five most potent limbs of bhakti can awaken love of God even when practiced slightly.",
      "Association with devotees nourishes faith, inspiration, and practical devotional life.",
      "Chanting the holy names is a direct means of remembering and serving Kṛṣṇa.",
      "Regular hearing of Śrīmad-Bhāgavatam deepens realization and proper understanding.",
      "Creating a devotional atmosphere at home is an extension of living in a holy place.",
      "Deity worship performed with faith strengthens one's personal relationship with Kṛṣṇa.",
      "Devotional practices engage the body, mind, and senses in Kṛṣṇa's service.",
      "Pure devotional service is superior to impersonalism, speculative knowledge, and mystic yoga.",
      "Kṛṣṇa personally protects those sincerely engaged in devotional service.",
      "Even a small amount of genuine bhakti has transformative spiritual power.",
    ],
    summaryUrl: "/lectures/five-most-potent-forms-of-bhakti_summary.md",
    transcriptUrl: "/lectures/five-most-potent-forms-of-bhakti_transcript.md",
  },
];

// === CHARACTER SELF-ASSESSMENT ===

export type GunaResponse = "sattva" | "rajas" | "tamas";

export interface AssessmentAnswer {
  scenarioId: string;
  choiceId: string;
  guna: GunaResponse;
  answeredAt: string; // ISO date
}

export interface CharacterAssessment {
  id: string;
  date: string; // ISO date the assessment was taken
  answers: AssessmentAnswer[];
  sattvaScore: number; // 0-100 derived from answers
  rajasScore: number;
  tamasScore: number;
}

export interface SpiritualMasterInstruction {
  id: string;
  date: string; // yyyy-MM-dd
  text: string;
  source?: string; // e.g. "In-person, ISKCON Detroit" or "Phone call"
}

export interface SpiritualMasterPhoto {
  id: string;
  dataUrl: string; // compressed data URL
  caption?: string;
  addedAt: string;
}

export interface SpiritualMasterRecommender {
  name: string;
  role?: string; // e.g. "Temple President, ISKCON St. Louis"
  date?: string; // yyyy-MM-dd
  contact?: string;
  notes?: string;
}

export interface SpiritualMaster {
  name: string;
  photo: string; // local path to primary photo
  initiated: boolean;
  initiationDate: string;
  initiationName: string;
  /**
   * Legacy free-form instructions block. Migrated on first read into
   * `instructionsTimeline[0]` when present. Kept for back-compat.
   */
  instructions: string;
  instructionsTimeline?: SpiritualMasterInstruction[];
  email: string;
  phone: string;
  temple: string;
  notes: string;
  // Sampradāya lineage
  initiatingGuru?: string;
  siksaGurus?: string[]; // list of instructing gurus
  sampradaya?: string; // e.g. "Brahma-Madhva-Gauḍīya"
  // Initiation Readiness support
  targetInitiationDate?: string; // yyyy-MM-dd — user-editable goal
  recommender?: SpiritualMasterRecommender;
  readinessNotes?: Record<string, string>; // criterionId → free-form notes
  // Photos strip
  photos?: SpiritualMasterPhoto[];
}

// === PRABHUPĀDA CORPUS (scraped from vedabase.cc) ===

export type PrabhupadaEntryType = "qa" | "lecture" | "morning-walk";

/**
 * A single Q&A, lecture, or morning-walk entry from Śrīla Prabhupāda,
 * scraped locally into public/prabhupada/**. Full text is loaded lazily
 * from per-entry JSON files; the manifest carries only lightweight fields.
 */
export interface PrabhupadaEntry {
  id: string;
  type: PrabhupadaEntryType;
  title: string;
  subtitle?: string;
  date: string; // yyyy-MM-dd (may be empty)
  location: string;
  speakers: string[];
  verseRef?: string;
  book?: string;
  series?: string;
  tags: string[];
  /**
   * Curated topic slugs (e.g. "chanting", "initiation", "diksa"). Present on
   * hand-picked seed entries; scraped entries may leave this undefined.
   */
  topics?: string[];
  text: string; // full transcript / answer text
  sourceUrl: string;
  scrapedAt?: string;
}

/**
 * Lightweight manifest row — everything except `text`. Used by the
 * corpus loader to render lists without downloading the full transcript.
 */
export interface PrabhupadaManifestEntry {
  id: string;
  type: PrabhupadaEntryType;
  title: string;
  date: string;
  location: string;
  tags: string[];
  file: string; // relative to /public
  sourceUrl: string;
}

export interface PrabhupadaCorpusManifest {
  generatedAt: string | null;
  sourceSite: string;
  sections: {
    qa: { count: number; file: string };
    "morning-walks": { count: number; file: string };
    lectures: { count: number; file: string };
  };
  note?: string;
}

/**
 * A saved answer received from a Prabhupāda quote in the local corpus.
 * Persisted alongside `QuestionEntry` for the Questions Log.
 */
export interface SavedAnswer {
  id: string;
  questionId?: string; // optional link back to QuestionEntry.id
  entryId: string; // PrabhupadaEntry.id
  entryType: PrabhupadaEntryType;
  quote: string;
  title: string;
  sourceUrl: string;
  savedAt: string;
  notes?: string;
}

// === INITIATION READINESS ===

export type InitiationCriterionId =
  | "sixteen-rounds"
  | "four-regs"
  | "daily-study"
  | "morning-program"
  | "seva"
  | "guru-tattva"
  | "diksa-vows"
  | "senior-recommendation"
  | "time-following-practice";

export interface InitiationCriterion {
  id: InitiationCriterionId;
  title: string;
  description: string;
  weight: number; // relative weight in the overall readiness score
}

export const initiationCriteria: InitiationCriterion[] = [
  { id: "sixteen-rounds", title: "16 rounds daily, sustained", description: "Rolling 90-day percentage of days completing at least 16 rounds of japa.", weight: 1.5 },
  { id: "four-regs", title: "Four regulative principles", description: "Rolling 90-day adherence to the four regulative principles (no meat, no intoxication, no gambling, no illicit sex).", weight: 1.5 },
  { id: "daily-study", title: "Daily book study", description: "Rolling 90-day percentage of days with ≥ 30 min personal study.", weight: 1.0 },
  { id: "morning-program", title: "Morning program attendance", description: "Rolling 90-day percentage of days with maṅgala-ārati / early rising / śower-tilak completed.", weight: 1.0 },
  { id: "seva", title: "Rendering sevā", description: "Rolling 90-day percentage of days with logged sevā (any kind).", weight: 1.0 },
  { id: "guru-tattva", title: "Guru-tattva understanding", description: "Completion percentage of Disciple Course lessons on guru-tattva.", weight: 0.8 },
  { id: "diksa-vows", title: "Dīkṣā meaning & vows", description: "Completion percentage of Disciple Course lessons on dīkṣā and initiation vows.", weight: 0.8 },
  { id: "senior-recommendation", title: "Senior recommendation", description: "Whether a senior devotee has agreed to recommend you for initiation.", weight: 1.0 },
  { id: "time-following-practice", title: "Time following practice", description: "Time since first schedule-log entry vs. Prabhupāda's guidance of at least 6 months of steady practice.", weight: 0.8 },
];

export interface InitiationCriterionScore {
  criterionId: InitiationCriterionId;
  score: number; // 0–100
  bucket: "red" | "amber" | "lime" | "green";
  evidence: string; // one-line "what the data shows"
  trend: number[]; // last N weeks (0–100), oldest → newest
}

export function bucketForScore(score: number): "red" | "amber" | "lime" | "green" {
  if (score < 40) return "red";
  if (score < 70) return "amber";
  if (score < 90) return "lime";
  return "green";
}
