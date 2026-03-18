// ── Endpoint Profile ──

export type OS = "windows" | "macos" | "linux";
export type EnvironmentType = "single" | "multi";
export type Module = "uxm" | "uxm+esa";
export type CollectionInterval = "30s" | "60s" | "120s";
export type ProcessDetail = "full" | "top10" | "top5";
export type EventLogForwarding = "none" | "minimal" | "full";
export type ActiveHours = "8h" | "12h" | "24h";

export interface EndpointProfile {
  id: string;
  name: string;
  os: OS;
  environmentType: EnvironmentType;
  userCount: number;
  module: Module;
  collectionInterval: CollectionInterval;
  processDetail: ProcessDetail;
  browserExtension: boolean;
  dnsMonitoring: boolean;
  eventLogForwarding: EventLogForwarding;
  citrixIntegration: boolean;
  activeHours: ActiveHours;
}

// ── ILM Storage ──

export interface TierConfig {
  days: number;
  replica: 0 | 1;
}

export interface StorageConfig {
  retentionDays: number;
  hot: TierConfig;
  warm: TierConfig;
  cold: TierConfig;
  frozen: TierConfig;
  objectStorageTB: number;
}

// ── Node Groups ──

export type NodeRole =
  | "master"
  | "data_hot"
  | "data_warm"
  | "data_cold"
  | "data_frozen"
  | "coord+ingest"
  | "ml"
  | "kibana"
  | "fleet";

export interface NodeGroup {
  id: string;
  name: string;
  roles: NodeRole[];
  count: number;
  vcpu: number;
  ramGB: number;
  diskTB: number;
  storageType: "ssd" | "hdd";
}

// ── Calculation Results ──

export interface ProfileResult {
  id: string;
  name: string;
  dailyMB: number;
  dailyGB: number;
}

export interface TierStorage {
  requiredGB: number;
  requiredTB: number;
  availableTB: number;
  utilization: number;
  status: "ok" | "warn" | "danger";
  noNodes: boolean;
}

export interface SizingResult {
  profileResults: ProfileResult[];
  totalDailyMB: number;
  totalDailyGB: number;
  hotStorageGB: number;
  warmStorageGB: number;
  coldStorageGB: number;
  frozenStorageGB: number;
  totalStorageTB: number;
  requiredObjStorageTB: number;
  frozenDays: number;
  tierStatus: {
    hot: TierStorage;
    warm: TierStorage;
    cold: TierStorage;
    frozen: TierStorage;
  };
  retentionScenarios: RetentionScenario[];
}

export interface RetentionScenario {
  days: number;
  totalStorageTB: number;
  hotTB: number;
  warmTB: number;
  coldTB: number;
  frozenTB: number;
}

// ── Role Defaults ──

export const ROLE_DEFAULTS: Record<
  NodeRole,
  { vcpu: number; ramGB: number; diskTB: number; storageType: "ssd" | "hdd" }
> = {
  master: { vcpu: 2, ramGB: 8, diskTB: 0.1, storageType: "hdd" },
  data_hot: { vcpu: 8, ramGB: 64, diskTB: 5, storageType: "ssd" },
  data_warm: { vcpu: 8, ramGB: 64, diskTB: 10, storageType: "hdd" },
  data_cold: { vcpu: 8, ramGB: 64, diskTB: 20, storageType: "hdd" },
  data_frozen: { vcpu: 4, ramGB: 64, diskTB: 5, storageType: "ssd" },
  "coord+ingest": { vcpu: 8, ramGB: 32, diskTB: 0.5, storageType: "ssd" },
  ml: { vcpu: 8, ramGB: 32, diskTB: 0.5, storageType: "ssd" },
  kibana: { vcpu: 4, ramGB: 16, diskTB: 0.1, storageType: "ssd" },
  fleet: { vcpu: 4, ramGB: 8, diskTB: 0.1, storageType: "ssd" },
};

export const ROLE_LABELS: Record<NodeRole, string> = {
  master: "Master",
  data_hot: "Data Hot",
  data_warm: "Data Warm",
  data_cold: "Data Cold",
  data_frozen: "Data Frozen",
  "coord+ingest": "Coord+Ingest",
  ml: "ML",
  kibana: "Kibana",
  fleet: "Fleet Server",
};

export const ALL_ROLES: NodeRole[] = [
  "master",
  "data_hot",
  "data_warm",
  "data_cold",
  "data_frozen",
  "coord+ingest",
  "ml",
  "kibana",
  "fleet",
];

// ── Defaults ──

let _counter = 0;
export function genId(): string {
  return `${Date.now()}-${++_counter}`;
}

export function createDefaultProfile(): EndpointProfile {
  return {
    id: genId(),
    name: "Windows 엔드포인트",
    os: "windows",
    environmentType: "single",
    userCount: 100,
    module: "uxm",
    collectionInterval: "30s",
    processDetail: "full",
    browserExtension: false,
    dnsMonitoring: false,
    eventLogForwarding: "none",
    citrixIntegration: false,
    activeHours: "8h",
  };
}

export function createDefaultStorage(): StorageConfig {
  return {
    retentionDays: 365,
    hot: { days: 365, replica: 1 },
    warm: { days: 0, replica: 1 },
    cold: { days: 0, replica: 1 },
    frozen: { days: 0, replica: 0 },
    objectStorageTB: 0,
  };
}

export function createDefaultNodeGroup(): NodeGroup {
  return {
    id: genId(),
    name: "데이터 노드",
    roles: ["data_hot"],
    count: 3,
    vcpu: 8,
    ramGB: 64,
    diskTB: 5,
    storageType: "ssd",
  };
}
