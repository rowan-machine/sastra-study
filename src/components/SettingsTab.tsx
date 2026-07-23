"use client";

import { Settings, Course, SadhanaStandards, RegulativePrinciples, StandardsChangeEntry, courseColors, curriculumBooks, bookCategories, defaultSadhanaStandards, defaultRegulativePrinciples, scheduleItems, defaultHabits, CustomScheduleItem, WishlistBook } from "@/lib/data";
import { BookCover } from "@/components/BookProgressTab";
import { format } from "date-fns";
import { Save, RotateCcw, Plus, Trash2, Search, ChevronDown, ChevronRight, X, ExternalLink, BookOpen, ArrowRight } from "lucide-react";
import { defaultSettings } from "@/lib/data";
import { useState, useRef } from "react";

const gunaIcon = (guna: string) => {
  switch (guna) {
    case "goodness": return "🌟";
    case "passion": return "🔥";
    case "ignorance": return "🌑";
    default: return "✨";
  }
};

const scheduleItemPresets: (CustomScheduleItem & { guna?: string })[] = [
  ...scheduleItems.map((item) => ({ ...item, guna: undefined })),
  ...defaultHabits.map((habit) => ({
    key: `preset-${habit.id}`,
    label: habit.label,
    icon: gunaIcon(habit.guna),
    guna: habit.guna === "goodness" ? "Sattva" : habit.guna === "passion" ? "Rajas" : "Tamas",
    linkedToJapa: false,
  })),
];

// Categorized, searchable book selector for course creation
function BookSelector({ selectedBooks, setSelectedBooks }: { selectedBooks: string[]; setSelectedBooks: (v: string[] | ((p: string[]) => string[])) => void }) {
  const [bookSearch, setBookSearch] = useState("");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(["Core Study"]));

  const toggleCat = (label: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const toggleBook = (book: string) => {
    if (selectedBooks.includes(book)) {
      setSelectedBooks((prev) => prev.filter((b) => b !== book));
    } else {
      setSelectedBooks((prev) => [...prev, book]);
    }
  };

  const selectAllInCategory = (books: string[]) => {
    setSelectedBooks((prev) => [...new Set([...prev, ...books])]);
  };

  const lowerSearch = bookSearch.toLowerCase();

  return (
    <div className="mb-3">
      <label className="block text-xs text-zinc-500 mb-2">Assign Books to This Course ({selectedBooks.length} selected)</label>

      {/* Search */}
      <div className="relative mb-2">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={bookSearch}
          onChange={(e) => setBookSearch(e.target.value)}
          placeholder="Search books..."
          className="input-field pl-8 text-sm"
        />
      </div>

      {/* Selected pills */}
      {selectedBooks.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedBooks.map((book) => (
            <span
              key={book}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full cursor-pointer hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-300 transition-colors"
              onClick={() => toggleBook(book)}
              title="Click to remove"
            >
              {book.length > 35 ? book.slice(0, 35) + "…" : book} ×
            </span>
          ))}
        </div>
      )}

      {/* Categorized list */}
      <div className="max-h-60 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
        {bookCategories.map((cat) => {
          const filteredBooks = bookSearch
            ? cat.books.filter((b) => b.toLowerCase().includes(lowerSearch))
            : cat.books;
          if (filteredBooks.length === 0) return null;
          const isExpanded = expandedCats.has(cat.label) || !!bookSearch;
          const selectedInCat = filteredBooks.filter((b) => selectedBooks.includes(b)).length;

          return (
            <div key={cat.label} className="border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
              <button
                type="button"
                onClick={() => toggleCat(cat.label)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                {isExpanded ? <ChevronDown size={12} className="text-zinc-400" /> : <ChevronRight size={12} className="text-zinc-400" />}
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{cat.label}</span>
                <span className="text-xs text-zinc-400">{selectedInCat}/{filteredBooks.length}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); selectAllInCategory(filteredBooks); }}
                  className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 ml-1"
                >
                  All
                </button>
              </button>
              {isExpanded && (
                <div className="px-3 pb-2 space-y-0.5">
                  {filteredBooks.map((book) => (
                    <label key={book} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer py-1 hover:text-zinc-900 dark:hover:text-zinc-200">
                      <input
                        type="checkbox"
                        checked={selectedBooks.includes(book)}
                        onChange={() => toggleBook(book)}
                        className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <BookCover bookName={book} size="sm" />
                      <span className="leading-tight">{book}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-zinc-400 mt-1">Search or expand categories to select. Click pills to remove.</p>
    </div>
  );
}

// Ratchet-only standards editor for the active course
function ActiveCourseStandardsEditor({ courses, setCourses, activeCourseId }: { courses: Course[]; setCourses: (v: Course[] | ((p: Course[]) => Course[])) => void; activeCourseId: string }) {
  const course = courses.find((c) => c.id === activeCourseId);
  if (!course) return null;

  const baseline = course.originalBaseline || course.sadhanaStandards;
  const current = course.sadhanaStandards;

  const raiseStandard = (field: "minScorePercent" | "weeklyMinDays" | "obeisancesTarget", newValue: number) => {
    const oldValue = current[field];
    const floorValue = baseline[field];
    // Ratchet: can only go UP, never below original baseline
    if (newValue < floorValue) return;
    if (newValue <= oldValue) return;

    const entry: StandardsChangeEntry = {
      date: format(new Date(), "yyyy-MM-dd HH:mm"),
      field,
      oldValue,
      newValue,
      direction: "up",
    };

    setCourses((prev) => prev.map((c) => {
      if (c.id !== activeCourseId) return c;
      const updated = {
        ...c.sadhanaStandards,
        [field]: newValue,
      };
      return {
        ...c,
        sadhanaStandards: {
          ...updated,
          description: `${updated.minScorePercent}% daily min, ${updated.weeklyMinDays} days/week, ${updated.obeisancesTarget} obeisance${updated.obeisancesTarget !== 1 ? "s" : ""}/day`,
        },
        standardsHistory: [...(c.standardsHistory || []), entry],
      };
    }));
  };

  const updateRegPrinciples = (updates: Partial<RegulativePrinciples>) => {
    setCourses((prev) => prev.map((c) => {
      if (c.id !== activeCourseId) return c;
      return { ...c, regulativePrinciples: { ...(c.regulativePrinciples || defaultRegulativePrinciples), ...updates } };
    }));
  };

  const updatePrincipleFlag = (key: keyof RegulativePrinciples["principles"], value: boolean) => {
    setCourses((prev) => prev.map((c) => {
      if (c.id !== activeCourseId) return c;
      const rp = c.regulativePrinciples || defaultRegulativePrinciples;
      return { ...c, regulativePrinciples: { ...rp, principles: { ...rp.principles, [key]: value } } };
    }));
  };

  const regPrinciples = course.regulativePrinciples || defaultRegulativePrinciples;

  return (
    <div className="mt-4 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-amber-200 dark:border-zinc-700">
      <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-3">
        Standards & Regulative Principles — {course.name}
      </h4>

      {/* Ratchet notice */}
      <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
        <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
          ⬆ Ratchet Mode: Standards can only go UP. Floor: {baseline.minScorePercent}% / {baseline.weeklyMinDays} days.
        </p>
      </div>

      {/* Current standards with raise buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Min Daily Score %</label>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{current.minScorePercent}%</span>
            <button
              onClick={() => raiseStandard("minScorePercent", current.minScorePercent + 5)}
              className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 transition-colors"
            >
              +5%
            </button>
            <button
              onClick={() => raiseStandard("minScorePercent", current.minScorePercent + 10)}
              className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 transition-colors"
            >
              +10%
            </button>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">Floor: {baseline.minScorePercent}%</p>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Min Days/Week</label>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{current.weeklyMinDays}</span>
            {current.weeklyMinDays < 7 && (
              <button
                onClick={() => raiseStandard("weeklyMinDays", current.weeklyMinDays + 1)}
                className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 transition-colors"
              >
                +1 day
              </button>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">Floor: {baseline.weeklyMinDays} days</p>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Obeisances Target</label>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{current.obeisancesTarget}</span>
            {current.obeisancesTarget < 3 && (
              <button
                onClick={() => raiseStandard("obeisancesTarget", current.obeisancesTarget + 1)}
                className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 transition-colors"
              >
                +1
              </button>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">Floor: {baseline.obeisancesTarget} a day</p>
        </div>
      </div>

      {/* Regulative Principles */}
      <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3 mt-3">
        <h5 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Regulative Principles</h5>

        <div className="flex gap-4 mb-3">
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="radio"
              name={`reg-mode-${course.id}`}
              checked={regPrinciples.mode === "non-negotiable"}
              onChange={() => updateRegPrinciples({ mode: "non-negotiable" })}
              className="text-indigo-600"
            />
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">Non-negotiable (strict vow)</span>
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="radio"
              name={`reg-mode-${course.id}`}
              checked={regPrinciples.mode === "tracking"}
              onChange={() => updateRegPrinciples({ mode: "tracking" })}
              className="text-indigo-600"
            />
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">Tracking (working toward)</span>
          </label>
        </div>

        <label className="flex items-center gap-2 text-xs mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={regPrinciples.initiated}
            onChange={(e) => updateRegPrinciples({ initiated: e.target.checked })}
            className="rounded border-zinc-300 text-indigo-600"
          />
          <span className="text-zinc-600 dark:text-zinc-400">Initiated devotee (taken formal vows)</span>
        </label>

        <div className="grid grid-cols-2 gap-2">
          {([
            ["noMeatEating", "No meat / sattvic diet"],
            ["noIntoxication", "No intoxication"],
            ["noGambling", "No gambling"],
            ["noIllicitSex", "No illicit sex"],
            ["sixteenRounds", "16 rounds daily"],
          ] as [keyof RegulativePrinciples["principles"], string][]).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={regPrinciples.principles[key]}
                onChange={(e) => updatePrincipleFlag(key, e.target.checked)}
                className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              />
              {label}
            </label>
          ))}
        </div>

        <p className="text-xs text-zinc-400 mt-2">
          {regPrinciples.mode === "non-negotiable"
            ? "These are strict vows. Breaking them will flag in your sādhana report."
            : "You're working toward these. Daily adherence is tracked without judgment."}
        </p>
      </div>

      {/* Invocation Recording */}
      <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3 mt-3">
        <h5 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Invocation Recording</h5>
        <label className="block text-xs text-zinc-400 mb-0.5">Recording URL (YouTube, etc.)</label>
        <input
          type="text"
          value={course.invocationRecordingUrl || ""}
          onChange={(e) => {
            const url = e.target.value.trim();
            setCourses((prev) => prev.map((c) => c.id === activeCourseId ? { ...c, invocationRecordingUrl: url || undefined } : c));
          }}
          placeholder="https://www.youtube.com/watch?v=..."
          className="input-field w-full text-sm mb-2"
        />
        {course.invocationRecordingUrl && (
          <a
            href={course.invocationRecordingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200"
          >
            Open recording <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Change history */}
      {course.standardsHistory && course.standardsHistory.length > 0 && (
        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3 mt-3">
          <h5 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Standards History (permanent log)</h5>
          <div className="max-h-24 overflow-y-auto space-y-0.5">
            {course.standardsHistory.slice().reverse().map((entry, i) => (
              <p key={i} className="text-xs text-zinc-500">
                <span className="text-green-600">⬆</span> {entry.date}: {entry.field} {String(entry.oldValue)} → {String(entry.newValue)}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Reading wishlist — a lightweight "books I want to read someday" list, kept
// alongside the courses so it's visible when planning future course slots.
function ReadingWishlistSection({
  readingWishlist,
  setReadingWishlist,
  courses,
  onAddToCourse,
}: {
  readingWishlist: WishlistBook[];
  setReadingWishlist: (v: WishlistBook[] | ((prev: WishlistBook[]) => WishlistBook[])) => void;
  courses: Course[];
  onAddToCourse: (bookTitle: string, courseId: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const addBook = () => {
    const title = newTitle.trim();
    if (!title) return;
    const entry: WishlistBook = {
      id: `wl-${Date.now()}`,
      title,
      author: newAuthor.trim() || undefined,
      notes: newNotes.trim() || undefined,
      addedAt: new Date().toISOString(),
    };
    setReadingWishlist((prev) => [...prev, entry]);
    setNewTitle("");
    setNewAuthor("");
    setNewNotes("");
  };

  const removeBook = (id: string) => {
    setReadingWishlist((prev) => prev.filter((b) => b.id !== id));
  };

  const updateBook = (id: string, patch: Partial<WishlistBook>) => {
    setReadingWishlist((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const moveToCourse = (book: WishlistBook, courseId: string) => {
    onAddToCourse(book.title + (book.author ? ` (${book.author})` : ""), courseId);
    removeBook(book.id);
  };

  return (
    <div className="mb-6 bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 overflow-hidden">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-50 dark:hover:bg-zinc-800/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          {collapsed ? <ChevronRight size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
          <BookOpen size={16} className="text-amber-700 dark:text-amber-300" />
          <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">Reading Wishlist</h3>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {readingWishlist.length} {readingWishlist.length === 1 ? "book" : "books"}
          </span>
        </div>
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:inline">
          Books to consider when planning future courses
        </span>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">
          {readingWishlist.length === 0 ? (
            <p className="text-sm italic text-zinc-500 dark:text-zinc-400 py-2">
              Nothing on the wishlist yet. Add a book below when you come across something you&apos;d like to read someday.
            </p>
          ) : (
            <ul className="space-y-2">
              {readingWishlist.map((b) => (
                <li
                  key={b.id}
                  className="bg-amber-50 dark:bg-zinc-800/40 border border-amber-200 dark:border-zinc-700 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <input
                        value={b.title}
                        onChange={(e) => updateBook(b.id, { title: e.target.value })}
                        placeholder="Book title"
                        className="w-full bg-transparent border-b border-transparent hover:border-amber-300 focus:border-amber-500 focus:outline-none px-0 py-0.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200"
                      />
                      <input
                        value={b.author ?? ""}
                        onChange={(e) => updateBook(b.id, { author: e.target.value || undefined })}
                        placeholder="Author (optional)"
                        className="w-full bg-transparent border-b border-transparent hover:border-amber-300 focus:border-amber-500 focus:outline-none px-0 py-0.5 text-xs text-zinc-600 dark:text-zinc-400 mt-1"
                      />
                    </div>
                    <button
                      onClick={() => removeBook(b.id)}
                      className="text-zinc-400 hover:text-red-600 shrink-0"
                      title="Remove from wishlist"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <textarea
                    value={b.notes ?? ""}
                    onChange={(e) => updateBook(b.id, { notes: e.target.value || undefined })}
                    placeholder="Notes — why this book, when to slot it in…"
                    rows={2}
                    className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md px-2 py-1.5 resize-y leading-relaxed"
                  />
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <ArrowRight size={12} />
                      Move into course:
                    </span>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          moveToCourse(b, e.target.value);
                          e.target.value = "";
                        }
                      }}
                      className="text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md px-2 py-1"
                    >
                      <option value="">Select…</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <span className="text-zinc-400 dark:text-zinc-500 text-[11px] italic">
                      (removes from wishlist)
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Add-new form */}
          <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addBook()}
                placeholder="Title"
                className="text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md px-2 py-1.5"
              />
              <input
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addBook()}
                placeholder="Author (optional)"
                className="text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md px-2 py-1.5"
              />
            </div>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Why do you want to read it? Where might it fit? (optional)"
              rows={2}
              className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md px-2 py-1.5 resize-y leading-relaxed"
            />
            <div className="flex justify-end">
              <button
                onClick={addBook}
                disabled={!newTitle.trim()}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Plus size={12} />
                Add to wishlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  settings: Settings;
  setSettings: (value: Settings | ((prev: Settings) => Settings)) => void;
  courses: Course[];
  setCourses: (value: Course[] | ((prev: Course[]) => Course[])) => void;
  activeCourseId: string;
  onCreateCourse: (name: string, color: string, startDate: string, endDate: string, books: string[], sadhanaStandards?: SadhanaStandards, regulativePrinciples?: RegulativePrinciples, firstBookStartChapter?: string, switchToCourse?: boolean) => void;
  onSwitchCourse: (courseId: string) => void;
  readingWishlist: WishlistBook[];
  setReadingWishlist: (value: WishlistBook[] | ((prev: WishlistBook[]) => WishlistBook[])) => void;
}

export function SettingsTab({ settings, setSettings, courses, setCourses, activeCourseId, onCreateCourse, onSwitchCourse, readingWishlist, setReadingWishlist }: Props) {
  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0];
  const activeCourseColor = courseColors.find((c) => c.id === activeCourse?.color) || courseColors[0];
  const activeCourseBg = activeCourseColor.bg.replace("-100", "-100/50");
  const [showAllCourses, setShowAllCourses] = useState(true);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseColor, setNewCourseColor] = useState("amber");
  const [newCourseStart, setNewCourseStart] = useState("");
  const [newCourseEnd, setNewCourseEnd] = useState("");
  const [newCourseBooks, setNewCourseBooks] = useState<string[]>([]);
  const [newCourseStartChapter, setNewCourseStartChapter] = useState("");
  const [newCourseSwitchTo, setNewCourseSwitchTo] = useState(false);
  const [newCourseMinScore, setNewCourseMinScore] = useState(55);
  const [newCourseMinDays, setNewCourseMinDays] = useState(5);
  const [newCourseObeisancesTarget, setNewCourseObeisancesTarget] = useState(1);
  const [newCourseRequiredItems, setNewCourseRequiredItems] = useState<string[]>(["personalStudy"]);
  const [showNewCourseForm, setShowNewCourseForm] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const handleScheduleDragEnd = () => {
    const from = dragItem.current;
    const to = dragOverItem.current;
    dragItem.current = null;
    dragOverItem.current = null;
    if (from === null || to === null || from === to) return;
    const base = settings.scheduleItems || defaultSettings.scheduleItems;
    const updated = [...base];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setSettings({ ...settings, scheduleItems: updated });
  };
  const updateSetting = (field: keyof Settings, value: unknown) => {
    setSettings((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-sync weeklyTargetHours from daily targets so pace stays linked
      if (field === "minimumDailyStudyHours" || field === "weekendTargetHours") {
        const weekday = field === "minimumDailyStudyHours" ? (value as number) : (prev.minimumDailyStudyHours ?? 2);
        const weekend = field === "weekendTargetHours" ? (value as number) : (prev.weekendTargetHours ?? 3);
        next.weeklyTargetHours = Math.round((5 * (Number.isFinite(weekday) ? weekday : 2) + 2 * (Number.isFinite(weekend) ? weekend : 3)) * 2) / 2;
      }
      return next;
    });
  };

  const resetAll = () => {
    if (confirm("Are you sure you want to reset ALL data? This will clear your daily log, curriculum progress, and everything else.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const prefix = `sastra-${activeCourseId}`;

  const getLocal = (key: string): unknown | null => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  };

  const buildSummary = () => {
    const now = new Date();
    const recentDays = 30;
    const recentFilter = (date: string) => {
      const d = new Date(date);
      return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= recentDays;
    };

    const activeSettings = (getLocal(`${prefix}-settings`) as Settings | null) || settings;
    const dailyLog = ((getLocal(`${prefix}-daily-log`) as { date: string; hours?: number; minutes?: number }[] | null) || []);
    const recentLog = dailyLog.filter((e) => recentFilter(e.date));
    const totalStudyHours = dailyLog.reduce((sum, e) => sum + (e.hours ?? 0) + (e.minutes ? e.minutes / 60 : 0), 0);
    const recentStudyHours = recentLog.reduce((sum, e) => sum + (e.hours ?? 0) + (e.minutes ? e.minutes / 60 : 0), 0);
    const avgDailyHours = recentLog.length ? recentStudyHours / recentLog.length : 0;

    const japaLog = ((getLocal(`${prefix}-japa-log`) as { date: string; rounds?: number | null }[] | null) || []);
    const recentJapa = japaLog.filter((e) => recentFilter(e.date));
    const japa16Days = recentJapa.filter((e) => (e.rounds ?? 0) >= 16).length;

    const scheduleLog = ((getLocal(`${prefix}-schedule-log`) as { date: string; noMeatEating?: boolean; noIntoxication?: boolean; noGambling?: boolean; noIllicitSex?: boolean; sixteenRounds?: boolean; mangalaArati?: boolean }[] | null) || []);
    const recentSchedule = scheduleLog.filter((e) => recentFilter(e.date));
    const regPrincipleDays = recentSchedule.filter((e) => e.noMeatEating && e.noIntoxication && e.noGambling && e.noIllicitSex && e.sixteenRounds).length;
    const aratiDays = recentSchedule.filter((e) => e.mangalaArati).length;

    const bookProgress = ((getLocal(`${prefix}-book-progress`) as { book: string; complete: boolean; percentComplete: number }[] | null) || []);
    const completedBooks = bookProgress.filter((b) => b.complete).length;
    const inProgressBooks = bookProgress.filter((b) => !b.complete && b.percentComplete > 0).length;

    const characterAssessments = ((getLocal(`${prefix}-character-assessments`) as { date: string; sattvaScore: number; rajasScore: number; tamasScore: number }[] | null) || []);
    const latestAssessment = characterAssessments[0];

    const verses = ((getLocal(`${prefix}-verse-memory`) as { versePassage: string; mastered?: boolean }[] | null) || []);
    const masteredVerses = verses.filter((v) => v.mastered).length;

    const contacts = ((getLocal(`${prefix}-contacts`) as { name: string }[] | null) || []);

    const questions = ((getLocal(`${prefix}-questions`) as { length: number }[] | null) || []);
    const savedAnswers = ((getLocal(`${prefix}-prabhupada-saved-answers`) as { length: number }[] | null) || []);
    const spiritualMasterRecord = getLocal(`${prefix}-spiritual-master`) as { name?: string } | null;
    const discipleLessons = ((getLocal("sastra-disciple-course-lessons") as { length: number }[] | null) || []);
    const tutorSessions = ((getLocal(`${prefix}-tutor-sessions`) as { length: number }[] | null) || []);
    const lectureNotes = ((getLocal(`${prefix}-lecture-notes`) as { length: number }[] | null) || []);
    const quizHistory = ((getLocal(`${prefix}-quiz-history`) as { length: number }[] | null) || []);
    const characterAssessmentsList = ((getLocal(`${prefix}-character-assessments`) as { length: number }[] | null) || []);
    const sevaLog = ((getLocal(`${prefix}-seva-log`) as { length: number }[] | null) || []);
    const readingWishlist = ((getLocal("sastra-reading-wishlist") as { length: number }[] | null) || []);
    const journalEntriesList = ((getLocal(`${prefix}-journal-entries`) as { length: number }[] | null) || []);

    const metrics = {
      activeCourse: activeCourse?.name,
      activeCourseId,
      totalStudyDays: dailyLog.length,
      totalStudyHours: Math.round(totalStudyHours * 10) / 10,
      last30Days: {
        daysLogged: recentLog.length,
        averageDailyHours: Math.round(avgDailyHours * 10) / 10,
        daysWith16Rounds: japa16Days,
        daysWithAllRegulativePrinciples: regPrincipleDays,
        daysWithMangalaArati: aratiDays,
      },
      books: {
        total: bookProgress.length,
        completed: completedBooks,
        inProgress: inProgressBooks,
      },
      character: latestAssessment
        ? {
            date: latestAssessment.date,
            sattvaScore: latestAssessment.sattvaScore,
            rajasScore: latestAssessment.rajasScore,
            tamasScore: latestAssessment.tamasScore,
          }
        : null,
      verseMemory: {
        total: verses.length,
        mastered: masteredVerses,
      },
      devoteeContacts: contacts.length,
      prabhupada: {
        questions: questions.length,
        savedAnswers: savedAnswers.length,
      },
      spiritualMaster: spiritualMasterRecord?.name || null,
      discipleCourse: {
        lessons: discipleLessons.length,
      },
      tutorSessions: tutorSessions.length,
      lectureNotes: lectureNotes.length,
      quizHistory: quizHistory.length,
      characterAssessments: characterAssessmentsList.length,
      seva: {
        logEntries: sevaLog.length,
        posters: ((getLocal(`${prefix}-seva-posters`) as { length: number }[] | null) || []).length,
        notes: ((getLocal(`${prefix}-seva-notes`) as { length: number }[] | null) || []).length,
      },
      readingWishlist: readingWishlist.length,
      journalEntries: journalEntriesList.length,
      exportedAt: new Date().toISOString(),
    };

    const description = `This is a backup of the Śāstra Study app for the active course "${metrics.activeCourse}" (${activeCourseId}). It contains the full localStorage state plus a summary for quick reading. The user has logged ${metrics.totalStudyDays} study days totaling ${metrics.totalStudyHours} hours. In the last 30 days, they logged ${metrics.last30Days.daysLogged} days with an average of ${metrics.last30Days.averageDailyHours} hours/day, completed 16 rounds on ${metrics.last30Days.daysWith16Rounds} days, kept all regulative principles on ${metrics.last30Days.daysWithAllRegulativePrinciples} days, and attended maṅgala āratī on ${metrics.last30Days.daysWithMangalaArati} days. They have completed ${metrics.books.completed} of ${metrics.books.total} books, memorized ${metrics.verseMemory.mastered} of ${metrics.verseMemory.total} verses, and have ${metrics.devoteeContacts} devotee contacts. The most recent character assessment (sattva/rajas/tamas) is ${latestAssessment ? `${latestAssessment.sattvaScore}/${latestAssessment.rajasScore}/${latestAssessment.tamasScore}` : "not yet taken"}.`;

    return { metrics, description };
  };

  const exportData = (chatgpt = false) => {
    const localStorageBackup: Record<string, string | null> = {};

    // Explicitly enumerate every known key so new elements are captured even
    // before the user adds any data. Existing unknown sastra-* keys are also
    // preserved, so this remains backward compatible.
    const globalKeys = [
      "sastra-courses",
      "sastra-active-course",
      "sastra-reading-wishlist",
      "sastra-disciple-course-lessons",
      "sastra-disciple-course-meta",
      "sastra-sidebar-collapsed",
    ];
    const courseSuffixes = [
      "settings", "curriculum", "daily-log", "book-progress", "verse-memory",
      "weekly-reflections", "journal-entries", "japa-log", "seva-log", "seva-posters",
      "seva-notes", "tutor-sessions", "schedule-log", "contacts", "vocabulary",
      "questions", "prabhupada-saved-answers", "lecture-notes", "quiz-history",
      "character-assessments", "spiritual-master",
    ];
    const knownKeys = new Set<string>([
      ...globalKeys,
      ...courses.flatMap((c) => courseSuffixes.map((s) => `sastra-${c.id}-${s}`)),
    ]);

    if (typeof window !== "undefined") {
      for (const key of knownKeys) {
        localStorageBackup[key] = localStorage.getItem(key);
      }
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sastra-")) {
          localStorageBackup[key] = localStorage.getItem(key);
        }
      }
    }

    const { metrics, description } = buildSummary();

    const data = {
      version: 3,
      generatedAt: new Date().toISOString(),
      chatgptReadMe: "This is a comprehensive backup of the Śāstra Study app. The 'summary' object is designed for quick reading; the 'localStorage' object contains the full raw state for restore.",
      summary: { description, ...metrics },
      schema: {
        knownKeys: Array.from(knownKeys).sort(),
        courses: courses.map((c) => ({ id: c.id, name: c.name })),
      },
      localStorage: localStorageBackup,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const label = chatgpt ? "chatgpt" : "backup";
    a.download = `sastra-study-${label}-${activeCourseId}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);

          // v2 comprehensive backup: restore all localStorage keys
          if (data.localStorage && typeof data.localStorage === "object") {
            for (const [key, value] of Object.entries(data.localStorage)) {
              if (value != null) {
                localStorage.setItem(key, value as string);
              }
            }
          }

          // Legacy v1 fallback for active course
          const legacyKeys = ["settings", "curriculum", "dailyLog", "bookProgress", "verseMemory", "weeklyReflections", "journalEntries", "japaLog", "tutorSessions", "scheduleLog", "contacts", "vocabulary", "questions", "lectureNotes", "quizHistory", "characterAssessments", "spiritualMaster"];
          for (const key of legacyKeys) {
            if (data[key] != null && !data.localStorage) {
              localStorage.setItem(`${prefix}-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`, JSON.stringify(data[key]));
            }
          }

          window.location.reload();
        } catch {
          alert("Invalid backup file.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">Settings</h2>

      {/* Active Course Plan */}
      <div className={`bg-white dark:bg-zinc-900 rounded-xl border-2 p-6 space-y-6 ${activeCourseBg} border-2 ${activeCourseColor.border}`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeCourseColor.accent} text-white text-xl font-bold shadow`}>
            {activeCourse?.name?.[0] || "C"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{activeCourse?.name}</h3>
              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full">Active</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${activeCourseColor.bg} ${activeCourseColor.text}`}>{activeCourseColor.label}</span>
            </div>
            <p className="text-sm text-zinc-500 mt-1">
              {activeCourse?.startDate} — {activeCourse?.endDate} · {activeCourse?.books?.length || 0} books · {activeCourse?.sadhanaStandards?.description || ""}
            </p>
          </div>
        </div>

        <div className="bg-white/60 dark:bg-zinc-900/60 rounded-lg border border-amber-100 dark:border-zinc-800 p-4">
          <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
            <span className="text-amber-600">Plan Settings</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Plan Start Date
              </label>
              <input
                type="date"
                value={settings.planStartDate}
                onChange={(e) => updateSetting("planStartDate", e.target.value)}
                className="input-field"
              />
              <p className="text-xs text-zinc-500 mt-1">Drives weekly due dates for this course</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Target Weeks
              </label>
              <input
                type="number"
                value={settings.targetWeeks}
                onChange={(e) => updateSetting("targetWeeks", parseInt(e.target.value) || 32)}
                className="input-field"
              />
              <p className="text-xs text-zinc-500 mt-1">Length of this course</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Weekly Target Hours
              </label>
              <input
                type="number"
                step="0.5"
                value={settings.weeklyTargetHours}
                readOnly
                className="input-field bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed"
              />
              <p className="text-xs text-zinc-500 mt-1">Auto-synced: 5×weekday + 2×weekend ({5 * settings.minimumDailyStudyHours} + {2 * (settings.weekendTargetHours ?? 3)} = {Math.round((5 * settings.minimumDailyStudyHours + 2 * (settings.weekendTargetHours ?? 3)) * 2) / 2}h). Drives curriculum pace.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Minimum Daily Study Hours
              </label>
              <input
                type="number"
                step="0.5"
                value={settings.minimumDailyStudyHours}
                onChange={(e) => updateSetting("minimumDailyStudyHours", parseFloat(e.target.value) || 2)}
                className="input-field"
              />
              <p className="text-xs text-zinc-500 mt-1">Weekday study-complete threshold &amp; weekly pace</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Weekend Target Hours
              </label>
              <input
                type="number"
                step="0.5"
                value={settings.weekendTargetHours ?? 3}
                onChange={(e) => updateSetting("weekendTargetHours", parseFloat(e.target.value) || 3)}
                className="input-field"
              />
              <p className="text-xs text-zinc-500 mt-1">Sat/Sun study-complete threshold &amp; weekly pace</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Target Finish Date
              </label>
              <input
                type="date"
                value={settings.targetFinishDate}
                readOnly
                className="input-field bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed"
              />
              <p className="text-xs text-zinc-500 mt-1">Calculated from start + target weeks</p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800/50">
            <input
              id="ekadashi-fasting-required"
              type="checkbox"
              checked={settings.ekadashiFastingRequired !== false}
              onChange={(e) => updateSetting("ekadashiFastingRequired", e.target.checked)}
              className="mt-0.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <label htmlFor="ekadashi-fasting-required" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                Require Ekadashi fasting
              </label>
              <p className="text-xs text-zinc-500">
                On Ekadashi days, automatically add a one-off <strong>Fasting</strong> item to the schedule tracker. Festival days also get an <strong>Attending festival</strong> tracker.
              </p>
            </div>
          </div>
        </div>

        <ActiveCourseStandardsEditor courses={courses} setCourses={setCourses} activeCourseId={activeCourseId} />
      </div>

      {/* Course Management */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">All Courses</h3>
            <p className="text-xs text-zinc-500">
              Toggle to view, switch, or manage your study courses.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAllCourses((v) => !v)}
              className="flex items-center gap-1 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-medium transition-colors"
            >
              {showAllCourses ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {showAllCourses ? "Hide" : "Show"} Courses
            </button>
            <button
              onClick={() => setShowNewCourseForm(!showNewCourseForm)}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Plus size={14} />
              New Course
            </button>
          </div>
        </div>

        {/* Existing courses */}
        {showAllCourses && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {courses.map((course) => {
              const cc = courseColors.find((c) => c.id === course.color) || courseColors[0];
              const isActive = course.id === activeCourseId;
              return (
                <div
                  key={course.id}
                  className={`flex flex-col gap-3 p-4 rounded-xl border transition-colors ${
                    isActive ? `${cc.bg} ${cc.border}` : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cc.accent} text-white text-lg font-bold shadow`}>
                      {course.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-base font-bold ${isActive ? cc.text : "text-zinc-800 dark:text-zinc-200"}`}>
                        {course.name}
                      </p>
                      <p className="text-xs text-zinc-500">{course.startDate} — {course.endDate}</p>
                      {isActive && <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 rounded-full">Active</span>}
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                    <p>
                      <span className="font-medium">{course.books?.length || 0}</span> books
                      {course.books && course.books.length > 0 && (
                        <span className="block text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                          {course.books.slice(0, 3).join(" · ")}
                          {course.books.length > 3 && ` +${course.books.length - 3} more`}
                        </span>
                      )}
                    </p>
                    {course.sadhanaStandards && (
                      <p className="text-zinc-500">{course.sadhanaStandards.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-auto pt-2 border-t border-zinc-200 dark:border-zinc-700">
                    {!isActive ? (
                      <button
                        onClick={() => onSwitchCourse(course.id)}
                        className="flex-1 px-3 py-1.5 text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors"
                      >
                        Switch to Course
                      </button>
                    ) : (
                      <span className="flex-1 text-center text-xs text-green-600 dark:text-green-400 font-medium py-1.5">
                        Currently active
                      </span>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${course.name}"? This will remove all its data.`)) {
                          const p = `sastra-${course.id}`;
                          const keys = Object.keys(localStorage).filter((k) => k.startsWith(p));
                          keys.forEach((k) => localStorage.removeItem(k));
                          setCourses((prev) => prev.filter((c) => c.id !== course.id));
                        }
                      }}
                      className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete course"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reading wishlist */}
        <ReadingWishlistSection
          readingWishlist={readingWishlist}
          setReadingWishlist={setReadingWishlist}
          courses={courses}
          onAddToCourse={(bookTitle, courseId) => {
            setCourses((prev) =>
              prev.map((c) =>
                c.id === courseId ? { ...c, books: [...c.books, bookTitle] } : c
              )
            );
          }}
        />

        {/* New course form */}
        {showNewCourseForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Create New Course</h4>
                <button
                  onClick={() => setShowNewCourseForm(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X size={20} />
                </button>
              </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Course Name</label>
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Advanced Study"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Notebook Color</label>
                <div className="flex gap-1.5 flex-wrap mt-1">
                  {courseColors.map((cc) => (
                    <button
                      key={cc.id}
                      onClick={() => setNewCourseColor(cc.id)}
                      className={`w-6 h-6 rounded-full ${cc.accent} transition-all ${
                        newCourseColor === cc.id ? "ring-2 ring-offset-1 ring-zinc-800 dark:ring-zinc-200" : ""
                      }`}
                      title={cc.label}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={newCourseStart}
                  onChange={(e) => setNewCourseStart(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={newCourseEnd}
                  onChange={(e) => setNewCourseEnd(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            {/* Book selection */}
            <BookSelector selectedBooks={newCourseBooks} setSelectedBooks={setNewCourseBooks} />

            {/* Starting chapter for first book */}
            {newCourseBooks.length > 0 && (
              <div className="mb-3">
                <label className="block text-xs text-zinc-500 mb-1">
                  Starting point in <span className="font-medium">{newCourseBooks[0]}</span> (optional)
                </label>
                <input
                  type="text"
                  value={newCourseStartChapter}
                  onChange={(e) => setNewCourseStartChapter(e.target.value)}
                  placeholder='e.g. "3.19" or "Chapter 5"'
                  className="input-field text-sm"
                />
                <p className="text-xs text-zinc-400 mt-0.5">Leave blank to start from the beginning</p>
              </div>
            )}

            {/* Sādhana standards */}
            <div className="mb-3">
              <label className="block text-xs text-zinc-500 mb-2">Sādhana Standards (Accountability Baseline)</label>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <label className="block text-xs text-zinc-400 mb-0.5">Min Daily Score %</label>
                  <input
                    type="number"
                    value={newCourseMinScore}
                    onChange={(e) => setNewCourseMinScore(Number(e.target.value))}
                    min={0} max={100}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-0.5">Min Days/Week at Standard</label>
                  <input
                    type="number"
                    value={newCourseMinDays}
                    onChange={(e) => setNewCourseMinDays(Number(e.target.value))}
                    min={1} max={7}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-0.5">Obeisances Target</label>
                  <select
                    value={newCourseObeisancesTarget}
                    onChange={(e) => setNewCourseObeisancesTarget(Number(e.target.value))}
                    className="input-field"
                  >
                    <option value={1}>1 a day</option>
                    <option value={2}>2 a day</option>
                    <option value={3}>3 a day</option>
                  </select>
                </div>
              </div>
              <label className="block text-xs text-zinc-400 mb-1">Required Items (non-negotiable every day)</label>
              <div className="space-y-1">
                {scheduleItems.map((item) => (
                  <label key={item.key} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCourseRequiredItems.includes(item.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewCourseRequiredItems((prev) => [...prev, item.key]);
                        } else {
                          setNewCourseRequiredItems((prev) => prev.filter((k) => k !== item.key));
                        }
                      }}
                      className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {item.icon} {item.label}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={newCourseSwitchTo}
                onChange={(e) => setNewCourseSwitchTo(e.target.checked)}
                className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              Switch to this course immediately
            </label>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!newCourseName.trim()) return;
                  const standards: SadhanaStandards = {
                    minScorePercent: newCourseMinScore,
                    requiredItems: newCourseRequiredItems,
                    weeklyMinDays: newCourseMinDays,
                    obeisancesTarget: newCourseObeisancesTarget,
                    description: `${newCourseMinScore}% daily min, ${newCourseMinDays} days/week, ${newCourseObeisancesTarget} obeisance${newCourseObeisancesTarget !== 1 ? "s" : ""}/day, required: ${newCourseRequiredItems.map(k => scheduleItems.find(s => s.key === k)?.label || k).join(", ")}`,
                  };
                  onCreateCourse(newCourseName.trim(), newCourseColor, newCourseStart, newCourseEnd, newCourseBooks, standards, undefined, newCourseStartChapter || undefined, newCourseSwitchTo);
                  setNewCourseName("");
                  setNewCourseStart("");
                  setNewCourseEnd("");
                  setNewCourseBooks([]);
                  setNewCourseStartChapter("");
                  setNewCourseSwitchTo(false);
                  setNewCourseMinScore(55);
                  setNewCourseMinDays(5);
                  setNewCourseObeisancesTarget(1);
                  setNewCourseRequiredItems(["personalStudy"]);
                  setShowNewCourseForm(false);
                }}
                disabled={!newCourseName.trim() || newCourseBooks.length === 0}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {newCourseSwitchTo ? "Create & Switch" : "Create & Plan Later"}
              </button>
              <button
                onClick={() => setShowNewCourseForm(false)}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
              >
                Cancel
              </button>
            </div>
            </div>
          </div>
        )}
      </div>

      {/* Schedule Item Editor */}
      <div className="mt-8 bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-6">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Daily Schedule Items</h3>
        <p className="text-xs text-zinc-500 mb-4">
          Edit labels, times, or add new items. Existing log entries are preserved by item key. Removing an item hides it from the checklist but keeps the historical data.
        </p>
        <div className="space-y-2">
          {(settings.scheduleItems || defaultSettings.scheduleItems).map((item, idx) => (
            <div
              key={item.key}
              draggable
              onDragStart={(e) => { dragItem.current = idx; e.dataTransfer.effectAllowed = "move"; }}
              onDragEnter={(e) => { e.preventDefault(); dragOverItem.current = idx; }}
              onDragOver={(e) => e.preventDefault()}
              onDragEnd={handleScheduleDragEnd}
              className="flex items-center gap-2"
            >
              <span className="cursor-grab text-zinc-400 dark:text-zinc-600 select-none" title="Drag to reorder">⋮⋮</span>
              <input
                type="text"
                value={item.icon}
                onChange={(e) => {
                  const base = settings.scheduleItems || defaultSettings.scheduleItems;
                  const updated = [...base];
                  updated[idx] = { ...item, icon: e.target.value };
                  setSettings({ ...settings, scheduleItems: updated });
                }}
                className="input-field text-sm text-center !w-10"
                style={{ width: "2.5rem" }}
                placeholder="Icon"
                maxLength={2}
              />
              <input
                type="text"
                value={item.label}
                onChange={(e) => {
                  const base = settings.scheduleItems || defaultSettings.scheduleItems;
                  const updated = [...base];
                  updated[idx] = { ...item, label: e.target.value };
                  setSettings({ ...settings, scheduleItems: updated });
                }}
                className="input-field text-sm !w-0 flex-1 min-w-0"
                placeholder="Label, e.g. Wake up 3:30 AM"
              />
              <label className="flex items-center gap-1 text-xs text-zinc-500 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={item.linkedToJapa || false}
                  onChange={(e) => {
                    const base = settings.scheduleItems || defaultSettings.scheduleItems;
                    const updated = [...base];
                    updated[idx] = { ...item, linkedToJapa: e.target.checked };
                    setSettings({ ...settings, scheduleItems: updated });
                  }}
                />
                Japa sync
              </label>
              {item.committed ? (
                <span className="text-amber-500 p-1" title="Locked commitment — cannot be removed during this course">
                  🔒
                </span>
              ) : (
                <button
                  onClick={() => {
                    const base = settings.scheduleItems || defaultSettings.scheduleItems;
                    const updated = base.filter((_, i) => i !== idx);
                    setSettings({ ...settings, scheduleItems: updated });
                  }}
                  className="text-red-400 hover:text-red-600 p-1"
                  title="Remove item"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value=""
            onChange={(e) => {
              const key = e.target.value;
              if (!key) return;
              const base = settings.scheduleItems || defaultSettings.scheduleItems;
              if (base.some((i) => i.key === key)) return;
              const preset = scheduleItemPresets.find((p) => p.key === key);
              if (!preset) return;
              setSettings({ ...settings, scheduleItems: [...base, { key: preset.key, label: preset.label, icon: preset.icon, linkedToJapa: preset.linkedToJapa, sundayOnly: preset.sundayOnly, weekdayOnly: preset.weekdayOnly }] });
              e.target.value = "";
            }}
            className="input-field text-sm w-auto"
          >
            <option value="">+ Add item from tracker...</option>
            {scheduleItemPresets.map((preset) => {
              const base = settings.scheduleItems || defaultSettings.scheduleItems;
              const alreadyAdded = base.some((i) => i.key === preset.key);
              return (
                <option key={preset.key} value={preset.key} disabled={alreadyAdded}>
                  {alreadyAdded ? "✓ " : ""}{preset.label} {preset.guna ? `(${preset.guna})` : ""}
                </option>
              );
            })}
          </select>
          <button
            onClick={() => {
              const base = settings.scheduleItems || defaultSettings.scheduleItems;
              const newKey = `custom-${Date.now()}`;
              setSettings({ ...settings, scheduleItems: [...base, { key: newKey, label: "New item", icon: "✨" }] });
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={14} /> Custom
          </button>
        </div>
      </div>

      {/* Guna-based Habit Tracker */}
      <div className="mt-8 bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-6">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Anartha & Sādhana Tracker (Gunas)</h3>
        <p className="text-xs text-zinc-500 mb-4">
          Choose which habits and practices to track each day. The tracker covers all three modes of material nature (goodness, passion, ignorance) to help you learn and grow. Tracked items appear on the Daily Schedule tab.
        </p>
        <div className="space-y-2">
          {(settings.habits || defaultSettings.habits).map((habit, idx) => (
            <div key={habit.id} className="flex items-center gap-2 text-sm">
              <span className="text-lg">{habit.guna === "goodness" ? "🌟" : habit.guna === "passion" ? "🔥" : "🌑"}</span>
              <span className="flex-1 text-zinc-700 dark:text-zinc-300">
                {habit.label}
              </span>
              <span className={`text-xs ${habit.guna === "goodness" ? "text-emerald-600 dark:text-emerald-400" : habit.guna === "passion" ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"}`}>
                {habit.guna === "goodness" ? "Sattva" : habit.guna === "passion" ? "Rajas" : "Tamas"} · {habit.mode === "avoid" ? "avoid" : "practice"}
              </span>
              <label className="flex items-center gap-1 text-xs text-zinc-500 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={habit.tracked}
                  onChange={(e) => {
                    const base = settings.habits || defaultSettings.habits;
                    const updated = [...base];
                    updated[idx] = { ...habit, tracked: e.target.checked };
                    setSettings({ ...settings, habits: updated });
                  }}
                  className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                Track
              </label>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            id="new-habit-label"
            className="input-field text-sm !w-0 flex-1 min-w-0"
            placeholder="Add your own habit or practice"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const input = e.target as HTMLInputElement;
                const label = input.value.trim();
                if (!label) return;
                const gunaSelect = document.getElementById("new-habit-guna") as HTMLSelectElement | null;
                const guna = (gunaSelect?.value as "goodness" | "passion" | "ignorance") || "passion";
                const base = settings.habits || defaultSettings.habits;
                const newId = `custom-habit-${Date.now()}`;
                setSettings({ ...settings, habits: [...base, { id: newId, label, guna, mode: guna === "goodness" ? "practice" : "avoid", tracked: true }] });
                input.value = "";
              }
            }}
          />
          <select
            id="new-habit-guna"
            className="input-field text-sm !w-28"
            defaultValue="passion"
          >
            <option value="goodness">Sattva</option>
            <option value="passion">Rajas</option>
            <option value="ignorance">Tamas</option>
          </select>
        </div>
        <p className="text-xs text-zinc-400 mt-2">Press Enter in the input above to add a custom habit. Choose the guna before pressing Enter.</p>
      </div>

      {/* Data Management */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Data Management</h3>
        <p className="text-xs text-zinc-500 mb-4">
          Backups include <strong>all</strong> courses and localStorage data. The ChatGPT export is the same file, but the file name is labelled for sharing. You can also import any backup to fully restore the app.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => exportData(false)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Save size={16} />
            Export Backup
          </button>
          <button
            onClick={() => exportData(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <ExternalLink size={16} />
            Export for ChatGPT
          </button>
          <button
            onClick={importData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Import Backup
          </button>
          <button
            onClick={() => setSettings(defaultSettings)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 rounded-lg text-sm font-medium transition-colors"
          >
            <RotateCcw size={16} />
            Reset Settings
          </button>
          <button
            onClick={resetAll}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
}
