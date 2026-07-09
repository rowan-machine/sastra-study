"use client";

import { JapaEntry } from "@/lib/data";
import { format, parseISO, subDays } from "date-fns";
import { Plus, Flame } from "lucide-react";
import { useState } from "react";

const japaQuotes = [
  "\"Chanting the holy name of the Lord is identical with the Lord. One should not think it is material.\" — CC Ādi 17.22",
  "\"The holy name, character, pastimes and activities of Kṛṣṇa are all transcendentally sweet.\" — CC Madhya 17.133",
  "\"One who chants the holy name of the Lord is immediately freed from all material contamination.\" — SB 6.2.19",
  "\"In this age of quarrel and hypocrisy, the only means of deliverance is chanting the holy name.\" — SB 12.3.51",
  "\"One should chant the holy name of the Lord in a humble state of mind, feeling oneself lower than the straw in the street.\" — Śikṣāṣṭaka 3",
  "\"There is no vow like chanting the holy name, no knowledge superior to it, no meditation which comes anywhere near it.\" — CC Ādi 7.73",
  "\"Even a faint resemblance of the holy name is able to bestow liberation.\" — Padma Purāṇa",
];

interface Props {
  japaLog: JapaEntry[];
  setJapaLog: (value: JapaEntry[] | ((prev: JapaEntry[]) => JapaEntry[])) => void;
}

export function JapaTab({ japaLog, setJapaLog }: Props) {
  const [showAll, setShowAll] = useState(false);

  // Sort descending for display
  const sorted = [...japaLog].sort((a, b) => b.date.localeCompare(a.date));

  const addEntry = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const exists = japaLog.find((e) => e.date === today);
    if (exists) return;
    setJapaLog((prev) => [
      ...prev,
      { date: today, rounds: null, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
    ]);
  };

  const updateEntry = (date: string, field: keyof JapaEntry, value: unknown) => {
    setJapaLog((prev) =>
      prev.map((e) => (e.date === date ? { ...e, [field]: value } : e))
    );
  };

  // Stats
  const totalDays = japaLog.filter((e) => e.rounds && e.rounds > 0).length;
  const full16Days = japaLog.filter((e) => e.rounds && e.rounds >= 16).length;
  const totalRounds = japaLog.reduce((sum, e) => sum + (e.rounds || 0), 0);

  // Streak: consecutive days with 16 rounds
  const streak = (() => {
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = format(subDays(today, i), "yyyy-MM-dd");
      const entry = sorted.find((e) => e.date === dateStr);
      if (entry && entry.rounds && entry.rounds >= 16) {
        count++;
      } else {
        break;
      }
    }
    return count;
  })();

  const displayLog = showAll ? sorted : sorted.slice(0, 14);
  const dailyQuote = japaQuotes[new Date().getDate() % japaQuotes.length];

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">Japa &amp; Sādhana</h2>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">Chant with attention. 16 rounds, every day.</p>
        </div>
        <button
          onClick={addEntry}
          className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Log Today
        </button>
      </div>

      {/* Inspiring quote */}
      <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-xl border border-orange-200 dark:border-orange-800/50">
        <p className="text-sm italic text-orange-800 dark:text-orange-200">{dailyQuote}</p>
      </div>

      {/* Streak hero */}
      <div className="mb-6 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl p-6 text-white flex items-center justify-between">
        <div>
          <p className="text-amber-100 text-sm font-medium uppercase tracking-wide">16-Round Streak</p>
          <p className="text-4xl font-black mt-1">{streak} day{streak !== 1 ? "s" : ""}</p>
          <p className="text-amber-100 text-xs mt-1">
            {streak >= 20 ? "Incredible dedication!" :
             streak >= 7 ? "Building a fortress of spiritual strength!" :
             streak >= 3 ? "Momentum is building — keep going!" :
             "Every day counts. Start strong today."}
          </p>
        </div>
        <Flame size={56} className="text-orange-200 opacity-60" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-4 text-center">
          <p className="text-2xl font-bold text-amber-800 dark:text-amber-100">{totalRounds.toLocaleString()}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Total Rounds</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-4 text-center">
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">{full16Days}/{totalDays}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Full 16 Rounds</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-4 text-center">
          <p className="text-2xl font-bold text-amber-800 dark:text-amber-100">
            {totalDays > 0 ? `${Math.round((full16Days / totalDays) * 100)}%` : "—"}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">Completion</p>
        </div>
      </div>

      {/* Log table — descending order */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-amber-100 dark:bg-zinc-800">
              <th className="p-3 text-left font-medium">Date</th>
              <th className="p-3 text-center font-medium">Rounds</th>
              <th className="p-3 text-center font-medium">Maṅgala Āratī</th>
              <th className="p-3 text-center font-medium">Bhoga Āratī</th>
              <th className="p-3 text-center font-medium">Gaura Āratī</th>
              <th className="p-3 text-center font-medium">Prasādam</th>
            </tr>
          </thead>
          <tbody>
            {displayLog.map((entry) => (
              <tr key={entry.date} className="border-t border-amber-100 dark:border-zinc-800 hover:bg-amber-50 dark:hover:bg-zinc-800/50">
                <td className="p-3 font-medium text-amber-800 dark:text-amber-200">
                  {format(parseISO(entry.date), "EEE, MMM d")}
                  {entry.date === format(new Date(), "yyyy-MM-dd") && (
                    <span className="ml-2 text-xs bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-100 px-1.5 py-0.5 rounded">Today</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  <input
                    type="number"
                    min="0"
                    max="64"
                    value={entry.rounds ?? ""}
                    onChange={(e) => updateEntry(entry.date, "rounds", e.target.value ? parseInt(e.target.value) : null)}
                    className={`w-16 text-center input-field ${
                      entry.rounds && entry.rounds >= 16
                        ? "!border-green-400 bg-green-50 dark:bg-green-950/20"
                        : entry.rounds && entry.rounds > 0
                        ? "!border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20"
                        : ""
                    }`}
                  />
                </td>
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={entry.mangalaArati}
                    onChange={(e) => updateEntry(entry.date, "mangalaArati", e.target.checked)}
                    className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                </td>
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={entry.bhogaArati}
                    onChange={(e) => updateEntry(entry.date, "bhogaArati", e.target.checked)}
                    className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                </td>
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={entry.gauraArati}
                    onChange={(e) => updateEntry(entry.date, "gauraArati", e.target.checked)}
                    className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                </td>
                <td className="p-3 text-center">
                  <input
                    type="number"
                    min="0"
                    value={entry.prasadam ?? ""}
                    onChange={(e) => updateEntry(entry.date, "prasadam", e.target.value ? parseInt(e.target.value) : null)}
                    className="w-16 text-center input-field"
                    placeholder="—"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length > 14 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full p-3 text-center text-sm text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-zinc-800/50 border-t border-amber-100 dark:border-zinc-800"
          >
            {showAll ? "Show recent" : `Show all ${sorted.length} entries`}
          </button>
        )}
      </div>
    </div>
  );
}
