# Crawler Helper

Node.js CLI that reads hub URLs from a file, runs job collection (currently a stub), merges the result with a previous snapshot, and writes JSON atomically.

This repository targets **Node.js only**. There is no Python runtime or dual-stack tooling—install dependencies with npm and use the scripts below.

## Requirements

- [Node.js](https://nodejs.org/) 20 or newer
- npm (ships with Node)

## Setup

```bash
npm install
npm run build
```

## Usage

After `npm run build`, run the compiled CLI:

```bash
node dist/cli.js --urls path/to/hubs.txt --out snapshot.json
```

From the package directory you can also use the exposed binary:

```bash
npx crawler-helper --urls path/to/hubs.txt --out snapshot.json
```

Optional `--previous` defaults to `--out` (the same file is used as the prior snapshot when merging).

## Behavior overview

Hub URLs are parsed from a comma- or newline-separated file (`src/urls.ts`). `collectJobs` returns an empty array until crawlers are implemented (`src/collect-jobs.ts`). Results are merged with the previous JSON snapshot (`src/merge.ts`) and written via a temp file plus rename (`src/atomic-json.ts`).

## Project layout

| Path | Role |
|------|------|
| `src/urls.ts` | Parse hub URLs from a comma/newline-separated file |
| `src/merge.ts` | Load previous jobs JSON and merge/dedupe snapshots |
| `src/atomic-json.ts` | Write JSON with temp file + rename |
| `src/collect-jobs.ts` | Job collection entry point (returns an empty list until crawlers are wired in) |
| `src/cli.ts` | Argument parsing and orchestration |
| `tests/*.test.ts` | Vitest unit tests |

## Scripts

- `npm run build` — compile TypeScript to `dist/`
- `npm test` — build then run Vitest
- `npm run test:watch` — Vitest watch mode

## Continuous integration

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs `npm ci` and `npm test` on pushes and pull requests to `main` / `master`.

## License

MIT
