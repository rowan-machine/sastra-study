"use client";

import { JapaEntry, getJapaTarget } from "@/lib/data";
import { format, parseISO, subDays } from "date-fns";
import { Plus, Flame, Info } from "lucide-react";
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

const focusStages: { level: number; title: string; description: string; color: string }[] = [
  {
    level: 1,
    title: "Nāmāparādha (Offensive Chanting)",
    description: "At this level, the mind is almost entirely elsewhere — caught in plans, anxieties, or sense impressions. The syllables of the mantra are on the lips but not in the heart. This is normal for beginners and even happens to experienced chanters on difficult days. The key is: you are still chanting. The holy name is so powerful that even offensive chanting gradually purifies. Don't give up — show up again tomorrow. Śrīla Bhaktivinoda Ṭhākura says: 'The holy name is like the sun, and the offenses are like clouds. Keep chanting and the clouds will pass.'",
    color: "text-red-700 dark:text-red-300",
  },
  {
    level: 2,
    title: "Nāmābhāsa (Shadow of the Name)",
    description: "You are partially present. The mind drifts often, but you catch it and bring it back — sometimes successfully, sometimes not. There is a faint taste forming: moments of peace, occasional feelings of connection to Kṛṣṇa. You may notice that distracted rounds feel heavier while attentive syllables feel lighter. This stage is crucial — it is where most sādhakas live for years. The practice here is patience and gentleness: each time you notice the mind has wandered, that noticing IS the practice. Return to the sound. Harināma Cintāmaṇi describes this as the stage where the sun is behind the clouds — real but obscured.",
    color: "text-orange-700 dark:text-orange-300",
  },
  {
    level: 3,
    title: "Attentive Chanting (Steady Effort)",
    description: "You can sustain attention on the syllables of the mahā-mantra for stretches at a time. The mind still moves, but there is a 'home base' you return to with increasing ease. You begin to notice the difference between mechanical chanting and heard chanting — when you actually hear 'Hare Kṛṣṇa' leaving your lips, the quality shifts. At this level, the practice becomes more about listening than speaking. Śrīla Prabhupāda instructs: 'Chanting means hearing. You chant with your mouth and hear with your ears.' Some days you may feel genuine peace or gratitude arising naturally from the sound.",
    color: "text-yellow-700 dark:text-yellow-300",
  },
  {
    level: 4,
    title: "Ruci (Taste) — The Name Calls You",
    description: "A genuine taste for the holy name is developing. You look forward to your japa time. The mantra sometimes feels like it is pulling you rather than you pushing it. Rounds that once felt like obligation now feel like refuge. You may notice that when life gets hard, your instinct is to reach for the beads. Concentration comes more naturally — not forced, but invited. The mind is quieter during japa than at other times of day. This is the fruit of years of faithful chanting through the lower stages. Śrī Caitanya Mahāprabhu describes this: 'O Holy Name, I have no taste for chanting, yet in Your causeless mercy You have appeared on my tongue.' At level 4, that mercy is becoming tangible.",
    color: "text-green-700 dark:text-green-300",
  },
  {
    level: 5,
    title: "Āsakti / Prema-nāma (Deep Absorption)",
    description: "This is the gold standard — rare and precious. The chanter is fully absorbed in the sound vibration. External awareness fades naturally (not forcefully). There may be tears, hair standing on end, or simply a profound stillness and warmth in the heart. The name and the Named are felt as non-different. Time passes without awareness. You are not chanting the name — the name is chanting you. This level may come in flashes during particularly grace-filled mornings, or in the association of elevated devotees. It cannot be manufactured by technique alone — it is a gift of the holy name to the sincere soul. Rūpa Gosvāmī prays: 'I do not know how much nectar the two syllables Kṛṣ-ṇa have produced. When the holy name dances in the courtyard of the heart, it conquers the activities of the mind.' Aspire to this. It is real. It is what the chanting is for.",
    color: "text-emerald-700 dark:text-emerald-300",
  },
];

export function JapaTab({ japaLog, setJapaLog }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [showFocusGuide, setShowFocusGuide] = useState(false);
  const [newEntryDate, setNewEntryDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Sort descending for display
  const sorted = [...japaLog].sort((a, b) => b.date.localeCompare(a.date));

  const addEntry = () => {
    const exists = japaLog.find((e) => e.date === newEntryDate);
    if (exists) return;
    setJapaLog((prev) => [
      ...prev,
      { date: newEntryDate, rounds: null, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
    ]);
  };

  const updateEntry = (date: string, field: keyof JapaEntry, value: unknown) => {
    setJapaLog((prev) =>
      prev.map((e) => (e.date === date ? { ...e, [field]: value } : e))
    );
  };

  // Stats
  const totalDays = japaLog.filter((e) => e.rounds && e.rounds > 0).length;
  const full16Days = japaLog.filter((e) => e.rounds != null && e.rounds >= getJapaTarget(e.date, japaLog)).length;
  const totalRounds = japaLog.reduce((sum, e) => sum + (e.rounds || 0), 0);

  // Streak: consecutive days with 16 rounds
  const streak = (() => {
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = format(subDays(today, i), "yyyy-MM-dd");
      const entry = sorted.find((e) => e.date === dateStr);
      if (entry && entry.rounds != null && entry.rounds >= getJapaTarget(dateStr, japaLog)) {
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
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">Japa &amp; Sādhana</h2>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">Chant with attention. 16 rounds, every day.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={newEntryDate}
            onChange={(e) => setNewEntryDate(e.target.value)}
            className="input-field text-sm"
          />
          <button
            onClick={addEntry}
            className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Log
          </button>
        </div>
      </div>

      {/* Inspiring quote */}
      <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-xl border border-orange-200 dark:border-orange-800/50">
        <p className="text-sm italic text-orange-800 dark:text-orange-200">{dailyQuote}</p>
      </div>

      {/* Focus/Intensity Guide */}
      <div className="mb-6">
        <button
          onClick={() => setShowFocusGuide(!showFocusGuide)}
          className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 font-medium transition-colors"
        >
          <Info size={16} />
          {showFocusGuide ? "Hide" : "Show"} Japa Focus &amp; Intensity Guide
        </button>
        {showFocusGuide && (
          <div className="mt-4 bg-gradient-to-b from-amber-50 to-orange-50 dark:from-zinc-900 dark:to-zinc-900 rounded-2xl border border-amber-200 dark:border-zinc-700 p-6">
            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-2">The Five Stages of Japa Focus</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5">
              Use the focus slider (1–5) when logging your japa to honestly assess where your attention was during chanting.
              This is not about perfection — it is about self-awareness. Honest assessment is itself a form of humility before the holy name.
              Over time, tracking your focus reveals patterns: when you chant best, what helps, and what distracts.
            </p>
            <div className="space-y-6">
              {focusStages.map((stage) => (
                <div key={stage.level} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border-2 border-amber-300 dark:border-amber-700 flex items-center justify-center font-bold text-amber-800 dark:text-amber-200">
                    {stage.level}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-bold text-sm ${stage.color}`}>{stage.title}</h4>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mt-1">
                      {stage.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-white/80 dark:bg-zinc-800/80 rounded-xl border border-amber-200 dark:border-zinc-700">
              <h4 className="font-bold text-sm text-amber-900 dark:text-amber-100 mb-2">Practical Tips for Improving Focus</h4>
              <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                <li><strong>Chant early</strong> — The brāhma-muhūrta (1.5 hrs before sunrise) is the most sattvic time. The mind is quieter before the world wakes.</li>
                <li><strong>Same place, same time</strong> — Regularity trains the mind to settle. Your japa spot becomes a sacred anchor.</li>
                <li><strong>Pronounce clearly</strong> — Let each syllable be distinct: Ha-re Kṛṣ-ṇa, Ha-re Kṛṣ-ṇa, Kṛṣ-ṇa Kṛṣ-ṇa, Ha-re Ha-re.</li>
                <li><strong>Listen, don&apos;t just speak</strong> — Prabhupāda&apos;s key instruction: chanting means hearing. Direct attention to your ears.</li>
                <li><strong>Count inattentive rounds</strong> — Some devotees redo inattentive rounds. Even the awareness of needing to redo sharpens attention.</li>
                <li><strong>Pray before chanting</strong> — &ldquo;O holy name, please reveal yourself to me. I am fallen but You are merciful.&rdquo;</li>
                <li><strong>Limit pre-japa stimulation</strong> — No phone, no news, no heavy conversation before your rounds.</li>
                <li><strong>Association</strong> — Chant with other devotees periodically. The combined vibration elevates everyone.</li>
              </ul>
            </div>
          </div>
        )}
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
          <p className="text-xs text-zinc-500 mt-0.5">On Target</p>
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
              <th className="p-3 text-center font-medium">Rounds / Target</th>
              <th className="p-3 text-center font-medium">Focus</th>
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
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="64"
                      value={entry.rounds ?? ""}
                      onChange={(e) => updateEntry(entry.date, "rounds", e.target.value ? parseInt(e.target.value) : null)}
                      className={`w-14 text-center input-field ${
                        entry.rounds != null && entry.rounds >= getJapaTarget(entry.date, japaLog)
                          ? "!border-green-400 bg-green-50 dark:bg-green-950/20"
                          : entry.rounds != null && entry.rounds > 0
                          ? "!border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20"
                          : ""
                      }`}
                    />
                    <span className="text-xs text-zinc-400">/ {getJapaTarget(entry.date, japaLog)}</span>
                  </div>
                </td>
                <td className="p-3 text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={entry.focusLevel ?? 3}
                      onChange={(e) => updateEntry(entry.date, "focusLevel", parseInt(e.target.value))}
                      className="w-16 accent-amber-600"
                      title={focusStages[(entry.focusLevel ?? 3) - 1]?.title || ""}
                    />
                    <span className={`text-xs font-medium ${focusStages[(entry.focusLevel ?? 3) - 1]?.color || "text-zinc-500"}`}>
                      {entry.focusLevel ?? 3}
                    </span>
                  </div>
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
