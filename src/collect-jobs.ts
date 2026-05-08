import type { JobRecord } from "./merge.js";

/** Future crawlers; stub returns no jobs until extractors are ported. */

export async function collectJobs(_hubUrls: string[]): Promise<JobRecord[]> {
  return [];
}
