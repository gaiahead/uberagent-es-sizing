"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  EndpointProfile,
  StorageConfig,
  NodeGroup,
  createDefaultProfile,
  createDefaultStorage,
  createDefaultNodeGroup,
  genId,
} from "@/lib/types";
import { calculateSizing } from "@/lib/calculator";
import { EndpointProfileCard } from "@/components/EndpointProfileCard";
import ILMStoragePanel from "@/components/ILMStoragePanel";
import NodeGroupCard from "@/components/NodeGroupCard";
import ResultsDashboard from "@/components/ResultsDashboard";

export default function Home() {
  // ── State ──
  const [profiles, setProfiles] = useState<EndpointProfile[]>([
    createDefaultProfile(),
  ]);
  const [storage, setStorage] = useState<StorageConfig>(createDefaultStorage());
  const [nodeGroups, setNodeGroups] = useState<NodeGroup[]>([
    createDefaultNodeGroup(),
  ]);

  // ── Debounce ──
  const [debouncedState, setDebouncedState] = useState({
    profiles,
    storage,
    nodeGroups,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedState({ profiles, storage, nodeGroups });
    }, 200);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [profiles, storage, nodeGroups]);

  // ── Calculation ──
  const result = useMemo(
    () =>
      calculateSizing(
        debouncedState.profiles,
        debouncedState.storage,
        debouncedState.nodeGroups
      ),
    [debouncedState]
  );

  // ── Profile handlers ──
  const updateProfile = useCallback(
    (id: string, updated: EndpointProfile) => {
      setProfiles((prev) => prev.map((p) => (p.id === id ? updated : p)));
    },
    []
  );

  const deleteProfile = useCallback((id: string) => {
    setProfiles((prev) => {
      const next = prev.filter((p) => p.id !== id);
      return next.length === 0 ? [createDefaultProfile()] : next;
    });
  }, []);

  const addProfile = useCallback(() => {
    setProfiles((prev) => [...prev, createDefaultProfile()]);
  }, []);

  // ── Node group handlers ──
  const updateNodeGroup = useCallback(
    (id: string, updated: NodeGroup) => {
      setNodeGroups((prev) => prev.map((g) => (g.id === id ? updated : g)));
    },
    []
  );

  const deleteNodeGroup = useCallback((id: string) => {
    setNodeGroups((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const addNodeGroup = useCallback(() => {
    setNodeGroups((prev) => [...prev, createDefaultNodeGroup()]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              uberAgent + Elasticsearch Sizing Calculator
            </h1>
            <p className="text-xs text-gray-500">
              Citrix uberAgent + Elasticsearch 배포 용량 산정
            </p>
          </div>
          <span className="text-xs text-gray-400 hidden sm:block">
            v7.5.x 기준
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── Left Panel ── */}
          <div className="lg:col-span-4 xl:col-span-4">
            <div className="lg:sticky lg:top-16 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto space-y-6 pb-4">
              {/* Endpoint Profiles */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
                    엔드포인트 프로파일
                  </h2>
                  <button
                    onClick={addProfile}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                  >
                    + 프로파일 추가
                  </button>
                </div>
                <div className="space-y-3">
                  {profiles.map((profile, idx) => (
                    <EndpointProfileCard
                      key={profile.id}
                      profile={profile}
                      onChange={(p) => updateProfile(profile.id, p)}
                      onDelete={() => deleteProfile(profile.id)}
                      defaultExpanded={idx === 0 && profiles.length === 1}
                    />
                  ))}
                </div>
              </div>

              {/* ILM Storage */}
              <ILMStoragePanel storage={storage} onChange={setStorage} />

              {/* Node Groups */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
                    노드 구성
                  </h2>
                  <button
                    onClick={addNodeGroup}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                  >
                    + 노드 그룹 추가
                  </button>
                </div>
                <div className="space-y-3">
                  {nodeGroups.map((group, idx) => (
                    <NodeGroupCard
                      key={group.id}
                      group={group}
                      onChange={(g) => updateNodeGroup(group.id, g)}
                      onDelete={() => deleteNodeGroup(group.id)}
                      defaultExpanded={idx === 0 && nodeGroups.length === 1}
                    />
                  ))}
                  {nodeGroups.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">
                      노드 그룹을 추가하세요.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Panel ── */}
          <div className="lg:col-span-8 xl:col-span-8">
            <ResultsDashboard
              profiles={debouncedState.profiles}
              storage={debouncedState.storage}
              nodeGroups={debouncedState.nodeGroups}
              result={result}
            />
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
          <p className="font-semibold mb-1">&#9888;&#65039; 주의사항</p>
          <p>
            본 계산기의 수치는 Citrix 공식 문서(7.5.x) 기준값과 경험적 보정계수를
            기반으로 한 추정치입니다. 실제 데이터량은 사용 환경에 따라 크게 달라질
            수 있으며, 정확한 사이징을 위해서는 PoC 환경에서 uberAgent Data Volume
            대시보드를 통한 실측을 권장합니다.
          </p>
          <p className="mt-2">
            기준값 출처:{" "}
            <a
              href="https://docs.citrix.com/en-us/uberagent/7-5-x/planning/data-volume-calculation"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-amber-900"
            >
              https://docs.citrix.com/en-us/uberagent/7-5-x/planning/data-volume-calculation
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
