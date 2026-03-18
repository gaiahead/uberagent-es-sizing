"use client";

import {
  SizingInputs,
  EnvironmentType,
  OS,
  Module,
  CollectionInterval,
  ProcessDetail,
  EventLogForwarding,
  ActiveHours,
} from "@/lib/types";
import Tooltip from "./Tooltip";

interface InputPanelProps {
  inputs: SizingInputs;
  onChange: (inputs: SizingInputs) => void;
}

function RadioGroup<T extends string>({
  label,
  tooltip,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  tooltip: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`mb-4 ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        <Tooltip text={tooltip} />
      </label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-all ${
              value === opt.value
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({
  label,
  tooltip,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  tooltip: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`mb-4 flex items-center justify-between ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      <label className="text-sm font-medium text-gray-700">
        {label}
        <Tooltip text={tooltip} />
      </label>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function NumberInput({
  label,
  tooltip,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  tooltip: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        <Tooltip text={tooltip} />
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (!isNaN(v)) onChange(v);
        }}
        min={min}
        max={max}
        step={step}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
      />
    </div>
  );
}

export default function InputPanel({ inputs, onChange }: InputPanelProps) {
  const update = <K extends keyof SizingInputs>(key: K, value: SizingInputs[K]) => {
    const next = { ...inputs, [key]: value };
    if (key === "module" && value === "uxm") {
      next.dnsMonitoring = false;
      next.eventLogForwarding = "none";
    }
    onChange(next);
  };

  const isESA = inputs.module === "uxm-esa";
  const unitLabel = inputs.environmentType === "single-user" ? "사용자" : "서버";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-fit">
      <h2 className="text-lg font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">
        입력 파라미터
      </h2>

      {/* Daily Log Volume Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">
          일일 로그 볼륨
        </h3>

        <NumberInput
          label={`${unitLabel} 수`}
          tooltip={`모니터링 대상 ${unitLabel} 수를 입력하세요. 기본값: 100`}
          value={inputs.userCount}
          onChange={(v) => update("userCount", Math.max(1, v))}
          min={1}
        />

        <RadioGroup<EnvironmentType>
          label="환경 유형"
          tooltip="싱글 유저: 데스크톱/노트북 (25MB/일 기준), 멀티 유저: Citrix CVAD/RDS 서버 (90MB/일 기준)"
          options={[
            { value: "single-user", label: "싱글 유저" },
            { value: "multi-user", label: "멀티 유저 (CVAD/RDS)" },
          ]}
          value={inputs.environmentType}
          onChange={(v) => update("environmentType", v)}
        />

        <RadioGroup<OS>
          label="운영체제"
          tooltip="OS별 로그 볼륨 차이: Windows ×1.0, macOS ×0.8, Linux ×0.6"
          options={[
            { value: "windows", label: "Windows" },
            { value: "macos", label: "macOS" },
            { value: "linux", label: "Linux" },
          ]}
          value={inputs.os}
          onChange={(v) => update("os", v)}
        />

        <RadioGroup<Module>
          label="모듈"
          tooltip="UXM: 사용자 경험 모니터링만. UXM+ESA: 엔드포인트 보안 분석 추가 시 약 2배 볼륨"
          options={[
            { value: "uxm", label: "UXM only" },
            { value: "uxm-esa", label: "UXM + ESA" },
          ]}
          value={inputs.module}
          onChange={(v) => update("module", v)}
        />

        <RadioGroup<CollectionInterval>
          label="수집 주기"
          tooltip="데이터 수집 간격. 30초: 기본값(×1.0), 60초: ×0.55, 120초: ×0.30"
          options={[
            { value: "30s", label: "30초" },
            { value: "60s", label: "60초" },
            { value: "120s", label: "120초" },
          ]}
          value={inputs.collectionInterval}
          onChange={(v) => update("collectionInterval", v)}
        />

        <RadioGroup<ProcessDetail>
          label="프로세스 상세 수준"
          tooltip="프로세스 정보 수집 범위. Full: 전체(×1.0), Top10: 상위10(×0.5), Top5: 상위5(×0.35)"
          options={[
            { value: "full", label: "Full" },
            { value: "top10", label: "Top 10" },
            { value: "top5", label: "Top 5" },
          ]}
          value={inputs.processDetail}
          onChange={(v) => update("processDetail", v)}
        />

        <Toggle
          label="브라우저 확장"
          tooltip="브라우저 확장 프로그램 모니터링 활성화 시 ×1.1"
          checked={inputs.browserExtension}
          onChange={(v) => update("browserExtension", v)}
        />

        <Toggle
          label="DNS 쿼리 모니터링"
          tooltip="ESA 모듈 필요. DNS 쿼리 모니터링 활성화 시 ×1.15"
          checked={inputs.dnsMonitoring}
          onChange={(v) => update("dnsMonitoring", v)}
          disabled={!isESA}
        />

        <RadioGroup<EventLogForwarding>
          label="이벤트 로그 전달"
          tooltip="ESA 모듈 필요. None: ×1.0, Minimal: ×1.1, Full: ×1.3"
          options={[
            { value: "none", label: "없음" },
            { value: "minimal", label: "최소" },
            { value: "full", label: "전체" },
          ]}
          value={inputs.eventLogForwarding}
          onChange={(v) => update("eventLogForwarding", v)}
          disabled={!isESA}
        />

        <Toggle
          label="Citrix 통합 메트릭"
          tooltip="Citrix 관련 추가 메트릭 수집 활성화 시 ×1.1"
          checked={inputs.citrixIntegration}
          onChange={(v) => update("citrixIntegration", v)}
        />

        <RadioGroup<ActiveHours>
          label="일일 활성 시간"
          tooltip="하루 평균 활성 사용 시간. 8시간: ×1.0, 12시간: ×1.5, 24시간: ×2.8"
          options={[
            { value: "8h", label: "8시간" },
            { value: "12h", label: "12시간" },
            { value: "24h", label: "24시간" },
          ]}
          value={inputs.activeHours}
          onChange={(v) => update("activeHours", v)}
        />
      </div>

      {/* Storage Section */}
      <div>
        <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">
          스토리지 설정
        </h3>

        <NumberInput
          label="보존 기간 (일)"
          tooltip="전체 데이터 보존 기간. Hot + Warm 기간의 합계"
          value={inputs.retentionDays}
          onChange={(v) => update("retentionDays", Math.max(1, v))}
          min={1}
        />

        <NumberInput
          label="Hot 단계 기간 (일)"
          tooltip="빠른 검색을 위한 Hot 노드 보관 기간. 나머지는 Warm 단계에 저장"
          value={inputs.hotDays}
          onChange={(v) => update("hotDays", Math.max(1, Math.min(v, inputs.retentionDays)))}
          min={1}
        />

        <RadioGroup<"0" | "1">
          label="Hot 레플리카 수"
          tooltip="Hot 단계의 레플리카 수. 1이면 Hot 스토리지 2배. 고가용성을 위해 1 권장"
          options={[
            { value: "0", label: "0" },
            { value: "1", label: "1" },
          ]}
          value={String(inputs.hotReplica) as "0" | "1"}
          onChange={(v) => update("hotReplica", Number(v) as 0 | 1)}
        />

        <RadioGroup<"0" | "1">
          label="Warm 레플리카 수"
          tooltip="Warm 단계의 레플리카 수. 비용 절감을 위해 0 권장"
          options={[
            { value: "0", label: "0" },
            { value: "1", label: "1" },
          ]}
          value={String(inputs.warmReplica) as "0" | "1"}
          onChange={(v) => update("warmReplica", Number(v) as 0 | 1)}
        />

        <NumberInput
          label="데이터 노드 수"
          tooltip="Elasticsearch 데이터 노드 수. 총 스토리지를 노드 수로 나누어 노드당 디스크 계산"
          value={inputs.dataNodes}
          onChange={(v) => update("dataNodes", Math.max(1, v))}
          min={1}
        />
      </div>
    </div>
  );
}
