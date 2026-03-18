"use client";

import { SizingResult } from "@/lib/types";
import { formatNumber } from "@/lib/calculator";

interface MetricCardsProps {
  result: SizingResult;
  unitLabel: string;
}

function getColorClass(dailyWritePerNode: number): {
  border: string;
  bg: string;
  text: string;
  badge: string;
  badgeText: string;
} {
  if (dailyWritePerNode > 200) {
    return {
      border: "border-red-300",
      bg: "bg-red-50",
      text: "text-red-700",
      badge: "bg-red-100",
      badgeText: "text-red-800",
    };
  }
  if (dailyWritePerNode > 100) {
    return {
      border: "border-yellow-300",
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      badge: "bg-yellow-100",
      badgeText: "text-yellow-800",
    };
  }
  return {
    border: "border-green-200",
    bg: "bg-green-50",
    text: "text-green-700",
    badge: "bg-green-100",
    badgeText: "text-green-800",
  };
}

export default function MetricCards({ result, unitLabel }: MetricCardsProps) {
  const color = getColorClass(result.dailyWritePerNodeGB);

  const cards = [
    {
      label: `${unitLabel}당 일일 로그`,
      value: formatNumber(result.perUserDailyMB),
      unit: "MB",
    },
    {
      label: "총 일일 수집량 (Primary)",
      value: formatNumber(result.totalDailyIngestGB),
      unit: "GB",
    },
    {
      label: "총 스토리지",
      value: formatNumber(result.totalStorageTB),
      unit: "TB",
      sub: "레플리카 + ES 오버헤드 포함",
    },
    {
      label: "노드당 디스크",
      value: formatNumber(result.diskPerNodeTB),
      unit: "TB",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border ${color.border} ${color.bg} p-4 transition-all`}
        >
          <p className="text-xs font-medium text-gray-500 mb-1">{card.label}</p>
          <p className={`text-2xl font-bold ${color.text}`}>
            {card.value}
            <span className="text-sm font-normal ml-1">{card.unit}</span>
          </p>
          {card.sub && (
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
          )}
        </div>
      ))}
      {result.dailyWritePerNodeGB > 100 && (
        <div className="col-span-2 lg:col-span-4">
          <div className={`rounded-lg px-3 py-2 text-xs font-medium ${color.badge} ${color.badgeText}`}>
            {result.dailyWritePerNodeGB > 200
              ? `위험: 노드당 일일 쓰기량 ${formatNumber(result.dailyWritePerNodeGB)} GB — 200 GB 초과. 노드 추가 필요`
              : `경고: 노드당 일일 쓰기량 ${formatNumber(result.dailyWritePerNodeGB)} GB — 100 GB 초과. 노드 추가 검토`}
          </div>
        </div>
      )}
    </div>
  );
}
