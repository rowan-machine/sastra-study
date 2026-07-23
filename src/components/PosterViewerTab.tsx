"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, GraduationCap, Heart, Image as ImageIcon, Layers, Move, Trash2, Upload, X, ZoomIn, ZoomOut } from "lucide-react";
import type { LectureNote, Poster } from "@/lib/data";

interface Props {
  lectureNotes?: LectureNote[];
  sevaPosters?: Poster[];
  setSevaPosters?: (value: Poster[] | ((prev: Poster[]) => Poster[])) => void;
  initialCategory?: "all" | "general" | "lecture" | "seva";
  onTabChange?: (tab: string) => void;
}

const LEGACY_KEY = "sastra-posters";
const CUSTOM_KEY = "sastra-posters-custom";

// Note: the Krishna & Humility poster (file_00000000c044722f87c9356eabdfb7a8.png)
// is now surfaced under Lecture Posters instead of the general set.
const defaultPosters: Poster[] = [
  { id: "poster-985ecda3", src: "/images/posters/985ecda3-4f2c-48fa-83fb-4b35a5ad37c7.png", title: "Poster 1", addedAt: new Date().toISOString(), category: "general" },
  { id: "poster-146c722f", src: "/images/posters/file_00000000146c722fa465d448185210b9.png", title: "Poster 2", addedAt: new Date().toISOString(), category: "general" },
  { id: "poster-1e24720c", src: "/images/posters/file_000000001e24720c817ba90c302a1551.png", title: "Poster 3", addedAt: new Date().toISOString(), category: "general" },
  { id: "poster-242c71f5", src: "/images/posters/file_00000000242c71f59aa4281ad367d9bb.png", title: "Poster 4", addedAt: new Date().toISOString(), category: "general" },
  { id: "poster-636871f5", src: "/images/posters/file_00000000636871f58f61c906e6702531.png", title: "Poster 5", addedAt: new Date().toISOString(), category: "general" },
  { id: "poster-7458722f", src: "/images/posters/file_000000007458722fb290e75b77093b8d.png", title: "Poster 6", addedAt: new Date().toISOString(), category: "general" },
  { id: "poster-b26c722f", src: "/images/posters/file_00000000b26c722f9a64aa40f3459139.png", title: "Poster 7", addedAt: new Date().toISOString(), category: "general" },
  { id: "poster-bce871f5", src: "/images/posters/file_00000000bce871f5a504be1863295a07.png", title: "Poster 8", addedAt: new Date().toISOString(), category: "general" },
  { id: "poster-f0f071f7", src: "/images/posters/file_00000000f0f071f7ae9dc133960ec0ad.png", title: "Poster 9", addedAt: new Date().toISOString(), category: "general" },
];

const legacyLectureSrcs = new Set([
  "/images/posters/file_00000000c044722f87c9356eabdfb7a8.png",
]);

export function PosterViewerTab({ lectureNotes = [], sevaPosters = [], initialCategory = "all" }: Props) {
  const [customPosters, setCustomPosters] = useState<Poster[]>([]);
  const [index, setIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef<number | null>(null);

  const [category, setCategory] = useState<"all" | "general" | "lecture" | "seva">(initialCategory);
  const [sevaServiceFilter, setSevaServiceFilter] = useState<string>("all");

  // Derive lecture posters from lectureNotes with a posterImage
  const lecturePosters: Poster[] = useMemo(
    () =>
      lectureNotes
        .filter((n) => n.posterImage)
        .map((n) => ({
          id: `lecture-poster-${n.id}`,
          src: n.posterImage as string,
          title: n.title,
          addedAt: n.date || new Date().toISOString(),
          category: "lecture" as const,
          lectureId: n.id,
          speaker: n.speakerName,
        })),
    [lectureNotes]
  );

  const generalPosters = useMemo(() => {
    // Filter customPosters — drop any that duplicate lecture posters by src
    const lectureSrcs = new Set(lecturePosters.map((p) => p.src));
    return [...defaultPosters, ...customPosters].filter(
      (p) => !lectureSrcs.has(p.src) && !legacyLectureSrcs.has(p.src)
    );
  }, [customPosters, lecturePosters]);

  const filteredSevaPosters = useMemo(
    () =>
      sevaServiceFilter === "all"
        ? sevaPosters
        : sevaPosters.filter((p) => (p.service || "Other") === sevaServiceFilter),
    [sevaPosters, sevaServiceFilter]
  );

  const allPosters = useMemo(() => {
    if (category === "lecture") return lecturePosters;
    if (category === "general") return generalPosters;
    if (category === "seva") return filteredSevaPosters;
    return [...generalPosters, ...lecturePosters, ...sevaPosters];
  }, [category, generalPosters, lecturePosters, sevaPosters, filteredSevaPosters]);

  // Distinct services seen among seva posters
  const sevaServices = useMemo(() => {
    const set = new Set<string>();
    sevaPosters.forEach((p) => set.add(p.service || "Other"));
    return [...set].sort();
  }, [sevaPosters]);

  // Load custom posters and migrate stale legacy storage
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const defaultSrcSet = new Set(defaultPosters.map((p) => p.src));
      let merged: Poster[] = [];

      const customRaw = window.localStorage.getItem(CUSTOM_KEY);
      if (customRaw) {
        const parsed = JSON.parse(customRaw) as Poster[];
        if (Array.isArray(parsed)) merged = parsed;
      }

      const legacyRaw = window.localStorage.getItem(LEGACY_KEY);
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw) as Poster[];
        if (Array.isArray(legacy)) {
          // Keep only real user uploads (data URLs or paths not in current defaults)
          const userOnes = legacy.filter((p) => p.src && !defaultSrcSet.has(p.src));
          merged = [...merged, ...userOnes];
        }
        window.localStorage.removeItem(LEGACY_KEY);
      }

      // Remove duplicates by src
      const seen = new Set<string>();
      const deduped = merged.filter((p) => {
        if (seen.has(p.src)) return false;
        seen.add(p.src);
        return true;
      });

      setCustomPosters(deduped);
      window.localStorage.setItem(CUSTOM_KEY, JSON.stringify(deduped));
    } catch (e) {
      console.error("Error loading posters:", e);
    }
    setIsLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);


  // Persist custom posters
  useEffect(() => {
    if (!isLoaded) return;
    try {
      window.localStorage.setItem(CUSTOM_KEY, JSON.stringify(customPosters));
    } catch (e) {
      console.error("Error saving posters:", e);
    }
  }, [customPosters, isLoaded]);



  const nextPoster = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setImgError(false);
    setIndex((i) => {
      const len = allPosters.length;
      if (len === 0) return 0;
      const safe = Math.min(i, len - 1);
      return (safe + 1) % len;
    });
  }, [allPosters]);

  const prevPoster = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setImgError(false);
    setIndex((i) => {
      const len = allPosters.length;
      if (len === 0) return 0;
      const safe = Math.min(i, len - 1);
      return (safe - 1 + len) % len;
    });
  }, [allPosters]);

  const setZoomLevel = useCallback((updater: (z: number) => number) => {
    setZoom((z) => {
      const next = Math.max(1, Math.min(6, updater(z)));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.25 : -0.25;
      setZoomLevel((z) => z + delta);
    }
  }, [setZoomLevel]);

  const onPanStart = (clientX: number, clientY: number) => {
    if (zoom <= 1) return;
    setIsPanning(true);
    panStartRef.current = { x: clientX, y: clientY, panX: pan.x, panY: pan.y };
  };

  const onPanMove = (clientX: number, clientY: number) => {
    if (!isPanning || !panStartRef.current) return;
    const dx = clientX - panStartRef.current.x;
    const dy = clientY - panStartRef.current.y;
    setPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy });
  };

  const onPanEnd = () => {
    setIsPanning(false);
    panStartRef.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prevPoster();
      if (e.key === "ArrowRight") nextPoster();
      if (e.key === "Escape") setZoom(1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [nextPoster, prevPoster]);

  const current = allPosters[Math.min(index, allPosters.length - 1)] || null;

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    // Don't navigate while zoomed in (allow panning), or while touch-swipe-panning
    if (zoom > 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setImgError(false);
    if (x < rect.width / 2) {
      prevPoster();
    } else {
      nextPoster();
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setCustomPosters((prev) => {
          const newPoster: Poster = {
            id: `poster-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            src: dataUrl,
            title: file.name.replace(/\.[^/.]+$/, ""),
            addedAt: new Date().toISOString(),
          };
          return [...prev, newPoster];
        });
      };
      reader.readAsDataURL(file);
    });
  }

  function deletePoster(id: string) {
    // Only delete custom posters; default ones are managed by the app
    if (defaultPosters.some((p) => p.id === id)) {
      setImgError(false);
      nextPoster();
      return;
    }
    setCustomPosters((prev) => {
      const next = prev.filter((p) => p.id !== id);
      setIndex((i) => Math.min(i, Math.max(0, defaultPosters.length + next.length + lecturePosters.length - 1)));
      return next;
    });
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    if (zoom > 1) {
      onPanStart(t.clientX, t.clientY);
      touchStartX.current = null;
      return;
    }
    touchStartX.current = t.clientX;
  }

  function onTouchMove(e: React.TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    if (zoom > 1 && isPanning) {
      onPanMove(t.clientX, t.clientY);
    }
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (isPanning) {
      onPanEnd();
      return;
    }
    if (touchStartX.current == null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const diff = touchStartX.current - endX;
    if (Math.abs(diff) > 50) {
      setImgError(false);
      if (diff > 0) nextPoster();
      else prevPoster();
    }
    touchStartX.current = null;
  }

  if (!isLoaded) {
    return (
      <div className="p-8 flex items-center justify-center h-96">
        <p className="text-zinc-500">Loading posters…</p>
      </div>
    );
  }

  const categoryTabs: { id: "all" | "general" | "lecture" | "seva"; label: string; icon: typeof Layers; count: number }[] = [
    { id: "all", label: "All", icon: Layers, count: generalPosters.length + lecturePosters.length + sevaPosters.length },
    { id: "general", label: "General", icon: ImageIcon, count: generalPosters.length },
    { id: "lecture", label: "Lectures", icon: GraduationCap, count: lecturePosters.length },
    { id: "seva", label: "Sevā", icon: Heart, count: sevaPosters.length },
  ];

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">Poster Binder</h2>
          <p className="text-sm text-zinc-500">
            {allPosters.length} poster{allPosters.length === 1 ? "" : "s"}
            {current?.category === "lecture" && current.speaker ? ` · by ${current.speaker}` : ""}
            {" "}· swipe, arrow keys, or click sides to flip
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Upload size={16} />
            Add
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5 mb-3 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg w-fit">
        {categoryTabs.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => {
              setCategory(id);
              setIndex(0);
              setZoom(1);
              setPan({ x: 0, y: 0 });
              setImgError(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              category === id
                ? "bg-white dark:bg-zinc-800 text-amber-800 dark:text-amber-200 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <Icon size={12} />
            {label}
            <span className="text-[10px] text-zinc-400 ml-0.5">{count}</span>
          </button>
        ))}
      </div>

      {category === "seva" && sevaServices.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mr-1">Service</span>
          {(["all", ...sevaServices] as string[]).map((s) => {
            const active = sevaServiceFilter === s;
            const cnt = s === "all" ? sevaPosters.length : sevaPosters.filter((p) => (p.service || "Other") === s).length;
            return (
              <button
                key={s}
                onClick={() => {
                  setSevaServiceFilter(s);
                  setIndex(0);
                  setZoomLevel(() => 1);
                  setImgError(false);
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                  active
                    ? "bg-amber-700 border-amber-700 text-white"
                    : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-amber-400"
                }`}
              >
                {s === "all" ? "All" : s}
                <span className={`text-[9px] ${active ? "text-amber-100" : "text-zinc-400"}`}>{cnt}</span>
              </button>
            );
          })}
        </div>
      )}

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={handleWheel}
        className={`relative flex-1 min-h-0 rounded-2xl border-2 transition-colors overflow-hidden flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 ${
          isDragging
            ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
            : "border-amber-200 dark:border-zinc-700"
        }`}
      >
        {allPosters.length === 0 ? (
          <div className="text-center p-8">
            <ImageIcon size={48} className="mx-auto text-zinc-400 mb-3" />
            <p className="text-zinc-600 dark:text-zinc-300 font-medium mb-1">No posters yet</p>
            <p className="text-sm text-zinc-500 mb-4">Drag images here or click Add to upload.</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium"
            >
              Choose images
            </button>
          </div>
        ) : (
          <>
            {showHelp && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 px-3 py-1.5 bg-zinc-900/70 text-white text-xs rounded-full">
                <span className="flex items-center gap-1"><Move size={12} />Zoom then drag to pan · Ctrl/⌘+scroll to zoom · click sides to flip</span>
                <button onClick={() => setShowHelp(false)} className="hover:text-amber-300">
                  <X size={12} />
                </button>
              </div>
            )}

            <button
              onClick={prevPoster}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-700 rounded-full shadow-sm text-zinc-700 dark:text-zinc-200"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={nextPoster}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-700 rounded-full shadow-sm text-zinc-700 dark:text-zinc-200"
            >
              <ChevronRight size={24} />
            </button>

            <div
              onClick={handleImageClick}
              onMouseDown={(e) => {
                if (zoom > 1) {
                  e.preventDefault();
                  onPanStart(e.clientX, e.clientY);
                }
              }}
              onMouseMove={(e) => {
                if (isPanning) onPanMove(e.clientX, e.clientY);
              }}
              onMouseUp={onPanEnd}
              onMouseLeave={onPanEnd}
              className={`relative flex items-center justify-center w-full h-full p-8 ${
                zoom > 1
                  ? isPanning
                    ? "cursor-grabbing"
                    : "cursor-grab"
                  : "cursor-pointer"
              }`}
            >
              {imgError ? (
                <div className="text-center">
                  <ImageIcon size={48} className="mx-auto text-zinc-400 mb-3" />
                  <p className="text-zinc-600 dark:text-zinc-300 mb-3">Could not load this image.</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (current && !defaultPosters.some((p) => p.id === current.id)) {
                        deletePoster(current.id);
                      } else {
                        setImgError(false);
                        nextPoster();
                      }
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                  >
                    {current && defaultPosters.some((p) => p.id === current.id) ? "Skip" : "Remove"}
                  </button>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={current?.src}
                  alt={current?.title || "Poster"}
                  onError={() => setImgError(true)}
                  className={`max-w-full max-h-full object-contain shadow-2xl rounded-lg ${
                    isPanning ? "" : "transition-transform duration-200"
                  }`}
                  style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
                  draggable={false}
                />
              )}
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/90 dark:bg-zinc-800/90 px-4 py-2 rounded-full shadow-sm border border-amber-200 dark:border-zinc-700">
              <button onClick={() => setZoomLevel((z) => z - 0.25)} className="p-1 hover:text-amber-700">
                <ZoomOut size={18} />
              </button>
              <span className="text-sm text-zinc-700 dark:text-zinc-200 min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoomLevel((z) => z + 0.25)} className="p-1 hover:text-amber-700">
                <ZoomIn size={18} />
              </button>
              <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-600 mx-1" />
              <span className="text-sm text-zinc-600 dark:text-zinc-300 max-w-[200px] truncate">
                {current?.title}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (current) deletePoster(current.id);
                }}
                className="p-1 text-red-600 hover:text-red-700 ml-1"
                title="Remove poster"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="absolute bottom-4 right-4 z-10 text-xs text-zinc-400">
              {index + 1} / {allPosters.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
