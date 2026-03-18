"use client";

import { useState, useCallback } from "react";
import {
  NodeGroup,
  NodeRole,
  ALL_ROLES,
  ROLE_LABELS,
  ROLE_DEFAULTS,
} from "@/lib/types";
import Tooltip from "@/components/Tooltip";

interface Props {
  group: NodeGroup;
  onChange: (g: NodeGroup) => void;
  onDelete: () => void;
  defaultExpanded?: boolean;
}

const ROLE_COLORS: Record<NodeRole, string> = {
  master: "bg-purple-100 text-purple-700",
  data_hot: "bg-red-100 text-red-700",
  data_warm: "bg-orange-100 text-orange-700",
  data_cold: "bg-blue-100 text-blue-700",
  data_frozen: "bg-cyan-100 text-cyan-700",
  "coord+ingest": "bg-green-100 text-green-700",
  ml: "bg-pink-100 text-pink-700",
  kibana: "bg-indigo-100 text-indigo-700",
  fleet: "bg-teal-100 text-teal-700",
};

const FIELD_TOOLTIPS = {
  name: "이 노드 그룹의 이름을 입력하세요.",
  roles:
    "노드가 수행할 역할을 선택하세요. 여러 역할을 동시에 선택할 수 있습니다.",
  count: "이 그룹에 포함될 노드의 수를 입력하세요.",
  vcpu: "노드당 가상 CPU 코어 수를 입력하세요.",
  ramGB: "노드당 RAM 용량(GB)을 입력하세요.",
  diskTB: "노드당 디스크 용량(TB)을 입력하세요.",
  storageType: "스토리지 유형을 선택하세요. SSD는 고성능, HDD는 대용량에 적합합니다.",
};

function pickBestDefaults(roles: NodeRole[]) {
  if (roles.length === 0) return null;

  // Prioritize data_* roles, then pick highest ramGB
  const dataRoles = roles.filter((r) => r.startsWith("data_"));
  const candidates = dataRoles.length > 0 ? dataRoles : roles;

  let best = candidates[0];
  for (const role of candidates) {
    if (ROLE_DEFAULTS[role].ramGB > ROLE_DEFAULTS[best].ramGB) {
      best = role;
    }
  }
  return ROLE_DEFAULTS[best];
}

export default function NodeGroupCard({
  group,
  onChange,
  onDelete,
  defaultExpanded = false,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [specsManuallyChanged, setSpecsManuallyChanged] = useState(false);

  const update = useCallback(
    (patch: Partial<NodeGroup>) => {
      onChange({ ...group, ...patch });
    },
    [group, onChange]
  );

  const handleRoleToggle = useCallback(
    (role: NodeRole) => {
      const currentRoles = group.roles;
      const isSelected = currentRoles.includes(role);
      const newRoles = isSelected
        ? currentRoles.filter((r) => r !== role)
        : [...currentRoles, role];

      if (newRoles.length === 0) {
        update({ roles: newRoles });
        return;
      }

      if (!specsManuallyChanged) {
        const defaults = pickBestDefaults(newRoles);
        if (defaults) {
          update({
            roles: newRoles,
            vcpu: defaults.vcpu,
            ramGB: defaults.ramGB,
            diskTB: defaults.diskTB,
            storageType: defaults.storageType,
          });
          return;
        }
      }

      update({ roles: newRoles });
    },
    [group.roles, specsManuallyChanged, update]
  );

  const handleSpecChange = useCallback(
    (patch: Partial<NodeGroup>) => {
      setSpecsManuallyChanged(true);
      update(patch);
    },
    [update]
  );

  const storageTypeBadge =
    group.storageType === "ssd"
      ? "bg-orange-100 text-orange-700"
      : "bg-gray-100 text-gray-600";

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
        {/* Expand/collapse button */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex-none flex items-center justify-center w-6 h-6 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
          aria-label={expanded ? "접기" : "펼치기"}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-90" : "rotate-0"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Group name */}
        <span className="font-semibold text-gray-800 text-sm truncate min-w-0 flex-shrink">
          {group.name || "이름 없는 그룹"}
        </span>

        {/* Role badges */}
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {group.roles.map((role) => (
            <span
              key={role}
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[role]}`}
            >
              {ROLE_LABELS[role]}
            </span>
          ))}
        </div>

        {/* Node count */}
        <span className="flex-none text-sm text-gray-500 whitespace-nowrap">
          {group.count}
          <span className="text-gray-400 ml-0.5">노드</span>
        </span>

        {/* Storage type badge */}
        <span
          className={`flex-none inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${storageTypeBadge}`}
        >
          {group.storageType}
        </span>

        {/* Delete button */}
        <button
          type="button"
          onClick={onDelete}
          className="flex-none flex items-center justify-center w-6 h-6 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          aria-label="노드 그룹 삭제"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 py-4 space-y-4">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                그룹 이름
              </label>
              <Tooltip text={FIELD_TOOLTIPS.name} />
            </div>
            <input
              type="text"
              value={group.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="예: Hot Data Nodes"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Roles */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                역할
              </label>
              <Tooltip text={FIELD_TOOLTIPS.roles} />
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map((role) => {
                const selected = group.roles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleToggle(role)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 select-none
                      ${
                        selected
                          ? `${ROLE_COLORS[role]} border-current shadow-sm`
                          : "bg-white text-gray-500 border-gray-300 hover:border-gray-400 hover:text-gray-700"
                      }`}
                    aria-pressed={selected}
                  >
                    {selected && (
                      <svg
                        className="w-3 h-3 mr-1 flex-none"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {ROLE_LABELS[role]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specs grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
            {/* Count */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  노드 수
                </label>
                <Tooltip text={FIELD_TOOLTIPS.count} />
              </div>
              <input
                type="number"
                min={1}
                value={group.count}
                onChange={(e) =>
                  update({ count: Math.max(1, parseInt(e.target.value) || 1) })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* vCPU */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  vCPU
                </label>
                <Tooltip text={FIELD_TOOLTIPS.vcpu} />
              </div>
              <input
                type="number"
                min={1}
                value={group.vcpu}
                onChange={(e) =>
                  handleSpecChange({
                    vcpu: Math.max(1, parseInt(e.target.value) || 1),
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* RAM */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  RAM (GB)
                </label>
                <Tooltip text={FIELD_TOOLTIPS.ramGB} />
              </div>
              <input
                type="number"
                min={1}
                value={group.ramGB}
                onChange={(e) =>
                  handleSpecChange({
                    ramGB: Math.max(1, parseInt(e.target.value) || 1),
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Disk */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Disk (TB)
                </label>
                <Tooltip text={FIELD_TOOLTIPS.diskTB} />
              </div>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={group.diskTB}
                onChange={(e) =>
                  handleSpecChange({
                    diskTB: Math.max(
                      0.1,
                      parseFloat(e.target.value) || 0.1
                    ),
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Storage Type */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                스토리지 유형
              </label>
              <Tooltip text={FIELD_TOOLTIPS.storageType} />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSpecChange({ storageType: "ssd" })}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all duration-150
                  ${
                    group.storageType === "ssd"
                      ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                      : "bg-white text-gray-600 border-gray-300 hover:border-orange-400 hover:text-orange-600"
                  }`}
                aria-pressed={group.storageType === "ssd"}
              >
                SSD
              </button>
              <button
                type="button"
                onClick={() => handleSpecChange({ storageType: "hdd" })}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all duration-150
                  ${
                    group.storageType === "hdd"
                      ? "bg-gray-600 text-white border-gray-600 shadow-sm"
                      : "bg-white text-gray-600 border-gray-300 hover:border-gray-500 hover:text-gray-700"
                  }`}
                aria-pressed={group.storageType === "hdd"}
              >
                HDD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
