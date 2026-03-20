import { EndpointProfile, StorageConfig, NodeGroup, genId } from "./types";

interface SharedState {
  profiles: EndpointProfile[];
  storage: StorageConfig;
  nodeGroups: NodeGroup[];
}

export function encodeState(
  profiles: EndpointProfile[],
  storage: StorageConfig,
  nodeGroups: NodeGroup[]
): string {
  const data: SharedState = { profiles, storage, nodeGroups };
  return btoa(encodeURIComponent(JSON.stringify(data)));
}

export function decodeState(
  s: string
): { profiles: EndpointProfile[]; storage: StorageConfig; nodeGroups: NodeGroup[] } | null {
  try {
    const data: SharedState = JSON.parse(decodeURIComponent(atob(s)));
    // Regenerate IDs to avoid collisions
    data.profiles = data.profiles.map((p) => ({ ...p, id: genId() }));
    data.nodeGroups = data.nodeGroups.map((g) => ({ ...g, id: genId() }));
    return data;
  } catch {
    return null;
  }
}
