"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, ChevronDown, ChevronUp, ExternalLink, Sparkles } from "lucide-react";
import {
  DiscipleLesson,
  InitiationCriterionId,
  InitiationCriterionScore,
  JapaEntry,
  ScheduleDay,
  SavedAnswer,
  SevaEntry,
  SpiritualMaster,
  initiationCriteria,
} from "@/lib/data";
import { computeReadiness } from "@/lib/initiationReadiness";
import { loadAllSections, loadEntry, sourceUrlWithFragment } from "@/lib/prabhupadaCorpus";
import type { PrabhupadaManifestEntry } from "@/lib/data";

interface Props {
  spiritualMaster: SpiritualMaster;
  setSpiritualMaster: (v: SpiritualMaster | ((prev: SpiritualMaster) => SpiritualMaster)) => void;
  japaLog: JapaEntry[];
  scheduleLog: ScheduleDay[];
  sevaLog: SevaEntry[];
  discipleLessons: DiscipleLesson[];
  savedAnswers: SavedAnswer[];
  setSavedAnswers: (v: SavedAnswer[] | ((prev: SavedAnswer[]) => SavedAnswer[])) => void;
}

// Keywords used to suggest the most-relevant corpus entry per criterion.
const criterionKeywords: Record<InitiationCriterionId, RegExp> = {
  "sixteen-rounds": /sixteen|16 round|chant.*round|round.*chant|japa/i,
  "four-regs": /regulative|four principle|meat|intoxicat|gambling|illicit/i,
  "daily-study": /study|read.*book|bhagavad|śrīmad|śāstra|reading/i,
  "morning-program": /maṅgala|mangala|arati|morning program|early rise|4[: ]am|3[: ]30/i,
  "seva": /seva|service|serving|render/i,
  "guru-tattva": /guru|paramparā|para.?mpara|ācārya|spiritual master/i,
  "diksa-vows": /dīkṣā|diksa|initiation|vow/i,
  "senior-recommendation": /recommend|senior|initiat/i,
  "time-following-practice": /six months|steady|following.*year|regulate|practice/i,
};

const bucketStyles: Record<InitiationCriterionScore["bucket"], string> = {
  red: "bg-red-500 text-white",
  amber: "bg-amber-500 text-white",
  lime: "bg-lime-500 text-white",
  green: "bg-emerald-500 text-white",
};

export function InitiationReadinessSection({
  spiritualMaster,
  setSpiritualMaster,
  japaLog,
  scheduleLog,
  sevaLog,
  discipleLessons,
  savedAnswers,
  setSavedAnswers,
}: Props) {
  const [expanded, setExpanded] = useState<InitiationCriterionId | null>(null);
  const [corpus, setCorpus] = useState<PrabhupadaManifestEntry[]>([]);

  useEffect(() => {
    let alive = true;
    loadAllSections().then((all) => {
      if (alive) setCorpus(all);
    });
    return () => {
      alive = false;
    };
  }, []);

  const readiness = useMemo(
    () => computeReadiness({ japaLog, scheduleLog, sevaLog, discipleLessons, spiritualMaster }),
    [japaLog, scheduleLog, sevaLog, discipleLessons, spiritualMaster]
  );

  const setNote = (id: InitiationCriterionId, note: string) => {
    setSpiritualMaster((prev) => ({
      ...prev,
      readinessNotes: { ...(prev.readinessNotes || {}), [id]: note },
    }));
  };

  const suggestFor = (id: InitiationCriterionId): PrabhupadaManifestEntry | null => {
    const re = criterionKeywords[id];
    for (const e of corpus) {
      const hay = `${e.title} ${(e.tags || []).join(" ")}`;
      if (re.test(hay)) return e;
    }
    return null;
  };

  return (
    <div className="bg-white/60 dark:bg-zinc-900/50 rounded-2xl border border-amber-300 dark:border-amber-800/50 p-5 mt-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <ReadinessRing value={readiness.overall} bucket={readiness.bucket} />
          <div>
            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <Award size={18} /> Initiation Readiness
            </h3>
            <p className="text-xs text-zinc-500">
              Data-driven from your japa, schedule, sevā, and Disciple Course logs.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-1 text-right">
          <label className="text-[10px] text-amber-700 dark:text-amber-400 uppercase tracking-wide">
            Target initiation date
          </label>
          <input
            type="date"
            value={spiritualMaster.targetInitiationDate || ""}
            onChange={(e) =>
              setSpiritualMaster((prev) => ({ ...prev, targetInitiationDate: e.target.value }))
            }
            className="input-field !py-1 !text-xs bg-white/80 dark:bg-zinc-900/80"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {readiness.scores.map((s) => {
          const meta = initiationCriteria.find((c) => c.id === s.criterionId)!;
          const isOpen = expanded === s.criterionId;
          const suggestion = suggestFor(s.criterionId);
          const note = spiritualMaster.readinessNotes?.[s.criterionId] || "";
          return (
            <div
              key={s.criterionId}
              className="rounded-xl border border-amber-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {meta.title}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{s.evidence}</p>
                </div>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${bucketStyles[s.bucket]}`}
                  title={meta.description}
                >
                  {s.score}
                </span>
              </div>

              {s.trend.length > 0 && <Sparkline data={s.trend} />}

              <div className="mt-2 flex gap-2 text-xs">
                <button
                  onClick={() => setExpanded(isOpen ? null : s.criterionId)}
                  className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 hover:underline"
                >
                  {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Learn more
                </button>
              </div>

              {isOpen && (
                <div className="mt-2 pt-2 border-t border-amber-100 dark:border-zinc-800 space-y-2">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">{meta.description}</p>
                  {suggestion ? (
                    <button
                      onClick={async () => {
                        const full = await loadEntry(suggestion);
                        const url = sourceUrlWithFragment(suggestion.sourceUrl, full?.text || "");
                        window.open(url, "_blank", "noopener,noreferrer");
                      }}
                      className="text-xs inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 underline"
                    >
                      Prabhupāda source: {suggestion.title} <ExternalLink size={10} />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const prompt = `Find Śrīla Prabhupāda's definitive teaching on "${meta.title}" (${meta.description}). Search the corpus in public/prabhupada/**. Return the best quote plus its sourceUrl.`;
                        navigator.clipboard.writeText(prompt);
                      }}
                      className="text-xs inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    >
                      <Sparkles size={11} /> Copy Ask-Cascade prompt for this criterion
                    </button>
                  )}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wide text-zinc-500 mb-1">
                      Personal notes
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(s.criterionId, e.target.value)}
                      className="input-field w-full text-xs min-h-[60px]"
                      placeholder="Private notes, reflections, plans..."
                    />
                  </div>
                  {suggestion && (
                    <button
                      onClick={() => {
                        const a: SavedAnswer = {
                          id: `sa-${Date.now()}`,
                          entryId: suggestion.id,
                          entryType: suggestion.type,
                          quote: suggestion.title,
                          title: suggestion.title,
                          sourceUrl: suggestion.sourceUrl,
                          savedAt: new Date().toISOString(),
                          notes: `Saved from Initiation Readiness (${meta.title})`,
                        };
                        setSavedAnswers((prev) => [a, ...prev]);
                      }}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/50"
                    >
                      Save to my Saved Answers
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {savedAnswers.length > 0 && (
        <p className="text-[11px] text-zinc-500 mt-4">
          {savedAnswers.length} saved Prabhupāda source{savedAnswers.length === 1 ? "" : "s"}. View them in the Prabhupāda Library → Questions Log tab.
        </p>
      )}
    </div>
  );
}

function ReadinessRing({ value, bucket }: { value: number; bucket: InitiationCriterionScore["bucket"] }) {
  const color =
    bucket === "green" ? "#10b981" : bucket === "lime" ? "#84cc16" : bucket === "amber" ? "#f59e0b" : "#ef4444";
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg viewBox="0 0 64 64" className="w-16 h-16 shrink-0">
      <circle cx="32" cy="32" r="28" stroke="#f5f5f4" strokeWidth="6" fill="none" />
      <circle
        cx="32"
        cy="32"
        r="28"
        stroke={color}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 32 32)"
      />
      <text x="32" y="37" textAnchor="middle" className="fill-current text-zinc-800 dark:text-zinc-100" fontSize="15" fontWeight="600">
        {value}
      </text>
    </svg>
  );
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length === 0) return null;
  const w = 120;
  const h = 24;
  const max = 100;
  const step = w / Math.max(1, data.length - 1);
  const pts = data
    .map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-6 mt-2">
      <polyline points={pts} fill="none" stroke="#f59e0b" strokeWidth="1.5" />
    </svg>
  );
}
