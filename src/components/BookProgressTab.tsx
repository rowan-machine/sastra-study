"use client";

import { BookProgress, Course, curriculumBooks } from "@/lib/data";
import { CheckCircle2, GripVertical } from "lucide-react";
import { useState } from "react";

interface Props {
  bookProgress: BookProgress[];
  setBookProgress: (value: BookProgress[] | ((prev: BookProgress[]) => BookProgress[])) => void;
  course?: Course;
  setCourses?: (value: Course[] | ((prev: Course[]) => Course[])) => void;
}

const defaultBook = (book: string): BookProgress => ({
  book,
  plannedWeeks: 1,
  startDate: "",
  finishDate: "",
  complete: false,
  hoursLogged: 0,
  percentComplete: 0,
  estimatedTotalHours: 10,
  progressNotes: "",
});

export function BookProgressTab({ bookProgress, setBookProgress, course, setCourses }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

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
                <label className="block text-xs text-zinc-500 mb-1">Hours</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={book.hoursLogged || ""}
                  onChange={(e) => updateBook(idx, "hoursLogged", parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">% Done</label>
                <input
                  type="number"
                  step="5"
                  min="0"
                  max="100"
                  value={book.percentComplete ?? 0}
                  onChange={(e) => updateBook(idx, "percentComplete", Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="input-field"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs text-zinc-500 mb-1">Est. Total</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={book.estimatedTotalHours ?? book.plannedWeeks * 10}
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
                  style={{ width: `${book.complete ? 100 : (book.percentComplete ?? 0)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-xs text-zinc-500">
                  {book.complete ? "✅ Complete" : `${book.percentComplete ?? 0}% through`}
                </p>
                <p className="text-xs text-zinc-500">
                  {book.hoursLogged.toFixed(1)} hrs · ~{Math.max(0, (book.estimatedTotalHours ?? book.plannedWeeks * 10) - book.hoursLogged).toFixed(0)} left
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
