"use client";

import { useState, useEffect, useRef } from "react";
import {
  EndpointProfile,
  StorageConfig,
  NodeGroup,
  SizingResult,
} from "@/lib/types";
import { exportAsMarkdown } from "@/lib/calculator";
import { exportAsEmail } from "@/lib/exportEmail";
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
  const [open, setOpen] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const copyToClipboard = async (text: string, itemKey: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedItem(itemKey);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleEmailCopy = async () => {
    const text = exportAsEmail(profiles, storage, nodeGroups, result);
    await copyToClipboard(text, "email");
  };

  const handleMarkdownCopy = async () => {
    const md = exportAsMarkdown(profiles, storage, nodeGroups, result);
    await copyToClipboard(md, "markdown");
  };

  const handlePrint = () => {
    setOpen(false);
    setTimeout(() => window.print(), 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">결과 대시보드</h2>
        <div className="relative print-hide" ref={dropdownRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            📤 내보내기 ▾
          </button>
          {open && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
              <button
                onClick={handleEmailCopy}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
              >
                {copiedItem === "email" ? "✓ 복사됨" : "📧 이메일용 텍스트 복사"}
              </button>
              <button
                onClick={handlePrint}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
              >
                🖨️ PDF 출력
              </button>
              <button
                onClick={handleMarkdownCopy}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
              >
                {copiedItem === "markdown" ? "✓ 복사됨" : "📝 마크다운 복사"}
              </button>
            </div>
          )}
        </div>
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
