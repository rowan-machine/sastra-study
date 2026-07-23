"use client";

import { BookProgress, Course, DailyLogEntry, curriculumBooks, getBookAbbreviation, parseVerseRef, seedBookProgress } from "@/lib/data";
import { getBookCoverUrl, getBookGradient, getBookInitials, bookInvocations } from "@/lib/bookCovers";
import { CheckCircle2, ChevronDown, ChevronUp, GripVertical, Moon, Play, X } from "lucide-react";
import { format, addDays } from "date-fns";
import { useState, useMemo, useEffect } from "react";

/** Strip diacritics and normalize Unicode for robust book name matching */
function normalizeBookName(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function findSeedByName(bookName: string) {
  // Try exact match first
  const exact = seedBookProgress.find((s) => s.book === bookName);
  if (exact) return exact;
  // Try abbreviation match
  const abbr = getBookAbbreviation(bookName);
  if (abbr) {
    const byAbbr = seedBookProgress.find((s) => getBookAbbreviation(s.book) === abbr);
    if (byAbbr) return byAbbr;
  }
  // Try normalized Unicode match (handles different diacritical encodings)
  const norm = normalizeBookName(bookName);
  return seedBookProgress.find((s) => normalizeBookName(s.book) === norm) || null;
}

/** Cumulative verse counts per chapter for books we can track by verse position.
 *  Each entry is [totalVersesInCh1, ch1+ch2, ...] so index i = cumulative through chapter i+1. */
const BG_VERSES_PER_CHAPTER = [46,72,43,42,29,47,30,28,34,42,55,20,35,27,20,24,28,78];
const BG_CUMULATIVE = BG_VERSES_PER_CHAPTER.reduce<number[]>((acc, v) => { acc.push((acc[acc.length-1]||0)+v); return acc; }, []);
const BG_TOTAL = BG_CUMULATIVE[BG_CUMULATIVE.length-1]; // 700

/** Get approximate position (0-100%) through BG based on chapter.verse */
function bgPositionPercent(chapter: number, verse: number): number {
  if (chapter < 1 || chapter > 18) return 0;
  const prevChaptersCum = chapter > 1 ? BG_CUMULATIVE[chapter-2] : 0;
  const versesInChapter = BG_VERSES_PER_CHAPTER[chapter-1];
  const posInChapter = Math.min(verse, versesInChapter);
  return Math.round(((prevChaptersCum + posInChapter) / BG_TOTAL) * 100);
}

/** Compute progress % from the latest endLocation in daily log for a given book */
function getPositionPercent(entries: DailyLogEntry[], progressBook: string): number | null {
  // Only supported for books where we know total content
  const abbr = getBookAbbreviation(progressBook);
  const matching = entries.filter((e) => bookMatches(e.book, progressBook) && e.endLocation);
  if (matching.length === 0) return null;
  // Get the latest entry by date
  const latest = matching.sort((a, b) => b.date.localeCompare(a.date))[0];
  const parsed = parseVerseRef(latest.endLocation);
  if (!parsed) return null;
  if (abbr === "BG") {
    // Absolute position through the full book (includes pre-read chapters 1-3.18)
    return bgPositionPercent(parsed.chapter, parsed.verse);
  }
  // For other books, we don't have verse counts yet — return null
  return null;
}

/** Match a dailyLog book name to a bookProgress book name */
function bookMatches(logBook: string, progressBook: string): boolean {
  if (!logBook || !progressBook) return false;
  const ll = logBook.toLowerCase();
  const pl = progressBook.toLowerCase();
  if (pl.includes(ll) || ll.includes(pl)) return true;
  const logAbbr = getBookAbbreviation(logBook);
  const progAbbr = getBookAbbreviation(progressBook);
  return logAbbr !== "" && logAbbr === progAbbr;
}

function Characters({ bookName, characters, onChange }: { bookName: string; characters: string[]; onChange: (characters: string[]) => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [expanded, setExpanded] = useState(false);

  const seed = findSeedByName(bookName);
  const seedCharacters = seed?.characters && seed.characters.length > 0 ? seed.characters : [];
  const displayCharacters = characters?.length ? characters : seedCharacters;

  const addCharacter = () => {
    const entry = role.trim() ? `${name.trim()} — ${role.trim()}` : name.trim();
    if (!entry) return;
    const base = characters?.length ? characters : seedCharacters;
    onChange([...base, entry]);
    setName("");
    setRole("");
  };

  return (
    <div className="mt-3 pt-3 border-t border-amber-100 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300 mb-2 hover:text-amber-900 dark:hover:text-amber-100"
      >
        Personalities ({(displayCharacters || []).length})
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {expanded && (
        <>
          <div className="space-y-1.5 mb-3 max-h-60 overflow-y-auto">
            {(displayCharacters || []).map((entry, i) => {
              const dashIdx = entry.indexOf(" — ");
              const charName = dashIdx >= 0 ? entry.slice(0, dashIdx) : entry;
              const charRole = dashIdx >= 0 ? entry.slice(dashIdx + 3) : "";
              return (
                <div key={`${entry}-${i}`} className="flex items-start gap-2 group">
                  <div className="flex-1 text-xs">
                    <span className="font-semibold text-indigo-800 dark:text-indigo-200">{charName}</span>
                    {charRole && <span className="text-zinc-600 dark:text-zinc-400"> — {charRole}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const base = characters?.length ? characters : seedCharacters;
                      onChange(base.filter((_, ci) => ci !== i));
                    }}
                    className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-opacity flex-shrink-0"
                    aria-label={`Remove ${charName}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  e.preventDefault();
                  addCharacter();
                }
              }}
              placeholder="Name"
              className="input-field text-xs"
            />
            <button
              type="button"
              onClick={addCharacter}
              className="px-3 py-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50"
            >
              Add
            </button>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  e.preventDefault();
                  addCharacter();
                }
              }}
              placeholder="Role / description (optional)"
              className="input-field text-xs col-span-2"
            />
          </div>
        </>
      )}
    </div>
  );
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtube")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch { /* ignore */ }
  return null;
}

function InvocationPlayer({ url }: { url?: string }) {
  const [open, setOpen] = useState(false);
  if (!url) return null;
  const embedUrl = getYouTubeEmbedUrl(url);

  return (
    <div className="mb-6 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Introduction Invocation</p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">Play the recording before reading or study.</p>
        </div>
        {open ? (
          <button
            onClick={() => setOpen(false)}
            className="px-3 py-1.5 text-xs font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 rounded transition-colors"
          >
            Hide
          </button>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded transition-colors"
          >
            <Play size={14} /> Play
          </button>
        )}
      </div>
      {open && (
        <div className="mt-4">
          {embedUrl ? (
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
              <iframe
                className="w-full h-full"
                src={embedUrl}
                title="Introduction Invocation"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-sm text-amber-800 dark:text-amber-200">
              <a href={url} target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-900 dark:hover:text-amber-100">
                Open recording in new tab
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Slow-pace nightly reading card. For books with page-count metadata,
// this shows "read pages X–Y tonight", projected finish date, and lets
// you adjust pace and log completion.
function SlowPaceReading({
  book,
  onUpdate,
}: {
  book: BookProgress;
  onUpdate: (patch: Partial<BookProgress>) => void;
}) {
  const today = new Date();
  const total = book.totalPages || 0;
  const current = Math.min(Math.max(book.currentPage || 0, 0), total);
  const target = Math.max(book.dailyPagesTarget || 1, 1);
  const start = current + 1;
  const end = Math.min(total, current + target);
  const remaining = Math.max(0, total - current);
  const pageProgress = total > 0 ? Math.round((current / total) * 100) : 0;
  const projectedDays = target > 0 ? Math.ceil(remaining / target) : 0;
  const projectedFinish = format(addDays(today, projectedDays), "MMM d, yyyy");

  const markRead = (pages: number) => {
    const next = Math.min(total, current + pages);
    onUpdate({ currentPage: next });
    if (next >= total && !book.complete) {
      onUpdate({ complete: true, finishDate: today.toISOString().slice(0, 10), percentComplete: 100 });
    }
  };

  return (
    <div className="mt-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
      <div className="flex items-center gap-2 mb-2">
        <Moon size={14} className="text-indigo-600 dark:text-indigo-300" />
        <h4 className="text-xs font-semibold text-indigo-800 dark:text-indigo-200 uppercase tracking-wide">
          Tonight&apos;s slow-pace reading
        </h4>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <div>
          <label className="block text-[10px] text-zinc-500 mb-0.5">Total pages</label>
          <input
            type="number"
            min={1}
            value={total || ""}
            onChange={(e) => onUpdate({ totalPages: parseInt(e.target.value) || undefined })}
            className="input-field text-xs py-1"
          />
        </div>
        <div>
          <label className="block text-[10px] text-zinc-500 mb-0.5">Current page</label>
          <input
            type="number"
            min={0}
            max={total}
            value={current}
            onChange={(e) => onUpdate({ currentPage: parseInt(e.target.value) || 0 })}
            className="input-field text-xs py-1"
          />
        </div>
        <div>
          <label className="block text-[10px] text-zinc-500 mb-0.5">Pages/night</label>
          <input
            type="number"
            min={1}
            max={total}
            value={target}
            onChange={(e) => onUpdate({ dailyPagesTarget: parseInt(e.target.value) || 1 })}
            className="input-field text-xs py-1"
          />
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-[10px] text-zinc-500">Part · Chapter</p>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              value={book.currentPart || ""}
              onChange={(e) => onUpdate({ currentPart: parseInt(e.target.value) || undefined })}
              className="input-field text-xs py-1 w-12"
              placeholder="P"
            />
            <span className="text-zinc-400">·</span>
            <input
              type="number"
              min={1}
              value={book.currentChapter || ""}
              onChange={(e) => onUpdate({ currentChapter: parseInt(e.target.value) || undefined })}
              className="input-field text-xs py-1 w-12"
              placeholder="C"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex-1">
          <div className="h-2 bg-indigo-200 dark:bg-indigo-900/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all"
              style={{ width: `${pageProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
            {pageProgress}% · {remaining} page{remaining === 1 ? "" : "s"} left · finish ~{projectedFinish}
          </p>
        </div>
        <button
          onClick={() => markRead(target)}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
          title={`Log that you read pages ${start}–${end}`}
        >
          Read {start}–{end}
        </button>
      </div>

      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
        At {target} page{target === 1 ? "" : "s"}/night, this book finishes around{" "}
        <span className="font-medium text-indigo-700 dark:text-indigo-300">{projectedFinish}</span>.
      </p>
    </div>
  );
}

export function BookCover({ bookName, size = "md" }: { bookName: string; size?: "sm" | "md" }) {
  const [error, setError] = useState(false);
  const url = getBookCoverUrl(bookName);
  const dim = size === "sm" ? "w-10 h-14" : "w-14 h-20";
  const textSize = size === "sm" ? "text-[8px]" : "text-[10px]";

  if (url && !error) {
    return (
      <img
        src={url}
        alt={bookName}
        onError={() => setError(true)}
        className={`${dim} rounded object-cover shadow-sm flex-shrink-0`}
      />
    );
  }
  // Fallback: gradient with initials
  const gradient = getBookGradient(bookName);
  const initials = getBookInitials(bookName);
  return (
    <div className={`${dim} rounded shadow-sm flex-shrink-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
      <span className={`${textSize} font-bold text-white/90 leading-tight text-center px-0.5`}>{initials}</span>
    </div>
  );
}

interface Props {
  bookProgress: BookProgress[];
  setBookProgress: (value: BookProgress[] | ((prev: BookProgress[]) => BookProgress[])) => void;
  dailyLog?: DailyLogEntry[];
  course?: Course;
  setCourses?: (value: Course[] | ((prev: Course[]) => Course[])) => void;
}

export function defaultBook(book: string): BookProgress {
  return {
    book,
    plannedWeeks: 1,
    startDate: "",
    finishDate: "",
    complete: false,
    hoursLogged: 0,
    percentComplete: 0,
    estimatedTotalHours: 10,
    progressNotes: "",
    characters: [],
  };
}

export function BookProgressTab({ bookProgress, setBookProgress, dailyLog, course, setCourses }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  // Backfill Personalities and Notes from seed data if missing
  useEffect(() => {
    let changed = false;
    const updated = bookProgress.map((bp) => {
      const seed = findSeedByName(bp.book);

      // No seed exists for this book — any characters present are stale data, clear them
      if (!seed) {
        if (bp.characters && bp.characters.length > 0) {
          changed = true;
          return { ...bp, characters: [] };
        }
        return bp;
      }

      const seedHasChars = seed.characters && seed.characters.length > 0;
      const bpHasChars = bp.characters && bp.characters.length > 0;

      // If seed has characters and book has none, backfill
      const needsChars = !bpHasChars && seedHasChars;

      // If book has characters but they belong to a DIFFERENT seed, replace with correct ones
      const hasWrongChars = bpHasChars && seedHasChars &&
        bp.characters![0] !== seed.characters![0];

      const needsNotes = !bp.progressNotes && seed.progressNotes;
      if (!needsChars && !hasWrongChars && !needsNotes) return bp;
      changed = true;
      return {
        ...bp,
        characters: (needsChars || hasWrongChars) ? seed.characters : bp.characters,
        progressNotes: needsNotes ? seed.progressNotes : bp.progressNotes,
      };
    });
    if (changed) setBookProgress(updated);
  }, [bookProgress, setBookProgress]);

  // Compute actual hours per book from dailyLog (uses hours field, falls back to minutes/60)
  const computedHours = useMemo(() => {
    if (!dailyLog || dailyLog.length === 0) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const bp of bookProgress) {
      let total = 0;
      for (const entry of dailyLog) {
        if (bookMatches(entry.book, bp.book)) {
          const hrs = entry.hours != null ? entry.hours : (entry.minutes != null ? entry.minutes / 60 : 0);
          total += hrs;
        }
      }
      map.set(bp.book, Math.round(total * 100) / 100);
    }
    return map;
  }, [dailyLog, bookProgress]);

  // Compute position-based progress from endLocation in dailyLog
  const positionPercent = useMemo(() => {
    if (!dailyLog || dailyLog.length === 0) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const bp of bookProgress) {
      const pct = getPositionPercent(dailyLog, bp.book);
      if (pct !== null) map.set(bp.book, pct);
    }
    return map;
  }, [dailyLog, bookProgress]);

  const updateBook = (index: number, field: keyof BookProgress, value: unknown) => {
    setBookProgress((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    setBookProgress((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      if (course && setCourses) {
        const reorderedBooks = updated.map((b) => b.book);
        setCourses((cprev) => cprev.map((c) => c.id === course.id ? { ...c, books: reorderedBooks } : c));
      }
      return updated;
    });
  };

  const addBook = (book: string) => {
    if (bookProgress.some((b) => b.book === book)) return;
    setBookProgress((prev) => [...prev, defaultBook(book)]);
    if (course && setCourses) {
      setCourses((prev) => prev.map((c) => c.id === course.id ? { ...c, books: [...c.books, book] } : c));
    }
  };

  const availableBooks = curriculumBooks.filter((b) => !bookProgress.some((bp) => bp.book === b));

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <InvocationPlayer url={course?.invocationRecordingUrl} />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">Book Progress</h2>
        {availableBooks.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  addBook(e.target.value);
                  e.target.value = "";
                }
              }}
              className="input-field text-sm w-auto"
            >
              <option value="">+ Add book...</option>
              {availableBooks.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {bookProgress.map((book, idx) => (
          <div
            key={book.book}
            draggable
            onDragStart={() => setDragIndex(idx)}
            onDragOver={(e) => {
              e.preventDefault();
              setDropIndex(idx);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex !== null) {
                reorder(dragIndex, idx);
              }
              setDragIndex(null);
              setDropIndex(null);
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setDropIndex(null);
            }}
            className={`bg-white dark:bg-zinc-900 rounded-xl border p-4 cursor-move ${
              dragIndex === idx ? "opacity-50" : ""
            } ${
              dropIndex === idx && dragIndex !== idx ? "border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-100 dark:ring-indigo-900/30" : ""
            } ${
              book.complete
                ? "border-green-300 dark:border-green-800"
                : "border-amber-200 dark:border-zinc-800"
            }`}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="text-zinc-300 dark:text-zinc-600 pt-1">
                <GripVertical size={18} />
              </div>
              <BookCover bookName={book.book} />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{idx + 1}. {book.book}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {book.plannedWeeks} weeks planned
                    </p>
                  </div>
                  <button
                    onClick={() => updateBook(idx, "complete", !book.complete)}
                    title={book.complete ? "Mark incomplete" : "Mark complete"}
                    className="ml-2"
                  >
                    <CheckCircle2 size={20} className={book.complete ? "text-green-500" : "text-zinc-300 dark:text-zinc-600"} />
                  </button>
                </div>
              </div>
            </div>

            {(() => {
              const loggedHours = computedHours.get(book.book) ?? book.hoursLogged;
              const estTotal = book.estimatedTotalHours ?? book.plannedWeeks * 10;
              const hoursPercent = estTotal > 0 ? Math.min(100, Math.round((loggedHours / estTotal) * 100)) : 0;
              const posPercent = positionPercent.get(book.book);
              // Use position-based progress when available (more accurate), else hours-based
              const autoPercent = posPercent ?? hoursPercent;
              const displayPercent = book.complete ? 100 : autoPercent;
              return (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Start</label>
                      <input
                        type="date"
                        value={book.startDate}
                        onChange={(e) => updateBook(idx, "startDate", e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Finish</label>
                      <input
                        type="date"
                        value={book.finishDate}
                        onChange={(e) => updateBook(idx, "finishDate", e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Hours (from log)</label>
                      <input
                        type="text"
                        readOnly
                        value={loggedHours.toFixed(2)}
                        className="input-field bg-zinc-50 dark:bg-zinc-800 cursor-default"
                        title="Auto-calculated from Daily Log entries for this book"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">% Done</label>
                      <input
                        type="text"
                        readOnly
                        value={`${displayPercent}%`}
                        className="input-field bg-zinc-50 dark:bg-zinc-800 cursor-default"
                        title="Auto-calculated: hours / estimated total"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs text-zinc-500 mb-1">Est. Total</label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={estTotal}
                        onChange={(e) => updateBook(idx, "estimatedTotalHours", parseInt(e.target.value) || 1)}
                        className="input-field"
                      />
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="h-2 bg-amber-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 dark:bg-amber-600 rounded-full transition-all"
                        style={{ width: `${displayPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-zinc-500">
                        {book.complete ? "Complete" : `${displayPercent}% through`}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {loggedHours.toFixed(1)} hrs logged · ~{Math.max(0, estTotal - loggedHours).toFixed(0)} hrs left
                      </p>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Slow-pace nightly reading (page-based books) */}
            {book.totalPages ? (
              <SlowPaceReading
                book={book}
                onUpdate={(patch) => {
                  Object.entries(patch).forEach(([field, value]) =>
                    updateBook(idx, field as keyof BookProgress, value)
                  );
                }}
              />
            ) : null}

            {/* Notes */}
            <div className="mt-2">
              <input
                type="text"
                value={book.progressNotes || ""}
                onChange={(e) => updateBook(idx, "progressNotes", e.target.value)}
                placeholder="Notes..."
                className="input-field text-xs w-full"
              />
            </div>

            {/* Characters */}
            <Characters bookName={book.book} characters={book.characters || []} onChange={(chars) => updateBook(idx, "characters", chars)} />

            {/* Invocation reference */}
            {(() => {
              const inv = bookInvocations[book.book];
              if (!inv) return null;
              return (
                <div className="mt-3 pt-3 border-t border-amber-100 dark:border-zinc-800">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-0.5">
                    Invocation: {inv.has}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 italic">
                    {inv.text}
                  </p>
                </div>
              );
            })()}
          </div>
        ))}
      </div>
    </div>
  );
}
