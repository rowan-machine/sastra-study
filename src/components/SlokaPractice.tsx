"use client";

import { useState } from "react";
import { VerseMemory } from "@/lib/data";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

const memorizationLabels = [
  "",
  "Syllable hints",
  "First 2 letters",
  "First letter only",
  "Some words hidden",
  "Most words hidden",
  "Alternate lines",
  "Fully blank",
];

function maskText(text: string, level: number, wordIdx: number, lineIdx: number): string {
  if (level === 0) return text;
  const hash = ((wordIdx * 7 + lineIdx * 13) % 100) / 100;

  switch (level) {
    case 1:
      return text.replace(/[aāiīuūṛṝeēoōai au]/gi, (ch, offset) =>
        (offset + wordIdx) % 3 === 0 ? "_" : ch
      );
    case 2:
      if (text.length <= 2) return text;
      return text.slice(0, 2) + "·".repeat(text.length - 2);
    case 3:
      if (text.length <= 1) return text;
      return text[0] + "·".repeat(text.length - 1);
    case 4:
      return hash < 0.4 ? "·".repeat(Math.max(text.length, 3)) : text;
    case 5:
      return hash < 0.65 ? "·".repeat(Math.max(text.length, 3)) : text;
    case 6:
      return lineIdx % 2 === 0 ? "·".repeat(Math.max(text.length, 3)) : text;
    case 7:
      return "·".repeat(Math.max(text.length, 3));
    default:
      return text;
  }
}

interface Props {
  verse: VerseMemory;
  onClose?: () => void;
}

export function SlokaPractice({ verse, onClose }: Props) {
  const [level, setLevel] = useState(1);
  const [showMeaning, setShowMeaning] = useState(false);

  const lines = (verse.verseText || "").split("\n").filter((l) => l.trim());

  return (
    <div className="rounded-xl border border-amber-200 dark:border-zinc-700 bg-amber-50/60 dark:bg-zinc-900/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <BookOpen size={16} className="text-amber-600" />
            {verse.versePassage || "Sloka"}
          </h4>
          <p className="text-xs text-zinc-500">{verse.source}</p>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs px-2 py-1 rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => setLevel((l) => Math.max(0, l - 1))}
          className="p-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          aria-label="Decrease difficulty"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-medium px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 min-w-[140px] text-center">
          {level}: {memorizationLabels[level] || "Full text"}
        </span>
        <button
          onClick={() => setLevel((l) => Math.min(7, l + 1))}
          className="p-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          aria-label="Increase difficulty"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => setShowMeaning((v) => !v)}
          className="text-xs px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700"
        >
          {showMeaning ? "Hide meaning" : "Show meaning"}
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-amber-100 dark:border-zinc-800 p-4 mb-3 leading-loose font-sans">
        {lines.map((line, lineIdx) => {
          const words = line.split(/\s+/).filter(Boolean);
          return (
            <div key={lineIdx} className="mb-2 last:mb-0">
              {words.map((word, wordIdx) => (
                <span
                  key={`${lineIdx}-${wordIdx}`}
                  className="inline-block mr-2 text-lg text-zinc-900 dark:text-zinc-100"
                >
                  {maskText(word, level, wordIdx, lineIdx)}
                </span>
              ))}
            </div>
          );
        })}
      </div>

      {showMeaning && verse.theme && (
        <p className="text-sm text-zinc-700 dark:text-zinc-300 italic border-l-2 border-amber-300 pl-3">
          {verse.theme}
        </p>
      )}
    </div>
  );
}
