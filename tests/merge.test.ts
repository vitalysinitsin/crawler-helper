import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadPreviousJobs, mergeJobSnapshots } from "../src/merge.js";

describe("TestLoadPreviousJobs", () => {
  it("test_missing_file_returns_empty", () => {
    expect(loadPreviousJobs(join(tmpdir(), "does-not-exist-xyz.json"))).toEqual(
      [],
    );
  });

  it("test_non_array_raises_value_error", () => {
    const dir = mkdtempSync(join(tmpdir(), "merge-prev-"));
    const filePath = join(dir, "bad.json");
    try {
      writeFileSync(filePath, JSON.stringify({ link: "https://a" }), "utf8");
      expect(() => loadPreviousJobs(filePath)).toThrow();
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("test_filters_non_dict_entries", () => {
    const dir = mkdtempSync(join(tmpdir(), "merge-prev-"));
    const filePath = join(dir, "mixed.json");
    try {
      writeFileSync(
        filePath,
        JSON.stringify([{ link: "https://a" }, 3, "bad"]),
        "utf8",
      );
      expect(loadPreviousJobs(filePath)).toEqual([{ link: "https://a" }]);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
});

describe("TestMergeSnapshots", () => {
  it("test_sets_net_new_and_drops_removed", () => {
    const previous = [
      { link: "https://jobs/a", title: "A" },
      { link: "https://jobs/removed", title: "Old" },
    ];
    const current = [{ link: "https://jobs/a", title: "A2" }];
    const merged = mergeJobSnapshots(previous, current);
    expect(merged).toEqual([
      { link: "https://jobs/a", title: "A2", net_new: false },
    ]);
  });

  it("test_dedupes_by_link_last_write_wins", () => {
    const merged = mergeJobSnapshots(
      [],
      [
        { link: "https://jobs/a", title: "First" },
        { link: "https://jobs/a", title: "Second" },
      ],
    );
    expect(merged).toEqual([
      { link: "https://jobs/a", title: "Second", net_new: true },
    ]);
  });

  it("test_skips_blank_links", () => {
    const merged = mergeJobSnapshots(
      [],
      [
        { title: "No link" },
        { link: "   " },
        { link: "https://ok" },
      ],
    );
    expect(merged).toEqual([{ link: "https://ok", net_new: true }]);
  });
});
