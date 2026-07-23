"use client";

import { useMemo, useState } from "react";
import {
  DailyLogEntry,
  BookProgress,
  VerseMemory,
  JapaEntry,
  ScheduleDay,
  TutorSession,
  SanskritTerm,
  DevoteeContact,
  SpiritualMaster,
  CurriculumWeek,
  WeeklyReflection,
  QuestionEntry,
  Course,
  Settings,
  CharacterAssessment,
} from "@/lib/data";
import { format, subDays, parseISO, differenceInDays } from "date-fns";
import { TrendingUp, TrendingDown, AlertTriangle, BookOpen, Flame, Brain, Heart, User, Sparkles, Shield, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Info, X, Zap, Lock } from "lucide-react";

interface Props {
  settings: Settings;
  dailyLog: DailyLogEntry[];
  bookProgress: BookProgress[];
  verseMemory: VerseMemory[];
  japaLog: JapaEntry[];
  scheduleLog: ScheduleDay[];
  tutorSessions: TutorSession[];
  sanskritVocab: SanskritTerm[];
  devoteeContacts: DevoteeContact[];
  spiritualMaster: SpiritualMaster;
  curriculum: CurriculumWeek[];
  weeklyReflections: WeeklyReflection[];
  questionsLog: QuestionEntry[];
  course: Course;
  characterAssessments?: CharacterAssessment[];
  setSettings?: (fn: (prev: Settings) => Settings) => void;
  setScheduleLog?: (fn: (prev: ScheduleDay[]) => ScheduleDay[]) => void;
}

const horizons = [5, 10, 15, 20, 30, 40] as const;

type Horizon = (typeof horizons)[number];

interface CurrentMetrics {
  dailyStudyHours: number;
  daysLogged: number;
  roundsAvg: number;
  sixteenRoundsPct: number;
  extraRoundsTotal: number;
  scheduleScoreAvg: number;
  sattva: number;
  rajas: number;
  tamas: number;
  goodnessStreak: number;
  sevaDays: number;
  versesMastered: number;
  totalVerses: number;
  vocabSize: number;
  vocabRate: number;
  flashcardsReviewed: number;
  flashcardsNew: number;
  tutorSessionsCount: number;
  instructionsReceived: number;
  reflectionsCompleted: number;
  questionsResolved: number;
  bookHoursTotal: number;
  totalStudyHours: number;
  bookHoursPerBook: number;
  booksComplete: number;
  booksEquivalent: number;
  totalCourseHours: number;
  activeBookCount: number;
  courseProgressPct: number;
  bookProgressTotal: number;
  questionsTotal: number;
  baseTargetDailyHours: number;
  paceMultiplier: number;
  regulativeAdherence: number;
  regulativePrinciplesMode: string;
  latestInstruction: string;
  instructionSource: string;
  openQuestion: string;
  tutorTopic: string;
  reflectionCount: number;
  resolvedQuestionCount: number;
  devoteeContactCount: number;
  devoteeInstructionCount: number;
  primaryDevoteeName: string;
  ashrama: string;
  homePoojaDays: number;
  obeisancesAvg: number;
  obeisancesTarget: number;
  japaFocusAvg: number; // 1-5 avg focus level for japa
  studyFocusAvg: number; // 1-5 avg focus level for study
}

interface HorizonResult {
  years: Horizon;
  studyHours: number;
  booksCompleted: number;
  totalBooks: number;
  versesKnown: number;
  vocabKnown: number;
  japaRounds: number;
  extraRounds: number;
  sevaDays: number;
  sattvaScore: number;
  futureSelf: string;
  identity: string;
  warnings: string[];
  projectedSattva: number;
  projectedRajas: number;
  projectedTamas: number;
}

function getRecentDateRange(days: number) {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => format(subDays(today, i), "yyyy-MM-dd"));
}

function applyTempleMode(metrics: CurrentMetrics): CurrentMetrics {
  // Simulates the metrics of living full-time in the temple environment:
  // daily maṅgala-āratī, harinām, association with guru and sādhu, regulated life.
  return {
    ...metrics,
    dailyStudyHours: Math.max(metrics.dailyStudyHours, 3),
    roundsAvg: Math.max(metrics.roundsAvg, 16),
    sixteenRoundsPct: Math.max(metrics.sixteenRoundsPct, 95),
    extraRoundsTotal: Math.max(metrics.extraRoundsTotal, 16),
    scheduleScoreAvg: Math.max(metrics.scheduleScoreAvg, 95),
    sattva: Math.min(Math.max(metrics.sattva, 75), 95),
    rajas: Math.min(metrics.rajas, 20),
    tamas: Math.min(metrics.tamas, 10),
    sevaDays: Math.max(metrics.sevaDays, 30),
    devoteeContactCount: Math.max(metrics.devoteeContactCount, 30),
    devoteeInstructionCount: Math.max(metrics.devoteeInstructionCount, 10),
    instructionsReceived: Math.max(metrics.instructionsReceived, 5),
    obeisancesAvg: Math.max(metrics.obeisancesAvg, 3),
    obeisancesTarget: Math.max(metrics.obeisancesTarget, 3),
    homePoojaDays: Math.max(metrics.homePoojaDays, 30),
    japaFocusAvg: Math.max(metrics.japaFocusAvg, 4),
    studyFocusAvg: Math.max(metrics.studyFocusAvg, 4),
    regulativeAdherence: Math.max(metrics.regulativeAdherence, 98),
  };
}

function computeMetrics(props: Props, templeMode = false): CurrentMetrics {
  const { settings, dailyLog, bookProgress, verseMemory, japaLog, scheduleLog, tutorSessions, sanskritVocab, devoteeContacts, spiritualMaster, curriculum, weeklyReflections, questionsLog, course, characterAssessments } = props;

  const last30 = new Set(getRecentDateRange(30));

  // Study hours (hours field preferred, minutes fallback)
  const daysLogged = dailyLog.length;
  const totalStudyHours = dailyLog.reduce((sum, e) => {
    const hrs = e.hours != null ? e.hours : e.minutes != null ? e.minutes / 60 : 0;
    return sum + hrs;
  }, 0);

  const recentLogEntries = dailyLog.filter((e) => last30.has(e.date));
  const recentDays = Math.max(1, new Set(recentLogEntries.map((e) => e.date)).size);
  const recentStudyHours = recentLogEntries.reduce((sum, e) => {
    const hrs = e.hours != null ? e.hours : e.minutes != null ? e.minutes / 60 : 0;
    return sum + hrs;
  }, 0);
  const dailyStudyHours = recentStudyHours / recentDays; // per actual logged day, not calendar days

  // Pace-aware projection: base target hours at paceMultiplier 1, then scale by current pace
  const baseTargetDailyHours = (settings.weeklyTargetHours || 16) / 7;
  const projectedDailyHours = Math.max(dailyStudyHours, baseTargetDailyHours) * settings.paceMultiplier;

  // Japa
  const recentJapa = japaLog.filter((j) => last30.has(j.date));
  const roundsAvg = recentJapa.length > 0 ? recentJapa.reduce((s, j) => s + (j.rounds ?? 0), 0) / recentJapa.length : 0;
  const sixteenRoundsPct = recentJapa.length > 0
    ? Math.round((recentJapa.filter((j) => (j.rounds ?? 0) >= 16).length / recentJapa.length) * 100)
    : 0;
  const extraRoundsTotal = recentJapa.reduce((sum, j) => sum + Math.max(0, (j.rounds ?? 0) - 16), 0);

  // Focus/intensity averages (1-5 scale, default 3 if not tracked)
  const japaWithFocus = recentJapa.filter((j) => j.focusLevel != null && j.focusLevel > 0);
  const japaFocusAvg = japaWithFocus.length > 0
    ? japaWithFocus.reduce((s, j) => s + (j.focusLevel || 3), 0) / japaWithFocus.length
    : 3;
  const studyWithFocus = recentLogEntries.filter((e) => e.studyFocusLevel != null && e.studyFocusLevel > 0);
  const studyFocusAvg = studyWithFocus.length > 0
    ? studyWithFocus.reduce((s, e) => s + (e.studyFocusLevel || 3), 0) / studyWithFocus.length
    : 3;

  // Schedule score & one-off entries (high-score days, custom items, or notes marked as special)
  const recentSchedule = scheduleLog.filter((s) => last30.has(s.date));
  const scheduleScoreAvg = recentSchedule.length > 0
    ? Math.round(recentSchedule.reduce((sum, s) => sum + (s.score || 0), 0) / recentSchedule.length)
    : 0;
  // Guna balance from tracked habits
  const trackedHabits = (settings.habits || []).filter((h) => h.tracked);
  let sattva = 0, rajas = 0, tamas = 0;
  let sattvaTotal = 0, rajasTotal = 0, tamasTotal = 0;
  for (const entry of recentSchedule) {
    for (const h of trackedHabits) {
      const result = entry.habitTracking?.[h.id];
      if (result === "positive") {
        if (h.guna === "goodness") sattva++;
        else if (h.guna === "passion") rajas++;
        else if (h.guna === "ignorance") tamas++;
      }
      if (h.guna === "goodness") sattvaTotal++;
      else if (h.guna === "passion") rajasTotal++;
      else if (h.guna === "ignorance") tamasTotal++;
    }
  }
  let sattvaPct = sattvaTotal > 0 ? Math.round((sattva / sattvaTotal) * 100) : 0;
  let rajasPct = rajasTotal > 0 ? Math.round((rajas / rajasTotal) * 100) : 0;
  let tamasPct = tamasTotal > 0 ? Math.round((tamas / tamasTotal) * 100) : 0;

  // Blend character assessment scores (scenario-based honesty check) — 30% weight
  const latestAssessment = characterAssessments && characterAssessments.length > 0 ? characterAssessments[0] : null;
  if (latestAssessment) {
    const caWeight = 0.3;
    sattvaPct = Math.round(sattvaPct * (1 - caWeight) + latestAssessment.sattvaScore * caWeight);
    rajasPct = Math.round(rajasPct * (1 - caWeight) + latestAssessment.rajasScore * caWeight);
    tamasPct = Math.round(tamasPct * (1 - caWeight) + latestAssessment.tamasScore * caWeight);
  }

  // Seva: tracked guna habit or custom schedule item
  const sevaHabitId = trackedHabits.find((h) => h.id === "bg-seva")?.id;
  const sevaDays = recentSchedule.filter((s) =>
    (sevaHabitId && s.habitTracking?.[sevaHabitId] === "positive") ||
    Object.entries(s.customItems || {}).some(([k, v]) => v && (k.toLowerCase().includes("seva") || k.toLowerCase().includes("service")))
  ).length;

  // Goodness streak (consecutive recent days with positive sattva habits)
  const sortedRecent = [...recentSchedule].sort((a, b) => b.date.localeCompare(a.date));
  let goodnessStreak = 0;
  for (const entry of sortedRecent) {
    const positiveGoodness = trackedHabits.filter((h) => h.guna === "goodness" && entry.habitTracking?.[h.id] === "positive").length;
    if (positiveGoodness > 0) goodnessStreak++;
    else break;
  }

  // Verse memory
  const totalVerses = verseMemory.length || 1;
  const versesMastered = verseMemory.filter((v) => v.mastered).length;

  // Vocab / flashcards / tutor
  const vocabSize = sanskritVocab.length;

  // Vocab trend: use dateAdded to compute a daily rate, with a 7-day smoothing prior so
  // a single spike of 8 words on day one doesn't project 8 per day forever.
  const sortedVocabDates = sanskritVocab
    .map((v) => v.dateAdded)
    .filter(Boolean)
    .sort();
  const firstVocabDate = sortedVocabDates[0];
  const daysSinceFirstVocab = firstVocabDate
    ? Math.max(0, differenceInDays(new Date(), parseISO(firstVocabDate)))
    : 0;
  const rawVocabRate = vocabSize > 0 ? vocabSize / Math.max(1, daysSinceFirstVocab + 7) : 0;
  const vocabRate = Math.min(3, Math.max(0.3, rawVocabRate));

  const flashcardsReviewed = tutorSessions.reduce((s, t) => s + (t.flashcardsReviewed || 0), 0);
  const flashcardsNew = tutorSessions.reduce((s, t) => s + (t.flashcardsNew || 0), 0);
  const tutorSessionsCount = tutorSessions.filter((t) => t.sessionType === "tutor" || (!t.sessionType && !t.topic.toLowerCase().includes("flashcard"))).length;

  // Instructions
  const instructionsReceived = [
    ...devoteeContacts.map((c) => (c.instructions || "").trim()).filter(Boolean),
    (spiritualMaster.instructions || "").trim(),
  ].filter(Boolean).length;

  const reflectionsCompleted = weeklyReflections.filter((r) => r.completed).length;
  const questionsResolved = questionsLog.filter((q) => q.status === "resolved").length;

  const bookHoursTotal = bookProgress.reduce((s, b) => s + (b.hoursLogged || 0), 0);
  const booksComplete = bookProgress.filter((b) => b.complete).length;

  // Personalized notes
  const { latestInstruction, instructionSource, openQuestion, tutorTopic, reflectionCount, resolvedQuestionCount } = getPersonalizedNotes(
    devoteeContacts,
    spiritualMaster,
    questionsLog,
    tutorSessions,
    weeklyReflections
  );

  // Derive realistic hours per book from actual data (so 7 books in 8 months doesn't project to 100+ in 5 years)
  // The course plan is the best fallback: total planned hours divided by number of books.
  const activeBookCount = course.books.length || 1;
  const totalCourseHours = Math.max(1, (settings.weeklyTargetHours || 16) * (settings.targetWeeks || 32));
  const estimatedAvgHours = bookProgress.length > 0
    ? bookProgress.reduce((s, b) => s + (b.estimatedTotalHours || 35), 0) / bookProgress.length
    : 35;
  const bookHoursPerBook = (booksComplete > 0 && bookHoursTotal > 0)
    ? bookHoursTotal / booksComplete
    : Math.max(estimatedAvgHours, totalCourseHours / activeBookCount);

  // Book completion equivalent: sum of completed/fractional books
  const booksEquivalent = bookProgress.reduce((sum, b) => {
    const fromPercent = (b.percentComplete || 0) / 100;
    const fromHours = b.estimatedTotalHours > 0 ? (b.hoursLogged || 0) / b.estimatedTotalHours : 0;
    return sum + Math.min(1, fromPercent + fromHours);
  }, 0);

  // Overall curriculum progress (percent of completed curriculum weeks)
  const completedWeeks = curriculum.filter((c) => c.complete).length;
  const courseProgressPct = curriculum.length > 0 ? Math.round((completedWeeks / curriculum.length) * 100) : 0;

  // Regulative principles adherence (from daily schedule entries)
  const recentRegEntries = recentSchedule.filter((s) => s.noMeatEating !== undefined);
  const regulativeKeys = ["noMeatEating", "noIntoxication", "noGambling", "noIllicitSex", "sixteenRounds"] as const;
  const regulativeAdherence = recentRegEntries.length > 0
    ? Math.round(
        recentRegEntries.reduce((sum, s) => {
          const kept = regulativeKeys.filter((k) => s[k as keyof ScheduleDay] as boolean).length;
          return sum + (kept / regulativeKeys.length) * 100;
        }, 0) / recentRegEntries.length
      )
    : 100;

  const result = {
    dailyStudyHours,
    daysLogged,
    roundsAvg,
    sixteenRoundsPct,
    extraRoundsTotal,
    scheduleScoreAvg,
    sattva: sattvaPct,
    rajas: rajasPct,
    tamas: tamasPct,
    goodnessStreak,
    sevaDays,
    versesMastered,
    totalVerses,
    vocabSize,
    vocabRate,
    flashcardsReviewed,
    flashcardsNew,
    tutorSessionsCount,
    instructionsReceived,
    reflectionsCompleted,
    questionsResolved,
    bookHoursTotal,
    totalStudyHours,
    bookHoursPerBook,
    booksComplete,
    booksEquivalent,
    totalCourseHours,
    activeBookCount,
    courseProgressPct,
    bookProgressTotal: bookProgress.length,
    questionsTotal: questionsLog.length,
    baseTargetDailyHours,
    paceMultiplier: settings.paceMultiplier,
    regulativeAdherence,
    regulativePrinciplesMode: course.regulativePrinciples?.mode || "tracking",
    latestInstruction,
    instructionSource,
    openQuestion,
    tutorTopic,
    reflectionCount,
    resolvedQuestionCount,
    devoteeContactCount: (() => {
      // Base: registered contacts in the saṅgha directory
      let count = devoteeContacts.length;
      // Arati attendance = associating with devotees at the temple
      const aratiAttendanceDays = recentSchedule.filter((s) =>
        s.mangalaArati || s.bhogaArati || s.gauraArati || s.customItems?.sundayFeast
      ).length;
      // Each 4 arati-attendance days ≈ 1 additional sadhu contact (regular temple-goer)
      count += Math.floor(aratiAttendanceDays / 4);
      // Sunday Feast days are especially rich in sadhu-saṅga
      const sundayFeastDays = recentSchedule.filter((s) => s.customItems?.sundayFeast).length;
      count += sundayFeastDays;
      return count;
    })(),
    devoteeInstructionCount: devoteeContacts.filter((c) => (c.instructions || "").trim()).length,
    primaryDevoteeName: devoteeContacts[0]?.name || "",
    ashrama: settings.ashrama || "grhastha",
    homePoojaDays: recentSchedule.filter((s) => s.homePooja || s.customItems?.homePooja).length,
    obeisancesAvg: recentSchedule.length > 0 ? recentSchedule.reduce((sum, s) => sum + (s.obeisances || 0), 0) / recentSchedule.length : 0,
    obeisancesTarget: course.sadhanaStandards?.obeisancesTarget || 1,
    japaFocusAvg,
    studyFocusAvg,
  };

  return templeMode ? applyTempleMode(result) : result;
}

function getPersonalizedNotes(
  devoteeContacts: DevoteeContact[],
  spiritualMaster: SpiritualMaster,
  questionsLog: QuestionEntry[],
  tutorSessions: TutorSession[],
  weeklyReflections: WeeklyReflection[]
) {
  const devotee = devoteeContacts.find((c) => (c.instructions || "").trim());
  const latestInstruction = (spiritualMaster.instructions || "").trim() || (devotee?.instructions || "").trim() || "";
  const instructionSource = (spiritualMaster.instructions || "").trim()
    ? "your spiritual master"
    : devotee?.name || "a devotee you respect";

  const open = questionsLog.find((q) => q.status === "open");
  const openQuestion = open ? open.question : "";
  const resolvedQuestionCount = questionsLog.filter((q) => q.status === "resolved").length;

  const latestTutor = [...tutorSessions].sort((a, b) => b.date.localeCompare(a.date))[0];
  const tutorTopic = latestTutor ? latestTutor.topic : "";

  const reflectionCount = weeklyReflections.filter((r) => r.completed).length;

  return { latestInstruction, instructionSource, openQuestion, tutorTopic, reflectionCount, resolvedQuestionCount };
}

function projectHorizon(metrics: CurrentMetrics, years: Horizon): HorizonResult {
  const days = years * 365;

  // General trajectory: not a strict straight line; early years have ups and downs,
  // so the curve starts below 1.0 and approaches 1.0 as the habit matures.
  const trajectoryCurve = 1 - 0.3 * Math.exp(-years / 8);

  // Focus/intensity multiplier: 3 = baseline (1.0x), 5 = deep absorption (1.25x), 1 = distracted (0.7x)
  const studyFocusMult = 0.55 + (metrics.studyFocusAvg / 5) * 0.7; // range: 0.75 at 1, 1.0 at 3.2, 1.25 at 5
  const japaFocusMult = 0.55 + (metrics.japaFocusAvg / 5) * 0.7;

  // Ashrama multipliers: each ashrama has different standards for sādhana, study, sevā, and saṅga
  const ashramaProfile: Record<string, { mult: number; studyMult: number; sevaMult: number; japaMult: number; minStudy: number; minSeva: number; minSadhu: number; minRegulative: number; minRounds: number }> = {
    brahmacari:  { mult: 1.15, studyMult: 1.3,  sevaMult: 1.4,  japaMult: 1.2,  minStudy: 1.5, minSeva: 20, minSadhu: 3, minRegulative: 100, minRounds: 90 },
    grhastha:    { mult: 1.0,  studyMult: 1.0,  sevaMult: 1.0,  japaMult: 1.0,  minStudy: 0.5, minSeva: 8,  minSadhu: 1, minRegulative: 80,  minRounds: 70 },
    vanaprastha: { mult: 1.2,  studyMult: 1.2,  sevaMult: 1.2,  japaMult: 1.15, minStudy: 1.0, minSeva: 15, minSadhu: 2, minRegulative: 90,  minRounds: 80 },
    sannyasi:    { mult: 1.3,  studyMult: 1.5,  sevaMult: 1.5,  japaMult: 1.3,  minStudy: 2.0, minSeva: 25, minSadhu: 5, minRegulative: 100, minRounds: 100 },
  };
  const ap = ashramaProfile[metrics.ashrama] || ashramaProfile.grhastha;
  const ashramaMult = ap.mult;

  // Pace-aware study projection: scales with paceMultiplier and ashrama study expectation
  const projectedDailyHours = Math.max(metrics.dailyStudyHours, metrics.baseTargetDailyHours) * metrics.paceMultiplier * ap.studyMult;
  const studyRate = Math.max(0, projectedDailyHours);
  const studyHours = studyRate * days * trajectoryCurve * studyFocusMult;

  // Books: estimate future books based on actual completion rate (hours per book) or course plan.
  // The fallback uses total course hours / number of books so the projection matches the intended 8-month pace.
  const effectiveBookHoursPerBook = (metrics.totalStudyHours > 0 && metrics.booksEquivalent > 0)
    ? metrics.totalStudyHours / metrics.booksEquivalent
    : Math.max(metrics.bookHoursPerBook, metrics.totalCourseHours / Math.max(1, metrics.activeBookCount));

  const additionalHours = Math.max(0, studyHours - metrics.totalStudyHours);
  const additionalBooks = metrics.totalStudyHours > 0
    ? (additionalHours / effectiveBookHoursPerBook)
    : studyHours / effectiveBookHoursPerBook;
  const booksCompleted = metrics.booksEquivalent + Math.floor(additionalBooks);

  // Verse / vocab rates scale with the pace-adjusted study rate relative to the base target.
  const paceRatio = studyRate / Math.max(0.01, metrics.baseTargetDailyHours);

  // Verse memory: assume mastered at a rate proportional to current progress, scaled by pace
  const baseVerseRate = metrics.totalVerses > 0 ? metrics.versesMastered / Math.max(1, metrics.daysLogged) : 0.25;
  const verseRate = baseVerseRate * paceRatio;
  const versesKnown = Math.floor(metrics.versesMastered + verseRate * days * trajectoryCurve);

  // Vocab projection: use the observed trend, scaled by study pace. The rate is already
  // trend-based (words per day since first entry, smoothed with a 7-day prior).
  const adjustedVocabRate = (metrics.vocabRate || 0.3) * paceRatio;
  const vocabKnown = Math.floor(metrics.vocabSize + adjustedVocabRate * days * trajectoryCurve);

  // Japa rounds scale with pace, ashrama, and japa focus quality
  const dailyRounds = metrics.roundsAvg * Math.min(1.2, 0.5 + 0.5 * paceRatio) * ap.japaMult * japaFocusMult;
  const japaRounds = Math.floor(dailyRounds * days * trajectoryCurve);

  // Extra rounds (beyond 16) accumulate separately as a measure of extra endeavor
  const dailyExtraRounds = Math.max(0, metrics.extraRoundsTotal / 30) * paceRatio;
  const extraRounds = Math.floor(dailyExtraRounds * days * trajectoryCurve + metrics.extraRoundsTotal);

  // Sevā days projected forward — higher ashrama means more service expected
  const dailySevaRate = (metrics.sevaDays / 30) * ap.sevaMult;
  const sevaDays = Math.floor(dailySevaRate * days * trajectoryCurve + metrics.sevaDays);

  // Guna trajectory: sustained study, japa, pūjā, obeisances, and pace build sattva over time.
  // Focus quality amplifies sattva: attentive practice cultivates goodness more than distracted routine.
  const focusBonus = Math.max(0, ((metrics.japaFocusAvg + metrics.studyFocusAvg) / 2 - 3) * 5); // up to +10 for avg focus 5
  const sattvaFromStudy = Math.min(30, studyRate * 15 * studyFocusMult); // up to 30 pts for 2+ hrs/day, amplified by focus
  const sattvaFromJapa = Math.min(30, (metrics.sixteenRoundsPct / 100) * 30 * japaFocusMult); // up to 30 pts for consistent 16 rounds
  const sattvaFromPace = Math.min(15, (metrics.paceMultiplier - 1) * 7.5); // up to 15 pts for fast pace
  const sattvaFromPooja = Math.min(10, (metrics.homePoojaDays / 30) * 10); // up to 10 for daily pūjā
  const sattvaFromObeisances = Math.min(10, (metrics.obeisancesAvg / Math.max(1, metrics.obeisancesTarget)) * 10); // up to 10 for meeting target
  const sattvaFromAssociation = Math.min(5, metrics.devoteeContactCount * 1.5 * ap.mult); // up to 5 for saṅgha, amplified by ashrama
  const sattvaGrowth = Math.min(25, (years / 15) * 25); // sattva matures over ~15 years

  // Rajas and tamas drag DOWN sattva — they represent the pull of passion and ignorance
  const rajasDrag = Math.max(0, (metrics.rajas - 30) * 0.4); // penalty kicks in above 30%
  const tamasDrag = Math.max(0, (metrics.tamas - 20) * 0.6); // tamas is worse — penalty kicks in above 20%

  // Guru-Śāstra-Sādhu pillar bonus: instruction from guru, study of scripture, and sādhu-saṅga
  const guruPillar = (metrics.latestInstruction || metrics.instructionsReceived > 0) ? 5 : 0;
  const sastraPillar = metrics.dailyStudyHours >= 1 ? 5 : metrics.dailyStudyHours >= 0.5 ? 3 : 0;
  const sadhuPillar = metrics.devoteeContactCount >= 3 ? 5 : metrics.devoteeContactCount >= 1 ? 3 : 0;
  const pillarBonus = guruPillar + sastraPillar + sadhuPillar; // up to 15 for all three active

  const sattvaScore = Math.min(100, Math.max(0, Math.round(
    (metrics.sattva + sattvaFromStudy + sattvaFromJapa + sattvaFromPace + sattvaFromPooja + sattvaFromObeisances + sattvaFromAssociation + sattvaGrowth + pillarBonus + focusBonus - rajasDrag - tamasDrag) * ashramaMult
  )));

  const warnings: string[] = [];
  if (metrics.dailyStudyHours < 0.5) warnings.push("Study rate is very low — knowledge growth will be slow.");
  if (metrics.sixteenRoundsPct < 60) warnings.push("Inconsistent 16 rounds — spiritual absorption and steadiness will be limited.");
  if (metrics.sattva < 50) warnings.push("Sattva-guṇa is below 50% — mental clarity and taste for hearing will degrade.");
  if (metrics.rajas > 40) warnings.push("High rajas can lead to burnout, ambition, and distracted service.");
  if (metrics.tamas > 30) warnings.push("High tamas leads to lethargy, forgetfulness, and loss of determination.");

  // Ashrama-specific accountability warnings
  const ashramaLabel: Record<string, string> = { brahmacari: "Brahmacārī", grhastha: "Gṛhastha", vanaprastha: "Vānaprastha", sannyasi: "Sannyāsī" };
  const aLabel = ashramaLabel[metrics.ashrama] || "Devotee";
  if (metrics.dailyStudyHours < ap.minStudy)
    warnings.push(`${aLabel} standard: ${ap.minStudy}+ hrs/day study expected — you are at ${metrics.dailyStudyHours.toFixed(1)}.`);
  if (metrics.sevaDays < ap.minSeva)
    warnings.push(`${aLabel} standard: ${ap.minSeva}+ sevā days/month expected — you have ${metrics.sevaDays}.`);
  if (metrics.devoteeContactCount < ap.minSadhu)
    warnings.push(`${aLabel} standard: ${ap.minSadhu}+ devotee contacts expected — you have ${metrics.devoteeContactCount}.`);
  if (metrics.regulativeAdherence < ap.minRegulative)
    warnings.push(`${aLabel} standard: ${ap.minRegulative}% regulative adherence expected — you are at ${Math.round(metrics.regulativeAdherence)}%.`);
  if (metrics.sixteenRoundsPct < ap.minRounds)
    warnings.push(`${aLabel} standard: ${ap.minRounds}% 16-round consistency expected — you are at ${Math.round(metrics.sixteenRoundsPct)}%.`);

  const futureSelf = describeFutureSelf(sattvaScore, metrics, years, studyHours, booksCompleted, versesKnown, vocabKnown, japaRounds, extraRounds, sevaDays);
  const identity = describeIdentity(sattvaScore, metrics, years);

  // Project how the three guṇas shift over the horizon; the self-assessment is already in the base sattva/rajas/tamas
  const projectedSattva = Math.min(100, Math.round(metrics.sattva + sattvaGrowth + focusBonus - rajasDrag - tamasDrag));
  const projectedRajas = Math.max(0, Math.round(metrics.rajas - (years / 15) * Math.max(0, metrics.rajas - 30)));
  const projectedTamas = Math.max(0, Math.round(metrics.tamas - (years / 15) * Math.max(0, metrics.tamas - 20)));

  return {
    years,
    studyHours,
    booksCompleted,
    totalBooks: Math.max(booksCompleted, metrics.bookProgressTotal || 0),
    versesKnown,
    vocabKnown,
    japaRounds,
    extraRounds,
    sevaDays,
    sattvaScore,
    futureSelf,
    identity,
    warnings,
    projectedSattva,
    projectedRajas,
    projectedTamas,
  };
}

function describeFutureSelf(sattva: number, m: CurrentMetrics, years: number, hours: number, books: number, verses: number, vocab: number, rounds: number, extraRounds: number, sevaDays: number): string {
  if (m.dailyStudyHours === 0 && m.sixteenRoundsPct === 0 && m.sattva === 0) {
    return `No recent data. If you don't start, in ${years} years you'll be in the same place — habits that are not built now will be even harder to build later.`;
  }

  const ashramaDescriptions: Record<string, string> = {
    brahmacari: "a renounced student focused on study and purity",
    grhastha: "a householder balancing spiritual practice and family duties",
    vanaprastha: "one gradually retiring from worldly duties to focus on scripture and pilgrimage",
    sannyasi: "a fully renounced teacher and servant of the holy name",
  };
  const ashramaText = ashramaDescriptions[m.ashrama] || "a devotee";


  // Projected consistency naturally improves with sustained practice over time
  const projectedRoundsPct = Math.min(100, Math.round(m.sixteenRoundsPct + (years / 20) * 20));
  const projectedAdherence = Math.min(100, Math.round(m.regulativeAdherence + (years / 20) * 15));

  const parts: string[] = [];

  // Opening: tie to the user's actual trajectory and current life
  parts.push(`By ${years} years from now, your trajectory is shaping you into ${ashramaText}: a person who has spent around ${Math.round(hours).toLocaleString()} hours in focused study and carried approximately ${books} books through to completion.`);

  // Personalize with devotee instructions and reflections
  if (m.latestInstruction) {
    parts.push(`The instruction you received from ${m.instructionSource} — "${m.latestInstruction.slice(0, 100)}${m.latestInstruction.length > 100 ? "..." : ""}" — will no longer be words on a page; it will be a lived quality of mind and heart.`);
  }
  if (m.reflectionCount > 0) {
    parts.push(`Your ${m.reflectionCount} weekly reflection${m.reflectionCount === 1 ? "" : "s"} have become a habit of self-examination, which over ${years} years turns into mature self-knowledge and humility.`);
  }
  if (m.tutorTopic) {
    parts.push(`What you began exploring with your tutor — "${m.tutorTopic}" — will have expanded into a coherent body of understanding that you can explain and apply.`);
  }
  if (m.devoteeContactCount > 0) {
    parts.push(`The ${m.devoteeContactCount} devotees in your saṅgha${m.primaryDevoteeName ? `, including ${m.primaryDevoteeName},` : ""} will not be mere contacts; they will become the voices that steady you when your own resolve wavers.`);
    if (m.devoteeInstructionCount > 0) {
      parts.push(`The ${m.devoteeInstructionCount} instruction${m.devoteeInstructionCount === 1 ? "" : "s"} you have received from them will be the guardrails that keep your practice honest and your heart soft.`);
    }
  }
  if (m.openQuestion) {
    parts.push(`The question you are still carrying — "${m.openQuestion.slice(0, 80)}${m.openQuestion.length > 80 ? "..." : ""}" — will either have become clear through steady inquiry, or it will have become a doorway to deeper surrender.`);
  } else if (m.resolvedQuestionCount > 0) {
    parts.push(`The ${m.resolvedQuestionCount} question${m.resolvedQuestionCount === 1 ? "" : "s"} you have already resolved are the foundation for the much deeper understanding you will carry then.`);
  }

  // Japa, study, and service (not just numbers)
  parts.push(`Your japa will have accumulated roughly ${Math.round(rounds / 1000)}k rounds, with about ${projectedRoundsPct}% of days reaching the full 16 rounds.`);
  if (extraRounds > 0) parts.push(`The extra rounds you sometimes push for will add another ${Math.round(extraRounds / 1000)}k rounds — those moments of additional endeavor are what transform japa from a routine into a relationship.`);
  if (sevaDays > 0) parts.push(`Your service — sevā on roughly ${sevaDays} days — will have softened the heart and anchored your knowledge in action.`);
  if (m.homePoojaDays > 0) parts.push(`Your at-home pūjā on roughly ${m.homePoojaDays} days will have made the Deity room the center of your day and deepened your relationship with the Lord.`);
  if (m.obeisancesAvg > 0) parts.push(`The ${m.obeisancesAvg.toFixed(1)} obeisances you offer on average, toward a target of ${m.obeisancesTarget}, will have cultivated humility and the habit of surrender.`);
  if (verses > 0) parts.push(`Approximately ${verses} verses will live in your memory, ready to come forward when you need them.`);
  if (vocab > 0) parts.push(`A Sanskrit vocabulary of roughly ${vocab} words will have turned the unfamiliar language of the śāstra into something you can hear directly.`);

  // Guru-Śāstra-Sādhu pillar assessment
  const pillarsActive = [m.latestInstruction ? "guru" : "", m.dailyStudyHours >= 0.5 ? "śāstra" : "", m.devoteeContactCount >= 1 ? "sādhu" : ""].filter(Boolean);
  if (pillarsActive.length === 3) {
    parts.push("All three pillars — guru, śāstra, and sādhu-saṅga — are active in your life. This triangulation protects you from self-deception and accelerates genuine realization.");
  } else if (pillarsActive.length === 2) {
    const missing = ["guru", "śāstra", "sādhu"].find((p) => !pillarsActive.includes(p));
    parts.push(`Two of three pillars are active. The missing pillar — ${missing} — leaves a blind spot that the other two cannot fully compensate for.`);
  } else if (pillarsActive.length === 1) {
    parts.push(`Only one pillar is active (${pillarsActive[0]}). Without guru, śāstra, and sādhu working together, even sincere effort is unstable and prone to deviation.`);
  } else {
    parts.push("None of the three pillars — guru, śāstra, sādhu-saṅga — are strong yet. This is the first and most important thing to establish.");
  }

  // Sattva and character
  if (sattva >= 75) {
    if (years >= 30) {
      parts.push("After decades of steady practice, your sattva-guṇa is deeply rooted: the mind is calm, the heart is soft, and Kṛṣṇa is naturally your first resort.");
    } else {
      parts.push("With steady sattva-guṇa, your mind is becoming clear, peaceful, and fixed on Kṛṣṇa. You increasingly renounce disturbances and find joy in hearing and chanting.");
    }
  } else if (sattva >= 50) {
    parts.push("You are still a mixed platform — real clarity is growing, but desires and distractions still pull at you. Progress is genuine, but it needs protection and honest course-correction.");
  } else {
    parts.push("Without sattva-guṇa, the heart becomes covered. Knowledge stays theoretical and does not transform the character.");
  }

  // Rajas / Tamas specific text — only when they are elevated
  if (m.rajas > 50) {
    parts.push("Elevated rajas is pulling your energy outward — ambition, restlessness, and over-commitment. The antidote is deliberate simplicity: fewer projects, longer japa, and trust in Kṛṣṇa's arrangement.");
  } else if (m.rajas > 35) {
    parts.push("Moderate rajas is present — you may notice mental speed, impatience with slow progress, or a tendency to measure devotion by output. Slow down; quality of attention matters more.");
  }
  if (m.tamas > 40) {
    parts.push("High tamas is a serious drag: procrastination, heavy sleep, and avoidance of challenging practice. Wake earlier, eat lighter, and serve actively — these break tamas faster than willpower alone.");
  } else if (m.tamas > 25) {
    parts.push("Some tamas lingers — you may notice resistance to early rising, a pull toward entertainment, or dullness after meals. Consistent morning sādhana is the simplest remedy.");
  }

  // Regulative principles
  if (projectedAdherence >= 90) {
    parts.push("The four regulative principles and 16 rounds are well-protected, so your devotional foundation is strong and unlikely to be shaken.");
  } else if (projectedAdherence >= 70) {
    parts.push("You are mostly keeping the four regulative principles, but occasional slips will slow deeper realization and weaken your taste.");
  } else {
    parts.push("Regulative principles are inconsistently kept. Without these guardrails, even study and japa lose their transforming power.");
  }

  // Closing sentence based on year horizon
  if (years >= 30) {
    parts.push("This is the person you are becoming — not overnight, but one small daily choice at a time.");
  } else if (years >= 10) {
    parts.push("In a decade, these small daily choices will have compounded into something you cannot yet fully imagine.");
  } else {
    parts.push("In just a few years, the choices you make today will already be visible in your character and understanding.");
  }

  return parts.join(" ");
}

function describeIdentity(sattva: number, m: CurrentMetrics, years: number): string {
  const projectedRoundsPct = Math.min(100, Math.round(m.sixteenRoundsPct + (years / 20) * 20));
  if (sattva >= 75 && projectedRoundsPct >= 60) {
    if (years >= 30) return "A mature, steady devotee — decades of sādhana have made Kṛṣṇa-consciousness your default state.";
    if (years >= 10) return "A well-established devotee with strong habits of hearing, chanting, and service.";
    return "A steady, self-controlled devotee with genuine taste for scripture and service.";
  }
  if (sattva >= 60) return "A sincere practitioner who has made real progress, but still has areas to strengthen.";
  if (sattva >= 40) return "A devotee with good intentions, still growing through study and japa.";
  if (sattva >= 20) return "A person whose spiritual identity is mostly theoretical; material habits still dominate.";
  return "A person drifting away from spiritual practice. Without change, the future identity is largely unchanged from today.";
}

function getCourseCorrections(m: CurrentMetrics): string[] {
  const corrections: string[] = [];
  const targetDaily = Math.max(m.dailyStudyHours, 2); // arbitrary min target
  if (m.dailyStudyHours < targetDaily) {
    corrections.push(`Study rate is ${m.dailyStudyHours.toFixed(1)} hrs/day. Aim for at least ${targetDaily.toFixed(1)} to stay on track.`);
  }
  if (m.sixteenRoundsPct < 80) {
    corrections.push("16 rounds is not yet consistent. The single most powerful correction is to protect your morning chanting time.");
  }
  if (m.sattva < 60) {
    corrections.push("Raise sattva-guṇa: sleep early, eat prasādam, read before screens, and avoid gossip and heavy entertainment.");
  }
  if (m.rajas > 40) {
    corrections.push("Reduce rajas: stop multitasking, cut unnecessary commitments, and slow down the mind.");
  }
  if (m.tamas > 25) {
    corrections.push("Reduce tamas: wake up earlier, engage in active sevā, and avoid oversleeping or heavy food.");
  }
  if (m.versesMastered < 10) {
    corrections.push("Start memorizing at least one verse per week. Even a few verses carry lifelong protection.");
  }
  if (m.vocabSize < 20) {
    corrections.push("Build vocabulary slowly: one Sanskrit word per day becomes 365 words in a year.");
  }
  if (m.tutorSessionsCount === 0) {
    corrections.push("No tutor sessions recorded. Regular guidance from senior devotees dramatically accelerates progress.");
  }
  if (m.instructionsReceived === 0) {
    corrections.push("Seek instructions from a senior devotee and spiritual master and write them down.");
  }
  if (m.questionsResolved < m.questionsTotal / 2 && m.questionsTotal > 0) {
    corrections.push("Many questions remain unresolved. Clear doubts with a senior devotee so they don't become obstacles.");
  }
  return corrections;
}

function getNegativeProjection(m: CurrentMetrics): string {
  const parts: string[] = [];
  parts.push("If the current trajectory does not change:");
  if (m.dailyStudyHours < 0.5) parts.push("Scripture will remain unfamiliar and not enter the heart.");
  if (m.sixteenRoundsPct < 50) parts.push("Japa becomes mechanical or neglected; taste for chanting diminishes.");
  if (m.sattva < 50) parts.push("The mind stays disturbed by desires, and spiritual life feels like a struggle.");
  if (m.rajas > 40) parts.push("Ambition and restlessness lead to burnout and mixed motivations.");
  if (m.tamas > 30) parts.push("Procrastination, excuses, and forgetfulness become the norm.");
  if (m.versesMastered === 0) parts.push("You will have no verses to call on in difficulty or at death.");
  if (m.vocabSize === 0) parts.push("Sanskrit will remain a foreign wall, limiting deeper access to the śāstra.");
  if (m.tutorSessionsCount === 0) parts.push("Without guidance, subtle misconceptions and hidden anarthas will not be corrected.");
  return parts.length <= 1
    ? "The present path is not clearly negative. If it slips, however, the cost is the same time lost without inner transformation."
    : parts.join(" ");
}

const definitions: Record<string, { term: string; definition: string; reference: string }> = {
  sattva: {
    term: "Sattva-guṇa",
    definition: "The mode of goodness: clarity, knowledge, peacefulness, and attraction to spiritual truth.",
    reference: "BG 14.6 — sattvātu rājasas tāmasāḥ: knowledge develops in sattva-guṇa.",
  },
  seva: {
    term: "Sevā",
    definition: "Selfless service to Kṛṣṇa and His devotees, offered without desire for return.",
    reference: "BG 18.46 — yataḥ pravṛttir bhūtānāṁ: by work in the mode of one's nature one worships the Lord.",
  },
  japa: {
    term: "Japa",
    definition: "The soft chanting of the holy names, especially the Hare Kṛṣṇa mahā-mantra, on beads.",
    reference: "CC Ādi 17.21 — kīrtana-prabhave smṛti-nāśa: chanting destroys forgetfulness of Kṛṣṇa.",
  },
  rounds: {
    term: "16 Rounds",
    definition: "Chanting the Hare Kṛṣṇa mahā-mantra 16 times around the mālā (108 beads), about 1,728 repetitions.",
    reference: "Instruction of Śrīla Prabhupāda: minimum 16 rounds daily.",
  },
  regulative: {
    term: "Four Regulative Principles",
    definition: "No meat-eating, no intoxication, no gambling, no illicit sex — the foundation for steady spiritual practice.",
    reference: "SB 6.1.17 — svārtha-gatiṁ hi viṣṇuṁ durāśayā ye bahir-artha-māninaḥ: those seeking sense pleasure cannot find Viṣṇu.",
  },
  sadhana: {
    term: "Sādhana",
    definition: "One's daily regulated spiritual practice — the disciplines that gradually produce realization.",
    reference: "SB 6.1.17 — tapasā brahmacaryeṇa śamena ca damena ca.",
  },
  guna: {
    term: "Guṇas",
    definition: "The three modes of material nature: sattva (goodness), rajas (passion), and tamas (ignorance). Rajas and tamas degrade your projection — sattva elevates it.",
    reference: "BG 14.5 — sattvaṁ rajas tama iti guṇāḥ prakṛti-sambhavāḥ.",
  },
  study: {
    term: "Śāstra Study",
    definition: "Regular hearing and reading of transcendental literature — one of the three pillars (guru, śāstra, sādhu) that validate spiritual progress.",
    reference: "BG 4.34 — tad viddhi praṇipātena paripraśnena sevayā: approach a spiritual master, inquire submissively, and render service.",
  },
};

interface PushOption {
  key: string;
  label: string;
  icon: string;
}

interface PushCandidate {
  key: string;
  category: string;
  title: string;
  action: string;
  why: string;
  commitLabel: string;
  commitIcon: string;
  gap: number;
  settingsKey?: string;
  settingsValue?: number;
  options?: PushOption[];
  optionKey?: string;
}

function getAllPushCandidates(m: CurrentMetrics, committedKeys: string[]): PushCandidate[] {
  const candidates: PushCandidate[] = [
    {
      key: "earlyAlarm",
      category: "japa",
      title: "Protect one round of japa",
      action: "Set your alarm 10 minutes earlier tomorrow and complete one more round of the Hare Kṛṣṇa mahā-mantra before the day begins.",
      why: "Chanting is the foundation. One extra round is a small, winnable change that quickly compounds into steady 16 rounds.",
      commitLabel: "Wake 10 min earlier for japa",
      commitIcon: "⏰",
      gap: 100 - m.sixteenRoundsPct,
    },
    {
      key: "studyBlock15",
      category: "study",
      title: "Add one focused study session",
      action: `Pick one 15-minute block today (after work, before dinner, or at lunch) and read one section of your current book. Your current study rate is ${m.dailyStudyHours.toFixed(1)} hrs/day; 15 minutes raises it to ${(m.dailyStudyHours + 0.25).toFixed(1)} hrs/day.`,
      why: "Study builds the container for understanding. A small daily increase is more powerful than occasional long sessions.",
      commitLabel: "15 min extra study daily",
      commitIcon: "📖",
      gap: 100 - Math.min(100, m.dailyStudyHours * 40),
      settingsKey: "minimumDailyStudyHours",
      settingsValue: 0.25,
    },
    {
      key: "regPlan",
      category: "regulative",
      title: "Lock in one regulative principle",
      action: "Pick one principle below and make one concrete plan for it: pack prasādam, avoid a trigger place, or go to bed earlier.",
      why: "The four regulative principles are guardrails. Protecting one makes the others easier.",
      commitLabel: "Protect one regulative principle daily",
      commitIcon: "🛡️",
      gap: 100 - m.regulativeAdherence,
      options: [
        { key: "noMeat", label: "No meat-eating", icon: "🥗" },
        { key: "noIntoxication", label: "No intoxication", icon: "🍃" },
        { key: "noGambling", label: "No gambling", icon: "🎲" },
        { key: "noIllicitSex", label: "No illicit sex", icon: "🔥" },
      ],
    },
    {
      key: "screenOff30",
      category: "sattva",
      title: "Raise sattva-guṇa with one habit",
      action: "Tonight, turn off screens 30 minutes before sleep and read or chant instead. Early sleep and early rising are the easiest ways to raise sattva.",
      why: "Sattva is the platform for knowledge. Sleep and media choices shape it more quickly than willpower alone.",
      commitLabel: "Screens off 30 min before bed",
      commitIcon: "📵",
      gap: 100 - m.sattva,
    },
    {
      key: "dailySeva",
      category: "seva",
      title: "Do one small act of service",
      action: "Find one thing that needs doing — dishes, helping another devotee, cleaning the temple room — and do it without expecting recognition.",
      why: "Sevā softens the heart and anchors knowledge in action. One small act today begins a habit.",
      commitLabel: "Daily sevā (any small act)",
      commitIcon: "🙏",
      gap: 100 - Math.min(100, m.sevaDays * 10),
    },
    {
      key: "weeklyReflection",
      category: "reflection",
      title: "Write one reflection",
      action: "Open the Weekly Reflection tab and answer one prompt. Even one sentence about what you noticed today deepens self-awareness.",
      why: "Reflection turns experience into learning. Without it, the same patterns repeat.",
      commitLabel: "Weekly reflection (at least 1 per week)",
      commitIcon: "✍️",
      gap: 100 - Math.min(100, m.reflectionCount * 10),
    },
    {
      key: "askQuestion",
      category: "guidance",
      title: "Ask one question",
      action: "Write down one doubt or question and ask it in your next tutor session or to a senior devotee. Don't let it stay hidden.",
      why: "Unanswered questions become obstacles. Bringing them into the light is the fastest way to clarity.",
      commitLabel: "Ask one question per week",
      commitIcon: "❓",
      gap: m.openQuestion ? 100 - m.resolvedQuestionCount * 5 : 0,
    },
  ];

  return candidates
    .filter((c) => c.gap > 0 && !committedKeys.includes(c.key))
    .sort((a, b) => b.gap - a.gap);
}

export function ProjectionTab(props: Props) {
  const [templeMode, setTempleMode] = useState(false);
  const metrics = useMemo(() => computeMetrics(props, templeMode), [props, templeMode]);
  const latestAssessment = props.characterAssessments && props.characterAssessments.length > 0 ? props.characterAssessments[0] : null;
  const [tuners, setTuners] = useState<Partial<CurrentMetrics>>({});
  const [simulationMode, setSimulationMode] = useState(false);
  const [showPush, setShowPush] = useState(false);
  const [pushIdx, setPushIdx] = useState(0);
  const [confirmCommit, setConfirmCommit] = useState<PushCandidate | null>(null);
  const [selectedPushOption, setSelectedPushOption] = useState<PushOption | null>(null);
  const [showTuners, setShowTuners] = useState(false);

  const [aiCache, setAiCache] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState(false);

  const committedKeys = props.settings.commitments || [];
  const adjustedMetrics = useMemo(() => ({ ...metrics, ...tuners }), [metrics, tuners]);
  const projections = useMemo(() => horizons.map((y) => projectHorizon(adjustedMetrics, y)), [adjustedMetrics]);
  const corrections = useMemo(() => getCourseCorrections(adjustedMetrics), [adjustedMetrics]);
  const negative = useMemo(() => getNegativeProjection(adjustedMetrics), [adjustedMetrics]);
  const pushCandidates = useMemo(() => getAllPushCandidates(adjustedMetrics, committedKeys), [adjustedMetrics, committedKeys]);
  const currentPushCandidate = pushCandidates[Math.min(pushIdx, Math.max(0, pushCandidates.length - 1))];
  const [selectedYear, setSelectedYear] = useState<Horizon>(10);

  const selected = projections.find((p) => p.years === selectedYear)!;
  const cacheKey = `${selected.years}-${selected.sattvaScore}-${adjustedMetrics.sixteenRoundsPct}-${adjustedMetrics.dailyStudyHours}-${adjustedMetrics.ashrama}-${adjustedMetrics.rajas}-${adjustedMetrics.tamas}-${adjustedMetrics.sattva}`;

  const generateAiSummary = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/generate-projection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          years: selected.years,
          metrics: adjustedMetrics,
          projection: selected,
          fallback: selected.futureSelf,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate summary");
      const data = await res.json();
      setAiCache((prev) => ({ ...prev, [cacheKey]: data.summary }));
    } catch (err) {
      // Fallback to static summary if AI fails or key not set
      setAiCache((prev) => ({ ...prev, [cacheKey]: selected.futureSelf }));
    } finally {
      setAiLoading(false);
    }
  };

  const aiSummary = aiCache[cacheKey];

  const updateTuner = <K extends keyof CurrentMetrics>(key: K, value: CurrentMetrics[K]) => {
    setTuners((prev) => ({ ...prev, [key]: value }));
  };

  const resetTuners = () => setTuners({});

  const m = adjustedMetrics;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
          <Sparkles size={24} />
          Future Self Projection
          <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 rounded-full border border-amber-200 dark:border-amber-800">
            Beta
          </span>
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Your current trajectory projected 5, 10, 15, 20, 30, and 40 years into the future.
          This is a general trajectory — not a linear guarantee — it accounts for the natural ups and downs of sustained spiritual practice.
          Toggle simulation mode or full-time temple mode to see how your future self shifts.
        </p>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setSimulationMode((s) => !s)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            simulationMode
              ? "bg-amber-600 text-white"
              : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          }`}
        >
          <TrendingUp size={16} />
          {simulationMode ? "Exit Simulation" : "Simulation Mode"}
        </button>
        <button
          onClick={() => setTempleMode((s) => !s)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            templeMode
              ? "bg-amber-600 text-white"
              : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          }`}
        >
          <Flame size={16} />
          {templeMode ? "Householder / Day Job" : "Full-Time Temple"}
        </button>
        <button
          onClick={() => setShowPush(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
        >
          <Zap size={16} />
          Push Myself
        </button>
        <button
          onClick={generateAiSummary}
          disabled={aiLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          <Sparkles size={16} />
          {aiLoading ? "Generating..." : aiSummary ? "Regenerate AI Summary" : "AI Summary"}
        </button>
      </div>

      {templeMode && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 mb-6">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Full-time temple scenario:</strong> daily maṅgala-āratī, harinām, saṅga, and regulated guru/sādhu association are assumed.
            This projects your trajectory as if Kṛṣṇa-consciousness is the center of your entire day.
          </p>
        </div>
      )}

      {/* Current snapshot */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard icon={<BookOpen size={18} />} label="Study" value={`${m.dailyStudyHours.toFixed(1)} hrs/day`} tooltip="study" />
        <MetricCard icon={<Flame size={18} />} label="16 Rounds" value={`${m.sixteenRoundsPct}%`} tooltip="rounds" />
        {m.extraRoundsTotal > 0 && (
          <MetricCard icon={<Flame size={18} />} label="Extra Rounds (30d)" value={`${m.extraRoundsTotal}`} />
        )}
        <MetricCard icon={<Brain size={18} />} label="Sattva" value={`${m.sattva}%`} tooltip="sattva" />
        <MetricCard icon={<Heart size={18} />} label="Schedule Score" value={`${m.scheduleScoreAvg}%`} tooltip="sadhana" />
        <MetricCard icon={<Shield size={18} />} label="4 Regs + 16" value={`${m.regulativeAdherence}%`} tooltip="regulative" />
        {m.sevaDays > 0 && (
          <MetricCard icon={<User size={18} />} label="Sevā Days (30d)" value={`${m.sevaDays}`} tooltip="seva" />
        )}
        {m.homePoojaDays > 0 && (
          <MetricCard icon={<Sparkles size={18} />} label="At-Home Pūjā (30d)" value={`${m.homePoojaDays}`} tooltip="sadhana" />
        )}
        <MetricCard icon={<BookOpen size={18} />} label="Verses Mastered" value={`${m.versesMastered}/${m.totalVerses}`} />
        <MetricCard icon={<User size={18} />} label="Vocab" value={`${m.vocabSize}`} />
        <MetricCard icon={<TrendingUp size={18} />} label="Tutor Sessions" value={`${m.tutorSessionsCount}`} />
        <MetricCard icon={<BookOpen size={18} />} label="Books Complete" value={`${m.booksComplete}`} />
        <MetricCard icon={<Brain size={18} />} label="Japa Focus" value={`${m.japaFocusAvg.toFixed(1)}/5`} tooltip="japa" />
        <MetricCard icon={<Brain size={18} />} label="Study Focus" value={`${m.studyFocusAvg.toFixed(1)}/5`} tooltip="study" />
        {latestAssessment && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-indigo-200 dark:border-indigo-900/50 p-4 col-span-2 md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={18} className="text-indigo-600 dark:text-indigo-300" />
              <span className="text-sm font-bold text-indigo-900 dark:text-indigo-100">Character Self-Assessment</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-auto">
                {new Date(latestAssessment.date).toLocaleDateString()}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{latestAssessment.sattvaScore}%</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Sattva</p>
              </div>
              <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-2">
                <p className="text-lg font-bold text-rose-700 dark:text-rose-300">{latestAssessment.rajasScore}%</p>
                <p className="text-[10px] text-rose-600 dark:text-rose-400">Rajas</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{latestAssessment.tamasScore}%</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">Tamas</p>
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
              Blended into trajectory at 30% weight. Your honest self-evaluation shapes how sattva, rajas, and tamas are projected.
            </p>
          </div>
        )}
        {/* Guru-Śāstra-Sādhu Pillar Card — expanded */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-4 col-span-full">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={18} className="text-amber-700 dark:text-amber-300" />
            <span className="text-sm font-bold text-amber-900 dark:text-amber-100">Guru · Śāstra · Sādhu — The Three Pillars</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-auto">
              {[m.latestInstruction ? 1 : 0, m.dailyStudyHours >= 0.5 ? 1 : 0, m.devoteeContactCount >= 1 ? 1 : 0].reduce((a, b) => a + b, 0)}/3 active
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed">
            Vaiṣṇava epistemology rests on three mutually-reinforcing sources of knowledge. When all three are active, self-deception is minimized and realization accelerates.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Guru */}
            <div className={`rounded-lg p-3 border ${m.latestInstruction ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-lg font-bold ${m.latestInstruction ? "text-green-700 dark:text-green-300" : "text-zinc-400 dark:text-zinc-600"}`}>G</span>
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Guru</span>
                {m.latestInstruction && <span className="ml-auto text-xs text-green-600 dark:text-green-400">✓ Active</span>}
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {m.latestInstruction ? (
                  <>
                    <p className="mb-1">Instructions from {m.instructionSource}:</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {m.latestInstruction.split(/\n+/).filter(Boolean).map((line, i) => (
                        <li key={i}>{line.trim()}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p>No guru instruction logged yet. Record guidance from your spiritual master or a senior devotee in Settings → Spiritual Master or Devotee Contacts.</p>
                )}
              </div>
            </div>
            {/* Śāstra */}
            <div className={`rounded-lg p-3 border ${m.dailyStudyHours >= 0.5 ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-lg font-bold ${m.dailyStudyHours >= 0.5 ? "text-green-700 dark:text-green-300" : "text-zinc-400 dark:text-zinc-600"}`}>Ś</span>
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Śāstra</span>
                {m.dailyStudyHours >= 0.5 && <span className="ml-auto text-xs text-green-600 dark:text-green-400">✓ Active</span>}
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {m.dailyStudyHours >= 1
                  ? `Strong: ${m.dailyStudyHours.toFixed(1)} hrs/day of śāstra study. The revealed scriptures are illuminating your path.`
                  : m.dailyStudyHours >= 0.5
                  ? `Active at ${m.dailyStudyHours.toFixed(1)} hrs/day. Try reaching 1 hr/day for full pillar strength.`
                  : `Only ${m.dailyStudyHours.toFixed(1)} hrs/day — below the 0.5 hr threshold. Consistent daily reading, even 30 min, activates this pillar.`}
              </p>
            </div>
            {/* Sādhu */}
            <div className={`rounded-lg p-3 border ${m.devoteeContactCount >= 1 ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-lg font-bold ${m.devoteeContactCount >= 1 ? "text-green-700 dark:text-green-300" : "text-zinc-400 dark:text-zinc-600"}`}>S</span>
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Sādhu</span>
                {m.devoteeContactCount >= 1 && <span className="ml-auto text-xs text-green-600 dark:text-green-400">✓ Active</span>}
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {m.devoteeContactCount >= 3
                  ? `Strong sādhu-saṅga: ${m.devoteeContactCount} devotee contacts. Association with devotees purifies the heart and reinforces conviction.`
                  : m.devoteeContactCount >= 1
                  ? `${m.devoteeContactCount} devotee contact${m.devoteeContactCount > 1 ? "s" : ""} logged. More association strengthens this pillar — try attending programs or reaching out regularly.`
                  : "No devotee contacts logged. Add devotees you associate with in Settings → Devotee Contacts. Even one sincere connection makes a difference."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Horizon selector + Simulation side-by-side layout */}
      <div className={simulationMode ? "flex flex-col lg:flex-row gap-6" : ""}>

      {/* Simulation sidebar — sticky on large screens */}
      {simulationMode && (
        <div className="lg:w-80 lg:shrink-0 lg:order-2">
          <div className="lg:sticky lg:top-4 bg-white dark:bg-zinc-900 rounded-2xl border border-amber-200 dark:border-zinc-800 p-4 mb-6 lg:mb-0 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                <TrendingUp size={16} />
                Simulation
              </h3>
              <button
                onClick={resetTuners}
                className="text-xs text-amber-700 dark:text-amber-300 hover:underline"
              >
                Reset
              </button>
            </div>
            <div className="space-y-4">
              <TunerSlider label="Study hrs/day" min={0} max={8} step={0.1} value={m.dailyStudyHours} onChange={(v) => updateTuner("dailyStudyHours", v)} />
              <TunerSlider label="16 rounds (%)" min={0} max={100} step={5} value={m.sixteenRoundsPct} onChange={(v) => updateTuner("sixteenRoundsPct", v)} />
              <TunerSlider label="Sattva" min={0} max={100} step={5} value={m.sattva} onChange={(v) => updateTuner("sattva", v)} tooltipKey="sattva" />
              <TunerSlider label="Rajas" min={0} max={100} step={5} value={m.rajas} onChange={(v) => updateTuner("rajas", v)} tooltipKey="guna" />
              <TunerSlider label="Tamas" min={0} max={100} step={5} value={m.tamas} onChange={(v) => updateTuner("tamas", v)} tooltipKey="guna" />
              <TunerSlider label="Pace ×" min={0.5} max={3} step={0.1} value={m.paceMultiplier} onChange={(v) => updateTuner("paceMultiplier", v)} />
              <TunerSlider label="Sevā days" min={0} max={30} step={1} value={m.sevaDays} onChange={(v) => updateTuner("sevaDays", v)} tooltipKey="seva" />
              <TunerSlider label="Pūjā days" min={0} max={30} step={1} value={m.homePoojaDays} onChange={(v) => updateTuner("homePoojaDays", v)} tooltipKey="sadhana" />
              <TunerSlider label="Obeisances/day" min={0} max={3} step={0.5} value={m.obeisancesAvg} onChange={(v) => updateTuner("obeisancesAvg", v)} />
              <TunerSlider label="Regulative (%)" min={0} max={100} step={5} value={m.regulativeAdherence} onChange={(v) => updateTuner("regulativeAdherence", v)} tooltipKey="regulative" />
              <TunerSlider label="Extra rounds" min={0} max={100} step={1} value={m.extraRoundsTotal} onChange={(v) => updateTuner("extraRoundsTotal", v)} />
              <TunerSlider label="Japa focus" min={1} max={5} step={0.5} value={m.japaFocusAvg} onChange={(v) => updateTuner("japaFocusAvg", v)} tooltipKey="japa" />
              <TunerSlider label="Study focus" min={1} max={5} step={0.5} value={m.studyFocusAvg} onChange={(v) => updateTuner("studyFocusAvg", v)} tooltipKey="study" />
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Aśrama</label>
                <select
                  value={m.ashrama}
                  onChange={(e) => updateTuner("ashrama", e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm"
                >
                  <option value="brahmacari">Brahmacārī</option>
                  <option value="grhastha">Gṛhastha</option>
                  <option value="vanaprastha">Vānaprastha</option>
                  <option value="sannyasi">Sannyāsī</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main projection content */}
      <div className={simulationMode ? "flex-1 lg:order-1 min-w-0" : ""}>

      {/* Horizon selector */}
      <div className="flex flex-wrap gap-2 mb-8">
        {horizons.map((y) => (
          <button
            key={y}
            onClick={() => setSelectedYear(y)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedYear === y
                ? "bg-amber-600 text-white"
                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            {y} years
          </button>
        ))}
      </div>

      {/* Main projection card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-amber-200 dark:border-zinc-800 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            In {selected.years} years
          </h3>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
            selected.sattvaScore >= 60
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
              : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
          }`}>
            {selected.identity}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <ProjectionStat label="Study Hours" value={Math.round(selected.studyHours).toLocaleString()} />
          <ProjectionStat label="Books Read" value={`${selected.booksCompleted}`} />
          <ProjectionStat label="Verses Known" value={`${selected.versesKnown}`} />
          <ProjectionStat label="Sanskrit Words" value={`${selected.vocabKnown}`} />
          <ProjectionStat label="Japa Rounds" value={`${Math.round(selected.japaRounds / 1000)}k`} tooltipKey="japa" />
          <ProjectionStat label="Extra Rounds" value={`${selected.extraRounds}`} />
          <ProjectionStat label="Sattva" value={`${selected.sattvaScore}%`} tooltipKey="sattva" />
          <ProjectionStat label="Sevā Days" value={`${selected.sevaDays}`} tooltipKey="seva" />
        </div>

        {aiSummary ? (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-900/30 rounded-xl p-4 mb-4">
            <h4 className="text-sm font-semibold text-indigo-800 dark:text-indigo-200 flex items-center gap-2 mb-2">
              <Sparkles size={16} />
              AI-Generated Reflection
            </h4>
            <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
              {aiSummary}
            </p>
          </div>
        ) : (
          <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4">
            {selected.futureSelf}
          </p>
        )}

        {selected.warnings.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-2 mb-2">
              <AlertTriangle size={16} />
              Watch-outs
            </h4>
            <ul className="space-y-1">
              {selected.warnings.map((w, i) => (
                <li key={i} className="text-sm text-amber-700 dark:text-amber-300">• {w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Course corrections */}
      {corrections.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-200 mb-4 flex items-center gap-2">
            <TrendingUp size={20} />
            Course Corrections
          </h3>
          <ul className="space-y-2">
            {corrections.map((c, i) => (
              <li key={i} className="text-sm text-emerald-700 dark:text-emerald-300">• {c}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Negative side */}
      <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-rose-800 dark:text-rose-200 mb-3 flex items-center gap-2">
          <TrendingDown size={20} />
          If You Drift
        </h3>
        <p className="text-sm text-rose-700 dark:text-rose-300 leading-relaxed">
          {negative}
        </p>
      </div>

      </div>{/* end main projection content */}
      </div>{/* end flex wrapper */}

      {/* Push Myself modal — carousel of suggestions */}
      {showPush && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <Zap size={20} />
                Push Myself
              </h3>
              <button onClick={() => { setShowPush(false); setPushIdx(0); setConfirmCommit(null); }} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                <X size={20} />
              </button>
            </div>

            {pushCandidates.length === 0 ? (
              <div className="text-center py-8">
                <Lock size={32} className="mx-auto text-emerald-500 mb-3" />
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">All suggestions committed!</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">You have committed to every available push item. Keep going — your consistency will bear fruit.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                  Based on your current practice, here are suggestions ranked by impact. Commit to make them part of your daily accountability.
                </p>

                {/* Carousel navigation */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => { setPushIdx((i) => Math.max(0, i - 1)); setSelectedPushOption(null); }}
                    disabled={pushIdx <= 0}
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 flex-1 text-center">
                    {Math.min(pushIdx + 1, pushCandidates.length)} of {pushCandidates.length} suggestions
                  </span>
                  <button
                    onClick={() => { setPushIdx((i) => Math.min(pushCandidates.length - 1, i + 1)); setSelectedPushOption(null); }}
                    disabled={pushIdx >= pushCandidates.length - 1}
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                {/* Current suggestion card */}
                {(() => {
                  const c = currentPushCandidate;
                  if (!c) return null;
                  const isSelected = !!selectedPushOption;
                  return (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{c.commitIcon}</span>
                        <h4 className="font-bold text-emerald-800 dark:text-emerald-200">{c.title}</h4>
                      </div>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-2">{c.action}</p>
                      {c.options && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {c.options.map((opt) => {
                            const committed = committedKeys.includes(`${c.key}-${opt.key}`);
                            const active = selectedPushOption?.key === opt.key;
                            return (
                              <button
                                key={opt.key}
                                disabled={committed}
                                onClick={() => setSelectedPushOption(committed ? null : opt)}
                                className={`text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
                                  committed
                                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700 cursor-not-allowed"
                                    : active
                                    ? "bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 border-emerald-400 dark:border-emerald-600"
                                    : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                                }`}
                              >
                                <span className="mr-1">{opt.icon}</span>
                                {opt.label}
                                {committed && <span className="ml-1 text-[10px]">(committed)</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 italic">{c.why}</p>
                    </div>
                  );
                })()}

                {/* Commit button */}
                {props.setSettings && (
                  <button
                    onClick={() => {
                      const c = currentPushCandidate;
                      if (c) setConfirmCommit(selectedPushOption ? { ...c, optionKey: selectedPushOption.key } : c);
                    }}
                    disabled={!!currentPushCandidate?.options && !selectedPushOption}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mb-2"
                  >
                    <Lock size={14} />
                    {selectedPushOption ? `Commit to ${selectedPushOption.label}` : "Commit to This"}
                  </button>
                )}

                <button
                  onClick={() => { setShowPush(false); setPushIdx(0); setConfirmCommit(null); }}
                  className="w-full py-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                >
                  Just browsing for now
                </button>

                {/* Committed items summary */}
                {committedKeys.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-1">
                      <Lock size={12} /> Your commitments ({committedKeys.length})
                    </p>
                    <ul className="space-y-1">
                      {props.settings.scheduleItems.filter((si) => si.committed).map((si) => (
                        <li key={si.key} className="text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                          <span>{si.icon}</span> {si.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Commit confirmation dialog */}
      {confirmCommit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-sm w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <Lock size={20} className="text-amber-700 dark:text-amber-300" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Are you sure?</h3>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1 flex items-center gap-2">
                <span>{confirmCommit.commitIcon}</span>
                {(() => {
                  const c = confirmCommit;
                  if (c.options && c.optionKey) {
                    const opt = c.options.find((o) => o.key === c.optionKey);
                    return opt ? `Protect ${opt.label}` : c.commitLabel;
                  }
                  return c.commitLabel;
                })()}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                This will be added to your daily schedule as a <strong>locked commitment</strong>. It will count toward your daily score and cannot be removed for the duration of the course.
              </p>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
              A devotee&apos;s word is their bond. Once committed, this item appears on every daily checklist and missing it lowers your score. This is meant to strengthen your resolve, not punish you — but take it seriously.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmCommit(null)}
                className="flex-1 py-2.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  const c = confirmCommit;
                  const selected = c.options && c.optionKey ? c.options.find((o) => o.key === c.optionKey) : null;
                  const commitKey = selected ? `${c.key}-${selected.key}` : c.key;
                  const commitLabel = selected ? `Protect ${selected.label}` : c.commitLabel;
                  props.setSettings!((prev) => {
                    const newCommitments = [...(prev.commitments || []), commitKey];
                    let newItems = prev.scheduleItems.filter((i) => i.key !== commitKey && i.key !== c.key);
                    newItems = [...newItems, { key: commitKey, label: commitLabel, icon: selected ? selected.icon : c.commitIcon, committed: true }];
                    let newSettings = { ...prev, commitments: newCommitments, scheduleItems: newItems };
                    if (c.settingsKey === "minimumDailyStudyHours" && c.settingsValue) {
                      newSettings = { ...newSettings, minimumDailyStudyHours: Math.round((prev.minimumDailyStudyHours + c.settingsValue) * 100) / 100 };
                    }
                    return newSettings;
                  });
                  setConfirmCommit(null);
                  setSelectedPushOption(null);
                  // Adjust pushIdx if we're past the end after removing this item
                  setPushIdx((i) => Math.min(i, Math.max(0, pushCandidates.length - 2)));
                }}
                className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                <Lock size={14} />
                I Commit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Summary modal (placeholder for longer outputs) */}
      {showTuners && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Details</h3>
              <button onClick={() => setShowTuners(false)} className="text-zinc-500 hover:text-zinc-700">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Use the Simulation Mode panel above to explore changes.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, tooltip }: { icon: React.ReactNode; label: string; value: string; tooltip?: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
        {icon}
        {tooltip && tooltip in definitions && (
          <Tooltip content={definitions[tooltip]} />
        )}
      </div>
      <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}

function ProjectionStat({ label, value, tooltipKey }: { label: string; value: string; tooltipKey?: string }) {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3">
      <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
        {label}
        {tooltipKey && tooltipKey in definitions && (
          <Tooltip content={definitions[tooltipKey]} />
        )}
      </p>
      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}

function Tooltip({ content }: { content: { term: string; definition: string; reference: string } }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block">
      <Info
        size={14}
        className="text-amber-500 cursor-help"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-zinc-900 text-zinc-100 text-xs rounded-lg shadow-xl z-50 block">
          <strong className="block mb-1 text-amber-300">{content.term}</strong>
          {content.definition}
          <span className="block mt-1 text-zinc-400 italic">{content.reference}</span>
        </span>
      )}
    </span>
  );
}

function TunerSlider({ label, min, max, step, value, onChange, tooltipKey }: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  tooltipKey?: string;
}) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
        {label}
        {tooltipKey && tooltipKey in definitions && (
          <Tooltip content={definitions[tooltipKey]} />
        )}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber-600"
      />
      <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-1">
        <span>{min}</span>
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{step < 1 ? value.toFixed(1) : Math.round(value)}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
