"use client";

import { SizingResult } from "@/lib/types";
import { formatNumber } from "@/lib/calculator";

interface Props {
  result: SizingResult;
}

interface MetricCardProps {
  title: string;
  value: string;
  unit?: string;
  secondary?: string;
  isEmpty?: boolean;
  emptyLabel?: string;
  accent?: boolean;
}

function MetricCard({
  title,
  value,
  unit,
  secondary,
  isEmpty = false,
  emptyLabel = "미사용",
  accent = false,
}: MetricCardProps) {
  return (
    <div
      className={[
        "flex flex-col gap-2 rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
        accent ? "border-blue-200 ring-1 ring-blue-100" : "border-gray-200",
      ].join(" ")}
    >
      <p className="text-sm font-medium leading-tight text-gray-500">{title}</p>

      {isEmpty ? (
        <p className="text-2xl font-semibold text-gray-400">{emptyLabel}</p>
      ) : (
        <div className="flex items-end gap-1.5">
          <span
            className={[
              "tabular-nums text-3xl font-bold",
              accent ? "text-blue-600" : "text-gray-900",
            ].join(" ")}
          >
            {value}
          </span>
          {unit && (
            <span className="mb-0.5 text-base font-medium text-gray-400">{unit}</span>
          )}
        </div>
      )}

      {secondary && !isEmpty && (
        <p className="text-xs text-gray-400">{secondary}</p>
      )}
    </div>
  );
}

export function MetricCards({ result }: Props) {
  const objStorageIsZero = result.requiredObjStorageTB === 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        title="총 일일 인입량"
        value={formatNumber(result.totalDailyGB, 2)}
        unit="GB/day"
        secondary={`${formatNumber(result.totalDailyMB, 0)} MB/day`}
        accent
      />

      <MetricCard
        title="총 저장량"
        value={formatNumber(result.totalStorageTB, 2)}
        unit="TB"
        secondary="레플리카 + 오버헤드 포함"
      />

      <MetricCard
        title="Hot 저장량"
        value={formatNumber(result.tierStatus.hot.requiredTB, 2)}
        unit="TB"
        secondary={`가용: ${formatNumber(result.tierStatus.hot.availableTB, 2)} TB`}
      />

      <MetricCard
        title="오브젝트 스토리지 필요량"
        value={formatNumber(result.requiredObjStorageTB, 2)}
        unit="TB"
        isEmpty={objStorageIsZero}
        emptyLabel="미사용"
        secondary={
          !objStorageIsZero ? `Frozen ${result.frozenDays}일 보존` : undefined
        }
      />
    </div>
  );
}
