/**
 * Pure computation helpers for the Initiation Readiness dashboard.
 * All functions are deterministic and take existing app data as inputs —
 * they do not touch localStorage or the DOM.
 *
 * Windowing: everything is rolling 90-day by default. Trends are the last
 * 12 weekly means (oldest → newest) so cards can render sparklines.
 */

import type {
  DiscipleLesson,
  InitiationCriterionId,
  InitiationCriterionScore,
  JapaEntry,
  ScheduleDay,
  SevaEntry,
  SpiritualMaster,
} from "@/lib/data";
import { bucketForScore, initiationCriteria } from "@/lib/data";

const MS_DAY = 24 * 60 * 60 * 1000;

function dayIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBackWindow(days: number, today = new Date()): { start: string; end: string } {
  const end = new Date(today);
  const start = new Date(today.getTime() - days * MS_DAY);
  return { start: dayIso(start), end: dayIso(end) };
}

function inRange(date: string, start: string, end: string): boolean {
  return !!date && date >= start && date <= end;
}

/**
 * Compute percentage of days in the window matching `predicate`.
 * Denominator is the window length (not just logged days) — days without
 * an entry count against the score. This matches the intent of "sustained".
 */
function windowPercent<T extends { date: string }>(
  entries: T[],
  windowDays: number,
  predicate: (e: T) => boolean,
  today = new Date()
): number {
  const { start, end } = daysBackWindow(windowDays, today);
  const set = new Set(entries.filter((e) => inRange(e.date, start, end) && predicate(e)).map((e) => e.date));
  return Math.round((set.size / windowDays) * 100);
}

/**
 * Compute weekly means over the last `weeks` weeks (oldest → newest).
 * Each week is 7 days; predicate = 1 if satisfied that day, else 0.
 */
function weeklyTrend<T extends { date: string }>(
  entries: T[],
  weeks: number,
  predicate: (e: T) => boolean,
  today = new Date()
): number[] {
  const trend: number[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const end = new Date(today.getTime() - w * 7 * MS_DAY);
    const start = new Date(end.getTime() - 7 * MS_DAY);
    const iStart = dayIso(start);
    const iEnd = dayIso(end);
    const days = new Set(entries.filter((e) => inRange(e.date, iStart, iEnd) && predicate(e)).map((e) => e.date));
    trend.push(Math.round((days.size / 7) * 100));
  }
  return trend;
}

// ---------- individual criterion computers ----------

export function scoreSixteenRounds(japaLog: JapaEntry[], today = new Date()): InitiationCriterionScore {
  const score = windowPercent(japaLog, 90, (e) => (e.rounds ?? 0) >= 16, today);
  const prior = windowPercent(japaLog, 30, (e) => (e.rounds ?? 0) >= 16, new Date(today.getTime() - 60 * MS_DAY));
  const recent = windowPercent(japaLog, 30, (e) => (e.rounds ?? 0) >= 16, today);
  const delta = recent - prior;
  return {
    criterionId: "sixteen-rounds",
    score,
    bucket: bucketForScore(score),
    evidence: `${score}% of last 90 days at 16 rounds${prior > 0 ? ` — ${delta >= 0 ? "up" : "down"} from ${prior}% two months ago` : ""}`,
    trend: weeklyTrend(japaLog, 12, (e) => (e.rounds ?? 0) >= 16, today),
  };
}

export function scoreFourRegs(scheduleLog: ScheduleDay[], today = new Date()): InitiationCriterionScore {
  const pred = (d: ScheduleDay) => d.noMeatEating && d.noIntoxication && d.noGambling && d.noIllicitSex;
  const score = windowPercent(scheduleLog, 90, pred, today);
  return {
    criterionId: "four-regs",
    score,
    bucket: bucketForScore(score),
    evidence: `${score}% of last 90 days all four regulative principles held`,
    trend: weeklyTrend(scheduleLog, 12, pred, today),
  };
}

export function scoreDailyStudy(
  scheduleLog: ScheduleDay[],
  today = new Date()
): InitiationCriterionScore {
  const pred = (d: ScheduleDay) => d.personalStudy || d.morningStudy;
  const score = windowPercent(scheduleLog, 90, pred, today);
  return {
    criterionId: "daily-study",
    score,
    bucket: bucketForScore(score),
    evidence: `${score}% of last 90 days with logged personal or morning study`,
    trend: weeklyTrend(scheduleLog, 12, pred, today),
  };
}

export function scoreMorningProgram(
  scheduleLog: ScheduleDay[],
  today = new Date()
): InitiationCriterionScore {
  const pred = (d: ScheduleDay) => (d.mangalaArati || d.wakeUp330 || !!d.showerTilak);
  const score = windowPercent(scheduleLog, 90, pred, today);
  return {
    criterionId: "morning-program",
    score,
    bucket: bucketForScore(score),
    evidence: `${score}% of last 90 days with maṅgala-ārati, 3:30 wake-up, or śower-tilak completed`,
    trend: weeklyTrend(scheduleLog, 12, pred, today),
  };
}

export function scoreSeva(sevaLog: SevaEntry[], today = new Date()): InitiationCriterionScore {
  const pred = (_e: SevaEntry) => true; // any seva entry counts
  const score = windowPercent(sevaLog, 90, pred, today);
  return {
    criterionId: "seva",
    score,
    bucket: bucketForScore(score),
    evidence: `${score}% of last 90 days with logged sevā`,
    trend: weeklyTrend(sevaLog, 12, pred, today),
  };
}

function lessonMatchesUnit(l: DiscipleLesson, pattern: RegExp): boolean {
  return pattern.test(l.title) || pattern.test(l.unitTitle);
}

export function scoreGuruTattva(lessons: DiscipleLesson[]): InitiationCriterionScore {
  const rel = lessons.filter((l) =>
    lessonMatchesUnit(l, /guru|paramparā|para?mpara|ācārya/i)
  );
  const done = rel.filter((l) => l.attended).length;
  const score = rel.length === 0 ? 0 : Math.round((done / rel.length) * 100);
  return {
    criterionId: "guru-tattva",
    score,
    bucket: bucketForScore(score),
    evidence: rel.length === 0
      ? "No guru-tattva Disciple Course lessons found yet"
      : `${done}/${rel.length} guru-tattva lessons attended`,
    trend: [],
  };
}

export function scoreDiksaVows(lessons: DiscipleLesson[]): InitiationCriterionScore {
  const rel = lessons.filter((l) =>
    lessonMatchesUnit(l, /dīkṣā|diksa|initiation|vow/i)
  );
  const done = rel.filter((l) => l.attended).length;
  const score = rel.length === 0 ? 0 : Math.round((done / rel.length) * 100);
  return {
    criterionId: "diksa-vows",
    score,
    bucket: bucketForScore(score),
    evidence: rel.length === 0
      ? "No dīkṣā / vow lessons found yet"
      : `${done}/${rel.length} dīkṣā / initiation-vow lessons attended`,
    trend: [],
  };
}

export function scoreSeniorRecommendation(sm: SpiritualMaster | undefined): InitiationCriterionScore {
  const rec = sm?.recommender;
  const hasName = !!rec?.name?.trim();
  const hasDate = !!rec?.date;
  const score = hasName && hasDate ? 100 : hasName ? 60 : 0;
  return {
    criterionId: "senior-recommendation",
    score,
    bucket: bucketForScore(score),
    evidence: hasName
      ? hasDate
        ? `${rec!.name} agreed on ${rec!.date}`
        : `${rec!.name} noted — date pending`
      : "No senior recommendation recorded yet",
    trend: [],
  };
}

export function scoreTimeFollowingPractice(
  scheduleLog: ScheduleDay[],
  today = new Date()
): InitiationCriterionScore {
  if (scheduleLog.length === 0) {
    return {
      criterionId: "time-following-practice",
      score: 0,
      bucket: "red",
      evidence: "No schedule-log entries yet",
      trend: [],
    };
  }
  const sorted = [...scheduleLog].map((e) => e.date).sort();
  const first = sorted[0];
  const firstDate = new Date(first);
  const months = Math.max(0, (today.getTime() - firstDate.getTime()) / (30 * MS_DAY));
  const targetMonths = 6;
  const score = Math.min(100, Math.round((months / targetMonths) * 100));
  return {
    criterionId: "time-following-practice",
    score,
    bucket: bucketForScore(score),
    evidence: `${months.toFixed(1)} months of steady practice logged (target: ${targetMonths} months)`,
    trend: [],
  };
}

// ---------- overall dashboard ----------

export interface ReadinessInputs {
  japaLog: JapaEntry[];
  scheduleLog: ScheduleDay[];
  sevaLog: SevaEntry[];
  discipleLessons: DiscipleLesson[];
  spiritualMaster?: SpiritualMaster;
  today?: Date;
}

export interface ReadinessResult {
  overall: number; // weighted mean 0–100
  bucket: "red" | "amber" | "lime" | "green";
  scores: InitiationCriterionScore[];
}

export function computeReadiness(inputs: ReadinessInputs): ReadinessResult {
  const today = inputs.today || new Date();
  const scores: InitiationCriterionScore[] = [
    scoreSixteenRounds(inputs.japaLog, today),
    scoreFourRegs(inputs.scheduleLog, today),
    scoreDailyStudy(inputs.scheduleLog, today),
    scoreMorningProgram(inputs.scheduleLog, today),
    scoreSeva(inputs.sevaLog, today),
    scoreGuruTattva(inputs.discipleLessons),
    scoreDiksaVows(inputs.discipleLessons),
    scoreSeniorRecommendation(inputs.spiritualMaster),
    scoreTimeFollowingPractice(inputs.scheduleLog, today),
  ];
  const weightMap = new Map(initiationCriteria.map((c) => [c.id, c.weight]));
  let num = 0;
  let denom = 0;
  for (const s of scores) {
    const w = weightMap.get(s.criterionId) ?? 1;
    num += s.score * w;
    denom += w;
  }
  const overall = denom === 0 ? 0 : Math.round(num / denom);
  return { overall, bucket: bucketForScore(overall), scores };
}

// helper for the UI: convert a criterion id to its metadata
export function criterionMeta(id: InitiationCriterionId) {
  return initiationCriteria.find((c) => c.id === id);
}
