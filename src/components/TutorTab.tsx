"use client";

import { TutorSession } from "@/lib/data";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, GraduationCap, Layers } from "lucide-react";
import { useState } from "react";

interface Props {
  sessions: TutorSession[];
  setSessions: (value: TutorSession[] | ((prev: TutorSession[]) => TutorSession[])) => void;
}

export function TutorTab({ sessions, setSessions }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addSession = () => {
    const newSession: TutorSession = {
      id: `tutor-${Date.now()}`,
      date: format(new Date(), "yyyy-MM-dd"),
      topic: "",
      duration: 60,
      notes: "",
      flashcardsReviewed: 0,
      flashcardsNew: 0,
    };
    setSessions((prev) => [newSession, ...prev]);
    setExpandedId(newSession.id);
  };

  const updateSession = (id: string, field: keyof TutorSession, value: unknown) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setExpandedId(null);
  };

  // Stats
  const totalSessions = sessions.length;
  const totalFlashcardsReviewed = sessions.reduce((sum, s) => sum + s.flashcardsReviewed, 0);
  const totalFlashcardsCreated = sessions.reduce((sum, s) => sum + s.flashcardsNew, 0);
  const totalHours = sessions.reduce((sum, s) => sum + s.duration, 0) / 60;

  // Weekly sessions this week
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekStartStr = format(weekStart, "yyyy-MM-dd");
  const sessionsThisWeek = sessions.filter((s) => s.date >= weekStartStr).length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">Tutor Sessions & Flashcards</h2>
        <button
          onClick={addSession}
          className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Log Session
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap size={18} className="text-amber-600" />
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">This Week</span>
          </div>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{sessionsThisWeek} / 3</p>
          <p className="text-xs text-zinc-500">{sessionsThisWeek >= 3 ? "✓ Target met!" : `${3 - sessionsThisWeek} more needed`}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-4">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Total Sessions</span>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{totalSessions}</p>
          <p className="text-xs text-zinc-500">{totalHours.toFixed(1)} hours total</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Layers size={18} className="text-blue-500" />
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Reviewed</span>
          </div>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{totalFlashcardsReviewed}</p>
          <p className="text-xs text-zinc-500">cards reviewed</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Layers size={18} className="text-green-500" />
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Created</span>
          </div>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{totalFlashcardsCreated}</p>
          <p className="text-xs text-zinc-500">cards created</p>
        </div>
      </div>

      {/* Sessions list */}
      <div className="space-y-2">
        {sessions.length === 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-8 text-center">
            <GraduationCap size={32} className="mx-auto text-amber-300 mb-3" />
            <p className="text-zinc-500">No tutor sessions logged yet.</p>
            <p className="text-xs text-zinc-400 mt-1">Log your sessions to track progress with your tutor (3x/week target).</p>
          </div>
        )}
        {sessions.map((session) => (
          <div
            key={session.id}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 overflow-hidden"
          >
            <button
              onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-amber-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <span className="font-medium text-amber-800 dark:text-amber-200">
                  {format(parseISO(session.date), "EEE, MMM d")}
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{session.topic || "Untitled session"}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span>{session.duration} min</span>
                {session.flashcardsReviewed > 0 && (
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-700 dark:text-blue-300">
                    {session.flashcardsReviewed} cards
                  </span>
                )}
              </div>
            </button>

            {expandedId === session.id && (
              <div className="border-t border-amber-100 dark:border-zinc-800 p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Date</label>
                    <input
                      type="date"
                      value={session.date}
                      onChange={(e) => updateSession(session.id, "date", e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Topic</label>
                    <input
                      type="text"
                      value={session.topic}
                      onChange={(e) => updateSession(session.id, "topic", e.target.value)}
                      className="input-field"
                      placeholder="Sanskrit pronunciation, BG Ch.4..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Duration (min)</label>
                    <input
                      type="number"
                      min="0"
                      value={session.duration}
                      onChange={(e) => updateSession(session.id, "duration", parseInt(e.target.value) || 0)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Flashcards Reviewed</label>
                    <input
                      type="number"
                      min="0"
                      value={session.flashcardsReviewed}
                      onChange={(e) => updateSession(session.id, "flashcardsReviewed", parseInt(e.target.value) || 0)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Cards Created</label>
                    <input
                      type="number"
                      min="0"
                      value={session.flashcardsNew}
                      onChange={(e) => updateSession(session.id, "flashcardsNew", parseInt(e.target.value) || 0)}
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Notes</label>
                  <textarea
                    value={session.notes}
                    onChange={(e) => updateSession(session.id, "notes", e.target.value)}
                    className="input-field min-h-[80px] resize-y"
                    placeholder="What you covered, homework, things to review..."
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
