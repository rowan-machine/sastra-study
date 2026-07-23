"use client";

import { useEffect, useState } from "react";
import { Course, BookProgress, CurriculumWeek, DailyLogEntry, Settings } from "@/lib/data";
import { parseISO, format, isWithinInterval, differenceInDays, addDays } from "date-fns";
import { BookOpen } from "lucide-react";

interface ActiveCoursesTrackerProps {
  courses: Course[];
  activeCourseId: string;
  maxCourses?: number;
  onCourseSelect?: (courseId: string) => void;
}

type CourseStats = {
  percent: number;
  hours: number;
  completedWeeks: number;
  totalWeeks: number;
  weeklyHours: number;
  weeklyTarget: number;
  weeklyPercent: number;
  weeklyColor: string;
};

export function ActiveCoursesTracker({ courses, activeCourseId, maxCourses = 3, onCourseSelect }: ActiveCoursesTrackerProps) {
  const [courseData, setCourseData] = useState<Record<string, CourseStats>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const data: Record<string, CourseStats> = {};
    for (const c of courses) {
      const bpRaw = localStorage.getItem(`sastra-${c.id}-book-progress`);
      const curRaw = localStorage.getItem(`sastra-${c.id}-curriculum`);
      const logRaw = localStorage.getItem(`sastra-${c.id}-daily-log`);
      const setRaw = localStorage.getItem(`sastra-${c.id}-settings`);
      const bp: BookProgress[] = bpRaw ? JSON.parse(bpRaw) : [];
      const curriculum: CurriculumWeek[] = curRaw ? JSON.parse(curRaw) : [];
      const dailyLog: DailyLogEntry[] = logRaw ? JSON.parse(logRaw) : [];
      const settings: Settings | null = setRaw ? JSON.parse(setRaw) : null;
      const totalPercent = bp.length ? bp.reduce((s, b) => s + (b.percentComplete || 0), 0) / bp.length : 0;
      const completedWeeks = curriculum.filter(
        (w) => w.complete || /^Complete/i.test(w.paceStatus || "")
      ).length;
      const weeklyTarget = settings?.weeklyTargetHours || 0;
      const planStart = settings?.planStartDate ? parseISO(settings.planStartDate) : parseISO(c.startDate);
      const daysSinceStart = Math.max(0, differenceInDays(today, planStart));
      const currentWeekNum = Math.floor(daysSinceStart / 7) + 1;
      const weekStart = addDays(planStart, (currentWeekNum - 1) * 7);
      const weekEnd = addDays(weekStart, 7);
      const weekStartStr = format(weekStart, "yyyy-MM-dd");
      const weekEndStr = format(weekEnd, "yyyy-MM-dd");
      const weeklyHours = dailyLog
        .filter((e) => e.date >= weekStartStr && e.date < weekEndStr)
        .reduce((s, e) => s + (e.hours || 0), 0);
      const weeklyPercent = weeklyTarget > 0 ? Math.min(100, (weeklyHours / weeklyTarget) * 100) : 0;
      const weeklyColor = weeklyTarget > 0 && weeklyHours >= weeklyTarget
        ? "bg-emerald-500"
        : weeklyTarget > 0 && weeklyHours >= weeklyTarget * 0.5
        ? "bg-yellow-500"
        : "bg-red-500";
      data[c.id] = {
        percent: Math.round(totalPercent),
        hours: Math.round(dailyLog.reduce((s, e) => s + (e.hours || 0), 0) * 10) / 10,
        completedWeeks,
        totalWeeks: curriculum.length,
        weeklyHours: Math.round(weeklyHours * 10) / 10,
        weeklyTarget,
        weeklyPercent,
        weeklyColor,
      };
    }
    setCourseData(data);
  }, [courses]);

  const today = new Date();
  const activeCourses = courses
    .filter((c) => {
      const start = parseISO(c.startDate);
      const end = parseISO(c.endDate);
      return isWithinInterval(today, { start, end });
    })
    .sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime())
    .slice(0, maxCourses);

  if (activeCourses.length === 0) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-4 mb-6">
      <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
        <BookOpen size={18} /> Active Courses
      </h3>
      <div className="space-y-3">
        {activeCourses.map((c) => {
          const d = courseData[c.id] || { percent: 0, hours: 0, completedWeeks: 0, totalWeeks: 0, weeklyHours: 0, weeklyTarget: 0, weeklyPercent: 0, weeklyColor: "bg-red-500" };
          return (
            <button
              key={c.id}
              onClick={() => onCourseSelect?.(c.id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                c.id === activeCourseId
                  ? "border-amber-300 bg-amber-50/50 dark:bg-amber-900/10"
                  : "border-zinc-200 dark:border-zinc-700 hover:bg-amber-50/30 dark:hover:bg-amber-900/5 hover:border-amber-300 dark:hover:border-amber-700"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-sm">{c.name}</span>
                <span className="text-xs text-zinc-500">{format(parseISO(c.startDate), "MMM d, yyyy")}</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden mb-1">
                <div
                  className="h-full bg-amber-600 rounded-full transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, d.percent))}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-zinc-500 mb-2">
                <span>{d.percent}% complete</span>
                <span>
                  {d.completedWeeks}/{d.totalWeeks} weeks · {d.hours} hrs
                </span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-zinc-500">This week</span>
                <span className={`text-xs font-medium ${d.weeklyHours >= d.weeklyTarget ? "text-emerald-600 dark:text-emerald-400" : d.weeklyHours >= d.weeklyTarget * 0.5 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}>
                  {d.weeklyHours.toFixed(1)} / {d.weeklyTarget} hrs
                </span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${d.weeklyColor} rounded-full transition-all`}
                  style={{ width: `${Math.max(0, Math.min(100, d.weeklyPercent))}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
