"use client";

import { DevoteeContact, SanskritTerm, QuestionEntry, LectureNote } from "@/lib/data";
import { iastToDevanagari } from "@/lib/transliteration";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { Plus, Trash2, Users, BookText, HelpCircle, Search, ChevronDown, ChevronRight } from "lucide-react";
import { LecturesSection } from "@/components/LecturesSection";

interface Props {
  contacts: DevoteeContact[];
  setContacts: (value: DevoteeContact[] | ((prev: DevoteeContact[]) => DevoteeContact[])) => void;
  vocabulary: SanskritTerm[];
  setVocabulary: (value: SanskritTerm[] | ((prev: SanskritTerm[]) => SanskritTerm[])) => void;
  questions: QuestionEntry[];
  setQuestions: (value: QuestionEntry[] | ((prev: QuestionEntry[]) => QuestionEntry[])) => void;
  lectureNotes?: LectureNote[];
  setLectureNotes?: (value: LectureNote[] | ((prev: LectureNote[]) => LectureNote[])) => void;
}

type SubTab = "contacts" | "vocabulary" | "questions";

export function SanghaTab({ contacts, setContacts, vocabulary, setVocabulary, questions, setQuestions, lectureNotes = [], setLectureNotes }: Props) {
  const [subTab, setSubTab] = useState<SubTab>("contacts");
  const [search, setSearch] = useState("");

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-4">Saṅgha & Reference</h2>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-6 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg w-fit">
        {[
          { id: "contacts" as SubTab, label: "Devotee Directory", icon: Users },
          { id: "vocabulary" as SubTab, label: "Sanskrit Terms", icon: BookText },
          { id: "questions" as SubTab, label: "Questions", icon: HelpCircle },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              subTab === id ? "bg-white dark:bg-zinc-900 text-amber-800 dark:text-amber-200 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${subTab}...`}
          className="input-field !pl-10"
        />
      </div>

      {/* Devotee Directory */}
      {subTab === "contacts" && (
        <ContactsSection contacts={contacts} setContacts={setContacts} search={search} lectureNotes={lectureNotes} setLectureNotes={setLectureNotes} />
      )}

      {/* Sanskrit Vocabulary */}
      {subTab === "vocabulary" && (
        <VocabularySection vocabulary={vocabulary} setVocabulary={setVocabulary} search={search} />
      )}

      {/* Questions Log */}
      {subTab === "questions" && (
        <>
          <div className="mb-3 p-3 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-900 dark:text-amber-200">
            The Questions Log has moved to <strong>Reference → Prabhupāda Library → Questions Log</strong>, where you can pair each question with a Śrīla Prabhupāda source from the local corpus. This view still works, but new features (Ask Cascade, Save answer) live over there.
          </div>
          <QuestionsSection questions={questions} setQuestions={setQuestions} search={search} />
        </>
      )}
    </div>
  );
}

// === CONTACTS SECTION ===
function ContactsSection({ contacts, setContacts, search, lectureNotes, setLectureNotes }: { contacts: DevoteeContact[]; setContacts: Props["setContacts"]; search: string; lectureNotes?: LectureNote[]; setLectureNotes?: Props["setLectureNotes"] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const allTags = useMemo(() => [...new Set(contacts.flatMap((c) => c.expertise))].sort(), [contacts]);

  const addContact = () => {
    const newContact: DevoteeContact = {
      id: `dev-${Date.now()}`,
      name: "",
      role: "",
      phone: "",
      email: "",
      expertise: [],
      instructions: "",
      notes: "",
    };
    setContacts((prev) => [newContact, ...prev]);
    setExpandedId(newContact.id);
  };

  const updateContact = (id: string, field: keyof DevoteeContact, value: unknown) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const deleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setExpandedId(null);
  };

  const filtered = contacts.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.role.toLowerCase().includes(search.toLowerCase()) ||
    c.expertise.some((ex: string) => ex.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-zinc-500">{contacts.length} devotees</p>
        <button onClick={addContact} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={14} /> Add Devotee
        </button>
      </div>

      <div className="space-y-2">
        {filtered.map((contact) => {
          const isExpanded = expandedId === contact.id;
          return (
            <div key={contact.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : contact.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                {isExpanded ? <ChevronDown size={14} className="text-zinc-400" /> : <ChevronRight size={14} className="text-zinc-400" />}
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{contact.name || "New Contact"}</span>
                  {contact.role && <span className="ml-2 text-xs text-zinc-500">— {contact.role}</span>}
                </div>
                {contact.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-end max-w-[50%]">
                    {contact.expertise.map((ex: string, idx: number) => (
                      <span key={idx} className="px-1.5 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">{ex}</span>
                    ))}
                  </div>
                )}
              </button>

              {isExpanded && (
                <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-0.5">Name</label>
                      <input type="text" value={contact.name} onChange={(e) => updateContact(contact.id, "name", e.target.value)} className="input-field" placeholder="e.g. Mādhava Prabhu" />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-0.5">Role / Title</label>
                      <input type="text" value={contact.role} onChange={(e) => updateContact(contact.id, "role", e.target.value)} className="input-field" placeholder="e.g. Temple President, Siksha Guru" />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-0.5">Phone</label>
                      <input type="text" value={contact.phone} onChange={(e) => updateContact(contact.id, "phone", e.target.value)} className="input-field" placeholder="(555) 123-4567" />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-0.5">Email</label>
                      <input type="text" value={contact.email} onChange={(e) => updateContact(contact.id, "email", e.target.value)} className="input-field" placeholder="email@example.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-0.5">About / Notes (free-form)</label>
                    <textarea
                      value={contact.notes}
                      onChange={(e) => {
                        updateContact(contact.id, "notes", e.target.value);
                        // Auto-extract tags from notes using #hashtags
                        const hashTags = e.target.value.match(/#[\w\-āīūṛḍṅñśṣṭḥ]+/gi) || [];
                        const extracted = hashTags.map((t) => t.slice(1).replace(/-/g, " "));
                        if (extracted.length > 0) {
                          const merged = [...new Set([...contact.expertise.filter((ex: string) => !ex.startsWith("•")), ...extracted])];
                          updateContact(contact.id, "expertise", merged);
                        }
                      }}
                      className="input-field min-h-[100px]"
                      placeholder={"Write freely about this devotee...\nUse #tags to auto-add topics (e.g. #Sanskrit #DeityWorship #SB-Canto-1)\n\nExample: Met at Sunday feast. Very knowledgeable about #Jyotish and #TempleManagement. Gave me advice on #Morning-Sadhana practice."}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Topics / Expertise</label>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {contact.expertise.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full cursor-pointer hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                          onClick={() => updateContact(contact.id, "expertise", contact.expertise.filter((_: string, i: number) => i !== idx))}
                          title="Click to remove"
                        >
                          {tag} ×
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        className="input-field text-sm flex-1"
                        placeholder="Add tag manually + Enter"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                            e.preventDefault();
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (!contact.expertise.includes(val)) {
                              updateContact(contact.id, "expertise", [...contact.expertise, val]);
                            }
                            (e.target as HTMLInputElement).value = "";
                          }
                        }}
                      />
                    </div>
                    {allTags.filter((tag) => !contact.expertise.includes(tag)).length > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] text-zinc-500 mb-1">Reuse common tags</p>
                        <div className="flex flex-wrap gap-1">
                          {allTags
                            .filter((tag) => !contact.expertise.includes(tag))
                            .map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => updateContact(contact.id, "expertise", [...contact.expertise, tag])}
                                className="text-xs px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-900/20 dark:hover:text-amber-300 transition-colors"
                              >
                                + {tag}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-0.5">Lectures by this Devotee</label>
                    {setLectureNotes ? (
                      <LecturesSection
                        notes={lectureNotes || []}
                        setNotes={setLectureNotes}
                        contacts={contacts}
                        setContacts={setContacts}
                        restrictSpeaker={{ role: "devotee", contactId: contact.id }}
                        embedded
                      />
                    ) : (
                      <p className="text-sm text-zinc-500 py-2">Lecture notes not available.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-500 mb-0.5">Instructions / Guidance Received</label>
                    <textarea
                      value={contact.instructions}
                      onChange={(e) => updateContact(contact.id, "instructions", e.target.value)}
                      className="input-field min-h-[80px]"
                      placeholder={"One instruction per line\ne.g. 'Read one chapter of SB daily'\n'Always chant your rounds before 10am'"}
                    />
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Press Enter to separate each instruction — each line shows as its own pill in the Notes tab.</p>
                    {(() => {
                      const lines = (contact.instructions || "").split("\n").map((l) => l.trim()).filter(Boolean);
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
                  <button onClick={() => deleteContact(contact.id)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors">
                    <Trash2 size={12} /> Remove
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

// === VOCABULARY SECTION ===
function VocabularySection({ vocabulary, setVocabulary, search }: { vocabulary: SanskritTerm[]; setVocabulary: Props["setVocabulary"]; search: string }) {
  const [editingTermId, setEditingTermId] = useState<string | null>(null);

  const addTerm = () => {
    const newTerm: SanskritTerm = {
      id: `term-${Date.now()}`,
      term: "",
      transliteration: "",
      meaning: "",
      context: "",
      dateAdded: format(new Date(), "yyyy-MM-dd"),
    };
    setVocabulary((prev) => [newTerm, ...prev]);
    setEditingTermId(newTerm.id);
  };

  const updateTerm = (id: string, field: keyof SanskritTerm, value: string) => {
    setVocabulary((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const deleteTerm = (id: string) => {
    setVocabulary((prev) => prev.filter((t) => t.id !== id));
  };

  const filtered = vocabulary.filter((t) =>
    !search || t.term.toLowerCase().includes(search.toLowerCase()) ||
    t.meaning.toLowerCase().includes(search.toLowerCase()) ||
    t.transliteration.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-zinc-500">{vocabulary.length} terms</p>
        <button onClick={addTerm} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={14} /> Add Term
        </button>
      </div>

      <div className="grid gap-3">
        {filtered.map((term) => {
          const isEditing = editingTermId === term.id;
          return (
            <div key={term.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-zinc-400">Sanskrit / Devanagari</label>
                  <div className="flex gap-2">
                    {term.term && term.term.match(/[\u0900-\u097F]/) && (
                      <>
                        <span className="text-xs text-amber-600 dark:text-amber-400">Auto-converted</span>
                        <button
                          onClick={() => updateTerm(term.id, "term", iastToDevanagari(term.transliteration || ""))}
                          className="text-xs text-amber-700 dark:text-amber-300 hover:underline"
                        >
                          Re-convert
                        </button>
                      </>
                    )}
                    <button
                      id={`term-done-${term.id}`}
                      onClick={() => setEditingTermId(isEditing ? null : term.id)}
                      className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline"
                    >
                      {isEditing ? "Done" : "Edit"}
                    </button>
                  </div>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={term.term}
                    onChange={(e) => updateTerm(term.id, "term", e.target.value)}
                    className="input-field text-2xl font-bold tracking-wide py-2"
                    placeholder="Sanskrit term"
                    autoFocus
                    onBlur={(e) => {
                      const next = e.relatedTarget as HTMLElement | null;
                      if (next?.id !== `term-done-${term.id}`) {
                        setEditingTermId(null);
                      }
                    }}
                  />
                ) : (
                  <div className="min-h-[3rem] flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-amber-50/30 dark:bg-amber-950/20 px-3 py-2">
                    <span className="text-4xl font-bold text-amber-900 dark:text-amber-100 tracking-wide leading-tight">
                      {term.term || <span className="text-zinc-400 text-2xl font-normal italic">Enter transliteration to auto-generate</span>}
                    </span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-zinc-400 mb-0.5">Transliteration (IAST)</label>
                  <input
                    type="text"
                    value={term.transliteration}
                    onChange={(e) => {
                      const t = e.target.value;
                      updateTerm(term.id, "transliteration", t);
                      const dev = iastToDevanagari(t);
                      if (dev) updateTerm(term.id, "term", dev);
                    }}
                    onBlur={(e) => {
                      const t = e.target.value;
                      if (t) {
                        const dev = iastToDevanagari(t);
                        if (dev) updateTerm(term.id, "term", dev);
                      }
                    }}
                    className="input-field text-base italic"
                    placeholder="e.g. bhakti"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-0.5">Meaning</label>
                  <input
                    type="text"
                    value={term.meaning}
                    onChange={(e) => updateTerm(term.id, "meaning", e.target.value)}
                    className="input-field text-base"
                    placeholder="Meaning"
                  />
                </div>
                <div className="flex gap-1">
                  <div className="flex-1">
                    <label className="block text-xs text-zinc-400 mb-0.5">Source</label>
                    <input
                      type="text"
                      value={term.context}
                      onChange={(e) => updateTerm(term.id, "context", e.target.value)}
                      className="input-field text-sm w-full"
                      placeholder="e.g. BG 2.13"
                    />
                  </div>
                  <button onClick={() => deleteTerm(term.id)} className="text-red-400 hover:text-red-600 transition-colors px-1 mt-5">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// === QUESTIONS SECTION ===
function QuestionsSection({ questions, setQuestions, search }: { questions: QuestionEntry[]; setQuestions: Props["setQuestions"]; search: string }) {
  const addQuestion = () => {
    const newQ: QuestionEntry = {
      id: `q-${Date.now()}`,
      question: "",
      context: "",
      dateAsked: format(new Date(), "yyyy-MM-dd"),
      status: "open",
      potentialResponses: "",
      answer: "",
      source: "",
      actionsToTake: "",
    };
    setQuestions((prev) => [newQ, ...prev]);
  };

  const updateQuestion = (id: string, field: keyof QuestionEntry, value: string) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  };

  const deleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const filtered = questions.filter((q) =>
    !search || q.question.toLowerCase().includes(search.toLowerCase()) ||
    q.context.toLowerCase().includes(search.toLowerCase()) ||
    q.potentialResponses.toLowerCase().includes(search.toLowerCase()) ||
    q.answer.toLowerCase().includes(search.toLowerCase()) ||
    q.source.toLowerCase().includes(search.toLowerCase()) ||
    q.actionsToTake.toLowerCase().includes(search.toLowerCase())
  );

  const openCount = questions.filter((q) => q.status === "open").length;
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-zinc-500">{questions.length} questions ({openCount} open)</p>
        <button onClick={addQuestion} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={14} /> Add Question
        </button>
      </div>

      <div className="space-y-3">
        {filtered.map((q) => {
          const isEditing = editingId === q.id;
          const Field = ({
            label,
            value,
            color,
            onChange,
            placeholder,
          }: {
            label: string;
            value: string;
            color: string;
            onChange?: (v: string) => void;
            placeholder?: string;
          }) => {
            const hasValue = value.trim().length > 0;
            return (
              <div className="pt-2 border-t border-amber-100 dark:border-zinc-800 first:border-0 first:pt-0">
                <label className={`block text-[11px] font-semibold ${color} uppercase tracking-wide mb-1`}>
                  {label}
                </label>
                {isEditing && onChange ? (
                  <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="input-field text-sm min-h-[80px] w-full"
                    placeholder={placeholder || label}
                  />
                ) : (
                  <div className={`text-sm ${hasValue ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 italic"} whitespace-pre-wrap leading-relaxed`}>
                    {hasValue ? value : placeholder || "—"}
                  </div>
                )}
              </div>
            );
          };

          return (
            <div key={q.id} className={`bg-white dark:bg-zinc-900 rounded-xl border p-4 ${
              q.status === "resolved" ? "border-green-200 dark:border-green-800/50" : "border-amber-200 dark:border-amber-800/50"
            }`}>
              <div className="flex items-start gap-3">
                <button
                  onClick={() => updateQuestion(q.id, "status", q.status === "open" ? "resolved" : "open")}
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    q.status === "resolved" ? "bg-green-500 border-green-500 text-white" : "border-amber-400 hover:border-amber-600"
                  }`}
                  title={q.status === "resolved" ? "Re-open question" : "Mark resolved"}
                >
                  {q.status === "resolved" && <span className="text-xs">✓</span>}
                </button>

                <div className="flex-1 space-y-3 min-w-0">
                  {isEditing ? (
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => updateQuestion(q.id, "question", e.target.value)}
                      className="input-field font-medium w-full"
                      placeholder="What is your question?"
                    />
                  ) : (
                    <h3 className={`font-medium text-zinc-900 dark:text-zinc-100 ${q.status === "resolved" ? "line-through text-zinc-400" : ""}`}>
                      {q.question || "Untitled question"}
                    </h3>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={q.context}
                          onChange={(e) => updateQuestion(q.id, "context", e.target.value)}
                          className="input-field text-sm"
                          placeholder="Context (e.g. BG 3.37 purport)"
                        />
                        <input
                          type="text"
                          value={q.source}
                          onChange={(e) => updateQuestion(q.id, "source", e.target.value)}
                          className="input-field text-sm"
                          placeholder="Who to ask / where to research"
                        />
                      </>
                    ) : (
                      <>
                        <div className="text-xs text-zinc-500">
                          <span className="font-semibold text-zinc-600 dark:text-zinc-400">Context:</span>{" "}
                          {q.context || <span className="italic">None</span>}
                        </div>
                        <div className="text-xs text-zinc-500">
                          <span className="font-semibold text-zinc-600 dark:text-zinc-400">Source:</span>{" "}
                          {q.source || <span className="italic">Unassigned</span>}
                        </div>
                      </>
                    )}
                  </div>

                  <Field
                    label="My provisional response / reflection"
                    value={q.potentialResponses}
                    color="text-amber-700 dark:text-amber-300"
                    placeholder="My own understanding before asking guru or senior devotee..."
                    onChange={isEditing ? (v) => updateQuestion(q.id, "potentialResponses", v) : undefined}
                  />
                  <Field
                    label="Received instruction / answer"
                    value={q.answer}
                    color="text-indigo-700 dark:text-indigo-300"
                    placeholder="Response from guru, senior devotee, or śāstra..."
                    onChange={isEditing ? (v) => updateQuestion(q.id, "answer", v) : undefined}
                  />
                  <Field
                    label="Actions to take"
                    value={q.actionsToTake}
                    color="text-emerald-700 dark:text-emerald-300"
                    placeholder="Practical commitments, practices, or changes after receiving instruction..."
                    onChange={isEditing ? (v) => updateQuestion(q.id, "actionsToTake", v) : undefined}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setEditingId(isEditing ? null : q.id)}
                    className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 transition-colors text-xs font-medium"
                  >
                    {isEditing ? "Done" : "Edit"}
                  </button>
                  <button onClick={() => deleteQuestion(q.id)} className="text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
