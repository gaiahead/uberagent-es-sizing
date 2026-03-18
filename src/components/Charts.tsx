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
import { SizingResult, SizingInputs, RetentionScenario } from "@/lib/types";
import { formatNumber } from "@/lib/calculator";

interface WaterfallChartProps {
  result: SizingResult;
  baseMB: number;
}

export function WaterfallChart({ result, baseMB }: WaterfallChartProps) {
  const data = [
    { name: "기준값", value: baseMB, fill: "#6366f1" },
    ...result.multiplierBreakdown.map((m) => ({
      name: `${m.label} (×${m.value})`,
      value: m.cumulative,
      fill: m.value > 1 ? "#ef4444" : m.value < 1 ? "#22c55e" : "#94a3b8",
    })),
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        승수 효과 (기준값 → 최종값)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 120, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v} MB`} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} />
          <RTooltip
            formatter={(value) => [`${formatNumber(Number(value))} MB`, "누적값"]}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface StorageChartProps {
  result: SizingResult;
  inputs: SizingInputs;
}

export function StorageChart({ result, inputs }: StorageChartProps) {
  const hotPrimary = result.totalDailyIngestGB * inputs.hotDays;
  const hotReplicaGB = hotPrimary * inputs.hotReplica;
  const warmDays = Math.max(0, inputs.retentionDays - inputs.hotDays);
  const warmPrimary = result.totalDailyIngestGB * warmDays;
  const warmReplicaGB = warmPrimary * inputs.warmReplica;

  const data = [
    {
      name: "Hot",
      primary: hotPrimary / 1000,
      replica: hotReplicaGB / 1000,
    },
    {
      name: "Warm",
      primary: warmPrimary / 1000,
      replica: warmReplicaGB / 1000,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        스토리지 구성 (TB)
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ left: 10, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v} TB`} />
          <RTooltip
            formatter={(value) => [`${formatNumber(Number(value))} TB`]}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="primary" name="Primary" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
          <Bar dataKey="replica" name="Replica" stackId="a" fill="#93c5fd" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface RetentionChartProps {
  scenarios: RetentionScenario[];
}

export function RetentionChart({ scenarios }: RetentionChartProps) {
  const data = scenarios.map((s) => ({
    name: `${s.days}일`,
    totalStorage: s.totalStorageTB,
    diskPerNode: s.diskPerNodeTB,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        보존 기간별 비교 (TB)
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ left: 10, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v} TB`} />
          <RTooltip
            formatter={(value) => [`${formatNumber(Number(value))} TB`]}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="totalStorage" name="총 스토리지" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="diskPerNode" name="노드당 디스크" fill="#a78bfa" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
