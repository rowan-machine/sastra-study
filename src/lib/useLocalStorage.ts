"use client";
import { useState, useLayoutEffect, useEffect, useCallback, useRef } from "react";

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "QuotaExceededError" ||
      /quota|exceeded/i.test(error.message))
  );
}

function pruneSummaryTranscript<T>(value: T): T | undefined {
  if (!Array.isArray(value)) return undefined;
  let changed = false;
  const next = value.map((item) => {
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      if (("summary" in record || "transcript" in record) && ("summaryUrl" in record || "transcriptUrl" in record)) {
        const copy = { ...record, summary: undefined, transcript: undefined };
        changed = true;
        return copy;
      }
    }
    return item;
  }) as T;
  return changed ? next : undefined;
}

function pruneAllSummaryTranscript<T>(value: T): T | undefined {
  if (!Array.isArray(value)) return undefined;
  let changed = false;
  const next = value.map((item) => {
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      if ("summary" in record || "transcript" in record) {
        const copy = { ...record, summary: undefined, transcript: undefined };
        changed = true;
        return copy;
      }
    }
    return item;
  }) as T;
  return changed ? next : undefined;
}

/* ── IndexedDB fallback for data that outlives localStorage clears/quotas ── */
const DB_NAME = "sastra-study-fallback";
const DB_STORE = "kv";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.reject(new Error("IndexedDB not available"));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    const store = tx.objectStore(DB_STORE);
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readonly");
    const store = tx.objectStore(DB_STORE);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [initialValueState] = useState(initialValue);
  const [storedValue, setStoredValue] = useState<T>(initialValueState);
  const [isHydrated, setIsHydrated] = useState(false);
  const isHydratedRef = useRef(false);

  // useLayoutEffect hydrates synchronously before passive effects run. This
  // prevents parent useEffect(s) that write state back to localStorage from
  // seeing the previous key's cached value and copying it into a new key.
  // If localStorage is empty/corrupt, we try IndexedDB for recovery.
  useLayoutEffect(() => {
    isHydratedRef.current = false;
    /* eslint-disable react-hooks/set-state-in-effect */
    setIsHydrated(false);

    const finish = (value: T) => {
      setStoredValue(value);
      setIsHydrated(true);
      isHydratedRef.current = true;
    };

    const tryIDB = () => {
      idbGet<T>(key)
        .then((idbValue) => {
          if (idbValue !== undefined) {
            setStoredValue(idbValue);
            // Restore localStorage from IndexedDB so the next read is fast
            try {
              window.localStorage.setItem(key, JSON.stringify(idbValue));
            } catch (_) {
              /* ignore quota on restore */
            }
          } else {
            setStoredValue(initialValueState);
          }
          setIsHydrated(true);
          isHydratedRef.current = true;
        })
        .catch(() => {
          setStoredValue(initialValueState);
          setIsHydrated(true);
          isHydratedRef.current = true;
        });
    };

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        setStoredValue(parsed);
        setIsHydrated(true);
        isHydratedRef.current = true;
        // Keep IDB in sync for redundancy
        idbGet<T>(key)
          .then((idbValue) => {
            if (idbValue === undefined) idbSet(key, parsed);
          })
          .catch(() => {});
      } else {
        tryIDB();
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      tryIDB();
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [key, initialValueState]);

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    if (!isHydratedRef.current) return;
    setStoredValue((prev) => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      let persisted = false;
      try {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        persisted = true;
      } catch (error) {
        if (isQuotaError(error)) {
          const pruned = pruneSummaryTranscript(valueToStore);
          if (pruned !== undefined) {
            try {
              window.localStorage.setItem(key, JSON.stringify(pruned));
              persisted = true;
            } catch { /* try harder prune below */ }
          }
          if (!persisted) {
            const allPruned = pruneAllSummaryTranscript(valueToStore);
            if (allPruned !== undefined) {
              try {
                window.localStorage.setItem(key, JSON.stringify(allPruned));
                persisted = true;
              } catch { /* fall through to fallback */ }
            }
          }
        }
        if (!persisted) {
          console.warn(`localStorage failed for "${key}"; falling back to IndexedDB`);
        }
      }
      // Always mirror to IndexedDB so data survives localStorage clears/quotas
      idbSet(key, valueToStore).catch((idbError) => {
        console.error(`Error setting IndexedDB key "${key}":`, idbError);
      });
      return valueToStore;
    });
  }, [key]);

  // Sync state when the same key is updated from another tab
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch {
          /* ignore malformed external writes */
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  return [isHydrated ? storedValue : initialValueState, setValue, isHydrated];
}
