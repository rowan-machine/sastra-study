"use client";

import { DailyLogEntry } from "@/lib/data";
import { getVersesInRange } from "@/lib/verseDatabase";
import { getPurportInsights, getPurportInsightsForChapters, PurportInsight } from "@/lib/purportDatabase";
import { format, subDays } from "date-fns";
import { useState, useMemo } from "react";
import { Brain, RefreshCw, CheckCircle, XCircle, Trophy, Filter, BookOpen } from "lucide-react";

interface Props {
  dailyLog: DailyLogEntry[];
}

interface QuizQuestion {
  id: string;
  type: "fill-blank" | "identify-verse" | "identify-speaker" | "theme" | "purport" | "sequence";
  question: string;
  options: string[];
  correctIndex: number;
  verseRef: string;
  explanation: string;
  category?: string; // purport question category
}

// Helpers for generating quiz questions from verses
function generateQuestions(
  verses: { ref: string; text: string }[],
  count: number
): QuizQuestion[] {
  if (verses.length === 0) return [];

  const questions: QuizQuestion[] = [];
  const shuffled = [...verses].sort(() => Math.random() - 0.5);

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const verse = shuffled[i];
    const others = verses.filter((v) => v.ref !== verse.ref);

    // Randomly pick question type
    const types: QuizQuestion["type"][] = ["fill-blank", "identify-verse", "theme", "identify-speaker"];
    const type = types[Math.floor(Math.random() * types.length)];

    let q: QuizQuestion | null = null;

    switch (type) {
      case "identify-verse": {
        // Show partial text, ask which verse it is
        const snippet = verse.text.length > 100 ? verse.text.slice(0, 100) + "..." : verse.text;
        const wrongOptions = others
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((v) => v.ref);
        const allOptions = [verse.ref, ...wrongOptions].sort(() => Math.random() - 0.5);
        q = {
          id: `q-${i}-${Date.now()}`,
          type: "identify-verse",
          question: `Which verse says: "${snippet}"`,
          options: allOptions,
          correctIndex: allOptions.indexOf(verse.ref),
          verseRef: verse.ref,
          explanation: verse.text,
        };
        break;
      }
      case "fill-blank": {
        // Remove a key phrase and ask to identify it
        const words = verse.text.split(" ");
        if (words.length < 8) break;
        const blankStart = Math.floor(words.length * 0.3) + Math.floor(Math.random() * 3);
        const blankLen = Math.min(4, words.length - blankStart - 2);
        const blankedPhrase = words.slice(blankStart, blankStart + blankLen).join(" ");
        const blankedText = words.slice(0, blankStart).join(" ") + " _____ " + words.slice(blankStart + blankLen).join(" ");

        // Generate wrong options from other verses
        const wrongPhrases = others
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((v) => {
            const w = v.text.split(" ");
            const s = Math.floor(w.length * 0.3);
            return w.slice(s, s + blankLen).join(" ");
          })
          .filter((p) => p && p !== blankedPhrase);

        if (wrongPhrases.length < 3) break;

        const allOptions = [blankedPhrase, ...wrongPhrases.slice(0, 3)].sort(() => Math.random() - 0.5);
        q = {
          id: `q-${i}-${Date.now()}`,
          type: "fill-blank",
          question: `Fill in the blank (${verse.ref}):\n"${blankedText}"`,
          options: allOptions,
          correctIndex: allOptions.indexOf(blankedPhrase),
          verseRef: verse.ref,
          explanation: verse.text,
        };
        break;
      }
      case "identify-speaker": {
        // Determine speaker from the text
        const speakers = ["Kṛṣṇa", "Arjuna", "Sañjaya", "Dhṛtarāṣṭra"];
        let correctSpeaker = "Kṛṣṇa";
        if (verse.text.startsWith("Arjuna said") || verse.text.includes("Arjuna said")) correctSpeaker = "Arjuna";
        else if (verse.text.startsWith("Sañjaya said") || verse.text.includes("Sañjaya said")) correctSpeaker = "Sañjaya";
        else if (verse.text.startsWith("Dhṛtarāṣṭra said")) correctSpeaker = "Dhṛtarāṣṭra";
        else if (verse.text.includes("The Supreme Personality of Godhead said") || verse.text.includes("Lord Śrī Kṛṣṇa said")) correctSpeaker = "Kṛṣṇa";

        const snippet = verse.text.length > 120 ? verse.text.slice(0, 120) + "..." : verse.text;
        const allOptions = speakers.sort(() => Math.random() - 0.5);
        q = {
          id: `q-${i}-${Date.now()}`,
          type: "identify-speaker",
          question: `Who is the speaker of ${verse.ref}?\n"${snippet}"`,
          options: allOptions,
          correctIndex: allOptions.indexOf(correctSpeaker),
          verseRef: verse.ref,
          explanation: `${correctSpeaker} speaks this verse. Full text: ${verse.text}`,
        };
        break;
      }
      case "theme": {
        // Ask what the verse is about (generate theme options)
        const themes = [
          "The soul is eternal and indestructible",
          "Devotional service to Kṛṣṇa",
          "Controlling the mind and senses",
          "The three modes of material nature",
          "Prescribed duty without attachment",
          "Knowledge and realization",
          "Surrender unto the Supreme Lord",
          "The material world is temporary",
        ];
        // Pick a theme based on keywords
        let correctTheme = themes[1]; // default
        if (verse.text.includes("soul") || verse.text.includes("birth") || verse.text.includes("death") || verse.text.includes("body")) correctTheme = themes[0];
        else if (verse.text.includes("devotion") || verse.text.includes("worship") || verse.text.includes("service")) correctTheme = themes[1];
        else if (verse.text.includes("mind") || verse.text.includes("senses") || verse.text.includes("control")) correctTheme = themes[2];
        else if (verse.text.includes("mode") || verse.text.includes("goodness") || verse.text.includes("passion") || verse.text.includes("ignorance")) correctTheme = themes[3];
        else if (verse.text.includes("duty") || verse.text.includes("work") || verse.text.includes("action") || verse.text.includes("fruit")) correctTheme = themes[4];
        else if (verse.text.includes("knowledge") || verse.text.includes("intelligence") || verse.text.includes("wisdom")) correctTheme = themes[5];
        else if (verse.text.includes("surrender") || verse.text.includes("refuge")) correctTheme = themes[6];
        else if (verse.text.includes("temporary") || verse.text.includes("material") || verse.text.includes("misery")) correctTheme = themes[7];

        const wrongThemes = themes.filter((t) => t !== correctTheme).sort(() => Math.random() - 0.5).slice(0, 3);
        const allOptions = [correctTheme, ...wrongThemes].sort(() => Math.random() - 0.5);
        const snippet = verse.text.length > 100 ? verse.text.slice(0, 100) + "..." : verse.text;
        q = {
          id: `q-${i}-${Date.now()}`,
          type: "theme",
          question: `What is the primary theme of ${verse.ref}?\n"${snippet}"`,
          options: allOptions,
          correctIndex: allOptions.indexOf(correctTheme),
          verseRef: verse.ref,
          explanation: verse.text,
        };
        break;
      }
    }

    if (q) questions.push(q);
  }

  return questions;
}

// Generate questions from purport insights
function generatePurportQuestions(
  insights: PurportInsight[],
  count: number
): QuizQuestion[] {
  if (insights.length === 0) return [];
  const questions: QuizQuestion[] = [];
  const shuffled = [...insights].sort(() => Math.random() - 0.5);

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const insight = shuffled[i];
    const allOptions = [insight.correctAnswer, ...insight.wrongAnswers].sort(() => Math.random() - 0.5);
    questions.push({
      id: `pq-${i}-${Date.now()}`,
      type: "purport",
      question: insight.question,
      options: allOptions,
      correctIndex: allOptions.indexOf(insight.correctAnswer),
      verseRef: `${insight.book} ${insight.verseRange}`,
      explanation: insight.explanation,
      category: insight.category,
    });
  }

  return questions;
}

export function QuizTab({ dailyLog }: Props) {
  const [lookbackDays, setLookbackDays] = useState(3);
  const [customBook, setCustomBook] = useState("");
  const [customChapters, setCustomChapters] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [quizMode, setQuizMode] = useState<"recent" | "custom">("recent");

  // Derive reading range from recent daily log entries
  const recentReadings = useMemo(() => {
    const cutoff = format(subDays(new Date(), lookbackDays), "yyyy-MM-dd");
    return dailyLog.filter((d) => d.date >= cutoff && (d.startLocation || d.endLocation));
  }, [dailyLog, lookbackDays]);

  // Get verses from the reading range
  const availableVerses = useMemo(() => {
    if (quizMode === "custom" && customChapters) {
      // Parse custom chapters like "3-4" or "3,4,5"
      const book = customBook || "BG";
      const chapters: number[] = [];
      const parts = customChapters.split(/[,\s]+/);
      for (const part of parts) {
        if (part.includes("-")) {
          const [start, end] = part.split("-").map(Number);
          for (let c = start; c <= end; c++) chapters.push(c);
        } else {
          const n = parseInt(part);
          if (!isNaN(n)) chapters.push(n);
        }
      }
      let allVerses: { ref: string; text: string }[] = [];
      for (const ch of chapters) {
        allVerses = [...allVerses, ...getVersesInRange(book === "SB" ? "SB" : "BG", ch, 1, ch, 99)];
      }
      return allVerses;
    }

    // From recent readings
    let allVerses: { ref: string; text: string }[] = [];
    for (const entry of recentReadings) {
      const bookPrefix = entry.book?.toLowerCase().includes("bhagavad") || entry.book?.toLowerCase().includes("gītā") || entry.book?.toLowerCase().includes("gita") ? "BG" : "SB";
      const startMatch = entry.startLocation?.match(/(\d+)\.(\d+)/);
      const endMatch = entry.endLocation?.match(/(\d+)\.(\d+)/);
      if (startMatch && endMatch) {
        const verses = getVersesInRange(
          bookPrefix,
          parseInt(startMatch[1]),
          parseInt(startMatch[2]),
          parseInt(endMatch[1]),
          parseInt(endMatch[2])
        );
        allVerses = [...allVerses, ...verses];
      } else if (startMatch) {
        const verses = getVersesInRange(bookPrefix, parseInt(startMatch[1]), parseInt(startMatch[2]), parseInt(startMatch[1]), 99);
        allVerses = [...allVerses, ...verses];
      }
    }
    return allVerses;
  }, [recentReadings, quizMode, customBook, customChapters]);

  // Get purport insights for the same reading range
  const availablePurportInsights = useMemo(() => {
    if (quizMode === "custom" && customChapters) {
      const book = customBook || "BG";
      const chapters: number[] = [];
      const parts = customChapters.split(/[,\s]+/);
      for (const part of parts) {
        if (part.includes("-")) {
          const [start, end] = part.split("-").map(Number);
          for (let c = start; c <= end; c++) chapters.push(c);
        } else {
          const n = parseInt(part);
          if (!isNaN(n)) chapters.push(n);
        }
      }
      return getPurportInsightsForChapters(book === "SB" ? "SB" : "BG", chapters);
    }

    // From recent readings — derive chapters
    const chapters = new Set<number>();
    let bookPrefix: "BG" | "SB" = "BG";
    for (const entry of recentReadings) {
      bookPrefix = entry.book?.toLowerCase().includes("bhagavad") || entry.book?.toLowerCase().includes("gītā") || entry.book?.toLowerCase().includes("gita") ? "BG" : "SB";
      const startMatch = entry.startLocation?.match(/(\d+)\./);
      const endMatch = entry.endLocation?.match(/(\d+)\./);
      if (startMatch) chapters.add(parseInt(startMatch[1]));
      if (endMatch) chapters.add(parseInt(endMatch[1]));
    }
    if (chapters.size === 0) return [];
    const minCh = Math.min(...chapters);
    const maxCh = Math.max(...chapters);
    return getPurportInsights(bookPrefix, minCh, maxCh);
  }, [recentReadings, quizMode, customBook, customChapters]);

  const startQuiz = (count: number = 10) => {
    // Mix verse questions and purport questions (~50/50 when both available)
    const purportCount = Math.min(Math.ceil(count / 2), availablePurportInsights.length);
    const verseCount = count - purportCount;

    const verseQs = generateQuestions(availableVerses, verseCount);
    const purportQs = generatePurportQuestions(availablePurportInsights, purportCount);
    const mixed = [...verseQs, ...purportQs].sort(() => Math.random() - 0.5);

    setQuizQuestions(mixed);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setTotalAnswered(0);
  };

  const submitAnswer = (optionIdx: number) => {
    setSelectedAnswer(optionIdx);
    setShowResult(true);
    setTotalAnswered((p) => p + 1);
    if (optionIdx === quizQuestions[currentIdx].correctIndex) {
      setScore((p) => p + 1);
    }
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setCurrentIdx((p) => p + 1);
  };

  const currentQ = quizQuestions[currentIdx];
  const quizComplete = quizQuestions.length > 0 && currentIdx >= quizQuestions.length;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-6">
        Daily Reading Quiz
      </h2>

      {/* Quiz Setup */}
      {quizQuestions.length === 0 && (
        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setQuizMode("recent")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                quizMode === "recent" ? "bg-amber-700 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200"
              }`}
            >
              Recent Reading
            </button>
            <button
              onClick={() => setQuizMode("custom")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                quizMode === "custom" ? "bg-amber-700 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200"
              }`}
            >
              <Filter size={14} className="inline mr-1" />
              Custom Range
            </button>
          </div>

          {quizMode === "recent" ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-5">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-3">Quiz from Recent Reading</h3>
              <p className="text-xs text-zinc-500 mb-4">
                Questions are generated from verses in the chapters you read in the last few days.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Lookback Period
                </label>
                <div className="flex gap-2">
                  {[1, 3, 7, 14, 30].map((d) => (
                    <button
                      key={d}
                      onClick={() => setLookbackDays(d)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        lookbackDays === d ? "bg-amber-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                      }`}
                    >
                      {d === 1 ? "Today" : `${d} days`}
                    </button>
                  ))}
                </div>
              </div>

              {recentReadings.length > 0 && (
                <div className="mb-4 text-xs text-zinc-500">
                  <p className="font-medium mb-1">Readings found:</p>
                  {recentReadings.map((r, i) => (
                    <span key={i} className="inline-block mr-2 mb-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded">
                      {r.date}: {r.book} {r.startLocation}–{r.endLocation}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 space-y-1">
                <p>
                  <Brain size={14} className="inline mr-1" />
                  <span className="font-medium">{availableVerses.length}</span> verse questions
                </p>
                <p>
                  <BookOpen size={14} className="inline mr-1" />
                  <span className="font-medium">{availablePurportInsights.length}</span> purport / philosophy questions
                </p>
                <p className="text-xs text-zinc-400">Total pool: {availableVerses.length + availablePurportInsights.length} questions</p>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-5">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-3">Custom Range Quiz</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Book</label>
                  <select
                    value={customBook}
                    onChange={(e) => setCustomBook(e.target.value)}
                    className="input-field"
                  >
                    <option value="BG">Bhagavad-gītā</option>
                    <option value="SB">Śrīmad-Bhāgavatam</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Chapters (e.g. "3-4" or "1,2,3")</label>
                  <input
                    type="text"
                    value={customChapters}
                    onChange={(e) => setCustomChapters(e.target.value)}
                    className="input-field"
                    placeholder="3-4"
                  />
                </div>
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 space-y-1">
                <p>
                  <Brain size={14} className="inline mr-1" />
                  <span className="font-medium">{availableVerses.length}</span> verse questions
                </p>
                <p>
                  <BookOpen size={14} className="inline mr-1" />
                  <span className="font-medium">{availablePurportInsights.length}</span> purport / philosophy questions
                </p>
                <p className="text-xs text-zinc-400">Total pool: {availableVerses.length + availablePurportInsights.length} questions</p>
              </div>
            </div>
          )}

          {/* Start Quiz */}
          <div className="flex gap-3">
            <button
              onClick={() => startQuiz(5)}
              disabled={availableVerses.length + availablePurportInsights.length < 3}
              className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:bg-zinc-300 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Quick Quiz (5 Q)
            </button>
            <button
              onClick={() => startQuiz(10)}
              disabled={availableVerses.length + availablePurportInsights.length < 3}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Full Quiz (10 Q)
            </button>
            <button
              onClick={() => startQuiz(Math.min(20, availableVerses.length + availablePurportInsights.length))}
              disabled={availableVerses.length + availablePurportInsights.length < 3}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-300 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Challenge ({Math.min(20, availableVerses.length + availablePurportInsights.length)} Q)
            </button>
          </div>

          {availableVerses.length + availablePurportInsights.length < 3 && (
            <p className="text-sm text-red-500">
              Not enough material in database for this range. Try expanding the lookback period or chapters.
            </p>
          )}
        </div>
      )}

      {/* Quiz in progress */}
      {currentQ && !quizComplete && (
        <div className="space-y-6">
          {/* Progress */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">
              Question {currentIdx + 1} / {quizQuestions.length}
            </span>
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Score: {score}/{totalAnswered}
            </span>
          </div>
          <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${((currentIdx + 1) / quizQuestions.length) * 100}%` }}
            />
          </div>

          {/* Question Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                currentQ.type === "purport" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" :
                currentQ.type === "identify-verse" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" :
                currentQ.type === "fill-blank" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                currentQ.type === "identify-speaker" ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" :
                "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              }`}>
                {currentQ.type === "purport" ? "Purport" :
                 currentQ.type === "identify-verse" ? "Identify Verse" :
                 currentQ.type === "fill-blank" ? "Fill in Blank" :
                 currentQ.type === "identify-speaker" ? "Speaker" :
                 "Theme"}
              </span>
              {currentQ.category && (
                <span className="px-2 py-0.5 rounded text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                  {currentQ.category}
                </span>
              )}
            </div>

            <p className="text-zinc-900 dark:text-zinc-100 font-medium whitespace-pre-line leading-relaxed mb-6">
              {currentQ.question}
            </p>

            {/* Options */}
            <div className="space-y-2">
              {currentQ.options.map((option, idx) => {
                let btnClass = "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-amber-400 dark:hover:border-amber-500";
                if (showResult) {
                  if (idx === currentQ.correctIndex) {
                    btnClass = "bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600";
                  } else if (idx === selectedAnswer && idx !== currentQ.correctIndex) {
                    btnClass = "bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600";
                  }
                } else if (selectedAnswer === idx) {
                  btnClass = "bg-amber-50 dark:bg-amber-900/20 border-amber-400 dark:border-amber-500";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => !showResult && submitAnswer(idx)}
                    disabled={showResult}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${btnClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-sm text-zinc-800 dark:text-zinc-200">{option}</span>
                      {showResult && idx === currentQ.correctIndex && <CheckCircle size={16} className="ml-auto text-green-600" />}
                      {showResult && idx === selectedAnswer && idx !== currentQ.correctIndex && <XCircle size={16} className="ml-auto text-red-500" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Result feedback */}
            {showResult && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${
                selectedAnswer === currentQ.correctIndex
                  ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                  : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
              }`}>
                <p className="font-medium mb-1">
                  {selectedAnswer === currentQ.correctIndex ? "✓ Correct!" : "✗ Incorrect"}
                </p>
                <p className="text-xs opacity-80">{currentQ.explanation}</p>
              </div>
            )}

            {/* Next button */}
            {showResult && (
              <button
                onClick={nextQuestion}
                className="mt-4 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {currentIdx + 1 < quizQuestions.length ? "Next Question →" : "See Results"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quiz Complete */}
      {quizComplete && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-8 text-center">
          <Trophy size={48} className="mx-auto mb-4 text-amber-500" />
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Quiz Complete!</h3>
          <p className="text-3xl font-bold text-amber-700 dark:text-amber-300 mb-2">
            {score} / {totalAnswered}
          </p>
          <p className="text-sm text-zinc-500 mb-1">
            {Math.round((score / totalAnswered) * 100)}% correct
          </p>
          <p className="text-sm text-zinc-500 mb-6">
            {score === totalAnswered ? "Perfect score! Jaya Kṛṣṇa! 🙏" :
             score >= totalAnswered * 0.8 ? "Excellent understanding!" :
             score >= totalAnswered * 0.6 ? "Good effort — keep studying!" :
             "Review these sections and try again."}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => startQuiz(quizQuestions.length)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw size={14} />
              Retry Same Range
            </button>
            <button
              onClick={() => { setQuizQuestions([]); setCurrentIdx(0); setScore(0); setTotalAnswered(0); }}
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
            >
              New Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
