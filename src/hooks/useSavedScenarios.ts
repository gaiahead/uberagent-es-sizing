"use client";

import { useState, useCallback, useEffect } from "react";
import { SavedScenario } from "@/lib/types";

const STORAGE_KEY = "ua-es-sizing-scenarios";

function readScenarios(): SavedScenario[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeScenarios(scenarios: SavedScenario[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
}

export function useSavedScenarios() {
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    setScenarios(readScenarios());
  }, []);

  const save = useCallback(
    (scenario: SavedScenario) => {
      setScenarios((prev) => {
        const idx = prev.findIndex((s) => s.id === scenario.id);
        const next = idx >= 0
          ? prev.map((s) => (s.id === scenario.id ? scenario : s))
          : [...prev, scenario];
        writeScenarios(next);
        return next;
      });
      setCurrentId(scenario.id);
    },
    []
  );

  const remove = useCallback(
    (id: string) => {
      setScenarios((prev) => {
        const next = prev.filter((s) => s.id !== id);
        writeScenarios(next);
        return next;
      });
      setCurrentId((prev) => (prev === id ? null : prev));
    },
    []
  );

  const rename = useCallback(
    (id: string, name: string) => {
      setScenarios((prev) => {
        const next = prev.map((s) =>
          s.id === id ? { ...s, name } : s
        );
        writeScenarios(next);
        return next;
      });
    },
    []
  );

  const load = useCallback(
    (id: string): SavedScenario | undefined => {
      const all = readScenarios();
      const found = all.find((s) => s.id === id);
      if (found) setCurrentId(id);
      return found;
    },
    []
  );

  const getAll = useCallback((): SavedScenario[] => {
    return readScenarios();
  }, []);

  return { scenarios, currentId, setCurrentId, save, remove, rename, load, getAll };
}
