"use client";

import { CurriculumWeek } from "@/lib/data";
import { format, parseISO } from "date-fns";
import { CheckCircle2, XCircle } from "lucide-react";

interface Props {
  curriculum: CurriculumWeek[];
  setCurriculum: (value: CurriculumWeek[] | ((prev: CurriculumWeek[]) => CurriculumWeek[])) => void;
}

export function CurriculumTab({ curriculum, setCurriculum }: Props) {
  const updateWeek = (index: number, field: keyof CurriculumWeek, value: unknown) => {
    setCurriculum((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-6">32-Week Curriculum</h2>
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
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      week.actualHours >= week.targetHours
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : week.actualHours > 0
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
                    }`}
                  >
                    {week.actualHours >= week.targetHours ? "Complete" : week.actualHours > 0 ? "In Progress" : "Needs Time"}
                  </span>
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
