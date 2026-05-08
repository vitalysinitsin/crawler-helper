import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseHubUrls, readHubUrlsFile } from "../src/urls.js";

describe("TestParseHubUrls", () => {
  it("test_comma_separated", () => {
    expect(parseHubUrls("https://a.com, https://b.com")).toEqual([
      "https://a.com",
      "https://b.com",
    ]);
  });

  it("test_newline_separated", () => {
    expect(parseHubUrls("https://a.com\nhttps://b.com")).toEqual([
      "https://a.com",
      "https://b.com",
    ]);
  });

  it("test_mixed_commas_and_newlines", () => {
    expect(
      parseHubUrls("https://a.com,\nhttps://b.com,\r\nhttps://c.com"),
    ).toEqual(["https://a.com", "https://b.com", "https://c.com"]);
  });

  it("test_normalize_https_when_missing", () => {
    expect(parseHubUrls("example.com/careers, jobs.other.co")).toEqual([
      "https://example.com/careers",
      "https://jobs.other.co",
    ]);
  });

  it("test_preserves_http_scheme", () => {
    expect(parseHubUrls("http://legacy.example/jobs")).toEqual([
      "http://legacy.example/jobs",
    ]);
  });

  it("test_skips_empty_tokens", () => {
    expect(parseHubUrls("https://a.com,, \n , https://b.com")).toEqual([
      "https://a.com",
      "https://b.com",
    ]);
  });

  it("test_spaces_inside_url_not_used_as_separator", () => {
    expect(parseHubUrls("https://example.com/careers/foo bar")).toEqual([
      "https://example.com/careers/foo bar",
    ]);
  });

  it("test_empty_and_whitespace_only", () => {
    expect(parseHubUrls("")).toEqual([]);
    expect(parseHubUrls("   \n  ,,\n ")).toEqual([]);
  });

  it("test_utf8_bom_stripped", () => {
    expect(parseHubUrls("\ufeffhttps://a.com")).toEqual(["https://a.com"]);
  });
});

describe("TestReadHubUrlsFile", () => {
  it("test_reads_file", () => {
    const dir = mkdtempSync(join(tmpdir(), "hub-urls-"));
    const filePath = join(dir, "urls.txt");
    try {
      writeFileSync(
        filePath,
        "boards.greenhouse.io/foo,\nhttps://b.com",
        "utf8",
      );
      expect(readHubUrlsFile(filePath)).toEqual([
        "https://boards.greenhouse.io/foo",
        "https://b.com",
      ]);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
});
