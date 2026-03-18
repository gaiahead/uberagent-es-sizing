"use client";

import { SizingResult, TierStorage } from "@/lib/types";
import { formatNumber } from "@/lib/calculator";

interface Props {
  result: SizingResult;
}

interface TierConfig {
  key: keyof SizingResult["tierStatus"];
  label: string;
  colorClass: string;
  dotClass: string;
}

const TIERS: TierConfig[] = [
  {
    key: "hot",
    label: "Hot",
    colorClass: "text-red-600",
    dotClass: "bg-red-500",
  },
  {
    key: "warm",
    label: "Warm",
    colorClass: "text-yellow-600",
    dotClass: "bg-yellow-400",
  },
  {
    key: "cold",
    label: "Cold",
    colorClass: "text-blue-600",
    dotClass: "bg-blue-500",
  },
  {
    key: "frozen",
    label: "Frozen",
    colorClass: "text-purple-600",
    dotClass: "bg-purple-500",
  },
];

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

type StatusVariant = "ok" | "warn" | "danger" | "unused";

function resolveVariant(tier: TierStorage, required: number): StatusVariant {
  if (required === 0) return "unused";
  if (tier.noNodes || tier.status === "danger") return "danger";
  if (tier.status === "warn") return "warn";
  return "ok";
}

const VARIANT_STYLES: Record<
  StatusVariant,
  { bar: string; badge: string; badgeText: string; cardBorder: string }
> = {
  ok: {
    bar: "bg-green-500",
    badge: "bg-green-100",
    badgeText: "text-green-800",
    cardBorder: "border-gray-200",
  },
  warn: {
    bar: "bg-yellow-400",
    badge: "bg-yellow-100",
    badgeText: "text-yellow-800",
    cardBorder: "border-yellow-200",
  },
  danger: {
    bar: "bg-red-500",
    badge: "bg-red-100",
    badgeText: "text-red-800",
    cardBorder: "border-red-200",
  },
  unused: {
    bar: "bg-gray-200",
    badge: "bg-gray-100",
    badgeText: "text-gray-500",
    cardBorder: "border-gray-200",
  },
};

const VARIANT_LABELS: Record<StatusVariant, string> = {
  ok: "정상",
  warn: "경고",
  danger: "위험",
  unused: "미사용",
};

// ---------------------------------------------------------------------------
// Single TierCard
// ---------------------------------------------------------------------------

interface TierCardProps {
  config: TierConfig;
  tier: TierStorage;
}

function TierCard({ config, tier }: TierCardProps) {
  const required = tier.requiredTB;
  const variant = resolveVariant(tier, required);
  const styles = VARIANT_STYLES[variant];

  // Clamp utilisation bar to [0, 1] for display; can exceed 100% if danger
  const barPercent = Math.min(tier.utilization * 100, 100);

  return (
    <div
      className={[
        "flex flex-col gap-3 rounded-xl border bg-white p-5 shadow-sm",
        styles.cardBorder,
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={["h-2.5 w-2.5 rounded-full", config.dotClass].join(" ")} />
          <span className={["text-sm font-semibold", config.colorClass].join(" ")}>
            {config.label}
          </span>
        </div>
        <span
          className={[
            "rounded-full px-2 py-0.5 text-xs font-medium",
            styles.badge,
            styles.badgeText,
          ].join(" ")}
        >
          {variant === "danger" && tier.noNodes && required > 0
            ? "노드 없음"
            : VARIANT_LABELS[variant]}
        </span>
      </div>

      {/* Body */}
      {variant === "unused" ? (
        <p className="text-sm text-gray-400">이 티어는 사용되지 않습니다.</p>
      ) : (
        <>
          {/* Capacity numbers */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-gray-400">필요 용량</p>
              <p className="font-semibold tabular-nums text-gray-900">
                {formatNumber(required, 2)}{" "}
                <span className="font-normal text-gray-400">TB</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">가용 용량</p>
              <p className="font-semibold tabular-nums text-gray-900">
                {formatNumber(tier.availableTB, 2)}{" "}
                <span className="font-normal text-gray-400">TB</span>
              </p>
            </div>
          </div>

          {/* Utilisation bar */}
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
              <span>사용률</span>
              <span className="tabular-nums font-medium">
                {formatNumber(tier.utilization * 100, 1)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={["h-2 rounded-full transition-all", styles.bar].join(" ")}
                style={{ width: `${barPercent}%` }}
                role="progressbar"
                aria-valuenow={tier.utilization * 100}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            {tier.utilization > 1 && (
              <p className="mt-1 text-xs text-red-600">
                가용 용량 초과 ({formatNumber((tier.utilization - 1) * 100, 1)}% 부족)
              </p>
            )}
          </div>

          {/* No-nodes warning */}
          {tier.noNodes && required > 0 && (
            <p className="text-xs font-medium text-red-600">
              이 티어에 할당된 노드가 없습니다.
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TierCapacityCards (exported)
// ---------------------------------------------------------------------------

export function TierCapacityCards({ result }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {TIERS.map((config) => (
        <TierCard
          key={config.key}
          config={config}
          tier={result.tierStatus[config.key]}
        />
      ))}
    </div>
  );
}
