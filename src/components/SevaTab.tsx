"use client";

import { SevaEntry, sevaCategories, emptySevaEntry, Poster, SevaNote, emptySevaNote } from "@/lib/data";
import { format } from "date-fns";
import { useMemo, useRef, useState } from "react";
import { Plus, Trash2, Heart, Image as ImageIcon, Upload, ExternalLink, StickyNote, Filter } from "lucide-react";

type ServiceFilter = "all" | (typeof sevaCategories)[number];

interface Props {
  sevaLog: SevaEntry[];
  setSevaLog: (value: SevaEntry[] | ((prev: SevaEntry[]) => SevaEntry[])) => void;
  sevaPosters?: Poster[];
  setSevaPosters?: (value: Poster[] | ((prev: Poster[]) => Poster[])) => void;
  sevaNotes?: SevaNote[];
  setSevaNotes?: (value: SevaNote[] | ((prev: SevaNote[]) => SevaNote[])) => void;
  onOpenPosters?: () => void;
}

export function SevaTab({
  sevaLog,
  setSevaLog,
  sevaPosters = [],
  setSevaPosters,
  sevaNotes = [],
  setSevaNotes,
  onOpenPosters,
}: Props) {
  const [showAll, setShowAll] = useState(false);
  const posterInputRef = useRef<HTMLInputElement>(null);
  const [previewPoster, setPreviewPoster] = useState<Poster | null>(null);
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>("all");
  const posterService: (typeof sevaCategories)[number] = "Tulasi";

  const handlePosterFiles = (files: FileList | null) => {
    if (!files || !setSevaPosters) return;
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const service =
      serviceFilter !== "all" ? (serviceFilter as string) : posterService;
    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const newPoster: Poster = {
          id: `seva-poster-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          src: dataUrl,
          title: file.name.replace(/\.[^/.]+$/, ""),
          addedAt: new Date().toISOString(),
          category: "seva",
          service,
        };
        setSevaPosters((prev) => [newPoster, ...prev]);
      };
      reader.readAsDataURL(file);
    });
  };

  const deletePoster = (id: string) => {
    if (!setSevaPosters) return;
    setSevaPosters((prev) => prev.filter((p) => p.id !== id));
    setPreviewPoster((p) => (p?.id === id ? null : p));
  };

  const updatePoster = (id: string, patch: Partial<Poster>) => {
    if (!setSevaPosters) return;
    setSevaPosters((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const addNote = () => {
    if (!setSevaNotes) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const service = serviceFilter !== "all" ? (serviceFilter as string) : posterService;
    setSevaNotes((prev) => [emptySevaNote(service, today), ...prev]);
  };

  const updateNote = (id: string, patch: Partial<SevaNote>) => {
    if (!setSevaNotes) return;
    setSevaNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  };

  const deleteNote = (id: string) => {
    if (!setSevaNotes) return;
    setSevaNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredPosters = useMemo(
    () =>
      serviceFilter === "all"
        ? sevaPosters
        : sevaPosters.filter((p) => (p.service || "Other") === serviceFilter),
    [sevaPosters, serviceFilter]
  );

  const filteredNotes = useMemo(
    () =>
      (serviceFilter === "all"
        ? sevaNotes
        : sevaNotes.filter((n) => n.service === serviceFilter)
      ).slice().sort((a, b) => b.date.localeCompare(a.date)),
    [sevaNotes, serviceFilter]
  );

  const sorted = useMemo(
    () => [...sevaLog].sort((a, b) => b.date.localeCompare(a.date)),
    [sevaLog]
  );

  const displayLog = showAll ? sorted : sorted.slice(0, 14);

  const addEntry = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const exists = sevaLog.some((e) => e.date === today);
    if (exists) return;
    setSevaLog((prev) => [emptySevaEntry(today), ...prev]);
  };

  const updateEntry = (id: string, field: keyof SevaEntry, value: string | number | null) => {
    setSevaLog((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const deleteEntry = (id: string) => {
    setSevaLog((prev) => prev.filter((e) => e.id !== id));
  };

  const totalEntries = sevaLog.length;
  const totalHours = sevaLog.reduce((sum, e) => sum + (e.hours || 0), 0);
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    sevaLog.forEach((e) => {
      counts.set(e.category, (counts.get(e.category) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [sevaLog]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
            <Heart size={24} />
            Sevā Log
          </h2>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
            Record your acts of devotional service and look back on your contributions.
          </p>
        </div>
        <button
          onClick={addEntry}
          className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Log Today
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Total Entries</p>
          <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{totalEntries}</p>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Total Hours</p>
          <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{totalHours.toFixed(1)}</p>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Top Category</p>
          <p className="text-lg font-bold text-amber-900 dark:text-amber-100 truncate">
            {categoryCounts[0]?.[0] ?? "—"}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{categoryCounts[0]?.[1] ?? 0} entries</p>
        </div>
      </div>

      {/* Service filter */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mr-1">
          <Filter size={12} />
          <span className="uppercase tracking-wide">Filter by service</span>
        </div>
        {(["all", ...sevaCategories] as ServiceFilter[]).map((s) => {
          const active = serviceFilter === s;
          const posterCount =
            s === "all"
              ? sevaPosters.length
              : sevaPosters.filter((p) => (p.service || "Other") === s).length;
          const noteCount =
            s === "all" ? sevaNotes.length : sevaNotes.filter((n) => n.service === s).length;
          return (
            <button
              key={s}
              onClick={() => setServiceFilter(s)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                active
                  ? "bg-amber-700 border-amber-700 text-white"
                  : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-amber-400"
              }`}
            >
              <span>{s === "all" ? "All" : s}</span>
              <span className={`text-[10px] ${active ? "text-amber-100" : "text-zinc-400"}`}>
                {posterCount}p · {noteCount}n
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-6 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <ImageIcon size={18} />
              Instructional Posters
              {serviceFilter !== "all" && (
                <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">· {serviceFilter}</span>
              )}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Reference images for sevā — trimming manjaris, deity dress, offerings, etc. Also viewable in the Posters tab under “Sevā”.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onOpenPosters && (
              <button
                onClick={onOpenPosters}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 rounded-lg transition-colors"
                title="Open in Poster Viewer"
              >
                <ExternalLink size={12} />
                Open viewer
              </button>
            )}
            <button
              onClick={() => posterInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-medium transition-colors"
              disabled={!setSevaPosters}
              title="Upload poster"
            >
              <Upload size={12} />
              Add poster
            </button>
            <input
              ref={posterInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handlePosterFiles(e.target.files)}
              className="hidden"
            />
          </div>
        </div>

        {filteredPosters.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg">
            <ImageIcon size={28} className="mx-auto mb-2 text-zinc-400" />
            <p className="text-sm">
              {serviceFilter === "all"
                ? "No sevā posters yet."
                : `No posters for ${serviceFilter} yet.`}
            </p>
            <p className="text-xs">Upload an image to keep instructions on hand.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredPosters.map((p) => (
              <div key={p.id} className="group relative bg-zinc-100 dark:bg-zinc-900 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => setPreviewPoster(p)}
                  className="block w-full aspect-square overflow-hidden focus:outline-none focus:ring-2 focus:ring-amber-500"
                  title={p.title}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.src}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </button>
                <input
                  value={p.title}
                  onChange={(e) => updatePoster(p.id, { title: e.target.value })}
                  className="w-full text-xs px-2 py-1.5 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-t border-zinc-200 dark:border-zinc-700 focus:outline-none"
                />
                <select
                  value={p.service || "Other"}
                  onChange={(e) => updatePoster(p.id, { service: e.target.value })}
                  className="w-full text-[11px] px-2 py-1 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-t border-zinc-200 dark:border-zinc-700 focus:outline-none"
                >
                  {sevaCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => deletePoster(p.id)}
                  className="absolute top-1.5 right-1.5 p-1 bg-white/80 dark:bg-zinc-900/80 hover:bg-red-600 hover:text-white text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete poster"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service Notes */}
      <div className="mb-6 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <StickyNote size={18} />
              Service Notes
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Instructions, tips, or things you were told/shown while performing sevā — organized per service.
            </p>
          </div>
          <button
            onClick={addNote}
            disabled={!setSevaNotes}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Plus size={12} />
            Add note
          </button>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg">
            <StickyNote size={28} className="mx-auto mb-2 text-zinc-400" />
            <p className="text-sm">
              {serviceFilter === "all"
                ? "No service notes yet."
                : `No notes for ${serviceFilter} yet.`}
            </p>
            <p className="text-xs">Click “Add note” to record an instruction.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <select
                    value={note.service}
                    onChange={(e) => updateNote(note.id, { service: e.target.value })}
                    className="input-field text-xs sm:w-40"
                  >
                    {sevaCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={note.date}
                    onChange={(e) => updateNote(note.id, { date: e.target.value })}
                    className="input-field text-xs sm:w-40"
                  />
                  <input
                    value={note.source ?? ""}
                    onChange={(e) => updateNote(note.id, { source: e.target.value })}
                    placeholder="From (devotee)…"
                    className="input-field text-xs flex-1 min-w-0"
                  />
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-zinc-400 hover:text-red-600 transition-colors sm:ml-auto"
                    title="Delete note"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  value={note.title}
                  onChange={(e) => updateNote(note.id, { title: e.target.value })}
                  placeholder="Short title (e.g. “Manjari trimming rules”)"
                  className="input-field text-sm w-full font-medium"
                />
                <textarea
                  value={note.content}
                  onChange={(e) => updateNote(note.id, { content: e.target.value })}
                  placeholder="What you were told or shown…"
                  className="input-field text-sm w-full min-h-[80px]"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {previewPoster && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewPoster(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewPoster.src}
            alt={previewPoster.title}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setPreviewPoster(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

      <div className="space-y-3">
        {displayLog.map((entry) => (
          <div
            key={entry.id}
            className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700 space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <input
                type="date"
                value={entry.date}
                onChange={(e) => updateEntry(entry.id, "date", e.target.value)}
                className="input-field text-sm"
              />
              <select
                value={entry.category}
                onChange={(e) => updateEntry(entry.id, "category", e.target.value)}
                className="input-field text-sm"
              >
                {sevaCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="0.25"
                value={entry.hours ?? ""}
                placeholder="Hours"
                onChange={(e) => {
                  const val = e.target.value;
                  updateEntry(entry.id, "hours", val === "" ? null : parseFloat(val));
                }}
                className="input-field text-sm w-full sm:w-28"
              />
              <button
                onClick={() => deleteEntry(entry.id)}
                className="ml-auto text-zinc-400 hover:text-red-600 transition-colors"
                title="Delete entry"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <textarea
              value={entry.description}
              onChange={(e) => updateEntry(entry.id, "description", e.target.value)}
              placeholder="What service did you perform?"
              className="input-field text-sm w-full min-h-[80px]"
            />
          </div>
        ))}

        {sevaLog.length === 0 && (
          <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-800 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
            <p>No sevā entries yet.</p>
            <p className="text-sm">Click “Log Today” to record your first act of service.</p>
          </div>
        )}
      </div>

      {sorted.length > 14 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAll((s) => !s)}
            className="text-sm text-amber-700 dark:text-amber-300 hover:underline"
          >
            {showAll ? "Show recent 14" : `Show all ${sorted.length} entries`}
          </button>
        </div>
      )}
    </div>
  );
}
