#!/usr/bin/env node
import { stat } from "node:fs/promises";
import { parseArgs } from "node:util";

import { writeJsonAtomic } from "./atomic-json.js";
import { collectJobs } from "./collect-jobs.js";
import { loadPreviousJobs, mergeJobSnapshots } from "./merge.js";
import { readHubUrlsFile } from "./urls.js";

export async function runCli(argv: string[]): Promise<number> {
  let values: { urls?: string; out?: string; previous?: string };
  try {
    ({ values } = parseArgs({
      args: argv,
      options: {
        urls: { type: "string" },
        out: { type: "string" },
        previous: { type: "string" },
      },
      strict: true,
      allowPositionals: false,
    }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`error: ${msg}`);
    return 2;
  }

  if (!values.urls || !values.out) {
    console.error(
      "error: the following arguments are required: --urls, --out",
    );
    return 2;
  }

  const urlsPath = values.urls;
  const outPath = values.out;
  const previousPath = values.previous ?? values.out;

  try {
    const st = await stat(urlsPath);
    if (!st.isFile()) {
      console.error(`error: --urls is not a file: ${urlsPath}`);
      return 1;
    }
  } catch {
    console.error(`error: --urls is not a file: ${urlsPath}`);
    return 1;
  }

  const hubUrls = readHubUrlsFile(urlsPath);

  if (hubUrls.length === 0) {
    console.warn(`warning: no hub URLs parsed from ${urlsPath}`);
  }

  let previous;
  try {
    previous = loadPreviousJobs(previousPath);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`error: cannot read --previous ${previousPath}: ${msg}`);
    return 1;
  }

  const newJobs = await collectJobs(hubUrls);
  const merged = mergeJobSnapshots(previous, newJobs);

  try {
    await writeJsonAtomic(outPath, merged);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`error: cannot write --out ${outPath}: ${msg}`);
    return 1;
  }

  return 0;
}

async function main(): Promise<void> {
  const code = await runCli(process.argv.slice(2));
  process.exit(code);
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
