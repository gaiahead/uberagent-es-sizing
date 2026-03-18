"use client";

import { SizingInputs, SizingResult } from "@/lib/types";
import { calculateSizing, formatNumber } from "@/lib/calculator";

interface ScenarioComparisonProps {
  currentInputs: SizingInputs;
  currentResult: SizingResult;
}

export default function ScenarioComparison({
  currentInputs,
  currentResult,
}: ScenarioComparisonProps) {
  const unitLabel = currentInputs.environmentType === "single-user" ? "사용자" : "서버";

  const savedRaw =
    typeof window !== "undefined" ? localStorage.getItem("scenario-a") : null;
  const savedScenario: { inputs: SizingInputs; result: SizingResult } | null = savedRaw
    ? JSON.parse(savedRaw)
    : null;

  const handleSave = () => {
    localStorage.setItem(
      "scenario-a",
      JSON.stringify({ inputs: currentInputs, result: currentResult })
    );
    window.dispatchEvent(new Event("storage"));
    window.location.reload();
  };

  const handleClear = () => {
    localStorage.removeItem("scenario-a");
    window.location.reload();
  };

  if (!savedScenario) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">시나리오 비교</h3>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
          >
            현재 설정을 시나리오 A로 저장
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          시나리오 A를 저장한 후 설정을 변경하면 비교할 수 있습니다.
        </p>
      </div>
    );
  }

  const a = savedScenario.result;
  const b = currentResult;

  const rows = [
    { label: `${unitLabel}당 일일 로그`, aVal: `${formatNumber(a.perUserDailyMB)} MB`, bVal: `${formatNumber(b.perUserDailyMB)} MB` },
    { label: "총 일일 수집량", aVal: `${formatNumber(a.totalDailyIngestGB)} GB`, bVal: `${formatNumber(b.totalDailyIngestGB)} GB` },
    { label: "총 스토리지", aVal: `${formatNumber(a.totalStorageTB)} TB`, bVal: `${formatNumber(b.totalStorageTB)} TB` },
    { label: "노드당 디스크", aVal: `${formatNumber(a.diskPerNodeTB)} TB`, bVal: `${formatNumber(b.diskPerNodeTB)} TB` },
    { label: "노드당 일일 쓰기", aVal: `${formatNumber(a.dailyWritePerNodeGB)} GB`, bVal: `${formatNumber(b.dailyWritePerNodeGB)} GB` },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">시나리오 비교</h3>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
          >
            현재 설정으로 A 덮어쓰기
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
          >
            초기화
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 text-gray-500 font-medium">항목</th>
              <th className="text-right py-2 px-3 text-blue-600 font-medium">시나리오 A</th>
              <th className="text-right py-2 px-3 text-purple-600 font-medium">현재 (B)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-gray-100">
                <td className="py-2 px-3 text-gray-700">{row.label}</td>
                <td className="py-2 px-3 text-right font-mono text-gray-900">{row.aVal}</td>
                <td className="py-2 px-3 text-right font-mono text-gray-900">{row.bVal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
