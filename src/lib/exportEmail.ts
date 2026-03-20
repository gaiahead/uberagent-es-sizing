import {
  EndpointProfile,
  StorageConfig,
  NodeGroup,
  SizingResult,
} from "./types";
import { formatNumber } from "./calculator";

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
    if (p.environmentType === "multi") {
      lines.push(
        `• ${p.name}: ${p.userCount.toLocaleString()}명 (${moduleLabel}, ${intervalLabel} 수집, ${hoursLabel} 운영) — 서버 대수`
      );
    } else {
      lines.push(
        `• ${p.name}: ${p.userCount.toLocaleString()}명 (${moduleLabel}, ${intervalLabel} 수집, ${hoursLabel} 운영)`
      );
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
    const totalVcpu = ng.vcpu * ng.count;
    const totalRam = ng.ramGB * ng.count;
    const totalDisk = formatNumber(ng.diskTB * ng.count);
    const storageLabel = ng.storageType.toUpperCase();
    lines.push(
      `• ${ng.name}: ${ng.count}대 (${totalVcpu} vCPU / ${totalRam} GB RAM / ${totalDisk} TB ${storageLabel})`
    );
  }
  lines.push("");

  lines.push("---");
  lines.push(
    "본 수치는 Citrix uberAgent 7.5.x 공식 문서 기준 추정값입니다."
  );
  lines.push("정확한 사이징은 PoC 환경 실측을 권장합니다.");

  return lines.join("\n");
}
