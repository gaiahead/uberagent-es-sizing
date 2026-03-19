"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import {
  EndpointProfile,
  StorageConfig,
  NodeGroup,
  SavedScenario,
  ScenarioSummary,
  genId,
} from "@/lib/types";
import { useSavedScenarios } from "@/hooks/useSavedScenarios";

interface ScenarioContextValue {
  scenarios: SavedScenario[];
  currentScenarioId: string | null;
  currentScenarioName: string | null;
  isDirty: boolean;
  saveScenario: (
    name: string,
    profiles: EndpointProfile[],
    storage: StorageConfig,
    nodeGroups: NodeGroup[],
    summary: ScenarioSummary
  ) => void;
  loadScenario: (
    id: string
  ) => { profiles: EndpointProfile[]; storage: StorageConfig; nodeGroups: NodeGroup[] } | null;
  deleteScenario: (id: string) => void;
  renameScenario: (id: string, name: string) => void;
  markClean: () => void;
  markDirty: () => void;
}

const ScenarioContext = createContext<ScenarioContextValue | null>(null);

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const { scenarios, currentId, setCurrentId, save, remove, rename, load } =
    useSavedScenarios();
  const [isDirty, setIsDirty] = useState(false);
  const currentNameRef = useRef<string | null>(null);

  // Keep name in sync
  const currentScenario = scenarios.find((s) => s.id === currentId);
  const currentScenarioName = currentScenario?.name ?? currentNameRef.current;

  const saveScenario = useCallback(
    (
      name: string,
      profiles: EndpointProfile[],
      storage: StorageConfig,
      nodeGroups: NodeGroup[],
      summary: ScenarioSummary
    ) => {
      const id = currentId ?? genId();
      const scenario: SavedScenario = {
        id,
        name,
        savedAt: new Date().toISOString(),
        profiles,
        storage,
        nodeGroups,
        summary,
      };
      save(scenario);
      currentNameRef.current = name;
      setIsDirty(false);
    },
    [currentId, save]
  );

  const loadScenario = useCallback(
    (id: string) => {
      const scenario = load(id);
      if (!scenario) return null;
      currentNameRef.current = scenario.name;
      setIsDirty(false);
      return {
        profiles: scenario.profiles,
        storage: scenario.storage,
        nodeGroups: scenario.nodeGroups,
      };
    },
    [load]
  );

  const deleteScenario = useCallback(
    (id: string) => {
      remove(id);
      if (currentId === id) {
        currentNameRef.current = null;
      }
    },
    [remove, currentId]
  );

  const renameScenario = useCallback(
    (id: string, name: string) => {
      rename(id, name);
      if (currentId === id) {
        currentNameRef.current = name;
      }
    },
    [rename, currentId]
  );

  const markClean = useCallback(() => setIsDirty(false), []);
  const markDirty = useCallback(() => setIsDirty(true), []);

  return (
    <ScenarioContext.Provider
      value={{
        scenarios,
        currentScenarioId: currentId,
        currentScenarioName,
        isDirty,
        saveScenario,
        loadScenario,
        deleteScenario,
        renameScenario,
        markClean,
        markDirty,
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenario() {
  const ctx = useContext(ScenarioContext);
  if (!ctx) throw new Error("useScenario must be inside ScenarioProvider");
  return ctx;
}
