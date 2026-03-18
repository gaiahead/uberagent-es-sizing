"use client";

import { StorageConfig, TierConfig } from "@/lib/types";
import Tooltip from "@/components/Tooltip";

interface Props {
  storage: StorageConfig;
  onChange: (s: StorageConfig) => void;
}

type TierKey = "hot" | "warm" | "cold" | "frozen";

interface TierMeta {
  key: TierKey;
  label: string;
  color: string;
  indicatorColor: string;
  daysTooltip: string;
  replicaTooltip: string;
  readOnly?: boolean;
}

const TIERS: TierMeta[] = [
  {
    key: "hot",
    label: "Hot",
    color: "text-red-600",
    indicatorColor: "bg-red-500",
    daysTooltip: "가장 최근 데이터를 저장하는 핫 티어의 보존 기간(일)입니다. SSD 기반으로 빠른 검색이 가능합니다.",
    replicaTooltip: "핫 티어의 레플리카 샤드 수입니다. 1로 설정하면 가용성이 높아지지만 스토리지가 2배 필요합니다.",
  },
  {
    key: "warm",
    label: "Warm",
    color: "text-yellow-600",
    indicatorColor: "bg-yellow-500",
    daysTooltip: "핫 티어 이후 데이터를 저장하는 웜 티어의 보존 기간(일)입니다. 검색 빈도가 낮은 데이터에 적합합니다.",
    replicaTooltip: "웜 티어의 레플리카 샤드 수입니다. 비용과 가용성 사이의 균형을 고려해 설정하세요.",
  },
  {
    key: "cold",
    label: "Cold",
    color: "text-blue-600",
    indicatorColor: "bg-blue-500",
    daysTooltip: "거의 검색하지 않는 데이터를 저장하는 콜드 티어의 보존 기간(일)입니다. 저비용 스토리지를 사용합니다.",
    replicaTooltip: "콜드 티어의 레플리카 샤드 수입니다. 비용 절감을 위해 0으로 설정하는 경우가 많습니다.",
  },
  {
    key: "frozen",
    label: "Frozen",
    color: "text-purple-600",
    indicatorColor: "bg-purple-500",
    daysTooltip: "총 보존 기간에서 Hot + Warm + Cold 기간을 뺀 값으로 자동 계산됩니다. 오브젝트 스토리지를 활용합니다.",
    replicaTooltip: "프로즌 티어의 레플리카 샤드 수입니다. 오브젝트 스토리지 특성상 0을 권장합니다.",
    readOnly: true,
  },
];

export default function ILMStoragePanel({ storage, onChange }: Props) {
  const frozenDays =
    storage.retentionDays - storage.hot.days - storage.warm.days - storage.cold.days;
  const isFrozenNegative = frozenDays < 0;

  function handleRetentionChange(value: number) {
    onChange({ ...storage, retentionDays: value });
  }

  function handleTierDays(key: Exclude<TierKey, "frozen">, value: number) {
    onChange({
      ...storage,
      [key]: { ...storage[key], days: value },
    });
  }

  function handleTierReplica(key: TierKey, value: 0 | 1) {
    onChange({
      ...storage,
      [key]: { ...(storage[key] as TierConfig), replica: value },
    });
  }

  function handleObjectStorage(value: number) {
    onChange({ ...storage, objectStorageTB: value });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {/* Section title */}
      <div className="mb-4 flex items-center gap-2">
        <div className="h-5 w-1 rounded-full bg-blue-500" />
        <h2 className="text-sm font-semibold text-gray-800">ILM 저장소 설정</h2>
      </div>

      {/* Total retention */}
      <div className="mb-4">
        <div className="mb-1 flex items-center gap-1">
          <label className="text-xs font-medium text-gray-700">총 보존 기간 (일)</label>
          <Tooltip text="데이터를 보존할 전체 기간(일)입니다. 각 티어의 합산 기간이 이 값을 초과하지 않아야 합니다." />
        </div>
        <input
          type="number"
          min={1}
          value={storage.retentionDays}
          onChange={(e) => handleRetentionChange(Math.max(1, Number(e.target.value)))}
          className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>

      {/* Divider */}
      <div className="mb-3 border-t border-gray-100" />

      {/* Tier header */}
      <div className="mb-2 grid grid-cols-[1fr_64px_72px] gap-2 text-xs font-medium text-gray-500">
        <span>티어</span>
        <span className="text-center">기간 (일)</span>
        <span className="text-center">레플리카</span>
      </div>

      {/* Tier rows */}
      <div className="flex flex-col gap-2">
        {TIERS.map((tier) => {
          const tierData = storage[tier.key] as TierConfig;
          const isReadOnly = tier.readOnly;
          const displayDays = isReadOnly ? frozenDays : tierData.days;

          return (
            <div key={tier.key} className="grid grid-cols-[1fr_64px_72px] items-center gap-2">
              {/* Tier name */}
              <div className="flex items-center gap-1.5">
                <div className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${tier.indicatorColor}`} />
                <span className={`text-xs font-semibold ${tier.color}`}>{tier.label}</span>
                <Tooltip text={tier.daysTooltip} />
              </div>

              {/* Days input */}
              {isReadOnly ? (
                <div
                  className={`flex h-7 items-center justify-center rounded border px-2 text-xs font-medium ${
                    isFrozenNegative
                      ? "border-red-300 bg-red-50 text-red-700"
                      : "border-gray-200 bg-gray-100 text-gray-600"
                  }`}
                  title={isFrozenNegative ? "티어 기간의 합이 총 보존 기간을 초과합니다" : undefined}
                >
                  {isFrozenNegative ? (
                    <span className="text-xs text-red-600">⚠️ 합계 초과</span>
                  ) : (
                    displayDays
                  )}
                </div>
              ) : (
                <input
                  type="number"
                  min={0}
                  value={tierData.days}
                  onChange={(e) =>
                    handleTierDays(
                      tier.key as Exclude<TierKey, "frozen">,
                      Math.max(0, Number(e.target.value))
                    )
                  }
                  className="h-7 w-full rounded border border-gray-300 bg-white px-2 text-center text-xs text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              )}

              {/* Replica toggle */}
              <div className="flex items-center justify-center gap-0.5">
                <Tooltip text={tier.replicaTooltip} />
                <div className="flex overflow-hidden rounded border border-gray-300">
                  {([0, 1] as const).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleTierReplica(tier.key, val)}
                      className={`h-7 w-8 text-xs font-medium transition-colors ${
                        tierData.replica === val
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="my-3 border-t border-gray-100" />

      {/* Object Storage */}
      <div>
        <div className="mb-1 flex items-center gap-1">
          <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-purple-500" />
          <label className="text-xs font-medium text-gray-700">오브젝트 스토리지 (TB)</label>
          <Tooltip text="프로즌 티어에서 사용할 오브젝트 스토리지 용량(TB)입니다. S3 또는 호환 스토리지를 사용합니다." />
        </div>
        <input
          type="number"
          min={0}
          step={0.1}
          value={storage.objectStorageTB}
          onChange={(e) => handleObjectStorage(Math.max(0, Number(e.target.value)))}
          className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>
    </div>
  );
}
