import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const cliEntry = join(rootDir, "dist", "cli.js");

function runCliSubprocess(
  args: string[],
): { status: number; stderr: string; stdout: string } {
  const r = spawnSync(process.execPath, [cliEntry, ...args], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  const status = r.status ?? (r.signal ? 1 : 0);
  return {
    status,
    stderr: typeof r.stderr === "string" ? r.stderr : "",
    stdout: typeof r.stdout === "string" ? r.stdout : "",
  };
}

describe.runIf(existsSync(cliEntry))("cli subprocess integration", () => {
  beforeAll(() => {
    expect(existsSync(cliEntry)).toBe(true);
  });

  it("exits 2 when required flags are missing", () => {
    const r = runCliSubprocess([]);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("required");
  });

  it("exits 1 when --urls is not a file", () => {
    const dir = mkdtempSync(join(tmpdir(), "cli-int-"));
    try {
      const outPath = join(dir, "out.json");
      const r = runCliSubprocess([
        "--urls",
        join(dir, "nope.txt"),
        "--out",
        outPath,
      ]);
      expect(r.status).toBe(1);
      expect(r.stderr).toContain("--urls is not a file");
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("writes merged JSON and exits 0", () => {
    const dir = mkdtempSync(join(tmpdir(), "cli-int-"));
    try {
      const urlsPath = join(dir, "urls.txt");
      const outPath = join(dir, "out.json");
      writeFileSync(urlsPath, "https://example.com/jobs\n", "utf8");
      const r = runCliSubprocess(["--urls", urlsPath, "--out", outPath]);
      expect(r.status).toBe(0);
      const written = JSON.parse(readFileSync(outPath, "utf8"));
      expect(written).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("warns on stderr when no hub URLs parsed", () => {
    const dir = mkdtempSync(join(tmpdir(), "cli-int-"));
    try {
      const urlsPath = join(dir, "urls.txt");
      const outPath = join(dir, "out.json");
      writeFileSync(urlsPath, " \n ", "utf8");
      const r = runCliSubprocess(["--urls", urlsPath, "--out", outPath]);
      expect(r.status).toBe(0);
      expect(r.stderr).toContain("warning: no hub URLs parsed");
      expect(JSON.parse(readFileSync(outPath, "utf8"))).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("exits 1 when --previous is invalid JSON", () => {
    const dir = mkdtempSync(join(tmpdir(), "cli-int-"));
    try {
      const urlsPath = join(dir, "urls.txt");
      const outPath = join(dir, "out.json");
      const prevPath = join(dir, "prev.json");
      writeFileSync(urlsPath, "https://a.com\n", "utf8");
      writeFileSync(prevPath, "{not json", "utf8");
      const r = runCliSubprocess([
        "--urls",
        urlsPath,
        "--out",
        outPath,
        "--previous",
        prevPath,
      ]);
      expect(r.status).toBe(1);
      expect(r.stderr).toContain("cannot read --previous");
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
});
