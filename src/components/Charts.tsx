"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ProfileResult, RetentionScenario, SizingResult } from "@/lib/types";
import { formatNumber } from "@/lib/calculator";

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

const TIER_COLORS = {
  hot: "#ef4444",
  warm: "#eab308",
  cold: "#3b82f6",
  frozen: "#a855f7",
} as const;

const CHART_STYLE = {
  fontFamily: "inherit",
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  padding: "8px 12px",
} as const;

const TOOLTIP_CONTENT_STYLE = {
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
};

// ---------------------------------------------------------------------------
// ProfileContributionChart
// ---------------------------------------------------------------------------

interface ProfileContributionChartProps {
  profileResults: ProfileResult[];
}

export function ProfileContributionChart({
  profileResults,
}: ProfileContributionChartProps) {
  const data = profileResults.map((p) => ({
    name: p.name,
    dailyGB: p.dailyGB,
  }));

  // Generate a deterministic pastel color per profile index
  const PROFILE_COLORS = [
    "#6366f1",
    "#0ea5e9",
    "#10b981",
    "#f59e0b",
    "#ec4899",
    "#8b5cf6",
    "#14b8a6",
    "#f97316",
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        프로파일별 일일 인입량 (GB/day)
      </h3>
      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 44)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 40, bottom: 4, left: 16 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickFormatter={(v) => `${formatNumber(Number(v), 1)} GB`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 12, fill: "#374151" }}
            width={140}
            axisLine={false}
            tickLine={false}
          />
          <RTooltip
            contentStyle={TOOLTIP_CONTENT_STYLE}
            formatter={(value) => [
              `${formatNumber(Number(value), 2)} GB/day`,
              "일일 인입량",
            ]}
          />
          <Bar dataKey="dailyGB" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={PROFILE_COLORS[index % PROFILE_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StorageCompositionChart
// ---------------------------------------------------------------------------

interface StorageCompositionChartProps {
  result: SizingResult;
}

export function StorageCompositionChart({ result }: StorageCompositionChartProps) {
  const hotTB = result.hotStorageGB / 1024;
  const warmTB = result.warmStorageGB / 1024;
  const coldTB = result.coldStorageGB / 1024;
  const frozenTB = result.frozenStorageGB / 1024;

  const data = [
    {
      name: "스토리지 구성",
      hot: hotTB,
      warm: warmTB,
      cold: coldTB,
      frozen: frozenTB,
    },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        티어별 스토리지 구성 (TB)
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 40, bottom: 4, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "#374151" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickFormatter={(v) => `${formatNumber(Number(v), 1)} TB`}
            axisLine={false}
            tickLine={false}
          />
          <RTooltip
            contentStyle={TOOLTIP_CONTENT_STYLE}
            formatter={(value, name) => {
              const labels: Record<string, string> = {
                hot: "Hot",
                warm: "Warm",
                cold: "Cold",
                frozen: "Frozen",
              };
              return [
                `${formatNumber(Number(value), 2)} TB`,
                labels[name as string] ?? String(name),
              ];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => {
              const labels: Record<string, string> = {
                hot: "Hot",
                warm: "Warm",
                cold: "Cold",
                frozen: "Frozen",
              };
              return labels[value] ?? value;
            }}
          />
          <Bar
            dataKey="hot"
            stackId="a"
            fill={TIER_COLORS.hot}
            radius={[0, 0, 0, 0]}
            maxBarSize={80}
          />
          <Bar
            dataKey="warm"
            stackId="a"
            fill={TIER_COLORS.warm}
            radius={[0, 0, 0, 0]}
            maxBarSize={80}
          />
          <Bar
            dataKey="cold"
            stackId="a"
            fill={TIER_COLORS.cold}
            radius={[0, 0, 0, 0]}
            maxBarSize={80}
          />
          <Bar
            dataKey="frozen"
            stackId="a"
            fill={TIER_COLORS.frozen}
            radius={[4, 4, 0, 0]}
            maxBarSize={80}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RetentionComparisonChart
// ---------------------------------------------------------------------------

interface RetentionComparisonChartProps {
  scenarios: RetentionScenario[];
}

export function RetentionComparisonChart({
  scenarios,
}: RetentionComparisonChartProps) {
  const targetDays = [30, 180, 365];
  const filtered = scenarios.filter((s) => targetDays.includes(s.days));

  const data = filtered.map((s) => ({
    name: `${s.days}일`,
    hot: s.hotTB,
    warm: s.warmTB,
    cold: s.coldTB,
    frozen: s.frozenTB,
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        보존 기간별 스토리지 비교 (TB)
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 4, right: 40, bottom: 4, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "#374151" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickFormatter={(v) => `${formatNumber(Number(v), 1)} TB`}
            axisLine={false}
            tickLine={false}
          />
          <RTooltip
            contentStyle={TOOLTIP_CONTENT_STYLE}
            formatter={(value, name) => {
              const labels: Record<string, string> = {
                hot: "Hot",
                warm: "Warm",
                cold: "Cold",
                frozen: "Frozen",
              };
              return [
                `${formatNumber(Number(value), 2)} TB`,
                labels[name as string] ?? String(name),
              ];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => {
              const labels: Record<string, string> = {
                hot: "Hot",
                warm: "Warm",
                cold: "Cold",
                frozen: "Frozen",
              };
              return labels[value] ?? value;
            }}
          />
          <Bar dataKey="hot" name="hot" fill={TIER_COLORS.hot} radius={[0, 0, 0, 0]} maxBarSize={40} />
          <Bar dataKey="warm" name="warm" fill={TIER_COLORS.warm} radius={[0, 0, 0, 0]} maxBarSize={40} />
          <Bar dataKey="cold" name="cold" fill={TIER_COLORS.cold} radius={[0, 0, 0, 0]} maxBarSize={40} />
          <Bar dataKey="frozen" name="frozen" fill={TIER_COLORS.frozen} radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
