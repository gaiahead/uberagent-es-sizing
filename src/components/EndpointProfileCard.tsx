"use client";

import { useState } from "react";
import { EndpointProfile, OS, EnvironmentType, Module, CollectionInterval, ProcessDetail, EventLogForwarding, ActiveHours } from "@/lib/types";
import Tooltip from "@/components/Tooltip";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface RadioOption<T extends string> {
  value: T;
  label: string;
}

interface RadioGroupProps<T extends string> {
  name: string;
  options: RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

function RadioGroup<T extends string>({ name, options, value, onChange, disabled = false }: RadioGroupProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <label
            key={option.value}
            className={[
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm cursor-pointer select-none transition-colors",
              disabled
                ? "opacity-40 cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                : isSelected
                ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50/40",
            ].join(" ")}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              disabled={disabled}
              onChange={() => !disabled && onChange(option.value)}
              className="sr-only"
            />
            <span
              className={[
                "w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                disabled
                  ? "border-gray-300"
                  : isSelected
                  ? "border-blue-500"
                  : "border-gray-300",
              ].join(" ")}
            >
              {isSelected && (
                <span
                  className={[
                    "w-1.5 h-1.5 rounded-full",
                    disabled ? "bg-gray-400" : "bg-blue-500",
                  ].join(" ")}
                />
              )}
            </span>
            {option.label}
          </label>
        );
      })}
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

function Toggle({ checked, onChange, disabled = false, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={[
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
        disabled
          ? "opacity-40 cursor-not-allowed bg-gray-200"
          : checked
          ? "bg-blue-500"
          : "bg-gray-200 hover:bg-gray-300",
      ].join(" ")}
    >
      <span className="sr-only">{label}</span>
      <span
        className={[
          "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

function NumberInput({ value, onChange, min = 1, max = 1000000, step = 1 }: NumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed)) {
      onChange(Math.min(max, Math.max(min, parsed)));
    }
  };

  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={handleChange}
      className="w-32 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    />
  );
}

// ---------------------------------------------------------------------------
// Parameter row wrapper
// ---------------------------------------------------------------------------

interface ParamRowProps {
  label: string;
  tooltip: string;
  children: React.ReactNode;
}

function ParamRow({ label, tooltip, children }: ParamRowProps) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-4">
      <div className="flex items-center gap-1 min-w-[140px] pt-1.5">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <Tooltip text={tooltip} />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// OS icon helpers
// ---------------------------------------------------------------------------

const OS_ICON: Record<OS, string> = {
  windows: "🪟",
  macos: "🍎",
  linux: "🐧",
};

const OS_LABEL: Record<OS, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
};

// ---------------------------------------------------------------------------
// Module badge colors
// ---------------------------------------------------------------------------

const MODULE_BADGE: Record<Module, { label: string; className: string }> = {
  uxm: { label: "UXM", className: "bg-purple-100 text-purple-700 border-purple-200" },
  "uxm+esa": { label: "UXM+ESA", className: "bg-orange-100 text-orange-700 border-orange-200" },
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface EndpointProfileCardProps {
  profile: EndpointProfile;
  onChange: (p: EndpointProfile) => void;
  onDelete: () => void;
  defaultExpanded?: boolean;
}

export function EndpointProfileCard({ profile, onChange, onDelete, defaultExpanded = false }: EndpointProfileCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const update = <K extends keyof EndpointProfile>(key: K, value: EndpointProfile[K]) => {
    onChange({ ...profile, [key]: value });
  };

  const handleModuleChange = (value: Module) => {
    const next: EndpointProfile = { ...profile, module: value };
    if (value === "uxm") {
      next.dnsMonitoring = false;
      next.eventLogForwarding = "none";
    }
    onChange(next);
  };

  const userCountLabel = profile.environmentType === "multi" ? "서버 대수" : "유저 수";
  const isEsaModule = profile.module === "uxm+esa";

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
        {/* OS icon */}
        <span className="text-xl leading-none" title={OS_LABEL[profile.os]} aria-label={OS_LABEL[profile.os]}>
          {OS_ICON[profile.os]}
        </span>

        {/* Name input (inline, minimal styling) */}
        <input
          type="text"
          value={profile.name}
          onChange={(e) => update("name", e.target.value)}
          aria-label="프로파일 이름"
          className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:bg-white focus:rounded px-1 -mx-1 truncate"
          placeholder="프로파일 이름"
        />

        {/* Badges */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border-blue-200">
            {userCountLabel}: {profile.userCount.toLocaleString()}
          </span>
          <span
            className={[
              "hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
              MODULE_BADGE[profile.module].className,
            ].join(" ")}
          >
            {MODULE_BADGE[profile.module].label}
          </span>
        </div>

        {/* Expand / Collapse */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "접기" : "펼치기"}
          className="rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={["w-5 h-5 transition-transform duration-200", expanded ? "rotate-180" : ""].join(" ")}
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={onDelete}
          aria-label="프로파일 삭제"
          className="rounded-md p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-4 py-5 space-y-5">
          {/* Name */}
          <ParamRow label="프로파일 이름" tooltip="이 엔드포인트 그룹을 식별하는 이름입니다.">
            <input
              type="text"
              value={profile.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full max-w-xs rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="프로파일 이름"
            />
          </ParamRow>

          <div className="border-t border-gray-100" />

          {/* OS */}
          <ParamRow label="운영체제" tooltip="엔드포인트의 운영체제를 선택합니다.">
            <RadioGroup<OS>
              name={`${profile.id}-os`}
              options={[
                { value: "windows", label: "🪟 Windows" },
                { value: "macos", label: "🍎 macOS" },
                { value: "linux", label: "🐧 Linux" },
              ]}
              value={profile.os}
              onChange={(v) => update("os", v)}
            />
          </ParamRow>

          {/* Environment Type */}
          <ParamRow
            label="환경 유형"
            tooltip="단일 사용자 PC 환경인지, 다수 사용자가 공유하는 VDI/CVAD/RDS 환경인지 선택합니다."
          >
            <RadioGroup<EnvironmentType>
              name={`${profile.id}-env`}
              options={[
                { value: "single", label: "싱글유저 PC / VDI" },
                { value: "multi", label: "멀티유저 CVAD / RDS" },
              ]}
              value={profile.environmentType}
              onChange={(v) => update("environmentType", v)}
            />
          </ParamRow>

          {/* User Count */}
          <ParamRow
            label={userCountLabel}
            tooltip={
              profile.environmentType === "multi"
                ? "멀티유저 환경의 서버(호스트) 대수입니다."
                : "모니터링 대상 엔드포인트의 총 유저 수입니다."
            }
          >
            <NumberInput
              value={profile.userCount}
              onChange={(v) => update("userCount", v)}
              min={1}
              max={1000000}
            />
          </ParamRow>

          <div className="border-t border-gray-100" />

          {/* Module */}
          <ParamRow
            label="모듈"
            tooltip="UXM만 사용할지, ESA(보안 분석) 기능도 함께 사용할지 선택합니다. ESA를 활성화하면 DNS 모니터링과 이벤트 로그 전달이 가능합니다."
          >
            <RadioGroup<Module>
              name={`${profile.id}-module`}
              options={[
                { value: "uxm", label: "UXM only" },
                { value: "uxm+esa", label: "UXM + ESA" },
              ]}
              value={profile.module}
              onChange={handleModuleChange}
            />
          </ParamRow>

          <div className="border-t border-gray-100" />

          {/* Collection Interval */}
          <ParamRow
            label="수집 주기"
            tooltip="uberAgent가 데이터를 수집하여 Elasticsearch로 전송하는 주기입니다. 짧을수록 데이터 양이 많아집니다."
          >
            <RadioGroup<CollectionInterval>
              name={`${profile.id}-interval`}
              options={[
                { value: "30s", label: "30초" },
                { value: "60s", label: "60초" },
                { value: "120s", label: "120초" },
              ]}
              value={profile.collectionInterval}
              onChange={(v) => update("collectionInterval", v)}
            />
          </ParamRow>

          {/* Process Detail */}
          <ParamRow
            label="프로세스 상세도"
            tooltip="수집할 프로세스 정보의 범위입니다. Full은 모든 프로세스, Top 10/5는 CPU/메모리 상위 프로세스만 수집합니다."
          >
            <RadioGroup<ProcessDetail>
              name={`${profile.id}-process`}
              options={[
                { value: "full", label: "Full" },
                { value: "top10", label: "Top 10" },
                { value: "top5", label: "Top 5" },
              ]}
              value={profile.processDetail}
              onChange={(v) => update("processDetail", v)}
            />
          </ParamRow>

          <div className="border-t border-gray-100" />

          {/* Browser Extension */}
          <ParamRow
            label="브라우저 확장"
            tooltip="브라우저 확장 프로그램을 통해 웹 페이지별 성능 및 사용 데이터를 수집합니다."
          >
            <div className="flex items-center gap-3 pt-1">
              <Toggle
                checked={profile.browserExtension}
                onChange={(v) => update("browserExtension", v)}
                label="브라우저 확장"
              />
              <span className="text-sm text-gray-600">{profile.browserExtension ? "활성화" : "비활성화"}</span>
            </div>
          </ParamRow>

          {/* DNS Monitoring */}
          <ParamRow
            label="DNS 모니터링"
            tooltip="네트워크 DNS 쿼리를 모니터링합니다. ESA 모듈이 필요합니다."
          >
            <div className="flex items-center gap-3 pt-1">
              <Toggle
                checked={profile.dnsMonitoring}
                onChange={(v) => update("dnsMonitoring", v)}
                disabled={!isEsaModule}
                label="DNS 모니터링"
              />
              <span className={["text-sm", !isEsaModule ? "text-gray-400" : "text-gray-600"].join(" ")}>
                {!isEsaModule ? "ESA 모듈 필요" : profile.dnsMonitoring ? "활성화" : "비활성화"}
              </span>
            </div>
          </ParamRow>

          {/* Event Log Forwarding */}
          <ParamRow
            label="이벤트 로그 전달"
            tooltip="Windows 이벤트 로그를 Elasticsearch로 전달합니다. ESA 모듈이 필요합니다. '최소'는 보안 이벤트만, '전체'는 모든 이벤트를 전달합니다."
          >
            <RadioGroup<EventLogForwarding>
              name={`${profile.id}-eventlog`}
              options={[
                { value: "none", label: "없음" },
                { value: "minimal", label: "최소" },
                { value: "full", label: "전체" },
              ]}
              value={profile.eventLogForwarding}
              onChange={(v) => update("eventLogForwarding", v)}
              disabled={!isEsaModule}
            />
          </ParamRow>

          <div className="border-t border-gray-100" />

          {/* Citrix Integration */}
          <ParamRow
            label="Citrix 통합"
            tooltip="Citrix Virtual Apps and Desktops 환경에서 세션 및 애플리케이션 데이터를 추가로 수집합니다."
          >
            <div className="flex items-center gap-3 pt-1">
              <Toggle
                checked={profile.citrixIntegration}
                onChange={(v) => update("citrixIntegration", v)}
                label="Citrix 통합"
              />
              <span className="text-sm text-gray-600">{profile.citrixIntegration ? "활성화" : "비활성화"}</span>
            </div>
          </ParamRow>

          {/* Active Hours */}
          <ParamRow
            label="활성 시간"
            tooltip="하루 중 엔드포인트가 실제로 활성화되어 데이터를 전송하는 시간입니다. 데이터 볼륨 및 Elasticsearch 용량 산정에 영향을 줍니다."
          >
            <RadioGroup<ActiveHours>
              name={`${profile.id}-activehours`}
              options={[
                { value: "8h", label: "8시간" },
                { value: "12h", label: "12시간" },
                { value: "24h", label: "24시간" },
              ]}
              value={profile.activeHours}
              onChange={(v) => update("activeHours", v)}
            />
          </ParamRow>
        </div>
      )}
    </div>
  );
}
