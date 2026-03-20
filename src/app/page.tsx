"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
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
import { useScenario } from "@/context/ScenarioContext";
import { encodeState, decodeState } from "@/lib/share";

export default function Home() {
  // ── Scenario ──
  const scenario = useScenario();
  const [savingName, setSavingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [shareLabel, setShareLabel] = useState("🔗 공유");

  // ── State ──
  const [profiles, setProfiles] = useState<EndpointProfile[]>([
    createDefaultProfile(),
  ]);
  const [storage, setStorage] = useState<StorageConfig>(createDefaultStorage());
  const [nodeGroups, setNodeGroups] = useState<NodeGroup[]>([
    createDefaultNodeGroup(),
  ]);

  // Pick up shared state from URL ?s= parameter (takes priority)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("s");
    if (s) {
      const decoded = decodeState(s);
      if (decoded) {
        setProfiles(decoded.profiles);
        setStorage(decoded.storage);
        setNodeGroups(decoded.nodeGroups);
      }
      // Remove ?s= from URL
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    // Otherwise pick up loaded scenario from sessionStorage (set by scenarios page)
    const raw = sessionStorage.getItem("ua-es-load-scenario");
    if (!raw) return;
    sessionStorage.removeItem("ua-es-load-scenario");
    try {
      const data = JSON.parse(raw);
      if (data.profiles) setProfiles(data.profiles);
      if (data.storage) setStorage(data.storage);
      if (data.nodeGroups) setNodeGroups(data.nodeGroups);
    } catch {
      // ignore
    }
  }, []);

  // Mark dirty on state change (skip initial render)
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) {
      scenario.markDirty();
    } else {
      initialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles, storage, nodeGroups]);

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

  // ── Scenario handlers ──
  const handleSave = useCallback(() => {
    if (scenario.currentScenarioName) {
      // Overwrite existing
      scenario.saveScenario(
        scenario.currentScenarioName,
        profiles,
        storage,
        nodeGroups,
        {
          totalDailyGB: result.totalDailyGB,
          totalStorageTB: result.totalStorageTB,
          profileCount: profiles.length,
        }
      );
    } else {
      setSavingName(true);
      setNameInput("");
    }
  }, [scenario, profiles, storage, nodeGroups, result]);

  const confirmSave = useCallback(() => {
    const name = nameInput.trim();
    if (!name) return;
    scenario.saveScenario(name, profiles, storage, nodeGroups, {
      totalDailyGB: result.totalDailyGB,
      totalStorageTB: result.totalStorageTB,
      profileCount: profiles.length,
    });
    setSavingName(false);
  }, [nameInput, scenario, profiles, storage, nodeGroups, result]);

  const handleShare = useCallback(async () => {
    const encoded = encodeState(profiles, storage, nodeGroups);
    const url = `${window.location.origin}${window.location.pathname}?s=${encoded}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareLabel("✓ 복사됨");
      setTimeout(() => setShareLabel("🔗 공유"), 2000);
    } catch {
      // Fallback: prompt with URL
      prompt("공유 URL:", url);
    }
  }, [profiles, storage, nodeGroups]);

  // Expose state setters for scenario loading (called from scenarios page via context)
  // We store the setters in a ref so ScenarioContext can call them
  const stateSettersRef = useRef({ setProfiles, setStorage, setNodeGroups });
  stateSettersRef.current = { setProfiles, setStorage, setNodeGroups };

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
          <div className="flex items-center gap-3 print-hide">
            <span className="text-xs text-gray-400 hidden sm:inline">
              {scenario.currentScenarioName ? (
                <>
                  <span className="text-gray-700 font-medium">{scenario.currentScenarioName}</span>
                  {scenario.isDirty && <span className="text-amber-500 ml-1">*</span>}
                </>
              ) : (
                <span className="text-gray-400">저장되지 않음</span>
              )}
            </span>
            {savingName ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmSave();
                    if (e.key === "Escape") setSavingName(false);
                  }}
                  placeholder="시나리오 이름"
                  className="px-2 py-1 text-xs border border-gray-300 rounded-md w-36 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={confirmSave}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  확인
                </button>
                <button
                  onClick={() => setSavingName(false)}
                  className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                onClick={handleSave}
                title="저장"
                className="px-3 py-1.5 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
              >
                &#128190; 저장
              </button>
            )}
            <button
              onClick={handleShare}
              title="현재 설정을 URL로 공유"
              className="px-3 py-1.5 text-xs font-medium bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
            >
              {shareLabel}
            </button>
            <Link
              href="/scenarios"
              className="px-3 py-1.5 text-xs font-medium bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
            >
              &#128194; 시나리오
            </Link>
            <span className="text-xs text-gray-400 hidden sm:inline">
              v7.5.x 기준
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── Left Panel ── */}
          <div className="lg:col-span-4 xl:col-span-4 print-hide">
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
          <div className="lg:col-span-8 xl:col-span-8 print-full">
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
