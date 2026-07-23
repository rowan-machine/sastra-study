"use client";

import { useEffect } from "react";
import { timerStore } from "@/lib/timer";

export function TimerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    timerStore.startLoop();
    return () => {
      timerStore.stopLoop();
    };
  }, []);

  return <>{children}</>;
}
