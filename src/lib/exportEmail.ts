import {
  EndpointProfile,
  StorageConfig,
  NodeGroup,
  NodeRole,
  SizingResult,
} from "./types";
import { formatNumber } from "./calculator";

// ── NodeRole 한국어 변환 ──

const ROLE_LABELS_KO: Record<NodeRole, string> = {
  data_hot: "핫 노드",
  data_warm: "웜 노드",
  data_cold: "콜드 노드",
  data_frozen: "프로즌 노드",
  master: "마스터 노드",
  "coord+ingest": "코디네이터/인제스트",
  ml: "ML 노드",
  kibana: "키바나",
  fleet: "Fleet 서버",
};

function roleLabel(roles: NodeRole[]): string {
  const hasMaster = roles.includes("master");
  const otherRoles = roles.filter((r) => r !== "master");

  if (hasMaster && otherRoles.length === 0) {
    return "마스터 노드";
  }

  const labels = otherRoles.length > 0
    ? otherRoles.map((r) => ROLE_LABELS_KO[r])
    : [ROLE_LABELS_KO["master"]];

  const joined = labels.join(" / ");
  return hasMaster && otherRoles.length > 0
    ? `${joined} (마스터 겸임)`
    : joined;
}

// ── 계산식 배율 표기 헬퍼 ──

function buildFormulaLine(p: EndpointProfile, dailyGB: number): string[] {
  const base = p.environmentType === "single" ? 25 : 90;
  const mOS = p.os === "windows" ? 1.0 : p.os === "macos" ? 0.8 : 0.6;
  const mModule = p.module === "uxm" ? 1.0 : 2.0;
  const mInterval = p.collectionInterval === "30s" ? 1.0 : p.collectionInterval === "60s" ? 0.55 : 0.30;
  const mProcess = p.processDetail === "full" ? 1.0 : p.processDetail === "top10" ? 0.5 : 0.35;
  const mHours = p.activeHours === "8h" ? 1.0 : p.activeHours === "12h" ? 1.5 : 2.8;

  let effectiveMB = base * mOS * mModule * mInterval * mProcess * mHours;

  // 선택 옵션
  if (p.browserExtension) effectiveMB *= 1.1;
  if (p.citrixIntegration) effectiveMB *= 1.1;
  if (p.module === "uxm+esa" && p.dnsMonitoring) effectiveMB *= 1.15;
  if (p.module === "uxm+esa" && p.eventLogForwarding === "minimal") effectiveMB *= 1.1;
  if (p.module === "uxm+esa" && p.eventLogForwarding === "full") effectiveMB *= 1.3;

  const rounded = Math.round(effectiveMB * 100) / 100;

  return [
    `  → 일일 인입량: ${formatNumber(dailyGB)} GB/day`,
    `     = ${p.userCount.toLocaleString()}명 × ${rounded}MB`,
  ];
}

// ── 프로세스 상세도 라벨 ──

function processDetailLabel(detail: string): string {
  if (detail === "full") return "Process Full";
  if (detail === "top10") return "Process Top 10";
  return "Process Top 5";
}

export function exportAsEmail(
  profiles: EndpointProfile[],
  storage: StorageConfig,
  nodeGroups: NodeGroup[],
  result: SizingResult
): string {
  const today = new Date().toISOString().slice(0, 10);
  const lines: string[] = [];

  lines.push("Citrix uberAgent + Elasticsearch 사이징 제안");
  lines.push(`작성일: ${today}`);
  lines.push("");

  // 환경 구성
  lines.push("[ 환경 구성 ]");
  for (const pr of result.profileResults) {
    const p = profiles.find((pp) => pp.id === pr.id)!;
    const moduleLabel = p.module === "uxm" ? "UXM only" : "UXM+ESA";
    const intervalLabel = p.collectionInterval;
    const hoursLabel = p.activeHours;
    const procLabel = processDetailLabel(p.processDetail);
    if (p.environmentType === "multi") {
      lines.push(
        `• ${p.name}: ${p.userCount.toLocaleString()}명 (${moduleLabel}, ${intervalLabel} 수집, ${procLabel}, ${hoursLabel} 운영) — 서버 대수`
      );
    } else {
      lines.push(
        `• ${p.name}: ${p.userCount.toLocaleString()}명 (${moduleLabel}, ${intervalLabel} 수집, ${procLabel}, ${hoursLabel} 운영)`
      );
    }
    // 계산식 추가
    const formulaLines = buildFormulaLine(p, pr.dailyGB);
    for (const fl of formulaLines) {
      lines.push(fl);
    }
  }
  lines.push("");

  // 예상 데이터 인입량
  lines.push("[ 예상 데이터 인입량 ]");
  lines.push(
    `• 일일 총 인입량: ${formatNumber(result.totalDailyGB)} GB/day (Primary 기준)`
  );
  lines.push("");

  // 저장소 요구사항
  const safeFrozenDays = Math.max(0, result.frozenDays);
  const totalRetention =
    storage.hot.days + storage.warm.days + storage.cold.days + safeFrozenDays;

  lines.push("[ 저장소 요구사항 ]");
  lines.push(`• 총 보존 기간: ${totalRetention}일`);
  lines.push(
    `• 필요 총 저장량: ${formatNumber(result.totalStorageTB)} TB (레플리카·오버헤드 포함)`
  );
  lines.push(
    `  - Hot: ${formatNumber(result.hotStorageGB / 1024)} TB (${storage.hot.days}일)`
  );
  if (storage.warm.days > 0) {
    lines.push(
      `  - Warm: ${formatNumber(result.warmStorageGB / 1024)} TB (${storage.warm.days}일)`
    );
  }
  if (storage.cold.days > 0) {
    lines.push(
      `  - Cold: ${formatNumber(result.coldStorageGB / 1024)} TB (${storage.cold.days}일)`
    );
  }
  if (safeFrozenDays > 0) {
    lines.push(
      `  - Frozen: ${formatNumber(result.frozenStorageGB / 1024)} TB (${safeFrozenDays}일)`
    );
  }
  lines.push("");

  // 클러스터 구성
  lines.push("[ 클러스터 구성 ]");
  for (const ng of nodeGroups) {
    const label = roleLabel(ng.roles);
    const storageLabel = ng.storageType.toUpperCase();
    lines.push(
      `• ${label}: ${ng.count}대 / 1대 기준: ${ng.vcpu} vCPU / ${ng.ramGB} GB RAM / ${formatNumber(ng.diskTB)} TB ${storageLabel}`
    );
  }

  // 마스터 노드 분산 주의사항
  const hasMasterRole = nodeGroups.some((ng) => ng.roles.includes("master"));
  if (hasMasterRole) {
    lines.push("");
    lines.push("※ 마스터 역할을 하는 노드는 각기 다른 물리 서버에 배치해야 합니다.");
    lines.push("   (같은 물리 서버에 있을 경우 가용성 확보에 제약이 있습니다.)");
  }

  lines.push("");

  lines.push("---");
  lines.push(
    "본 수치는 Citrix uberAgent 7.5.x 공식 문서 기준 추정값입니다."
  );
  lines.push("정확한 사이징은 PoC 환경 실측을 권장합니다.");

  return lines.join("\n");
}
