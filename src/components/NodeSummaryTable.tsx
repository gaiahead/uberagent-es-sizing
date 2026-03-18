"use client";

import { NodeGroup, NodeRole, RetentionScenario, ROLE_LABELS } from "@/lib/types";
import { formatNumber } from "@/lib/calculator";

// ---------------------------------------------------------------------------
// Shared table primitives
// ---------------------------------------------------------------------------

function Th({ children, right = false }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      scope="col"
      className={[
        "whitespace-nowrap border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500",
        right ? "text-right" : "text-left",
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  right = false,
  muted = false,
}: {
  children: React.ReactNode;
  right?: boolean;
  muted?: boolean;
}) {
  return (
    <td
      className={[
        "whitespace-nowrap px-4 py-3 text-sm",
        right ? "text-right tabular-nums" : "text-left",
        muted ? "text-gray-400" : "text-gray-800",
      ].join(" ")}
    >
      {children}
    </td>
  );
}

// ---------------------------------------------------------------------------
// A) NodeConfigTable
// ---------------------------------------------------------------------------

interface NodeConfigTableProps {
  nodeGroups: NodeGroup[];
}

function roleLabel(role: NodeRole): string {
  return ROLE_LABELS[role] ?? role;
}

export function NodeConfigTable({ nodeGroups }: NodeConfigTableProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-700">노드 구성 요약</h3>
        <p className="mt-0.5 text-xs text-gray-400">
          클러스터에 정의된 모든 노드 그룹
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th>그룹명</Th>
              <Th>역할</Th>
              <Th right>수량</Th>
              <Th right>vCPU × 수량</Th>
              <Th right>RAM × 수량</Th>
              <Th right>Disk × 수량</Th>
              <Th>유형</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {nodeGroups.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-gray-400"
                >
                  정의된 노드 그룹이 없습니다.
                </td>
              </tr>
            ) : (
              nodeGroups.map((group) => {
                const totalVcpu = group.vcpu * group.count;
                const totalRamGB = group.ramGB * group.count;
                const totalDiskTB = group.diskTB * group.count;

                return (
                  <tr
                    key={group.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <Td>
                      <span className="font-medium text-gray-900">{group.name}</span>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {group.roles.map((role) => (
                          <span
                            key={role}
                            className="inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                          >
                            {roleLabel(role)}
                          </span>
                        ))}
                      </div>
                    </Td>
                    <Td right>{group.count}</Td>
                    <Td right>
                      {group.vcpu} × {group.count}{" "}
                      <span className="text-gray-400">= {totalVcpu}</span>
                    </Td>
                    <Td right>
                      {formatNumber(group.ramGB, 0)} GB × {group.count}{" "}
                      <span className="text-gray-400">
                        = {formatNumber(totalRamGB, 0)} GB
                      </span>
                    </Td>
                    <Td right>
                      {formatNumber(group.diskTB, 2)} TB × {group.count}{" "}
                      <span className="text-gray-400">
                        = {formatNumber(totalDiskTB, 2)} TB
                      </span>
                    </Td>
                    <Td>
                      <span
                        className={[
                          "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                          group.storageType === "ssd"
                            ? "bg-sky-50 text-sky-700"
                            : "bg-amber-50 text-amber-700",
                        ].join(" ")}
                      >
                        {group.storageType.toUpperCase()}
                      </span>
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// B) RetentionComparisonTable
// ---------------------------------------------------------------------------

interface RetentionComparisonTableProps {
  scenarios: RetentionScenario[];
}

const TARGET_DAYS = [30, 180, 365];

const TIER_HEADER_COLORS: Record<string, string> = {
  hot: "text-red-600",
  warm: "text-yellow-600",
  cold: "text-blue-600",
  frozen: "text-purple-600",
};

export function RetentionComparisonTable({
  scenarios,
}: RetentionComparisonTableProps) {
  const filtered = TARGET_DAYS.map(
    (d) => scenarios.find((s) => s.days === d) ?? null
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-700">보존 기간별 저장량 비교</h3>
        <p className="mt-0.5 text-xs text-gray-400">30일 / 180일 / 365일 시나리오</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th>보존 기간</Th>
              <Th right>총 저장량 (TB)</Th>
              <Th right>
                <span className={TIER_HEADER_COLORS.hot}>Hot (TB)</span>
              </Th>
              <Th right>
                <span className={TIER_HEADER_COLORS.warm}>Warm (TB)</span>
              </Th>
              <Th right>
                <span className={TIER_HEADER_COLORS.cold}>Cold (TB)</span>
              </Th>
              <Th right>
                <span className={TIER_HEADER_COLORS.frozen}>Frozen (TB)</span>
              </Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((scenario, idx) => {
              const days = TARGET_DAYS[idx];

              if (!scenario) {
                return (
                  <tr key={days} className="transition-colors hover:bg-gray-50">
                    <Td>
                      <span className="font-medium text-gray-900">{days}일</span>
                    </Td>
                    <Td right muted>
                      —
                    </Td>
                    <Td right muted>
                      —
                    </Td>
                    <Td right muted>
                      —
                    </Td>
                    <Td right muted>
                      —
                    </Td>
                    <Td right muted>
                      —
                    </Td>
                  </tr>
                );
              }

              return (
                <tr key={days} className="transition-colors hover:bg-gray-50">
                  <Td>
                    <span className="font-medium text-gray-900">{days}일</span>
                  </Td>
                  <Td right>
                    <span className="font-semibold text-gray-900">
                      {formatNumber(scenario.totalStorageTB, 2)}
                    </span>
                  </Td>
                  <Td right>
                    <span className="text-red-700">
                      {formatNumber(scenario.hotTB, 2)}
                    </span>
                  </Td>
                  <Td right>
                    <span
                      className={
                        scenario.warmTB === 0 ? "text-gray-400" : "text-yellow-700"
                      }
                    >
                      {scenario.warmTB === 0
                        ? "—"
                        : formatNumber(scenario.warmTB, 2)}
                    </span>
                  </Td>
                  <Td right>
                    <span
                      className={
                        scenario.coldTB === 0 ? "text-gray-400" : "text-blue-700"
                      }
                    >
                      {scenario.coldTB === 0
                        ? "—"
                        : formatNumber(scenario.coldTB, 2)}
                    </span>
                  </Td>
                  <Td right>
                    <span
                      className={
                        scenario.frozenTB === 0 ? "text-gray-400" : "text-purple-700"
                      }
                    >
                      {scenario.frozenTB === 0
                        ? "—"
                        : formatNumber(scenario.frozenTB, 2)}
                    </span>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
