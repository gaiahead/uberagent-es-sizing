"use client";

import { useState } from "react";
import {
  EndpointProfile,
  StorageConfig,
  NodeGroup,
  SizingResult,
} from "@/lib/types";
import { exportAsMarkdown } from "@/lib/calculator";
import { MetricCards } from "./MetricCards";
import {
  ProfileContributionChart,
  StorageCompositionChart,
  RetentionComparisonChart,
} from "./Charts";
import { TierCapacityCards } from "./TierCapacityCards";
import { NodeConfigTable, RetentionComparisonTable } from "./NodeSummaryTable";

interface Props {
  profiles: EndpointProfile[];
  storage: StorageConfig;
  nodeGroups: NodeGroup[];
  result: SizingResult;
}

export default function ResultsDashboard({
  profiles,
  storage,
  nodeGroups,
  result,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const md = exportAsMarkdown(profiles, storage, nodeGroups, result);
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">결과 대시보드</h2>
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          {copied ? "복사됨!" : "마크다운 복사"}
        </button>
      </div>

      {/* Metric Cards */}
      <MetricCards result={result} />

      {/* Profile Contribution Chart */}
      {result.profileResults.length > 0 && (
        <ProfileContributionChart profileResults={result.profileResults} />
      )}

      {/* Storage Composition Chart */}
      <StorageCompositionChart result={result} />

      {/* Tier Capacity Cards */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          티어별 용량 적합성
        </h3>
        <TierCapacityCards result={result} />
      </div>

      {/* Retention Comparison Chart */}
      <RetentionComparisonChart scenarios={result.retentionScenarios} />

      {/* Retention Comparison Table */}
      <RetentionComparisonTable scenarios={result.retentionScenarios} />

      {/* Node Configuration Summary */}
      <NodeConfigTable nodeGroups={nodeGroups} />
    </div>
  );
}
