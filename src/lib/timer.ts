"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "sastra-timer";

export interface TimerState {
  isRunning: boolean;
  accumulatedSeconds: number;
  startTime: number | null;
}

export interface TimerSnapshot {
  elapsedSeconds: number;
  isRunning: boolean;
}

function loadTimerState(): TimerState {
  if (typeof window === "undefined") {
    return { isRunning: false, accumulatedSeconds: 0, startTime: null };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.isRunning === "boolean" && typeof parsed.accumulatedSeconds === "number") {
        return {
          isRunning: parsed.isRunning,
          accumulatedSeconds: parsed.accumulatedSeconds,
          startTime: parsed.startTime || null,
        };
      }
    }
  } catch {
    // ignore corrupt storage
  }
  return { isRunning: false, accumulatedSeconds: 0, startTime: null };
}

function saveTimerState(state: TimerState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

function createTimerStore() {
  let state: TimerState = loadTimerState();
  let listeners: (() => void)[] = [];
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let snapshot: TimerSnapshot = { elapsedSeconds: 0, isRunning: false };

  function computeElapsedSeconds(): number {
    if (state.isRunning && state.startTime) {
      return Math.floor(state.accumulatedSeconds + (Date.now() - state.startTime) / 1000);
    }
    return Math.floor(state.accumulatedSeconds);
  }

  function updateSnapshot() {
    snapshot = { elapsedSeconds: computeElapsedSeconds(), isRunning: state.isRunning };
  }

  updateSnapshot();

  function emit() {
    updateSnapshot();
    listeners.forEach((cb) => cb());
  }

  function getSnapshot(): TimerSnapshot {
    return snapshot;
  }

  function tick() {
    if (state.isRunning) {
      saveTimerState(state);
      emit();
    }
  }

  function startLoop() {
    if (intervalId) return;
    intervalId = setInterval(tick, 1000);
  }

  function stopLoop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function start() {
    if (state.isRunning) return;
    state = {
      ...state,
      isRunning: true,
      startTime: Date.now(),
    };
    saveTimerState(state);
    emit();
  }

  function pause() {
    if (!state.isRunning) return;
    const now = Date.now();
    state = {
      ...state,
      isRunning: false,
      startTime: null,
      accumulatedSeconds: state.accumulatedSeconds + (state.startTime ? (now - state.startTime) / 1000 : 0),
    };
    saveTimerState(state);
    emit();
  }

  function reset() {
    state = { isRunning: false, accumulatedSeconds: 0, startTime: null };
    saveTimerState(state);
    emit();
  }

  function subscribe(listener: () => void) {
    listeners = [...listeners, listener];
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }

  return {
    startLoop,
    stopLoop,
    start,
    pause,
    reset,
    getSnapshot,
    subscribe,
  };
}

// Singleton store so the timer keeps running regardless of which tab is mounted.
export const timerStore = createTimerStore();

export function useTimer(): TimerSnapshot & {
  start: () => void;
  pause: () => void;
  reset: () => void;
} {
  const snapshot = useSyncExternalStore(
    timerStore.subscribe,
    timerStore.getSnapshot,
    timerStore.getSnapshot
  );

  return {
    ...snapshot,
    start: timerStore.start,
    pause: timerStore.pause,
    reset: timerStore.reset,
  };
}
