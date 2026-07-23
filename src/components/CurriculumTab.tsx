"use client";

import { CurriculumWeek, Settings, DailyLogEntry, BookProgress, syncReadingPace, shiftCurriculumAssignments } from "@/lib/data";
import { format, parseISO } from "date-fns";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";

interface Props {
  curriculum: CurriculumWeek[];
  setCurriculum: (value: CurriculumWeek[] | ((prev: CurriculumWeek[]) => CurriculumWeek[])) => void;
  settings: Settings;
  setSettings: (value: Settings | ((prev: Settings) => Settings)) => void;
  dailyLog?: DailyLogEntry[];
  bookProgress?: BookProgress[];
  setBookProgress?: (value: BookProgress[] | ((prev: BookProgress[]) => BookProgress[])) => void;
}

export function CurriculumTab({ curriculum, setCurriculum, settings, setSettings, dailyLog = [], bookProgress = [], setBookProgress }: Props) {
  const updateWeek = (index: number, field: keyof CurriculumWeek, value: unknown) => {
    setCurriculum((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "complete") {
        return shiftCurriculumAssignments(updated, bookProgress, settings, new Date());
      }
      return updated;
    });
  };

  const paceMultiplier = settings.paceMultiplier ?? 1;
  const weeklyTarget = settings.weeklyTargetHours ?? 16;
  const adjustedTarget = Math.round(weeklyTarget * paceMultiplier * 2) / 2;

  const setPaceMultiplier = (value: number) => {
    setSettings((prev) => ({ ...prev, paceMultiplier: value }));
  };

  const handleSyncPace = () => {
    if (bookProgress.length === 0) return;
    const { paceMultiplier: synced, updatedBookProgress } = syncReadingPace(dailyLog, bookProgress, curriculum, settings);
    setSettings((prev) => ({ ...prev, paceMultiplier: synced }));
    if (setBookProgress) {
      setBookProgress(updatedBookProgress);
    }
    setCurriculum((prev) => shiftCurriculumAssignments(prev, updatedBookProgress, settings, new Date()));
  };

  const paceLabel = paceMultiplier < 1 ? "Gentle" : paceMultiplier === 1 ? "Normal" : paceMultiplier < 1.5 ? "Accelerated" : "Intensive";

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">{settings.targetWeeks || 32}-Week Curriculum</h2>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-4 min-w-[260px] space-y-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Study Pace</label>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">{paceLabel} ({paceMultiplier.toFixed(1)}x)</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={paceMultiplier}
            onChange={(e) => setPaceMultiplier(parseFloat(e.target.value))}
            className="w-full accent-amber-600"
          />
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>0.5x</span>
            <span>Weekly target: {adjustedTarget} hrs</span>
            <span>2x</span>
          </div>
          <button
            type="button"
            onClick={handleSyncPace}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors"
            title="Set pace and per-book estimates based on actual logged time and reading position"
          >
            <RefreshCw size={14} />
            Sync from daily log
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-amber-100 dark:bg-zinc-800">
              <th className="p-2 text-left font-medium">Wk</th>
              <th className="p-2 text-left font-medium">Dates</th>
              <th className="p-2 text-left font-medium">Book</th>
              <th className="p-2 text-left font-medium">Assignment</th>
              <th className="p-2 text-center font-medium">Target</th>
              <th className="p-2 text-center font-medium">Actual</th>
              <th className="p-2 text-center font-medium">Done</th>
              <th className="p-2 text-center font-medium">Refl.</th>
              <th className="p-2 text-left font-medium">Pace</th>
              <th className="p-2 text-left font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {curriculum.map((week, idx) => (
              <tr
                key={week.week}
                className={`border-b border-amber-100 dark:border-zinc-800 ${
                  week.complete ? "bg-green-50 dark:bg-green-950/20" : ""
                } hover:bg-amber-50 dark:hover:bg-zinc-900`}
              >
                <td className="p-2 font-medium text-amber-800 dark:text-amber-200">{week.week}</td>
                <td className="p-2 text-xs text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                  {format(parseISO(week.startDate), "MMM d")} – {format(parseISO(week.endDate), "MMM d")}
                </td>
                <td className="p-2 text-zinc-800 dark:text-zinc-200 max-w-[150px] truncate">{week.book}</td>
                <td className="p-2 text-zinc-700 dark:text-zinc-300 max-w-[200px]">
                  <input
                    type="text"
                    value={week.assignment}
                    onChange={(e) => updateWeek(idx, "assignment", e.target.value)}
                    className="w-full bg-transparent border-b border-transparent hover:border-amber-300 focus:border-amber-500 focus:outline-none px-0 py-0.5"
                  />
                </td>
                <td className="p-2 text-center">{week.targetHours}</td>
                <td className="p-2 text-center text-zinc-700 dark:text-zinc-300">
                  {week.actualHours.toFixed(1)}
                </td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => updateWeek(idx, "complete", !week.complete)}
                    className="mx-auto"
                  >
                    {week.complete ? (
                      <CheckCircle2 size={18} className="text-green-500" />
                    ) : (
                      <XCircle size={18} className="text-zinc-300 dark:text-zinc-600" />
                    )}
                  </button>
                </td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => updateWeek(idx, "reflection", !week.reflection)}
                    className="mx-auto"
                  >
                    {week.reflection ? (
                      <CheckCircle2 size={18} className="text-green-500" />
                    ) : (
                      <XCircle size={18} className="text-zinc-300 dark:text-zinc-600" />
                    )}
                  </button>
                </td>
                <td className="p-2">
                  {(() => {
                    // Manual "Done" checkbox always wins. Otherwise defer to the
                    // richer paceStatus computed centrally in page.tsx (which
                    // knows about past weeks, verse progress, etc.).
                    const status = week.complete
                      ? "Complete"
                      : week.paceStatus ||
                        (week.actualHours >= week.targetHours
                          ? "Complete"
                          : week.actualHours > 0
                          ? "In Progress"
                          : "Needs Time");
                    const cls = /^Complete/i.test(status)
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : /Missed|Behind/i.test(status)
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : /In Progress|Nearly Done/i.test(status)
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : /Upcoming/i.test(status)
                      ? "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500";
                    return (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${cls}`}
                        title={status}
                      >
                        {status}
                      </span>
                    );
                  })()}
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={week.notes}
                    onChange={(e) => updateWeek(idx, "notes", e.target.value)}
                    placeholder="..."
                    className="w-full bg-transparent border-b border-transparent hover:border-amber-300 focus:border-amber-500 focus:outline-none text-xs px-0 py-0.5"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
