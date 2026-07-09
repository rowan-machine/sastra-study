"use client";

import { DailyLogEntry, Settings, CurriculumWeek, interpolateVerseTarget } from "@/lib/data";
import { format, parseISO, differenceInDays } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface Props {
  dailyLog: DailyLogEntry[];
  setDailyLog: (value: DailyLogEntry[] | ((prev: DailyLogEntry[]) => DailyLogEntry[])) => void;
  settings: Settings;
  curriculum: CurriculumWeek[];
  courseBooks?: string[];
}

const emptyEntry = (date: string): DailyLogEntry => ({
  date,
  book: "",
  startLocation: "",
  endLocation: "",
  minutes: null,
  hours: null,
  sixteenRounds: false,
  sanskrit: false,
  wordMeanings: false,
  translation: false,
  purport: false,
  marked: false,
  reflection: false,
  dailyStudyComplete: false,
  quote: "",
  realization: "",
  notes: "",
});

function getDailyVerseTarget(curriculum: CurriculumWeek[], settings: Settings, dailyLog: DailyLogEntry[]): string {
  const today = new Date();
  const startDate = parseISO(settings.planStartDate);
  const daysSinceStart = Math.max(0, differenceInDays(today, startDate));
  const currentWeekNum = Math.min(32, Math.floor(daysSinceStart / 7) + 1);
  const currentWeek = curriculum.find((w) => w.week === currentWeekNum);
  if (!currentWeek) return "";

  // Only show when behind
  const totalHoursLogged = dailyLog.reduce((sum, e) => sum + (e.hours || 0), 0);
  const expectedHours = (daysSinceStart / 7) * settings.weeklyTargetHours;
  if (totalHoursLogged >= expectedHours) return "";

  // Calculate what fraction of the week should be done by today
  const weekStart = parseISO(currentWeek.startDate);
  const dayOfWeek = differenceInDays(today, weekStart) + 1; // 1–7
  const fractionNeeded = dayOfWeek / 7;

  const verseTarget = interpolateVerseTarget(currentWeek.assignment, currentWeek.book, fractionNeeded);
  if (!verseTarget) return "";

  return `Catch up to ${verseTarget} today`;
}

export function DailyLogTab({ dailyLog, setDailyLog, settings, curriculum, courseBooks }: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const endpointHint = getDailyVerseTarget(curriculum, settings, dailyLog);

  // Auto-suggest start location from last entry's end location
  const lastEndLocation = dailyLog.find((e) => e.endLocation)?.endLocation || "";

  const addEntry = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    setDailyLog((prev) => [emptyEntry(today), ...prev]);
    setExpandedIdx(0);
  };

  const updateEntry = (index: number, field: keyof DailyLogEntry, value: unknown) => {
    setDailyLog((prev) => {
      const updated = [...prev];
      const entry = { ...updated[index], [field]: value };
      if (field === "minutes" && typeof value === "number") {
        entry.hours = value / 60;
      }
      // Auto-calc dailyStudyComplete
      const meetsTime = (entry.hours || 0) >= settings.minimumDailyStudyHours;
      entry.dailyStudyComplete =
        entry.sanskrit &&
        entry.wordMeanings &&
        entry.translation &&
        entry.purport &&
        entry.marked &&
        entry.reflection &&
        meetsTime;
      updated[index] = entry;
      return updated;
    });
  };

  const deleteEntry = (index: number) => {
    setDailyLog((prev) => prev.filter((_, i) => i !== index));
    setExpandedIdx(null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">Daily Log</h2>
        <button
          onClick={addEntry}
          className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          New Entry
        </button>
      </div>

      <div className="space-y-2">
        {dailyLog.map((entry, idx) => (
          <div
            key={`${entry.date}-${idx}`}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 overflow-hidden"
          >
            {/* Header row */}
            <button
              onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
              className="w-full flex items-center justify-between p-4 hover:bg-amber-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <span className="font-medium text-amber-800 dark:text-amber-200">
                  {entry.date ? format(parseISO(entry.date), "EEE, MMM d") : "No date"}
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{entry.book || "—"}</span>
                {entry.startLocation && (
                  <span className="text-xs text-zinc-500">
                    {entry.startLocation} → {entry.endLocation || "..."}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {entry.hours != null && (
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {entry.hours.toFixed(1)} hrs
                  </span>
                )}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    entry.dailyStudyComplete
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
                  }`}
                >
                  {entry.dailyStudyComplete ? "Complete" : "Incomplete"}
                </span>
              </div>
            </button>

            {/* Expanded form */}
            {expandedIdx === idx && (
              <div className="border-t border-amber-100 dark:border-zinc-800 p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Field label="Date">
                    <input
                      type="date"
                      value={entry.date}
                      onChange={(e) => updateEntry(idx, "date", e.target.value)}
                      className="input-field"
                    />
                  </Field>
                  <Field label="Book">
                    <select
                      value={entry.book}
                      onChange={(e) => updateEntry(idx, "book", e.target.value)}
                      className="input-field"
                    >
                      <option value="">Select book...</option>
                      {(courseBooks && courseBooks.length > 0 ? courseBooks : ["Bhagavad-gītā"]).map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Started Reading At">
                    <input
                      type="text"
                      value={entry.startLocation}
                      onChange={(e) => updateEntry(idx, "startLocation", e.target.value)}
                      className="input-field"
                      placeholder={lastEndLocation ? `Continued from ${lastEndLocation}` : "e.g. 3.19"}
                    />
                  </Field>
                  <Field label="Last Verse Read">
                    <input
                      type="text"
                      value={entry.endLocation}
                      onChange={(e) => updateEntry(idx, "endLocation", e.target.value)}
                      className="input-field"
                      placeholder={endpointHint || "e.g. 3.38 (last verse you finished)"}
                    />
                  </Field>
                  <Field label="Minutes">
                    <input
                      type="number"
                      min="0"
                      value={entry.minutes ?? ""}
                      onChange={(e) => updateEntry(idx, "minutes", e.target.value ? parseFloat(e.target.value) : null)}
                      className="input-field"
                    />
                  </Field>
                  <Field label="Hours (auto)">
                    <input
                      type="text"
                      readOnly
                      value={entry.hours != null ? entry.hours.toFixed(2) : "—"}
                      className="input-field bg-zinc-50 dark:bg-zinc-800"
                    />
                  </Field>
                </div>

                {/* Checkboxes */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Checkbox label="16 Rounds?" checked={entry.sixteenRounds} onChange={(v) => updateEntry(idx, "sixteenRounds", v)} />
                  <Checkbox label="Sanskrit?" checked={entry.sanskrit} onChange={(v) => updateEntry(idx, "sanskrit", v)} />
                  <Checkbox label="Word Meanings?" checked={entry.wordMeanings} onChange={(v) => updateEntry(idx, "wordMeanings", v)} />
                  <Checkbox label="Translation?" checked={entry.translation} onChange={(v) => updateEntry(idx, "translation", v)} />
                  <Checkbox label="Purport?" checked={entry.purport} onChange={(v) => updateEntry(idx, "purport", v)} />
                  <Checkbox label="Marked?" checked={entry.marked} onChange={(v) => updateEntry(idx, "marked", v)} />
                  <Checkbox label="Reflection?" checked={entry.reflection} onChange={(v) => updateEntry(idx, "reflection", v)} />
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${entry.dailyStudyComplete ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                      {entry.dailyStudyComplete ? "✓ Study Complete" : "✗ Incomplete"}
                    </span>
                  </div>
                </div>


                <div className="flex justify-end">
                  <button
                    onClick={() => deleteEntry(idx)}
                    className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm"
                  >
                    <Trash2 size={14} />
                    Delete Entry
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-700 dark:text-zinc-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
      />
      {label}
    </label>
  );
}
