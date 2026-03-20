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
  data_hot: "데이터 노드 (Hot)",
  data_warm: "데이터 노드 (Warm)",
  data_cold: "데이터 노드 (Cold)",
  data_frozen: "데이터 노드 (Frozen)",
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
  const baseLabel = p.environmentType === "single" ? "25MB(싱글)" : "90MB(멀티)";
  const osLabel = p.os === "windows" ? "1.0(Win)" : p.os === "macos" ? "0.8(Mac)" : "0.6(Linux)";
  const moduleLabel = p.module === "uxm" ? "1.0(UXM)" : "2.0(ESA)";
  const intervalLabel = p.collectionInterval === "30s" ? "1.0(30s)" : p.collectionInterval === "60s" ? "0.55(60s)" : "0.30(120s)";
  const processLabel = p.processDetail === "full" ? "1.0(Full)" : p.processDetail === "top10" ? "0.5(Top10)" : "0.35(Top5)";
  const hoursLabel = p.activeHours === "8h" ? "1.0(8h)" : p.activeHours === "12h" ? "1.5(12h)" : "2.8(24h)";

  const parts = [
    `${p.userCount.toLocaleString()}명`,
    baseLabel,
    `${osLabel}`,
    `${moduleLabel}`,
    `${intervalLabel}`,
    `${processLabel}`,
    `${hoursLabel}`,
  ];

  // 선택 옵션: 활성화된 경우만 추가
  if (p.browserExtension) parts.push("1.1(브라우저)");
  if (p.citrixIntegration) parts.push("1.1(Citrix)");
  if (p.module === "uxm+esa" && p.dnsMonitoring) parts.push("1.15(DNS)");
  if (p.module === "uxm+esa" && p.eventLogForwarding === "minimal") parts.push("1.1(이벤트로그-최소)");
  if (p.module === "uxm+esa" && p.eventLogForwarding === "full") parts.push("1.3(이벤트로그-전체)");

  const formula = `${parts[0]} × ${parts.slice(1).join(" × ")}`;

  return [
    `  → 일일 인입량: ${formatNumber(dailyGB)} GB/day`,
    `     = ${formula}`,
  ];
}

// ── 프로세스 상세도 라벨 ──

function processDetailLabel(detail: string): string {
  if (detail === "full") return "Full";
  if (detail === "top10") return "Top 10";
  return "Top 5";
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
    const moduleLabel = p.module === "uxm" ? "UXM" : "UXM+ESA";
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
      `• ${ng.name} (${label}): ${ng.count}대 / 1대 기준: ${ng.vcpu} vCPU / ${ng.ramGB} GB RAM / ${formatNumber(ng.diskTB)} TB ${storageLabel}`
    );
  }

  // 마스터 노드 분산 주의사항
  const hasMasterRole = nodeGroups.some((ng) => ng.roles.includes("master"));
  if (hasMasterRole) {
    lines.push("");
    lines.push("※ 마스터 노드는 반드시 각기 다른 물리 서버에 배치해야 합니다.");
    lines.push("   (전용 마스터 노드 또는 데이터 노드 겸임 모두 해당)");
  }

  lines.push("");

  lines.push("---");
  lines.push(
    "본 수치는 Citrix uberAgent 7.5.x 공식 문서 기준 추정값입니다."
  );
  lines.push("정확한 사이징은 PoC 환경 실측을 권장합니다.");

  return lines.join("\n");
}
