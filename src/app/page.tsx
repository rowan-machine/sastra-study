"use client";

import { Dashboard } from "@/components/Dashboard";
import { CurriculumTab } from "@/components/CurriculumTab";
import { DailyLogTab } from "@/components/DailyLogTab";
import { BookProgressTab, defaultBook } from "@/components/BookProgressTab";
import { VerseMemoryTab } from "@/components/VerseMemoryTab";
import { WeeklyReflectionTab } from "@/components/WeeklyReflectionTab";
import { SettingsTab } from "@/components/SettingsTab";
import { JapaTab } from "@/components/JapaTab";
import { TutorTab } from "@/components/TutorTab";
import { ScheduleTab } from "@/components/ScheduleTab";
import { QuizTab } from "@/components/QuizTab";
import { SanghaTab } from "@/components/SanghaTab";
import { NotesTab } from "@/components/NotesTab";
import { PrabhupadaLibraryTab } from "@/components/PrabhupadaLibraryTab";
import { SpiritualMasterTab } from "@/components/SpiritualMasterTab";
import { GunaReportTab } from "@/components/GunaReportTab";
import { SevaTab } from "@/components/SevaTab";
import { CalendarTab } from "@/components/CalendarTab";
import { ProjectionTab } from "@/components/ProjectionTab";
import { CharacterAssessmentTab } from "@/components/CharacterAssessmentTab";
import { PosterViewerTab } from "@/components/PosterViewerTab";
import { DiscipleCourseTab } from "@/components/DiscipleCourseTab";
import { TimerProvider } from "@/components/TimerProvider";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { format, addWeeks, parseISO } from "date-fns";
import {
  Settings,
  CurriculumWeek,
  DailyLogEntry,
  BookProgress,
  VerseMemory,
  WeeklyReflection,
  JournalEntry,
  JapaEntry,
  SevaEntry,
  Poster,
  SevaNote,
  DiscipleLesson,
  DiscipleCourseMeta,
  TutorSession,
  ScheduleDay,
  DevoteeContact,
  SanskritTerm,
  QuestionEntry,
  SavedAnswer,
  LectureNote,
  SpiritualMaster,
  QuizResult,
  Course,
  SadhanaStandards,
  RegulativePrinciples,
  courseColors,
  curriculumBooks,
  defaultCourse,
  expansionCourse,
  prabhupadaBiographyCourse,
  consolidationCourse,
  deepeningCourse,
  continuationCourse,
  defaultReadingWishlist,
  WishlistBook,
  defaultSadhanaStandards,
  defaultRegulativePrinciples,
  defaultSettings,
  generateCurriculum,
  seedCurriculum,
  seedDailyLog,
  seedBookProgress,
  seedBiographyBookProgress,
  seedVerseMemory,
  seedWeeklyReflections,
  seedJapaLog,
  seedSevaLog,
  seedTutorSessions,
  seedScheduleLog,
  seedVocabulary,
  seedLectureNotes,
  seedDiscipleLessons,
  seedDiscipleCourseMeta,
  calcScore,
  getVerseProgressForWeek,
  getPlannedWeeksFromCurriculum,
  getDefaultEstimatedTotalHours,
  getBookAbbreviation,
  bookMatches,
  CharacterAssessment,
  autoDetectPriority,
  shiftCurriculumAssignments,
} from "@/lib/data";
import { devoteeContactsBackup } from "@/lib/devotee-contacts-backup";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Calendar,
  BookOpen,
  PenLine,
  Brain,
  MessageSquare,
  Settings2,
  Flame,
  GraduationCap,
  ClipboardCheck,
  Layers,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Users,
  Sparkles,
  Notebook,
  Telescope,
  Shield,
  Image,
  Heart,
  UserRound,
  Crown,
} from "lucide-react";

// Top-of-sidebar standalone item (never collapsed). Settings is opened via the
// gear button in the sidebar header, so it doesn't need a nav entry.
const homeItem = { id: "dashboard", label: "Dashboard", icon: LayoutDashboard } as const;

// Modular sections — each collapsible, each with its own header icon.
// Course modules first (Śāstra + Disciple), then cross-course universals.
const sections = [
  {
    id: "sastra-course",
    title: "\u015a\u0101stra Study",
    subtitle: "Active course",
    icon: Layers,
    items: [
      { id: "curriculum", label: "Curriculum", icon: CalendarDays },
      { id: "books", label: "Books", icon: BookOpen },
      { id: "daily-log", label: "Study Log", icon: PenLine },
      { id: "verses", label: "Verse Memory", icon: Brain },
      { id: "tutor", label: "Tutor & Cards", icon: GraduationCap },
      { id: "quiz", label: "Daily Quiz", icon: HelpCircle },
      { id: "reflections", label: "Reflection", icon: MessageSquare },
      { id: "projection", label: "Projection", icon: Telescope },
    ] as const,
  },
  {
    id: "disciple-course-module",
    title: "Disciple Course",
    subtitle: "ISKCON initiation prep",
    icon: UserRound,
    items: [
      { id: "spiritual-master", label: "Spiritual Master", icon: Crown },
      { id: "disciple-course", label: "Lessons & Homework", icon: UserRound },
    ] as const,
  },
  {
    id: "sadhana",
    title: "S\u0101dhana",
    subtitle: "Daily practice",
    icon: Flame,
    items: [
      { id: "schedule", label: "Daily S\u0101dhan\u0101", icon: ClipboardCheck },
      { id: "japa", label: "Japa", icon: Flame },
      { id: "seva", label: "Sev\u0101 Log", icon: Heart },
      { id: "character", label: "Character", icon: Shield },
      { id: "guna-report", label: "Gu\u1e47a Report", icon: Sparkles },
    ] as const,
  },
  {
    id: "reference",
    title: "Reference",
    subtitle: "Universal library",
    icon: Notebook,
    items: [
      { id: "notes", label: "Lecture Notes", icon: Notebook },
      { id: "prabhupada-library", label: "Prabhup\u0101da Library", icon: Sparkles },
      { id: "posters", label: "Posters", icon: Image },
      { id: "calendar", label: "Vai\u1e63\u1e47ava Calendar", icon: Calendar },
    ] as const,
  },
  {
    id: "community",
    title: "Community",
    subtitle: "Sa\u1e45gha & guru",
    icon: Users,
    items: [
      { id: "sangha", label: "Sa\u1e45gha & Ref", icon: Users },
    ] as const,
  },
] as const;

type TabId =
  | typeof homeItem["id"]
  | "settings"
  | (typeof sections)[number]["items"][number]["id"];

// One-time migration: move old un-prefixed keys to course-1 prefixed keys
function migrateOldData() {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem("sastra-migrated-v2")) {
    const oldKeys = ["settings", "curriculum", "daily-log", "book-progress", "verse-memory", "weekly-reflections", "japa-log", "tutor-sessions", "schedule-log"];
    for (const k of oldKeys) {
      const oldKey = `sastra-${k}`;
      const newKey = `sastra-course-1-${k}`;
      const data = localStorage.getItem(oldKey);
      if (data && !localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, data);
      }
    }
    localStorage.setItem("sastra-migrated-v2", "true");
  }

  // Fix: if course-1 curriculum has generic "Part X" assignments, nuke it so seed data loads fresh
  if (!localStorage.getItem("sastra-curriculum-fix-v1")) {
    const key = "sastra-course-1-curriculum";
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (Array.isArray(data) && data.some((w: { assignment?: string }) => /^Part \d+$/.test(w.assignment || ""))) {
          localStorage.removeItem(key);
        }
      } catch { /* ignore parse errors */ }
    }
    localStorage.setItem("sastra-curriculum-fix-v1", "true");
  }

  // Fix: normalize legacy schedule log entries where obeisances may be boolean or missing
  if (!localStorage.getItem("sastra-obeisances-fix-v1")) {
    const keys = Object.keys(localStorage).filter((k) => k.endsWith("-schedule-log"));
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          const normalized = data.map((entry: Record<string, unknown>) => {
            if (entry.obeisances === undefined || entry.obeisances === null) return { ...entry, obeisances: 0 };
            if (typeof entry.obeisances === "boolean") return { ...entry, obeisances: entry.obeisances ? 3 : 0 };
            if (typeof entry.obeisances === "number") return { ...entry, obeisances: Math.max(0, Math.min(3, entry.obeisances)) };
            return { ...entry, obeisances: 0 };
          });
          localStorage.setItem(key, JSON.stringify(normalized));
        }
      } catch { /* ignore parse errors */ }
    }
    localStorage.setItem("sastra-obeisances-fix-v1", "true");
  }

  // Fix: add expansion course to existing course list if missing
  if (!localStorage.getItem("sastra-expansion-course-fix-v1")) {
    const key = "sastra-courses";
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const data = JSON.parse(raw) as Course[];
        if (Array.isArray(data) && !data.some((c) => c.id === expansionCourse.id)) {
          localStorage.setItem(key, JSON.stringify([...data, expansionCourse]));
        }
      } catch { /* ignore parse errors */ }
    }
    localStorage.setItem("sastra-expansion-course-fix-v1", "true");
  }

  // Fix: clear stale Expansion course curriculum that carried over Foundation assignments
  if (!localStorage.getItem("sastra-expansion-curriculum-fix-v1")) {
    const key = "sastra-course-2-curriculum";
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const data = JSON.parse(raw) as CurriculumWeek[];
        if (Array.isArray(data) && data.some((w) => w.book === "Śrīmad-Bhāgavatam Canto 1 Part 2" && w.assignment.includes("3.19"))) {
          localStorage.removeItem(key);
        }
      } catch { /* ignore parse errors */ }
    }
    localStorage.setItem("sastra-expansion-curriculum-fix-v1", "true");
  }

  // Fix: sync expansion course book order from source code and regenerate curriculum
  if (!localStorage.getItem("sastra-expansion-books-sync-v1")) {
    const key = "sastra-courses";
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const data = JSON.parse(raw) as Course[];
        if (Array.isArray(data)) {
          const idx = data.findIndex((c) => c.id === "course-2");
          if (idx >= 0) {
            data[idx] = { ...data[idx], books: expansionCourse.books };
            localStorage.setItem(key, JSON.stringify(data));
          }
        }
      } catch { /* ignore parse errors */ }
    }
    // Also clear the stale curriculum so it regenerates with new book order
    localStorage.removeItem("sastra-course-2-curriculum");
    localStorage.setItem("sastra-expansion-books-sync-v1", "true");
  }

  // Fix: reset Foundation course-1 bookProgress if it was regenerated with default 1-week/10-hour values
  if (!localStorage.getItem("sastra-book-progress-fix-v1")) {
    const key = "sastra-course-1-book-progress";
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const data = JSON.parse(raw) as BookProgress[];
        if (Array.isArray(data) && data.length > 0) {
          const hasStaleDefaults = data.every((b) => b.plannedWeeks === 1 && b.estimatedTotalHours === 10);
          const matchesSeedBooks = defaultCourse.books.every((book) => data.some((b) => b.book === book));
          if (hasStaleDefaults || !matchesSeedBooks) {
            localStorage.setItem(key, JSON.stringify(seedBookProgress));
          }
        }
      } catch { /* ignore parse errors */ }
    }
    localStorage.setItem("sastra-book-progress-fix-v1", "true");
  }

  // Fix: clear stale Expansion course curriculum with out-of-order TLC assignments
  if (!localStorage.getItem("sastra-expansion-curriculum-fix-v2")) {
    const key = "sastra-course-2-curriculum";
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const data = JSON.parse(raw) as CurriculumWeek[];
        if (Array.isArray(data)) {
          // Check if any TLC week is out of order (e.g. "Chapters 25–32" before "Chapters 17–24")
          const tlcWeeks = data.filter((w) => w.book.toLowerCase().includes("teachings of lord caitanya"));
          let outOfOrder = false;
          for (let i = 1; i < tlcWeeks.length; i++) {
            const prev = tlcWeeks[i - 1].week;
            const curr = tlcWeeks[i].week;
            if (curr < prev) { outOfOrder = true; break; }
          }
          if (outOfOrder || tlcWeeks.some((w, i) => i > 0 && w.assignment === tlcWeeks[0].assignment && w.week !== tlcWeeks[0].week)) {
            localStorage.removeItem(key);
          }
        }
      } catch { /* ignore parse errors */ }
    }
    localStorage.setItem("sastra-expansion-curriculum-fix-v2", "true");
  }

  // Fix: ensure seed BG 4.4/4.5 vocabulary terms are present in localStorage
  if (!localStorage.getItem("sastra-vocab-seed-fix-v1")) {
    const keys = Object.keys(localStorage).filter((k) => k.endsWith("-vocabulary"));
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const data = JSON.parse(raw) as SanskritTerm[];
        if (Array.isArray(data)) {
          const existing = new Set(data.map((t) => t.term));
          const merged = [...seedVocabulary.filter((t) => !existing.has(t.term)), ...data];
          localStorage.setItem(key, JSON.stringify(merged));
        }
      } catch { /* ignore parse errors */ }
    }
    localStorage.setItem("sastra-vocab-seed-fix-v1", "true");
  }
}

export default function Home() {
  // Run migration on mount
  if (typeof window !== "undefined") migrateOldData();

  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [focusVerseId, setFocusVerseId] = useState<string | null>(null);
  const [focusEventId, setFocusEventId] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useLocalStorage<string[]>(
    "sastra-sidebar-collapsed",
    // Collapse everything by default except the currently-active course (Śāstra) —
    // the user opted for less noise at this level.
    ["disciple-course-module", "reference", "community"]
  );
  const collapsedSet = useMemo(() => new Set(collapsedSections), [collapsedSections]);
  const toggleSection = (id: string) => {
    setCollapsedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };
  // If the active tab is inside a collapsed section, expand that section.
  useEffect(() => {
    const owner = sections.find((s) => s.items.some((i) => i.id === activeTab));
    if (owner && collapsedSet.has(owner.id)) {
      setCollapsedSections((prev) => prev.filter((s) => s !== owner.id));
    }
  }, [activeTab, collapsedSet, setCollapsedSections]);
  const [courses, setCourses] = useLocalStorage<Course[]>("sastra-courses", [
    defaultCourse,
    expansionCourse,
    prabhupadaBiographyCourse,
    consolidationCourse,
    deepeningCourse,
    continuationCourse,
  ]);
  const [activeCourseId, setActiveCourseId] = useLocalStorage<string>("sastra-active-course", defaultCourse.id);
  const [showCourseSwitcher, setShowCourseSwitcher] = useState(false);
  const [readingWishlist, setReadingWishlist] = useLocalStorage<WishlistBook[]>(
    "sastra-reading-wishlist",
    defaultReadingWishlist
  );

  // One-time patch: append the biography track + Courses III/IV/V to existing
  // installs that already had only Foundation + Expansion seeded.
  useEffect(() => {
    const patchKey = "sastra-courses-iii-iv-v-seed-v1";
    if (typeof window === "undefined") return;
    if (localStorage.getItem(patchKey)) return;
    const additions = [
      prabhupadaBiographyCourse,
      consolidationCourse,
      deepeningCourse,
      continuationCourse,
    ];
    setCourses((prev) => {
      const existingIds = new Set(prev.map((c) => c.id));
      const toAdd = additions.filter((c) => !existingIds.has(c.id));
      if (toAdd.length === 0) return prev;
      return [...prev, ...toAdd];
    });
    localStorage.setItem(patchKey, "1");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One-time patch: seed biography book progress records for the parallel
  // Prabhupāda Biography course, including Swami in a Strange Land page data.
  useEffect(() => {
    const patchKey = "sastra-course-bio-book-progress-seeded-v2";
    if (typeof window === "undefined") return;
    if (localStorage.getItem(patchKey)) return;
    const key = "sastra-course-bio-book-progress";
    const raw = localStorage.getItem(key);
    let existing: BookProgress[] = [];
    if (raw) {
      try {
        existing = JSON.parse(raw) as BookProgress[];
      } catch { /* ignore */ }
    }
    if (!Array.isArray(existing) || existing.length === 0) {
      localStorage.setItem(key, JSON.stringify(seedBiographyBookProgress));
    } else {
      // Merge seed metadata into existing records while preserving any user
      // reading progress that has already been logged.
      const merge = (seed: BookProgress, prev: BookProgress | undefined): BookProgress => {
        if (!prev) return seed;
        return {
          ...seed,
          plannedWeeks: seed.plannedWeeks,
          estimatedTotalHours: seed.estimatedTotalHours,
          progressNotes: seed.progressNotes,
          totalPages: seed.totalPages,
          totalParts: seed.totalParts,
          totalChapters: seed.totalChapters,
          currentPage: prev.currentPage ?? seed.currentPage,
          currentPart: prev.currentPart ?? seed.currentPart,
          currentChapter: prev.currentChapter ?? seed.currentChapter,
          dailyPagesTarget: prev.dailyPagesTarget ?? seed.dailyPagesTarget,
          hoursLogged: prev.hoursLogged,
          percentComplete: prev.percentComplete,
          complete: prev.complete,
          startDate: prev.startDate,
          finishDate: prev.finishDate,
          slowPaceStreak: prev.slowPaceStreak,
          slowPaceLastLoggedDate: prev.slowPaceLastLoggedDate,
          characters: prev.characters && prev.characters.length > 0 ? prev.characters : seed.characters,
        };
      };
      const merged = seedBiographyBookProgress.map((seed) => {
        const idx = existing.findIndex((p) => p.book === seed.book);
        return idx >= 0 ? merge(seed, existing[idx]) : seed;
      });
      const existingIds = new Set(merged.map((p) => p.book));
      const extras = existing.filter((p) => !existingIds.has(p.book));
      localStorage.setItem(key, JSON.stringify([...merged, ...extras]));
    }
    localStorage.setItem(patchKey, "1");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One-time patch: seed the user's open questions from this conversation.
  useEffect(() => {
    const patchKey = "sastra-open-questions-seeded-v1";
    if (typeof window === "undefined") return;
    if (localStorage.getItem(patchKey)) return;
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const newQuestions: QuestionEntry[] = [
      {
        id: `q-${Date.now()}-1`,
        question: "How does one differentiate emotional numbness from true detachment?",
        context:
          "Steadiness (BG 5.20) — 'A spiritually mature person is not intoxicated by success, not crushed by failure.' This is not emotional numbness, but emotional stability grounded in knowledge of the soul.",
        dateAsked: today,
        status: "open",
        potentialResponses: "",
        answer: "",
        source: "",
        actionsToTake: "",
      },
      {
        id: `q-${Date.now()}-2`,
        question: "In public crises, should I react with detached equanimity, with compassion and emotion, or some combination? Does equanimity neuter the anger that stimulates necessary action?",
        context:
          "Personal struggle: I tend to detach and be neutral even when others close to me show emotion. I prefer equanimity, but I wonder if suppressing anger is ignorance or detachment.",
        dateAsked: today,
        status: "open",
        potentialResponses: "",
        answer: "",
        source: "",
        actionsToTake: "",
      },
      {
        id: `q-${Date.now()}-3`,
        question: "What are practical ways to offer my work to Kṛṣṇa?",
        context:
          "General sādhana question arising from the concept of karma-yoga and offering the results of one's actions to the Supreme.",
        dateAsked: today,
        status: "open",
        potentialResponses: "",
        answer: "",
        source: "",
        actionsToTake: "",
      },
    ];
    const addToLog = (prefixKey: string) => {
      const key = `${prefixKey}-questions`;
      const raw = localStorage.getItem(key);
      let existing: QuestionEntry[] = [];
      if (raw) {
        try { existing = JSON.parse(raw) as QuestionEntry[]; } catch { /* ignore */ }
      }
      if (!Array.isArray(existing)) existing = [];
      const existingQuestions = new Set(existing.map((q) => q.question));
      const toAdd = newQuestions.filter((q) => !existingQuestions.has(q.question));
      if (toAdd.length > 0) {
        localStorage.setItem(key, JSON.stringify([...existing, ...toAdd]));
      }
    };
    addToLog("sastra-course-1");
    addToLog("sastra-course-bio");
    addToLog("sastra-course-2");
    localStorage.setItem(patchKey, "1");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Patch legacy courses missing required fields or obeisances target
  useEffect(() => {
    const needsPatch = courses.some((c) =>
      !c.books || c.books.length === 0 ||
      !c.sadhanaStandards ||
      c.sadhanaStandards.obeisancesTarget === undefined ||
      !c.originalBaseline ||
      c.originalBaseline.obeisancesTarget === undefined ||
      !c.regulativePrinciples
    );
    if (needsPatch) {
      setCourses((prev) => prev.map((c) => {
        const baseSad = c.sadhanaStandards || defaultSadhanaStandards;
        const patchedSad = {
          ...baseSad,
          obeisancesTarget: baseSad.obeisancesTarget ?? 1,
        };
        const baseBaseline = c.originalBaseline || baseSad;
        const patchedBaseline = {
          ...baseBaseline,
          obeisancesTarget: baseBaseline.obeisancesTarget ?? 1,
        };
        return {
          ...c,
          books: c.books && c.books.length > 0 ? c.books : [...curriculumBooks],
          sadhanaStandards: patchedSad,
          originalBaseline: patchedBaseline,
          standardsHistory: c.standardsHistory || [],
          regulativePrinciples: c.regulativePrinciples || defaultRegulativePrinciples,
        };
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0];
  const courseColor = courseColors.find((c) => c.id === activeCourse?.color) || courseColors[0];
  const prefix = `sastra-${activeCourseId}`;

  const [settings, setSettings, isSettingsHydrated] = useLocalStorage<Settings>(`${prefix}-settings`, defaultSettings);
  const curriculumSyncRef = useRef<string>("");

  // Reset curriculum sync signature when changing courses so we never compare a
  // new course's structure to the previous course's cached signature.
  useEffect(() => {
    curriculumSyncRef.current = "";
  }, [activeCourseId]);

  // Patch legacy settings missing scheduleItems, habits, paceMultiplier, or weekendTargetHours
  useEffect(() => {
    const updates: Partial<Settings> = {};
    if (!settings.scheduleItems) {
      updates.scheduleItems = defaultSettings.scheduleItems;
    }
    // Insert Shower, Tilak right after wake-up in legacy settings that don't have it yet.
    const currentSchedule = updates.scheduleItems || settings.scheduleItems || defaultSettings.scheduleItems;
    if (!currentSchedule.some((i) => i.key === "showerTilak")) {
      const wakeIdx = currentSchedule.findIndex((i) => i.key === "wakeUp330");
      const showerItem = defaultSettings.scheduleItems.find((i) => i.key === "showerTilak")!;
      if (wakeIdx >= 0) {
        updates.scheduleItems = [
          ...currentSchedule.slice(0, wakeIdx + 1),
          showerItem,
          ...currentSchedule.slice(wakeIdx + 1),
        ];
      } else {
        updates.scheduleItems = [showerItem, ...currentSchedule];
      }
    }
    if (!settings.habits) {
      updates.habits = defaultSettings.habits;
    }
    if (settings.paceMultiplier === undefined || settings.paceMultiplier === null) {
      updates.paceMultiplier = defaultSettings.paceMultiplier;
    }
    if (settings.weekendTargetHours === undefined || settings.weekendTargetHours === null) {
      updates.weekendTargetHours = defaultSettings.weekendTargetHours;
    }
    if (settings.minimumDailyStudyHours === undefined || settings.minimumDailyStudyHours === null) {
      updates.minimumDailyStudyHours = defaultSettings.minimumDailyStudyHours;
    }
    if (settings.ekadashiFastingRequired === undefined) {
      updates.ekadashiFastingRequired = defaultSettings.ekadashiFastingRequired;
    }
    // Derive weekly target from weekday/weekend if missing, invalid, or out of sync
    const weekday = updates.minimumDailyStudyHours ?? settings.minimumDailyStudyHours ?? defaultSettings.minimumDailyStudyHours;
    const weekend = updates.weekendTargetHours ?? settings.weekendTargetHours ?? defaultSettings.weekendTargetHours;
    const expectedWeeklyTarget = Math.round((5 * (weekday as number) + 2 * (weekend as number)) * 2) / 2;
    if (
      settings.weeklyTargetHours === undefined ||
      settings.weeklyTargetHours === null ||
      !Number.isFinite(settings.weeklyTargetHours) ||
      settings.weeklyTargetHours !== expectedWeeklyTarget
    ) {
      updates.weeklyTargetHours = expectedWeeklyTarget;
    }
    if (Object.keys(updates).length > 0) {
      setSettings({ ...settings, ...updates });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  // Auto-compute targetFinishDate from planStartDate + targetWeeks and sync the
  // active course's start/end dates so the two never drift apart.
  useEffect(() => {
    if (!activeCourse || !settings.planStartDate || !settings.targetWeeks) return;
    const newEndDate = format(addWeeks(parseISO(settings.planStartDate), settings.targetWeeks), "yyyy-MM-dd");
    if (settings.targetFinishDate !== newEndDate) {
      setSettings((prev) => ({ ...prev, targetFinishDate: newEndDate }));
    }
    setCourses((prev) => {
      const idx = prev.findIndex((c) => c.id === activeCourse.id);
      if (idx === -1) return prev;
      const course = prev[idx];
      if (course.startDate === settings.planStartDate && course.endDate === newEndDate) return prev;
      const updated = [...prev];
      updated[idx] = { ...course, startDate: settings.planStartDate, endDate: newEndDate };
      return updated;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.planStartDate, settings.targetWeeks, activeCourse?.id]);

  const [curriculum, setCurriculum] = useLocalStorage<CurriculumWeek[]>(
    `${prefix}-curriculum`,
    activeCourse.id === "course-1" ? seedCurriculum : generateCurriculum(activeCourse.books, activeCourse.startDate, settings.targetWeeks, settings.weeklyTargetHours, activeCourse.firstBookStartChapter, settings.paceMultiplier)
  );

  // Sync curriculum when course books/settings change (regenerate structure, preserve user edits)
  useEffect(() => {
    if (!activeCourse) return;
    const signature = `${activeCourse.id}:${activeCourse.books.join(",")}:${activeCourse.startDate}:${settings.targetWeeks}:${settings.weeklyTargetHours}:${settings.weekendTargetHours}:${settings.minimumDailyStudyHours}:${settings.paceMultiplier}`;
    if (curriculumSyncRef.current === signature) return;

    const previousSignature = curriculumSyncRef.current;
    curriculumSyncRef.current = signature;

    const previousBooks = previousSignature ? previousSignature.split(":")[1] : null;
    const previousPace = previousSignature ? previousSignature.split(":")[7] : null;
    const currentBooks = activeCourse.books.join(",");
    const booksChanged = previousBooks !== currentBooks;
    const paceChanged = previousPace !== null && previousPace !== String(settings.paceMultiplier);

    // If the seed course is loading for the first time and only targetHours changed (no pace/book change), just update hours
    if (activeCourse.id === "course-1" && previousBooks === null && !paceChanged) {
      setCurriculum((prev) => {
        if (prev.length === 0) return seedCurriculum;
        return prev.map((week) => ({
          ...week,
          targetHours: Math.round(settings.weeklyTargetHours * settings.paceMultiplier * 2) / 2,
        }));
      });
      return;
    }

    // If seed course and only targetHours changed (not pace, not books), just update hours
    if (activeCourse.id === "course-1" && !booksChanged && !paceChanged) {
      setCurriculum((prev) => {
        return prev.map((week) => ({
          ...week,
          targetHours: Math.round(settings.weeklyTargetHours * settings.paceMultiplier * 2) / 2,
        }));
      });
      return;
    }

    // Regenerate curriculum when books, pace, or targetWeeks change
    const generated = generateCurriculum(activeCourse.books, activeCourse.startDate, settings.targetWeeks, settings.weeklyTargetHours, activeCourse.firstBookStartChapter, settings.paceMultiplier);

    setCurriculum((prev) => {
      return generated.map((week) => {
        const existing = prev.find((p) => p.week === week.week && p.book === week.book);
        if (!existing) return week;
        return {
          ...week,
          // Always use the freshly generated assignment to avoid stale ordering bugs
          assignment: week.assignment,
          complete: existing.complete,
          reflection: existing.reflection,
          notes: existing.notes,
        };
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCourse.id, activeCourse.books, activeCourse.startDate, settings.targetWeeks, settings.weeklyTargetHours, settings.weekendTargetHours, settings.minimumDailyStudyHours, settings.paceMultiplier]);
  const [dailyLog, setDailyLog] = useLocalStorage<DailyLogEntry[]>(
    `${prefix}-daily-log`,
    activeCourse.id === "course-1" ? seedDailyLog : []
  );
  const [bookProgress, setBookProgress, isBookProgressHydrated] = useLocalStorage<BookProgress[]>(
    `${prefix}-book-progress`,
    activeCourse.id === "course-1" ? seedBookProgress : activeCourse.books.map((book) => defaultBook(book))
  );
  const [verseMemory, setVerseMemory, isVerseMemoryHydrated] = useLocalStorage<VerseMemory[]>(`${prefix}-verse-memory`, seedVerseMemory);
  const [weeklyReflections, setWeeklyReflections] = useLocalStorage<WeeklyReflection[]>(`${prefix}-weekly-reflections`, seedWeeklyReflections);
  const [journalEntries, setJournalEntries] = useLocalStorage<JournalEntry[]>(`${prefix}-journal-entries`, []);
  const [japaLog, setJapaLog, isJapaLogHydrated] = useLocalStorage<JapaEntry[]>(`${prefix}-japa-log`, seedJapaLog);
  const [sevaLog, setSevaLog] = useLocalStorage<SevaEntry[]>(`${prefix}-seva-log`, seedSevaLog);
  const seedSevaPosters: Poster[] = useMemo(
    () => [
      {
        id: "seva-poster-tulasi-2026-07-19",
        src: "/images/seva-posters/first-seva-poster.png",
        title: "Tulasī Sevā — Trimming Manjaris",
        addedAt: "2026-07-19T00:00:00.000Z",
        category: "seva",
        service: "Tulasi",
      },
    ],
    []
  );
  const [sevaPosters, setSevaPosters] = useLocalStorage<Poster[]>(`${prefix}-seva-posters`, seedSevaPosters);
  const [sevaNotes, setSevaNotes] = useLocalStorage<SevaNote[]>(`${prefix}-seva-notes`, []);

  // Disciple Course — universal (not course-prefixed) so it persists as
  // lifelong reference material across every Śāstra course.
  const [discipleLessons, setDiscipleLessons] = useLocalStorage<DiscipleLesson[]>(
    "sastra-disciple-course-lessons",
    seedDiscipleLessons
  );
  const [discipleMeta, setDiscipleMeta] = useLocalStorage<DiscipleCourseMeta>(
    "sastra-disciple-course-meta",
    seedDiscipleCourseMeta
  );

  // One-time seed: fill Lesson 1 of the Disciple Course from the July 19, 2026
  // orientation with the class notes, homework, exercises, and handbook screenshots.
  useEffect(() => {
    const patchKey = "sastra-disciple-lesson-1-seed-v1";
    if (typeof window === "undefined") return;
    if (localStorage.getItem(patchKey)) return;

    // Populate course meta (only touch fields still at their default)
    setDiscipleMeta((prev) => ({
      ...prev,
      teacher: prev.teacher || "Ram Ācārya Dāsa (Temple President, ISKCON St. Louis)",
      cohort: prev.cohort || "Cohort of July 2026",
      startDate: prev.startDate || "2026-07-19",
      notes: prev.notes ||
        [
          "Weekly schedule: Sat 1:00 PM (Session 1, before Harināma) + Sun 6:00 PM (Session 2).",
          "Course assistant: Vimala Devī Dāsī — handles logistics, handbook distribution, attendance.",
          "Assistant teacher: Magadhari Prabhu may cover some lessons.",
          "Handbook PDF distributed via WhatsApp by Vimala Mātājī.",
          "Prerequisite for first initiation in ISKCON.",
        ].join("\n"),
    }));

    // Populate Lesson 1 content
    setDiscipleLessons((prev) => {
      const idx = prev.findIndex((l) => l.lessonNumber === 1);
      if (idx < 0) return prev;
      const existing = prev[idx];
      // Do not overwrite if the user has already written notes in Lesson 1
      if (existing.notes && existing.notes.trim().length > 0) return prev;

      const seededLesson = {
        ...existing,
        scheduledDate: existing.scheduledDate || "2026-07-19",
        attendedDate: existing.attendedDate || "2026-07-19",
        attended: true,
        notes: [
          "# Lesson 1 — Welcome & Introduction",
          "",
          "**Class date:** Sunday, July 19, 2026 (orientation session, ~1 hour) · **Teacher:** Ram Ācārya Dāsa · **Assistant:** Vimala Devī Dāsī",
          "",
          "## Why this course exists",
          "- Mandatory prerequisite for **first initiation** in ISKCON.",
          "- Deepens understanding of the **guru–disciple relationship** and the role of the **Founder-Ācārya**, Śrīla Prabhupāda.",
          "- Response to a real problem the teacher sees: senior devotees who either (a) do not accept a spiritual master (\"I can just go directly to Kṛṣṇa\"), or (b) see the guru as merely an ordinary human being. Faith in guru is essential to the journey.",
          "",
          "## Course aim",
          "> _To improve the quality of discipleship within ISKCON in order to promote the long-term wellbeing of Śrīla Prabhupāda's society and its members._",
          "",
          "Achieved by enabling students to:",
          "1. Understand the long-standing principles of discipleship as presented in Śrīla Prabhupāda's teachings and the broader **Gauḍīya Vaiṣṇava** tradition.",
          "2. Appreciate the unique context in which these principles are applied within ISKCON.",
          "3. Form spiritually healthy, constructive relationships with their gurus and senior Vaiṣṇavas — and act appropriately within those relationships.",
          "4. Develop the values and attitudes required of a disciple, and cooperatively serve the Supreme Lord and His representatives to perpetuate Śrīla Prabhupāda's teachings and mission through personal example and instruction.",
          "",
          "## Course principles & values (all 10)",
          "1. **Śrīla Prabhupāda as pre-eminent Śikṣā-guru** — by default, he is your śikṣā-guru: you go to his temple, read his books, chant the mahā-mantra he brought, honor prasādam from his tradition.",
          "2. **Allegiance to ISKCON and paramparā**.",
          "3. **Respect for multiple authorities and senior Vaiṣṇavas** — ISKCON is a multi-authority system: dīkṣā-guru, śikṣā-guru, temple president, mentors, pathā-pradarśaka (\"one who shows the path\").",
          "4. **Considerate selection of dīkṣā-guru**.",
          "5. **Faith in the guru's instructions.**",
          "6. **Commitment to vows and Śrīla Prabhupāda's mission.**",
          "7. **Exemplary sādhana, conduct, and balanced lifestyle.**",
          "8. **Inquiry, humility, and service.**",
          "9. **Favorable association, inclusivity, and cooperation.**",
          "10. **Cultivation and propagation of the holy name.**",
          "",
          "## Key concepts introduced",
          "- **Guru-tattva** — the truth/science of the guru.",
          "- **Paramparā** — disciplic succession. Example lineage cited: Prabhupāda ← Bhaktisiddhānta Sarasvatī ← Gaura-kiśora Dāsa Bābājī ← Bhaktivinoda Ṭhākura …",
          "- **Dīkṣā-guru** vs. **Śikṣā-guru** — the initiator vs. the instructor. A person may have one dīkṣā-guru and several śikṣā-gurus. Śrīla Prabhupāda is śikṣā-guru for all ISKCON devotees; if your dīkṣā-guru is Prabhupāda's disciple, you are effectively Prabhupāda's grand-disciple.",
          "- **Vaiṣṇava** — a devotee/worshipper of Lord Viṣṇu/Kṛṣṇa.",
          "- **Sādhu-saṅga** — association with devotees is an aṅga (limb) of bhakti; Bhaktivinoda Ṭhākura: individually we lack strength, but together our devotion becomes powerful.",
          "- **Value triad:** Guru, śāstra, sādhu.",
          "",
          "## Course structure (14 lessons, 4 units)",
          "- **Unit 1 — Theory & context** (Lessons 1–4): Welcome; Guru-tattva & paramparā; Śrīla Prabhupāda as Founder-Ācārya; ISKCON gurus.",
          "- **Unit 2 — Establishing the relationship** (Lessons 5–7): Guru-padāśraya; Selection of guru; Initiation vows.",
          "- **Unit 3 — Acting in the relationship** (Lessons 8–11): Guru-pūjā; Guru-sevā; Guru vapu & vāṇī-sevā; Guru tyāga.",
          "- **Unit 4 — Co-operatively fulfilling the relationship** (Lessons 12–14): Presenting one's guru; Relationship with ISKCON; Course round-up.",
          "- Plus **appendices 1–10** as additional reading in the student handbook.",
          "",
          "## Norms for classroom behavior (read aloud in class)",
          "- Be present for the entire course.",
          "- Raise hands to contribute.",
          "- Value student contributions whether or not we agree.",
          "- No side conversations. No mobile calls during class.",
          "- Observe **confidentiality** — both within and outside the classroom.",
          "- Refrain from **borrowing strength from status or position** (seniority ≠ authority to override).",
          "- Respect anyone's right to withdraw from an exercise that makes them uncomfortable, without stating reasons.",
          "- Each accepts full responsibility for their own success.",
          "- Confront **issues/behavior, not people**.",
          "- Honor any agreement reached.",
          "",
          "## Methodology",
          "- **Interactive, not passive** — group exercises, role-play dramas, discussions.",
          "- Example exercise mentioned: two teams contrast a **humble approach** to resolving conflict vs. a **non-humble approach**, then act it out.",
          "- Participation in exercises is essential — cannot be replaced by watching recordings.",
          "",
          "## Assessment options",
          "- **Option A — Closed Book (short-answer / multiple-choice):** for those unable to attend live. 2.5-hour proctored exam, camera on. Passing grade per handbook: **70%**.",
          "- **Option B — Open Book (essay):** available to students attending live and participating in group exercises. Instructor will send questions after course completion; students have **7 days** to return answers using the handbook (or any reference). Passing grade the instructor stated in class: **50%**, aiming for 70%+ is \"very good.\"",
          "- Certificate is required when applying for **first initiation**.",
          "- Note the discrepancy: handbook (Option A) shows 70% required, but instructor stated 50% pass in the open-book track in class. Confirm with Ram Ācārya Prabhu.",
          "",
          "## Weekly schedule (agreed in this session)",
          "- **Saturday 1:00 PM** — Session 1 (before Harināma). 90 minutes.",
          "- **Sunday 6:00 PM** — Session 2. 90 minutes.",
          "- 7-week total run for 14 lessons at 2 sessions/week.",
          "- Devotees with work conflicts (e.g. alternate-weekend shifts) may watch recordings but must coordinate about group exercises with the instructor.",
          "",
          "## People in the cohort",
          "- **Ram Ācārya Dāsa** — Temple President, ISKCON St. Louis; disciple of H.H. Rādhānātha Swami; PhD (Washington State); IIT Kharagpur B.S./M.S.; teaches Bhakti Śāstrī, Bhakti Vaibhava, this course, plus Sunday feast classes.",
          "- **Vimala Devī Dāsī** — course assistant; disciple of Bhanu Swami Mahārāja (approx.); handles homework, attendance, WhatsApp handbook distribution.",
          "- **Magadhari Prabhu** — friend of the instructor; may teach a few lessons.",
          "- **Matthew Turner** — Kansas (≈1h40 from KC temple); surgeon; five children; also a Christian practitioner; runs a YouTube channel reading Prabhupāda's books; met devotees in 1987 in Utah.",
          "- **Eva** — originally Mumbai; based in KC; practicing seriously ~13 years; hoping to get initiated soon; works alternate weekends.",
          "- **Apnā Thāpā (Pramodi)** — student from Nepal at Abdullah University; ~2 years in KC consciousness, visits temple weekly.",
          "- **Manjirā Mātājī** — senior devotee in St. Louis; introduced to KC in 2003; chanting is her mainstay; instructor holds her in high regard.",
          "- **Ruti Rohit** — from Ahmedabad; pharma scientist in Cincinnati; joined to deepen understanding + prep for initiation.",
          "- **Bharat** (Ruti's husband) — in KC consciousness for 45+ years; considers this a step toward long-awaited initiation.",
          "- **Rowan Neri** — Kansas City (≈10 min from Rūpa-Manohara Vedic College temple); active ~1 year, recently returning after time away.",
          "",
          "## Closing verse cited (SB 4.23.7, purport)",
          "> _We have only to execute the order of the spiritual master, preach Kṛṣṇa consciousness, and follow in the path of the Vaiṣṇavas. The spiritual master represents both Lord Kṛṣṇa and the Vaiṣṇavas. Therefore, by following the instructions of the spiritual master and by chanting Hare Kṛṣṇa, everything will be all right._",
          "",
          "Ram Ācārya Prabhu closed by saying: _\"One lesson done. Now we have only thirteen to go.\"_",
        ].join("\n"),
        teacherQuotes: [
          "\"By default, Śrīla Prabhupāda is your śikṣā-guru — you go to his temple, read his books, chant the mahā-mantra he brought.\"",
          "\"Prabhupāda did pastime as an ordinary human being. He walked on this planet like you and me, but he was not one of us. He was a divine personality.\"",
          "\"If you don't have faith in your guru, it's very difficult to make the journey of Kṛṣṇa consciousness.\"",
          "\"Individually we don't have strength — but when we come together, our devotion becomes much, much bigger.\" (paraphrasing Bhaktivinoda Ṭhākura)",
          "\"Confront issues or behavior — not people.\" (classroom norm)",
          "\"This is a team-building exercise. How can we, from diverse backgrounds, come together and serve the Supreme Person?\"",
          "\"Help yourself, help others. That's why we are here.\"",
        ].join("\n\n"),
        homework: [
          { id: "hw-l1-handbook", text: "Download & begin reading the ISKCON Disciple Course student handbook (Vimalā Mātājī sending via WhatsApp).", done: false },
          { id: "hw-l1-attend", text: "Attend Lesson 2 (Guru-tattva & Paramparā) — Saturday 2026-07-25 at 1:00 PM, before Harināma.", done: false, dueDate: "2026-07-25" },
          { id: "hw-l1-values", text: "Review the 10 course principles & values — pick 2 that feel weakest right now and note why.", done: false },
          { id: "hw-l1-lineage", text: "Sketch your parampara: Prabhupāda ← Bhaktisiddhānta ← Gaura-kiśora ← Bhaktivinoda … all the way to Kṛṣṇa. Use SB 1.1 or handbook Appendix.", done: false },
          { id: "hw-l1-assessment", text: "Decide: Option A (closed book, 70% required) or Option B (open book, essay, live participation). Confirm choice with Ram Ācārya Prabhu.", done: false },
        ],
        exercises: [
          { id: "ex-l1-why", prompt: "Why do I want to get initiated? What is the point beyond adding a spiritual identity to my personality?", response: "" },
          { id: "ex-l1-guru", prompt: "The teacher warned against seeing the guru as \"just an ordinary human being.\" Where in my own thinking have I done that? What does it cost me spiritually?", response: "" },
          { id: "ex-l1-multi-auth", prompt: "ISKCON is a multi-authority system (dīkṣā-guru, śikṣā-guru, temple president, mentor, pathā-pradarśaka). Who currently fills each of these roles for me — even informally?", response: "" },
          { id: "ex-l1-sanga", prompt: "Bhaktivinoda Ṭhākura: our devotion becomes powerful in association. Which devotees am I currently drawing strength from? Whom could I strengthen?", response: "" },
        ],
        attachments: [
          {
            id: "att-l1-course-contents",
            name: "ISKCON Disciple Course — Course Contents (handbook screenshot)",
            dataUrl: "/images/disciple-course/course-contents.png",
            addedAt: "2026-07-19T20:00:00.000Z",
          },
          {
            id: "att-l1-assessment",
            name: "Assessment Options — Option A (closed book) & Option B (open book, essay)",
            dataUrl: "/images/disciple-course/assessment-options.png",
            addedAt: "2026-07-19T20:00:00.000Z",
          },
        ],
        updatedAt: new Date().toISOString(),
      };

      const next = prev.slice();
      next[idx] = seededLesson;
      return next;
    });

    localStorage.setItem(patchKey, "1");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ensure the seeded first seva poster is present (patch existing installs once)
  useEffect(() => {
    const patchKey = `${prefix}-seva-posters-seeded-v1`;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(patchKey)) return;
    setSevaPosters((prev) => {
      const has = prev.some((p) => p.id === seedSevaPosters[0].id || p.src === seedSevaPosters[0].src);
      if (has) return prev;
      return [seedSevaPosters[0], ...prev];
    });
    localStorage.setItem(patchKey, "1");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix]);

  // Backfill missing Japa placeholder entries for July 9–19, 2026
  useEffect(() => {
    const start = "2026-07-09";
    const end = "2026-07-19";
    const dates: string[] = [];
    const d = new Date(start);
    const last = new Date(end);
    while (d <= last) {
      dates.push(format(d, "yyyy-MM-dd"));
      d.setDate(d.getDate() + 1);
    }
    setJapaLog((prev) => {
      const existing = new Set(prev.map((e) => e.date));
      const missing = dates.filter((date) => !existing.has(date));
      if (missing.length === 0) return prev;
      const newEntries: JapaEntry[] = missing.map((date) => ({
        date,
        rounds: null,
        mangalaArati: false,
        bhogaArati: false,
        gauraArati: false,
        prasadam: null,
      }));
      return [...prev, ...newEntries];
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [tutorSessions, setTutorSessions] = useLocalStorage<TutorSession[]>(`${prefix}-tutor-sessions`, seedTutorSessions);
  const [scheduleLog, setScheduleLog, isScheduleLogHydrated] = useLocalStorage<ScheduleDay[]>(`${prefix}-schedule-log`, seedScheduleLog);
  const [devoteeContacts, setDevoteeContacts, isDevoteeContactsHydrated] = useLocalStorage<DevoteeContact[]>(`${prefix}-contacts`, []);
  const [sanskritVocab, setSanskritVocab] = useLocalStorage<SanskritTerm[]>(`${prefix}-vocabulary`, seedVocabulary);
  const [questionsLog, setQuestionsLog] = useLocalStorage<QuestionEntry[]>(`${prefix}-questions`, []);
  const [savedAnswers, setSavedAnswers] = useLocalStorage<SavedAnswer[]>(`${prefix}-prabhupada-saved-answers`, []);
  const [lectureNotes, setLectureNotes, isLectureNotesHydrated] = useLocalStorage<LectureNote[]>(`${prefix}-lecture-notes`, seedLectureNotes);
  const [quizHistory, setQuizHistory, isQuizHistoryHydrated] = useLocalStorage<QuizResult[]>(`${prefix}-quiz-history`, []);

  // Restore quiz history from the JSON backup on first load
  useEffect(() => {
    if (!isQuizHistoryHydrated || activeCourseId !== "course-1") return;
    fetch("/backups/quiz-history.json")
      .then((res) => (res.ok ? res.json() : []))
      .then((backup: QuizResult[]) => {
        if (!Array.isArray(backup) || backup.length === 0) return;
        setQuizHistory((prev) => {
          const existingIds = new Set(prev.map((q) => q.id));
          const missing = backup.filter((q) => !existingIds.has(q.id));
          if (missing.length === 0) return prev;
          return [...prev, ...missing].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
      })
      .catch(() => {
        // silently ignore if backup is missing
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isQuizHistoryHydrated, activeCourseId, setQuizHistory]);

  const [characterAssessments, setCharacterAssessments] = useLocalStorage<CharacterAssessment[]>(`${prefix}-character-assessments`, []);
  const [spiritualMaster, setSpiritualMaster] = useLocalStorage<SpiritualMaster>(`${prefix}-spiritual-master`, {
    name: "Giriraja Swami",
    photo: "/covers/spiritual-master.jpg",
    initiated: true,
    initiationDate: "",
    initiationName: "",
    instructions: "",
    email: "",
    phone: "",
    temple: "",
    notes: "",
  });

  // Patch: migrate any missing seed verses into verseMemory (e.g. CC Madhya 7.128)
  // Also re-categorize priorities for seed verses and auto-detect for user-added ones
  useEffect(() => {
    if (!isVerseMemoryHydrated) return;
    setVerseMemory((prev) => {
      const existingRefs = new Set(prev.map((v) => v.versePassage));
      const missing = seedVerseMemory.filter((seed) => !existingRefs.has(seed.versePassage));

      // Build a map of seed verse priorities for re-categorization
      const seedPriorityMap = new Map(seedVerseMemory.map((s) => [s.id, s.priority]));

      const updated = prev.map((v) => {
        // For seed verses, use the authoritative priority from seedVerseMemory
        const seedPriority = seedPriorityMap.get(v.id);
        if (seedPriority && v.priority !== seedPriority) {
          return { ...v, priority: seedPriority };
        }
        // For user-added verses, auto-detect if still set to default "Core" from old logic
        if (!seedPriorityMap.has(v.id) && v.priority === "Core") {
          const detected = autoDetectPriority(v.versePassage, typeof v.source === "string" ? v.source : v.source);
          if (detected !== "Core") return { ...v, priority: detected };
        }
        return v;
      });

      if (missing.length === 0 && updated.every((v, i) => v === prev[i])) return prev;
      return missing.length > 0 ? [...updated, ...missing] : updated;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVerseMemoryHydrated]);

  // Patch: legacy devotee contacts may store instructions as string[]; migrate to string
  useEffect(() => {
    const needsPatch = devoteeContacts.some((c) => Array.isArray(c.instructions));
    if (needsPatch) {
      setDevoteeContacts((prev) => prev.map((c) => ({
        ...c,
        instructions: Array.isArray(c.instructions) ? c.instructions.join("\n") : c.instructions,
      })));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devoteeContacts]);

  // Restore/merge course-1 devotee directory from the backup. This re-adds any
  // backup contacts that are missing so the directory doesn't disappear again.
  useEffect(() => {
    if (activeCourse.id !== "course-1") return;
    if (!isDevoteeContactsHydrated) return;
    setDevoteeContacts((prev) => {
      const existingIds = new Set(prev.map((c) => c.id));
      const missing = devoteeContactsBackup.filter((c) => !existingIds.has(c.id));
      if (missing.length === 0) return prev;
      return [...missing, ...prev];
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCourse.id, isDevoteeContactsHydrated, devoteeContactsBackup.length]);

  // Patch: ensure the seeded lecture archive is present, link speakers to matching contacts,
  // auto-create missing devotee contacts, clean up duplicate Danavir/Magadhari variants, and lazy-fetch markdown once.
  useEffect(() => {
    if (activeCourse.id !== "course-1") return;
    if (!isDevoteeContactsHydrated || !isLectureNotesHydrated) return;

    const existingIds = new Set(lectureNotes.map((n) => n.id));
    const missing = seedLectureNotes.filter((n) => !existingIds.has(n.id));

    const DANAVIR_CANONICAL = "HH Danavir Goswami";
    const isDanavir = (name?: string) => typeof name === "string" && /danavir/.test(name.toLowerCase());
    const isMagadhari = (name?: string) => typeof name === "string" && /magadhari|magadahri/i.test(name);

    // Normalize the spiritual master name if it points to Danavir
    let nextMaster = spiritualMaster;
    let masterChanged = false;
    if (isDanavir(nextMaster.name) && nextMaster.name !== DANAVIR_CANONICAL) {
      nextMaster = { ...nextMaster, name: DANAVIR_CANONICAL };
      masterChanged = true;
    }
    const masterIsDanavir = isDanavir(nextMaster.name);

    // Merge / clean duplicate Danavir contacts
    const danavirContacts = devoteeContacts.filter((c) => isDanavir(c.name));
    const otherContacts = devoteeContacts.filter((c) => !isDanavir(c.name));
    let workingContacts = otherContacts;
    const contactIdMap = new Map<string, string | null>();
    if (danavirContacts.length > 0) {
      if (masterIsDanavir) {
        // Danavir is the spiritual master, so any devotee contact is a duplicate
        for (const c of danavirContacts) contactIdMap.set(c.id, null);
      } else {
        const preferred =
          danavirContacts.find((c) => c.name.trim().toLowerCase() === DANAVIR_CANONICAL.toLowerCase()) ||
          danavirContacts.find((c) => c.name.toLowerCase().startsWith("hh ")) ||
          danavirContacts[0];
        const canonicalContact: DevoteeContact = { ...preferred, name: DANAVIR_CANONICAL };
        workingContacts = [...otherContacts, canonicalContact];
        for (const c of danavirContacts) contactIdMap.set(c.id, canonicalContact.id);
      }
    }

    // Merge / clean duplicate Magadhari / Magadahri contacts and preserve the one with data
    const magadhariContacts = workingContacts.filter((c) => isMagadhari(c.name));
    const magadhariDataScore = (c: DevoteeContact) =>
      [c.role, c.phone, c.email, c.instructions, c.notes].filter((v) => typeof v === "string" && v.trim()).length + c.expertise.length;
    const magadhariPreferred =
      magadhariContacts.length > 0
        ? magadhariContacts.reduce((best, c) => (magadhariDataScore(c) > magadhariDataScore(best) ? c : best), magadhariContacts[0])
        : null;
    if (magadhariPreferred) {
      for (const c of magadhariContacts) contactIdMap.set(c.id, magadhariPreferred.id);
      workingContacts = workingContacts.map((c) => (isMagadhari(c.name) ? magadhariPreferred : c));
      workingContacts = workingContacts.filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i);
    }

    const findContact = (name?: string): DevoteeContact | undefined => {
      if (!name) return undefined;
      if (isDanavir(name)) return workingContacts.find((c) => isDanavir(c.name));
      if (isMagadhari(name)) return magadhariPreferred || undefined;
      return workingContacts.find((c) => c.name.toLowerCase() === name.toLowerCase());
    };

    // Normalize Danavir / Magadhari speaker names and roles in existing notes
    const cleanNote = (n: LectureNote): LectureNote => {
      if (isDanavir(n.speakerName)) {
        const next: LectureNote = { ...n, speakerName: DANAVIR_CANONICAL };
        if (masterIsDanavir) {
          next.speakerRole = "spiritual-master";
          next.speakerContactId = undefined;
        } else if (next.speakerContactId && contactIdMap.has(next.speakerContactId)) {
          const mapped = contactIdMap.get(next.speakerContactId);
          if (mapped === null) {
            next.speakerRole = "spiritual-master";
            next.speakerContactId = undefined;
          } else {
            next.speakerContactId = mapped;
          }
        } else if (next.speakerRole !== "devotee") {
          next.speakerRole = "spiritual-master";
          next.speakerContactId = undefined;
        }
        return next;
      }
      if (isMagadhari(n.speakerName) && magadhariPreferred) {
        return { ...n, speakerName: magadhariPreferred.name, speakerRole: "devotee", speakerContactId: magadhariPreferred.id };
      }
      return n;
    };

    const workingNotes = lectureNotes.map(cleanNote);

    const newContacts: DevoteeContact[] = [];
    const nameToId = new Map<string, string>();

    const linkSpeaker = (n: LectureNote): LectureNote => {
      if (n.speakerRole !== "devotee" || !n.speakerName) return n;
      if (n.speakerContactId) return n;
      const existing = findContact(n.speakerName);
      if (existing) return { ...n, speakerName: existing.name, speakerContactId: existing.id };
      const nameKey = n.speakerName.toLowerCase();
      let id = nameToId.get(nameKey);
      if (!id) {
        id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        nameToId.set(nameKey, id);
        newContacts.push({
          id,
          name: n.speakerName,
          role: "",
          phone: "",
          email: "",
          expertise: [],
          instructions: "",
          notes: "",
        });
      }
      return { ...n, speakerContactId: id };
    };

    const linkedExisting = workingNotes.map(linkSpeaker);
    const linkedMissing = missing.map(linkSpeaker);

    const finalNotes = [...linkedMissing, ...linkedExisting];
    const finalContacts = [...workingContacts, ...newContacts];

    const notesUnchanged = finalNotes.length === lectureNotes.length && finalNotes.every((n, i) => n === lectureNotes[i]);
    const contactsUnchanged = finalContacts.length === devoteeContacts.length && finalContacts.every((c, i) => c === devoteeContacts[i]);
    if (missing.length === 0 && notesUnchanged && contactsUnchanged && !masterChanged) return;

    if (masterChanged) setSpiritualMaster(nextMaster);
    if (!contactsUnchanged) setDevoteeContacts(finalContacts);
    if (!notesUnchanged) setLectureNotes(finalNotes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCourse.id, devoteeContacts.length, isDevoteeContactsHydrated, isLectureNotesHydrated]);

  // Backfill today's lecture note with the provided key insights and tags
  useEffect(() => {
    if (!isLectureNotesHydrated) return;
    if (activeCourse.id !== "course-1") return;

    const today = "2026-07-19";
    const patchedKey = `${prefix}-lecture-${today.replace(/-/g, "")}-keypoints-patched`;
    if (typeof window !== "undefined" && localStorage.getItem(patchedKey)) return;

    const title = "Senses, Creation & Bhakti — Presiding Deities of the Universal Form";
    const source = "Bhāgavatam class — Canto 3";
    const book = "Śrīmad-Bhāgavatam";
    const verseReference = "SB 3.26";
    const speakerName = "HH Jayapataka Swami";
    const keyPoints = [
      "The senses and their presiding deities originate from the Lord's universal form under His direction.",
      "Material nature supplies the ingredients, but Kṛṣṇa is the ultimate creator and controller.",
      "The sun is described as the eye of the Supreme Lord, illustrating the divine origin of creation.",
      "Devotees are spiritually sensitive and should be treated with gentleness, especially newcomers.",
      "Agitating a devotee's false ego can obstruct their experience of devotional bliss.",
      "Bhakti-consciousness means serving Kṛṣṇa through loving relationships with His devotees.",
      "True spiritual intensity is internal surrender, not external displays of effort.",
      "Chanting Hare Kṛṣṇa is an ongoing prayer: 'Everything is for Your pleasure.'",
      "Service performed solely to please Kṛṣṇa is itself a form of prayer.",
      "Prayer restores our consciousness whenever we become distracted in service.",
      "Kīrtana flavors the entire day with a mood of surrender and remembrance.",
      "The consciousness behind service is more important than the specific service performed.",
      "Genuine devotional strength produces humility, sweetness, and appreciation for others.",
      "Following the spiritual master's instructions with enthusiasm nourishes devotional life.",
      "A healthy devotional community helps one another grow in sweetness rather than personal recognition.",
    ];
    const tags = [
      "Bhāgavatam",
      "Canto 3",
      "Universal Form",
      "Creation",
      "Senses",
      "Presiding Deities",
      "Vāyu",
      "Sūrya",
      "Dig-devatās",
      "Bhakti",
      "Prayer",
      "Vandanam",
      "Kīrtana",
      "Japa",
      "Krishna Consciousness",
      "Bhakti Consciousness",
      "Devotee Care",
      "Humility",
      "Seva",
      "Surrender",
      "Internal Intensity",
      "Jayapataka Swami",
      "Śrīla Prabhupāda",
      "Association of Devotees",
      "Spiritual Community",
      "Remembrance",
      "Pleasing Kṛṣṇa",
      "Service Mood",
      "Devotional Life",
    ];

    setLectureNotes((prev) => {
      const todayNotes = prev
        .filter((n) => n.date === today)
        .sort((a, b) => b.id.localeCompare(a.id));

      if (todayNotes.length === 0) {
        const newNote: LectureNote = {
          id: `lecture-${today}-senses-creation`,
          title,
          date: today,
          source,
          tags,
          content: "",
          keyPoints,
          book,
          verseReference,
          speakerName,
          speakerRole: "other",
        };
        return [newNote, ...prev];
      }

      const latest = todayNotes[0];
      const hasAllKeyPoints = keyPoints.every((kp) => latest.keyPoints?.includes(kp));
      const hasAllTags = tags.every((t) => latest.tags?.includes(t));
      if (hasAllKeyPoints && hasAllTags) return prev;

      const next: LectureNote = {
        ...latest,
        keyPoints: [...new Set([...(latest.keyPoints || []), ...keyPoints])],
        tags: [...new Set([...latest.tags, ...tags])],
      };
      if (!next.title) next.title = title;
      if (!next.source) next.source = source;
      if (!next.book) next.book = book;
      if (!next.verseReference) next.verseReference = verseReference;
      if (!next.speakerName) next.speakerName = speakerName;
      if (!next.speakerRole) next.speakerRole = "other";

      return prev.map((n) => (n.id === latest.id ? next : n));
    });

    if (typeof window !== "undefined") {
      localStorage.setItem(patchedKey, "1");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLectureNotesHydrated, prefix]);

  // One-time patch: refresh the SB 3.26.62-71 study discussion title and metadata.
  useEffect(() => {
    if (!isLectureNotesHydrated) return;
    if (activeCourse.id !== "course-1") return;
    if (typeof window === "undefined") return;
    const patchedKey = `${prefix}-lecture-creation-meta-updated-2026-07-22`;
    if (localStorage.getItem(patchedKey)) return;
    const seedNote = seedLectureNotes.find((n) => n.id === "lecture-srimad-bhagavatam-session-on-creation");
    if (!seedNote) return;
    setLectureNotes((prev) => {
      if (!prev.some((n) => n.id === seedNote.id)) return prev;
      return prev.map((n) =>
        n.id === seedNote.id
          ? { ...n, title: seedNote.title, verseReference: seedNote.verseReference, tags: seedNote.tags, keyPoints: seedNote.keyPoints }
          : n
      );
    });
    localStorage.setItem(patchedKey, "1");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLectureNotesHydrated, activeCourse.id]);

  // Lazy-hydrate summary/transcript from public/lectures/*.md the first time
  useEffect(() => {
    const needsHydration = lectureNotes.filter(
      (n) => (n.summaryUrl && !n.summary) || (n.transcriptUrl && !n.transcript)
    );
    if (needsHydration.length === 0) return;
    let cancelled = false;

    (async () => {
      const fetched = await Promise.all(
        needsHydration.map(async (note) => {
          try {
            const [sumRes, txRes] = await Promise.all([
              note.summaryUrl && !note.summary ? fetch(note.summaryUrl) : Promise.resolve(null),
              note.transcriptUrl && !note.transcript ? fetch(note.transcriptUrl) : Promise.resolve(null),
            ]);
            const summary = sumRes && sumRes.ok ? await sumRes.text() : note.summary;
            const transcript = txRes && txRes.ok ? await txRes.text() : note.transcript;
            return { id: note.id, summary, transcript };
          } catch {
            return { id: note.id, summary: note.summary, transcript: note.transcript };
          }
        })
      );
      if (cancelled) return;
      setLectureNotes((prev) =>
        prev.map((n) => {
          const patch = fetched.find((f) => f.id === n.id);
          if (!patch) return n;
          return { ...n, summary: patch.summary ?? n.summary, transcript: patch.transcript ?? n.transcript };
        })
      );
    })();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lectureNotes.length]);

  // Patch: if course-1 curriculum has generic "Part X" assignments from old generator, reset to seed
  useEffect(() => {
    if (activeCourse.id !== "course-1") return;
    const hasGenericAssignments = curriculum.some((w) => /^Part \d+$/.test(w.assignment));
    if (hasGenericAssignments) {
      setCurriculum(seedCurriculum);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCourse.id]);

  // Patch: force-apply seed characters, estimatedTotalHours, and progressNotes for course-1
  // Must wait for hydration so we're patching actual localStorage data, not the initial seed
  useEffect(() => {
    if (!isBookProgressHydrated) return;
    if (activeCourse.id !== "course-1") return;
    setBookProgress((prev) => {
      let changed = false;
      const updated = prev.map((bp) => {
        const seed = seedBookProgress.find((s) => s.book === bp.book);
        if (!seed) return bp;
        const needsChars = (!bp.characters || bp.characters.length === 0) && seed.characters && seed.characters.length > 0;
        const needsNotes = !bp.progressNotes && !!seed.progressNotes;
        const needsHours = bp.estimatedTotalHours !== seed.estimatedTotalHours;
        if (!needsChars && !needsNotes && !needsHours) return bp;
        changed = true;
        return {
          ...bp,
          characters: needsChars ? seed.characters : bp.characters,
          progressNotes: needsNotes ? seed.progressNotes : bp.progressNotes,
          estimatedTotalHours: seed.estimatedTotalHours,
        };
      });
      return changed ? updated : prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBookProgressHydrated, activeCourse.id]);

  // Sync bookProgress with active course books so switching courses shows the right books
  // planned weeks are derived from the curriculum; estimated hours and seeded progress are restored
  // when a book is still in its default state. User progress edits are preserved otherwise.
  useEffect(() => {
    if (!isBookProgressHydrated) return;
    if (!activeCourse || !curriculum.length) return;
    setBookProgress((prev) => {
      let changed = false;
      const updated = activeCourse.books.map((book) => {
        const existing = prev.find((p) => p.book === book);
        const plannedWeeks = getPlannedWeeksFromCurriculum(book, curriculum);
        const defaultHours = getDefaultEstimatedTotalHours(book, plannedWeeks, activeCourse.id, seedBookProgress);
        const bookAbbr = getBookAbbreviation(book);
        const normBook = book.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        const seed = seedBookProgress.find((p) =>
          p.book === book ||
          (bookAbbr && getBookAbbreviation(p.book) === bookAbbr) ||
          p.book.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() === normBook
        );

        if (!existing) {
          changed = true;
          return {
            ...defaultBook(book),
            ...(seed || {}),
            plannedWeeks,
            estimatedTotalHours: defaultHours,
          };
        }

        const isDefaultHours = existing.estimatedTotalHours === existing.plannedWeeks * 10;
        const isDefaultProgress = existing.hoursLogged === 0 && existing.percentComplete === 0;
        const isFoundationSeed = activeCourse.id === "course-1" && !!seed;
        const isFoundationSeedDefault = isFoundationSeed && existing.estimatedTotalHours === seed?.estimatedTotalHours;
        const shouldUpdateHours = (existing.plannedWeeks === 1 && existing.estimatedTotalHours === 10) || isDefaultHours || isFoundationSeedDefault;

        // Backfill characters from seed if missing, or replace if they belong to a different book
        const seedHasChars = seed?.characters && seed.characters.length > 0;
        const existingHasChars = existing.characters && existing.characters.length > 0;
        const needsCharacters = !existingHasChars && seedHasChars;
        const hasWrongChars = existingHasChars && seedHasChars &&
          existing.characters![0] !== seed!.characters![0];
        const needsNotes = !existing.progressNotes && seed?.progressNotes;

        const needsUpdate =
          existing.plannedWeeks !== plannedWeeks ||
          (shouldUpdateHours && existing.estimatedTotalHours !== defaultHours) ||
          (isDefaultProgress && (seed?.hoursLogged || seed?.percentComplete || seed?.startDate)) ||
          needsCharacters ||
          hasWrongChars ||
          needsNotes;

        if (needsUpdate) {
          changed = true;
          return {
            ...existing,
            plannedWeeks,
            estimatedTotalHours: shouldUpdateHours ? defaultHours : existing.estimatedTotalHours,
            hoursLogged: isDefaultProgress ? (seed?.hoursLogged ?? existing.hoursLogged) : existing.hoursLogged,
            percentComplete: isDefaultProgress ? (seed?.percentComplete ?? existing.percentComplete) : existing.percentComplete,
            startDate: existing.startDate || (seed?.startDate ?? existing.startDate),
            characters: ((needsCharacters || hasWrongChars) && seed) ? seed.characters : (existing.characters || []),
            progressNotes: (needsNotes && seed) ? seed.progressNotes : (existing.progressNotes || ""),
          };
        }

        return existing;
      });
      if (!changed) return prev;
      return updated;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBookProgressHydrated, activeCourse.id, activeCourse.books, curriculum]);

  // Patch legacy schedule entries to record the schedule snapshot and habit tracking they were logged with
  useEffect(() => {
    const needsPatch = scheduleLog.some((e) => !e.scheduleItemsSnapshot || !e.habitTracking);
    if (needsPatch) {
      setScheduleLog((prev) => prev.map((e) => ({
        ...e,
        scheduleItemsSnapshot: e.scheduleItemsSnapshot?.length ? e.scheduleItemsSnapshot : settings.scheduleItems,
        habitTracking: e.habitTracking ?? {},
      })));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleLog.length]);

  // Auto-populate curriculum actualHours, paceStatus, and verseProgress from daily log
  useEffect(() => {
    if (curriculum.length === 0) return;
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const adjustedTarget = Math.round(settings.weeklyTargetHours * settings.paceMultiplier * 2) / 2;
    setCurriculum((prev) => {
      const updated = prev.map((week) => {
        const weekEntries = dailyLog.filter(
          (entry) =>
            entry.date >= week.startDate &&
            entry.date <= week.endDate &&
            bookMatches(entry.book, week.book)
        );
        const actualHours = weekEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
        const targetHours = adjustedTarget;

        // Verse-position-based progress
        const verseProgress = getVerseProgressForWeek(week.book, week.assignment, weekEntries);

        let paceStatus: string;
        if (verseProgress && verseProgress.percent >= 100) {
          // Verse progress confirms completion regardless of hours
          paceStatus = "Complete";
        } else if (actualHours >= targetHours) {
          // Hours met — mark complete (trust time even without verse data)
          paceStatus = verseProgress ? `Complete (${verseProgress.percent}% read)` : "Complete";
        } else if (todayStr < week.startDate) {
          paceStatus = "Upcoming";
        } else if (todayStr <= week.endDate) {
          // Current week — show verse progress if available
          if (verseProgress && verseProgress.percent > 0) {
            paceStatus = `In Progress (${verseProgress.percent}% · ${verseProgress.currentRef} / ${verseProgress.targetRef})`;
          } else {
            paceStatus = actualHours > 0 ? "In Progress" : "Needs Time";
          }
        } else {
          // Past week
          if (verseProgress && verseProgress.percent > 0) {
            paceStatus = verseProgress.percent >= 80
              ? `Nearly Done (${verseProgress.percent}%)`
              : `Behind (${verseProgress.percent}% · ${verseProgress.currentRef})`;
          } else {
            paceStatus = actualHours > 0 ? "Behind" : "Missed";
          }
        }
        return { ...week, actualHours, targetHours, paceStatus };
      });
      return shiftCurriculumAssignments(updated, bookProgress, settings, today);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyLog, curriculum.length, settings.weeklyTargetHours, settings.paceMultiplier]);

  // One-time seed: add a past japa entry for 2026-07-20 so missed days can be filled in.
  useEffect(() => {
    if (activeCourse.id !== "course-1") return;
    if (!isJapaLogHydrated) return;
    if (typeof window === "undefined") return;
    const patchKey = `${prefix}-japa-2026-07-20-seeded`;
    if (localStorage.getItem(patchKey)) return;
    setJapaLog((prev) => {
      if (prev.some((e) => e.date === "2026-07-20")) return prev;
      return [
        ...prev,
        { date: "2026-07-20", rounds: null, mangalaArati: false, bhogaArati: false, gauraArati: false, prasadam: null },
      ];
    });
    localStorage.setItem(patchKey, "1");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCourse.id, isJapaLogHydrated]);

  // Sync schedule entries with japa and daily logs, deduplicate by date, and recompute scores
  useEffect(() => {
    if (!isSettingsHydrated || !isScheduleLogHydrated) return;
    const activeScheduleItems = settings.scheduleItems?.length ? settings.scheduleItems : defaultSettings.scheduleItems;
    const obeisancesTarget = activeCourse?.sadhanaStandards?.obeisancesTarget;

    setScheduleLog((prevSchedule) => {
      const scheduleByDate = new Map(prevSchedule.map((s) => [s.date, s]));
      let changed = prevSchedule.length !== scheduleByDate.size;

      for (const japa of japaLog) {
        const existing = scheduleByDate.get(japa.date);
        const roundsDone = (japa.rounds ?? 0) >= 16;
        const daily = dailyLog.find((d) => d.date === japa.date);
        const morningStudy = (daily?.hours ?? 0) > 0 || (daily?.minutes ?? 0) > 0;
        const personalStudy = (daily?.hours ?? 0) >= 2 || (daily?.minutes ?? 0) >= 120;

        const base = existing || {
          date: japa.date,
          wakeUp330: false,
          showerTilak: false,
          mangalaArati: false,
          bhogaArati: false,
          gauraArati: false,
          morningStudy: false,
          work: false,
          personalStudy: false,
          sanskritClass: false,
          sleep9pm: false,
          noMeatEating: false,
          noIntoxication: false,
          noGambling: false,
          noIllicitSex: false,
          sixteenRounds: false,
          obeisances: 0,
          customItems: {},
          scheduleItemsSnapshot: activeScheduleItems,
          habitTracking: {},
          score: 0,
          notes: "",
        };

        if (
          !existing ||
          base.mangalaArati !== (japa.mangalaArati ?? false) ||
          base.bhogaArati !== (japa.bhogaArati ?? false) ||
          base.gauraArati !== (japa.gauraArati ?? false) ||
          base.sixteenRounds !== roundsDone ||
          base.morningStudy !== morningStudy ||
          base.personalStudy !== personalStudy
        ) {
          const updated = {
            ...base,
            mangalaArati: japa.mangalaArati ?? false,
            bhogaArati: japa.bhogaArati ?? false,
            gauraArati: japa.gauraArati ?? false,
            sixteenRounds: roundsDone,
            morningStudy,
            personalStudy,
            notes: base.notes || "Auto-filled from Japa Log",
          };
          updated.score = calcScore(updated, updated.scheduleItemsSnapshot?.length ? updated.scheduleItemsSnapshot : activeScheduleItems, obeisancesTarget);
          scheduleByDate.set(japa.date, updated);
          changed = true;
        }
      }

      for (const daily of dailyLog) {
        const existing = scheduleByDate.get(daily.date);
        if (!existing) continue;
        const morningStudy = (daily.hours ?? 0) > 0 || (daily.minutes ?? 0) > 0;
        const personalStudy = (daily.hours ?? 0) >= 2 || (daily.minutes ?? 0) >= 120;
        if (existing.morningStudy !== morningStudy || existing.personalStudy !== personalStudy) {
          const updated = { ...existing, morningStudy, personalStudy };
          updated.score = calcScore(updated, updated.scheduleItemsSnapshot?.length ? updated.scheduleItemsSnapshot : activeScheduleItems, obeisancesTarget);
          scheduleByDate.set(daily.date, updated);
          changed = true;
        }
      }

      // Apply the current schedule to every past entry and recompute scores with per-day filtering.
      for (const [date, entry] of scheduleByDate.entries()) {
        const snapshotChanged =
          !entry.scheduleItemsSnapshot ||
          entry.scheduleItemsSnapshot.length !== activeScheduleItems.length ||
          entry.scheduleItemsSnapshot.some((item, i) => item.key !== activeScheduleItems[i]?.key);
        const day = new Date(date + "T12:00").getDay();
        const isSunday = day === 0;
        const isWeekend = isSunday || day === 6;
        const itemsForDay = activeScheduleItems.filter((item) => {
          if (item.sundayOnly && !isSunday) return false;
          if ((item.weekdayOnly || item.key === "work") && isWeekend) return false;
          return true;
        });
        const newScore = calcScore({ ...entry, scheduleItemsSnapshot: activeScheduleItems }, itemsForDay, obeisancesTarget);
        if (snapshotChanged || entry.score !== newScore) {
          scheduleByDate.set(date, { ...entry, scheduleItemsSnapshot: activeScheduleItems, score: newScore });
          changed = true;
        }
      }

      if (!changed) return prevSchedule;
      return Array.from(scheduleByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
    });
  }, [japaLog, dailyLog, settings.scheduleItems, activeCourse?.sadhanaStandards?.obeisancesTarget, setScheduleLog, isSettingsHydrated, isScheduleLogHydrated]);

  // Backfill Japa Log from schedule entries that already mark 16 rounds completed
  useEffect(() => {
    setJapaLog((prevJapa) => {
      const japaDates = new Set(prevJapa.map((j) => j.date));
      const missing = scheduleLog.filter((entry) => entry.sixteenRounds && !japaDates.has(entry.date));
      if (missing.length === 0) return prevJapa;

      const newEntries: JapaEntry[] = missing.map((entry) => ({
        date: entry.date,
        rounds: 16,
        mangalaArati: entry.mangalaArati,
        bhogaArati: entry.bhogaArati,
        gauraArati: entry.gauraArati,
        prasadam: null,
      }));
      return [...prevJapa, ...newEntries].sort((a, b) => a.date.localeCompare(b.date));
    });
  }, [scheduleLog, japaLog, setJapaLog]);

  // Sync sixteenRounds from Japa/Schedule into Daily Log entries
  useEffect(() => {
    setDailyLog((prevDaily) => {
      let changed = false;
      const updated = prevDaily.map((entry) => {
        // Determine truth from japa (primary) or schedule
        const japa = japaLog.find((j) => j.date === entry.date);
        const sched = scheduleLog.find((s) => s.date === entry.date);
        const shouldBeChecked = japa ? (japa.rounds ?? 0) >= 16 : sched ? sched.sixteenRounds : entry.sixteenRounds;
        if (entry.sixteenRounds !== shouldBeChecked) {
          changed = true;
          return { ...entry, sixteenRounds: shouldBeChecked };
        }
        return entry;
      });
      return changed ? updated : prevDaily;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [japaLog, scheduleLog]);

  const createNewCourse = (name: string, color: string, startDate: string, endDate: string, books: string[], sadhanaStandards?: SadhanaStandards, regulativePrinciples?: RegulativePrinciples, firstBookStartChapter?: string, switchToCourse: boolean = true) => {
    const standards = sadhanaStandards || defaultSadhanaStandards;
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      name,
      color,
      startDate,
      endDate,
      books,
      firstBookStartChapter: firstBookStartChapter || undefined,
      sadhanaStandards: standards,
      originalBaseline: { ...standards }, // locked — can never go below this
      standardsHistory: [],
      regulativePrinciples: regulativePrinciples || defaultRegulativePrinciples,
      active: switchToCourse,
    };
    setCourses((prev) => {
      const updated = prev.map((c) => switchToCourse ? { ...c, active: false } : c);
      return updated.concat(newCourse);
    });
    if (switchToCourse) {
      setActiveCourseId(newCourse.id);
    }
    setShowCourseSwitcher(false);
  };

  const switchCourse = (courseId: string) => {
    setActiveCourseId(courseId);
    setShowCourseSwitcher(false);
  };

  return (
    <div className="flex h-screen bg-amber-50/80 dark:bg-zinc-950/80">
      {/* Sidebar */}
      <aside className="w-64 bg-amber-900 dark:bg-zinc-900 text-amber-50 flex flex-col shrink-0">
        <div className="p-4 border-b border-amber-800 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">🙏 Śāstra Study</h1>
            <p className="text-xs text-amber-200 dark:text-zinc-400 mt-0.5">Study & Sādhana Tracker</p>
          </div>
          <button
            onClick={() => setActiveTab("settings")}
            title="Configuration"
            className={`p-2 rounded-lg transition-colors ${
              activeTab === "settings"
                ? "bg-amber-800 text-white"
                : "text-amber-200 hover:bg-amber-800/50 hover:text-white"
            }`}
          >
            <Settings2 size={18} />
          </button>
        </div>

        {/* Course Switcher */}
        <div className="p-2 border-b border-amber-800 dark:border-zinc-800 relative">
          <button
            onClick={() => setShowCourseSwitcher(!showCourseSwitcher)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-amber-800/50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <span className={`w-3 h-3 rounded-full ${courseColor.accent}`} />
            <span className="flex-1 text-left font-medium truncate">{activeCourse?.name || "Course"}</span>
            <ChevronDown size={14} className={`transition-transform ${showCourseSwitcher ? "rotate-180" : ""}`} />
          </button>

          {showCourseSwitcher && (
            <div className="absolute left-2 right-2 top-full mt-1 z-50 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="p-2 border-b border-zinc-200 dark:border-zinc-700">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 px-2 py-1">Your Courses</p>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {courses.map((course) => {
                  const cc = courseColors.find((c) => c.id === course.color) || courseColors[0];
                  return (
                    <button
                      key={course.id}
                      onClick={() => switchCourse(course.id)}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors ${
                        course.id === activeCourseId ? "bg-zinc-100 dark:bg-zinc-700" : ""
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${cc.accent}`} />
                      <span className="flex-1 text-zinc-800 dark:text-zinc-200 truncate">{course.name}</span>
                      {course.id === activeCourseId && <span className="text-xs text-green-600">✓</span>}
                    </button>
                  );
                })}
              </div>
              <div className="p-2 border-t border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => {
                    setShowCourseSwitcher(false);
                    setActiveTab("settings");
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md transition-colors"
                >
                  <Layers size={14} />
                  Manage Courses...
                </button>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {/* Home — standalone, always visible at the top */}
          {(() => {
            const HomeIcon = homeItem.icon;
            const isActive = activeTab === homeItem.id;
            return (
              <button
                onClick={() => setActiveTab(homeItem.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-amber-800 dark:bg-zinc-800 text-white"
                    : "text-amber-200 dark:text-zinc-400 hover:bg-amber-800/50 dark:hover:bg-zinc-800/50 hover:text-white"
                }`}
              >
                <HomeIcon size={18} />
                {homeItem.label}
              </button>
            );
          })()}

          <div className="pt-2 space-y-1">
            {sections.map((section) => {
              const collapsed = collapsedSet.has(section.id);
              const HeaderIcon = section.icon;
              const containsActive = section.items.some((i) => i.id === activeTab);
              return (
                <div key={section.id} className="rounded-lg">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors ${
                      containsActive
                        ? "text-white bg-amber-800/40 dark:bg-zinc-800/60"
                        : "text-amber-100 dark:text-zinc-300 hover:bg-amber-800/30 dark:hover:bg-zinc-800/40"
                    }`}
                    aria-expanded={!collapsed}
                    title={`${collapsed ? "Expand" : "Collapse"} ${section.title}`}
                  >
                    <HeaderIcon size={16} className="shrink-0 text-amber-300 dark:text-zinc-400" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold truncate">{section.title}</span>
                      {section.subtitle && (
                        <span className="block text-[10px] text-amber-200/60 dark:text-zinc-500 truncate">
                          {section.subtitle}
                        </span>
                      )}
                    </span>
                    {collapsed ? (
                      <ChevronRight size={14} className="shrink-0 text-amber-200/70 dark:text-zinc-500" />
                    ) : (
                      <ChevronDown size={14} className="shrink-0 text-amber-200/70 dark:text-zinc-500" />
                    )}
                  </button>
                  {!collapsed && (
                    <div className="mt-1 mb-2 space-y-0.5 pl-2 border-l border-amber-800/40 dark:border-zinc-700/60 ml-3">
                      {section.items.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                              isActive
                                ? "bg-amber-800 dark:bg-zinc-800 text-white"
                                : "text-amber-200 dark:text-zinc-400 hover:bg-amber-800/50 dark:hover:bg-zinc-800/50 hover:text-white"
                            }`}
                          >
                            <Icon size={15} />
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

      </aside>

      {/* Main Content */}
      <TimerProvider>
        <main className="flex-1 overflow-y-auto">
          {activeTab === "dashboard" && (
          <Dashboard
            settings={settings}
            courses={courses}
            activeCourseId={activeCourseId}
            curriculum={curriculum}
            dailyLog={dailyLog}
            bookProgress={bookProgress}
            verseMemory={verseMemory}
            japaLog={japaLog}
            scheduleLog={scheduleLog}
            tutorSessions={tutorSessions}
            lectureNotes={lectureNotes}
            contacts={devoteeContacts}
            spiritualMaster={spiritualMaster}
            onTabChange={(tab, focusId) => {
              if (focusId && tab === "verses") setFocusVerseId(focusId);
              if (focusId && tab === "calendar") setFocusEventId(focusId);
              setActiveTab(tab as TabId);
            }}
            onCourseSelect={(courseId) => {
              setActiveCourseId(courseId);
            }}
          />
        )}
        {activeTab === "curriculum" && (
          <CurriculumTab curriculum={curriculum} setCurriculum={setCurriculum} settings={settings} setSettings={setSettings} dailyLog={dailyLog} bookProgress={bookProgress} setBookProgress={setBookProgress} />
        )}
        {activeTab === "daily-log" && (
          <DailyLogTab dailyLog={dailyLog} setDailyLog={setDailyLog} settings={settings} curriculum={curriculum} courseBooks={activeCourse?.books} japaLog={japaLog} setJapaLog={setJapaLog} scheduleLog={scheduleLog} setScheduleLog={setScheduleLog} />
        )}
        {activeTab === "books" && (
          <BookProgressTab bookProgress={bookProgress} setBookProgress={setBookProgress} dailyLog={dailyLog} course={activeCourse} setCourses={setCourses} />
        )}
        {activeTab === "verses" && (
          <VerseMemoryTab verseMemory={verseMemory} setVerseMemory={setVerseMemory} focusVerseId={focusVerseId} onFocusConsumed={() => setFocusVerseId(null)} />
        )}
        {activeTab === "reflections" && (
          <WeeklyReflectionTab
            reflections={weeklyReflections}
            setReflections={setWeeklyReflections}
          />
        )}
        {activeTab === "calendar" && <CalendarTab focusEventId={focusEventId} onFocusConsumed={() => setFocusEventId(null)} />}
        {activeTab === "schedule" && (
          <ScheduleTab
            scheduleLog={scheduleLog}
            setScheduleLog={setScheduleLog}
            japaLog={japaLog}
            setJapaLog={setJapaLog}
            sadhanaStandards={activeCourse?.sadhanaStandards}
            course={activeCourse}
            setCourses={setCourses}
            settings={settings}
            setSettings={setSettings}
            tutorSessions={tutorSessions}
            setTutorSessions={setTutorSessions}
          />
        )}
        {activeTab === "guna-report" && (
          <GunaReportTab settings={settings} scheduleLog={scheduleLog} />
        )}
        {activeTab === "character" && (
          <CharacterAssessmentTab assessments={characterAssessments} setAssessments={setCharacterAssessments} scheduleLog={scheduleLog} japaLog={japaLog} dailyLog={dailyLog} settings={settings} />
        )}
        {activeTab === "japa" && (
          <JapaTab japaLog={japaLog} setJapaLog={setJapaLog} />
        )}
        {activeTab === "seva" && (
          <SevaTab
            sevaLog={sevaLog}
            setSevaLog={setSevaLog}
            sevaPosters={sevaPosters}
            setSevaPosters={setSevaPosters}
            sevaNotes={sevaNotes}
            setSevaNotes={setSevaNotes}
            onOpenPosters={() => setActiveTab("posters")}
          />
        )}
        {activeTab === "tutor" && (
          <TutorTab sessions={tutorSessions} setSessions={setTutorSessions} scheduleLog={scheduleLog} setScheduleLog={setScheduleLog} />
        )}
        {activeTab === "quiz" && (
          <QuizTab dailyLog={dailyLog} quizHistory={quizHistory} setQuizHistory={setQuizHistory} />
        )}
        {activeTab === "sangha" && (
          <SanghaTab
            contacts={devoteeContacts}
            setContacts={setDevoteeContacts}
            vocabulary={sanskritVocab}
            setVocabulary={setSanskritVocab}
            questions={questionsLog}
            setQuestions={setQuestionsLog}
            lectureNotes={lectureNotes}
            setLectureNotes={setLectureNotes}
          />
        )}
        {activeTab === "prabhupada-library" && (
          <PrabhupadaLibraryTab
            questions={questionsLog}
            setQuestions={setQuestionsLog}
            savedAnswers={savedAnswers}
            setSavedAnswers={setSavedAnswers}
          />
        )}
        {activeTab === "spiritual-master" && (
          <SpiritualMasterTab
            notes={lectureNotes}
            setNotes={setLectureNotes}
            contacts={devoteeContacts}
            setContacts={setDevoteeContacts}
            spiritualMaster={spiritualMaster}
            setSpiritualMaster={setSpiritualMaster}
            japaLog={japaLog}
            scheduleLog={scheduleLog}
            sevaLog={sevaLog}
            discipleLessons={discipleLessons}
            savedAnswers={savedAnswers}
            setSavedAnswers={setSavedAnswers}
          />
        )}
        {activeTab === "notes" && (
          <NotesTab
            notes={lectureNotes}
            setNotes={setLectureNotes}
            contacts={devoteeContacts}
            setContacts={setDevoteeContacts}
            spiritualMaster={spiritualMaster}
            journalEntries={journalEntries}
            setJournalEntries={setJournalEntries}
          />
        )}
        {activeTab === "projection" && (
          <ProjectionTab
            settings={settings}
            dailyLog={dailyLog}
            bookProgress={bookProgress}
            verseMemory={verseMemory}
            japaLog={japaLog}
            scheduleLog={scheduleLog}
            tutorSessions={tutorSessions}
            sanskritVocab={sanskritVocab}
            devoteeContacts={devoteeContacts}
            spiritualMaster={spiritualMaster}
            curriculum={curriculum}
            weeklyReflections={weeklyReflections}
            questionsLog={questionsLog}
            course={activeCourse}
            characterAssessments={characterAssessments}
            setSettings={setSettings}
            setScheduleLog={setScheduleLog}
          />
        )}
        {activeTab === "posters" && (
          <PosterViewerTab
            lectureNotes={lectureNotes}
            sevaPosters={sevaPosters}
            setSevaPosters={setSevaPosters}
          />
        )}
        {activeTab === "disciple-course" && (
          <DiscipleCourseTab
            lessons={discipleLessons}
            setLessons={setDiscipleLessons}
            meta={discipleMeta}
            setMeta={setDiscipleMeta}
          />
        )}
        {activeTab === "settings" && (
          <SettingsTab
            settings={settings}
            setSettings={setSettings}
            courses={courses}
            setCourses={setCourses}
            activeCourseId={activeCourseId}
            onCreateCourse={createNewCourse}
            onSwitchCourse={switchCourse}
            readingWishlist={readingWishlist}
            setReadingWishlist={setReadingWishlist}
          />
        )}
        </main>
      </TimerProvider>
    </div>
  );
}
