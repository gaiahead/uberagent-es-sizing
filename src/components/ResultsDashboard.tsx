"use client";

import { SizingInputs, SizingResult, RetentionScenario } from "@/lib/types";
import { exportAsMarkdown } from "@/lib/calculator";
import MetricCards from "./MetricCards";
import { WaterfallChart, StorageChart, RetentionChart } from "./Charts";
import { NodeSizingTable, RetentionTable } from "./Tables";
import { useState } from "react";

interface ResultsDashboardProps {
  inputs: SizingInputs;
  result: SizingResult;
  retentionScenarios: RetentionScenario[];
}

export default function ResultsDashboard({
  inputs,
  result,
  retentionScenarios,
}: ResultsDashboardProps) {
  const [copied, setCopied] = useState(false);
  const unitLabel = inputs.environmentType === "single-user" ? "사용자" : "서버";
  const baseMB = inputs.environmentType === "single-user" ? 25 : 90;

  const handleCopy = async () => {
    const md = exportAsMarkdown(inputs, result);
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">결과 대시보드</h2>
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          {copied ? "복사됨!" : "마크다운 복사"}
        </button>
      </div>

      <MetricCards result={result} unitLabel={unitLabel} />

      <WaterfallChart result={result} baseMB={baseMB} />
      <StorageChart result={result} inputs={inputs} />
      <RetentionChart scenarios={retentionScenarios} />

      <NodeSizingTable result={result} />
      <RetentionTable scenarios={retentionScenarios} dataNodes={inputs.dataNodes} />
    </div>
  );
}
