"use client";

import { DevoteeContact, LectureNote, SpiritualMaster, LectureSpeakerRole, SavedAnswer } from "@/lib/data";
import { Plus, Search, Trash2, X, FileText, Upload, ExternalLink, ChevronDown, ChevronRight, User, Crown, Image as ImageIcon, BookOpen, Sparkles } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { RelatedPrabhupadaSources } from "@/components/RelatedPrabhupadaSources";

interface Props {
  notes: LectureNote[];
  setNotes: (value: LectureNote[] | ((prev: LectureNote[]) => LectureNote[])) => void;
  contacts?: DevoteeContact[];
  setContacts?: (value: DevoteeContact[] | ((prev: DevoteeContact[]) => DevoteeContact[])) => void;
  spiritualMaster?: SpiritualMaster;
  // Optional filter: only show lectures by this speaker (contact id or "spiritual-master")
  restrictSpeaker?: { role: LectureSpeakerRole; contactId?: string };
  // Hide the outer header/controls (used when embedded inside another card)
  embedded?: boolean;
  // Optional: hook up "Save answer" buttons on related Prabhupāda sources.
  onSaveAnswer?: (a: SavedAnswer) => void;
}

type ViewMode = "summary" | "transcript" | "notes";

const SPEAKER_FILTER_ALL = "__all__";
const NEW_DEVOTEE_VALUE = "__new__";

export function LecturesSection({ notes, setNotes, contacts = [], setContacts, spiritualMaster, restrictSpeaker, embedded = false, onSaveAnswer }: Props) {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [speakerFilter, setSpeakerFilter] = useState<string>(SPEAKER_FILTER_ALL);
  const [viewMode, setViewMode] = useState<Record<string, ViewMode>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [posterUploadId, setPosterUploadId] = useState<string | null>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);
  const [newDevoteeFor, setNewDevoteeFor] = useState<string | null>(null);
  const [newDevoteeName, setNewDevoteeName] = useState("");
  const [newDevoteeRole, setNewDevoteeRole] = useState("");
  const [bulkPaste, setBulkPaste] = useState<Record<string, string>>({});

  const setNoteView = (id: string, mode: ViewMode) => {
    setViewMode((prev) => ({ ...prev, [id]: mode }));
  };

  const speakerOptions = useMemo(() => {
    const seen = new Map<string, { key: string; label: string; role: LectureSpeakerRole; contactId?: string }>();
    // Always include the spiritual master row if there's a linked master or a lecture keyed to them
    const masterLectures = notes.some((n) => n.speakerRole === "spiritual-master");
    if (spiritualMaster?.name || masterLectures) {
      seen.set("spiritual-master", {
        key: "spiritual-master",
        label: spiritualMaster?.name ? `${spiritualMaster.name} (Spiritual Master)` : "Spiritual Master",
        role: "spiritual-master",
      });
    }
    for (const n of notes) {
      if (n.speakerRole === "devotee" && n.speakerContactId) {
        const key = `contact-${n.speakerContactId}`;
        if (!seen.has(key)) {
          const contact = contacts.find((c) => c.id === n.speakerContactId);
          seen.set(key, {
            key,
            label: contact?.name || n.speakerName || "Devotee",
            role: "devotee",
            contactId: n.speakerContactId,
          });
        }
      } else if (n.speakerName && !n.speakerContactId) {
        const key = `name-${n.speakerName.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.set(key, { key, label: n.speakerName, role: n.speakerRole || "other" });
        }
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [notes, contacts, spiritualMaster]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return notes.filter((n) => {
      // Speaker restriction (from parent) always applies
      if (restrictSpeaker) {
        if (restrictSpeaker.role === "spiritual-master") {
          if (n.speakerRole !== "spiritual-master") return false;
        } else if (restrictSpeaker.role === "devotee") {
          if (n.speakerContactId !== restrictSpeaker.contactId) return false;
        }
      }
      // In-component filter
      if (speakerFilter !== SPEAKER_FILTER_ALL) {
        if (speakerFilter === "spiritual-master" && n.speakerRole !== "spiritual-master") return false;
        if (speakerFilter.startsWith("contact-") && `contact-${n.speakerContactId}` !== speakerFilter) return false;
        if (speakerFilter.startsWith("name-") && `name-${(n.speakerName || "").toLowerCase()}` !== speakerFilter) return false;
      }
      if (!q) return true;
      const haystack = [
        n.title,
        n.source,
        n.speakerName || "",
        n.verseReference || "",
        n.book || "",
        n.content || "",
        n.summary || "",
        n.transcript || "",
        (n.tags || []).join(" "),
        (n.keyPoints || []).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [notes, search, speakerFilter, restrictSpeaker]);

  const addNote = () => {
    const getPreset = () => {
      if (restrictSpeaker) {
        return restrictSpeaker.role === "spiritual-master"
          ? { speakerRole: "spiritual-master" as const, speakerName: spiritualMaster?.name || "" }
          : {
              speakerRole: "devotee" as const,
              speakerContactId: restrictSpeaker.contactId,
              speakerName: contacts.find((c) => c.id === restrictSpeaker.contactId)?.name || "",
            };
      }
      if (speakerFilter === SPEAKER_FILTER_ALL) return {};
      const option = speakerOptions.find((s) => s.key === speakerFilter);
      if (!option) return {};
      if (option.role === "spiritual-master") {
        return { speakerRole: "spiritual-master" as const, speakerName: spiritualMaster?.name || option.label };
      }
      if (option.role === "devotee" && option.contactId) {
        return {
          speakerRole: "devotee" as const,
          speakerContactId: option.contactId,
          speakerName: contacts.find((c) => c.id === option.contactId)?.name || option.label,
        };
      }
      return { speakerRole: "other" as const, speakerName: option.label };
    };
    const preset = getPreset();
    const newNote: LectureNote = {
      id: `lecture-${Date.now()}`,
      title: "",
      date: format(new Date(), "yyyy-MM-dd"),
      source: "",
      tags: [],
      content: "",
      summary: "",
      transcript: "",
      keyPoints: [],
      ...preset,
    };
    setNotes((prev) => [newNote, ...prev]);
    setExpandedId(newNote.id);
    setNoteView(newNote.id, "summary");
  };

  const updateNote = (id: string, patch: Partial<LectureNote>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  };

  const saveNewDevotee = (noteId: string) => {
    const name = newDevoteeName.trim();
    if (!name || !setContacts) return;
    const contact: DevoteeContact = {
      id: `dev-${Date.now()}`,
      name,
      role: newDevoteeRole.trim(),
      phone: "",
      email: "",
      expertise: [],
      instructions: "",
      notes: "",
    };
    setContacts((prev) => [...prev, contact]);
    updateNote(noteId, {
      speakerRole: "devotee",
      speakerContactId: contact.id,
      speakerName: contact.name,
    });
    setNewDevoteeFor(null);
    setNewDevoteeName("");
    setNewDevoteeRole("");
  };

  const cancelNewDevotee = (noteId: string) => {
    setNewDevoteeFor(null);
    setNewDevoteeName("");
    setNewDevoteeRole("");
    const note = notes.find((n) => n.id === noteId);
    if (note && !note.speakerContactId && !note.speakerName && note.speakerRole !== "spiritual-master") {
      updateNote(noteId, { speakerRole: "other" });
    }
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setExpandedId((prev) => (prev === id ? null : prev));
  };

  const addTag = (id: string, value: string) => {
    if (!value.trim()) return;
    setNotes((prev) =>
      prev.map((n) => (n.id === id && !n.tags.includes(value.trim()) ? { ...n, tags: [...n.tags, value.trim()] } : n))
    );
  };

  const removeTag = (id: string, tag: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, tags: n.tags.filter((t) => t !== tag) } : n)));
  };

  const addKeyPoint = (id: string, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, keyPoints: [...(n.keyPoints || []), trimmed] } : n))
    );
  };

  const removeKeyPoint = (id: string, index: number) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, keyPoints: (n.keyPoints || []).filter((_, i) => i !== index) } : n
      )
    );
  };

  const parseBulkPaste = (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    const raw = bulkPaste[id] || "";
    if (!raw.trim()) return;

    const lines = raw.split(/\r?\n/);
    const keyIdx = lines.findIndex((l) => /^Key Insights/i.test(l.trim()));
    const tagsIdx = lines.findIndex((l) => /^Tags/i.test(l.trim()));

    const keyStop = tagsIdx >= 0 && tagsIdx > keyIdx ? tagsIdx : lines.length;
    const keyLines = keyIdx >= 0 ? lines.slice(keyIdx + 1, keyStop) : [];
    const tagLines = tagsIdx >= 0 ? lines.slice(tagsIdx + 1) : [];

    const newKeyPoints = keyLines
      .map((l) => l.trim().replace(/^[\s\-•*]+/, ""))
      .filter((l) => l.length > 0 && !/^Tags?/i.test(l));

    const tagText = tagLines.join(",");
    const newTags = tagText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              keyPoints: [...new Set([...(n.keyPoints || []), ...newKeyPoints])],
              tags: [...new Set([...(n.tags || []), ...newTags])],
            }
          : n
      )
    );
    setBulkPaste((prev) => ({ ...prev, [id]: "" }));
  };

  // Compress poster images before storing so they don't blow localStorage quota.
  const compressImage = (dataUrl: string, fileType: string): Promise<string> => {
    return new Promise((resolve) => {
      if (fileType === "image/svg+xml" || fileType === "image/gif" || dataUrl.startsWith("data:image/svg")) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const max = 1200;
        let width = img.width;
        let height = img.height;
        if (width > max || height > max) {
          const ratio = Math.min(max / width, max / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  // File upload handling: accepts markdown and image files. Markdown files ending
  // with "_summary" / "-summary" attach to summary, "_transcript" / "-transcript"
  // to transcript. Image files matching the same stem become the poster. If only
  // an image is provided, it creates a poster-first lecture to fill in later.
  const handlePosterUpload = async (file: File | null) => {
    if (!file || !posterUploadId) return;
    const reader = new FileReader();
    reader.onload = async () => {
      let dataUrl = String(reader.result || "");
      if (!dataUrl) return;
      dataUrl = await compressImage(dataUrl, file.type);
      updateNote(posterUploadId, { posterImage: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const readText = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = reject;
        reader.readAsText(file);
      });
    const readDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    const bundles = new Map<string, { summary?: string; transcript?: string; posterImage?: string; title?: string }>();
    for (const file of Array.from(files)) {
      const base = file.name.replace(/\.[^/.]+$/, "");
      const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name);
      const isSummary = /(^|[_\- ])summary$/i.test(base);
      const isTranscript = /(^|[_\- ])transcript$/i.test(base);
      const stem = base.replace(/([_\- ])(summary|transcript)$/i, "").trim() || base;
      const bundle = bundles.get(stem) || {};

      if (isImage) {
        const dataUrl = await readDataUrl(file);
        bundle.posterImage = await compressImage(dataUrl, file.type);
      } else {
        const raw = await readText(file);
        if (isSummary) bundle.summary = raw;
        else if (isTranscript) bundle.transcript = raw;
        else if (!bundle.summary) bundle.summary = raw;
        // Derive a title from the first heading if we don't have one yet
        if (!bundle.title) {
          const heading = raw.match(/^#\s+(.+)/m);
          if (heading) bundle.title = heading[1].trim();
        }
      }
      if (!bundle.title) bundle.title = stem.replace(/[_\-]+/g, " ").trim();
      bundles.set(stem, bundle);
    }

    const now = Date.now();
    const created: LectureNote[] = Array.from(bundles.entries()).map(([stem, b], i) => ({
      id: `lecture-${now}-${i}`,
      title: b.title || stem,
      date: format(new Date(), "yyyy-MM-dd"),
      source: "",
      tags: [],
      content: "",
      summary: b.summary || "",
      transcript: b.transcript || "",
      posterImage: b.posterImage,
      keyPoints: [],
      speakerRole: restrictSpeaker?.role,
      speakerContactId: restrictSpeaker?.role === "devotee" ? restrictSpeaker.contactId : undefined,
      speakerName:
        restrictSpeaker?.role === "spiritual-master"
          ? spiritualMaster?.name
          : restrictSpeaker?.role === "devotee"
          ? contacts.find((c) => c.id === restrictSpeaker.contactId)?.name
          : undefined,
    }));

    setNotes((prev) => [...created, ...prev]);
    if (created.length > 0) {
      setExpandedId(created[0].id);
      setNoteView(created[0].id, "summary");
    }
  };

  const speakerBadge = (note: LectureNote) => {
    if (note.speakerRole === "spiritual-master") {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700/50">
          <Crown size={11} /> {note.speakerName || spiritualMaster?.name || "Spiritual Master"}
        </span>
      );
    }
    if (note.speakerRole === "devotee") {
      const contact = contacts.find((c) => c.id === note.speakerContactId);
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700/50">
          <User size={11} /> {contact?.name || note.speakerName || "Devotee"}
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

  return (
    <div className="space-y-4">
      {!embedded && (
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
            <option value={SPEAKER_FILTER_ALL}>All speakers</option>
            {speakerOptions.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-sm font-medium transition-colors"
            title="Upload markdown summary + transcript files, and/or poster image"
          >
            <Upload size={14} /> Upload Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt,image/*"
            multiple
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
            className="hidden"
          />
          <input
            ref={posterInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              handlePosterUpload(e.target.files?.[0] || null);
              e.target.value = "";
              setPosterUploadId(null);
            }}
            className="hidden"
          />
          <button
            onClick={addNote}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={14} /> New Lecture
          </button>
        </div>
      )}

      {embedded && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            {filtered.length} lecture{filtered.length === 1 ? "" : "s"} by this speaker
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-medium transition-colors"
              title="Upload markdown summary + transcript files"
            >
              <Upload size={12} /> Upload MD
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown,.txt"
              multiple
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
              className="hidden"
            />
            <button
              onClick={addNote}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Plus size={12} /> New
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-sm text-zinc-500 text-center py-8">
            {search
              ? "No lectures match your search."
              : "No lectures yet. Click New Lecture to add one, or drop in markdown files."}
          </p>
        )}

        {filtered.map((note) => {
          const isExpanded = expandedId === note.id;
          const contact = note.speakerContactId ? contacts.find((c) => c.id === note.speakerContactId) : undefined;
          const currentView = viewMode[note.id] || "summary";
          return (
            <div
              key={note.id}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : note.id)}
                className="w-full flex items-start gap-3 p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                {note.posterImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={note.posterImage}
                    alt={note.title}
                    className="w-14 h-14 rounded-lg object-cover shrink-0 border border-amber-200 dark:border-zinc-700"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-amber-50 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-amber-400">
                    <FileText size={20} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {note.title || "Untitled Lecture"}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {speakerBadge(note)}
                    {note.verseReference && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                        {note.verseReference}
                      </span>
                    )}
                    {note.date && (
                      <span className="text-xs text-zinc-500">
                        {format(new Date(note.date + "T12:00"), "MMM d, yyyy")}
                      </span>
                    )}
                    {note.tags.length > 0 && (
                      <span className="text-xs text-zinc-400">· {note.tags.length} tag{note.tags.length !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 self-center">
                  {isExpanded ? (
                    <ChevronDown size={16} className="text-zinc-400" />
                  ) : (
                    <ChevronRight size={16} className="text-zinc-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="p-4 border-t border-amber-100 dark:border-zinc-800 space-y-4">
                  {/* Related Prabhupāda sources (from local corpus) */}
                  <RelatedPrabhupadaSources note={note} onSaveAnswer={onSaveAnswer} />
                  {/* Key retention pills */}
                  {(note.keyPoints || []).length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles size={12} className="text-amber-500" />
                        <span className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300 font-semibold">
                          Key Insights (for retention)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(note.keyPoints || []).map((kp, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700/50 leading-tight"
                          >
                            {kp}
                            <button
                              onClick={() => removeKeyPoint(note.id, i)}
                              className="text-amber-500 hover:text-red-600 transition-colors"
                              title="Remove insight"
                            >
                              <X size={11} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-0.5">Title</label>
                      <input
                        type="text"
                        value={note.title}
                        onChange={(e) => updateNote(note.id, { title: e.target.value })}
                        className="input-field w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-0.5">Date</label>
                      <input
                        type="date"
                        value={note.date}
                        onChange={(e) => updateNote(note.id, { date: e.target.value })}
                        className="input-field w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-0.5">Speaker</label>
                      <select
                        value={
                          newDevoteeFor === note.id
                            ? NEW_DEVOTEE_VALUE
                            : note.speakerRole === "spiritual-master"
                            ? "spiritual-master"
                            : note.speakerContactId
                            ? `contact-${note.speakerContactId}`
                            : "other"
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "spiritual-master") {
                            updateNote(note.id, {
                              speakerRole: "spiritual-master",
                              speakerContactId: undefined,
                              speakerName: spiritualMaster?.name || "",
                            });
                            setNewDevoteeFor(null);
                          } else if (value.startsWith("contact-")) {
                            const cid = value.slice("contact-".length);
                            const c = contacts.find((x) => x.id === cid);
                            updateNote(note.id, {
                              speakerRole: "devotee",
                              speakerContactId: cid,
                              speakerName: c?.name || note.speakerName,
                            });
                            setNewDevoteeFor(null);
                          } else if (value === NEW_DEVOTEE_VALUE) {
                            setNewDevoteeFor(note.id);
                            setNewDevoteeName("");
                            setNewDevoteeRole("");
                          } else {
                            updateNote(note.id, {
                              speakerRole: "other",
                              speakerContactId: undefined,
                            });
                            setNewDevoteeFor(null);
                          }
                        }}
                        className="input-field w-full"
                      >
                        {spiritualMaster?.name && (
                          <option value="spiritual-master">
                            {spiritualMaster.name} (Spiritual Master)
                          </option>
                        )}
                        {contacts.length > 0 && (
                          <optgroup label="Devotee Directory">
                            {contacts
                              .filter((c) => c.name)
                              .map((c) => (
                                <option key={c.id} value={`contact-${c.id}`}>
                                  {c.name}
                                  {c.role ? ` — ${c.role}` : ""}
                                </option>
                              ))}
                          </optgroup>
                        )}
                        {setContacts && !restrictSpeaker && (
                          <option value={NEW_DEVOTEE_VALUE}>+ Add new devotee...</option>
                        )}
                        <option value="other">Other / free-form</option>
                      </select>
                      {newDevoteeFor === note.id && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <label className="block text-xs text-zinc-500 mb-0.5">New devotee name</label>
                          <input
                            type="text"
                            value={newDevoteeName}
                            onChange={(e) => setNewDevoteeName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                saveNewDevotee(note.id);
                              }
                            }}
                            className="input-field w-full"
                            placeholder="e.g. Magadahri Dāsa"
                          />
                          <label className="block text-xs text-zinc-500 mb-0.5 mt-1">Role (optional)</label>
                          <input
                            type="text"
                            value={newDevoteeRole}
                            onChange={(e) => setNewDevoteeRole(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                saveNewDevotee(note.id);
                              }
                            }}
                            className="input-field w-full"
                            placeholder="e.g. brāhmaṇa, teacher"
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => saveNewDevotee(note.id)}
                              disabled={!newDevoteeName.trim()}
                              className="px-2 py-1 text-xs font-medium bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => cancelNewDevotee(note.id)}
                              className="px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                      {note.speakerRole === "other" && (
                        <input
                          type="text"
                          value={note.speakerName || ""}
                          onChange={(e) => updateNote(note.id, { speakerName: e.target.value })}
                          className="input-field w-full mt-1"
                          placeholder="Speaker's name"
                        />
                      )}
                      {note.speakerRole === "devotee" && contact && (
                        <p className="text-[10px] text-zinc-400 mt-1">
                          Linked to <span className="font-medium">{contact.name}</span>
                          {contact.role ? ` — ${contact.role}` : ""}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-0.5">Verse Reference</label>
                      <input
                        type="text"
                        value={note.verseReference || ""}
                        onChange={(e) => updateNote(note.id, { verseReference: e.target.value })}
                        className="input-field w-full"
                        placeholder="e.g. SB 3.26.40 or BG 15.14"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-0.5">Book</label>
                      <select
                        value={note.book || ""}
                        onChange={(e) => updateNote(note.id, { book: e.target.value })}
                        className="input-field w-full"
                      >
                        <option value="">Select a book</option>
                        <option value="Śrīmad-Bhāgavatam">Śrīmad-Bhāgavatam</option>
                        <option value="Bhagavad Gita">Bhagavad Gita</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-0.5">Recording / Media URL</label>
                      <input
                        type="text"
                        value={note.mediaUrl || ""}
                        onChange={(e) => updateNote(note.id, { mediaUrl: e.target.value })}
                        className="input-field w-full"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-zinc-500 mb-0.5">Poster Image</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={note.posterImage || ""}
                          onChange={(e) => updateNote(note.id, { posterImage: e.target.value })}
                          className="input-field flex-1"
                          placeholder="Upload or paste image path / URL"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPosterUploadId(note.id);
                            posterInputRef.current?.click();
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1.5 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        >
                          <Upload size={12} /> Upload
                        </button>
                        {note.posterImage && (
                          <a
                            href={note.posterImage}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                          >
                            <ImageIcon size={12} /> View
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-xs text-zinc-500 mb-0.5">Tags</label>
                    <div className="flex flex-wrap items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-950/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full cursor-pointer hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                          onClick={() => removeTag(note.id, tag)}
                          title="Click to remove"
                        >
                          {tag} <X size={12} />
                        </span>
                      ))}
                      <input
                        type="text"
                        className="bg-transparent text-sm flex-1 min-w-[8rem] outline-none"
                        placeholder="Add tag + Enter"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                            e.preventDefault();
                            addTag(note.id, (e.target as HTMLInputElement).value.trim());
                            (e.target as HTMLInputElement).value = "";
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Key Points input */}
                  <div>
                    <label className="block text-xs text-zinc-500 mb-0.5">Add Key Insight</label>
                    <input
                      type="text"
                      className="input-field w-full"
                      placeholder="Type an insight and press Enter to add"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                          e.preventDefault();
                          addKeyPoint(note.id, (e.target as HTMLInputElement).value.trim());
                          (e.target as HTMLInputElement).value = "";
                        }
                      }}
                    />
                    <p className="text-[10px] text-zinc-400 mt-1">
                      Insights appear as pills at the top for retention. Click × on a pill to remove.
                    </p>
                  </div>

                  {/* Bulk paste key insights and tags */}
                  <div>
                    <label className="block text-xs text-zinc-500 mb-0.5">Bulk Paste Key Insights & Tags</label>
                    <textarea
                      value={bulkPaste[note.id] || ""}
                      onChange={(e) => setBulkPaste((prev) => ({ ...prev, [note.id]: e.target.value }))}
                      className="input-field w-full min-h-[160px] text-xs"
                      placeholder={`Paste a block like:\nKey Insights\nMaterial activities alone cannot...\nThe Supersoul within the heart...\n\nTags\nŚrīmad-Bhāgavatam, Canto 3, Virāṭ-puruṣa, ...`}
                    />
                    <div className="flex justify-end mt-1.5">
                      <button
                        type="button"
                        onClick={() => parseBulkPaste(note.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                      >
                        Extract Key Insights & Tags
                      </button>
                    </div>
                  </div>

                  {/* View toggle */}
                  <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 w-fit">
                    {([
                      { id: "summary" as const, label: "Summary", icon: BookOpen },
                      { id: "transcript" as const, label: "Transcript", icon: FileText },
                      { id: "notes" as const, label: "My Notes", icon: PenIcon },
                    ] as const).map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setNoteView(note.id, id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          currentView === id
                            ? "bg-white dark:bg-zinc-900 text-amber-800 dark:text-amber-200 shadow-sm"
                            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        }`}
                      >
                        <Icon size={12} />
                        {label}
                      </button>
                    ))}
                  </div>

                  {currentView === "summary" && (
                    <div>
                      <label className="block text-xs text-zinc-500 mb-0.5">Summary (markdown)</label>
                      <textarea
                        value={note.summary || ""}
                        onChange={(e) => updateNote(note.id, { summary: e.target.value })}
                        className="input-field w-full min-h-[240px] font-mono text-xs"
                        placeholder="# Lecture Summary\n\nParagraphs and headings here..."
                      />
                    </div>
                  )}
                  {currentView === "transcript" && (
                    <div>
                      <label className="block text-xs text-zinc-500 mb-0.5">Full Transcript</label>
                      <textarea
                        value={note.transcript || ""}
                        onChange={(e) => updateNote(note.id, { transcript: e.target.value })}
                        className="input-field w-full min-h-[280px] font-mono text-xs"
                        placeholder="Paste the full transcript here..."
                      />
                    </div>
                  )}
                  {currentView === "notes" && (
                    <div>
                      <label className="block text-xs text-zinc-500 mb-0.5">My Personal Notes</label>
                      <textarea
                        value={note.content}
                        onChange={(e) => updateNote(note.id, { content: e.target.value })}
                        className="input-field w-full min-h-[200px]"
                        placeholder="Realizations, questions, connections to my own sādhana..."
                      />
                    </div>
                  )}

                  {note.mediaUrl && (
                    <a
                      href={note.mediaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 hover:underline"
                    >
                      <ExternalLink size={12} /> Open recording
                    </a>
                  )}

                  <button
                    onClick={() => deleteNote(note.id)}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={12} /> Delete lecture
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PenIcon(props: { size?: number; className?: string }) {
  // Small inline pen icon to avoid another lucide import for a single spot
  const size = props.size || 12;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
