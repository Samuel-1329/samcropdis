import type { ScanRecord } from "./types";

const KEY = "agrishield.scans.v1";

export function loadScans(): ScanRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScanRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveScan(record: ScanRecord): ScanRecord[] {
  const next = [record, ...loadScans()].slice(0, 40);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full — history is best effort */
  }
  return next;
}

export function clearScans(): ScanRecord[] {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  return [];
}
