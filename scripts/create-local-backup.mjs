// Generate a structural backup of all known sastra-* localStorage keys.
// This is meant to test that the backup schema includes every new data element
// even when no data has been entered yet. Run it after adding new keys and
// before importing real user data.

import { writeFileSync } from "fs";
import { resolve } from "path";

const now = new Date().toISOString();
const backupDir = resolve(process.cwd(), "public/backups");

const courses = [
  { id: "course-1", name: "Foundation Course" },
  { id: "course-2", name: "Expansion Course" },
  { id: "course-bio", name: "Prabhupāda Biography (Parallel)" },
  { id: "course-3", name: "Consolidation Course (III)" },
  { id: "course-4", name: "Deepening Course (IV)" },
  { id: "course-5", name: "Bhāgavata / Caitanya Continuation (V)" },
];

const globalKeys = [
  "sastra-courses",
  "sastra-active-course",
  "sastra-reading-wishlist",
  "sastra-disciple-course-lessons",
  "sastra-disciple-course-meta",
  "sastra-sidebar-collapsed",
];

const courseSuffixes = [
  "settings",
  "curriculum",
  "daily-log",
  "book-progress",
  "verse-memory",
  "weekly-reflections",
  "journal-entries",
  "japa-log",
  "seva-log",
  "seva-posters",
  "seva-notes",
  "tutor-sessions",
  "schedule-log",
  "contacts",
  "vocabulary",
  "questions",
  "prabhupada-saved-answers",
  "lecture-notes",
  "quiz-history",
  "character-assessments",
  "spiritual-master",
];

const knownKeys = [
  ...globalKeys,
  ...courses.flatMap((c) => courseSuffixes.map((s) => `sastra-${c.id}-${s}`)),
].sort();

const localStorage = Object.fromEntries(knownKeys.map((k) => [k, null]));

const backup = {
  version: 3,
  generatedAt: now,
  chatgptReadMe:
    "This is a structural backup of the Śāstra Study app. All known localStorage keys are listed with null values so the backup tool can be tested before real data is added.",
  summary: {
    activeCourse: null,
    activeCourseId: null,
    totalStudyDays: 0,
    totalStudyHours: 0,
    last30Days: {
      daysLogged: 0,
      averageDailyHours: 0,
      daysWith16Rounds: 0,
      daysWithAllRegulativePrinciples: 0,
      daysWithMangalaArati: 0,
    },
    books: { total: 0, completed: 0, inProgress: 0 },
    character: null,
    verseMemory: { total: 0, mastered: 0 },
    devoteeContacts: 0,
    prabhupada: { questions: 0, savedAnswers: 0 },
    spiritualMaster: null,
    discipleCourse: { lessons: 0 },
    tutorSessions: 0,
    lectureNotes: 0,
    quizHistory: 0,
    characterAssessments: 0,
    seva: { logEntries: 0, posters: 0, notes: 0 },
    readingWishlist: 0,
    journalEntries: 0,
    exportedAt: now,
  },
  schema: {
    knownKeys,
    courses,
  },
  localStorage,
};

const filename = `sastra-study-backup-latest.json`;
const filepath = resolve(backupDir, filename);
writeFileSync(filepath, JSON.stringify(backup, null, 2));
console.log(`Wrote structural backup to ${filepath}`);
