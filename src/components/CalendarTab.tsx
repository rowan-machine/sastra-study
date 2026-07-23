"use client";

import { VaisnavaEvent } from "@/lib/data";
import { vaisnavaEvents, fastLabels, fastDetails, isKartikaDate } from "@/lib/vaisnava-calendar";
import { format, parseISO, startOfWeek, isSameWeek } from "date-fns";
import { useState, useMemo, useEffect } from "react";
import { Search, Moon, Sun, Star, Heart, Info, Calendar } from "lucide-react";
import { DeitiesView } from "./DeitiesView";
import { SampradayaTab } from "./SampradayaTab";

interface CalendarTabProps {
  focusEventId?: string | null;
  onFocusConsumed?: () => void;
}

interface EventGroup {
  key: string;
  label: string;
  subLabel?: string;
  events: VaisnavaEvent[];
}

function EventIcon({ type }: { type: VaisnavaEvent["type"] }) {
  if (type === "ekadashi") return <Moon size={18} className="text-indigo-500" />;
  if (type === "appearance") return <Star size={18} className="text-amber-500" />;
  if (type === "disappearance") return <Heart size={18} className="text-rose-500" />;
  return <Sun size={18} className="text-orange-500" />;
}

// Days where extra rounds of japa are encouraged
const extraRoundsEventNames = ["gaura purnima", "janmashtami", "nityananda trayodashi", "radhastami", "prabhupada", "bhaktisiddhanta", "vyasa puja"];

function isExtraChantingDay(event: VaisnavaEvent): boolean {
  if (event.type === "ekadashi") return true;
  if (event.type === "appearance" || event.type === "disappearance") return true;
  if (extraRoundsEventNames.some((k) => event.name.toLowerCase().includes(k))) return true;
  if (isKartikaDate(event.date)) return true;
  return false;
}

function EventBadge({ type }: { type: VaisnavaEvent["type"] }) {
  const styles = {
    ekadashi: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300",
    appearance: "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300",
    disappearance: "bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300",
    festival: "bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-300",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[type]}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}

export function CalendarTab({ focusEventId, onFocusConsumed }: CalendarTabProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<VaisnavaEvent["type"] | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [view, setView] = useState<"events" | "deities" | "sampradaya">("events");

  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const currentDate = useMemo(() => new Date(), []);
  const currentWeekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 0 }), [currentDate]);

  useEffect(() => {
    if (focusEventId) {
      const matched = vaisnavaEvents.find((e) => e.id === focusEventId);
      if (matched) {
        const timeout = setTimeout(() => {
          setFilter("all");
          setSearch("");
          setShowPast(true);
          setExpandedId(focusEventId);
          const el = document.getElementById(`event-${focusEventId}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.focus({ preventScroll: true });
          }
          onFocusConsumed?.();
        }, 0);
        return () => clearTimeout(timeout);
      } else {
        onFocusConsumed?.();
      }
    }
  }, [focusEventId, onFocusConsumed]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return vaisnavaEvents.filter((e) => {
      if (filter !== "all" && e.type !== filter) return false;
      if (!showPast && e.date < today) return false;
      return (
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.personDeity || "").toLowerCase().includes(q)
      );
    });
  }, [search, filter, showPast, today]);

  const grouped = useMemo<EventGroup[]>(() => {
    const map = new Map<string, EventGroup>();
    for (const e of filtered) {
      const date = parseISO(e.date + "T12:00");
      const weekStart = startOfWeek(date, { weekStartsOn: 0 });
      const key = format(weekStart, "yyyy-MM-dd");
      const isCurrent = isSameWeek(date, currentWeekStart, { weekStartsOn: 0 });
      const label = isCurrent ? "This week" : format(weekStart, "MMMM d");
      const subLabel = `${format(weekStart, "yyyy")} · Week of ${format(weekStart, "EEEE, MMMM d")}`;
      const existing = map.get(key);
      if (existing) {
        existing.events.push(e);
      } else {
        map.set(key, { key, label, subLabel, events: [e] });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [filtered, currentWeekStart]);

  const upcoming = useMemo(() => {
    return vaisnavaEvents.filter((e) => e.date >= today).slice(0, 7);
  }, [today]);

  const scrollToToday = () => {
    const currentGroup = grouped.find((g) => g.events.some((e) => e.date === today));
    const targetId = currentGroup ? `group-${currentGroup.key}` : `group-${grouped.find((g) => g.events.some((e) => e.date >= today))?.key}`;
    const el = targetId ? document.getElementById(targetId) : null;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">Vaiṣṇava Calendar</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            <Calendar size={14} className="inline align-text-bottom mr-1" />
            {format(currentDate, "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
            {(["events", "deities", "sampradaya"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === v
                    ? "bg-white dark:bg-zinc-700 text-amber-800 dark:text-amber-200 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                {v === "events" ? "Events" : v === "deities" ? "Deities" : "Sampradāya"}
              </button>
            ))}
          </div>
          {view === "events" && (
            <button
              onClick={scrollToToday}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800/40 transition-colors"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {view === "deities" ? (
        <DeitiesView events={vaisnavaEvents} />
      ) : view === "sampradaya" ? (
        <SampradayaTab />
      ) : (<>
      <div className="mb-8 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/20 rounded-xl border border-indigo-200 dark:border-indigo-800/50 p-5">
        <p className="text-xs font-medium text-indigo-600 dark:text-indigo-300 uppercase tracking-wide mb-2">Upcoming</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {upcoming.map((e) => (
            <div
              key={e.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                setFilter("all");
                setSearch("");
                setExpandedId(e.id);
                setTimeout(() => {
                  const el = document.getElementById(`event-${e.id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                    el.focus({ preventScroll: true });
                  }
                }, 120);
              }}
              onKeyDown={(eKey) => {
                if (eKey.key === "Enter" || eKey.key === " ") {
                  eKey.preventDefault();
                  eKey.currentTarget.click();
                }
              }}
              className="cursor-pointer bg-white dark:bg-zinc-900 rounded-lg border border-indigo-100 dark:border-zinc-800 p-3 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <EventIcon type={e.type} />
                <span className="text-xs text-zinc-500">{format(parseISO(e.date + "T12:00"), "MMM d")}</span>
              </div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">{e.name}</p>
              {e.personDeity && <p className="text-xs text-zinc-500 mt-0.5">{e.personDeity}</p>}
              {e.fastType && e.fastType !== "none" && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">{fastLabels[e.fastType]}</p>
              )}
              {isExtraChantingDay(e) && (
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">🙏 Extra rounds</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, deities, or descriptions..."
            className="input-field w-full !pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "ekadashi", "appearance", "disappearance", "festival"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === t
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <button
            onClick={() => setShowPast((v) => !v)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showPast
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            {showPast ? "Hide Past" : "Show Past"}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {grouped.length === 0 && (
          <p className="text-sm text-zinc-500 text-center py-8">No events match your search.</p>
        )}
        {grouped.map((group) => (
          <div key={group.key} id={`group-${group.key}`} className="space-y-3">
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur py-2 border-b border-amber-100 dark:border-zinc-800">
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">{group.label}</h3>
              <p className="text-xs text-zinc-500">{group.subLabel}</p>
            </div>
            {group.events.map((e) => {
              const isExpanded = expandedId === e.id;
              return (
                <div
                  id={`event-${e.id}`}
                  key={e.id}
                  tabIndex={-1}
                  className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 overflow-hidden outline-none focus:ring-2 focus:ring-amber-300"
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : e.id)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-amber-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <EventIcon type={e.type} />
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{e.name}</p>
                        <p className="text-xs text-zinc-500">
                          {format(parseISO(e.date + "T12:00"), "EEEE, MMMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <EventBadge type={e.type} />
                      {e.fastType && e.fastType !== "none" && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300">
                          {fastLabels[e.fastType]}
                        </span>
                      )}
                      <Info size={16} className={`text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-amber-100 dark:border-zinc-800 p-4 space-y-3">
                      {isExtraChantingDay(e) && (
                        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/50 rounded-lg px-3 py-2">
                          <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">🙏 Extra chanting encouraged</p>
                          <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                            {e.type === "ekadashi"
                              ? "Aim for 24, 32, 64 or more rounds according to your time and capacity."
                              : isKartikaDate(e.date)
                              ? "During Kārtika, many devotees increase daily rounds as part of their Dāmodara vrata."
                              : "Additional chanting, hearing, and service are encouraged on this sacred day."}
                          </p>
                        </div>
                      )}
                      {e.personDeity && (
                        <div>
                          <p className="text-xs text-zinc-500 mb-0.5">Honoring</p>
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{e.personDeity}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-zinc-500 mb-0.5">Details</p>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{e.description}</p>
                      </div>
                      {e.fastType && e.fastType !== "none" && (
                        <div>
                          <p className="text-xs text-zinc-500 mb-0.5">Fast</p>
                          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">{fastLabels[e.fastType]}</p>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mt-1">{fastDetails[e.fastType]}</p>
                        </div>
                      )}
                      {e.breakFastStart && (
                        <div>
                          <p className="text-xs text-zinc-500 mb-0.5">Break fast start (next day)</p>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300">{e.breakFastStart}</p>
                        </div>
                      )}
                      {e.breakFastEnd && (
                        <div>
                          <p className="text-xs text-zinc-500 mb-0.5">Break fast end (next day)</p>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300">{e.breakFastEnd}</p>
                        </div>
                      )}
                      {e.breakFast && !e.breakFastStart && !e.breakFastEnd && (
                        <div>
                          <p className="text-xs text-zinc-500 mb-0.5">Break fast</p>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300">{e.breakFast}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      </>)}
    </div>
  );
}
