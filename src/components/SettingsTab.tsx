"use client";

import { Settings, Course, SadhanaStandards, RegulativePrinciples, StandardsChangeEntry, courseColors, curriculumBooks, bookCategories, defaultSadhanaStandards, defaultRegulativePrinciples, scheduleItems, defaultHabits, CustomScheduleItem } from "@/lib/data";
import { format } from "date-fns";
import { Save, RotateCcw, Plus, Trash2, Search, ChevronDown, ChevronRight } from "lucide-react";
import { defaultSettings } from "@/lib/data";
import { useState } from "react";

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
                    <label key={book} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer py-0.5 hover:text-zinc-900 dark:hover:text-zinc-200">
                      <input
                        type="checkbox"
                        checked={selectedBooks.includes(book)}
                        onChange={() => toggleBook(book)}
                        className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      {book}
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

  const raiseStandard = (field: "minScorePercent" | "weeklyMinDays", newValue: number) => {
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
      return {
        ...c,
        sadhanaStandards: {
          ...c.sadhanaStandards,
          [field]: newValue,
          description: `${field === "minScorePercent" ? newValue : c.sadhanaStandards.minScorePercent}% daily min, ${field === "weeklyMinDays" ? newValue : c.sadhanaStandards.weeklyMinDays} days/week`,
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

interface Props {
  settings: Settings;
  setSettings: (value: Settings | ((prev: Settings) => Settings)) => void;
  courses: Course[];
  setCourses: (value: Course[] | ((prev: Course[]) => Course[])) => void;
  activeCourseId: string;
  onCreateCourse: (name: string, color: string, startDate: string, endDate: string, books: string[], sadhanaStandards?: SadhanaStandards, regulativePrinciples?: RegulativePrinciples) => void;
  onSwitchCourse: (courseId: string) => void;
}

export function SettingsTab({ settings, setSettings, courses, setCourses, activeCourseId, onCreateCourse, onSwitchCourse }: Props) {
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseColor, setNewCourseColor] = useState("amber");
  const [newCourseStart, setNewCourseStart] = useState("");
  const [newCourseEnd, setNewCourseEnd] = useState("");
  const [newCourseBooks, setNewCourseBooks] = useState<string[]>([]);
  const [newCourseMinScore, setNewCourseMinScore] = useState(55);
  const [newCourseMinDays, setNewCourseMinDays] = useState(5);
  const [newCourseRequiredItems, setNewCourseRequiredItems] = useState<string[]>(["personalStudy"]);
  const [showNewCourseForm, setShowNewCourseForm] = useState(false);
  const updateSetting = (field: keyof Settings, value: unknown) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const resetAll = () => {
    if (confirm("Are you sure you want to reset ALL data? This will clear your daily log, curriculum progress, and everything else.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const prefix = `sastra-${activeCourseId}`;

  const exportData = () => {
    const data = {
      course: courses.find((c) => c.id === activeCourseId),
      settings: JSON.parse(localStorage.getItem(`${prefix}-settings`) || "{}"),
      curriculum: JSON.parse(localStorage.getItem(`${prefix}-curriculum`) || "[]"),
      dailyLog: JSON.parse(localStorage.getItem(`${prefix}-daily-log`) || "[]"),
      bookProgress: JSON.parse(localStorage.getItem(`${prefix}-book-progress`) || "[]"),
      verseMemory: JSON.parse(localStorage.getItem(`${prefix}-verse-memory`) || "[]"),
      weeklyReflections: JSON.parse(localStorage.getItem(`${prefix}-weekly-reflections`) || "[]"),
      japaLog: JSON.parse(localStorage.getItem(`${prefix}-japa-log`) || "[]"),
      scheduleLog: JSON.parse(localStorage.getItem(`${prefix}-schedule-log`) || "[]"),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sastra-study-backup-${activeCourseId}-${new Date().toISOString().split("T")[0]}.json`;
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
          if (data.settings) localStorage.setItem(`${prefix}-settings`, JSON.stringify(data.settings));
          if (data.curriculum) localStorage.setItem(`${prefix}-curriculum`, JSON.stringify(data.curriculum));
          if (data.dailyLog) localStorage.setItem(`${prefix}-daily-log`, JSON.stringify(data.dailyLog));
          if (data.bookProgress) localStorage.setItem(`${prefix}-book-progress`, JSON.stringify(data.bookProgress));
          if (data.verseMemory) localStorage.setItem(`${prefix}-verse-memory`, JSON.stringify(data.verseMemory));
          if (data.weeklyReflections) localStorage.setItem(`${prefix}-weekly-reflections`, JSON.stringify(data.weeklyReflections));
          if (data.japaLog) localStorage.setItem(`${prefix}-japa-log`, JSON.stringify(data.japaLog));
          if (data.scheduleLog) localStorage.setItem(`${prefix}-schedule-log`, JSON.stringify(data.scheduleLog));
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
    <div className="p-8 max-w-2xl">
      <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-6">Settings</h2>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-6 space-y-5">
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
            <p className="text-xs text-zinc-500 mt-1">Drives weekly due dates</p>
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
            <p className="text-xs text-zinc-500 mt-1">Eight-month curriculum</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Weekly Target Hours
            </label>
            <input
              type="number"
              step="0.5"
              value={settings.weeklyTargetHours}
              onChange={(e) => updateSetting("weeklyTargetHours", parseFloat(e.target.value) || 16)}
              className="input-field"
            />
            <p className="text-xs text-zinc-500 mt-1">2 hrs Mon–Fri + 3 hrs Sat/Sun recommended</p>
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
            <p className="text-xs text-zinc-500 mt-1">For study-complete checkbox</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Target Finish Date
            </label>
            <input
              type="date"
              value={settings.targetFinishDate}
              onChange={(e) => updateSetting("targetFinishDate", e.target.value)}
              className="input-field"
            />
            <p className="text-xs text-zinc-500 mt-1">Calculated from start + target weeks</p>
          </div>
        </div>
      </div>

      {/* Course Management */}
      <div className="mt-8 bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Courses</h3>
          <button
            onClick={() => setShowNewCourseForm(!showNewCourseForm)}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Plus size={14} />
            New Course
          </button>
        </div>

        <p className="text-xs text-zinc-500 mb-4">
          Each course is a timeboxed study window with its own books, curriculum, and progress. Switch between courses to view past progress.
        </p>

        {/* Existing courses */}
        <div className="space-y-2 mb-4">
          {courses.map((course) => {
            const cc = courseColors.find((c) => c.id === course.color) || courseColors[0];
            const isActive = course.id === activeCourseId;
            return (
              <div
                key={course.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  isActive ? `${cc.bg} ${cc.border}` : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                }`}
              >
                <span className={`w-4 h-4 rounded-full ${cc.accent}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isActive ? cc.text : "text-zinc-700 dark:text-zinc-200"}`}>
                    {course.name}
                    {isActive && <span className="ml-2 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-1.5 py-0.5 rounded">Active</span>}
                  </p>
                  <p className="text-xs text-zinc-500">{course.startDate} → {course.endDate}</p>
                  {course.books && course.books.length > 0 && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                      📚 {course.books.join(", ")}
                    </p>
                  )}
                  {course.sadhanaStandards && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                      📊 {course.sadhanaStandards.description}
                    </p>
                  )}
                </div>
                {!isActive && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSwitchCourse(course.id)}
                      className="px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors"
                    >
                      Switch
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${course.name}"? This will remove all its data.`)) {
                          // Remove course-specific localStorage entries
                          const p = `sastra-${course.id}`;
                          const keys = Object.keys(localStorage).filter((k) => k.startsWith(p));
                          keys.forEach((k) => localStorage.removeItem(k));
                          setCourses((prev) => prev.filter((c) => c.id !== course.id));
                        }
                      }}
                      className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Active Course Standards Editor (Ratchet-Only) */}
        <ActiveCourseStandardsEditor
          courses={courses}
          setCourses={setCourses}
          activeCourseId={activeCourseId}
        />

        {/* New course form */}
        {showNewCourseForm && (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <h4 className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-3">Create New Course</h4>
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

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!newCourseName.trim()) return;
                  const standards: SadhanaStandards = {
                    minScorePercent: newCourseMinScore,
                    requiredItems: newCourseRequiredItems,
                    weeklyMinDays: newCourseMinDays,
                    description: `${newCourseMinScore}% daily min, ${newCourseMinDays} days/week, required: ${newCourseRequiredItems.map(k => scheduleItems.find(s => s.key === k)?.label || k).join(", ")}`,
                  };
                  onCreateCourse(newCourseName.trim(), newCourseColor, newCourseStart, newCourseEnd, newCourseBooks, standards);
                  setNewCourseName("");
                  setNewCourseStart("");
                  setNewCourseEnd("");
                  setNewCourseBooks([]);
                  setNewCourseMinScore(55);
                  setNewCourseMinDays(5);
                  setNewCourseRequiredItems(["personalStudy"]);
                  setShowNewCourseForm(false);
                }}
                disabled={!newCourseName.trim() || newCourseBooks.length === 0}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Create & Switch
              </button>
              <button
                onClick={() => setShowNewCourseForm(false)}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
              >
                Cancel
              </button>
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
            <div key={item.key} className="flex items-center gap-2">
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
              setSettings({ ...settings, scheduleItems: [...base, { key: preset.key, label: preset.label, icon: preset.icon, linkedToJapa: preset.linkedToJapa }] });
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
      <div className="mt-8 bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-6">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Data Management</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Save size={16} />
            Export Backup
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
