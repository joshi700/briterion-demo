"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_THRESHOLDS, mergeRules, type EngineConfig } from "./engine";

export type Mode = "mock" | "live";

/** localStorage-backed state. Falls back to the default if storage is unavailable. */
export function useStored<T>(key: string, fallback: T): [T, (v: T) => void, boolean] {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, [key]);

  const set = useCallback(
    (v: T) => {
      setValue(v);
      try {
        localStorage.setItem(key, JSON.stringify(v));
      } catch {}
    },
    [key],
  );

  return [value, set, ready];
}

export function useEngineConfig(): [EngineConfig, (c: EngineConfig) => void, boolean] {
  const [stored, set, ready] = useStored<EngineConfig | null>("brighterion.config", null);
  const config: EngineConfig = {
    rules: mergeRules(stored?.rules),
    thresholds: stored?.thresholds ?? DEFAULT_THRESHOLDS,
  };
  return [config, set, ready];
}

export function useMode() {
  return useStored<Mode>("brighterion.mode", "mock");
}
