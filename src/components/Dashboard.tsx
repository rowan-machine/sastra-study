"use client";

import { useState } from "react";
import { Settings, CurriculumWeek, DailyLogEntry, BookProgress, VerseMemory, JapaEntry, ScheduleDay, TutorSession, isTutorSession, interpolateVerseTarget, Guna, LectureNote, DevoteeContact, SpiritualMaster, getExpectedHours, getAheadBehind, getAdjustedWeeklyTarget, getEffectiveHours, parseVerseRef, verseToAbsolutePosition } from "@/lib/data";
import { getUpcomingVaisnavaEvents, fastLabels, fastDetails } from "@/lib/vaisnava-calendar";
import { differenceInDays, parseISO, format, subDays } from "date-fns";
import { BookCover } from "./BookProgressTab";
import { TrendingUp, TrendingDown, Clock, CheckCircle2, Target, Flame, Zap, Notebook, Users, Crown, Moon, Star, Heart, Sun, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  settings: Settings;
  curriculum: CurriculumWeek[];
  dailyLog: DailyLogEntry[];
  bookProgress: BookProgress[];
  verseMemory: VerseMemory[];
  japaLog: JapaEntry[];
  scheduleLog: ScheduleDay[];
  tutorSessions: TutorSession[];
  lectureNotes?: LectureNote[];
  contacts?: DevoteeContact[];
  spiritualMaster?: SpiritualMaster;
  onTabChange?: (tab: string, focusId?: string) => void;
}

function DashboardSection({ title, icon, defaultOpen = true, children }: { title: string; icon: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-4 mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between group"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          {icon}
          <h3 className="font-semibold">{title}</h3>
        </div>
        {open ? <ChevronUp size={18} className="text-zinc-500 group-hover:text-amber-600" /> : <ChevronDown size={18} className="text-zinc-500 group-hover:text-amber-600" />}
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function Dashboard({ settings, curriculum, dailyLog, bookProgress, verseMemory, japaLog, scheduleLog, tutorSessions, lectureNotes = [], contacts = [], spiritualMaster, onTabChange }: Props) {
  const today = new Date();
  const startDate = parseISO(settings.planStartDate);
  const daysSinceStart = Math.max(0, differenceInDays(today, startDate));
  const currentWeekNum = Math.min(32, Math.floor(daysSinceStart / 7) + 1);
  const currentWeek = curriculum.find((w) => w.week === currentWeekNum) || curriculum[0];

  const totalHoursLogged = dailyLog.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  const adjustedWeeklyTarget = getAdjustedWeeklyTarget(settings);
  const expectedHours = getExpectedHours(daysSinceStart, settings);
  const effectiveHours = getEffectiveHours(dailyLog, curriculum, settings, today);
  const aheadBehind = getAheadBehind(effectiveHours, expectedHours);

  const weekLogs = dailyLog.filter((entry) => {
    if (!currentWeek) return false;
    return entry.date >= currentWeek.startDate && entry.date <= currentWeek.endDate;
  });
  const hoursThisWeek = weekLogs.reduce((sum, e) => sum + (e.hours || 0), 0);

  const completedWeeks = curriculum.filter((w) => w.complete).length;
  const versesLearned = verseMemory.filter((v) => v.learned).length;
  const versesMastered = verseMemory.filter((v) => v.mastered).length;

  // Position-based on-track check: today's expected reading vs latest logged endLocation
  const latestReadingEntry = dailyLog
    .filter((e) => e.endLocation && parseVerseRef(e.endLocation))
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const actualRef = latestReadingEntry ? parseVerseRef(latestReadingEntry.endLocation) : null;
  const fractionOfWeek = Math.min(1, (daysSinceStart % 7) / 7);
  const expectedRefString = currentWeek
    ? interpolateVerseTarget(currentWeek.assignment, currentWeek.book, fractionOfWeek)
    : null;
  const expectedRef = expectedRefString ? parseVerseRef(expectedRefString) : null;
  const positionDiff =
    actualRef && expectedRef && currentWeek
      ? verseToAbsolutePosition(currentWeek.book, actualRef.chapter, actualRef.verse) -
        verseToAbsolutePosition(currentWeek.book, expectedRef.chapter, expectedRef.verse)
      : null;

  const paceLabel =
    positionDiff !== null
      ? positionDiff >= 0
        ? "🟢 On Track"
        : "🔴 Behind"
      : aheadBehind >= 0
      ? "🟢 On Track"
      : aheadBehind > -4
      ? "🟡 Slightly Behind"
      : "🔴 Behind";

  const isWeekend = today.getDay() === 0 || today.getDay() === 6;
  const dailyTarget = isWeekend ? settings.weekendTargetHours : settings.minimumDailyStudyHours;
  const suggestedDaily =
    currentWeek && hoursThisWeek < currentWeek.targetHours
      ? ((currentWeek.targetHours - hoursThisWeek) / Math.max(1, 7 - (daysSinceStart % 7))).toFixed(1)
      : dailyTarget.toFixed(1);
  const suggestedMinutes = Math.round(parseFloat(suggestedDaily) * 60);
  // Total deficit in minutes (how far behind overall)
  const deficitMinutes = aheadBehind < 0 ? Math.round(Math.abs(aheadBehind) * 60) : 0;
  // To fully catch up today: deficit + today's normal daily target
  const catchUpTodayMinutes = aheadBehind < 0 ? deficitMinutes + Math.round(dailyTarget * 60) : suggestedMinutes;

  // Calculate study streak (consecutive days with dailyStudyComplete or hours > 0)
  const streak = (() => {
    let count = 0;
    let checkDate = subDays(today, 0);
    const logDates = new Set(
      dailyLog.filter((e) => e.dailyStudyComplete || (e.hours && e.hours > 0)).map((e) => e.date)
    );
    for (let i = 0; i < 365; i++) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      if (logDates.has(dateStr)) {
        count++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }
    return count;
  })();

  // Last session end location for context
  const lastSession = dailyLog.find((e) => e.endLocation);
  const lastEndLocation = lastSession?.endLocation || "";

  // Guna habit tracking streaks and progress
  const trackedHabits = (settings.habits || []).filter((h) => h.tracked);
  const sortedSchedule = [...scheduleLog].sort((a, b) => b.date.localeCompare(a.date));
  const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(today, i), "yyyy-MM-dd"));

  const habitStreaks = trackedHabits.map((habit) => {
    let streak = 0;
    for (const entry of sortedSchedule) {
      if (entry.date > format(today, "yyyy-MM-dd")) continue;
      const result = entry.habitTracking?.[habit.id];
      if (result === "positive") {
        streak++;
      } else {
        break;
      }
    }
    return { ...habit, streak };
  });

  const gunaStats = (["goodness", "passion", "ignorance"] as Guna[]).map((guna) => {
    const habits = trackedHabits.filter((h) => h.guna === guna);
    let positive = 0;
    let negative = 0;
    for (const entry of scheduleLog) {
      if (!last7Days.includes(entry.date)) continue;
      for (const habit of habits) {
        const result = entry.habitTracking?.[habit.id];
        if (result === "positive") positive++;
        if (result === "negative") negative++;
      }
    }
    return { guna, positive, negative, habits };
  });

  const todayStr = format(today, "yyyy-MM-dd");
  const upcoming = getUpcomingVaisnavaEvents(todayStr, 1)[0];

  const contactWithInstructions = contacts.filter((c) => (c.instructions || "").trim().length > 0);
  const notesCount = lectureNotes.length;
  const hasNotesOrGuidance = notesCount > 0 || contactWithInstructions.length > 0 || !!spiritualMaster;

  const todaysVerse = (() => {
    if (verseMemory.length === 0) return null;
    const currentBook = currentWeek?.book || "";
    const posMatch = lastEndLocation.match(/^(\d+)\.(\d+)/);
    const maxCh = posMatch ? parseInt(posMatch[1]) : 0;
    const maxVerse = posMatch ? parseInt(posMatch[2]) : 0;

    const fromCurrentReading = verseMemory.filter((v) => {
      if (v.mastered) return false;
      if (!v.source.includes(currentBook.split(" ")[0])) return false;
      if (!maxCh) return false;
      const vMatch = v.versePassage.match(/(\d+)\.(\d+)/);
      if (!vMatch) return false;
      const vCh = parseInt(vMatch[1]);
      const vVerse = parseInt(vMatch[2]);
      if (vCh < maxCh) return true;
      if (vCh === maxCh && vVerse <= maxVerse) return true;
      return false;
    });

    const pool = fromCurrentReading.length > 0 ? fromCurrentReading : verseMemory.filter((v) => !v.mastered);
    if (pool.length === 0) return null;
    const sortedPool = [...pool].sort((a, b) => {
      const aMatch = a.versePassage.match(/(\d+)\.(\d+)/);
      const bMatch = b.versePassage.match(/(\d+)\.(\d+)/);
      const aNum = aMatch ? parseInt(aMatch[1]) * 1000 + parseInt(aMatch[2]) : 0;
      const bNum = bMatch ? parseInt(bMatch[1]) * 1000 + parseInt(bMatch[2]) : 0;
      return bNum - aNum;
    });
    const recentCount = Math.min(3, sortedPool.length);
    return sortedPool[today.getDate() % recentCount];
  })();

  const hasVerse = !!todaysVerse;

  const instructionSources = (() => {
    const items: { text: string; source: string; type: "note" | "devotee" | "spiritual-master" }[] = [];
    lectureNotes.forEach((note) => {
      if (note.content.trim()) {
        items.push({ text: note.content.trim(), source: note.title || note.source || "Lecture Notes", type: "note" });
      }
    });
    contacts.forEach((c) => {
      (c.instructions || "").split("\n").map((line) => line.trim()).filter(Boolean).forEach((line) => {
        items.push({ text: line, source: c.name || "Devotee", type: "devotee" });
      });
    });
    if (spiritualMaster?.instructions.trim()) {
      (spiritualMaster.instructions || "").split("\n").map((line) => line.trim()).filter(Boolean).forEach((line) => {
        items.push({ text: line, source: spiritualMaster.name || "Spiritual Master", type: "spiritual-master" });
      });
    }
    return items;
  })();
  const hasInstruction = instructionSources.length > 0;
  const instructionItem = instructionSources[today.getDate() % instructionSources.length];

  const hasProgress = bookProgress.length > 0 || trackedHabits.length > 0 || verseMemory.length > 0;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-6">
        Śāstra Study Curriculum Dashboard
      </h2>

      {/* Overview — always visible summary */}
      <DashboardSection title="Overview" icon={<Target size={18} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-amber-100 dark:border-zinc-700 p-4 flex items-center gap-4 md:col-span-2">
            <BookCover bookName={currentWeek?.book || "Book"} size="md" />
            <div className="min-w-0">
              <p className="text-xs text-zinc-500 uppercase tracking-wide">Current Focus</p>
              <p className="text-base font-semibold text-amber-900 dark:text-amber-100 truncate">{currentWeek?.book || "—"}</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2">{currentWeek?.assignment || ""}</p>
              {lastEndLocation && (
                <p className="text-xs text-zinc-500 mt-1">Last: {lastEndLocation}</p>
              )}
            </div>
          </div>
          <MetricCard
            icon={<Target size={20} />}
            label="Current Week"
            value={`Week ${currentWeekNum}`}
            sub={currentWeek?.book || ""}
          />
          <MetricCard
            icon={<Clock size={20} />}
            label="Hours This Week"
            value={`${hoursThisWeek.toFixed(1)} / ${adjustedWeeklyTarget.toFixed(1)} hrs`}
            sub={`Total: ${totalHoursLogged.toFixed(1)} hrs`}
            progress={Math.min(100, (hoursThisWeek / adjustedWeeklyTarget) * 100)}
          />
          <MetricCard
            icon={aheadBehind >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            label="Pace"
            value={paceLabel}
            sub={`${aheadBehind >= 0 ? "+" : ""}${aheadBehind.toFixed(1)} hrs`}
          />
          <MetricCard
            icon={<Flame size={20} />}
            label="Study Streak"
            value={`${streak} day${streak !== 1 ? "s" : ""}`}
            sub={streak >= 7 ? "🔥 Keep it up!" : streak > 0 ? "Building momentum" : "Start today!"}
          />
        </div>
      </DashboardSection>

      {/* Today's Focus */}
      <DashboardSection title="Today's Focus" icon={<Sun size={18} />} defaultOpen={false}>
        {(() => {
          const todayJapa = japaLog.find((e) => e.date === todayStr);
          const todaySchedule = scheduleLog.find((e) => e.date === todayStr);
          const todayStudy = dailyLog.find((e) => e.date === todayStr);
          const weekStartStr = format(subDays(today, today.getDay()), "yyyy-MM-dd");
          const tutorThisWeek = tutorSessions.filter((s) => s.date >= weekStartStr && isTutorSession(s)).length;

          const items = [
            { label: "Japa", tab: "japa", done: todayJapa?.rounds != null && todayJapa.rounds >= 16, detail: todayJapa ? `${todayJapa.rounds || 0} rounds` : "Not logged" },
            { label: "Schedule", tab: "schedule", done: todaySchedule != null && todaySchedule.score >= 70, detail: todaySchedule ? `${todaySchedule.score}% adherence` : "Not started" },
            { label: "Study", tab: "daily-log", done: todayStudy?.dailyStudyComplete ?? false, detail: todayStudy ? `${(todayStudy.hours || 0).toFixed(1)} hrs logged` : "Not logged" },
            { label: "Tutor (3x/wk)", tab: "tutor", done: tutorThisWeek >= 3, detail: `${tutorThisWeek}/3 this week` },
          ];

          return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => onTabChange?.(item.tab)}
                  className={`rounded-lg p-3 border text-center cursor-pointer hover:ring-2 hover:ring-amber-300 transition-all ${
                    item.done
                      ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                      : "bg-zinc-50 border-zinc-200 dark:bg-zinc-800/50 dark:border-zinc-700"
                  }`}
                >
                  <span className={`text-lg ${item.done ? "" : "grayscale opacity-50"}`}>
                    {item.done ? "✅" : "⬜"}
                  </span>
                  <p className={`text-xs font-medium mt-1 ${item.done ? "text-green-700 dark:text-green-300" : "text-zinc-600 dark:text-zinc-400"}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">{item.detail}</p>
                </button>
              ))}
            </div>
          );
        })()}
      </DashboardSection>

      {/* This Week */}
      {currentWeek && (
        <DashboardSection title="This Week" icon={<Clock size={18} />} defaultOpen={false}>
          {(() => {
            const weekStart = parseISO(currentWeek.startDate);
            const weekEnd = parseISO(currentWeek.endDate);
            const totalDays = Math.max(1, differenceInDays(weekEnd, weekStart) + 1);
            const daysElapsed = Math.min(totalDays, Math.max(0, differenceInDays(today, weekStart) + 1));
            const daysLeft = totalDays - daysElapsed;
            const progressPct = Math.round((daysElapsed / totalDays) * 100);
            const isFriOrLater = today.getDay() >= 5 || today.getDay() === 0;

            return (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                      Week {currentWeekNum} Progress
                    </h3>
                    <span className="text-xs text-zinc-500">
                      {daysLeft === 0 ? "Last day!" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`}
                    </span>
                  </div>
                  <div className="h-3 bg-amber-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-zinc-500">
                    <span>{format(weekStart, "MMM d")}</span>
                    <span>{hoursThisWeek.toFixed(1)} / {currentWeek.targetHours} hrs studied</span>
                    <span>{format(weekEnd, "MMM d")}</span>
                  </div>
                </div>

                {isFriOrLater && (
                  <button
                    onClick={() => onTabChange?.("reflections")}
                    className="w-full text-left bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-lg border border-purple-200 dark:border-purple-800/50 p-3 hover:border-purple-400 transition-colors cursor-pointer"
                  >
                    <p className="text-xs font-medium text-purple-700 dark:text-purple-300">📝 Week-End Reflection</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                      Take a few minutes to record your biggest realization, practical application, and any questions for your senior. &rarr;
                    </p>
                  </button>
                )}
              </div>
            );
          })()}
        </DashboardSection>
      )}

      {/* Memorize & Inspire */}
      {(hasVerse || upcoming || hasInstruction) && (
        <DashboardSection title="Memorize & Inspire" icon={<Star size={18} />} defaultOpen={false}>
          <div className="space-y-4">
            {todaysVerse && (
              <button
                onClick={() => onTabChange?.("verses", todaysVerse.id)}
                className="w-full text-left bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800/50 p-5 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors cursor-pointer"
              >
                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-300 uppercase tracking-wide mb-1">Memorize Today &rarr;</p>
                <p className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">{todaysVerse.versePassage}</p>
                {todaysVerse.verseText && <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-2 leading-relaxed">&ldquo;{todaysVerse.verseText}&rdquo;</p>}
                {todaysVerse.theme && <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 italic">{todaysVerse.theme}</p>}
                <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-2">{todaysVerse.source} · {todaysVerse.priority} · Click to open</p>
              </button>
            )}

            {upcoming && (() => {
              const isToday = upcoming.date === todayStr;
              const Icon = upcoming.type === "ekadashi" ? Moon : upcoming.type === "appearance" ? Star : upcoming.type === "disappearance" ? Heart : Sun;
              const fastType = upcoming.fastType || "none";

              return (
                <button
                  onClick={() => onTabChange?.("calendar", upcoming.id)}
                  className="w-full text-left bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 rounded-xl border border-amber-300 dark:border-amber-800/50 p-5 hover:border-amber-500 dark:hover:border-amber-500 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={18} className="text-amber-700 dark:text-amber-300" />
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                      {isToday ? "Today" : "Upcoming"} &mdash; {format(parseISO(upcoming.date + "T12:00"), "MMM d")}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">{upcoming.name}</p>
                  {upcoming.personDeity && (
                    <p className="text-sm text-amber-800 dark:text-amber-400">{upcoming.personDeity}</p>
                  )}
                  {fastType !== "none" && (
                    <div className="mt-2">
                      <p className="text-sm text-indigo-700 dark:text-indigo-300">{fastLabels[fastType]}</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">{fastDetails[fastType]}</p>
                    </div>
                  )}
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 line-clamp-2">{upcoming.description}</p>
                </button>
              );
            })()}

            {instructionItem && (
              <button
                onClick={() => onTabChange?.("notes")}
                className="w-full text-left bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 rounded-xl border border-amber-300 dark:border-amber-800/50 p-5 hover:border-amber-500 dark:hover:border-amber-500 transition-colors cursor-pointer"
              >
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-2">Instruction to Remember &rarr;</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-3 leading-relaxed">&ldquo;{instructionItem.text}&rdquo;</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">{instructionItem.source}</p>
              </button>
            )}
          </div>
        </DashboardSection>
      )}

      {/* Notes & Guidance */}
      {hasNotesOrGuidance && (
        <DashboardSection title="Notes & Guidance" icon={<Notebook size={18} />} defaultOpen={false}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {notesCount > 0 && (
              <button
                onClick={() => onTabChange?.("notes")}
                className="text-left bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-amber-100 dark:border-zinc-700 p-4 hover:border-amber-400 dark:hover:border-amber-600 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Notebook size={16} className="text-amber-600" />
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wide">Lecture Notes</p>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{notesCount} note{notesCount !== 1 ? "s" : ""} recorded</p>
                <p className="text-xs text-zinc-500 mt-0.5">Click to review &rarr;</p>
              </button>
            )}

            {contactWithInstructions.length > 0 && (
              <button
                onClick={() => onTabChange?.("notes")}
                className="text-left bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-amber-100 dark:border-zinc-700 p-4 hover:border-amber-400 dark:hover:border-amber-600 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Users size={16} className="text-amber-600" />
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wide">Devotee Instructions</p>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{contactWithInstructions.length} devotee{contactWithInstructions.length !== 1 ? "s" : ""} with guidance</p>
                <p className="text-xs text-zinc-500 mt-0.5">Click to review &rarr;</p>
              </button>
            )}

            {spiritualMaster && (() => {
              const instrLines = (spiritualMaster.instructions || "").split("\n").map((l) => l.trim()).filter(Boolean);
              const noteLines = (spiritualMaster.notes || "").split("\n").map((l) => l.trim()).filter(Boolean);
              return (
                <div
                  onClick={() => onTabChange?.("notes")}
                  className="text-left bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 rounded-xl border border-amber-300 dark:border-amber-800/50 p-4 hover:border-amber-500 dark:hover:border-amber-500 transition-colors cursor-pointer md:col-span-2 lg:col-span-1"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Crown size={16} className="text-amber-700 dark:text-amber-300" />
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-200 uppercase tracking-wide">Spiritual Master</p>
                  </div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">{spiritualMaster.name || "—"}</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    {spiritualMaster.initiated ? (spiritualMaster.initiationName ? `Initiated: ${spiritualMaster.initiationName}` : "Initiated") : "Not yet initiated"}
                    {spiritualMaster.initiationDate ? ` · ${format(parseISO(spiritualMaster.initiationDate + "T12:00"), "MMM d, yyyy")}` : ""}
                  </p>
                  {instrLines.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">Instructions</p>
                      <div className="flex flex-wrap gap-1.5">
                        {instrLines.map((line, i) => (
                          <span key={`i-${i}`} className="inline-block text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700/50 leading-tight">
                            {line}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {noteLines.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Notes</p>
                      <div className="flex flex-wrap gap-1.5">
                        {noteLines.map((line, i) => (
                          <span key={`n-${i}`} className="inline-block text-xs px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 leading-tight">
                            {line}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </DashboardSection>
      )}

      {/* Progress & Tracking */}
      {hasProgress && (
        <DashboardSection title="Progress & Tracking" icon={<TrendingUp size={18} />} defaultOpen={false}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Pace Coach */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-amber-100 dark:border-zinc-700 p-6">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-4">Pace Coach</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Behind/Ahead Hours</span>
                  <span className={`font-medium ${aheadBehind >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {aheadBehind >= 0 ? "+" : ""}{aheadBehind.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Suggested Daily Study {isWeekend ? "(Weekend)" : ""}</span>
                  <span className="font-medium text-amber-800 dark:text-amber-200">{suggestedDaily} hrs ({suggestedMinutes} min)</span>
                </div>
                {aheadBehind < 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Total Deficit</span>
                      <span className="font-medium text-red-600 dark:text-red-400">{(deficitMinutes / 60).toFixed(1)} hrs ({deficitMinutes} min)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">To Fully Catch Up Today</span>
                      <span className="font-medium text-red-600 dark:text-red-400">{catchUpTodayMinutes} min ({(catchUpTodayMinutes / 60).toFixed(1)} hrs)</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Completed Weeks</span>
                  <span className="font-medium">{completedWeeks} / 32</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Target Finish</span>
                  <span className="font-medium">{format(parseISO(settings.targetFinishDate), "MMM d, yyyy")}</span>
                </div>
              </div>
              {aheadBehind < 0 && currentWeek && (() => {
                const weekStart = parseISO(currentWeek.startDate);
                const dayOfWeek = differenceInDays(today, weekStart) + 1;
                const fractionNeeded = dayOfWeek / 7;
                const verseTarget = interpolateVerseTarget(currentWeek.assignment, currentWeek.book, fractionNeeded);
                return verseTarget ? (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800/50">
                    <p className="text-xs font-medium text-red-700 dark:text-red-300 uppercase tracking-wide mb-1">
                      Today&apos;s Catch-Up Target
                    </p>
                    <p className="text-sm text-red-900 dark:text-red-100 font-medium">
                      Read to {verseTarget}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                      Day {dayOfWeek}/7 · {(currentWeek.targetHours - hoursThisWeek).toFixed(1)} hrs left this week · {suggestedDaily} hrs/day ({suggestedMinutes} min) · {catchUpTodayMinutes} min to fully catch up
                    </p>
                  </div>
                ) : null;
              })()}
            </div>

            {/* Book Progress Overview */}
            <button onClick={() => onTabChange?.("books")} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-amber-100 dark:border-zinc-700 p-6 text-left hover:ring-2 hover:ring-amber-300 transition-all cursor-pointer w-full">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-4">Book Progress &rarr;</h3>
              <div className="space-y-2 text-sm">
                {bookProgress.map((b) => (
                  <div key={b.book} className="flex justify-between items-center">
                    <span className="text-zinc-700 dark:text-zinc-300 truncate mr-2">{b.book}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 text-xs">{b.hoursLogged.toFixed(1)} hrs</span>
                      {b.complete && <CheckCircle2 size={14} className="text-green-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </button>

            {/* Guna Habit Tracking */}
            {trackedHabits.length > 0 && (
              <button onClick={() => onTabChange?.("guna-report")} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-amber-100 dark:border-zinc-700 p-6 text-left hover:ring-2 hover:ring-amber-300 transition-all cursor-pointer w-full">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-4">Guṇa Streaks &rarr;</h3>
                <div className="space-y-3 text-sm">
                  {gunaStats.map(({ guna, positive, negative, habits }) => {
                    const gunaLabel = guna === "goodness" ? "Sattva — Mode of Goodness" : guna === "passion" ? "Rajas — Mode of Passion" : "Tamas — Mode of Ignorance";
                    const gunaColor = guna === "goodness" ? "text-emerald-600 dark:text-emerald-400" : guna === "passion" ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400";
                    const total = positive + negative;
                    const pct = total > 0 ? Math.round((positive / total) * 100) : 0;
                    return (
                      <div key={guna}>
                        <div className="flex justify-between items-center">
                          <span className={`font-medium ${gunaColor}`}>{gunaLabel}</span>
                          <span className="text-xs text-zinc-500">{positive} / {total} positive (7 days)</span>
                        </div>
                        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-current rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    {habitStreaks.slice(0, 3).map((h) => (
                      <div key={h.id} className="flex justify-between items-center text-xs">
                        <span className="text-zinc-600 dark:text-zinc-400">{h.label}</span>
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Zap size={12} /> {h.streak} day{h.streak !== 1 ? "s" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            )}

            {/* Verse Memory Stats */}
            <button onClick={() => onTabChange?.("verses")} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-amber-100 dark:border-zinc-700 p-6 text-left hover:ring-2 hover:ring-amber-300 transition-all cursor-pointer w-full">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-4">Verse Memory &rarr;</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Total Passages</span>
                  <span className="font-medium">{verseMemory.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Learned</span>
                  <span className="font-medium">{versesLearned}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Mastered</span>
                  <span className="font-medium text-green-600">{versesMastered}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Progress</span>
                  <span className="font-medium">{verseMemory.length > 0 ? ((versesMastered / verseMemory.length) * 100).toFixed(0) : 0}%</span>
                </div>
              </div>
            </button>
          </div>
        </DashboardSection>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, sub, progress }: { icon: React.ReactNode; label: string; value: string; sub: string; progress?: number }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-4">
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 mb-1">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
      {progress !== undefined && (
        <div className="mt-2 h-2 bg-amber-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              progress >= 100 ? "bg-green-500" : progress >= 60 ? "bg-amber-500" : "bg-amber-400"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {sub && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{sub}</p>}
    </div>
  );
}
