"use client";

import { ScheduleDay, scheduleItems as defaultScheduleItems, JapaEntry, SadhanaStandards, Course, StandardsChangeEntry, Settings, Guna } from "@/lib/data";
import { format, subDays, differenceInDays, parseISO } from "date-fns";
import { useState, useMemo, useEffect } from "react";
import { Plus, Trophy, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

interface Props {
  scheduleLog: ScheduleDay[];
  setScheduleLog: (value: ScheduleDay[] | ((prev: ScheduleDay[]) => ScheduleDay[])) => void;
  japaLog: JapaEntry[];
  setJapaLog: (value: JapaEntry[] | ((prev: JapaEntry[]) => JapaEntry[])) => void;
  sadhanaStandards?: SadhanaStandards;
  course?: Course;
  setCourses?: (value: Course[] | ((prev: Course[]) => Course[])) => void;
  settings: Settings;
  setSettings: (value: Settings | ((prev: Settings) => Settings)) => void;
}

function calcScore(entry: ScheduleDay, items: readonly { key: string }[]): number {
  if (items.length === 0) return 0;
  const completed = items.filter((item) => {
    if (item.key in entry) {
      return entry[item.key as keyof ScheduleDay] as boolean;
    }
    return entry.customItems?.[item.key] ?? false;
  }).length;
  return Math.round((completed / items.length) * 100);
}

const motivationalQuotes = [
  "\"You have a right to perform your prescribed duty, but you are not entitled to the fruits of action.\" — BG 2.47",
  "\"From wherever the mind wanders due to its flickering nature, one must withdraw it and bring it back under the control of the Self.\" — BG 6.26",
  "\"He who is regulated in his habits of eating, sleeping, recreation and work can mitigate all material pains by practicing the yoga system.\" — BG 6.17",
  "\"Whatever action a great man performs, common men follow. And whatever standards he sets by exemplary acts, all the world pursues.\" — BG 3.21",
  "\"Work done as a sacrifice for Viṣṇu has to be performed, otherwise work causes bondage in this material world.\" — BG 3.9",
  "\"The self-realized souls can impart knowledge unto you because they have seen the truth.\" — BG 4.34",
  "\"A faithful man who is dedicated to transcendental knowledge and who subdues his senses quickly attains the supreme spiritual peace.\" — BG 4.39",
];

export function ScheduleTab({ scheduleLog, setScheduleLog, japaLog, setJapaLog, sadhanaStandards, course, setCourses, settings, setSettings }: Props) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [viewDate, setViewDate] = useState(today);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const activeScheduleItems = settings.scheduleItems?.length ? settings.scheduleItems : defaultScheduleItems;

  const todayEntry = scheduleLog.find((e) => e.date === viewDate);
  const entryScheduleItems = todayEntry?.scheduleItemsSnapshot?.length ? todayEntry.scheduleItemsSnapshot : activeScheduleItems;

  const goToDay = (offset: number) => {
    const current = new Date(viewDate + "T12:00");
    const next = new Date(current.getTime() + offset * 86400000);
    const nextStr = format(next, "yyyy-MM-dd");
    if (nextStr > today) return;
    setViewDate(nextStr);
  };

  const onTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    setTouchStart(clientX);
  };

  const onTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (touchStart === null) return;
    const clientX = "changedTouches" in e ? e.changedTouches[0].clientX : e.clientX;
    const diff = touchStart - clientX;
    if (Math.abs(diff) > 40) {
      goToDay(diff > 0 ? 1 : -1);
    }
    setTouchStart(null);
  };

  const createDay = () => {
    if (scheduleLog.find((e) => e.date === viewDate)) return;
    const newDay: ScheduleDay = {
      date: viewDate,
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
      customItems: {},
      scheduleItemsSnapshot: activeScheduleItems,
      habitTracking: {},
    };
    setScheduleLog((prev) => [newDay, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
  };

  const aratiKeys = ["mangalaArati", "bhogaArati", "gauraArati"];

  const toggleItem = (key: string) => {
    const newVal = todayEntry ? !todayEntry[key as keyof ScheduleDay] : true;

    setScheduleLog((prev) =>
      prev.map((e) => {
        if (e.date !== viewDate) return e;
        const isCustom = !(key in e);
        const updated = isCustom
          ? { ...e, customItems: { ...e.customItems, [key]: newVal } }
          : { ...e, [key]: newVal };
        const itemsForDay = e.scheduleItemsSnapshot?.length ? e.scheduleItemsSnapshot : entryScheduleItems;
        updated.score = calcScore(updated, itemsForDay);
        return updated;
      })
    );

    // Sync āratī to Japa tracker
    if (aratiKeys.includes(key)) {
      setJapaLog((prev) => {
        const existing = prev.find((j) => j.date === viewDate);
        if (existing) {
          return prev.map((j) => j.date === viewDate ? { ...j, [key]: newVal } : j);
        } else {
          return [...prev, { date: viewDate, rounds: null, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null, [key]: newVal }];
        }
      });
    }
  };

  const updateNotes = (notes: string) => {
    setScheduleLog((prev) =>
      prev.map((e) => (e.date === viewDate ? { ...e, notes } : e))
    );
  };

  const setHabitResult = (habitId: string, result: "positive" | "negative") => {
    setScheduleLog((prev) =>
      prev.map((e) => {
        if (e.date !== viewDate) return e;
        const current = e.habitTracking?.[habitId];
        const next = current === result ? null : result;
        return {
          ...e,
          habitTracking: { ...e.habitTracking, [habitId]: next },
        };
      })
    );
  };

  // Week stats
  const last7 = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), "yyyy-MM-dd"));
  const weekEntries = scheduleLog.filter((e) => last7.includes(e.date));
  const avgScore = weekEntries.length > 0
    ? Math.round(weekEntries.reduce((sum, e) => sum + e.score, 0) / weekEntries.length)
    : 0;

  // Streak: consecutive days with score >= 70
  const streak = (() => {
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const dateStr = format(subDays(new Date(), i), "yyyy-MM-dd");
      const entry = scheduleLog.find((e) => e.date === dateStr);
      if (entry && entry.score >= 70) {
        count++;
      } else {
        break;
      }
    }
    return count;
  })();

  const dailyQuote = motivationalQuotes[new Date().getDay() % motivationalQuotes.length];

  // Auto-raise standards when positive progress streak is detected
  const [autoRaisedAlert, setAutoRaisedAlert] = useState<{ message: string; newValue: string } | null>(null);

  const standardRaiseAlert = useMemo(() => {
    if (!sadhanaStandards || !course || !setCourses) return null;
    const baseline = course.originalBaseline || sadhanaStandards;
    const history = course.standardsHistory || [];
    const lastRaise = history.length > 0
      ? parseISO(history[history.length - 1].date.split(" ")[0])
      : null;
    // Wait at least 14 days from last raise before auto-raising again
    if (lastRaise && differenceInDays(new Date(), lastRaise) < 14) return null;

    // Check last 14 consecutive days of score data
    const last14Dates = Array.from({ length: 14 }, (_, i) => format(subDays(new Date(), i), "yyyy-MM-dd"));
    const last14Entries = last14Dates
      .map((date) => scheduleLog.find((e) => e.date === date))
      .filter((e): e is ScheduleDay => !!e);

    // Need at least 10 entries in the last 14 days to consider progress reliable
    if (last14Entries.length < 10) return null;

    const allAboveMin = last14Entries.every((e) => e.score >= sadhanaStandards.minScorePercent);
    const allAbove90 = last14Entries.every((e) => e.score >= 90);
    const allAbove80 = last14Entries.every((e) => e.score >= 80);

    if (!allAboveMin) return null;

    // Auto-raise minimum score
    if (sadhanaStandards.minScorePercent < 95 && (allAbove90 || (allAbove80 && last14Entries.every((e) => e.score >= sadhanaStandards.minScorePercent + 20)))) {
      const newScore = Math.min(95, sadhanaStandards.minScorePercent + 5);
      if (newScore <= baseline.minScorePercent) return null;
      return {
        field: "minScorePercent" as const,
        oldValue: sadhanaStandards.minScorePercent,
        newValue: newScore,
        message: `Your positive progress streak has automatically raised the minimum score from ${sadhanaStandards.minScorePercent}% to ${newScore}%. Keep up the strong sādhana!`,
      };
    }

    // Auto-raise weekly minimum days
    if (sadhanaStandards.weeklyMinDays < 7 && allAboveMin && last14Entries.length >= 12) {
      const newDays = Math.min(7, sadhanaStandards.weeklyMinDays + 1);
      if (newDays <= baseline.weeklyMinDays) return null;
      return {
        field: "weeklyMinDays" as const,
        oldValue: sadhanaStandards.weeklyMinDays,
        newValue: newDays,
        message: `Your positive progress streak has automatically raised weekly minimum days from ${sadhanaStandards.weeklyMinDays} to ${newDays}.`,
      };
    }

    return null;
  }, [sadhanaStandards, course, setCourses, scheduleLog]);

  useEffect(() => {
    if (standardRaiseAlert && course && setCourses) {
      const { field, oldValue, newValue, message } = standardRaiseAlert;
      const entry: StandardsChangeEntry = {
        date: format(new Date(), "yyyy-MM-dd HH:mm"),
        field,
        oldValue,
        newValue,
        direction: "up",
      };
      setCourses((prev) => prev.map((c) => {
        if (c.id !== course.id) return c;
        return {
          ...c,
          sadhanaStandards: {
            ...c.sadhanaStandards,
            [field]: newValue,
            description: `${field === "minScorePercent" ? newValue : c.sadhanaStandards.minScorePercent}% daily min, ${field === "weeklyMinDays" ? newValue : c.sadhanaStandards.weeklyMinDays} days/week`,
          },
          standardsHistory: [...c.standardsHistory, entry],
        };
      }));
      setAutoRaisedAlert({ message, newValue: String(newValue) });
    }
  }, [standardRaiseAlert, course, setCourses]);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">Daily Schedule</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToDay(-1)}
            className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
            aria-label="Previous day"
            title="Previous day"
          >
            ←
          </button>
          <input
            type="date"
            value={viewDate}
            max={today}
            onChange={(e) => {
              const val = e.target.value;
              if (val && val <= today) setViewDate(val);
            }}
            className="input-field w-auto"
          />
          <button
            onClick={() => goToDay(1)}
            disabled={viewDate === today}
            className={`p-2 rounded-lg ${viewDate === today ? "opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800 text-zinc-400" : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300"}`}
            aria-label="Next day"
            title="Next day"
          >
            →
          </button>
        </div>
      </div>

      {/* Auto-raised Standard Alert */}
      {autoRaisedAlert && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-300 dark:border-green-700">
          <div className="flex items-start gap-3">
            <TrendingUp size={20} className="text-green-600 dark:text-green-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">Standard Auto-Raised</p>
              <p className="text-sm text-green-700 dark:text-green-300">{autoRaisedAlert.message}</p>
            </div>
            <button
              onClick={() => setAutoRaisedAlert(null)}
              className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Motivation */}
      <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl border border-amber-200 dark:border-amber-800/50">
        <p className="text-sm italic text-amber-800 dark:text-amber-200">{dailyQuote}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-4 text-center">
          <Trophy size={20} className="mx-auto mb-1 text-amber-500" />
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{streak}</p>
          <p className="text-xs text-zinc-500">Day Streak (70%+)</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-4 text-center">
          <TrendingUp size={20} className="mx-auto mb-1 text-green-500" />
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{avgScore}%</p>
          <p className="text-xs text-zinc-500">7-Day Average</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-4 text-center">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {todayEntry ? `${todayEntry.score}%` : "—"}
          </p>
          <p className="text-xs text-zinc-500">Today&apos;s Score</p>
        </div>
      </div>

      {/* Sādhana Standards Accountability */}
      {sadhanaStandards && (
        (() => {
          const last7Dates = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), "yyyy-MM-dd"));
          const last7Entries = scheduleLog.filter((e) => last7Dates.includes(e.date));
          const daysAtStandard = last7Entries.filter((e) => e.score >= sadhanaStandards.minScorePercent).length;
          const meetsWeeklyGoal = daysAtStandard >= sadhanaStandards.weeklyMinDays;

          // Check required items for today
          const todayReqEntry = scheduleLog.find((e) => e.date === today);
          const missedRequired = sadhanaStandards.requiredItems.filter(
            (key) => todayReqEntry && !(todayReqEntry[key as keyof ScheduleDay] as boolean)
          );

          return (
            <div className={`mb-6 p-4 rounded-xl border ${
              meetsWeeklyGoal
                ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                : "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {meetsWeeklyGoal
                  ? <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                  : <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
                }
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Course Standard: {sadhanaStandards.description}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">This week:</span>{" "}
                  <span className={`font-bold ${daysAtStandard >= sadhanaStandards.weeklyMinDays ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                    {daysAtStandard}/{sadhanaStandards.weeklyMinDays} days
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-500"> at {sadhanaStandards.minScorePercent}%+</span>
                </div>
                <div>
                  {missedRequired.length > 0 && todayReqEntry ? (
                    <span className="text-red-600 dark:text-red-400 text-xs">
                      ⚠ Missing today: {missedRequired.map(k => entryScheduleItems.find(s => s.key === k)?.label || k).join(", ")}
                    </span>
                  ) : todayReqEntry ? (
                    <span className="text-green-600 dark:text-green-400 text-xs">✓ All required items done today</span>
                  ) : (
                    <span className="text-zinc-400 text-xs">No entry for today yet</span>
                  )}
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* Checklist */}
      {todayEntry ? (
        <div
          className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-6 select-none"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onMouseDown={onTouchStart}
          onMouseUp={onTouchEnd}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              {viewDate === today ? "Today's Checklist" : format(new Date(viewDate + "T12:00"), "EEEE, MMM d")}
            </h3>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
              todayEntry.score >= 90 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
              todayEntry.score >= 70 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            }`}>
              {todayEntry.score}%
            </span>
          </div>
          <div className="space-y-1">
            {entryScheduleItems.map((item) => {
              const japaEntry = japaLog.find((j) => j.date === viewDate);
              const isArati = aratiKeys.includes(item.key);
              const rawValue = (todayEntry[item.key as keyof ScheduleDay] as boolean) ?? (todayEntry.customItems?.[item.key] ?? false);
              // For āratī items, also reflect japa tracker state
              const checked = isArati && japaEntry
                ? (japaEntry[item.key as keyof JapaEntry] as boolean) || rawValue
                : rawValue;
              return (
                <button
                  key={item.key}
                  onClick={() => toggleItem(item.key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    checked
                      ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                      : "bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className={`text-sm font-medium flex-1 ${checked ? "text-green-800 dark:text-green-200 line-through" : "text-zinc-700 dark:text-zinc-300"}`}>
                    {item.label}
                    {item.linkedToJapa && <span className="ml-1 text-xs text-indigo-400">(syncs to Japa)</span>}
                  </span>
                  <span className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    checked ? "bg-green-500 border-green-500 text-white" : "border-zinc-300 dark:border-zinc-600"
                  }`}>
                    {checked && "✓"}
                  </span>
                </button>
              );
            })}
            {/* One-off custom items added to this day */}
            {Object.entries(todayEntry.customItems || {})
              .filter(([key]) => !entryScheduleItems.some((s) => s.key === key))
              .map(([key, checked]) => (
                <button
                  key={key}
                  onClick={() => toggleItem(key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    checked
                      ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                      : "bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="text-lg">✨</span>
                  <span className={`text-sm font-medium flex-1 ${checked ? "text-green-800 dark:text-green-200 line-through" : "text-zinc-700 dark:text-zinc-300"}`}>
                    {key}
                  </span>
                  <span className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    checked ? "bg-green-500 border-green-500 text-white" : "border-zinc-300 dark:border-zinc-600"
                  }`}>
                    {checked && "✓"}
                  </span>
                </button>
              ))}
          </div>

          {/* Add one-off tracking item */}
          <div className="mt-3 flex gap-2">
            <select
              value=""
              onChange={(e) => {
                const key = e.target.value;
                if (!key) return;
                if (entryScheduleItems.some((s) => s.key === key) || todayEntry.customItems?.[key] !== undefined) return;
                setScheduleLog((prev) =>
                  prev.map((entry) => {
                    if (entry.date !== viewDate) return entry;
                    return {
                      ...entry,
                      customItems: { ...entry.customItems, [key]: false },
                    };
                  })
                );
                e.target.value = "";
              }}
              className="input-field text-sm flex-1"
            >
              <option value="">+ Add one-off tracker...</option>
              <option value="sadhu-sanga">Sadhu-sanga</option>
              <option value="extra-rounds">Extra rounds</option>
              <option value="seva">Seva</option>
              <option value="letter-writing">Letter writing</option>
              <option value="scripture-study">Extra scripture study</option>
              <option value="fasting">Fasting</option>
              <option value="guest-hospitality">Guest hospitality</option>
            </select>
            <input
              type="text"
              value=""
              onChange={(e) => {
                const key = e.target.value.trim();
                if (key && !entryScheduleItems.some((s) => s.key === key) && todayEntry.customItems?.[key] === undefined) {
                  setScheduleLog((prev) =>
                    prev.map((entry) => {
                      if (entry.date !== viewDate) return entry;
                      return {
                        ...entry,
                        customItems: { ...entry.customItems, [key]: false },
                      };
                    })
                  );
                }
                e.target.value = "";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const key = (e.target as HTMLInputElement).value.trim();
                  if (key && !entryScheduleItems.some((s) => s.key === key) && todayEntry.customItems?.[key] === undefined) {
                    setScheduleLog((prev) =>
                      prev.map((entry) => {
                        if (entry.date !== viewDate) return entry;
                        return {
                          ...entry,
                          customItems: { ...entry.customItems, [key]: false },
                        };
                      })
                    );
                  }
                  (e.target as HTMLInputElement).value = "";
                }
              }}
              className="input-field text-sm flex-1"
              placeholder="Or type custom tracker + Enter"
            />
          </div>
          {/* Regulative Principles (only when configured per course) */}
          {course && (
            <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Regulative Principles — {course.regulativePrinciples.mode === "non-negotiable" ? "Vow" : "Tracking"}
                </p>
                {course.regulativePrinciples.initiated && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">Initiated</span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {([
                  ["noMeatEating", "No meat / sattvic diet"],
                  ["noIntoxication", "No intoxication"],
                  ["noGambling", "No gambling / speculation / time-wasting"],
                  ["noIllicitSex", "No illicit sex"],
                  ["sixteenRounds", "16 rounds completed"],
                ] as [keyof ScheduleDay, string][]).filter(([key]) => course.regulativePrinciples.principles[key as keyof typeof course.regulativePrinciples.principles]).map(([key, label]) => {
                  const checked = todayEntry[key as keyof ScheduleDay] as boolean;
                  const isStrict = course.regulativePrinciples.mode === "non-negotiable";
                  return (
                    <button
                      key={key}
                      onClick={() => toggleItem(key)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                        checked
                          ? isStrict
                            ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                            : "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800"
                          : isStrict
                          ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30"
                          : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                      }`}
                    >
                      <span className={`text-xs font-medium flex-1 ${checked ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-600 dark:text-zinc-400"}`}>
                        {label}
                      </span>
                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center text-xs ${
                        checked
                          ? isStrict ? "bg-green-500 border-green-500 text-white" : "bg-blue-500 border-blue-500 text-white"
                          : "border-zinc-300 dark:border-zinc-600"
                      }`}>
                        {checked && "✓"}
                      </span>
                    </button>
                  );
                })}
              </div>
              {course.regulativePrinciples.mode === "tracking" && (
                <p className="text-xs text-zinc-400 mt-2">
                  Tracking mode: these are goals you are working toward. Daily adherence is recorded without judgment.
                </p>
              )}
            </div>
          )}

          {/* Guna-based Habit Tracker (Anartha-nivṛtti / Sādhana) */}
          {settings.habits && settings.habits.some((h) => h.tracked) && (
            <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Anartha & Sādhana Tracker (Gunas)
                </p>
                <p className="text-xs text-zinc-400">Choose which to track in Settings</p>
              </div>
              <div className="space-y-2">
                {(["goodness", "passion", "ignorance"] as Guna[]).map((guna) => {
                  const gunaHabits = settings.habits.filter((h) => h.tracked && h.guna === guna);
                  if (gunaHabits.length === 0) return null;
                  const gunaLabel = guna === "goodness" ? "Sattva — Mode of Goodness" : guna === "passion" ? "Rajas — Mode of Passion" : "Tamas — Mode of Ignorance";
                  const gunaColor = guna === "goodness" ? "text-emerald-600 dark:text-emerald-400" : guna === "passion" ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400";
                  return (
                    <div key={guna}>
                      <p className={`text-xs font-semibold mb-1 ${gunaColor}`}>{gunaLabel}</p>
                      <div className="space-y-1">
                        {gunaHabits.map((habit) => {
                          const result = todayEntry.habitTracking?.[habit.id] ?? null;
                          const isPositive = result === "positive";
                          const isNegative = result === "negative";
                          const positiveLabel = habit.mode === "avoid" ? "Avoided" : "Did it";
                          const negativeLabel = habit.mode === "avoid" ? "Did it" : "Missed";
                          return (
                            <div key={habit.id} className="flex items-center gap-2 text-xs">
                              <span className="flex-1 text-zinc-700 dark:text-zinc-300 truncate" title={habit.label}>
                                {habit.label}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setHabitResult(habit.id, "positive")}
                                  className={`px-2 py-1 rounded ${isPositive ? "bg-green-500 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-green-100 dark:hover:bg-green-900/30"}`}
                                  title={positiveLabel}
                                >
                                  {positiveLabel}
                                </button>
                                <button
                                  onClick={() => setHabitResult(habit.id, "negative")}
                                  className={`px-2 py-1 rounded ${isNegative ? "bg-red-500 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-red-100 dark:hover:bg-red-900/30"}`}
                                  title={negativeLabel}
                                >
                                  {negativeLabel}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-4">
            <textarea
              value={todayEntry.notes}
              onChange={(e) => updateNotes(e.target.value)}
              className="input-field min-h-[60px] resize-y"
              placeholder="Notes — what went well, what to improve, wake-up late plan..."
            />
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-8 text-center">
          <p className="text-zinc-500 mb-3">No entry for this date yet.</p>
          <button
            onClick={createDay}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Start Tracking {viewDate === today ? "Today" : "This Day"}
          </button>
        </div>
      )}

      {/* Recent history */}
      {weekEntries.length > 1 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-zinc-500 mb-2">Recent Days</h3>
          <div className="flex gap-2">
            {last7.map((d) => {
              const entry = scheduleLog.find((e) => e.date === d);
              const score = entry?.score ?? -1;
              return (
                <button
                  key={d}
                  onClick={() => setViewDate(d)}
                  className={`flex-1 rounded-lg p-2 text-center text-xs border transition-colors ${
                    d === viewDate ? "ring-2 ring-amber-500" : ""
                  } ${
                    score >= 90 ? "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-800" :
                    score >= 70 ? "bg-amber-100 border-amber-300 dark:bg-amber-900/30 dark:border-amber-800" :
                    score >= 0 ? "bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-800" :
                    "bg-zinc-100 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700"
                  }`}
                >
                  <div className="font-medium">{format(new Date(d + "T12:00"), "EEE")}</div>
                  <div className="font-bold">{score >= 0 ? `${score}%` : "—"}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sādhana Heatmap */}
      {(() => {
        // Build 12-week (84-day) grid ending today, arranged Mon→Sun columns
        const totalWeeks = 12;
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // days since last Monday
        const gridEnd = now;
        const gridStart = subDays(gridEnd, totalWeeks * 7 - 1 + mondayOffset);

        // Build array of weeks (each week = 7 days starting Monday)
        const weeks: string[][] = [];
        let cursor = gridStart;
        for (let w = 0; w < totalWeeks; w++) {
          const week: string[] = [];
          for (let d = 0; d < 7; d++) {
            week.push(format(cursor, "yyyy-MM-dd"));
            cursor = new Date(cursor.getTime() + 86400000);
          }
          weeks.push(week);
        }

        const gridStartStr = format(gridStart, "yyyy-MM-dd");
        const gridEndStr = format(gridEnd, "yyyy-MM-dd");
        const logged = scheduleLog.filter((e) => e.score > 0 && e.date >= gridStartStr && e.date <= gridEndStr);
        if (logged.length === 0) return null;

        const avg = Math.round(logged.reduce((a, e) => a + e.score, 0) / logged.length);
        const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

        return (
          <div className="mt-6 bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">Sādhana Heatmap</h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-zinc-500">{logged.length} days tracked</span>
                <span className="text-zinc-500">Avg: <span className="font-bold text-zinc-700 dark:text-zinc-200">{avg}%</span></span>
              </div>
            </div>

            <div className="flex gap-1">
              {/* Day labels */}
              <div className="flex flex-col gap-1 mr-1">
                {dayLabels.map((lbl, i) => (
                  <span key={i} className="text-[10px] text-zinc-400 h-4 flex items-center">{lbl}</span>
                ))}
              </div>

              {/* Week columns */}
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1">
                  {week.map((dateStr) => {
                    const entry = scheduleLog.find((e) => e.date === dateStr);
                    const score = entry?.score ?? -1;
                    const isFuture = dateStr > format(now, "yyyy-MM-dd");
                    return (
                      <button
                        key={dateStr}
                        onClick={() => !isFuture && setViewDate(dateStr)}
                        title={`${format(new Date(dateStr + "T12:00"), "MMM d")}: ${score >= 0 ? score + "%" : "No data"}`}
                        className={`w-4 h-4 rounded-sm transition-all ${
                          dateStr === viewDate ? "ring-2 ring-amber-500 ring-offset-1" : ""
                        } ${
                          isFuture ? "bg-zinc-100 dark:bg-zinc-800/30" :
                          score >= 90 ? "bg-green-500 dark:bg-green-400" :
                          score >= 70 ? "bg-amber-400 dark:bg-amber-500" :
                          score >= 50 ? "bg-orange-300 dark:bg-orange-500" :
                          score >= 0 ? "bg-red-300 dark:bg-red-400" :
                          "bg-zinc-200 dark:bg-zinc-700"
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Month labels */}
            <div className="flex mt-2 ml-5 text-[10px] text-zinc-400">
              {(() => {
                const months: { label: string; offset: number }[] = [];
                let lastMonth = "";
                weeks.forEach((week, wIdx) => {
                  const m = format(new Date(week[0] + "T12:00"), "MMM");
                  if (m !== lastMonth) {
                    months.push({ label: m, offset: wIdx });
                    lastMonth = m;
                  }
                });
                return months.map((m) => (
                  <span key={m.label + m.offset} style={{ marginLeft: m.offset === 0 ? 0 : `${(m.offset - (months[months.indexOf(m) - 1]?.offset ?? 0)) * 20 - 20}px` }}>
                    {m.label}
                  </span>
                ));
              })()}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 text-xs text-zinc-500">
              <span>Less</span>
              <span className="w-3 h-3 rounded-sm bg-zinc-200 dark:bg-zinc-700" />
              <span className="w-3 h-3 rounded-sm bg-red-300 dark:bg-red-400" />
              <span className="w-3 h-3 rounded-sm bg-orange-300 dark:bg-orange-500" />
              <span className="w-3 h-3 rounded-sm bg-amber-400 dark:bg-amber-500" />
              <span className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-400" />
              <span>More</span>
            </div>
          </div>
        );
      })()}

      {/* Regulative Principles Weekly Summary */}
      {course && (
        (() => {
          const principleKeys = ["noMeatEating", "noIntoxication", "noGambling", "noIllicitSex", "sixteenRounds"] as (keyof ScheduleDay)[];
          const last7Dates = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), "yyyy-MM-dd"));
          const last7Entries = last7Dates
            .map((date) => scheduleLog.find((e) => e.date === date))
            .filter((e): e is ScheduleDay => !!e);

          const enabledPrinciples = principleKeys.filter((k) => course.regulativePrinciples.principles[k as keyof typeof course.regulativePrinciples.principles]);
          if (enabledPrinciples.length === 0 || last7Entries.length === 0) return null;

          const labels: Record<string, string> = {
            noMeatEating: "No meat / sattvic",
            noIntoxication: "No intoxication",
            noGambling: "No gambling",
            noIllicitSex: "No illicit sex",
            sixteenRounds: "16 rounds",
          };

          return (
            <div className="mt-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3">
                Regulative Principles — Last 7 Days ({course.regulativePrinciples.mode === "non-negotiable" ? "vow" : "tracking"})
              </h3>
              <div className="space-y-2">
                {enabledPrinciples.map((key) => {
                  const daysKept = last7Entries.filter((e) => e[key as keyof ScheduleDay]).length;
                  const pct = Math.round((daysKept / last7Entries.length) * 100);
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400 w-28">{labels[key]}</span>
                      <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            course.regulativePrinciples.mode === "non-negotiable" && daysKept < last7Entries.length
                              ? "bg-red-500"
                              : course.regulativePrinciples.mode === "non-negotiable"
                              ? "bg-green-500"
                              : "bg-blue-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-500 w-10 text-right">{daysKept}/{last7Entries.length}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
