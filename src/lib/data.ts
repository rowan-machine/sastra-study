// Types and seed data for the Sastra Study Curriculum app

// Verse counts per chapter for interpolating daily targets
export const bgChapterVerses: Record<number, number> = {
  1: 46, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47, 7: 30, 8: 28, 9: 34, 10: 42,
  11: 55, 12: 20, 13: 35, 14: 27, 15: 20, 16: 24, 17: 28, 18: 78,
};

// Helper: given a fractional position (0–1) through a chapter range, return "Ch.X verse Y"
// startRef: "3.19" means chapter 3 verse 19; endRef: "End Chapter 4" or "4.42"
export function interpolateVerseTarget(
  assignment: string,
  book: string,
  fractionOfWeek: number
): string {
  // Only BG has verse-level granularity for now
  if (!book.toLowerCase().includes("bhagavad") && !book.toLowerCase().includes("gītā") && !book.toLowerCase().includes("gita")) {
    // For other books, estimate by chapter fraction
    const chMatch = assignment.match(/chapters?\s*(\d+)\s*[–\-−to]+\s*(\d+)/i);
    if (chMatch) {
      const startCh = parseInt(chMatch[1]);
      const endCh = parseInt(chMatch[2]);
      const targetCh = startCh + Math.floor((endCh - startCh + 1) * fractionOfWeek);
      return `Ch. ${Math.min(targetCh, endCh)}`;
    }
    return "";
  }

  // Parse start reference
  const startMatch = assignment.match(/(\d+)\.(\d+)/);
  let startChapter = 1, startVerse = 1;
  if (startMatch) {
    startChapter = parseInt(startMatch[1]);
    startVerse = parseInt(startMatch[2]);
  }

  // Parse end reference
  let endChapter = startChapter, endVerse = bgChapterVerses[startChapter] || 43;
  const endChapterMatch = assignment.match(/end\s*(?:of\s*)?chapter\s*(\d+)/i)
    || assignment.match(/chapter\s*(\d+)\s*$/i);
  const endVerseMatch = assignment.match(/→\s*(\d+)\.(\d+)/);
  const chapterRangeMatch = assignment.match(/chapters?\s*(\d+)\s*[–\-−to]+\s*(\d+)/i);

  if (endVerseMatch) {
    endChapter = parseInt(endVerseMatch[1]);
    endVerse = parseInt(endVerseMatch[2]);
  } else if (endChapterMatch) {
    endChapter = parseInt(endChapterMatch[1]);
    endVerse = bgChapterVerses[endChapter] || 42;
  } else if (chapterRangeMatch) {
    startChapter = parseInt(chapterRangeMatch[1]);
    startVerse = 1;
    endChapter = parseInt(chapterRangeMatch[2]);
    endVerse = bgChapterVerses[endChapter] || 42;
  }

  // Count total verses in range
  let totalVerses = 0;
  for (let ch = startChapter; ch <= endChapter; ch++) {
    const chVerses = bgChapterVerses[ch] || 40;
    const from = ch === startChapter ? startVerse : 1;
    const to = ch === endChapter ? endVerse : chVerses;
    totalVerses += (to - from + 1);
  }

  // Find the target verse position
  const targetVerseOffset = Math.floor(totalVerses * fractionOfWeek);

  let accumulated = 0;
  for (let ch = startChapter; ch <= endChapter; ch++) {
    const chVerses = bgChapterVerses[ch] || 40;
    const from = ch === startChapter ? startVerse : 1;
    const to = ch === endChapter ? endVerse : chVerses;
    const versesInThisCh = to - from + 1;

    if (accumulated + versesInThisCh > targetVerseOffset) {
      const verseInCh = from + (targetVerseOffset - accumulated);
      return `BG ${ch}.${verseInCh}`;
    }
    accumulated += versesInThisCh;
  }

  return `BG ${endChapter}.${endVerse}`;
}

export interface SadhanaStandards {
  minScorePercent: number; // minimum daily score to count as "on standard" (e.g. 60)
  requiredItems: string[]; // keys from scheduleItems that are non-negotiable (e.g. ["personalStudy"])
  weeklyMinDays: number; // min days per week that must meet minScorePercent (e.g. 5)
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
  description: "16 rounds daily, 2+ hrs personal study at least 5 days/week, 55% daily score minimum",
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
    "Śrīmad-Bhāgavatam",
    "Kṛṣṇa Book (Kṛṣṇa, The Supreme Personality of Godhead)",
    "Nectar of Devotion (Bhakti-rasāmṛta-sindhu)",
    "Kṛṣṇa's Planet (Garga-saṁhitā Summary Study)",
  ],
  sadhanaStandards: {
    minScorePercent: 55,
    requiredItems: ["personalStudy"],
    weeklyMinDays: 5,
    description: "16 rounds daily, 2+ hrs personal study at least 5 days/week, 55% daily score minimum",
  },
  originalBaseline: {
    minScorePercent: 55,
    requiredItems: ["personalStudy"],
    weeklyMinDays: 5,
    description: "16 rounds daily, 2+ hrs personal study at least 5 days/week, 55% daily score minimum",
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

export interface CustomScheduleItem {
  key: string;
  label: string;
  icon: string;
  linkedToJapa?: boolean;
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
  targetFinishDate: string;
  scheduleItems: CustomScheduleItem[]; // editable daily checklist
  habits: GunaHabit[]; // guna-based habit tracker (anarthas / sādhana practices)
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

import { addWeeks, format } from "date-fns";

// Chapter breakdowns per book for curriculum generation.
// Keys are substrings matched case-insensitively against book names.
export const bookChapterBreakdown: Record<string, string[]> = {
  // --- Core study ---
  "bhagavad-gītā": [
    "3.19 → End Chapter 4", "Chapters 5–6", "Chapters 7–8", "Chapters 9–10",
    "Chapters 11–12", "Chapters 13–15", "Chapters 16–17", "Finish BG + Finish NOI",
  ],
  "śrīmad-bhāgavatam": [
    "Chapters 1–4", "Chapters 5–8", "Chapters 9–12", "Finish Part One",
  ],
  "caitanya-caritāmṛta": [
    "Ādi-līlā Ch 1–4", "Ādi-līlā Ch 5–8", "Ādi-līlā Ch 9–12", "Ādi-līlā Ch 13–17",
    "Madhya-līlā Ch 1–5", "Madhya-līlā Ch 6–10", "Madhya-līlā Ch 11–15",
    "Madhya-līlā Ch 16–20", "Madhya-līlā Ch 21–25",
    "Antya-līlā Ch 1–5", "Antya-līlā Ch 6–10", "Antya-līlā Ch 11–15",
    "Antya-līlā Ch 16–20", "Finish",
  ],
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
  // --- Prabhupāda's other writings ---
  "prabhupāda-līlāmṛta": [
    "Volume 1", "Volume 2", "Volume 3", "Volume 4", "Volume 5", "Volume 6 — Finish",
  ],
  "prabhupāda letters": ["Selected letters Part 1", "Part 2", "Finish"],
  "conversations with śrīla prabhupāda": ["Selected conversations Part 1", "Part 2", "Finish"],
  // --- Garga-saṁhitā individual cantos ---
  "garga-saṁhitā: canto 1": ["Chapters 1–5", "Chapters 6–10", "Finish canto"],
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
};

function findChapterBreakdown(bookName: string): string[] | null {
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
  weeklyTargetHours: number
): CurriculumWeek[] {
  const activeBooks = books.length > 0 ? [...books] : ["Study"];
  const lastBook = activeBooks[activeBooks.length - 1];
  if (!lastBook?.toLowerCase().includes("buffer") && !lastBook?.toLowerCase().includes("review")) {
    activeBooks.push("Buffer / Review");
  }

  // Determine how many weeks each book needs based on its chapter breakdown
  const bookWeekCounts: number[] = [];
  let assignedWeeks = 0;
  for (const book of activeBooks) {
    const isBuffer = book.toLowerCase().includes("buffer") || book.toLowerCase().includes("review");
    if (isBuffer) {
      // Buffer gets remaining weeks at the end
      bookWeekCounts.push(0); // placeholder
      continue;
    }
    const breakdown = findChapterBreakdown(book);
    if (breakdown) {
      bookWeekCounts.push(breakdown.length);
      assignedWeeks += breakdown.length;
    } else {
      // Unknown book: allocate proportionally (minimum 1 week)
      const proportional = Math.max(1, Math.floor((targetWeeks - 6) / activeBooks.length));
      bookWeekCounts.push(proportional);
      assignedWeeks += proportional;
    }
  }

  // Allocate remaining weeks to buffer
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
    const breakdown = isBuffer ? null : findChapterBreakdown(book);

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

      weeks.push({
        week: weekNum,
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
        book,
        assignment,
        targetHours: weeklyTargetHours,
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
}

export const curriculumBooks = [
  // Core study (Prabhupāda's primary books)
  "Bhagavad-gītā As It Is",
  "Śrīmad-Bhāgavatam",
  "Śrī Caitanya-caritāmṛta",
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
  // Prabhupāda's other writings
  "Prabhupāda-līlāmṛta",
  "Śrīla Prabhupāda Letters",
  "Conversations with Śrīla Prabhupāda",
  // Garga-saṁhitā series
  "Garga-saṁhitā: Canto 1 (Goloka-khaṇḍa)",
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
    books: ["Bhagavad-gītā As It Is", "Śrīmad-Bhāgavatam", "Śrī Caitanya-caritāmṛta"],
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
      "Garga-saṁhitā: Canto 1 (Goloka-khaṇḍa)", "Garga-saṁhitā: Canto 2 (Vrindāvana-khaṇḍa)",
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
      "Vidagdha-mādhava (Rūpa Gosvāmī)", "Lalita-mādhava (Rūpa Gosvāmī)",
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
  targetFinishDate: "2027-02-14",
  scheduleItems: [
    { key: "wakeUp330", label: "Wake up 3:30 AM", icon: "🌅" },
    { key: "mangalaArati", label: "Maṅgala Āratī (4:30 AM)", icon: "🙏", linkedToJapa: true },
    { key: "bhogaArati", label: "Bhoga Āratī (noon)", icon: "🍽️", linkedToJapa: true },
    { key: "morningStudy", label: "Morning Study (8:30–9:00)", icon: "📖" },
    { key: "work", label: "Work (9:00–4:30)", icon: "💼" },
    { key: "personalStudy", label: "Personal Study 2+ hrs (4:45–6:45)", icon: "📚" },
    { key: "gauraArati", label: "Gaura Āratī (evening)", icon: "🕯️", linkedToJapa: true },
    { key: "sanskritClass", label: "Sanskrit Class (Tue/Fri 7:30, Sat 7:30, Sun 8:00)", icon: "🗣️" },
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
  { week: 23, startDate: "2026-12-07", endDate: "2026-12-13", book: "Garga-saṁhitā — Kṛṣṇa's Planet", assignment: "Chapters 1–2", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 24, startDate: "2026-12-14", endDate: "2026-12-20", book: "Garga-saṁhitā — Kṛṣṇa's Planet", assignment: "Chapters 3–4", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 25, startDate: "2026-12-21", endDate: "2026-12-27", book: "Garga-saṁhitā — Kṛṣṇa's Planet", assignment: "Chapter 5", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 26, startDate: "2026-12-28", endDate: "2027-01-03", book: "Garga-saṁhitā — Kṛṣṇa's Planet", assignment: "Chapter 6 — Finish", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 27, startDate: "2027-01-04", endDate: "2027-01-10", book: "Buffer", assignment: "Catch-up", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 28, startDate: "2027-01-11", endDate: "2027-01-17", book: "Buffer", assignment: "Catch-up", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 29, startDate: "2027-01-18", endDate: "2027-01-24", book: "Buffer", assignment: "Review notes", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 30, startDate: "2027-01-25", endDate: "2027-01-31", book: "Buffer", assignment: "Verse memorization", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 31, startDate: "2027-02-01", endDate: "2027-02-07", book: "Buffer", assignment: "Reflection + unresolved questions", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
  { week: 32, startDate: "2027-02-08", endDate: "2027-02-14", book: "Complete", assignment: "Celebrate + plan next curriculum", targetHours: 16, actualHours: 0, complete: false, reflection: false, paceStatus: "Needs Time", notes: "" },
];

export const seedDailyLog: DailyLogEntry[] = [
  { date: "2026-07-06", book: "Bhagavad-gītā", startLocation: "3.2", endLocation: "3.35", minutes: 90, hours: 1.5, sixteenRounds: true, sanskrit: true, wordMeanings: true, translation: true, purport: true, marked: true, reflection: true, dailyStudyComplete: false, quote: "", realization: "", notes: "" },
  { date: "2026-07-07", book: "Bhagavad-gītā", startLocation: "3.35", endLocation: "3.38", minutes: 20, hours: 0.33, sixteenRounds: true, sanskrit: false, wordMeanings: false, translation: false, purport: false, marked: false, reflection: false, dailyStudyComplete: false, quote: "", realization: "", notes: "" },
  { date: "2026-07-08", book: "Bhagavad-gītā", startLocation: "3.38", endLocation: "", minutes: null, hours: null, sixteenRounds: false, sanskrit: false, wordMeanings: false, translation: false, purport: false, marked: false, reflection: false, dailyStudyComplete: false, quote: "", realization: "", notes: "" },
];

export const seedBookProgress: BookProgress[] = [
  { book: "Bhagavad-gītā", plannedWeeks: 8, startDate: "2026-07-06", finishDate: "", complete: false, hoursLogged: 1.83, percentComplete: 15, estimatedTotalHours: 60, progressNotes: "" },
  { book: "Nectar of Instruction", plannedWeeks: 1, startDate: "", finishDate: "", complete: false, hoursLogged: 0, percentComplete: 0, estimatedTotalHours: 8, progressNotes: "" },
  { book: "Science of Self-Realization", plannedWeeks: 2, startDate: "", finishDate: "", complete: false, hoursLogged: 0, percentComplete: 0, estimatedTotalHours: 16, progressNotes: "" },
  { book: "Śrīmad-Bhāgavatam C1 Pt1", plannedWeeks: 4, startDate: "", finishDate: "", complete: false, hoursLogged: 0, percentComplete: 0, estimatedTotalHours: 40, progressNotes: "" },
  { book: "Kṛṣṇa Book", plannedWeeks: 4, startDate: "", finishDate: "", complete: false, hoursLogged: 0, percentComplete: 0, estimatedTotalHours: 35, progressNotes: "" },
  { book: "Nectar of Devotion", plannedWeeks: 4, startDate: "", finishDate: "", complete: false, hoursLogged: 0, percentComplete: 0, estimatedTotalHours: 40, progressNotes: "" },
  { book: "Garga-saṁhitā C1 Pt1", plannedWeeks: 4, startDate: "", finishDate: "", complete: false, hoursLogged: 0, percentComplete: 0, estimatedTotalHours: 30, progressNotes: "" },
  { book: "Buffer / Review", plannedWeeks: 6, startDate: "", finishDate: "", complete: false, hoursLogged: 0, percentComplete: 0, estimatedTotalHours: 40, progressNotes: "" },
];

export const seedVerseMemory: VerseMemory[] = [
  { id: "v1", monthPhase: "Month 1", source: "Bhagavad-gītā", versePassage: "BG 2.13", verseText: "As the embodied soul continuously passes, in this body, from boyhood to youth to old age, the soul similarly passes into another body at death. A sober person is not bewildered by such a change.", theme: "Eternal soul / changing bodies", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v2", monthPhase: "Month 1", source: "Bhagavad-gītā", versePassage: "BG 2.20", verseText: "For the soul there is neither birth nor death at any time. He has not come into being, does not come into being, and will not come into being. He is unborn, eternal, ever-existing and primeval. He is not slain when the body is slain.", theme: "The soul is never born or slain", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v3", monthPhase: "Month 1", source: "Bhagavad-gītā", versePassage: "BG 2.47", verseText: "You have a right to perform your prescribed duty, but you are not entitled to the fruits of action. Never consider yourself the cause of the results of your activities, and never be attached to not doing your duty.", theme: "Duty without attachment to results", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v4", monthPhase: "Month 1", source: "Bhagavad-gītā", versePassage: "BG 2.70", verseText: "A person who is not disturbed by the incessant flow of desires — that enter like rivers into the ocean, which is ever being filled but is always still — can alone achieve peace, and not the man who strives to satisfy such desires.", theme: "Peace through detachment", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v5", monthPhase: "Month 1", source: "Bhagavad-gītā", versePassage: "BG 3.9", verseText: "Work done as a sacrifice for Viṣṇu has to be performed, otherwise work causes bondage in this material world. Therefore, O son of Kuntī, perform your prescribed duties for His satisfaction, and in that way you will always remain free from bondage.", theme: "Work as sacrifice for Viṣṇu", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v6", monthPhase: "Month 1", source: "Bhagavad-gītā", versePassage: "BG 3.21", verseText: "Whatever action a great man performs, common men follow. And whatever standards he sets by exemplary acts, all the world pursues.", theme: "Leading by example", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v7", monthPhase: "Month 1", source: "Bhagavad-gītā", versePassage: "BG 4.7", verseText: "Whenever and wherever there is a decline in religious practice, O descendant of Bharata, and a predominant rise of irreligion — at that time I descend Myself.", theme: "Kṛṣṇa appears to protect dharma", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v8", monthPhase: "Month 1", source: "Bhagavad-gītā", versePassage: "BG 4.8", verseText: "To deliver the pious and to annihilate the miscreants, as well as to reestablish the principles of religion, I Myself appear, millennium after millennium.", theme: "Kṛṣṇa's mission of descent", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v9", monthPhase: "Month 1", source: "Bhagavad-gītā", versePassage: "BG 4.9", verseText: "One who knows the transcendental nature of My appearance and activities does not, upon leaving the body, take his birth again in this material world, but attains My eternal abode, O Arjuna.", theme: "Knowing Kṛṣṇa's birth and activities", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v10", monthPhase: "Month 1", source: "Bhagavad-gītā", versePassage: "BG 4.34", verseText: "Just try to learn the truth by approaching a spiritual master. Inquire from him submissively and render service unto him. The self-realized souls can impart knowledge unto you because they have seen the truth.", theme: "Approaching guru", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v11", monthPhase: "Month 2", source: "Bhagavad-gītā", versePassage: "BG 7.14", verseText: "This divine energy of Mine, consisting of the three modes of material nature, is difficult to overcome. But those who have surrendered unto Me can easily cross beyond it.", theme: "Crossing māyā by surrender", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v12", monthPhase: "Month 2", source: "Bhagavad-gītā", versePassage: "BG 9.22", verseText: "But those who always worship Me with exclusive devotion, meditating on My transcendental form — to them I carry what they lack, and I preserve what they have.", theme: "Kṛṣṇa carries what devotees lack", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v13", monthPhase: "Month 2", source: "Bhagavad-gītā", versePassage: "BG 9.26", verseText: "If one offers Me with love and devotion a leaf, a flower, a fruit or water, I will accept it.", theme: "Offering leaf, flower, fruit, water", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v14", monthPhase: "Month 2", source: "Bhagavad-gītā", versePassage: "BG 10.8", verseText: "I am the source of all spiritual and material worlds. Everything emanates from Me. The wise who perfectly know this engage in My devotional service and worship Me with all their hearts.", theme: "Kṛṣṇa is source of everything", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v15", monthPhase: "Month 2", source: "Bhagavad-gītā", versePassage: "BG 18.65", verseText: "Always think of Me, become My devotee, worship Me and offer your homage unto Me. Thus you will come to Me without fail. I promise you this because you are My very dear friend.", theme: "Think of Me, become My devotee", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v16", monthPhase: "Month 2", source: "Bhagavad-gītā", versePassage: "BG 18.66", verseText: "Abandon all varieties of religion and just surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.", theme: "Surrender to Kṛṣṇa", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v17", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.2.6", verseText: "The supreme occupation for all humanity is that by which men can attain to loving devotional service unto the transcendent Lord. Such devotional service must be unmotivated and uninterrupted to completely satisfy the self.", theme: "Topmost dharma is pure devotion", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v18", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.2.17", verseText: "Śrī Kṛṣṇa, the Personality of Godhead, who is the Paramātmā in everyone's heart and the benefactor of the truthful devotee, cleanses desire for material enjoyment from the heart of the devotee who has developed the urge to hear His messages.", theme: "Hearing cleanses the heart", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v19", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.2.18", verseText: "By regular attendance in classes on the Bhāgavatam and by rendering of service to the pure devotee, all that is troublesome to the heart is almost completely destroyed, and loving service unto the Personality of Godhead is established as an irrevocable fact.", theme: "Regular hearing establishes bhakti", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v20", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.3.28", verseText: "All of the above-mentioned incarnations are either plenary portions or portions of the plenary portions of the Lord, but Lord Śrī Kṛṣṇa is the original Personality of Godhead.", theme: "Kṛṣṇa is Bhagavān Himself", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v21", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.1.1", verseText: "O my Lord, Śrī Kṛṣṇa, son of Vasudeva, O all-pervading Personality of Godhead, I offer my respectful obeisances unto You. I meditate upon Lord Śrī Kṛṣṇa because He is the Absolute Truth and the primeval cause of all causes of the creation, sustenance and destruction of the manifested universes.", theme: "Maṅgalācaraṇa — invocation to Kṛṣṇa", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v22", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.1.2", verseText: "Completely rejecting all religious activities which are materially motivated, this Bhāgavata Purāṇa propounds the highest truth, which is understandable by those devotees who are fully pure in heart.", theme: "Bhāgavatam rejects cheating religion", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v23", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.2.7", verseText: "By rendering devotional service unto the Personality of Godhead, Śrī Kṛṣṇa, one immediately acquires causeless knowledge and detachment from the world.", theme: "Bhakti gives knowledge and detachment", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v24", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.2.19", verseText: "As soon as irrevocable loving service is established in the heart, the effects of nature's modes of passion and ignorance, such as lust, desire and hankering, disappear from the heart. Then the devotee is established in goodness, and he becomes completely happy.", theme: "Bhakti removes passion and ignorance", priority: "Support", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v25", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.2.20", verseText: "Thus established in the mode of unalloyed goodness, the man whose mind has been enlivened by contact with devotional service to the Lord gains positive scientific knowledge of the Personality of Godhead in the stage of liberation from all material association.", theme: "Liberation through pure goodness", priority: "Support", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v26", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.2.28", verseText: "Vāsudeva, or the Personality of Godhead, Śrī Kṛṣṇa, is the cause of all causes. Everything that exists is an emanation from Him, and He is the only enjoyer.", theme: "Vāsudeva is cause of all causes", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v27", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.3.38", verseText: "Just as the sun alone illuminates all this universe, so does the living entity, one within the body, illuminate the entire body by consciousness.", theme: "Consciousness illuminates the body", priority: "Support", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v28", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.5.11", verseText: "That literature which is full of descriptions of the transcendental glories of the name, fame, forms, pastimes, etc., of the unlimited Supreme Lord is a different creation, full of transcendental words directed toward bringing about a revolution in the impious lives of this world's misdirected civilization.", theme: "Transcendental literature transforms", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v29", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.5.17", verseText: "One who has not listened to the messages about the prowess and marvelous acts of the Personality of Godhead and has not sung or chanted loudly the worthy songs about the Lord should be considered to possess earholes like the holes of snakes and a tongue like the tongue of a frog.", theme: "Useless senses without Kṛṣṇa", priority: "Support", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v30", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.7.5", verseText: "Śrī Vyāsadeva saw the Absolute Truth, the Personality of Godhead, along with His external energy, which was under full control. By knowing the Absolute Truth, one also knows māyā, which acts upon the conditioned souls.", theme: "Vyāsadeva's vision of the Absolute", priority: "Support", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v31", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.7.6", verseText: "The material miseries of the living entity, which are superfluous to him, can be directly mitigated by the linking process of devotional service. But the mass of people do not know this, and therefore the learned Vyāsadeva compiled this Vedic literature, Śrīmad-Bhāgavatam, which is in relation to the Supreme Truth.", theme: "Bhāgavatam mitigates miseries", priority: "Core", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v32", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.8.25", verseText: "My Lord, Your Lordship can easily be approached, but only by those who are materially exhausted. One who is on the path of material progress, trying to improve himself with respectable parentage, great opulence, high education and bodily beauty, cannot approach You with sincere feeling.", theme: "Kṛṣṇa approached by the humble", priority: "Support", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v33", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.8.26", verseText: "My obeisances are unto You, who are the property of the materially impoverished. You have nothing to do with the actions and reactions of the material modes of nature. You are self-satisfied, and therefore You are the most gentle and are master of the monists.", theme: "Kṛṣṇa — property of the poor in spirit", priority: "Support", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
  { id: "v34", monthPhase: "Month 3", source: "Śrīmad-Bhāgavatam", versePassage: "SB 1.9.39", verseText: "At the moment of death, let my ultimate attraction be to Śrī Kṛṣṇa, the Personality of Godhead. With eyes fixed on Him, I surrendered my arrows upon the battlefield of Kurukṣetra. He is the object of my meditation at the time of death.", theme: "Bhīṣma's meditation at death", priority: "Support", learned: false, meaningUnderstood: false, canRecite: false, review1: false, review1W: false, review1M: false, mastered: false, contextNotes: "", reflection: "" },
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
];

// === TUTOR & FLASHCARDS ===

export interface TutorSession {
  id: string;
  date: string;
  topic: string;
  duration: number; // minutes
  notes: string;
  flashcardsReviewed: number;
  flashcardsNew: number;
}

export const seedTutorSessions: TutorSession[] = [
  { id: "tutor-1", date: "2026-07-07", topic: "Sanskrit pronunciation", duration: 60, notes: "First session with tutor", flashcardsReviewed: 0, flashcardsNew: 0 },
  { id: "tutor-2", date: "2026-07-08", topic: "Flashcard creation — BG Ch.3 vocab", duration: 45, notes: "Made flashcards from today's reading", flashcardsReviewed: 0, flashcardsNew: 20 },
];

// === DAILY SCHEDULE ADHERENCE ===

export interface ScheduleDay {
  date: string;
  wakeUp330: boolean;
  mangalaArati: boolean;
  bhogaArati: boolean;
  gauraArati: boolean;
  morningStudy: boolean;
  work: boolean;
  personalStudy: boolean;
  sanskritClass: boolean;
  sleep9pm: boolean;
  score: number; // 0-100 calculated
  notes: string;
  // Regulative principles (tracked per day, only used when course mode is "tracking")
  noMeatEating: boolean;
  noIntoxication: boolean;
  noGambling: boolean;
  noIllicitSex: boolean;
  sixteenRounds: boolean;
  customItems: Record<string, boolean>; // for dynamic schedule items added by the user
  scheduleItemsSnapshot: CustomScheduleItem[]; // snapshot of schedule items used when this day was logged
  habitTracking: Record<string, "positive" | "negative" | null>; // guna-based habit tracker results per day
}

export const scheduleItems: CustomScheduleItem[] = [
  { key: "wakeUp330", label: "Wake up 3:30 AM", icon: "🌅" },
  { key: "mangalaArati", label: "Maṅgala Āratī (4:30 AM)", icon: "🙏", linkedToJapa: true },
  { key: "bhogaArati", label: "Bhoga Āratī (noon)", icon: "🍽️", linkedToJapa: true },
  { key: "morningStudy", label: "Morning Study (8:30–9:00)", icon: "📖" },
  { key: "work", label: "Work (9:00–4:30)", icon: "💼" },
  { key: "personalStudy", label: "Personal Study 2+ hrs (4:45–6:45)", icon: "📚" },
  { key: "gauraArati", label: "Gaura Āratī (evening)", icon: "🕯️", linkedToJapa: true },
  { key: "sanskritClass", label: "Sanskrit Class (Tue/Fri 7:30, Sat 7:30, Sun 8:00)", icon: "🗣️" },
  { key: "sleep9pm", label: "Sleep by 9:00 PM", icon: "😴" },
];

export const seedScheduleLog: ScheduleDay[] = [
  { date: "2026-07-07", wakeUp330: false, mangalaArati: false, bhogaArati: false, gauraArati: true, morningStudy: false, work: true, personalStudy: true, sanskritClass: false, sleep9pm: false, score: 30, notes: "", noMeatEating: true, noIntoxication: true, noGambling: true, noIllicitSex: true, sixteenRounds: false, customItems: {}, scheduleItemsSnapshot: scheduleItems, habitTracking: {} },
  { date: "2026-07-08", wakeUp330: true, mangalaArati: false, bhogaArati: false, gauraArati: false, morningStudy: false, work: true, personalStudy: false, sanskritClass: false, sleep9pm: false, score: 20, notes: "", noMeatEating: true, noIntoxication: true, noGambling: true, noIllicitSex: true, sixteenRounds: false, customItems: {}, scheduleItemsSnapshot: scheduleItems, habitTracking: {} },
];

// === DEVOTEE DIRECTORY ===

export interface DevoteeContact {
  id: string;
  name: string;
  role: string; // e.g. "Temple President", "Śikṣā Guru", "Brahmacārī"
  phone: string;
  email: string;
  expertise: string[]; // e.g. ["Sanskrit", "Deity Worship", "SB Canto 1"]
  instructions: string[]; // guidance received from them
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

// === QUESTIONS LOG ===

export interface QuestionEntry {
  id: string;
  question: string;
  context: string; // what prompted it, e.g. "BG 3.37 purport"
  dateAsked: string;
  status: "open" | "resolved";
  answer: string;
  source: string; // who answered / where you found it
}
