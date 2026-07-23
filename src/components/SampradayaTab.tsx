"use client";

import { useMemo, useState } from "react";
import { allSampradayaFigures, fourSampradayas, SampradayaFigure, gaudiyaLineage } from "@/lib/sampradaya";
import { stripDiacritics } from "@/lib/transliteration";
import { Search, ChevronDown, ChevronUp, Users } from "lucide-react";

const POSTER_WIDTH = 630;
const POSTER_HEIGHT = 960;

function parseRectCoords(coords: string): { x1: number; y1: number; x2: number; y2: number } | null {
  const [x1, y1, x2, y2] = coords.split(",").map((n) => parseInt(n.trim(), 10));
  if ([x1, y1, x2, y2].some((n) => Number.isNaN(n))) return null;
  return { x1, y1, x2, y2 };
}

function figureStyle(coords: string) {
  const rect = parseRectCoords(coords);
  if (!rect) return {};
  return {
    left: `${(rect.x1 / POSTER_WIDTH) * 100}%`,
    top: `${(rect.y1 / POSTER_HEIGHT) * 100}%`,
    width: `${((rect.x2 - rect.x1) / POSTER_WIDTH) * 100}%`,
    height: `${((rect.y2 - rect.y1) / POSTER_HEIGHT) * 100}%`,
  };
}

export function SampradayaTab() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SampradayaFigure | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const qNorm = stripDiacritics(search);
    return gaudiyaLineage.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        stripDiacritics(f.name).includes(qNorm) ||
        f.description.toLowerCase().includes(q) ||
        stripDiacritics(f.description).includes(qNorm) ||
        (f.title || "").toLowerCase().includes(q) ||
        (f.role || "").toLowerCase().includes(q) ||
        (f.sanskrit || "").includes(q)
    );
  }, [search]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Four Sampradāyas - expandable boxes above the poster */}
      <div>
        <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-3">The Four Vaiṣṇava Sampradāyas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {fourSampradayas.map((s) => {
            const isExp = expanded.has(s.id);
            return (
              <div
                key={s.id}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-4 flex flex-col"
              >
                <button
                  onClick={() => toggleExpand(s.id)}
                  className="w-full text-left"
                >
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">{s.name}</p>
                  {s.sanskrit && <p className="text-xs text-zinc-500">{s.sanskrit}</p>}
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Founded by {s.founder}</p>
                </button>
                {isExp && (
                  <div className="mt-3 pt-3 border-t border-amber-100 dark:border-zinc-800">
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed mb-2">{s.summary}</p>
                    <p className="text-xs text-zinc-500 font-medium">Key exponents:</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">{s.keyExponents.join(", ")}</p>
                  </div>
                )}
                <button
                  onClick={() => toggleExpand(s.id)}
                  className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 hover:underline mt-2 self-start"
                >
                  {isExp ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> Details</>}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lineage (e.g. vyasa, narada, prabhupada)..."
            className="input-field w-full !pl-10"
          />
        </div>
        <p className="text-sm text-zinc-500 self-center">
          {filtered.length} {filtered.length === 1 ? "figure" : "figures"}
        </p>
      </div>

      {/* Main content: poster + detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] gap-6">
        <div className="space-y-4">
          <div className="relative w-full max-w-[630px] mx-auto aspect-[630/960] bg-amber-50 dark:bg-amber-950/20 rounded-xl overflow-hidden border border-amber-200 dark:border-zinc-800 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/disciplic-succession-sampradaya.jpg"
              alt="Brahma-Madhva-Gaudiya disciplic succession poster"
              className="w-full h-full object-cover"
              width={POSTER_WIDTH}
              height={POSTER_HEIGHT}
            />
            {gaudiyaLineage.map((figure) => {
              const style = figureStyle(figure.area.coords);
              if (!style.width) return null;
              return (
                <button
                  key={figure.id}
                  type="button"
                  onClick={() => setSelected(figure)}
                  title={figure.name}
                  style={style}
                  className={`absolute group focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-sm transition-colors bg-indigo-500/0 hover:bg-indigo-500/30 ${
                    selected?.id === figure.id ? "ring-2 ring-amber-400 bg-amber-400/20" : ""
                  }`}
                />
              );
            })}
          </div>
          <p className="text-xs text-zinc-500 text-center">
            Click any guru on the poster to learn about them.
          </p>
        </div>

        <div className="space-y-4">
          {selected ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">{selected.name}</h3>
                  {selected.sanskrit && (
                    <p className="text-sm text-zinc-500 font-serif">{selected.sanskrit}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  Close
                </button>
              </div>
              {selected.photo && (
                <div className="mb-4 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selected.photo}
                    alt={selected.name}
                    className="w-36 h-36 object-cover rounded-xl shadow-md border border-amber-100 dark:border-zinc-700"
                  />
                </div>
              )}
              {selected.title && (
                <p className="text-sm text-amber-700 dark:text-amber-300 font-medium mb-2">{selected.title}</p>
              )}
              {selected.role && (
                <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wide">{selected.role}</p>
              )}
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3">{selected.description}</p>
              {selected.keyEvents && selected.keyEvents.length > 0 && (
                <div className="mt-3 pt-3 border-t border-amber-100 dark:border-zinc-800">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-wide mb-2">Key Events &amp; Contributions</p>
                  <ul className="space-y-1.5">
                    {selected.keyEvents.map((event, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>
                        <span>{event}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/50 p-5">
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                Select a guru from the poster or list below to read about their place in the
                Brahma-Madhva-Gauḍīya disciplic succession.
              </p>
            </div>
          )}

          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-5">
            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
              <Users size={16} />
              Gauḍīya Lineage
            </h3>
            <ul className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
              {filtered.map((figure) => {
                const isExp = expanded.has(figure.id);
                return (
                  <li
                    key={figure.id}
                    className={`rounded-lg border p-3 transition-colors ${
                      selected?.id === figure.id
                        ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20"
                        : "border-amber-100 dark:border-zinc-800 hover:bg-amber-50/50 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <button
                      onClick={() => setSelected(figure)}
                      className="w-full text-left"
                    >
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{figure.name}</p>
                      {figure.title && (
                        <p className="text-xs text-zinc-500">{figure.title}</p>
                      )}
                    </button>
                    <p
                      className={`text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed ${
                        isExp ? "" : "line-clamp-2"
                      }`}
                    >
                      {figure.description}
                    </p>
                    {figure.description.length > 90 && (
                      <button
                        onClick={() => toggleExpand(figure.id)}
                        className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 hover:underline mt-1"
                      >
                        {isExp ? (
                          <>
                            <ChevronUp size={12} /> Less
                          </>
                        ) : (
                          <>
                            <ChevronDown size={12} /> More
                          </>
                        )}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
