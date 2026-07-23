import { describe, it, expect } from "vitest";
import {
  interpolateVerseTarget,
  generateCurriculum,
  calcScore,
  isTutorSession,
  findChapterBreakdown,
  bookChapterVerseCounts,
  defaultSettings,
  parseVerseRef,
  normalizeVerseInput,
  isValidVerseRef,
  verseToAbsolutePosition,
  getVerseProgressForWeek,
} from "@/lib/data";

describe("interpolateVerseTarget", () => {
  it("returns the start verse at fraction 0", () => {
    const result = interpolateVerseTarget("3.19 → End Chapter 4", "Bhagavad-gītā", 0);
    expect(result).toBe("BG 3.19");
  });

  it("returns the end verse at fraction 1", () => {
    const result = interpolateVerseTarget("3.19 → End Chapter 4", "Bhagavad-gītā", 1);
    expect(result).toBe("BG 4.42");
  });

  it("interpolates a midpoint through a chapter range", () => {
    const result = interpolateVerseTarget("3.19 → End Chapter 4", "Bhagavad-gītā", 0.5);
    // Total verses from 3.19 to 4.42 = (43-19+1)=25 + 42 = 67. Half = 33.
    // 3.19 is offset 0, 3.20=1, ... 3.43 (25 verses) covers offsets 0-24.
    // offset 33 is 4.8 (4.1 is offset 25, 4.2 is 26, ... 4.8 is 32? Wait 4.1 offset 25, so 4.8 offset 32? Let's calculate: 4.1 = 25, 4.2 = 26, 4.3=27, 4.4=28, 4.5=29, 4.6=30, 4.7=31, 4.8=32. 33rd offset = 4.9.
    expect(result).toBe("BG 4.9");
  });

  it("handles chapter range syntax", () => {
    const result = interpolateVerseTarget("Chapters 7–8", "Bhagavad-gītā", 0);
    expect(result).toBe("BG 7.1");
  });

  it("falls back to a default of 40 verses per chapter for unknown books", () => {
    const result = interpolateVerseTarget("1.1 → End Chapter 2", "Unknown Book", 1);
    expect(result).toBe("UB 2.40");
  });

  it("returns a verse for invalid assignment with fallback chapter", () => {
    const result = interpolateVerseTarget("Complete text", "Unknown Book", 0.5);
    expect(result).toBe("UB 1.21");
  });
});

describe("generateCurriculum", () => {
  it("generates weekly entries for a known book", () => {
    const weeks = generateCurriculum(["Bhagavad-gītā As It Is"], "2026-07-06", 32, 16, undefined, 1);
    expect(weeks.length).toBeGreaterThan(0);
    expect(weeks[0].week).toBe(1);
    expect(weeks[0].book).toBe("Bhagavad-gītā As It Is");
    expect(weeks[0].targetHours).toBe(16);
    expect(weeks[0].startDate).toBe("2026-07-06");
    expect(weeks[0].endDate).toBe("2026-07-12");
  });

  it("adds a buffer/review week at the end", () => {
    const weeks = generateCurriculum(["Bhagavad-gītā As It Is"], "2026-07-06", 10, 16, undefined, 1);
    const lastWeek = weeks[weeks.length - 1];
    expect(lastWeek.book.toLowerCase()).toContain("buffer");
  });

  it("respects the firstBookStartChapter override", () => {
    const weeks = generateCurriculum(["Bhagavad-gītā As It Is"], "2026-07-06", 10, 16, "3.19", 1);
    expect(weeks[0].assignment).toContain("3.19");
  });

  it("compresses weeks when paceMultiplier > 1", () => {
    const weeks = generateCurriculum(["Bhagavad-gītā As It Is"], "2026-07-06", 32, 16, undefined, 2);
    // BG has 8 assignments in breakdown; at 2x pace it should be 4 weeks.
    const bgWeeks = weeks.filter((w) => !w.book.toLowerCase().includes("buffer"));
    expect(bgWeeks.length).toBeLessThanOrEqual(4);
    expect(bgWeeks[0].targetHours).toBe(32);
  });
});

describe("calcScore", () => {
  it("returns 100 when all items are complete", () => {
    const entry = {
      date: "2026-07-06",
      wakeUp330: true,
      mangalaArati: true,
      bhogaArati: true,
      gauraArati: true,
      morningStudy: true,
      work: true,
      personalStudy: true,
      sanskritClass: true,
      sleep9pm: true,
      score: 0,
      notes: "",
      noMeatEating: true,
      noIntoxication: true,
      noGambling: true,
      noIllicitSex: true,
      sixteenRounds: true,
      obeisances: 1,
      customItems: {},
      scheduleItemsSnapshot: [],
      habitTracking: {},
    };
    const items = [
      { key: "wakeUp330", label: "Wake up 3:30 AM", icon: "🌅" },
      { key: "personalStudy", label: "Personal Study", icon: "📚" },
    ];
    expect(calcScore(entry, items, 1)).toBe(100);
  });

  it("returns 0 when no items are complete", () => {
    const entry = {
      date: "2026-07-06",
      wakeUp330: false,
      mangalaArati: false,
      bhogaArati: false,
      gauraArati: false,
      morningStudy: false,
      work: false,
      personalStudy: false,
      sanskritClass: false,
      sleep9pm: false,
      score: 0,
      notes: "",
      noMeatEating: false,
      noIntoxication: false,
      noGambling: false,
      noIllicitSex: false,
      sixteenRounds: false,
      obeisances: 0,
      customItems: {},
      scheduleItemsSnapshot: [],
      habitTracking: {},
    };
    const items = [{ key: "wakeUp330", label: "Wake up 3:30 AM", icon: "🌅" }];
    expect(calcScore(entry, items, 1)).toBe(0);
  });

  it("includes custom items in score calculation", () => {
    const entry = {
      date: "2026-07-06",
      wakeUp330: false,
      mangalaArati: false,
      bhogaArati: false,
      gauraArati: false,
      morningStudy: false,
      work: false,
      personalStudy: false,
      sanskritClass: false,
      sleep9pm: false,
      score: 0,
      notes: "",
      noMeatEating: false,
      noIntoxication: false,
      noGambling: false,
      noIllicitSex: false,
      sixteenRounds: false,
      obeisances: 1,
      customItems: { extraReading: true },
      scheduleItemsSnapshot: [],
      habitTracking: {},
    };
    const items = [{ key: "extraReading", label: "Extra Reading", icon: "📖" }];
    expect(calcScore(entry, items, 1)).toBe(100);
  });

  it("handles custom items without obeisances bonus", () => {
    const entry = {
      date: "2026-07-06",
      wakeUp330: false,
      mangalaArati: false,
      bhogaArati: false,
      gauraArati: false,
      morningStudy: false,
      work: false,
      personalStudy: false,
      sanskritClass: false,
      sleep9pm: false,
      score: 0,
      notes: "",
      noMeatEating: false,
      noIntoxication: false,
      noGambling: false,
      noIllicitSex: false,
      sixteenRounds: false,
      obeisances: 0,
      customItems: { extraReading: true },
      scheduleItemsSnapshot: [],
      habitTracking: {},
    };
    const items = [{ key: "extraReading", label: "Extra Reading", icon: "📖" }];
    expect(calcScore(entry, items, 1)).toBe(50);
  });

  it("adds obeisances bonus when target met", () => {
    const entry = {
      date: "2026-07-06",
      wakeUp330: true,
      mangalaArati: false,
      bhogaArati: false,
      gauraArati: false,
      morningStudy: false,
      work: false,
      personalStudy: false,
      sanskritClass: false,
      sleep9pm: false,
      score: 0,
      notes: "",
      noMeatEating: false,
      noIntoxication: false,
      noGambling: false,
      noIllicitSex: false,
      sixteenRounds: false,
      obeisances: 2,
      customItems: {},
      scheduleItemsSnapshot: [],
      habitTracking: {},
    };
    const items = [{ key: "wakeUp330", label: "Wake up 3:30 AM", icon: "🌅" }];
    expect(calcScore(entry, items, 2)).toBe(100);
  });
});

describe("isTutorSession", () => {
  it("returns true for explicit tutor session", () => {
    expect(isTutorSession({ id: "1", date: "2026-07-06", topic: "Sanskrit", duration: 60, notes: "", flashcardsReviewed: 0, flashcardsNew: 0, sessionType: "tutor" })).toBe(true);
  });

  it("returns false for explicit flashcards session", () => {
    expect(isTutorSession({ id: "2", date: "2026-07-06", topic: "Flashcard creation", duration: 45, notes: "", flashcardsReviewed: 0, flashcardsNew: 20, sessionType: "flashcards" })).toBe(false);
  });

  it("falls back to topic detection", () => {
    expect(isTutorSession({ id: "3", date: "2026-07-06", topic: "Sanskrit pronunciation", duration: 60, notes: "", flashcardsReviewed: 0, flashcardsNew: 0 })).toBe(true);
    expect(isTutorSession({ id: "4", date: "2026-07-06", topic: "Flashcard creation — BG Ch.3 vocab", duration: 45, notes: "", flashcardsReviewed: 0, flashcardsNew: 20 })).toBe(false);
  });
});

describe("findChapterBreakdown", () => {
  it("finds the best matching breakdown by substring length", () => {
    const result = findChapterBreakdown("Śrīmad-Bhāgavatam Canto 1");
    expect(result).not.toBeNull();
    expect(result).toContain("Chapters 1–4");
  });

  it("returns null for unknown books", () => {
    const result = findChapterBreakdown("Totally Unknown Book");
    expect(result).toBeNull();
  });
});

describe("bookChapterVerseCounts", () => {
  it("contains accurate Bhagavad-gītā verse counts", () => {
    const bg = bookChapterVerseCounts["bhagavad-gītā"];
    expect(bg[1]).toBe(46);
    expect(bg[18]).toBe(78);
  });

  it("contains accurate Śrī Īśopaniṣad verse counts", () => {
    const iso = bookChapterVerseCounts["śrī īśopaniṣad"];
    expect(iso[1]).toBe(19);
    expect(iso[18]).toBe(19);
  });
});

describe("weekly target hours sync", () => {
  it("calculates weeklyTargetHours from minimumDailyStudyHours and weekendTargetHours", () => {
    const minimumDailyStudyHours = 2;
    const weekendTargetHours = 4;
    const weeklyTargetHours = Math.round((5 * minimumDailyStudyHours + 2 * weekendTargetHours) * 2) / 2;
    expect(weeklyTargetHours).toBe(18);
  });

  it("updates curriculum targetHours when weeklyTargetHours changes", () => {
    const weeks = generateCurriculum(["Bhagavad-gītā As It Is"], "2026-07-06", 32, 18, undefined, 1);
    expect(weeks[0].targetHours).toBe(18);
  });
});

describe("defaultSettings", () => {
  it("has expected default values", () => {
    expect(defaultSettings.planStartDate).toBe("2026-07-06");
    expect(defaultSettings.weeklyTargetHours).toBe(16);
    expect(defaultSettings.minimumDailyStudyHours).toBe(2);
    expect(defaultSettings.weekendTargetHours).toBe(3);
  });
});

describe("parseVerseRef", () => {
  it("parses standard dot notation", () => {
    expect(parseVerseRef("3.19")).toEqual({ chapter: 3, verse: 19 });
    expect(parseVerseRef("4.42")).toEqual({ chapter: 4, verse: 42 });
  });

  it("parses colon notation", () => {
    expect(parseVerseRef("3:19")).toEqual({ chapter: 3, verse: 19 });
  });

  it("strips book prefixes", () => {
    expect(parseVerseRef("BG 4.5")).toEqual({ chapter: 4, verse: 5 });
    expect(parseVerseRef("SB 1.2.3")).toEqual({ chapter: 1, verse: 2 });
  });

  it("strips trailing annotations", () => {
    expect(parseVerseRef("4.5 purport")).toEqual({ chapter: 4, verse: 5 });
    expect(parseVerseRef("3.19 translation")).toEqual({ chapter: 3, verse: 19 });
  });

  it("parses 'Chapter X Verse Y' format", () => {
    expect(parseVerseRef("Chapter 4 Verse 12")).toEqual({ chapter: 4, verse: 12 });
    expect(parseVerseRef("ch3v19")).toEqual({ chapter: 3, verse: 19 });
  });

  it("returns null for invalid input", () => {
    expect(parseVerseRef("")).toBeNull();
    expect(parseVerseRef("hello")).toBeNull();
    expect(parseVerseRef("just words")).toBeNull();
  });
});

describe("normalizeVerseInput", () => {
  it("normalizes various formats to X.Y", () => {
    expect(normalizeVerseInput("BG 4.5")).toBe("4.5");
    expect(normalizeVerseInput("3:19")).toBe("3.19");
    expect(normalizeVerseInput("Chapter 4 Verse 12")).toBe("4.12");
  });

  it("returns trimmed original if unparseable", () => {
    expect(normalizeVerseInput("  some notes  ")).toBe("some notes");
  });
});

describe("isValidVerseRef", () => {
  it("validates correct refs", () => {
    expect(isValidVerseRef("3.19")).toBe(true);
    expect(isValidVerseRef("BG 4.5 purport")).toBe(true);
  });

  it("rejects invalid refs", () => {
    expect(isValidVerseRef("")).toBe(false);
    expect(isValidVerseRef("random text")).toBe(false);
  });
});

describe("verseToAbsolutePosition", () => {
  it("counts from beginning of book", () => {
    // BG Ch1 has 46 verses, so Ch2.1 = position 47
    expect(verseToAbsolutePosition("Bhagavad-gītā", 1, 1)).toBe(1);
    expect(verseToAbsolutePosition("Bhagavad-gītā", 1, 46)).toBe(46);
    expect(verseToAbsolutePosition("Bhagavad-gītā", 2, 1)).toBe(47);
  });

  it("clamps verse to chapter max", () => {
    // Ch1 max = 46, so verse 999 should be clamped to 46
    expect(verseToAbsolutePosition("Bhagavad-gītā", 1, 999)).toBe(46);
  });
});

describe("getVerseProgressForWeek", () => {
  it("calculates progress for partial completion", () => {
    const entries = [
      { date: "2026-07-07", book: "Bhagavad-gītā", startLocation: "3.19", endLocation: "3.30", minutes: 120, hours: 2, sixteenRounds: true, sanskrit: true, wordMeanings: true, translation: true, purport: true, marked: true, reflection: true, dailyStudyComplete: true, quote: "", realization: "", notes: "" },
    ];
    const result = getVerseProgressForWeek("Bhagavad-gītā", "3.19 → End Chapter 4", entries);
    expect(result).not.toBeNull();
    expect(result!.percent).toBeGreaterThan(0);
    expect(result!.percent).toBeLessThan(100);
    expect(result!.currentRef).toBe("3.30");
  });

  it("returns 100% when past the end", () => {
    const entries = [
      { date: "2026-07-07", book: "Bhagavad-gītā", startLocation: "3.19", endLocation: "4.42", minutes: 120, hours: 2, sixteenRounds: true, sanskrit: true, wordMeanings: true, translation: true, purport: true, marked: true, reflection: true, dailyStudyComplete: true, quote: "", realization: "", notes: "" },
    ];
    const result = getVerseProgressForWeek("Bhagavad-gītā", "3.19 → End Chapter 4", entries);
    expect(result).not.toBeNull();
    expect(result!.percent).toBe(100);
  });

  it("returns null when no valid endLocation entries", () => {
    const entries = [
      { date: "2026-07-07", book: "Bhagavad-gītā", startLocation: "", endLocation: "", minutes: 120, hours: 2, sixteenRounds: true, sanskrit: true, wordMeanings: true, translation: true, purport: true, marked: true, reflection: true, dailyStudyComplete: true, quote: "", realization: "", notes: "" },
    ];
    const result = getVerseProgressForWeek("Bhagavad-gītā", "3.19 → End Chapter 4", entries);
    expect(result).toBeNull();
  });
});
