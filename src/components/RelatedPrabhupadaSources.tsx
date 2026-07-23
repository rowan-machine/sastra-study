"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Library, Save } from "lucide-react";
import type { LectureNote, PrabhupadaManifestEntry, SavedAnswer } from "@/lib/data";
import { loadEntry, relatedForNote, sourceUrlWithFragment } from "@/lib/prabhupadaCorpus";

interface Props {
  note: LectureNote;
  onSaveAnswer?: (a: SavedAnswer) => void;
}

/**
 * Small panel embedded under each expanded lecture note that suggests
 * relevant Śrīla Prabhupāda transcripts / Q&A / morning walks from the
 * local corpus. Matches on verse reference, shared tags, and title
 * keyword overlap. Rendered lazily; hidden entirely when the corpus is
 * empty or nothing scores > 0.
 */
export function RelatedPrabhupadaSources({ note, onSaveAnswer }: Props) {
  const [items, setItems] = useState<Array<PrabhupadaManifestEntry & { score: number }> | null>(null);

  useEffect(() => {
    let alive = true;
    relatedForNote(note, 6).then((r) => {
      if (alive) setItems(r);
    });
    return () => {
      alive = false;
    };
  }, [note]);

  const openWithFragment = async (e: PrabhupadaManifestEntry) => {
    const full = await loadEntry(e);
    const url = sourceUrlWithFragment(e.sourceUrl, full?.text || "");
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const saveEntry = async (e: PrabhupadaManifestEntry) => {
    if (!onSaveAnswer) return;
    const full = await loadEntry(e);
    const quote = (full?.text || "").split(/[.!?](?:\s+|$)/, 1)[0].trim() || e.title;
    onSaveAnswer({
      id: `sa-${Date.now()}`,
      entryId: e.id,
      entryType: e.type,
      quote,
      title: e.title,
      sourceUrl: e.sourceUrl,
      savedAt: new Date().toISOString(),
      notes: `Suggested for lecture note: ${note.title}`,
    });
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-950/20 p-3">
      <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
        <Library size={12} /> Related Prabhupāda Sources
      </div>
      <div className="space-y-1.5">
        {items.map((e) => (
          <div
            key={e.id}
            className="flex items-start justify-between gap-2 p-2 rounded-md bg-white/70 dark:bg-zinc-900/40 border border-amber-100 dark:border-amber-900/40"
          >
            <button
              onClick={() => openWithFragment(e)}
              className="min-w-0 flex-1 group text-left"
            >
              <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 truncate flex items-center gap-1">
                {e.title || "Untitled"} <ExternalLink size={10} className="opacity-50" />
              </div>
              <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                <span className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                  {e.type === "qa" ? "Q&A" : e.type === "morning-walk" ? "Walk" : "Lecture"}
                </span>
                {e.date && <span>{e.date}</span>}
                {e.location && <span>· {e.location}</span>}
              </div>
            </button>
            {onSaveAnswer && (
              <button
                onClick={() => saveEntry(e)}
                className="shrink-0 text-[10px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/50"
                title="Save to my Saved Answers"
              >
                <Save size={10} /> Save
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
