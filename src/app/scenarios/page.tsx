"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useScenario } from "@/context/ScenarioContext";
import { SavedScenario, createDefaultProfile, createDefaultStorage, createDefaultNodeGroup } from "@/lib/types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatGB(gb: number): string {
  return gb.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatTB(tb: number): string {
  return tb.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ScenarioCard({
  scenario,
  isCurrent,
  onLoad,
  onDelete,
  onRename,
}: {
  scenario: SavedScenario;
  isCurrent: boolean;
  onLoad: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(scenario.name);

  const commitRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== scenario.name) {
      onRename(trimmed);
    }
    setEditing(false);
  };

  return (
    <div
      className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow ${
        isCurrent ? "border-blue-400 ring-1 ring-blue-200" : "border-gray-200"
      }`}
    >
      {/* Name */}
      <div className="mb-3">
        {editing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") {
                setEditName(scenario.name);
                setEditing(false);
              }
            }}
            className="text-base font-semibold text-gray-900 border-b-2 border-blue-500 outline-none w-full bg-transparent"
            autoFocus
          />
        ) : (
          <h3
            className="text-base font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => {
              setEditName(scenario.name);
              setEditing(true);
            }}
            title="클릭하여 이름 편집"
          >
            {scenario.name}
            {isCurrent && (
              <span className="ml-2 text-xs font-normal text-blue-500">현재</span>
            )}
          </h3>
        )}
      </div>

      {/* Meta */}
      <div className="text-xs text-gray-500 mb-4 space-y-1">
        <p>{formatDate(scenario.savedAt)}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-600">
          <span>프로파일 {scenario.summary.profileCount}개</span>
          <span>일일 {formatGB(scenario.summary.totalDailyGB)} GB</span>
          <span>총 {formatTB(scenario.summary.totalStorageTB)} TB</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onLoad}
          className="flex-1 px-3 py-1.5 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
        >
          불러오기
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

export default function ScenariosPage() {
  const router = useRouter();
  const {
    scenarios,
    currentScenarioId,
    isDirty,
    loadScenario,
    deleteScenario,
    renameScenario,
    saveScenario,
  } = useScenario();

  const handleLoad = useCallback(
    (id: string) => {
      if (isDirty) {
        const ok = window.confirm(
          "현재 시나리오에 저장되지 않은 변경사항이 있습니다. 계속하시겠습니까?"
        );
        if (!ok) return;
      }
      const data = loadScenario(id);
      if (data) {
        // Store loaded data in sessionStorage for page.tsx to pick up
        sessionStorage.setItem(
          "ua-es-load-scenario",
          JSON.stringify({ id, ...data })
        );
        router.push("/");
      }
    },
    [isDirty, loadScenario, router]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const ok = window.confirm("이 시나리오를 삭제하시겠습니까?");
      if (ok) deleteScenario(id);
    },
    [deleteScenario]
  );

  const handleNewScenario = useCallback(() => {
    if (isDirty) {
      const ok = window.confirm(
        "현재 시나리오에 저장되지 않은 변경사항이 있습니다. 계속하시겠습니까?"
      );
      if (!ok) return;
    }
    // Clear loaded scenario and go back
    sessionStorage.setItem(
      "ua-es-load-scenario",
      JSON.stringify({
        id: null,
        profiles: [createDefaultProfile()],
        storage: createDefaultStorage(),
        nodeGroups: [createDefaultNodeGroup()],
      })
    );
    router.push("/");
  }, [isDirty, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              &#8592; 계산기로
            </Link>
            <h1 className="text-lg font-bold text-gray-900">
              저장된 시나리오
            </h1>
          </div>
          <button
            onClick={handleNewScenario}
            className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            + 새 시나리오
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 py-6">
        {scenarios.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm mb-4">
              저장된 시나리오가 없습니다.
            </p>
            <p className="text-gray-400 text-xs mb-6">
              계산기에서 설정을 구성한 후 저장 버튼을 눌러 시나리오를 만드세요.
            </p>
            <button
              onClick={handleNewScenario}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              새 시나리오 만들기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {scenarios.map((s) => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                isCurrent={s.id === currentScenarioId}
                onLoad={() => handleLoad(s.id)}
                onDelete={() => handleDelete(s.id)}
                onRename={(name) => renameScenario(s.id, name)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
