"use client";

import { Dashboard } from "@/components/Dashboard";
import { CurriculumTab } from "@/components/CurriculumTab";
import { DailyLogTab } from "@/components/DailyLogTab";
import { BookProgressTab } from "@/components/BookProgressTab";
import { VerseMemoryTab } from "@/components/VerseMemoryTab";
import { WeeklyReflectionTab } from "@/components/WeeklyReflectionTab";
import { SettingsTab } from "@/components/SettingsTab";
import { JapaTab } from "@/components/JapaTab";
import { TutorTab } from "@/components/TutorTab";
import { ScheduleTab } from "@/components/ScheduleTab";
import { QuizTab } from "@/components/QuizTab";
import { SanghaTab } from "@/components/SanghaTab";
import { GunaReportTab } from "@/components/GunaReportTab";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { format } from "date-fns";
import {
  Settings,
  CurriculumWeek,
  DailyLogEntry,
  BookProgress,
  VerseMemory,
  WeeklyReflection,
  JapaEntry,
  TutorSession,
  ScheduleDay,
  DevoteeContact,
  SanskritTerm,
  QuestionEntry,
  Course,
  SadhanaStandards,
  RegulativePrinciples,
  courseColors,
  curriculumBooks,
  defaultCourse,
  defaultSadhanaStandards,
  defaultRegulativePrinciples,
  defaultSettings,
  generateCurriculum,
  seedCurriculum,
  seedDailyLog,
  seedBookProgress,
  seedVerseMemory,
  seedWeeklyReflections,
  seedJapaLog,
  seedTutorSessions,
  seedScheduleLog,
} from "@/lib/data";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  CalendarDays,
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
  HelpCircle,
  Users,
  Sparkles,
} from "lucide-react";

const tabs = [
  // Daily use
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "schedule", label: "Daily Schedule", icon: ClipboardCheck },
  { id: "guna-report", label: "Guṇa Report", icon: Sparkles },
  { id: "japa", label: "Japa", icon: Flame },
  { id: "daily-log", label: "Study Log", icon: PenLine },
  { id: "verses", label: "Verse Memory", icon: Brain },
  { id: "tutor", label: "Tutor & Cards", icon: GraduationCap },
  { id: "quiz", label: "Daily Quiz", icon: HelpCircle },
  { id: "sangha", label: "Saṅgha & Ref", icon: Users },
  { id: "reflections", label: "Reflections", icon: MessageSquare },
  // Reference / setup
  { id: "curriculum", label: "Curriculum", icon: CalendarDays },
  { id: "books", label: "Books", icon: BookOpen },
  { id: "settings", label: "Settings", icon: Settings2 },
] as const;

type TabId = (typeof tabs)[number]["id"];

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
}

export default function Home() {
  // Run migration on mount
  if (typeof window !== "undefined") migrateOldData();

  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [focusVerseId, setFocusVerseId] = useState<string | null>(null);
  const [courses, setCourses] = useLocalStorage<Course[]>("sastra-courses", [defaultCourse]);
  const [activeCourseId, setActiveCourseId] = useLocalStorage<string>("sastra-active-course", defaultCourse.id);
  const [showCourseSwitcher, setShowCourseSwitcher] = useState(false);

  // Patch legacy courses missing required fields
  useEffect(() => {
    const needsPatch = courses.some((c) => !c.books || c.books.length === 0 || !c.sadhanaStandards || !c.originalBaseline || !c.regulativePrinciples);
    if (needsPatch) {
      setCourses((prev) => prev.map((c) => ({
        ...c,
        books: c.books && c.books.length > 0 ? c.books : [...curriculumBooks],
        sadhanaStandards: c.sadhanaStandards || defaultSadhanaStandards,
        originalBaseline: c.originalBaseline || c.sadhanaStandards || defaultSadhanaStandards,
        standardsHistory: c.standardsHistory || [],
        regulativePrinciples: c.regulativePrinciples || defaultRegulativePrinciples,
      })));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0];
  const courseColor = courseColors.find((c) => c.id === activeCourse?.color) || courseColors[0];
  const prefix = `sastra-${activeCourseId}`;

  const [settings, setSettings] = useLocalStorage<Settings>(`${prefix}-settings`, defaultSettings);
  const curriculumSyncRef = useRef<string>("");

  // Patch legacy settings missing scheduleItems or habits
  useEffect(() => {
    const updates: Partial<Settings> = {};
    if (!settings.scheduleItems) {
      updates.scheduleItems = defaultSettings.scheduleItems;
    }
    if (!settings.habits) {
      updates.habits = defaultSettings.habits;
    }
    if (Object.keys(updates).length > 0) {
      setSettings({ ...settings, ...updates });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const [curriculum, setCurriculum] = useLocalStorage<CurriculumWeek[]>(
    `${prefix}-curriculum`,
    activeCourse.id === "course-1" ? seedCurriculum : generateCurriculum(activeCourse.books, activeCourse.startDate, settings.targetWeeks, settings.weeklyTargetHours)
  );

  // Sync curriculum when course books/settings change (regenerate structure, preserve user edits)
  useEffect(() => {
    if (!activeCourse) return;
    const signature = `${activeCourse.id}:${activeCourse.books.join(",")}:${activeCourse.startDate}:${settings.targetWeeks}:${settings.weeklyTargetHours}`;
    if (curriculumSyncRef.current === signature) return;
    curriculumSyncRef.current = signature;

    // For the seed course, only regenerate if something actually changed from the initial state
    if (activeCourse.id === "course-1") {
      // Only update dates/hours if settings changed, but keep seed assignments
      setCurriculum((prev) => {
        if (prev.length === 0) return seedCurriculum;
        return prev.map((week) => ({
          ...week,
          targetHours: settings.weeklyTargetHours,
        }));
      });
      return;
    }

    // For non-seed courses, fully regenerate with chapter breakdowns
    const generated = generateCurriculum(activeCourse.books, activeCourse.startDate, settings.targetWeeks, settings.weeklyTargetHours);

    setCurriculum((prev) => {
      return generated.map((week) => {
        const existing = prev.find((p) => p.week === week.week);
        if (!existing) return week;
        return {
          ...week,
          assignment: existing.assignment || week.assignment,
          complete: existing.complete,
          reflection: existing.reflection,
          notes: existing.notes,
        };
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCourse.id, activeCourse.books, activeCourse.startDate, settings.targetWeeks, settings.weeklyTargetHours]);
  const [dailyLog, setDailyLog] = useLocalStorage<DailyLogEntry[]>(`${prefix}-daily-log`, seedDailyLog);
  const [bookProgress, setBookProgress] = useLocalStorage<BookProgress[]>(`${prefix}-book-progress`, seedBookProgress);
  const [verseMemory, setVerseMemory] = useLocalStorage<VerseMemory[]>(`${prefix}-verse-memory`, seedVerseMemory);
  const [weeklyReflections, setWeeklyReflections] = useLocalStorage<WeeklyReflection[]>(`${prefix}-weekly-reflections`, seedWeeklyReflections);
  const [japaLog, setJapaLog] = useLocalStorage<JapaEntry[]>(`${prefix}-japa-log`, seedJapaLog);
  const [tutorSessions, setTutorSessions] = useLocalStorage<TutorSession[]>(`${prefix}-tutor-sessions`, seedTutorSessions);
  const [scheduleLog, setScheduleLog] = useLocalStorage<ScheduleDay[]>(`${prefix}-schedule-log`, seedScheduleLog);
  const [devoteeContacts, setDevoteeContacts] = useLocalStorage<DevoteeContact[]>(`${prefix}-contacts`, []);
  const [sanskritVocab, setSanskritVocab] = useLocalStorage<SanskritTerm[]>(`${prefix}-vocabulary`, []);
  const [questionsLog, setQuestionsLog] = useLocalStorage<QuestionEntry[]>(`${prefix}-questions`, []);

  // Patch: if course-1 curriculum has generic "Part X" assignments from old generator, reset to seed
  useEffect(() => {
    if (activeCourse.id !== "course-1") return;
    const hasGenericAssignments = curriculum.some((w) => /^Part \d+$/.test(w.assignment));
    if (hasGenericAssignments) {
      setCurriculum(seedCurriculum);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCourse.id]);

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

  // Auto-populate curriculum actualHours and paceStatus from daily log
  useEffect(() => {
    if (curriculum.length === 0) return;
    const todayStr = format(new Date(), "yyyy-MM-dd");
    setCurriculum((prev) => {
      return prev.map((week) => {
        const actualHours = dailyLog
          .filter((entry) => entry.date >= week.startDate && entry.date <= week.endDate)
          .reduce((sum, entry) => sum + (entry.hours || 0), 0);
        let paceStatus: string;
        if (actualHours >= week.targetHours) {
          paceStatus = "Complete";
        } else if (todayStr < week.startDate) {
          paceStatus = "Upcoming";
        } else if (todayStr <= week.endDate) {
          // Current week
          paceStatus = actualHours > 0 ? "In Progress" : "Needs Time";
        } else {
          // Past week
          paceStatus = actualHours > 0 ? "Behind" : "Missed";
        }
        return { ...week, actualHours, paceStatus };
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyLog, curriculum.length]);

  // Backfill schedule entries from japa log and daily log for days that have no schedule entry
  useEffect(() => {
    const existingDates = new Set(scheduleLog.map((s) => s.date));
    const newEntries: ScheduleDay[] = [];

    // Get all dates from japa log and daily log that aren't in schedule log
    const allDates = new Set<string>();
    japaLog.forEach((j) => allDates.add(j.date));
    dailyLog.forEach((d) => allDates.add(d.date));

    for (const date of allDates) {
      if (existingDates.has(date)) continue;

      const japa = japaLog.find((j) => j.date === date);
      const daily = dailyLog.find((d) => d.date === date);

      // Derive what we can from japa and daily log
      const mangalaArati = japa?.mangalaArati ?? false;
      const bhogaArati = japa?.bhogaArati ?? false;
      const gauraArati = japa?.gauraArati ?? false;
      const personalStudy = daily ? (daily.minutes ?? 0) >= 120 : false;
      const morningStudy = daily ? (daily.minutes ?? 0) > 0 : false;

      // Calculate score from available data
      const items = [mangalaArati, bhogaArati, gauraArati, morningStudy, personalStudy];
      // Add "rounds complete" as a signal (16 rounds = done)
      const roundsDone = japa ? (japa.rounds ?? 0) >= 16 : false;
      items.push(roundsDone);

      const completed = items.filter(Boolean).length;
      // Score out of 9 items (same as schedule), scale what we know
      const score = Math.round((completed / 6) * 100);

      if (completed > 0) {
        newEntries.push({
          date,
          wakeUp330: false,
          mangalaArati,
          bhogaArati,
          gauraArati,
          morningStudy,
          work: false,
          personalStudy,
          sanskritClass: false,
          sleep9pm: false,
          score: Math.min(score, 100),
          notes: "Auto-filled from Japa/Study Log",
          noMeatEating: false,
          noIntoxication: false,
          noGambling: false,
          noIllicitSex: false,
          sixteenRounds: roundsDone,
          customItems: {},
          scheduleItemsSnapshot: defaultSettings.scheduleItems,
          habitTracking: {},
        });
      }
    }

    if (newEntries.length > 0) {
      setScheduleLog((prev) => [...prev, ...newEntries].sort((a, b) => a.date.localeCompare(b.date)));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [japaLog.length, dailyLog.length]);

  const createNewCourse = (name: string, color: string, startDate: string, endDate: string, books: string[], sadhanaStandards?: SadhanaStandards, regulativePrinciples?: RegulativePrinciples) => {
    const standards = sadhanaStandards || defaultSadhanaStandards;
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      name,
      color,
      startDate,
      endDate,
      books,
      sadhanaStandards: standards,
      originalBaseline: { ...standards }, // locked — can never go below this
      standardsHistory: [],
      regulativePrinciples: regulativePrinciples || defaultRegulativePrinciples,
      active: true,
    };
    setCourses((prev) => prev.map((c) => ({ ...c, active: false })).concat(newCourse));
    setActiveCourseId(newCourse.id);
    setShowCourseSwitcher(false);
  };

  const switchCourse = (courseId: string) => {
    setActiveCourseId(courseId);
    setShowCourseSwitcher(false);
  };

  return (
    <div className="flex h-screen bg-amber-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-64 bg-amber-900 dark:bg-zinc-900 text-amber-50 flex flex-col shrink-0">
        <div className="p-4 border-b border-amber-800 dark:border-zinc-800">
          <h1 className="text-lg font-bold tracking-tight">🙏 Śāstra Study</h1>
          <p className="text-xs text-amber-200 dark:text-zinc-400 mt-0.5">8-Month Curriculum</p>
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

        <nav className="flex-1 p-2 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-amber-800 dark:bg-zinc-800 text-white"
                    : "text-amber-200 dark:text-zinc-400 hover:bg-amber-800/50 dark:hover:bg-zinc-800/50 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === "dashboard" && (
          <Dashboard
            settings={settings}
            curriculum={curriculum}
            dailyLog={dailyLog}
            bookProgress={bookProgress}
            verseMemory={verseMemory}
            japaLog={japaLog}
            scheduleLog={scheduleLog}
            tutorSessions={tutorSessions}
            onTabChange={(tab, verseId) => {
              if (verseId && tab === "verses") setFocusVerseId(verseId);
              setActiveTab(tab as TabId);
            }}
          />
        )}
        {activeTab === "curriculum" && (
          <CurriculumTab curriculum={curriculum} setCurriculum={setCurriculum} />
        )}
        {activeTab === "daily-log" && (
          <DailyLogTab dailyLog={dailyLog} setDailyLog={setDailyLog} settings={settings} curriculum={curriculum} courseBooks={activeCourse?.books} />
        )}
        {activeTab === "books" && (
          <BookProgressTab bookProgress={bookProgress} setBookProgress={setBookProgress} course={activeCourse} setCourses={setCourses} />
        )}
        {activeTab === "verses" && (
          <VerseMemoryTab verseMemory={verseMemory} setVerseMemory={setVerseMemory} focusVerseId={focusVerseId} onFocusConsumed={() => setFocusVerseId(null)} />
        )}
        {activeTab === "reflections" && (
          <WeeklyReflectionTab reflections={weeklyReflections} setReflections={setWeeklyReflections} />
        )}
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
          />
        )}
        {activeTab === "guna-report" && (
          <GunaReportTab settings={settings} scheduleLog={scheduleLog} />
        )}
        {activeTab === "japa" && (
          <JapaTab japaLog={japaLog} setJapaLog={setJapaLog} />
        )}
        {activeTab === "tutor" && (
          <TutorTab sessions={tutorSessions} setSessions={setTutorSessions} />
        )}
        {activeTab === "quiz" && (
          <QuizTab dailyLog={dailyLog} />
        )}
        {activeTab === "sangha" && (
          <SanghaTab
            contacts={devoteeContacts}
            setContacts={setDevoteeContacts}
            vocabulary={sanskritVocab}
            setVocabulary={setSanskritVocab}
            questions={questionsLog}
            setQuestions={setQuestionsLog}
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
          />
        )}
      </main>
    </div>
  );
}
