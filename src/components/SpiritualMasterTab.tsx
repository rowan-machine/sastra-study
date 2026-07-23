"use client";

import {
  DevoteeContact,
  DiscipleLesson,
  JapaEntry,
  LectureNote,
  SavedAnswer,
  ScheduleDay,
  SevaEntry,
  SpiritualMaster,
} from "@/lib/data";
import { Crown } from "lucide-react";
import Image from "next/image";
import { LecturesSection } from "@/components/LecturesSection";
import { InitiationReadinessSection } from "@/components/InitiationReadinessSection";

interface Props {
  notes: LectureNote[];
  setNotes: (value: LectureNote[] | ((prev: LectureNote[]) => LectureNote[])) => void;
  contacts: DevoteeContact[];
  setContacts?: (value: DevoteeContact[] | ((prev: DevoteeContact[]) => DevoteeContact[])) => void;
  spiritualMaster: SpiritualMaster;
  setSpiritualMaster: (value: SpiritualMaster | ((prev: SpiritualMaster) => SpiritualMaster)) => void;
  japaLog: JapaEntry[];
  scheduleLog: ScheduleDay[];
  sevaLog: SevaEntry[];
  discipleLessons: DiscipleLesson[];
  savedAnswers: SavedAnswer[];
  setSavedAnswers: (value: SavedAnswer[] | ((prev: SavedAnswer[]) => SavedAnswer[])) => void;
}

export function SpiritualMasterTab({
  notes,
  setNotes,
  contacts,
  setContacts,
  spiritualMaster,
  setSpiritualMaster,
  japaLog,
  scheduleLog,
  sevaLog,
  discipleLessons,
  savedAnswers,
  setSavedAnswers,
}: Props) {
  const update = (field: keyof SpiritualMaster, value: unknown) => {
    setSpiritualMaster((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
          <Crown size={22} /> Spiritual Master
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          Lineage, lectures, instructions, and Initiation Readiness — all in one place.
        </p>
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 rounded-2xl border border-amber-300 dark:border-amber-800/50 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0 text-center">
            {spiritualMaster.photo ? (
              <Image
                src={spiritualMaster.photo}
                alt={spiritualMaster.name}
                width={128}
                height={160}
                className="w-32 h-40 object-cover rounded-xl border-2 border-amber-300 dark:border-amber-700 shadow-md mx-auto"
              />
            ) : (
              <div className="w-32 h-40 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-400 mx-auto">
                <Crown size={48} />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-4 min-w-0">
            <div>
              <label className="block text-xs text-amber-700 dark:text-amber-400 mb-0.5">Name</label>
              <input
                type="text"
                value={spiritualMaster.name}
                onChange={(e) => update("name", e.target.value)}
                className="input-field w-full bg-white/70 dark:bg-zinc-900/70"
                placeholder="Spiritual Master's name"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-amber-700 dark:text-amber-400 mb-0.5">Initiation Status</label>
                <select
                  value={spiritualMaster.initiated ? "initiated" : "not-initiated"}
                  onChange={(e) => update("initiated", e.target.value === "initiated")}
                  className="input-field w-full bg-white/70 dark:bg-zinc-900/70"
                >
                  <option value="initiated">Initiated</option>
                  <option value="not-initiated">Not yet initiated</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-amber-700 dark:text-amber-400 mb-0.5">Initiation Date</label>
                <input
                  type="date"
                  value={spiritualMaster.initiationDate}
                  onChange={(e) => update("initiationDate", e.target.value)}
                  className="input-field w-full bg-white/70 dark:bg-zinc-900/70"
                />
              </div>
              <div>
                <label className="block text-xs text-amber-700 dark:text-amber-400 mb-0.5">Initiation Name</label>
                <input
                  type="text"
                  value={spiritualMaster.initiationName}
                  onChange={(e) => update("initiationName", e.target.value)}
                  className="input-field w-full bg-white/70 dark:bg-zinc-900/70"
                  placeholder="e.g. Mahāprabhu dāsa"
                />
              </div>
              <div>
                <label className="block text-xs text-amber-700 dark:text-amber-400 mb-0.5">Temple / Center</label>
                <input
                  type="text"
                  value={spiritualMaster.temple}
                  onChange={(e) => update("temple", e.target.value)}
                  className="input-field w-full bg-white/70 dark:bg-zinc-900/70"
                  placeholder="e.g. ISKCON Detroit"
                />
              </div>
              <div>
                <label className="block text-xs text-amber-700 dark:text-amber-400 mb-0.5">Email</label>
                <input
                  type="text"
                  value={spiritualMaster.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="input-field w-full bg-white/70 dark:bg-zinc-900/70"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-xs text-amber-700 dark:text-amber-400 mb-0.5">Phone</label>
                <input
                  type="text"
                  value={spiritualMaster.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className="input-field w-full bg-white/70 dark:bg-zinc-900/70"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <InitiationReadinessSection
              spiritualMaster={spiritualMaster}
              setSpiritualMaster={setSpiritualMaster}
              japaLog={japaLog}
              scheduleLog={scheduleLog}
              sevaLog={sevaLog}
              discipleLessons={discipleLessons}
              savedAnswers={savedAnswers}
              setSavedAnswers={setSavedAnswers}
            />

            <div>
              <label className="block text-xs text-amber-700 dark:text-amber-400 mb-0.5">Lectures by {spiritualMaster.name || "Spiritual Master"}</label>
              <LecturesSection
                notes={notes}
                setNotes={setNotes}
                contacts={contacts}
                setContacts={setContacts}
                spiritualMaster={spiritualMaster}
                restrictSpeaker={{ role: "spiritual-master" }}
                embedded
              />
            </div>

            <div>
              <label className="block text-xs text-amber-700 dark:text-amber-400 mb-0.5">Instructions / Guidance Received</label>
              <textarea
                value={spiritualMaster.instructions}
                onChange={(e) => update("instructions", e.target.value)}
                className="input-field w-full min-h-[160px] bg-white/70 dark:bg-zinc-900/70"
                placeholder="Record the instructions, guidance, and blessings received from your spiritual master..."
              />
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Press Enter to separate each instruction — each line shows as its own pill on the Dashboard.</p>
              {(() => {
                const lines = (spiritualMaster.instructions || "").split("\n").map((l) => l.trim()).filter(Boolean);
                if (lines.length === 0) return null;
                return (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {lines.map((line, i) => (
                      <span key={i} className="inline-block text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700/50 leading-tight">
                        {line}
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div>
              <label className="block text-xs text-amber-700 dark:text-amber-400 mb-0.5">Notes</label>
              <textarea
                value={spiritualMaster.notes}
                onChange={(e) => update("notes", e.target.value)}
                className="input-field w-full min-h-[80px] bg-white/70 dark:bg-zinc-900/70"
                placeholder="Other relevant details, service, relationship history..."
              />
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Press Enter to separate each note — each line shows as its own pill on the Dashboard.</p>
              {(() => {
                const lines = (spiritualMaster.notes || "").split("\n").map((l) => l.trim()).filter(Boolean);
                if (lines.length === 0) return null;
                return (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {lines.map((line, i) => (
                      <span key={i} className="inline-block text-xs px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 leading-tight">
                        {line}
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
