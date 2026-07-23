"use client";

import { ScheduleDay, scheduleItems as defaultScheduleItems, JapaEntry, SadhanaStandards, Course, StandardsChangeEntry, Settings, Guna, calcScore, TutorSession } from "@/lib/data";
import { vaisnavaEvents, isKartikaDate } from "@/lib/vaisnava-calendar";
import { format, subDays, differenceInDays, parseISO, startOfWeek, eachDayOfInterval, endOfWeek } from "date-fns";
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
  tutorSessions?: TutorSession[];
  setTutorSessions?: (value: TutorSession[] | ((prev: TutorSession[]) => TutorSession[])) => void;
}

const customItemLabels: Record<string, string> = {
  "sadhu-sanga": "Sadhu-sanga",
  "extra-rounds": "Extra rounds",
  "seva": "Seva",
  "letter-writing": "Letter writing",
  "scripture-study": "Extra scripture study",
  "fasting": "Fasting",
  "guest-hospitality": "Guest hospitality",
  "home-pooja": "At-home pooja",
  "attending-harinama": "Attending Harinama",
  "attending-festival": "Attending festival",
  "reading-about-deity": "Read about the person/deity",
};

function getDayEvents(date: string) {
  return vaisnavaEvents.filter((e) => e.date === date);
}

// Names of events where extra rounds of japa are especially encouraged
const extraRoundsEvents = [
  "gaura purnima",
  "janmashtami",
  "nityananda trayodashi",
  "radhastami",
  "prabhupada",
  "bhaktisiddhanta",
  "vyasa puja",
];

function isExtraRoundsDay(dayEvents: { name: string; type: string }[]): boolean {
  // Extra rounds on Ekadashi, appearance/disappearance days, and major festivals
  if (dayEvents.some((e) => e.type === "ekadashi")) return true;
  if (dayEvents.some((e) => e.type === "appearance" || e.type === "disappearance")) return true;
  if (dayEvents.some((e) => extraRoundsEvents.some((k) => e.name.toLowerCase().includes(k)))) return true;
  return false;
}

function getAutoCustomItems(date: string, settings: Settings): Record<string, boolean> {
  const items: Record<string, boolean> = {};
  const dayEvents = getDayEvents(date);

  const isEkadashi = dayEvents.some((e) => e.type === "ekadashi");
  const isFestival = dayEvents.some((e) => e.type !== "ekadashi");
  const isAppearanceDisappearance = dayEvents.some((e) => e.type === "appearance" || e.type === "disappearance");

  if (isEkadashi && settings.ekadashiFastingRequired !== false) {
    items["fasting"] = false;
  }
  if (isFestival) {
    items["attending-festival"] = false;
  }
  if (isAppearanceDisappearance) {
    items["reading-about-deity"] = false;
  }
  // Extra rounds encouraged on sacred days and throughout Kārtika month
  if (isExtraRoundsDay(dayEvents) || isKartikaDate(date)) {
    items["extra-rounds"] = false;
  }

  return items;
}

const motivationalQuotes = [
  "\"He who is regulated in his habits of eating, sleeping, recreation and work can mitigate all material pains by practicing the yoga system.\" \u2014 BG 6.17",
  "\"From wherever the mind wanders due to its flickering nature, one must certainly withdraw it and bring it back under the control of the Self.\" \u2014 BG 6.26",
  "\"By practice of the stages of yoga one may gradually become free from material attachment.\" \u2014 SB 3.27.8 (purport)",
  "\"One is understood to be in full knowledge whose every endeavor is devoid of desire for sense gratification. He is said by sages to be a worker for whom the reactions of work have been burned up by the fire of perfect knowledge.\" \u2014 BG 4.19",
  "\"A person who has given up all desires for sense gratification, who lives free from desires, who has given up all sense of proprietorship and is devoid of false ego\u2014he alone can attain real peace.\" \u2014 BG 2.71",
  "\"Even a man of knowledge acts according to his own nature, for everyone follows the nature he has acquired from the three modes. What can repression accomplish?\" \u2014 BG 3.33",
  "\"In this endeavor there is no loss or diminution, and a little advancement on this path can protect one from the most dangerous type of fear.\" \u2014 BG 2.40",
];

export function ScheduleTab({ scheduleLog, setScheduleLog, japaLog, setJapaLog, sadhanaStandards, course, setCourses, settings, setSettings, tutorSessions, setTutorSessions }: Props) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [viewDate, setViewDate] = useState(today);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const activeScheduleItems = settings.scheduleItems?.length ? settings.scheduleItems : defaultScheduleItems;

  const todayEntry = scheduleLog.find((e) => e.date === viewDate);
  const viewDay = new Date(viewDate + "T12:00").getDay();
  const isSunday = viewDay === 0;
  const isSaturday = viewDay === 6;
  const isWeekend = isSaturday || isSunday;
  const allEntryScheduleItems = todayEntry?.scheduleItemsSnapshot?.length ? todayEntry.scheduleItemsSnapshot : activeScheduleItems;
  const entryScheduleItems = allEntryScheduleItems.filter((item) => {
    if (item.sundayOnly && !isSunday) return false;
    if ((item.weekdayOnly || item.key === "work") && isWeekend) return false;
    return true;
  });

  const goToDay = (offset: number) => {
    const current = new Date(viewDate + "T12:00");
    const next = new Date(current.getTime() + offset * 86400000);
    const nextStr = format(next, "yyyy-MM-dd");
    setViewDate(nextStr);
  };

  const isFutureDate = viewDate > today;

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
      showerTilak: false,
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
      customItems: { ...getAutoCustomItems(viewDate, settings) },
      scheduleItemsSnapshot: activeScheduleItems,
      habitTracking: {},
    };
    newDay.score = calcScore(newDay, entryScheduleItems, course?.sadhanaStandards?.obeisancesTarget);
    setScheduleLog((prev) => [newDay, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
  };

  // Ensure one-off event trackers are present on existing days when viewing them
  useEffect(() => {
    if (!todayEntry) return;
    const autoItems = getAutoCustomItems(viewDate, settings);
    const missingKeys = Object.keys(autoItems).filter((key) => todayEntry.customItems?.[key] === undefined);
    if (missingKeys.length === 0) return;

    setScheduleLog((prev) =>
      prev.map((entry) => {
        if (entry.date !== viewDate) return entry;
        const updatedCustomItems = { ...entry.customItems };
        for (const key of missingKeys) {
          updatedCustomItems[key] = false;
        }
        const updated = { ...entry, customItems: updatedCustomItems };
        updated.score = calcScore(updated, entryScheduleItems, course?.sadhanaStandards?.obeisancesTarget);
        return updated;
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewDate, settings.ekadashiFastingRequired]);

  const aratiKeys = ["mangalaArati", "bhogaArati", "gauraArati"];

  const toggleItem = (key: string) => {
    const newVal = todayEntry
      ? key in todayEntry
        ? !(todayEntry[key as keyof ScheduleDay] as boolean)
        : !(todayEntry.customItems?.[key] ?? false)
      : true;

    setScheduleLog((prev) =>
      prev.map((e) => {
        if (e.date !== viewDate) return e;
        const isCustom = !(key in e);
        const updated = isCustom
          ? { ...e, customItems: { ...e.customItems, [key]: newVal } }
          : { ...e, [key]: newVal };
        updated.score = calcScore(updated, entryScheduleItems, course?.sadhanaStandards?.obeisancesTarget);
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

    // Sync 16 rounds completion to Japa tracker
    if (key === "sixteenRounds") {
      setJapaLog((prev) => {
        const existing = prev.find((j) => j.date === viewDate);
        if (existing) {
          const rounds = newVal ? Math.max(16, existing.rounds || 16) : (existing.rounds && existing.rounds >= 16 ? 0 : existing.rounds ?? 0);
          return prev.map((j) => j.date === viewDate ? { ...j, rounds } : j);
        } else {
          return [...prev, { date: viewDate, rounds: newVal ? 16 : null, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null }];
        }
      });
    }

    // Sync tutor/flashcard one-off items to Tutor log
    if ((key === "tutor-session" || key === "flashcard-session") && newVal && setTutorSessions) {
      const sessionType = key === "flashcard-session" ? "flashcards" : "tutor";
      setTutorSessions((prev) => {
        const existing = prev.find((s) => s.date === viewDate && s.sessionType === sessionType);
        if (existing) return prev;
        const newSession: TutorSession = {
          id: `tutor-${Date.now()}`,
          date: viewDate,
          topic: sessionType === "flashcards" ? "Flashcard session" : "Tutor session",
          duration: 60,
          notes: "",
          flashcardsReviewed: 0,
          flashcardsNew: 0,
          sessionType,
        };
        return [newSession, ...prev].sort((a, b) => b.date.localeCompare(a.date));
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

  // Week stats (Monday–Sunday to match curriculum weeks)
  const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const thisWeekDates = eachDayOfInterval({ start: thisWeekStart, end: thisWeekEnd }).map((d) => format(d, "yyyy-MM-dd"));
  const weekEntries = scheduleLog.filter((e) => thisWeekDates.includes(e.date));
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

    // Auto-raise obeisances target (max 3)
    if (sadhanaStandards.obeisancesTarget < 3 && allAboveMin && last14Entries.length >= 12) {
      const allMetObeisances = last14Entries.every((e) => (e.obeisances || 0) >= sadhanaStandards.obeisancesTarget);
      if (allMetObeisances) {
        const newTarget = Math.min(3, sadhanaStandards.obeisancesTarget + 1);
        if (newTarget <= baseline.obeisancesTarget) return null;
        return {
          field: "obeisancesTarget" as const,
          oldValue: sadhanaStandards.obeisancesTarget,
          newValue: newTarget,
          message: `Your positive progress streak has automatically raised the obeisances target from ${sadhanaStandards.obeisancesTarget} to ${newTarget} per day.`,
        };
      }
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
      const timeout = setTimeout(() => {
        setCourses((prev) => prev.map((c) => {
          if (c.id !== course.id) return c;
          const updated = {
            ...c.sadhanaStandards,
            [field]: newValue,
          };
          return {
            ...c,
            sadhanaStandards: {
              ...updated,
              description: `${updated.minScorePercent}% daily min, ${updated.weeklyMinDays} days/week, ${updated.obeisancesTarget} obeisance${updated.obeisancesTarget !== 1 ? "s" : ""}/day`,
            },
            standardsHistory: [...c.standardsHistory, entry],
          };
        }));
        setAutoRaisedAlert({ message, newValue: String(newValue) });
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [standardRaiseAlert, course, setCourses]);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">Daily Sādhanā</h2>
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
            onChange={(e) => {
              const val = e.target.value;
              if (val) setViewDate(val);
            }}
            className="input-field w-auto"
          />
          <button
            onClick={() => goToDay(1)}
            className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
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
          <p className="text-xs text-zinc-500">Week Avg (Mon–Sun)</p>
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
          const weekStdEntries = scheduleLog.filter((e) => thisWeekDates.includes(e.date));
          const daysAtStandard = weekStdEntries.filter((e) => e.score >= sadhanaStandards.minScorePercent).length;
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
                  <span className="text-zinc-500 dark:text-zinc-400">This week <span className="text-xs">(Mon–Sun)</span>:</span>{" "}
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
                    {customItemLabels[key] || key}
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
              <option value="home-pooja">At-home pooja</option>
              <option value="attending-harinama">Attending Harinama</option>
              <option value="tutor-session">Tutor session</option>
              <option value="flashcard-session">Flashcard session</option>
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
                {/* Obeisances counter with 1/2/3 checkmarks */}
                {(() => {
                  const target = course.sadhanaStandards?.obeisancesTarget || 1;
                  const count = Math.min(3, Math.max(0, todayEntry.obeisances || 0));
                  const met = count >= target;
                  const isStrict = course.regulativePrinciples.mode === "non-negotiable";
                  return (
                    <div
                      className={`col-span-1 sm:col-span-2 w-full flex flex-col gap-2 p-2 rounded-lg transition-colors ${
                        met
                          ? isStrict
                            ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                            : "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800"
                          : isStrict
                          ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30"
                          : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${met ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-600 dark:text-zinc-400"}`}>
                          Obeisances {target}/day target
                        </span>
                        <span className={`text-xs ${met ? "text-green-600 dark:text-green-300" : "text-zinc-400"}`}>
                          {met ? "✓ met" : `${count}/${target}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3].map((n) => (
                          <button
                            key={n}
                            onClick={() => {
                              setScheduleLog((prev) =>
                                prev.map((e) => {
                                  if (e.date !== viewDate) return e;
                                  const nextCount = e.obeisances === n ? n - 1 : n;
                                  const updated: ScheduleDay = { ...e, obeisances: Math.max(0, Math.min(3, nextCount)) };
                                  const itemsForDay = e.scheduleItemsSnapshot?.length ? e.scheduleItemsSnapshot : entryScheduleItems;
                                  updated.score = calcScore(updated, itemsForDay, course?.sadhanaStandards?.obeisancesTarget);
                                  return updated;
                                })
                              );
                            }}
                            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                              count >= n
                                ? isStrict
                                  ? "bg-green-500 text-white"
                                  : "bg-blue-500 text-white"
                                : "bg-zinc-100 dark:bg-zinc-700 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                        <span className="text-xs text-zinc-400 ml-1">click count</span>
                      </div>
                    </div>
                  );
                })()}
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
      ) : isFutureDate ? (
        /* Read-only future day preview showing upcoming events and auto-items */
        (() => {
          const futureAutoItems = getAutoCustomItems(viewDate, settings);
          const dayEvents = getDayEvents(viewDate);
          const hasContent = Object.keys(futureAutoItems).length > 0 || dayEvents.length > 0;
          return (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-indigo-200 dark:border-indigo-800/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">Preview</span>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {format(new Date(viewDate + "T12:00"), "EEEE, MMM d")}
                </h3>
              </div>
              {dayEvents.length > 0 && (
                <div className="mb-4 space-y-2">
                  {dayEvents.map((ev) => (
                    <div key={ev.id} className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50">
                      <span className="text-sm">{ev.type === "ekadashi" ? "🌙" : ev.type === "appearance" ? "⭐" : ev.type === "disappearance" ? "💐" : "🎉"}</span>
                      <div>
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">{ev.name}</p>
                        {ev.fastType && ev.fastType !== "none" && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">Fast: {ev.fastType.replace("till-", "until ")}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {Object.keys(futureAutoItems).length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-zinc-500 mb-2">Auto-added items for this day:</p>
                  {Object.keys(futureAutoItems).map((key) => (
                    <div
                      key={key}
                      className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/50"
                    >
                      <span className="text-lg">✨</span>
                      <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                        {customItemLabels[key] || key}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {!hasContent && (
                <p className="text-sm text-zinc-400 text-center py-4">No special events scheduled for this day.</p>
              )}
              <p className="text-xs text-zinc-400 mt-4 text-center">Future days are read-only. Come back on this day to track your sādhana.</p>
            </div>
          );
        })()
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
          <h3 className="text-sm font-medium text-zinc-500 mb-2">This Week (Mon–Sun)</h3>
          <div className="flex gap-2">
            {thisWeekDates.map((d) => {
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
          const weekPrincipleEntries = thisWeekDates
            .map((date) => scheduleLog.find((e) => e.date === date))
            .filter((e): e is ScheduleDay => !!e);

          const enabledPrinciples = principleKeys.filter((k) => course.regulativePrinciples.principles[k as keyof typeof course.regulativePrinciples.principles]);
          if (enabledPrinciples.length === 0 || weekPrincipleEntries.length === 0) return null;

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
                Regulative Principles — This Week ({course.regulativePrinciples.mode === "non-negotiable" ? "vow" : "tracking"})
              </h3>
              <div className="space-y-2">
                {enabledPrinciples.map((key) => {
                  const daysKept = weekPrincipleEntries.filter((e) => e[key as keyof ScheduleDay]).length;
                  const pct = Math.round((daysKept / weekPrincipleEntries.length) * 100);
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400 w-28">{labels[key]}</span>
                      <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            course.regulativePrinciples.mode === "non-negotiable" && daysKept < weekPrincipleEntries.length
                              ? "bg-red-500"
                              : course.regulativePrinciples.mode === "non-negotiable"
                              ? "bg-green-500"
                              : "bg-blue-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-500 w-10 text-right">{daysKept}/{weekPrincipleEntries.length}</span>
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
