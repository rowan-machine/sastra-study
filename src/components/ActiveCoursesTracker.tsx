"use client";

import { useEffect, useState } from "react";
import { Course, BookProgress, CurriculumWeek, DailyLogEntry } from "@/lib/data";
import { parseISO, format, isWithinInterval } from "date-fns";
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
      const bp: BookProgress[] = bpRaw ? JSON.parse(bpRaw) : [];
      const curriculum: CurriculumWeek[] = curRaw ? JSON.parse(curRaw) : [];
      const dailyLog: DailyLogEntry[] = logRaw ? JSON.parse(logRaw) : [];
      const totalPercent = bp.length ? bp.reduce((s, b) => s + (b.percentComplete || 0), 0) / bp.length : 0;
      const completedWeeks = curriculum.filter(
        (w) => w.complete || /^Complete/i.test(w.paceStatus || "")
      ).length;
      data[c.id] = {
        percent: Math.round(totalPercent),
        hours: Math.round(dailyLog.reduce((s, e) => s + (e.hours || 0), 0) * 10) / 10,
        completedWeeks,
        totalWeeks: curriculum.length,
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
          const d = courseData[c.id] || { percent: 0, hours: 0, completedWeeks: 0, totalWeeks: 0 };
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
              <div className="flex justify-between text-xs text-zinc-500">
                <span>{d.percent}% complete</span>
                <span>
                  {d.completedWeeks}/{d.totalWeeks} weeks · {d.hours} hrs
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
