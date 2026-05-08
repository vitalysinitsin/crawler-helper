import { readFileSync } from "node:fs";

/**
 * Career hub URLs are separated by commas and/or line breaks only — do not split on
 * spaces so paths like "/jobs/foo bar" stay intact when pasted without encoding.
 */
const SPLIT_RE = /,|[\r\n]+/;

/**
 * Split raw text into hub URLs.
 *
 * Tokens are separated by commas and/or newlines (CRLF counts as one break).
 * Each token is stripped; empty tokens are skipped. Schemes default to https://.
 */
export function parseHubUrls(raw: string): string[] {
  const text = raw.replace(/^\uFEFF+/, "").trim();
  if (!text) {
    return [];
  }
  const out: string[] = [];
  for (const token of text.split(SPLIT_RE)) {
    const u = token.trim();
    if (!u) {
      continue;
    }
    if (!u.startsWith("http://") && !u.startsWith("https://")) {
      out.push(`https://${u}`);
    } else {
      out.push(u);
    }
  }
  return out;
}

export function readHubUrlsFile(filePath: string): string[] {
  return parseHubUrls(readFileSync(filePath, "utf8"));
}
