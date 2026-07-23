"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { DevoteeContact, LectureNote, SpiritualMaster } from "@/lib/data";
import { Search, Calendar, BookOpen, Crown, User, ChevronDown, ChevronRight, X } from "lucide-react";

interface Props {
  notes: LectureNote[];
  contacts?: DevoteeContact[];
  spiritualMaster?: SpiritualMaster;
}

export function LecturesView({ notes, contacts = [], spiritualMaster }: Props) {
  const [search, setSearch] = useState("");
  const [speakerFilter, setSpeakerFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [view, setView] = useState<Record<string, "summary" | "transcript">>({});

  const allTags = useMemo(
    () =>
      Array.from(new Set(notes.flatMap((n) => n.tags || []))).sort((a, b) => a.localeCompare(b)),
    [notes]
  );

  const speakerOptions = useMemo(() => {
    const options = new Map<string, string>();
    for (const n of notes) {
      if (n.speakerRole === "spiritual-master") {
        const name = n.speakerName || spiritualMaster?.name || "Spiritual Master";
        options.set(`sm:${name}`, name);
      } else if (n.speakerRole === "devotee" && n.speakerContactId) {
        const c = contacts.find((c) => c.id === n.speakerContactId);
        const name = c?.name || n.speakerName || "Devotee";
        options.set(`dev:${n.speakerContactId}`, name);
      } else if (n.speakerName) {
        options.set(`name:${n.speakerName}`, n.speakerName);
      } else {
        options.set("unknown", "Unspecified");
      }
    }
    return options;
  }, [notes, contacts, spiritualMaster]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return notes.filter((n) => {
      const hay = [
        n.title,
        n.source,
        n.verseReference,
        n.book,
        n.content,
        n.summary,
        n.transcript,
        ...(n.tags || []),
        n.keyPoints?.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = !q || hay.includes(q);

      let matchesSpeaker = true;
      if (speakerFilter !== "all") {
        if (n.speakerRole === "spiritual-master") {
          matchesSpeaker = speakerFilter.startsWith("sm:");
        } else if (n.speakerRole === "devotee" && n.speakerContactId) {
          matchesSpeaker = speakerFilter === `dev:${n.speakerContactId}`;
        } else if (n.speakerName) {
          matchesSpeaker = speakerFilter === `name:${n.speakerName}`;
        } else {
          matchesSpeaker = speakerFilter === "unknown";
        }
      }

      const matchesTag = tagFilter === "all" || (n.tags || []).includes(tagFilter);
      return matchesSearch && matchesSpeaker && matchesTag;
    });
  }, [notes, search, speakerFilter, tagFilter]);

  const speakerBadge = (note: LectureNote) => {
    if (note.speakerRole === "spiritual-master") {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700/50">
          <Crown size={11} /> {note.speakerName || spiritualMaster?.name || "Spiritual Master"}
        </span>
      );
    }
    if (note.speakerRole === "devotee") {
      const c = contacts.find((c) => c.id === note.speakerContactId);
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700/50">
          <User size={11} /> {c?.name || note.speakerName || "Devotee"}
        </span>
      );
    }
    if (note.speakerName) {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
          <User size={11} /> {note.speakerName}
        </span>
      );
    }
    return null;
  };

  const setNoteView = (id: string, v: "summary" | "transcript") => setView((prev) => ({ ...prev, [id]: v }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[16rem]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, speaker, verse, tag, or content..."
            className="input-field w-full !pl-10"
          />
        </div>
        <select
          value={speakerFilter}
          onChange={(e) => setSpeakerFilter(e.target.value)}
          className="input-field w-auto"
          title="Filter by speaker"
        >
          <option value="all">All speakers</option>
          {Array.from(speakerOptions.entries()).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="input-field w-auto"
          title="Filter by tag"
        >
          <option value="all">All tags</option>
          {allTags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {(search || speakerFilter !== "all" || tagFilter !== "all") && (
          <button
            onClick={() => {
              setSearch("");
              setSpeakerFilter("all");
              setTagFilter("all");
            }}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      <p className="text-xs text-zinc-500">
        {filtered.length} lecture{filtered.length === 1 ? "" : "s"} found
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((note) => {
          const isExpanded = expandedId === note.id;
          const currentView = view[note.id] || "summary";
          return (
            <div
              key={note.id}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 overflow-hidden flex flex-col"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : note.id)}
                className="text-left p-4 flex flex-col gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {note.posterImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={note.posterImage}
                      alt={note.title}
                      className="w-16 h-16 rounded-lg object-cover shrink-0 border border-amber-200 dark:border-zinc-700"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-500 shrink-0">
                      <BookOpen size={24} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 leading-tight line-clamp-2">
                      {note.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {speakerBadge(note)}
                      {note.verseReference && (
                        <span className="text-xs text-zinc-500">{note.verseReference}</span>
                      )}
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown size={18} className="text-zinc-400" /> : <ChevronRight size={18} className="text-zinc-400" />}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  {note.date && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={11} /> {format(parseISO(note.date), "MMM d, yyyy")}
                    </span>
                  )}
                  {note.source && <span>{note.source}</span>}
                </div>
                {(note.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(note.tags || []).slice(0, 6).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                      >
                        {t}
                      </span>
                    ))}
                    {(note.tags || []).length > 6 && (
                      <span className="text-[10px] px-1.5 py-0.5 text-zinc-500">+{(note.tags || []).length - 6} more</span>
                    )}
                  </div>
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-amber-100 dark:border-zinc-800">
                  {(note.keyPoints || []).length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-1.5">Key Insights</h4>
                      <ul className="list-disc list-inside text-sm text-zinc-700 dark:text-zinc-300 space-y-0.5">
                        {(note.keyPoints || []).map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex gap-1 mt-3 mb-2">
                    <button
                      onClick={() => setNoteView(note.id, "summary")}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        currentView === "summary"
                          ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200"
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      Summary
                    </button>
                    {note.transcript && (
                      <button
                        onClick={() => setNoteView(note.id, "transcript")}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                          currentView === "transcript"
                            ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        Transcript
                      </button>
                    )}
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-zinc-700 dark:text-zinc-300 max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                    {currentView === "summary" ? note.summary || "No summary available." : note.transcript || "No transcript available."}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-zinc-500 text-center py-8">
          {search || speakerFilter !== "all" || tagFilter !== "all"
            ? "No lectures match your filters."
            : "No lectures yet."}
        </p>
      )}
    </div>
  );
}
