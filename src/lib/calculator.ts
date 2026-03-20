import {
  EndpointProfile,
  StorageConfig,
  NodeGroup,
  ProfileResult,
  TierStorage,
  SizingResult,
  RetentionScenario,
} from "./types";

// ── Constants ──

const BASE_SINGLE = 25; // MB/day
const BASE_MULTI = 90;  // MB/day
const OVERHEAD = 1.20;  // ES overhead 20% (인덱싱 ~10% + 스토리지 ~10%)

const M_OS = { windows: 1.0, macos: 0.8, linux: 0.6 } as const;

const MULTIPLIERS = {
  module: { uxm: 1.0, "uxm+esa": 2.0 },
  interval: { "30s": 1.0, "60s": 0.55, "120s": 0.30 },
  processDetail: { full: 1.0, top10: 0.5, top5: 0.35 },
  browser: { false: 1.0, true: 1.1 },
  dns: { false: 1.0, true: 1.15 },
  eventLog: { none: 1.0, minimal: 1.1, full: 1.3 },
  citrix: { false: 1.0, true: 1.1 },
  hours: { "8h": 1.0, "12h": 1.5, "24h": 2.8 },
} as const;

// ── Profile Calculation ──

export function calcGroupDaily(profile: EndpointProfile): number {
  const base = profile.environmentType === "single" ? BASE_SINGLE : BASE_MULTI;
  const common =
    base *
    MULTIPLIERS.module[profile.module] *
    MULTIPLIERS.interval[profile.collectionInterval] *
    MULTIPLIERS.processDetail[profile.processDetail] *
    MULTIPLIERS.browser[String(profile.browserExtension) as "true" | "false"] *
    (profile.module === "uxm+esa"
      ? MULTIPLIERS.dns[String(profile.dnsMonitoring) as "true" | "false"]
      : 1.0) *
    (profile.module === "uxm+esa"
      ? MULTIPLIERS.eventLog[profile.eventLogForwarding]
      : 1.0) *
    MULTIPLIERS.citrix[String(profile.citrixIntegration) as "true" | "false"] *
    MULTIPLIERS.hours[profile.activeHours];

  return profile.userCount * common * M_OS[profile.os]; // MB/day
}

// ── Tier Available Disk ──

function availableDiskTB(
  nodeGroups: NodeGroup[],
  role: "data_hot" | "data_warm" | "data_cold" | "data_frozen"
): number {
  return nodeGroups
    .filter((g) => g.roles.includes(role))
    .reduce((sum, g) => sum + g.count * g.diskTB, 0);
}

function tierStatus(requiredGB: number, availTB: number): TierStorage {
  const requiredTB = requiredGB / 1024;
  const noNodes = availTB === 0;
  const utilization = noNodes ? (requiredTB > 0 ? Infinity : 0) : requiredTB / availTB;
  let status: "ok" | "warn" | "danger";
  if (noNodes && requiredTB > 0) status = "danger";
  else if (utilization > 1.0) status = "danger";
  else if (utilization > 0.75) status = "warn";
  else status = "ok";
  return { requiredGB, requiredTB, availableTB: availTB, utilization, status, noNodes };
}

// ── Main Calculation ──

export function calculateSizing(
  profiles: EndpointProfile[],
  storage: StorageConfig,
  nodeGroups: NodeGroup[]
): SizingResult {
  // Profile results
  const profileResults: ProfileResult[] = profiles.map((p) => {
    const dailyMB = calcGroupDaily(p);
    return { id: p.id, name: p.name, dailyMB, dailyGB: dailyMB / 1024 };
  });

  const totalDailyMB = profileResults.reduce((s, r) => s + r.dailyMB, 0);
  const totalDailyGB = totalDailyMB / 1024;

  // Frozen days
  const frozenDays = storage.retentionDays - storage.hot.days - storage.warm.days - storage.cold.days;
  const safeFrozenDays = Math.max(0, frozenDays);

  // Storage per tier
  const hotStorageGB = totalDailyGB * storage.hot.days * (1 + storage.hot.replica);
  const warmStorageGB = totalDailyGB * storage.warm.days * (1 + storage.warm.replica);
  const coldStorageGB = totalDailyGB * storage.cold.days * (1 + storage.cold.replica);
  const frozenStorageGB = totalDailyGB * safeFrozenDays * (1 + storage.frozen.replica);

  const totalStorageTB =
    (hotStorageGB + warmStorageGB + coldStorageGB + frozenStorageGB) * OVERHEAD / 1024;

  const requiredObjStorageTB = (totalDailyGB * safeFrozenDays) / 1024;

  // Tier capacity status
  const hotAvail = availableDiskTB(nodeGroups, "data_hot");
  const warmAvail = availableDiskTB(nodeGroups, "data_warm");
  const coldAvail = availableDiskTB(nodeGroups, "data_cold");
  const frozenAvail = availableDiskTB(nodeGroups, "data_frozen");

  const tierStatusResult = {
    hot: tierStatus(hotStorageGB * OVERHEAD, hotAvail),
    warm: tierStatus(warmStorageGB * OVERHEAD, warmAvail),
    cold: tierStatus(coldStorageGB * OVERHEAD, coldAvail),
    frozen: tierStatus(frozenStorageGB * OVERHEAD, frozenAvail),
  };

  // Retention scenarios
  const retentionScenarios = calcRetentionScenarios(totalDailyGB, storage);

  return {
    profileResults,
    totalDailyMB,
    totalDailyGB,
    hotStorageGB,
    warmStorageGB,
    coldStorageGB,
    frozenStorageGB,
    totalStorageTB,
    requiredObjStorageTB,
    frozenDays,
    tierStatus: tierStatusResult,
    retentionScenarios,
  };
}

// ── Retention Scenarios ──

function calcRetentionScenarios(
  totalDailyGB: number,
  storage: StorageConfig
): RetentionScenario[] {
  return [30, 180, 365].map((days) => {
    // Scale each tier proportionally
    const ratio = days / Math.max(1, storage.retentionDays);
    const hotDays = Math.min(days, Math.round(storage.hot.days * ratio));
    const warmDays = Math.min(days - hotDays, Math.round(storage.warm.days * ratio));
    const coldDays = Math.min(days - hotDays - warmDays, Math.round(storage.cold.days * ratio));
    const frozenDays = Math.max(0, days - hotDays - warmDays - coldDays);

    const hotGB = totalDailyGB * hotDays * (1 + storage.hot.replica);
    const warmGB = totalDailyGB * warmDays * (1 + storage.warm.replica);
    const coldGB = totalDailyGB * coldDays * (1 + storage.cold.replica);
    const frozenGB = totalDailyGB * frozenDays * (1 + storage.frozen.replica);

    const totalTB = (hotGB + warmGB + coldGB + frozenGB) * OVERHEAD / 1024;

    return {
      days,
      totalStorageTB: totalTB,
      hotTB: (hotGB * OVERHEAD) / 1024,
      warmTB: (warmGB * OVERHEAD) / 1024,
      coldTB: (coldGB * OVERHEAD) / 1024,
      frozenTB: (frozenGB * OVERHEAD) / 1024,
    };
  });
}

// ── Utilities ──

export function formatNumber(num: number, decimals = 2): string {
  return num.toLocaleString("ko-KR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function exportAsMarkdown(
  profiles: EndpointProfile[],
  storage: StorageConfig,
  nodeGroups: NodeGroup[],
  result: SizingResult
): string {
  let md = `## uberAgent + Elasticsearch 사이징 결과\n\n`;

  md += `### 엔드포인트 프로파일\n`;
  md += `| 그룹명 | OS | 유형 | 유저수 | 모듈 | 일일 인입량 (GB) |\n`;
  md += `|--------|-----|------|--------|------|------------------|\n`;
  for (const pr of result.profileResults) {
    const p = profiles.find((pp) => pp.id === pr.id)!;
    const envLabel = p.environmentType === "single" ? "싱글유저" : "멀티유저";
    md += `| ${p.name} | ${p.os} | ${envLabel} | ${p.userCount.toLocaleString()} | ${p.module} | ${formatNumber(pr.dailyGB)} |\n`;
  }

  md += `\n### ILM 저장소\n`;
  md += `| 티어 | 기간(일) | Replica |\n`;
  md += `|------|----------|---------|\n`;
  md += `| Hot | ${storage.hot.days} | ${storage.hot.replica} |\n`;
  md += `| Warm | ${storage.warm.days} | ${storage.warm.replica} |\n`;
  md += `| Cold | ${storage.cold.days} | ${storage.cold.replica} |\n`;
  md += `| Frozen | ${Math.max(0, result.frozenDays)} | ${storage.frozen.replica} |\n`;

  md += `\n### 핵심 지표\n`;
  md += `| 지표 | 값 |\n`;
  md += `|------|-----|\n`;
  md += `| 총 일일 인입량 (Primary) | ${formatNumber(result.totalDailyGB)} GB |\n`;
  md += `| 총 저장량 | ${formatNumber(result.totalStorageTB)} TB |\n`;
  md += `| Hot 저장량 | ${formatNumber(result.hotStorageGB / 1024)} TB |\n`;
  md += `| 오브젝트 스토리지 필요량 | ${formatNumber(result.requiredObjStorageTB)} TB |\n`;

  md += `\n### 노드 구성\n`;
  md += `| 그룹명 | 역할 | 수량 | vCPU | RAM(GB) | Disk(TB) | 유형 |\n`;
  md += `|--------|------|------|------|---------|----------|------|\n`;
  for (const ng of nodeGroups) {
    md += `| ${ng.name} | ${ng.roles.join(", ")} | ${ng.count} | ${ng.vcpu * ng.count} | ${ng.ramGB * ng.count} | ${formatNumber(ng.diskTB * ng.count)} | ${ng.storageType.toUpperCase()} |\n`;
  }

  return md;
}
