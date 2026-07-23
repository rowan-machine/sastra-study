"use client";

import { useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Edit3,
  Eye,
  ExternalLink,
  ListChecks,
  Paperclip,
  PencilLine,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import {
  DiscipleAttachment,
  DiscipleCourseMeta,
  DiscipleExercise,
  DiscipleHomework,
  DiscipleLesson,
  newExercise,
  newHomework,
} from "@/lib/data";

interface Props {
  lessons: DiscipleLesson[];
  setLessons: (v: DiscipleLesson[] | ((prev: DiscipleLesson[]) => DiscipleLesson[])) => void;
  meta: DiscipleCourseMeta;
  setMeta: (v: DiscipleCourseMeta | ((prev: DiscipleCourseMeta) => DiscipleCourseMeta)) => void;
}

// Prose-styled markdown, designed for readable long-form notes.
function Markdown({ children, muted = false }: { children: string; muted?: boolean }) {
  const trimmed = (children ?? "").trim();
  if (!trimmed) {
    return (
      <p className="text-sm italic text-zinc-400 dark:text-zinc-500">
        {muted ? "(nothing written yet)" : "—"}
      </p>
    );
  }
  return (
    <div
      className={
        "max-w-none text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200 " +
        "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-amber-900 dark:[&_h1]:text-amber-100 [&_h1]:mt-4 [&_h1]:mb-2 " +
        "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-amber-900 dark:[&_h2]:text-amber-100 [&_h2]:mt-4 [&_h2]:mb-2 " +
        "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-amber-900 dark:[&_h3]:text-amber-100 [&_h3]:mt-3 [&_h3]:mb-1.5 " +
        "[&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-amber-900 dark:[&_h4]:text-amber-100 [&_h4]:mt-3 [&_h4]:mb-1 " +
        "[&_p]:my-2 [&_p]:whitespace-pre-wrap [&_p]:break-words " +
        "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 " +
        "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 " +
        "[&_li]:my-1 [&_li]:break-words " +
        "[&_strong]:font-semibold [&_strong]:text-amber-900 dark:[&_strong]:text-amber-100 " +
        "[&_em]:italic " +
        "[&_a]:text-amber-700 dark:[&_a]:text-amber-300 [&_a]:underline hover:[&_a]:text-amber-900 " +
        "[&_blockquote]:border-l-4 [&_blockquote]:border-amber-400 dark:[&_blockquote]:border-amber-700 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-zinc-700 dark:[&_blockquote]:text-zinc-300 [&_blockquote]:my-3 " +
        "[&_code]:bg-amber-50 dark:[&_code]:bg-zinc-900 [&_code]:text-amber-800 dark:[&_code]:text-amber-200 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px] " +
        "[&_pre]:bg-zinc-100 dark:[&_pre]:bg-zinc-900 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:text-[13px] " +
        "[&_hr]:my-4 [&_hr]:border-zinc-200 dark:[&_hr]:border-zinc-700 " +
        "[&_table]:my-3 [&_th]:text-left [&_th]:font-semibold [&_th]:p-2 [&_th]:border [&_th]:border-zinc-200 dark:[&_th]:border-zinc-700 " +
        "[&_td]:p-2 [&_td]:border [&_td]:border-zinc-200 dark:[&_td]:border-zinc-700"
      }
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{trimmed}</ReactMarkdown>
    </div>
  );
}

export function DiscipleCourseTab({ lessons, setLessons, meta, setMeta }: Props) {
  const [activeLessonId, setActiveLessonId] = useState<string>(lessons[0]?.id ?? "");
  const [collapsedUnits, setCollapsedUnits] = useState<Record<number, boolean>>({});
  const [showMetaEditor, setShowMetaEditor] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState<DiscipleAttachment | null>(null);
  const [editMode, setEditMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeLesson = useMemo(
    () => lessons.find((l) => l.id === activeLessonId) ?? lessons[0] ?? null,
    [lessons, activeLessonId]
  );

  const unitGroups = useMemo(() => {
    const map = new Map<number, { unitTitle: string; items: DiscipleLesson[] }>();
    lessons.forEach((l) => {
      if (!map.has(l.unit)) map.set(l.unit, { unitTitle: l.unitTitle, items: [] });
      map.get(l.unit)!.items.push(l);
    });
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([unit, v]) => ({ unit, ...v, items: v.items.sort((a, b) => a.lessonNumber - b.lessonNumber) }));
  }, [lessons]);

  const totals = useMemo(() => {
    const attended = lessons.filter((l) => l.attended).length;
    const hwTotal = lessons.reduce((s, l) => s + l.homework.length, 0);
    const hwDone = lessons.reduce((s, l) => s + l.homework.filter((h) => h.done).length, 0);
    const hwOpen = hwTotal - hwDone;
    return { attended, total: lessons.length, hwTotal, hwDone, hwOpen };
  }, [lessons]);

  const patchLesson = (id: string, patch: Partial<DiscipleLesson>) => {
    setLessons((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l))
    );
  };

  // Homework helpers
  const addHomework = (lessonId: string) => {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId
          ? { ...l, homework: [...l.homework, newHomework()], updatedAt: new Date().toISOString() }
          : l
      )
    );
  };

  const updateHomework = (lessonId: string, hwId: string, patch: Partial<DiscipleHomework>) => {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId
          ? {
              ...l,
              homework: l.homework.map((h) => (h.id === hwId ? { ...h, ...patch } : h)),
              updatedAt: new Date().toISOString(),
            }
          : l
      )
    );
  };

  const deleteHomework = (lessonId: string, hwId: string) => {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId
          ? { ...l, homework: l.homework.filter((h) => h.id !== hwId), updatedAt: new Date().toISOString() }
          : l
      )
    );
  };

  // Exercise helpers
  const addExercise = (lessonId: string) => {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId
          ? { ...l, exercises: [...l.exercises, newExercise()], updatedAt: new Date().toISOString() }
          : l
      )
    );
  };

  const updateExercise = (lessonId: string, exId: string, patch: Partial<DiscipleExercise>) => {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId
          ? {
              ...l,
              exercises: l.exercises.map((e) => (e.id === exId ? { ...e, ...patch } : e)),
              updatedAt: new Date().toISOString(),
            }
          : l
      )
    );
  };

  const deleteExercise = (lessonId: string, exId: string) => {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId
          ? { ...l, exercises: l.exercises.filter((e) => e.id !== exId), updatedAt: new Date().toISOString() }
          : l
      )
    );
  };

  // Attachment helpers
  const handleAttachmentFiles = (lessonId: string, files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const attachment: DiscipleAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          dataUrl: reader.result as string,
          addedAt: new Date().toISOString(),
        };
        setLessons((prev) =>
          prev.map((l) =>
            l.id === lessonId
              ? { ...l, attachments: [attachment, ...l.attachments], updatedAt: new Date().toISOString() }
              : l
          )
        );
      };
      reader.readAsDataURL(file);
    });
  };

  const deleteAttachment = (lessonId: string, attId: string) => {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId
          ? { ...l, attachments: l.attachments.filter((a) => a.id !== attId), updatedAt: new Date().toISOString() }
          : l
      )
    );
  };

  if (!activeLesson) {
    return (
      <div className="p-8 text-zinc-500">No lessons loaded.</div>
    );
  }

  const progressPct = totals.total ? Math.round((totals.attended / totals.total) * 100) : 0;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
            <UserRound size={24} />
            {meta.title || "ISKCON Disciple Course"}
          </h2>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
            {meta.totalWeeks} weeks · {meta.classesPerWeek} classes/week · {meta.hoursPerClass}h per class
            {meta.teacher ? ` · Teacher: ${meta.teacher}` : ""}
            {meta.cohort ? ` · Cohort: ${meta.cohort}` : ""}
          </p>
        </div>
        <button
          onClick={() => setShowMetaEditor((v) => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900/60 rounded-lg transition-colors"
        >
          <Edit3 size={12} />
          {showMetaEditor ? "Close course details" : "Course details"}
        </button>
      </div>

      {showMetaEditor && (
        <div className="mb-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs text-zinc-500 dark:text-zinc-400">
            Teacher
            <input
              value={meta.teacher}
              onChange={(e) => setMeta({ ...meta, teacher: e.target.value })}
              className="input-field mt-1 text-sm"
            />
          </label>
          <label className="text-xs text-zinc-500 dark:text-zinc-400">
            Cohort / Batch
            <input
              value={meta.cohort}
              onChange={(e) => setMeta({ ...meta, cohort: e.target.value })}
              className="input-field mt-1 text-sm"
            />
          </label>
          <label className="text-xs text-zinc-500 dark:text-zinc-400">
            First-class date
            <input
              type="date"
              value={meta.startDate}
              onChange={(e) => setMeta({ ...meta, startDate: e.target.value })}
              className="input-field mt-1 text-sm"
            />
          </label>
          <label className="text-xs text-zinc-500 dark:text-zinc-400">
            Classes per week
            <input
              type="number"
              min={1}
              max={7}
              value={meta.classesPerWeek}
              onChange={(e) => setMeta({ ...meta, classesPerWeek: Number(e.target.value) })}
              className="input-field mt-1 text-sm"
            />
          </label>
          <label className="text-xs text-zinc-500 dark:text-zinc-400">
            Hours per class
            <input
              type="number"
              step={0.25}
              value={meta.hoursPerClass}
              onChange={(e) => setMeta({ ...meta, hoursPerClass: Number(e.target.value) })}
              className="input-field mt-1 text-sm"
            />
          </label>
          <label className="text-xs text-zinc-500 dark:text-zinc-400">
            Total weeks
            <input
              type="number"
              min={1}
              value={meta.totalWeeks}
              onChange={(e) => setMeta({ ...meta, totalWeeks: Number(e.target.value) })}
              className="input-field mt-1 text-sm"
            />
          </label>
          <label className="text-xs text-zinc-500 dark:text-zinc-400 sm:col-span-2">
            Course-wide notes
            <textarea
              value={meta.notes}
              onChange={(e) => setMeta({ ...meta, notes: e.target.value })}
              rows={3}
              className="input-field mt-1 text-sm"
            />
          </label>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Attended</p>
          <p className="text-xl font-bold text-amber-900 dark:text-amber-100">
            {totals.attended}
            <span className="text-sm text-zinc-500 dark:text-zinc-400"> / {totals.total}</span>
          </p>
          <div className="w-full bg-zinc-100 dark:bg-zinc-700 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div className="bg-amber-600 h-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Homework open</p>
          <p className="text-xl font-bold text-amber-900 dark:text-amber-100">{totals.hwOpen}</p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{totals.hwDone} done · {totals.hwTotal} total</p>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Current lesson</p>
          <p className="text-xl font-bold text-amber-900 dark:text-amber-100">
            L{activeLesson.lessonNumber}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{activeLesson.title}</p>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">First class</p>
          <p className="text-xl font-bold text-amber-900 dark:text-amber-100">
            {meta.startDate || "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
        {/* Sidebar: units + lessons */}
        <aside className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-2 h-fit md:sticky md:top-4">
          {unitGroups.map(({ unit, unitTitle, items }) => {
            const collapsed = collapsedUnits[unit] ?? false;
            return (
              <div key={unit} className="mb-1">
                <button
                  onClick={() => setCollapsedUnits((c) => ({ ...c, [unit]: !collapsed }))}
                  className="w-full flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-zinc-700/50 rounded"
                >
                  {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  <span className="truncate">{unitTitle}</span>
                </button>
                {!collapsed && (
                  <div className="pl-1">
                    {items.map((l) => {
                      const active = l.id === activeLesson.id;
                      const hwOpen = l.homework.filter((h) => !h.done).length;
                      return (
                        <button
                          key={l.id}
                          onClick={() => setActiveLessonId(l.id)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors ${
                            active
                              ? "bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 font-medium"
                              : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                          }`}
                        >
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold border ${
                              l.attended
                                ? "bg-emerald-500 border-emerald-600 text-white"
                                : "border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400"
                            }`}
                          >
                            {l.attended ? <Check size={10} /> : l.lessonNumber}
                          </span>
                          <span className="flex-1 truncate">{l.title}</span>
                          {hwOpen > 0 && (
                            <span className="text-[9px] bg-red-500 text-white rounded-full px-1.5 py-0.5">
                              {hwOpen}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </aside>

        {/* Lesson detail */}
        <section className="space-y-4">
          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {activeLesson.unitTitle}
                </p>
                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">
                  Lesson {activeLesson.lessonNumber}: {activeLesson.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditMode((v) => !v)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    editMode
                      ? "bg-amber-700 text-white hover:bg-amber-800"
                      : "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900/60"
                  }`}
                  title={editMode ? "Switch to read view" : "Switch to edit view"}
                >
                  {editMode ? (
                    <>
                      <Eye size={12} />
                      Done — view
                    </>
                  ) : (
                    <>
                      <PencilLine size={12} />
                      Edit lesson
                    </>
                  )}
                </button>
                <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeLesson.attended}
                  onChange={(e) => {
                    const attended = e.target.checked;
                    patchLesson(activeLesson.id, {
                      attended,
                      attendedDate: attended
                        ? activeLesson.attendedDate || new Date().toISOString().slice(0, 10)
                        : undefined,
                    });
                  }}
                  className="w-4 h-4 accent-amber-600"
                />
                Attended
              </label>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Scheduled date
                <input
                  type="date"
                  value={activeLesson.scheduledDate ?? ""}
                  onChange={(e) => patchLesson(activeLesson.id, { scheduledDate: e.target.value || undefined })}
                  className="input-field mt-1 text-sm normal-case"
                />
              </label>
              <label className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Attended date
                <input
                  type="date"
                  value={activeLesson.attendedDate ?? ""}
                  onChange={(e) => patchLesson(activeLesson.id, { attendedDate: e.target.value || undefined })}
                  className="input-field mt-1 text-sm normal-case"
                />
              </label>
            </div>
          </div>

          {/* Class notes */}
          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2 mb-2">
              <BookOpen size={16} />
              Class notes
            </h4>
            {editMode ? (
              <textarea
                value={activeLesson.notes}
                onChange={(e) => patchLesson(activeLesson.id, { notes: e.target.value })}
                rows={16}
                placeholder="Everything you learned in class — key points, verses cited, examples given. Markdown supported."
                className="input-field w-full text-sm font-mono leading-relaxed"
              />
            ) : (
              <Markdown muted>{activeLesson.notes}</Markdown>
            )}
          </div>

          {/* Teacher quotes */}
          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2 mb-2">
              <Sparkles size={16} />
              Teacher quotes / gems
            </h4>
            {editMode ? (
              <textarea
                value={activeLesson.teacherQuotes}
                onChange={(e) => patchLesson(activeLesson.id, { teacherQuotes: e.target.value })}
                rows={6}
                placeholder="Memorable quotes, stories, or personal instructions from the teacher… (blank line between each)"
                className="input-field w-full text-sm leading-relaxed"
              />
            ) : activeLesson.teacherQuotes.trim() ? (
              <div className="space-y-2">
                {activeLesson.teacherQuotes
                  .split(/\n{2,}/)
                  .map((q) => q.trim())
                  .filter(Boolean)
                  .map((q, i) => (
                    <blockquote
                      key={i}
                      className="border-l-4 border-amber-400 dark:border-amber-700 pl-3 py-1 italic text-zinc-700 dark:text-zinc-300 text-[15px] leading-relaxed whitespace-pre-wrap"
                    >
                      {q}
                    </blockquote>
                  ))}
              </div>
            ) : (
              <p className="text-sm italic text-zinc-400 dark:text-zinc-500">(nothing written yet)</p>
            )}
          </div>

          {/* Homework */}
          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                <ListChecks size={16} />
                Homework
                <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                  {activeLesson.homework.filter((h) => h.done).length}/{activeLesson.homework.length} done
                </span>
              </h4>
              {editMode && (
                <button
                  onClick={() => addHomework(activeLesson.id)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-amber-700 hover:bg-amber-800 text-white rounded-lg"
                >
                  <Plus size={12} />
                  Add
                </button>
              )}
            </div>
            {activeLesson.homework.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 py-4 text-center">No homework yet.</p>
            ) : (
              <ul className="space-y-2">
                {activeLesson.homework.map((h) => (
                  <li key={h.id} className="flex items-start gap-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg p-2">
                    <input
                      type="checkbox"
                      checked={h.done}
                      onChange={(e) => updateHomework(activeLesson.id, h.id, { done: e.target.checked })}
                      className="mt-1.5 w-4 h-4 accent-amber-600 shrink-0"
                    />
                    {editMode ? (
                      <textarea
                        value={h.text}
                        onChange={(e) => updateHomework(activeLesson.id, h.id, { text: e.target.value })}
                        placeholder="e.g. Read SB 1.1 and summarize the paramparā"
                        rows={Math.max(2, Math.ceil((h.text?.length || 0) / 80))}
                        className={`input-field flex-1 text-sm leading-relaxed resize-y min-h-[2.5rem] ${
                          h.done ? "line-through text-zinc-400" : ""
                        }`}
                      />
                    ) : (
                      <span
                        className={`flex-1 text-[15px] leading-relaxed break-words whitespace-pre-wrap pt-0.5 ${
                          h.done ? "line-through text-zinc-400 dark:text-zinc-500" : "text-zinc-800 dark:text-zinc-200"
                        }`}
                      >
                        {h.text || <span className="italic text-zinc-400">(untitled)</span>}
                      </span>
                    )}
                    {editMode ? (
                      <input
                        type="date"
                        value={h.dueDate ?? ""}
                        onChange={(e) => updateHomework(activeLesson.id, h.id, { dueDate: e.target.value || undefined })}
                        className="input-field text-xs w-36 shrink-0"
                      />
                    ) : (
                      h.dueDate && (
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap pt-1 shrink-0">
                          due {h.dueDate}
                        </span>
                      )
                    )}
                    {editMode && (
                      <button
                        onClick={() => deleteHomework(activeLesson.id, h.id)}
                        className="text-zinc-400 hover:text-red-600 mt-1.5 shrink-0"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Exercises */}
          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                <ClipboardCheck size={16} />
                Reflection exercises
              </h4>
              {editMode && (
                <button
                  onClick={() => addExercise(activeLesson.id)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-amber-700 hover:bg-amber-800 text-white rounded-lg"
                >
                  <Plus size={12} />
                  Add
                </button>
              )}
            </div>
            {activeLesson.exercises.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 py-4 text-center">No exercises yet.</p>
            ) : (
              <div className="space-y-3">
                {activeLesson.exercises.map((ex, i) => (
                  <div key={ex.id} className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 space-y-2">
                    {editMode ? (
                      <>
                        <div className="flex items-start gap-2">
                          <textarea
                            value={ex.prompt}
                            onChange={(e) => updateExercise(activeLesson.id, ex.id, { prompt: e.target.value })}
                            placeholder="Prompt (e.g. How does the paramparā apply in my life?)"
                            rows={Math.max(2, Math.ceil((ex.prompt?.length || 0) / 80))}
                            className="input-field flex-1 text-sm font-medium leading-relaxed resize-y min-h-[3rem]"
                          />
                          <button
                            onClick={() => deleteExercise(activeLesson.id, ex.id)}
                            className="text-zinc-400 hover:text-red-600 mt-1.5"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <textarea
                          value={ex.response}
                          onChange={(e) => updateExercise(activeLesson.id, ex.id, { response: e.target.value })}
                          rows={6}
                          placeholder="Your reflection…"
                          className="input-field w-full text-sm leading-relaxed"
                        />
                      </>
                    ) : (
                      <>
                        <p className="text-[15px] font-semibold text-amber-900 dark:text-amber-100 leading-relaxed">
                          <span className="text-zinc-400 dark:text-zinc-500 mr-2">Q{i + 1}.</span>
                          {ex.prompt || <span className="italic text-zinc-400">(no prompt)</span>}
                        </p>
                        <div className="pl-6">
                          <Markdown muted>{ex.response}</Markdown>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attachments */}
          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                <Paperclip size={16} />
                Attachments
                <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                  {activeLesson.attachments.length}
                </span>
              </h4>
              {editMode && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-amber-700 hover:bg-amber-800 text-white rounded-lg"
                >
                  <Upload size={12} />
                  Upload
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={(e) => {
                  handleAttachmentFiles(activeLesson.id, e.target.files);
                  if (e.target) e.target.value = "";
                }}
                className="hidden"
              />
            </div>
            {activeLesson.attachments.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 py-4 text-center">
                No attachments — upload photos of handouts, whiteboards, or diagrams the teacher shows.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {activeLesson.attachments.map((att) => {
                  const isImage =
                    att.dataUrl.startsWith("data:image/") ||
                    /\.(png|jpe?g|gif|webp|svg|bmp)(\?|$)/i.test(att.dataUrl);
                  return (
                    <div
                      key={att.id}
                      className="group relative bg-zinc-100 dark:bg-zinc-900 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700"
                    >
                      {isImage ? (
                        <button
                          onClick={() => setAttachmentPreview(att)}
                          className="block w-full aspect-square overflow-hidden"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={att.dataUrl}
                            alt={att.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </button>
                      ) : (
                        <a
                          href={att.dataUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex flex-col items-center justify-center aspect-square text-xs text-zinc-600 dark:text-zinc-300 p-2"
                        >
                          <ExternalLink size={20} className="mb-1" />
                          <span className="text-center truncate w-full">{att.name}</span>
                        </a>
                      )}
                      <div className="px-2 py-1 text-[11px] truncate bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-t border-zinc-200 dark:border-zinc-700">
                        {att.name}
                      </div>
                      {editMode && (
                        <button
                          onClick={() => deleteAttachment(activeLesson.id, att.id)}
                          className="absolute top-1 right-1 p-1 bg-white/80 dark:bg-zinc-900/80 hover:bg-red-600 hover:text-white text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {attachmentPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setAttachmentPreview(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attachmentPreview.dataUrl}
            alt={attachmentPreview.name}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setAttachmentPreview(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            aria-label="Close"
          >
            <X size={28} />
          </button>
        </div>
      )}
    </div>
  );
}
