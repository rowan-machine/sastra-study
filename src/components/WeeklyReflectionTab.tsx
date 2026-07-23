"use client";

import { WeeklyReflection } from "@/lib/data";
import { CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";

interface Props {
  reflections: WeeklyReflection[];
  setReflections: (value: WeeklyReflection[] | ((prev: WeeklyReflection[]) => WeeklyReflection[])) => void;
}

export function WeeklyReflectionTab({ reflections, setReflections }: Props) {
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  const updateReflection = (week: number, field: keyof WeeklyReflection, value: unknown) => {
    setReflections((prev) =>
      prev.map((r) => (r.week === week ? { ...r, [field]: value } : r))
    );
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-4">Sāstra Weekly Reflection</h2>

      <div className="space-y-2">
        {reflections.map((ref) => (
          <div
            key={ref.week}
            className={`bg-white dark:bg-zinc-900 rounded-xl border overflow-hidden ${
              ref.completed
                ? "border-green-300 dark:border-green-800"
                : "border-amber-200 dark:border-zinc-800"
            }`}
          >
            <div className="flex items-center justify-between hover:bg-amber-50 dark:hover:bg-zinc-800/50 transition-colors">
              <button
                onClick={() => setExpandedWeek(expandedWeek === ref.week ? null : ref.week)}
                className="flex-1 flex items-center gap-3 p-4 text-left"
              >
                <span className="font-medium text-amber-800 dark:text-amber-200">Week {ref.week}</span>
                {ref.biggestRealization && (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400 truncate max-w-[300px]">
                    {ref.biggestRealization}
                  </span>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateReflection(ref.week, "completed", !ref.completed);
                }}
                title={ref.completed ? "Mark as incomplete" : "Mark reflection as complete"}
                className="p-4 hover:scale-110 transition-transform"
              >
                {ref.completed ? (
                  <CheckCircle2 size={18} className="text-green-500" />
                ) : (
                  <Circle size={18} className="text-zinc-300 dark:text-zinc-600 hover:text-amber-400" />
                )}
              </button>
            </div>

            {expandedWeek === ref.week && (
              <div className="border-t border-amber-100 dark:border-zinc-800 p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    Biggest Realization
                  </label>
                  <textarea
                    value={ref.biggestRealization}
                    onChange={(e) => updateReflection(ref.week, "biggestRealization", e.target.value)}
                    className="input-field min-h-[80px] resize-y"
                    placeholder="What was your biggest realization this week?"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    Practical Application
                  </label>
                  <textarea
                    value={ref.practicalApplication}
                    onChange={(e) => updateReflection(ref.week, "practicalApplication", e.target.value)}
                    className="input-field min-h-[80px] resize-y"
                    placeholder="How will you apply this practically?"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    Question for Senior Devotee
                  </label>
                  <textarea
                    value={ref.questionForSenior}
                    onChange={(e) => updateReflection(ref.week, "questionForSenior", e.target.value)}
                    className="input-field min-h-[80px] resize-y"
                    placeholder="Any question you'd like to ask a senior devotee?"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
