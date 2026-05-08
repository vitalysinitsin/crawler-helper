import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/** Plain JSON object row (JSON.parse yields objects; arrays/primitives are excluded when loading). */
export type JobRecord = Record<string, unknown>;

/**
 * Load a prior snapshot JSON file as a list of objects.
 *
 * Missing files are treated as an empty snapshot.
 */
export function loadPreviousJobs(filePath: string): JobRecord[] {
  const resolved = path.resolve(filePath);
  if (!existsSync(resolved)) {
    return [];
  }
  const data: unknown = JSON.parse(readFileSync(resolved, "utf8"));
  if (!Array.isArray(data)) {
    throw new Error(`Expected JSON array in ${resolved}`);
  }
  return data.filter(
    (item): item is JobRecord =>
      item !== null && typeof item === "object" && !Array.isArray(item),
  );
}

/**
 * Merge the current crawl results against previous snapshot.
 *
 * Dedupe key is `link`. Empty/missing links are skipped.
 * If duplicates exist in the current run, the last record wins.
 * A row is `net_new` when its link was not present in previous snapshot.
 *
 * Removed postings are handled by omission: only links present in current_jobs
 * are returned in the merged output.
 */
export function mergeJobSnapshots(
  previous: JobRecord[],
  currentJobs: JobRecord[],
): JobRecord[] {
  const prevLinks = new Set<string>();
  for (const job of previous) {
    const link = job["link"];
    if (link === null || link === undefined) {
      continue;
    }
    const s = String(link).trim();
    if (s !== "") {
      prevLinks.add(s);
    }
  }

  const byLink = new Map<string, JobRecord>();
  for (const job of currentJobs) {
    const link = job["link"];
    if (link === null || link === undefined) {
      continue;
    }
    const linkS = String(link).trim();
    if (linkS === "") {
      continue;
    }
    const row: JobRecord = { ...job };
    row["link"] = linkS;
    byLink.set(linkS, row);
  }

  const merged: JobRecord[] = [];
  for (const link of [...byLink.keys()].sort()) {
    const row: JobRecord = { ...byLink.get(link)! };
    row["net_new"] = !prevLinks.has(link);
    merged.push(row);
  }
  return merged;
}
