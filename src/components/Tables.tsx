"use client";

import { SizingResult, RetentionScenario } from "@/lib/types";
import { formatNumber } from "@/lib/calculator";

interface NodeTableProps {
  result: SizingResult;
}

export function NodeSizingTable({ result }: NodeTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        노드 사이징 참고
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 text-gray-500 font-medium">항목</th>
              <th className="text-right py-2 px-3 text-gray-500 font-medium">값</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-2 px-3 text-gray-700">노드당 일일 쓰기량</td>
              <td className="py-2 px-3 text-right font-mono text-gray-900">
                {formatNumber(result.dailyWritePerNodeGB)} GB
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2 px-3 text-gray-700">
                예상 샤드 수
                {result.estimatedShardCount > 10000 && (
                  <span className="ml-2 inline-block px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                    10,000 초과 — 성능 저하 위험
                  </span>
                )}
              </td>
              <td className="py-2 px-3 text-right font-mono text-gray-900">
                {result.estimatedShardCount.toLocaleString()}
              </td>
            </tr>
            <tr>
              <td className="py-2 px-3 text-gray-700">인덱스 전략 추천</td>
              <td className="py-2 px-3 text-right text-gray-900">{result.indexStrategy}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface RetentionTableProps {
  scenarios: RetentionScenario[];
  dataNodes: number;
}

export function RetentionTable({ scenarios, dataNodes }: RetentionTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        보존 기간별 비교 (30/60/90일)
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 text-gray-500 font-medium">보존 기간</th>
              <th className="text-right py-2 px-3 text-gray-500 font-medium">총 스토리지 (TB)</th>
              <th className="text-right py-2 px-3 text-gray-500 font-medium">노드당 디스크 (TB)</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((s) => (
              <tr key={s.days} className="border-b border-gray-100">
                <td className="py-2 px-3 text-gray-700">{s.days}일</td>
                <td className="py-2 px-3 text-right font-mono text-gray-900">
                  {formatNumber(s.totalStorageTB)}
                </td>
                <td className="py-2 px-3 text-right font-mono text-gray-900">
                  {formatNumber(s.diskPerNodeTB)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-400 mt-2">
          * {dataNodes}개 데이터 노드 기준, 현재 설정의 레플리카/Hot 비율 적용
        </p>
      </div>
    </div>
  );
}
