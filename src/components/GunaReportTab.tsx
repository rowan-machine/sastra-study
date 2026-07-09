"use client";

import { Settings, ScheduleDay, Guna, GunaHabit } from "@/lib/data";
import { format, subDays } from "date-fns";
import { Zap, TrendingUp, TrendingDown, Flame, Shield } from "lucide-react";

interface Props {
  settings: Settings;
  scheduleLog: ScheduleDay[];
}

const gunaLabels: Record<Guna, string> = {
  goodness: "Sattva — Mode of Goodness",
  passion: "Rajas — Mode of Passion",
  ignorance: "Tamas — Mode of Ignorance",
};

const gunaColors: Record<Guna, { text: string; bg: string; bar: string }> = {
  goodness: { text: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-900/20", bar: "bg-emerald-500" },
  passion: { text: "text-rose-700 dark:text-rose-300", bg: "bg-rose-50 dark:bg-rose-900/20", bar: "bg-rose-500" },
  ignorance: { text: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/20", bar: "bg-slate-500" },
};

export function GunaReportTab({ settings, scheduleLog }: Props) {
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const trackedHabits = (settings.habits || []).filter((h) => h.tracked);
  const sortedSchedule = [...scheduleLog].sort((a, b) => b.date.localeCompare(a.date));

  // Date ranges for analysis
  const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(today, i), "yyyy-MM-dd"));
  const last14Days = Array.from({ length: 14 }, (_, i) => format(subDays(today, i), "yyyy-MM-dd"));
  const last30Days = Array.from({ length: 30 }, (_, i) => format(subDays(today, i), "yyyy-MM-dd"));

  // Calculate streak for a habit
  function getStreak(habit: GunaHabit): number {
    let streak = 0;
    for (const entry of sortedSchedule) {
      if (entry.date > todayStr) continue;
      const result = entry.habitTracking?.[habit.id];
      if (result === "positive") {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  // Calculate stats for a habit over a date range
  function getHabitStats(habit: GunaHabit, dateRange: string[]) {
    let positive = 0;
    let negative = 0;
    let untracked = 0;
    for (const date of dateRange) {
      const entry = scheduleLog.find((e) => e.date === date);
      if (!entry) { untracked++; continue; }
      const result = entry.habitTracking?.[habit.id];
      if (result === "positive") positive++;
      else if (result === "negative") negative++;
      else untracked++;
    }
    return { positive, negative, untracked, total: dateRange.length };
  }

  // Group by guna
  const gunaGroups = (["goodness", "passion", "ignorance"] as Guna[]).map((guna) => ({
    guna,
    habits: trackedHabits.filter((h) => h.guna === guna),
  }));

  // Overall guna balance (7-day)
  const overallStats = gunaGroups.map(({ guna, habits }) => {
    let pos = 0, neg = 0;
    for (const habit of habits) {
      const s = getHabitStats(habit, last7Days);
      pos += s.positive;
      neg += s.negative;
    }
    return { guna, positive: pos, negative: neg, total: pos + neg };
  });

  if (trackedHabits.length === 0) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-6">Guṇa Progress Report</h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          No habits are being tracked. Go to Settings → Guṇa Habit Tracker to add and enable habits.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-2">Guṇa Progress Report</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
        Track your progress in cultivating sattva-guṇa and reducing rajo/tamo-guṇa tendencies.
      </p>

      {/* Overall Balance - 7 Day Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {overallStats.map(({ guna, positive, total }) => {
          const pct = total > 0 ? Math.round((positive / total) * 100) : 0;
          const colors = gunaColors[guna];
          return (
            <div key={guna} className={`rounded-xl border p-4 ${colors.bg} border-current/10`}>
              <p className={`text-xs font-medium ${colors.text} mb-1`}>
                {guna === "goodness" ? "Sattva" : guna === "passion" ? "Rajas" : "Tamas"}
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{pct}%</p>
              <p className="text-xs text-zinc-500">positive (7 days)</p>
              <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full mt-2 overflow-hidden">
                <div className={`h-full ${colors.bar} rounded-full`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Per-Guna Detailed Sections */}
      {gunaGroups.filter((g) => g.habits.length > 0).map(({ guna, habits }) => {
        const colors = gunaColors[guna];
        return (
          <div key={guna} className="mb-8">
            <h3 className={`text-lg font-semibold ${colors.text} mb-3 flex items-center gap-2`}>
              {guna === "goodness" ? <Shield size={18} /> : guna === "passion" ? <Flame size={18} /> : <TrendingDown size={18} />}
              {gunaLabels[guna]}
            </h3>

            <div className="space-y-3">
              {habits.map((habit) => {
                const streak = getStreak(habit);
                const week = getHabitStats(habit, last7Days);
                const twoWeek = getHabitStats(habit, last14Days);
                const month = getHabitStats(habit, last30Days);
                const weekPct = week.total > 0 ? Math.round((week.positive / week.total) * 100) : 0;
                const twoWeekPct = twoWeek.total > 0 ? Math.round((twoWeek.positive / twoWeek.total) * 100) : 0;
                const monthPct = month.total > 0 ? Math.round((month.positive / month.total) * 100) : 0;
                const trending = weekPct > twoWeekPct;

                return (
                  <div key={habit.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{habit.label}</span>
                        <span className="ml-2 text-xs text-zinc-400">
                          ({habit.mode === "avoid" ? "avoiding" : "practicing"})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {streak > 0 && (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-sm font-medium">
                            <Zap size={14} /> {streak} day{streak !== 1 ? "s" : ""}
                          </span>
                        )}
                        {trending ? (
                          <TrendingUp size={16} className="text-green-500" />
                        ) : weekPct < twoWeekPct ? (
                          <TrendingDown size={16} className="text-red-500" />
                        ) : null}
                      </div>
                    </div>

                    {/* Progress bars for different time periods */}
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-zinc-500">7 days</span>
                          <span className="font-medium">{week.positive}/{week.total - week.untracked}</span>
                        </div>
                        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className={`h-full ${colors.bar} rounded-full`} style={{ width: `${weekPct}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-zinc-500">14 days</span>
                          <span className="font-medium">{twoWeek.positive}/{twoWeek.total - twoWeek.untracked}</span>
                        </div>
                        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className={`h-full ${colors.bar} rounded-full`} style={{ width: `${twoWeekPct}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-zinc-500">30 days</span>
                          <span className="font-medium">{month.positive}/{month.total - month.untracked}</span>
                        </div>
                        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className={`h-full ${colors.bar} rounded-full`} style={{ width: `${monthPct}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* 7-day history dots */}
                    <div className="flex items-center gap-1 mt-3">
                      <span className="text-[10px] text-zinc-400 mr-1">Last 7:</span>
                      {last7Days.slice().reverse().map((date) => {
                        const entry = scheduleLog.find((e) => e.date === date);
                        const result = entry?.habitTracking?.[habit.id];
                        return (
                          <div
                            key={date}
                            title={`${date}: ${result || "no data"}`}
                            className={`w-4 h-4 rounded-sm ${
                              result === "positive"
                                ? "bg-green-400 dark:bg-green-600"
                                : result === "negative"
                                ? "bg-red-400 dark:bg-red-600"
                                : "bg-zinc-200 dark:bg-zinc-700"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
