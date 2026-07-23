"use client";

import { DevoteeContact, JournalEntry, LectureNote, SpiritualMaster } from "@/lib/data";
import { Plus, Search, Trash2, BookOpen, Users, NotebookPen } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { LecturesSection } from "@/components/LecturesSection";
import { LecturesView } from "@/components/LecturesView";

interface Props {
  notes: LectureNote[];
  setNotes: (value: LectureNote[] | ((prev: LectureNote[]) => LectureNote[])) => void;
  contacts?: DevoteeContact[];
  setContacts?: (value: DevoteeContact[] | ((prev: DevoteeContact[]) => DevoteeContact[])) => void;
  spiritualMaster?: SpiritualMaster;
  journalEntries?: JournalEntry[];
  setJournalEntries?: (value: JournalEntry[] | ((prev: JournalEntry[]) => JournalEntry[])) => void;
}

export function NotesTab({
  notes,
  setNotes,
  contacts = [],
  setContacts,
  spiritualMaster,
  journalEntries = [],
  setJournalEntries,
}: Props) {
  const [search, setSearch] = useState("");
  const [subTab, setSubTab] = useState<"lecture" | "lecture-library" | "instructions" | "journal">("lecture");

  const filteredInstructions = contacts
    .flatMap((c) =>
      (c.instructions || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((instruction) => ({ ...c, instruction }))
    )
    .filter((item) => {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.role.toLowerCase().includes(q) ||
        item.instruction.toLowerCase().includes(q)
      );
    });

  const filteredJournal = journalEntries.filter((e) => {
    const q = search.toLowerCase();
    return (
      (e.title || "").toLowerCase().includes(q) ||
      e.content.toLowerCase().includes(q) ||
      e.date.toLowerCase().includes(q)
    );
  });

  const addJournalEntry = () => {
    if (!setJournalEntries) return;
    const newEntry: JournalEntry = {
      id: `journal-${Date.now()}`,
      date: format(new Date(), "yyyy-MM-dd"),
      title: "",
      content: "",
    };
    setJournalEntries((prev) => [newEntry, ...prev]);
  };

  const updateJournalEntry = (id: string, field: keyof JournalEntry, value: unknown) => {
    if (!setJournalEntries) return;
    setJournalEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const deleteJournalEntry = (id: string) => {
    if (!setJournalEntries) return;
    setJournalEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">Notes</h2>
        {subTab === "journal" && (
          <button
            onClick={addJournalEntry}
            className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> New Entry
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSubTab("lecture")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            subTab === "lecture"
              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <BookOpen size={16} /> Lecture & Class Notes
        </button>
        <button
          onClick={() => setSubTab("lecture-library")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            subTab === "lecture-library"
              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <BookOpen size={16} /> Lecture Library
        </button>
        <button
          onClick={() => setSubTab("instructions")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            subTab === "instructions"
              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Users size={16} /> Instructions from Devotees
        </button>
        <button
          onClick={() => setSubTab("journal")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            subTab === "journal"
              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <NotebookPen size={16} /> Journal
        </button>
      </div>

      {subTab !== "lecture" && subTab !== "lecture-library" && (
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              subTab === "instructions"
                ? "Search by devotee name, role, or instruction..."
                : subTab === "journal"
                ? "Search journal entries..."
                : "Search instructions from your spiritual master..."
            }
            className="input-field w-full !pl-10"
          />
        </div>
      )}

      {subTab === "lecture" && (
        <LecturesSection
          notes={notes}
          setNotes={setNotes}
          contacts={contacts}
          setContacts={setContacts}
          spiritualMaster={spiritualMaster}
        />
      )}

      {subTab === "lecture-library" && (
        <LecturesView
          notes={notes}
          contacts={contacts}
          spiritualMaster={spiritualMaster}
        />
      )}

      {subTab === "instructions" && (
        <div className="space-y-3">
          {filteredInstructions.length === 0 && (
            <p className="text-sm text-zinc-500 text-center py-8">
              {search
                ? "No instructions match your search."
                : "No instructions recorded yet. Add them in the Saṅgha & Ref directory, one per line."}
            </p>
          )}
          {(() => {
            const grouped = new Map<string, typeof filteredInstructions>();
            filteredInstructions.forEach((item) => {
              if (!grouped.has(item.id)) grouped.set(item.id, []);
              grouped.get(item.id)!.push(item);
            });
            return Array.from(grouped.entries()).map(([id, items]) => {
              const contact = items[0];
              return (
                <div key={id} className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-4">
                  <div className="mb-2">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{contact.name || "Unnamed Devotee"}</h3>
                    <p className="text-xs text-zinc-500">
                      {contact.role}
                      {contact.email ? ` · ${contact.email}` : ""}
                      {contact.phone ? ` · ${contact.phone}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((item, idx) => (
                      <span key={idx} className="inline-block text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700/50 leading-tight">
                        {item.instruction}
                      </span>
                    ))}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}

      {subTab === "journal" && (
        <div className="space-y-3">
          {filteredJournal.length === 0 && (
            <p className="text-sm text-zinc-500 text-center py-8">
              {search ? "No journal entries match your search." : "No journal entries yet. Click New Entry to start writing."}
            </p>
          )}
          {filteredJournal.map((entry) => (
            <div
              key={entry.id}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-4 space-y-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={entry.title}
                    onChange={(e) => updateJournalEntry(entry.id, "title", e.target.value)}
                    className="input-field w-full"
                    placeholder="Optional title"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={entry.date}
                    onChange={(e) => updateJournalEntry(entry.id, "date", e.target.value)}
                    className="input-field w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Reflection / Journal</label>
                <textarea
                  value={entry.content}
                  onChange={(e) => updateJournalEntry(entry.id, "content", e.target.value)}
                  className="input-field min-h-[120px] resize-y w-full"
                  placeholder="Free-form reflection, journaling, or realizations..."
                />
              </div>
              {setJournalEntries && (
                <button
                  onClick={() => deleteJournalEntry(entry.id)}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 size={12} /> Delete entry
                </button>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
