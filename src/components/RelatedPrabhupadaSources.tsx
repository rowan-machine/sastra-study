"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Library, Plus, Save } from "lucide-react";
import type { LectureNote, PrabhupadaManifestEntry, SavedAnswer } from "@/lib/data";
import { loadEntry, relatedForNote, sourceUrlWithFragment } from "@/lib/prabhupadaCorpus";

interface Props {
  note: LectureNote;
  onSaveAnswer?: (a: SavedAnswer) => void;
  onAppendToNote?: (markdown: string) => void;
}

/**
 * Small panel embedded under each expanded lecture note that suggests
 * relevant Śrīla Prabhupāda transcripts / Q&A / morning walks from the
 * local corpus. Matches on verse reference, shared tags, and title
 * keyword overlap. Rendered lazily; hidden entirely when the corpus is
 * empty or nothing scores > 0.
 */
export function RelatedPrabhupadaSources({ note, onSaveAnswer, onAppendToNote }: Props) {
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

  const loadAndUse = async (e: PrabhupadaManifestEntry) => {
    const full = await loadEntry(e);
    if (!full) return null;
    const quote = (full.text || "").split(/[.!?](?:\s+|$)/, 1)[0].trim() || e.title;
    const header = `**Prabhupāda source — ${full.title || "Untitled"}**${full.date ? ` · ${full.date}` : ""}${full.location ? ` · ${full.location}` : ""}`;
    const link = full.sourceUrl ? `\n\n[Open on Vedabase](${sourceUrlWithFragment(full.sourceUrl, full.text || "")})` : "";
    const markdown = `${header}\n\n${full.text || ""}${link}`;
    return { quote, markdown, full };
  };

  const saveEntry = async (e: PrabhupadaManifestEntry) => {
    if (!onSaveAnswer) return;
    const data = await loadAndUse(e);
    if (!data) return;
    onSaveAnswer({
      id: `sa-${Date.now()}`,
      entryId: e.id,
      entryType: e.type,
      quote: data.quote,
      title: e.title,
      sourceUrl: e.sourceUrl,
      savedAt: new Date().toISOString(),
      notes: `Suggested for lecture note: ${note.title}`,
    });
  };

  const appendEntry = async (e: PrabhupadaManifestEntry) => {
    if (!onAppendToNote) return;
    const data = await loadAndUse(e);
    if (!data) return;
    onAppendToNote(data.markdown);
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-950/20 p-3">
      <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
        <Library size={12} /> Related Prabhupāda Sources
      </div>
      <div className="space-y-2">
        {items.map((e) => (
          <div
            key={e.id}
            className="flex flex-col sm:flex-row sm:items-start gap-2 p-3 rounded-md bg-white/70 dark:bg-zinc-900/40 border border-amber-100 dark:border-amber-900/40"
          >
            <button
              onClick={() => openWithFragment(e)}
              className="min-w-0 flex-1 group text-left"
              title={e.title || "Untitled"}
            >
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 break-words leading-snug">
                {e.title || "Untitled"} <ExternalLink size={12} className="inline opacity-50" />
              </div>
              <div className="text-xs text-zinc-500 flex flex-wrap items-center gap-1.5 mt-1">
                <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                  {e.type === "qa" ? "Q&A" : e.type === "morning-walk" ? "Walk" : "Lecture"}
                </span>
                {e.date && <span>{e.date}</span>}
                {e.location && <span>· {e.location}</span>}
              </div>
            </button>
            <div className="shrink-0 flex sm:flex-col gap-1">
              {onSaveAnswer && (
                <button
                  onClick={() => saveEntry(e)}
                  className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/50"
                  title="Save to my Saved Answers"
                >
                  <Save size={12} /> Save
                </button>
              )}
              {onAppendToNote && (
                <button
                  onClick={() => appendEntry(e)}
                  className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50"
                  title="Append full text to this lecture’s notes"
                >
                  <Plus size={12} /> Append
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
