"use client";

import { VerseMemory, curriculumBooks, getBookAbbreviation, autoDetectPriority } from "@/lib/data";
import { lookupVerse } from "@/lib/verseDatabase";
import { useState, useEffect, useMemo } from "react";
import { slokaLibrary, SlokaEntry, Difficulty } from "@/lib/slokaLibrary";
import { Filter, Plus, Search, Trash2, BookOpen, Play } from "lucide-react";
import { SlokaPractice } from "./SlokaPractice";

interface Props {
  verseMemory: VerseMemory[];
  setVerseMemory: (value: VerseMemory[] | ((prev: VerseMemory[]) => VerseMemory[])) => void;
  focusVerseId?: string | null;
  onFocusConsumed?: () => void;
}

export function VerseMemoryTab({ verseMemory, setVerseMemory, focusVerseId, onFocusConsumed }: Props) {
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterBook, setFilterBook] = useState<string>("all");
  const [quickBook, setQuickBook] = useState<string>(curriculumBooks[0]);
  const [quickChapter, setQuickChapter] = useState("");
  const [quickVerse, setQuickVerse] = useState("");
  const [bookSearch, setBookSearch] = useState("");
  const [quickBookSearch, setQuickBookSearch] = useState("");
  const [isQuickBookOpen, setIsQuickBookOpen] = useState(false);
  const [slokaSearch, setSlokaSearch] = useState("");
  const [isSlokaOpen, setIsSlokaOpen] = useState(false);
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [verseSearch, setVerseSearch] = useState("");

  const filteredBooks = useMemo(() => {
    const term = bookSearch.trim().toLowerCase();
    if (!term) return curriculumBooks;
    return curriculumBooks.filter((b) => {
      const lowerB = b.toLowerCase();
      const abbr = getBookAbbreviation(b).toLowerCase();
      return lowerB.includes(term) || term.includes(lowerB) || abbr.includes(term) || term.includes(abbr);
    });
  }, [bookSearch]);

  const quickBookFiltered = useMemo(() => {
    const term = quickBookSearch.trim().toLowerCase();
    if (!term) return curriculumBooks;
    return curriculumBooks.filter((b) => {
      const lowerB = b.toLowerCase();
      const abbr = getBookAbbreviation(b).toLowerCase();
      return lowerB.includes(term) || term.includes(lowerB) || abbr.includes(term) || term.includes(abbr);
    });
  }, [quickBookSearch]);

  const filteredSlokas = useMemo(() => {
    const raw = slokaSearch.trim().toLowerCase();
    const terms = raw.split(/\s+/).filter(Boolean);
    const base = terms.length
      ? slokaLibrary.filter((s) => {
          const haystack = `${s.reference} ${s.source} ${s.translation} ${s.text} ${s.meter}`.toLowerCase();
          return terms.every((t) => haystack.includes(t));
        })
      : slokaLibrary;
    return base.slice(0, 12);
  }, [slokaSearch]);

  const slokaById = useMemo(() => {
    const map: Record<string, SlokaEntry> = {};
    for (const s of slokaLibrary) map[s.id] = s;
    return map;
  }, []);

  useEffect(() => {
    const next = verseMemory.map((v) => {
      const s = slokaById[v.id];
      if (!s) return v;
      if (v.verseText === s.text && v.theme === s.translation) return v;
      return { ...v, verseText: s.text, theme: s.translation };
    });
    if (next.some((v, i) => v !== verseMemory[i])) {
      setVerseMemory(next);
    }
  }, [verseMemory, slokaById, setVerseMemory]);

  // Close quick book dropdown when clicking outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-quickbook-dropdown]")) {
        setIsQuickBookOpen(false);
      }
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (focusVerseId) {
      const verse = verseMemory.find((v) => v.id === focusVerseId);
      if (verse) {
        const timeout = setTimeout(() => {
          setFilterMonth(verse.monthPhase || "all");
          setFilterBook(verse.source || "all");
          setFilterPriority(verse.priority === "Core" ? "all" : verse.priority || "all");
          const el = document.getElementById(`verse-${focusVerseId}`);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 0);
        return () => clearTimeout(timeout);
      }
      onFocusConsumed?.();
    }
  }, [focusVerseId, verseMemory, onFocusConsumed]);

  const months = [...new Set(verseMemory.map((v) => v.monthPhase))];

  const filtered = verseMemory.filter((v) => {
    if (filterMonth !== "all" && v.monthPhase !== filterMonth) return false;
    if (filterPriority !== "all" && v.priority !== filterPriority) return false;
    if (filterBook !== "all") {
      const sameBook =
        v.source === filterBook ||
        getBookAbbreviation(v.source || "") === getBookAbbreviation(filterBook);
      if (!sameBook) return false;
    }
    const raw = verseSearch.trim().toLowerCase();
    const terms = raw.split(/\s+/).filter(Boolean);
    if (terms.length) {
      const haystack = `${v.versePassage} ${v.source} ${v.theme} ${v.verseText} ${v.contextNotes} ${v.reflection}`.toLowerCase();
      if (!terms.every((t) => haystack.includes(t))) return false;
    }
    return true;
  });

  const totalPassages = verseMemory.length;
  const mastered = verseMemory.filter((v) => v.mastered).length;
  const learned = verseMemory.filter((v) => v.learned).length;

  const updateVerse = (id: string, field: keyof VerseMemory, value: unknown) => {
    setVerseMemory((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const deleteVerse = (id: string) => {
    setVerseMemory((prev) => prev.filter((v) => v.id !== id));
  };

  const priorityForSloka = (difficulty: Difficulty): VerseMemory["priority"] => {
    switch (difficulty) {
      case "easy":
      case "easy-medium":
      case "medium":
        return "Core";
      case "medium-hard":
        return "Support";
      case "hard":
        return "Advanced";
      default:
        return "Core";
    }
  };

  const makeVerseFromSloka = (s: SlokaEntry): VerseMemory => ({
    id: s.id,
    monthPhase: "Sloka Practice",
    source: s.source,
    versePassage: s.reference,
    verseText: s.text,
    theme: s.translation,
    priority: priorityForSloka(s.difficulty),
    learned: false,
    meaningUnderstood: false,
    canRecite: false,
    review1: false,
    review1W: false,
    review1M: false,
    mastered: false,
    contextNotes: s.meter,
    reflection: s.group || "",
  });

  const addSloka = (s: SlokaEntry) => {
    setVerseMemory((prev) => (prev.some((v) => v.id === s.id) ? prev : [makeVerseFromSloka(s), ...prev]));
  };

  const handleQuickAdd = () => {
    const ch = quickChapter.trim();
    if (!ch) return;
    const v = quickVerse.trim();
    const passage = v ? `${ch}.${v}` : `Ch. ${ch}`;
    const bookAbbr = getBookAbbreviation(quickBook);
    const label = bookAbbr ? `${bookAbbr} ${passage}` : `${quickBook} ${passage}`;

    const autoText = lookupVerse(label);
    const detectedPriority = autoDetectPriority(label, quickBook);
    const newVerse: VerseMemory = {
      id: `v-${Date.now()}`,
      monthPhase: "Added while reading",
      source: quickBook,
      versePassage: label,
      verseText: autoText,
      theme: "",
      priority: detectedPriority,
      learned: false,
      meaningUnderstood: false,
      canRecite: false,
      review1: false,
      review1W: false,
      review1M: false,
      mastered: false,
      contextNotes: "",
      reflection: "",
    };
    setVerseMemory((prev) => [newVerse, ...prev]);
    setQuickChapter("");
    setQuickVerse("");
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">Verse Memory System</h2>
        <div className="flex gap-3 text-sm">
          <span className="px-2 py-1 bg-amber-100 dark:bg-zinc-800 rounded text-amber-800 dark:text-amber-200">
            {totalPassages} passages
          </span>
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-700 dark:text-blue-300">
            {learned} learned
          </span>
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded text-green-700 dark:text-green-300">
            {mastered} mastered
          </span>
        </div>
      </div>

      {/* Quick Add */}
      <div className="mb-6 p-4 bg-amber-50 dark:bg-zinc-800/50 rounded-xl border border-amber-200 dark:border-zinc-700">
        <p className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-2">Add verse to memorize</p>
        <div className="flex items-end gap-2 flex-wrap">
          <div className="relative" data-quickbook-dropdown>
            <label className="block text-xs text-zinc-500 mb-1">Book</label>
            <button
              type="button"
              onClick={() => setIsQuickBookOpen((v) => !v)}
              className="input-field text-sm w-[220px] text-left flex items-center justify-between"
              aria-haspopup="listbox"
              aria-expanded={isQuickBookOpen}
            >
              <span className="truncate">{getBookAbbreviation(quickBook) || quickBook}</span>
              <Search size={12} className="text-zinc-400 flex-shrink-0 ml-2" />
            </button>
            {isQuickBookOpen && (
              <div className="absolute z-20 mt-1 w-[280px] bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 p-2">
                <div className="relative mb-1">
                  <Search size={12} className="absolute left-2 top-2.5 text-zinc-400" />
                  <input
                    type="text"
                    value={quickBookSearch}
                    onChange={(e) => setQuickBookSearch(e.target.value)}
                    placeholder="Search books..."
                    className="input-field text-sm w-full pl-7"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-auto">
                  {quickBookFiltered.map((b) => {
                    const abbr = getBookAbbreviation(b);
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => {
                          setQuickBook(b);
                          setQuickBookSearch("");
                          setIsQuickBookOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center justify-between hover:bg-amber-50 dark:hover:bg-zinc-800 ${b === quickBook ? "bg-amber-100 dark:bg-amber-900/20" : ""}`}
                      >
                        <span className="truncate pr-2" title={b}>{b}</span>
                        {abbr && <span className="text-xs text-zinc-500 flex-shrink-0">{abbr}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Chapter</label>
            <input
              type="text"
              value={quickChapter}
              onChange={(e) => setQuickChapter(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
              placeholder="4"
              className="input-field text-sm w-[60px]"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Verse</label>
            <input
              type="text"
              value={quickVerse}
              onChange={(e) => setQuickVerse(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
              placeholder="9"
              className="input-field text-sm w-[60px]"
            />
          </div>
          <button
            onClick={handleQuickAdd}
            disabled={!quickChapter.trim()}
            className="flex items-center gap-1 px-4 py-2 bg-amber-700 hover:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
        <p className="text-xs text-zinc-400 mt-2">Leave verse blank for whole-chapter references (e.g. KB Ch. 14)</p>
      </div>

      {/* Sloka Library */}
      <div className="mb-6 p-4 bg-indigo-50 dark:bg-zinc-800/50 rounded-xl border border-indigo-200 dark:border-zinc-700">
        <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 uppercase tracking-wide mb-2">Sloka & Bhajan Library</p>
        <div className="relative" data-sloka-dropdown>
          <div className="flex items-end gap-2">
            <div className="relative flex-1">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={slokaSearch}
                onChange={(e) => {
                  setSlokaSearch(e.target.value);
                  setIsSlokaOpen(true);
                }}
                onFocus={() => setIsSlokaOpen(true)}
                placeholder="Search slokas, bhajans, mantras..."
                className="input-field w-full !pl-9 text-sm"
              />
            </div>
          </div>
          {isSlokaOpen && (
            <div className="absolute z-20 mt-1 w-full max-w-xl bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 p-2">
              <div className="max-h-64 overflow-auto space-y-1">
                {filteredSlokas.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      addSloka(s);
                      setSlokaSearch("");
                      setIsSlokaOpen(false);
                    }}
                    className="w-full text-left px-2 py-2 rounded hover:bg-indigo-50 dark:hover:bg-zinc-800"
                  >
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{s.reference}</div>
                    <div className="text-xs text-zinc-800 dark:text-zinc-200 font-serif whitespace-pre-wrap leading-snug">{s.text}</div>
                    <div className="text-xs text-zinc-500">{s.source} · {s.translation.slice(0, 80)}{s.translation.length > 80 ? "…" : ""}</div>
                  </button>
                ))}
                {filteredSlokas.length === 0 && (
                  <p className="text-xs text-zinc-400 px-2 py-1">No matches.</p>
                )}
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-zinc-400 mt-2">Type to search, then click an entry to add it to your verse memory.</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <Filter size={16} className="text-zinc-500" />
        <div className="relative w-auto">
          <select
            value={filterBook}
            onChange={(e) => setFilterBook(e.target.value)}
            className="input-field text-sm w-auto"
            title={bookSearch ? "Filtered by search" : "Filter by book"}
          >
            <option value="all">All Books</option>
            {filteredBooks.map((b) => (
              <option key={b} value={b}>[{getBookAbbreviation(b)}] {b}</option>
            ))}
          </select>
          <input
            type="text"
            value={bookSearch}
            onChange={(e) => setBookSearch(e.target.value)}
            placeholder="Search..."
            className="input-field text-sm w-32 mt-1 block"
          />
        </div>
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="input-field text-sm w-auto"
        >
          <option value="all">All Months</option>
          {months.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="input-field text-sm w-auto"
        >
          <option value="all">All Priorities</option>
          <option value="Core">Core</option>
          <option value="Support">Support</option>
          <option value="Advanced">Advanced</option>
        </select>
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={verseSearch}
            onChange={(e) => setVerseSearch(e.target.value)}
            placeholder="Search verses..."
            className="input-field text-sm !pl-9 w-48"
          />
        </div>
      </div>

      {/* Verse cards */}
      <div className="space-y-3">
        {filtered.map((verse) => {
          const isFocused = verse.id === focusVerseId;
          return (
            <div
              id={`verse-${verse.id}`}
              key={verse.id}
              className={`bg-white dark:bg-zinc-900 rounded-xl border p-4 transition-shadow ${
                isFocused
                  ? "ring-2 ring-indigo-500 border-indigo-400 shadow-lg dark:border-indigo-500"
                  : verse.mastered
                  ? "border-green-300 dark:border-green-800"
                  : verse.learned
                  ? "border-blue-200 dark:border-blue-800"
                  : "border-amber-200 dark:border-zinc-800"
              }`}
            >
            <div className="flex items-start justify-between mb-2">
              <div className="w-full">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{verse.versePassage}</h4>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      verse.priority === "Core"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : verse.priority === "Support"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                    }`}
                  >
                    {verse.priority}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">{verse.source} · {verse.monthPhase}</p>
              </div>
            </div>

            {verse.verseText && (
              <div className="mt-2 mb-2">
                <p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">{verse.monthPhase === "Sloka Practice" ? "Sanskrit" : "Verse text"}</p>
                <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed border-l-2 border-indigo-200 dark:border-indigo-800 pl-3 whitespace-pre-wrap font-serif">{verse.verseText}</p>
              </div>
            )}

            {verse.theme && (
              <div className="mb-2">
                <p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Meaning</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{verse.theme}</p>
              </div>
            )}

            {/* Checkboxes */}
            <div className="flex flex-wrap gap-3 mt-3 text-xs">
              {(
                [
                  ["learned", "Learned"],
                  ["meaningUnderstood", "Meaning"],
                  ["canRecite", "Recite"],
                  ["review1", "Rev 1"],
                  ["review1W", "Rev 1W"],
                  ["review1M", "Rev 1M"],
                  ["mastered", "Mastered"],
                ] as [keyof VerseMemory, string][]
              ).map(([field, label]) => (
                <label key={field} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verse[field] as boolean}
                    onChange={(e) => updateVerse(verse.id, field, e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
                </label>
              ))}
            </div>

            {/* Verse text + Notes + delete */}
            {!verse.verseText && (
              <textarea
                value={verse.verseText}
                onChange={(e) => updateVerse(verse.id, "verseText", e.target.value)}
                placeholder="Paste the full verse translation here..."
                className="input-field text-xs mt-2 w-full min-h-[40px] resize-y"
              />
            )}
            <div className="flex items-end gap-2 mt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1">
                <input
                  type="text"
                  value={verse.contextNotes}
                  onChange={(e) => updateVerse(verse.id, "contextNotes", e.target.value)}
                  placeholder="Context / chapter notes..."
                  className="input-field text-xs"
                />
                <input
                  type="text"
                  value={verse.reflection}
                  onChange={(e) => updateVerse(verse.id, "reflection", e.target.value)}
                  placeholder="Favorite purport / reflection..."
                  className="input-field text-xs"
                />
              </div>
                {verse.verseText && (
                <button
                  onClick={() => setPracticeId(practiceId === verse.id ? null : verse.id)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    practiceId === verse.id
                      ? "bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100"
                      : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900/50"
                  }`}
                  title="Practice this sloka with progressive blanking"
                >
                  <Play size={12} />
                  {practiceId === verse.id ? "Hide practice" : "Practice"}
                </button>
              )}
              <button
                onClick={() => deleteVerse(verse.id)}
                className="text-red-400 hover:text-red-600 p-1"
                title="Remove"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {practiceId === verse.id && (
              <div className="mt-3">
                <SlokaPractice verse={verse} onClose={() => setPracticeId(null)} />
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}
