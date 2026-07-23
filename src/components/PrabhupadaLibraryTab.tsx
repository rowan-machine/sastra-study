"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  BookOpen,
  ExternalLink,
  HelpCircle,
  Library,
  MessageSquare,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  PrabhupadaEntryType,
  PrabhupadaManifestEntry,
  QuestionEntry,
  SavedAnswer,
} from "@/lib/data";
import {
  filterEntries,
  loadAllSections,
  loadCorpusManifest,
  loadEntry,
  sourceUrlWithFragment,
} from "@/lib/prabhupadaCorpus";

function openAnswerSource(a: SavedAnswer) {
  const url = sourceUrlWithFragment(a.sourceUrl, a.quote || a.title || "");
  window.open(url, "_blank", "noopener,noreferrer");
}

type SubTab = "browse" | "questions";

interface Props {
  questions: QuestionEntry[];
  setQuestions: (v: QuestionEntry[] | ((prev: QuestionEntry[]) => QuestionEntry[])) => void;
  savedAnswers: SavedAnswer[];
  setSavedAnswers: (v: SavedAnswer[] | ((prev: SavedAnswer[]) => SavedAnswer[])) => void;
}

export function PrabhupadaLibraryTab({ questions, setQuestions, savedAnswers, setSavedAnswers }: Props) {
  const [subTab, setSubTab] = useState<SubTab>("browse");
  const [askOpen, setAskOpen] = useState(false);
  const [askSeed, setAskSeed] = useState("");

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
            <Library size={22} /> Prabhupāda Library
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Local corpus scraped from{" "}
            <a href="https://vedabase.cc" target="_blank" rel="noreferrer" className="underline">
              vedabase.cc
            </a>{" "}
            for offline study. Personal use only.
          </p>
        </div>
        <button
          onClick={() => {
            setAskSeed("");
            setAskOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Sparkles size={14} /> Ask Cascade
        </button>
      </div>

      <div className="flex gap-1 mb-6 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg w-fit">
        {[
          { id: "browse" as SubTab, label: "Browse", icon: BookOpen },
          { id: "questions" as SubTab, label: "Questions Log", icon: HelpCircle },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              subTab === id
                ? "bg-white dark:bg-zinc-900 text-amber-800 dark:text-amber-200 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {subTab === "browse" && <BrowseSection />}
      {subTab === "questions" && (
        <QuestionsLog
          questions={questions}
          setQuestions={setQuestions}
          savedAnswers={savedAnswers}
          setSavedAnswers={setSavedAnswers}
          openAsk={(seed) => {
            setAskSeed(seed);
            setAskOpen(true);
          }}
        />
      )}

      {askOpen && (
        <AskCascadeModal
          seed={askSeed}
          onClose={() => setAskOpen(false)}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------------
// Browse
// -------------------------------------------------------------------
function BrowseSection() {
  const [entries, setEntries] = useState<PrabhupadaManifestEntry[]>([]);
  const [manifestNote, setManifestNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<PrabhupadaEntryType | "all">("all");
  const [keyword, setKeyword] = useState("");
  const [tag, setTag] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      const [all, manifest] = await Promise.all([loadAllSections(), loadCorpusManifest()]);
      if (!alive) return;
      setEntries(all);
      setManifestNote(manifest?.note || null);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(
    () => filterEntries(entries, { type, keyword, tag, dateFrom, dateTo }),
    [entries, type, keyword, tag, dateFrom, dateTo]
  );

  const allTags = useMemo(() => {
    const s = new Set<string>();
    for (const e of entries) for (const t of e.tags || []) s.add(t);
    return Array.from(s).sort();
  }, [entries]);

  return (
    <div className="space-y-4">
      {manifestNote && entries.length === 0 && !loading && (
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-sm text-amber-900 dark:text-amber-200">
          <strong>Corpus not yet populated.</strong> Run{" "}
          <code className="px-1.5 py-0.5 rounded bg-white/60 dark:bg-black/30 text-xs">
            npm run scrape:prabhupada
          </code>{" "}
          to fetch Q&amp;A, lectures, and morning walks from vedabase.cc. The scraper is polite (~1 req/sec) and resumable.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search title, location, tag..."
            className="input-field !pl-9 w-full"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as PrabhupadaEntryType | "all")}
          className="input-field"
        >
          <option value="all">All types</option>
          <option value="qa">Q&amp;A</option>
          <option value="lecture">Lectures</option>
          <option value="morning-walk">Morning walks</option>
        </select>
        <select value={tag} onChange={(e) => setTag(e.target.value)} className="input-field">
          <option value="">All tags</option>
          {allTags.slice(0, 200).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <div className="flex gap-2 md:col-span-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input-field flex-1"
            placeholder="From"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="input-field flex-1"
            placeholder="To"
          />
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        {loading ? "Loading..." : `${filtered.length} of ${entries.length} entries`}
      </p>

      <div className="space-y-2">
        {filtered.slice(0, 200).map((e) => (
          <button
            key={e.id}
            onClick={async () => {
              const full = await loadEntry(e);
              const url = sourceUrlWithFragment(e.sourceUrl, full?.text || "");
              window.open(url, "_blank", "noopener,noreferrer");
            }}
            className="block w-full text-left p-3 rounded-lg bg-white dark:bg-zinc-900 border border-amber-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-700 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {e.title || "Untitled"}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                    {e.type === "qa" ? "Q&A" : e.type === "morning-walk" ? "Morning walk" : "Lecture"}
                  </span>
                  {e.date && <span>{e.date}</span>}
                  {e.location && <span>· {e.location}</span>}
                </div>
                {(e.tags || []).length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {e.tags.slice(0, 6).map((t) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <ExternalLink size={14} className="text-zinc-400 shrink-0 mt-0.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Questions Log
// -------------------------------------------------------------------
function QuestionsLog({
  questions,
  setQuestions,
  savedAnswers,
  setSavedAnswers,
  openAsk,
}: {
  questions: QuestionEntry[];
  setQuestions: Props["setQuestions"];
  savedAnswers: SavedAnswer[];
  setSavedAnswers: Props["setSavedAnswers"];
  openAsk: (seed: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const addQuestion = () => {
    const q: QuestionEntry = {
      id: `q-${Date.now()}`,
      question: "",
      context: "",
      dateAsked: format(new Date(), "yyyy-MM-dd"),
      status: "open",
      potentialResponses: "",
      answer: "",
      source: "",
      actionsToTake: "",
    };
    setQuestions((prev) => [q, ...prev]);
    setEditingId(q.id);
  };

  const updateQuestion = (id: string, patch: Partial<QuestionEntry>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const deleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    setSavedAnswers((prev) => prev.filter((a) => a.questionId !== id));
  };

  const filtered = questions.filter((q) => {
    if (!search) return true;
    const hay = `${q.question} ${q.context} ${q.answer} ${q.source} ${q.actionsToTake}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  });

  const openCount = questions.filter((q) => q.status === "open").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="input-field !pl-9 w-full"
          />
        </div>
        <p className="text-xs text-zinc-500">
          {questions.length} questions ({openCount} open)
        </p>
        <button
          onClick={addQuestion}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={14} /> Add
        </button>
      </div>

      <div className="space-y-3">
        {filtered.map((q) => {
          const isEditing = editingId === q.id;
          const answers = savedAnswers.filter((a) => a.questionId === q.id);
          return (
            <div
              key={q.id}
              className={`bg-white dark:bg-zinc-900 rounded-xl border p-4 ${
                q.status === "resolved"
                  ? "border-green-200 dark:border-green-800/50"
                  : "border-amber-200 dark:border-amber-800/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() =>
                    updateQuestion(q.id, {
                      status: q.status === "open" ? "resolved" : "open",
                    })
                  }
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    q.status === "resolved"
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-amber-400 hover:border-amber-600"
                  }`}
                  title={q.status === "resolved" ? "Re-open" : "Mark resolved"}
                >
                  {q.status === "resolved" && <span className="text-xs">✓</span>}
                </button>

                <div className="flex-1 space-y-3 min-w-0">
                  {isEditing ? (
                    <input
                      value={q.question}
                      onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                      className="input-field font-medium w-full"
                      placeholder="What is your question?"
                    />
                  ) : (
                    <h3
                      className={`font-medium ${
                        q.status === "resolved" ? "line-through text-zinc-400" : "text-zinc-900 dark:text-zinc-100"
                      }`}
                    >
                      {q.question || "Untitled question"}
                    </h3>
                  )}

                  {isEditing ? (
                    <textarea
                      value={q.context}
                      onChange={(e) => updateQuestion(q.id, { context: e.target.value })}
                      className="input-field text-sm w-full min-h-[60px]"
                      placeholder="Context (e.g. BG 3.37 purport)"
                    />
                  ) : (
                    q.context && (
                      <p className="text-xs text-zinc-500">
                        <span className="font-semibold text-zinc-600 dark:text-zinc-400">Context:</span> {q.context}
                      </p>
                    )
                  )}

                  <Field
                    label="My reflection"
                    value={q.potentialResponses}
                    isEditing={isEditing}
                    onChange={(v) => updateQuestion(q.id, { potentialResponses: v })}
                    color="text-amber-700 dark:text-amber-300"
                  />
                  <Field
                    label="Received answer"
                    value={q.answer}
                    isEditing={isEditing}
                    onChange={(v) => updateQuestion(q.id, { answer: v })}
                    color="text-indigo-700 dark:text-indigo-300"
                  />
                  <Field
                    label="Source"
                    value={q.source}
                    isEditing={isEditing}
                    onChange={(v) => updateQuestion(q.id, { source: v })}
                    color="text-zinc-600 dark:text-zinc-400"
                  />
                  <Field
                    label="Actions to take"
                    value={q.actionsToTake}
                    isEditing={isEditing}
                    onChange={(v) => updateQuestion(q.id, { actionsToTake: v })}
                    color="text-emerald-700 dark:text-emerald-300"
                  />

                  {answers.length > 0 && (
                    <div className="border-t border-amber-100 dark:border-zinc-800 pt-3 space-y-2">
                      <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide flex items-center gap-1">
                        <Save size={11} /> Saved Prabhupāda answers
                      </div>
                      {answers.map((a) => (
                        <div key={a.id} className="p-2 rounded-md bg-amber-50 dark:bg-amber-950/30 text-xs">
                          <div className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">{a.quote}</div>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <button
                              onClick={() => openAnswerSource(a)}
                              className="text-amber-700 dark:text-amber-300 underline inline-flex items-center gap-1"
                            >
                              {a.title || "Source"} <ExternalLink size={10} />
                            </button>
                            <button
                              onClick={() => setSavedAnswers((prev) => prev.filter((x) => x.id !== a.id))}
                              className="text-red-400 hover:text-red-600"
                              title="Remove saved answer"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() =>
                        openAsk(
                          `Find Śrīla Prabhupāda's guidance on: ${q.question}\nContext: ${q.context}\nSearch the corpus in public/prabhupada/**.`
                        )
                      }
                      className="text-xs px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50 flex items-center gap-1"
                    >
                      <Sparkles size={11} /> Find in Prabhupāda corpus
                    </button>
                    <button
                      onClick={() => {
                        const url = window.prompt("Paste vedabase.cc source URL:");
                        if (!url) return;
                        const quote = window.prompt("Paste the quote:");
                        if (!quote) return;
                        const title = window.prompt("Short label (e.g. 'Morning Walk, 1972-06-14'):") || url;
                        const a: SavedAnswer = {
                          id: `sa-${Date.now()}`,
                          questionId: q.id,
                          entryId: url,
                          entryType: url.includes("/qa/") ? "qa" : url.includes("walk") ? "morning-walk" : "lecture",
                          quote,
                          title,
                          sourceUrl: url,
                          savedAt: new Date().toISOString(),
                        };
                        setSavedAnswers((prev) => [a, ...prev]);
                        if (!q.answer) updateQuestion(q.id, { answer: quote, source: title });
                      }}
                      className="text-xs px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1"
                    >
                      <Save size={11} /> Save answer
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => setEditingId(isEditing ? null : q.id)}
                    className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 text-xs font-medium"
                  >
                    {isEditing ? "Done" : "Edit"}
                  </button>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  isEditing,
  onChange,
  color,
}: {
  label: string;
  value: string | undefined;
  isEditing: boolean;
  onChange: (v: string) => void;
  color: string;
}) {
  const safeValue = value ?? "";
  const hasValue = safeValue.trim().length > 0;
  return (
    <div className="pt-2 border-t border-amber-100 dark:border-zinc-800">
      <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1 ${color}`}>{label}</label>
      {isEditing ? (
        <textarea
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
          className="input-field text-sm min-h-[60px] w-full"
        />
      ) : (
        <div
          className={`text-sm whitespace-pre-wrap leading-relaxed ${
            hasValue ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 italic"
          }`}
        >
          {hasValue ? safeValue : "—"}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------------
// Ask Cascade modal
// -------------------------------------------------------------------
function AskCascadeModal({ seed, onClose }: { seed: string; onClose: () => void }) {
  const template =
    seed ||
    `Find Śrīla Prabhupāda's guidance on: <question>\nContext: <context>\nSearch the corpus in public/prabhupada/**. Return the definitive quote with its sourceUrl.`;
  const [text, setText] = useState(template);
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-amber-800/50 max-w-lg w-full p-5 shadow-xl"
      >
        <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2 mb-2">
          <MessageSquare size={18} /> Ask Cascade
        </h3>
        <p className="text-xs text-zinc-500 mb-3">
          Copy this prompt into your Cascade chat. I&apos;ll read <code>public/prabhupada/**</code> and return the definitive quote with its <code>sourceUrl</code>.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input-field w-full min-h-[140px] text-sm font-mono"
        />
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={() => {
              navigator.clipboard.writeText(text);
            }}
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-md text-sm"
          >
            Copy
          </button>
          <button onClick={onClose} className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
