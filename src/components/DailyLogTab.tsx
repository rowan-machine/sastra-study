"use client";

import { DailyLogEntry, Settings, CurriculumWeek, JapaEntry, ScheduleDay, calcScore, getDayTargetHours, emptyDailyLogEntry, recalcDailyStudyComplete, getDailyVerseTarget, normalizeVerseInput, isValidVerseRef, parseVerseRef } from "@/lib/data";
import { format, parseISO } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { StudyTimer } from "./StudyTimer";
import { useState, useMemo } from "react";

interface Props {
  dailyLog: DailyLogEntry[];
  setDailyLog: (value: DailyLogEntry[] | ((prev: DailyLogEntry[]) => DailyLogEntry[])) => void;
  settings: Settings;
  curriculum: CurriculumWeek[];
  courseBooks?: string[];
  japaLog?: JapaEntry[];
  setJapaLog?: (value: JapaEntry[] | ((prev: JapaEntry[]) => JapaEntry[])) => void;
  scheduleLog?: ScheduleDay[];
  setScheduleLog?: (value: ScheduleDay[] | ((prev: ScheduleDay[]) => ScheduleDay[])) => void;
}

const emptyEntry = emptyDailyLogEntry;

const studyFocusLabels = [
  "1 — Distracted",
  "2 — Partially Present",
  "3 — Steady Attention",
  "4 — Deep Engagement",
  "5 — Fully Absorbed",
];

const studyFocusDescriptions = [
  "Mind is elsewhere — reading words but not absorbing meaning. Eyes move across the page mechanically. This happens to everyone; just noticing it is valuable. Try changing environment, reading aloud, or switching to a different section.",
  "Partially present — you catch the general flow but miss subtle points. The purports feel long and your mind wanders midway through paragraphs. You may need to re-read sections. This is a normal working level for many days.",
  "Steady attention — you follow the argument, remember key points, and can connect this reading to previous chapters. You notice new things in purports you may have read before. Your annotations are meaningful. Good, solid study.",
  "Deep engagement — the text is speaking to you personally. You see connections across books, recall supporting verses naturally, and feel the subject matter touching your heart. Questions arise not from confusion but from deepening realization. This is the fruit of consistent sādhana.",
  "Fully absorbed — samādhi in study. Time disappears, the material world recedes, and the words of the ācārya carry direct spiritual potency. Verses illuminate each other without effort. This level comes by the mercy of guru and Kṛṣṇa. Cherish it.",
];

export function DailyLogTab({ dailyLog, setDailyLog, settings, curriculum, courseBooks, japaLog, setJapaLog, scheduleLog, setScheduleLog }: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const endpointHint = getDailyVerseTarget(curriculum, settings, dailyLog);

  // Auto-suggest start location from the most recent end location
  const lastEndLocation =
    [...dailyLog]
      .filter((e) => e.endLocation && parseVerseRef(e.endLocation))
      .sort((a, b) => b.date.localeCompare(a.date))[0]?.endLocation || "";

  // Sorted indices for descending date display (newest first)
  const sortedIndices = useMemo(() =>
    dailyLog.map((_, i) => i).sort((a, b) => (dailyLog[b].date || "").localeCompare(dailyLog[a].date || "")),
    [dailyLog]
  );

  const addEntry = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    setDailyLog((prev) => [emptyEntry(today), ...prev]);
    setExpandedIdx(0);
  };

  const updateEntry = (index: number, field: keyof DailyLogEntry, value: unknown) => {
    setDailyLog((prev) => {
      const updated = [...prev];
      let entry = { ...updated[index], [field]: value };
      if (field === "minutes" && typeof value === "number") {
        entry.hours = value / 60;
      }
      entry = recalcDailyStudyComplete(entry, settings);
      updated[index] = entry;

      // Sync sixteenRounds to Japa and Schedule
      if (field === "sixteenRounds" && setJapaLog && setScheduleLog) {
        const date = entry.date;
        const checked = value as boolean;
        // Sync to Japa
        setJapaLog((prevJapa) => {
          const existing = prevJapa.find((j) => j.date === date);
          if (existing) {
            const rounds = checked ? Math.max(16, existing.rounds || 16) : (existing.rounds && existing.rounds >= 16 ? 0 : existing.rounds ?? 0);
            return prevJapa.map((j) => j.date === date ? { ...j, rounds } : j);
          } else if (checked) {
            return [...prevJapa, { date, rounds: 16, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null }];
          }
          return prevJapa;
        });
        // Sync to Schedule
        setScheduleLog((prevSched) => {
          const existing = prevSched.find((s) => s.date === date);
          if (existing && existing.sixteenRounds !== checked) {
            return prevSched.map((s) => {
              if (s.date !== date) return s;
              const upd = { ...s, sixteenRounds: checked };
              upd.score = calcScore(upd, upd.scheduleItemsSnapshot?.length ? upd.scheduleItemsSnapshot : settings.scheduleItems || [], undefined);
              return upd;
            });
          }
          return prevSched;
        });
      }

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

      <StudyTimer
        dailyLog={dailyLog}
        setDailyLog={setDailyLog}
        curriculum={curriculum}
        settings={settings}
        courseBooks={courseBooks}
      />

      <div className="space-y-2">
        {sortedIndices.map((idx) => {
          const entry = dailyLog[idx];
          return (
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
                      onBlur={(e) => {
                        const normalized = normalizeVerseInput(e.target.value);
                        if (normalized !== e.target.value) updateEntry(idx, "startLocation", normalized);
                      }}
                      className={`input-field ${entry.startLocation && !isValidVerseRef(entry.startLocation) ? "ring-1 ring-amber-400" : ""}`}
                      placeholder={lastEndLocation ? `Continued from ${lastEndLocation}` : "e.g. 3.19"}
                    />
                  </Field>
                  <Field label="Last Verse Read">
                    <input
                      type="text"
                      value={entry.endLocation}
                      onChange={(e) => updateEntry(idx, "endLocation", e.target.value)}
                      onBlur={(e) => {
                        const normalized = normalizeVerseInput(e.target.value);
                        if (normalized !== e.target.value) updateEntry(idx, "endLocation", normalized);
                      }}
                      className={`input-field ${entry.endLocation && !isValidVerseRef(entry.endLocation) ? "ring-1 ring-amber-400" : ""}`}
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

                {/* Study Focus / Intensity */}
                <div className="bg-amber-50 dark:bg-zinc-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Study Focus &amp; Intensity
                    </label>
                    <span className={`text-xs font-bold ${
                      (entry.studyFocusLevel ?? 3) >= 4 ? "text-green-700 dark:text-green-300" :
                      (entry.studyFocusLevel ?? 3) >= 3 ? "text-yellow-700 dark:text-yellow-300" :
                      (entry.studyFocusLevel ?? 3) >= 2 ? "text-orange-700 dark:text-orange-300" :
                      "text-red-700 dark:text-red-300"
                    }`}>
                      {studyFocusLabels[(entry.studyFocusLevel ?? 3) - 1]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-zinc-400 w-4 text-center">1</span>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={entry.studyFocusLevel ?? 3}
                      onChange={(e) => updateEntry(idx, "studyFocusLevel", parseInt(e.target.value))}
                      className="flex-1 accent-amber-600"
                    />
                    <span className="text-xs text-zinc-400 w-4 text-center">5</span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 leading-relaxed">
                    {studyFocusDescriptions[(entry.studyFocusLevel ?? 3) - 1]}
                  </p>
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
          );
        })}
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
