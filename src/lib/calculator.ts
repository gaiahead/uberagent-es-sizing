import {
  SizingInputs,
  SizingResult,
  MultiplierBreakdown,
  RetentionScenario,
} from "./types";

const BASE_SINGLE_USER_MB = 25;
const BASE_MULTI_USER_MB = 90;

const MULTIPLIERS = {
  module: { uxm: 1.0, "uxm-esa": 2.0 },
  collectionInterval: { "30s": 1.0, "60s": 0.55, "120s": 0.3 },
  processDetail: { full: 1.0, top10: 0.5, top5: 0.35 },
  browserExtension: { off: 1.0, on: 1.1 },
  dnsMonitoring: { off: 1.0, on: 1.15 },
  eventLogForwarding: { none: 1.0, minimal: 1.1, full: 1.3 },
  citrixIntegration: { off: 1.0, on: 1.1 },
  activeHours: { "8h": 1.0, "12h": 1.5, "24h": 2.8 },
  os: { windows: 1.0, macos: 0.8, linux: 0.6 },
} as const;

const MULTIPLIER_LABELS: Record<string, string> = {
  module: "모듈",
  collectionInterval: "수집 주기",
  processDetail: "프로세스 상세",
  browserExtension: "브라우저 확장",
  dnsMonitoring: "DNS 모니터링",
  eventLogForwarding: "이벤트 로그 전달",
  citrixIntegration: "Citrix 통합",
  activeHours: "활성 시간",
  os: "운영체제",
};

export function calculateSizing(inputs: SizingInputs): SizingResult {
  const baseMB =
    inputs.environmentType === "single-user"
      ? BASE_SINGLE_USER_MB
      : BASE_MULTI_USER_MB;

  const multipliers: MultiplierBreakdown[] = [];
  let cumulative = baseMB;

  const addMultiplier = (key: string, value: number) => {
    cumulative *= value;
    multipliers.push({
      label: MULTIPLIER_LABELS[key] || key,
      key,
      value,
      cumulative,
    });
  };

  addMultiplier("module", MULTIPLIERS.module[inputs.module]);
  addMultiplier(
    "collectionInterval",
    MULTIPLIERS.collectionInterval[inputs.collectionInterval]
  );
  addMultiplier("processDetail", MULTIPLIERS.processDetail[inputs.processDetail]);
  addMultiplier(
    "browserExtension",
    inputs.browserExtension ? MULTIPLIERS.browserExtension.on : MULTIPLIERS.browserExtension.off
  );
  addMultiplier(
    "dnsMonitoring",
    inputs.module === "uxm-esa" && inputs.dnsMonitoring
      ? MULTIPLIERS.dnsMonitoring.on
      : MULTIPLIERS.dnsMonitoring.off
  );
  addMultiplier(
    "eventLogForwarding",
    inputs.module === "uxm-esa"
      ? MULTIPLIERS.eventLogForwarding[inputs.eventLogForwarding]
      : MULTIPLIERS.eventLogForwarding.none
  );
  addMultiplier(
    "citrixIntegration",
    inputs.citrixIntegration ? MULTIPLIERS.citrixIntegration.on : MULTIPLIERS.citrixIntegration.off
  );
  addMultiplier("activeHours", MULTIPLIERS.activeHours[inputs.activeHours]);
  addMultiplier("os", MULTIPLIERS.os[inputs.os]);

  const perUserDailyMB = cumulative;
  const totalDailyIngestGB = (perUserDailyMB * inputs.userCount) / 1000;

  const warmDays = Math.max(0, inputs.retentionDays - inputs.hotDays);
  const hotStorageGB = totalDailyIngestGB * inputs.hotDays * (1 + inputs.hotReplica);
  const warmStorageGB = totalDailyIngestGB * warmDays * (1 + inputs.warmReplica);
  const totalStorageTB = ((hotStorageGB + warmStorageGB) * 1.1) / 1000;
  const diskPerNodeTB = totalStorageTB / inputs.dataNodes;

  const dailyWritePerNodeGB =
    (totalDailyIngestGB * (1 + inputs.hotReplica)) / inputs.dataNodes;

  const estimatedShardCount =
    inputs.retentionDays * 2 * (1 + inputs.hotReplica);

  let indexStrategy: string;
  if (inputs.retentionDays < 30) {
    indexStrategy = "일별 인덱스 (daily)";
  } else if (inputs.retentionDays <= 90) {
    indexStrategy = "주별 인덱스 (weekly)";
  } else {
    indexStrategy = "주별 인덱스 + Shrink API 권장";
  }

  return {
    perUserDailyMB,
    totalDailyIngestGB,
    hotStorageGB,
    warmStorageGB,
    totalStorageTB,
    diskPerNodeTB,
    dailyWritePerNodeGB,
    estimatedShardCount,
    indexStrategy,
    multiplierBreakdown: multipliers,
  };
}

export function calculateRetentionScenarios(
  inputs: SizingInputs
): RetentionScenario[] {
  return [30, 60, 90].map((days) => {
    const result = calculateSizing({ ...inputs, retentionDays: days });
    return {
      days,
      totalStorageTB: result.totalStorageTB,
      diskPerNodeTB: result.diskPerNodeTB,
    };
  });
}

export function formatNumber(num: number, decimals = 2): string {
  if (Math.abs(num) >= 1000) {
    return num.toLocaleString("ko-KR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return num.toFixed(decimals);
}

export function exportAsMarkdown(inputs: SizingInputs, result: SizingResult): string {
  const envLabel = inputs.environmentType === "single-user" ? "싱글 유저" : "멀티 유저 (CVAD/RDS)";
  const unitLabel = inputs.environmentType === "single-user" ? "사용자" : "서버";

  return `## uberAgent ES 사이징 결과

### 입력 파라미터
| 항목 | 값 |
|------|-----|
| ${unitLabel} 수 | ${inputs.userCount.toLocaleString()} |
| 환경 유형 | ${envLabel} |
| 운영체제 | ${inputs.os} |
| 모듈 | ${inputs.module === "uxm" ? "UXM only" : "UXM + ESA"} |
| 수집 주기 | ${inputs.collectionInterval} |
| 프로세스 상세 | ${inputs.processDetail} |
| 브라우저 확장 | ${inputs.browserExtension ? "ON" : "OFF"} |
| DNS 모니터링 | ${inputs.dnsMonitoring ? "ON" : "OFF"} |
| 이벤트 로그 전달 | ${inputs.eventLogForwarding} |
| Citrix 통합 | ${inputs.citrixIntegration ? "ON" : "OFF"} |
| 활성 시간 | ${inputs.activeHours} |

### 결과 요약
| 지표 | 값 |
|------|-----|
| ${unitLabel}당 일일 로그 | ${formatNumber(result.perUserDailyMB)} MB |
| 총 일일 수집량 | ${formatNumber(result.totalDailyIngestGB)} GB |
| Hot 스토리지 | ${formatNumber(result.hotStorageGB)} GB |
| Warm 스토리지 | ${formatNumber(result.warmStorageGB)} GB |
| 총 스토리지 | ${formatNumber(result.totalStorageTB)} TB |
| 노드당 디스크 | ${formatNumber(result.diskPerNodeTB)} TB |
| 노드당 일일 쓰기 | ${formatNumber(result.dailyWritePerNodeGB)} GB |
| 예상 샤드 수 | ${result.estimatedShardCount} |
| 인덱스 전략 | ${result.indexStrategy} |
`;
}
