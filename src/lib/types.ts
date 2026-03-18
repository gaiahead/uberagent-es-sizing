export type EnvironmentType = "single-user" | "multi-user";
export type OS = "windows" | "macos" | "linux";
export type Module = "uxm" | "uxm-esa";
export type CollectionInterval = "30s" | "60s" | "120s";
export type ProcessDetail = "full" | "top10" | "top5";
export type EventLogForwarding = "none" | "minimal" | "full";
export type ActiveHours = "8h" | "12h" | "24h";

export interface SizingInputs {
  userCount: number;
  environmentType: EnvironmentType;
  os: OS;
  module: Module;
  collectionInterval: CollectionInterval;
  processDetail: ProcessDetail;
  browserExtension: boolean;
  dnsMonitoring: boolean;
  eventLogForwarding: EventLogForwarding;
  citrixIntegration: boolean;
  activeHours: ActiveHours;
  retentionDays: number;
  hotDays: number;
  hotReplica: 0 | 1;
  warmReplica: 0 | 1;
  dataNodes: number;
}

export interface MultiplierBreakdown {
  label: string;
  key: string;
  value: number;
  cumulative: number;
}

export interface SizingResult {
  perUserDailyMB: number;
  totalDailyIngestGB: number;
  hotStorageGB: number;
  warmStorageGB: number;
  totalStorageTB: number;
  diskPerNodeTB: number;
  dailyWritePerNodeGB: number;
  estimatedShardCount: number;
  indexStrategy: string;
  multiplierBreakdown: MultiplierBreakdown[];
}

export interface RetentionScenario {
  days: number;
  totalStorageTB: number;
  diskPerNodeTB: number;
}

export const DEFAULT_INPUTS: SizingInputs = {
  userCount: 100,
  environmentType: "single-user",
  os: "windows",
  module: "uxm",
  collectionInterval: "30s",
  processDetail: "full",
  browserExtension: false,
  dnsMonitoring: false,
  eventLogForwarding: "none",
  citrixIntegration: false,
  activeHours: "8h",
  retentionDays: 30,
  hotDays: 3,
  hotReplica: 1,
  warmReplica: 0,
  dataNodes: 2,
};
