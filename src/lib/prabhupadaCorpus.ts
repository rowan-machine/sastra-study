/**
 * Loader + related-source matcher for the local Prabhupāda corpus scraped
 * into public/prabhupada/**. All entries are static assets — this module
 * fetches manifests on demand, caches them in-memory, and lazily hydrates
 * per-entry JSON files when a specific transcript is opened.
 */

import type {
  LectureNote,
  PrabhupadaCorpusManifest,
  PrabhupadaEntry,
  PrabhupadaEntryType,
  PrabhupadaManifestEntry,
} from "@/lib/data";

// ---------- caches ----------
let corpusManifestCache: PrabhupadaCorpusManifest | null = null;
let seedCache: PrabhupadaEntry[] | null = null;
const entryCache = new Map<string, PrabhupadaEntry>();

const SECTION_FILES: Record<PrabhupadaEntryType, string> = {
  qa: "/prabhupada/qa.json",
  lecture: "/prabhupada/lectures.json",
  "morning-walk": "/prabhupada/morning-walks.json",
};

interface SeedFile {
  entries: PrabhupadaEntry[];
  note?: string;
}

/**
 * Load the curated seed corpus that ships with the app (public/prabhupada/seed.json).
 * These entries contain full text inline and are merged into every list/search.
 */
export async function loadSeed(): Promise<PrabhupadaEntry[]> {
  if (seedCache) return seedCache;
  const seed = await fetchJson<SeedFile>("/prabhupada/seed.json");
  const entries = seed?.entries || [];
  for (const e of entries) entryCache.set(e.id, e);
  seedCache = entries;
  return entries;
}

function searchQueryFrom(text: string, maxWords: number): string {
  const firstSentence = text.split(/[.!?](?:\s+|$)/, 1)[0];
  const words = firstSentence
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, maxWords)
    .join(" ");
  return words || text.replace(/\s+/g, " ").trim().split(" ").slice(0, maxWords).join(" ");
}

/**
 * Build a URL that scrolls directly to the quote on the destination page.
 * Uses the Scroll-to-Text Fragment syntax (`#:~:text=...`) supported by
 * Chromium/Edge/Safari/Firefox. Falls back to the base URL if the quote is empty.
 *
 * vedabase.cc redirects to vedabase.io but the path/slug is preserved, so we
 * just swap the domain and keep the direct page link.
 */
export function sourceUrlWithFragment(baseUrl: string, text: string, maxWords = 10): string {
  if (!baseUrl) return text ? `https://vedabase.io/en/search/?query=${encodeURIComponent(searchQueryFrom(text, maxWords))}` : "";
  const directBase = baseUrl.replace(/vedabase\.cc/, "vedabase.io");
  if (!text) return directBase;
  const words = searchQueryFrom(text, maxWords);
  if (!words) return directBase;
  return `${directBase}#:~:text=${encodeURIComponent(words)}`;
}

function entryToManifest(e: PrabhupadaEntry): PrabhupadaManifestEntry {
  return {
    id: e.id,
    type: e.type,
    title: e.title,
    date: e.date,
    location: e.location,
    tags: e.tags || [],
    file: `prabhupada/_seed/${e.id}`,
    sourceUrl: e.sourceUrl,
  };
}

// ---------- fetch helpers ----------
async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    // Use no-store so generated manifests are always current during development.
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function loadCorpusManifest(): Promise<PrabhupadaCorpusManifest | null> {
  if (corpusManifestCache) return corpusManifestCache;
  const m = await fetchJson<PrabhupadaCorpusManifest>("/prabhupada/manifest.json");
  if (m) corpusManifestCache = m;
  return m;
}

export async function loadSection(type: PrabhupadaEntryType): Promise<PrabhupadaManifestEntry[]> {
  return (await fetchJson<PrabhupadaManifestEntry[]>(SECTION_FILES[type])) || [];
}

export async function loadAllSections(): Promise<PrabhupadaManifestEntry[]> {
  const [qa, lectures, walks, seed] = await Promise.all([
    loadSection("qa"),
    loadSection("lecture"),
    loadSection("morning-walk"),
    loadSeed(),
  ]);
  const scraped = [...qa, ...lectures, ...walks];
  const scrapedIds = new Set(scraped.map((e) => e.id));
  const seedRows = seed
    .filter((e) => !scrapedIds.has(e.id))
    .map(entryToManifest);
  return [...seedRows, ...scraped];
}

/**
 * Load the full text for a single entry from its per-file JSON.
 * `file` is the relative path stored on the manifest row (e.g.
 * "prabhupada/qa/some-slug.json"). Cached after first load.
 */
export async function loadEntry(entry: PrabhupadaManifestEntry): Promise<PrabhupadaEntry | null> {
  if (entryCache.has(entry.id)) return entryCache.get(entry.id)!;
  // Seed rows carry a virtual "prabhupada/_seed/…" path; ensure the seed is loaded then read from cache.
  if (entry.file.startsWith("prabhupada/_seed/")) {
    await loadSeed();
    return entryCache.get(entry.id) || null;
  }
  const url = entry.file.startsWith("/") ? entry.file : `/${entry.file}`;
  const full = await fetchJson<PrabhupadaEntry>(url);
  if (full) entryCache.set(entry.id, full);
  return full;
}

/**
 * Return every seed entry whose `topics` include ANY of the supplied topic slugs.
 * Used by the Initiation Readiness dashboard to power each "Learn more" panel.
 */
export async function entriesForTopics(topics: string[]): Promise<PrabhupadaEntry[]> {
  const seed = await loadSeed();
  const wanted = new Set(topics.map((t) => t.toLowerCase()));
  return seed.filter((e) => (e.topics || []).some((t) => wanted.has(t.toLowerCase())));
}

// ---------- filtering ----------
export interface CorpusFilter {
  type?: PrabhupadaEntryType | "all";
  book?: string;
  tag?: string;
  dateFrom?: string; // yyyy-MM-dd
  dateTo?: string;
  keyword?: string;
}

export function filterEntries(
  entries: PrabhupadaManifestEntry[],
  f: CorpusFilter
): PrabhupadaManifestEntry[] {
  const kw = (f.keyword || "").trim().toLowerCase();
  return entries.filter((e) => {
    if (f.type && f.type !== "all" && e.type !== f.type) return false;
    if (f.book && !(e.title.toLowerCase().includes(f.book.toLowerCase()) || (e.tags || []).some((t) => t.toLowerCase().includes(f.book!.toLowerCase())))) return false;
    if (f.tag && !(e.tags || []).some((t) => t.toLowerCase() === f.tag!.toLowerCase())) return false;
    if (f.dateFrom && e.date && e.date < f.dateFrom) return false;
    if (f.dateTo && e.date && e.date > f.dateTo) return false;
    if (kw) {
      const hay = `${e.title} ${e.location} ${(e.tags || []).join(" ")}`.toLowerCase();
      if (!hay.includes(kw)) return false;
    }
    return true;
  });
}

// ---------- related-source matching ----------
/**
 * Score a corpus entry's relevance to a lecture note. Higher = more relevant.
 *  - exact verseReference match on book + chapter/verse → +10
 *  - shared tag → +2 per match
 *  - title keyword overlap → +1 per shared significant word
 */
export function scoreRelevance(note: LectureNote, entry: PrabhupadaManifestEntry): number {
  let score = 0;
  const noteRef = (note.verseReference || "").toLowerCase();
  const entryTitle = (entry.title || "").toLowerCase();
  if (noteRef) {
    // Match e.g. "SB 3.26.40" against entry title / tags.
    const parts = noteRef.match(/\b([a-z]{2,4})\s*\d+[.:]\d+(?:[.:]\d+)?\b/g);
    if (parts) {
      for (const p of parts) {
        if (entryTitle.includes(p.replace(/\s+/g, " ")) || (entry.tags || []).some((t) => t.toLowerCase().includes(p))) {
          score += 10;
        }
      }
    }
  }
  const noteTags = new Set((note.tags || []).map((t) => t.toLowerCase()));
  for (const t of entry.tags || []) {
    if (noteTags.has(t.toLowerCase())) score += 2;
  }
  const noteWords = keywordSet(note.title);
  const entryWords = keywordSet(entry.title);
  noteWords.forEach((w) => {
    if (entryWords.has(w)) score += 1;
  });
  return score;
}

function keywordSet(s: string): Set<string> {
  const stop = new Set([
    "the", "and", "of", "to", "in", "a", "for", "on", "with", "is",
    "as", "at", "by", "an", "or", "be", "śrī", "sri", "śrīla", "śrīmad",
  ]);
  return new Set(
    (s || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s\u0080-\uffff-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stop.has(w))
  );
}

export async function relatedForNote(
  note: LectureNote,
  limit = 8
): Promise<Array<PrabhupadaManifestEntry & { score: number }>> {
  const all = await loadAllSections();
  const scored = all
    .map((e) => ({ ...e, score: scoreRelevance(note, e) }))
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

// ---------- keyword search across manifests ----------
export async function searchCorpus(query: string, limit = 30): Promise<PrabhupadaManifestEntry[]> {
  const all = await loadAllSections();
  const q = query.trim().toLowerCase();
  if (!q) return all.slice(0, limit);
  const words = q.split(/\s+/).filter(Boolean);
  return all
    .map((e) => {
      const hay = `${e.title} ${e.location} ${(e.tags || []).join(" ")}`.toLowerCase();
      const hits = words.filter((w) => hay.includes(w)).length;
      return { e, hits };
    })
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, limit)
    .map((x) => x.e);
}
