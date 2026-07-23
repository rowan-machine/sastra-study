"use client";

import { useState, useMemo } from "react";
import { Play, Pause, Square, Clock, BookOpen, Target, ChevronRight, Lightbulb } from "lucide-react";
import {
  DailyLogEntry,
  CurriculumWeek,
  Settings,
  interpolateVerseTarget,
  emptyDailyLogEntry,
  recalcDailyStudyComplete,
  getDayTargetHours,
} from "@/lib/data";
import { findChapterOverview, ChapterOverview } from "@/lib/chapter-overviews";
import { useTimer } from "@/lib/timer";
import { format, parseISO, differenceInDays } from "date-fns";

interface StudyTimerProps {
  dailyLog: DailyLogEntry[];
  setDailyLog: (value: DailyLogEntry[] | ((prev: DailyLogEntry[]) => DailyLogEntry[])) => void;
  curriculum: CurriculumWeek[];
  settings: Settings;
  courseBooks?: string[];
}

interface ReadingOverview {
  book: string;
  assignment: string;
  startLocation: string;
  endLocation: string;
  targetHours: number;
  dayTargetHours: number;
  dayOfWeek: number;
  chapters: string;
  startCh: number;
  endCh: number;
  overview: ChapterOverview | null;
}

function getUpcomingReading(
  curriculum: CurriculumWeek[],
  settings: Settings,
  dailyLog: DailyLogEntry[]
): ReadingOverview | null {
  const today = new Date();
  const startDate = parseISO(settings.planStartDate);
  const daysSinceStart = Math.max(0, differenceInDays(today, startDate));
  const currentWeekNum = Math.min(32, Math.floor(daysSinceStart / 7) + 1);
  const currentWeek = curriculum.find((w) => w.week === currentWeekNum);
  if (!currentWeek) return null;

  const weekStart = parseISO(currentWeek.startDate);
  const dayOfWeek = Math.min(7, Math.max(1, differenceInDays(today, weekStart) + 1));
  const endFraction = dayOfWeek / 7;

  // Use the last daily log entry's endLocation as the true starting point
  const sortedLog = [...dailyLog]
    .filter((e) => e.endLocation && e.date)
    .sort((a, b) => b.date.localeCompare(a.date));
  const lastEndLocation = sortedLog[0]?.endLocation || "";

  const startLocation = lastEndLocation || interpolateVerseTarget(currentWeek.assignment, currentWeek.book, (dayOfWeek - 1) / 7) || "";
  const endLocation = interpolateVerseTarget(currentWeek.assignment, currentWeek.book, endFraction) || "";

  // Determine chapter range from assignment
  let startCh = 1;
  let endCh = 1;
  const rangeMatch = currentWeek.assignment.match(/(?:chapters?)\s*(\d+)(?:\s*[–\-−to]+\s*(\d+))?/i);
  if (rangeMatch) {
    startCh = parseInt(rangeMatch[1]);
    endCh = rangeMatch[2] ? parseInt(rangeMatch[2]) : startCh;
  } else {
    const startMatch = currentWeek.assignment.match(/(\d+)\.(\d+)/);
    if (startMatch) {
      startCh = parseInt(startMatch[1]);
      endCh = startCh;
    }
  }

  const dayTargetHours = getDayTargetHours(format(today, "yyyy-MM-dd"), settings);

  const overview = startCh <= endCh ? findChapterOverview(currentWeek.book, startCh) : null;

  return {
    book: currentWeek.book,
    assignment: currentWeek.assignment,
    startLocation,
    endLocation,
    targetHours: currentWeek.targetHours,
    dayTargetHours,
    dayOfWeek,
    chapters: startCh === endCh ? `Chapter ${startCh}` : `Chapters ${startCh}–${endCh}`,
    startCh,
    endCh,
    overview,
  };
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function StudyTimer({ dailyLog, setDailyLog, curriculum, settings, courseBooks }: StudyTimerProps) {
  const timer = useTimer();
  const [showOverview, setShowOverview] = useState(true);

  const overview = useMemo(() => getUpcomingReading(curriculum, settings, dailyLog), [curriculum, settings, dailyLog]);

  const addElapsedToLog = () => {
    const elapsedSeconds = timer.elapsedSeconds;
    if (elapsedSeconds <= 0) return;
    const minutesToAdd = Math.round(elapsedSeconds / 60);
    if (minutesToAdd <= 0) return;

    const today = format(new Date(), "yyyy-MM-dd");
    setDailyLog((prev) => {
      const todayIndex = prev.findIndex((e) => e.date === today);
      if (todayIndex >= 0) {
        const updated = [...prev];
        const entry = updated[todayIndex];
        const newMinutes = (entry.minutes || 0) + minutesToAdd;
        updated[todayIndex] = recalcDailyStudyComplete(
          { ...entry, minutes: newMinutes, hours: newMinutes / 60 },
          settings
        );
        return updated;
      }

      // No entry for today yet — create one with current reading target
      const newEntry = emptyDailyLogEntry(today);
      newEntry.minutes = minutesToAdd;
      newEntry.hours = minutesToAdd / 60;
      if (overview) {
        newEntry.book = overview.book;
        newEntry.startLocation = overview.startLocation;
        newEntry.endLocation = overview.endLocation;
      }
      if (courseBooks && courseBooks.length > 0 && !newEntry.book) {
        newEntry.book = courseBooks[0];
      }
      return [recalcDailyStudyComplete(newEntry, settings), ...prev];
    });

    timer.reset();
  };

  const toggleTimer = () => (timer.isRunning ? timer.pause() : timer.start());
  const resetTimer = () => timer.reset();

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 overflow-hidden mb-6">
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Clock className="w-6 h-6 text-amber-700 dark:text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">Study Timer</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {timer.isRunning ? "Session in progress" : "Press play to start a session"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-3xl font-mono font-semibold text-amber-900 dark:text-amber-100 tabular-nums">
              {formatDuration(timer.elapsedSeconds)}
            </div>
            <button
              onClick={toggleTimer}
              className="p-3 rounded-full bg-amber-700 hover:bg-amber-800 text-white transition-colors"
              aria-label={timer.isRunning ? "Pause timer" : "Start timer"}
            >
              {timer.isRunning ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button
              onClick={addElapsedToLog}
              disabled={timer.elapsedSeconds === 0}
              className="flex items-center gap-2 px-4 py-3 bg-green-700 hover:bg-green-800 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
              aria-label="Log elapsed time"
            >
              <Square size={16} />
              Log Time
            </button>
            <button
              onClick={resetTimer}
              className="px-3 py-3 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              aria-label="Reset timer"
            >
              Reset
            </button>
          </div>
        </div>

        {overview && (
          <div className="mt-4 pt-4 border-t border-amber-100 dark:border-zinc-800">
            <button
              onClick={() => setShowOverview((prev) => !prev)}
              className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300 hover:underline"
            >
              <BookOpen size={16} />
              {showOverview ? "Hide" : "Show"} upcoming reading overview
              <ChevronRight
                size={16}
                className={`transform transition-transform ${showOverview ? "rotate-90" : ""}`}
              />
            </button>

            {showOverview && (
              <div className="mt-3 bg-amber-50 dark:bg-zinc-800/50 rounded-lg p-4">
                <div className="flex flex-wrap gap-4 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen size={16} className="text-amber-600 dark:text-amber-400" />
                    <span className="font-medium text-amber-900 dark:text-amber-100">{overview.book}</span>
                    <span className="text-zinc-600 dark:text-zinc-400">{overview.assignment}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Target size={16} className="text-amber-600 dark:text-amber-400" />
                    <span className="text-zinc-700 dark:text-zinc-300">
                      Today: {overview.dayTargetHours} hrs ({overview.dayOfWeek}/7)
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-500">
                      • Week target: {overview.targetHours} hrs
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Reading span</p>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {overview.startLocation || "Start"} → {overview.endLocation || "End"}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 mb-1">{overview.chapters}</p>
                    {overview.overview ? (
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{overview.overview.title}</p>
                    ) : (
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">Focus on the assigned reading and purport.</p>
                    )}
                  </div>
                  <div>
                    {overview.overview ? (
                      <>
                        <div className="flex items-start gap-2 mb-2">
                          <BookOpen size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                          <p className="text-sm text-zinc-700 dark:text-zinc-300">{overview.overview.summary}</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <Lightbulb size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                          <ul className="text-sm text-zinc-700 dark:text-zinc-300 list-disc pl-4 space-y-1">
                            {overview.overview.keyLessons.map((lesson, i) => (
                              <li key={i}>{lesson}</li>
                            ))}
                          </ul>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">No detailed overview available for this reading.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
