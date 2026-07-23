"use client";
import { useState, useLayoutEffect, useCallback, useRef } from "react";

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

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [initialValueState] = useState(initialValue);
  const [storedValue, setStoredValue] = useState<T>(initialValueState);
  const [isHydrated, setIsHydrated] = useState(false);
  const isHydratedRef = useRef(false);

  // useLayoutEffect hydrates synchronously before passive effects run. This
  // prevents parent useEffect(s) that write state back to localStorage from
  // seeing the previous key's cached value and copying it into a new key.
  useLayoutEffect(() => {
    isHydratedRef.current = false;
    /* eslint-disable react-hooks/set-state-in-effect */
    setIsHydrated(false);
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      } else {
        setStoredValue(initialValueState);
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      setStoredValue(initialValueState);
    }
    setIsHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    isHydratedRef.current = true;
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
              } catch { /* fall through to error log */ }
            }
          }
        }
        if (!persisted) {
          console.error(`Error setting localStorage key "${key}":`, error);
        }
      }
      return valueToStore;
    });
  }, [key]);

  return [isHydrated ? storedValue : initialValueState, setValue, isHydrated];
}
