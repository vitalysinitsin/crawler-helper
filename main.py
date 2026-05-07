from __future__ import annotations

import argparse
import json
import os
import re
import sys
import tempfile
from pathlib import Path
from typing import Any


def parse_hub_urls(raw: str) -> list[str]:
    tokens = re.split(r"[\s,]+", raw.strip())
    urls: list[str] = []
    for tok in tokens:
        u = tok.strip()
        if not u:
            continue
        if not u.startswith(("http://", "https://")):
            u = f"https://{u}"
        urls.append(u)
    return urls


def read_hub_urls_file(path: Path) -> list[str]:
    return parse_hub_urls(path.read_text(encoding="utf-8"))


def load_json_jobs(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError(f"Expected JSON array in {path}")
    out: list[dict[str, Any]] = []
    for item in data:
        if isinstance(item, dict):
            out.append(item)
    return out


def merge_job_snapshots(
    previous: list[dict[str, Any]], new_jobs: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    prev_links = {
        str(j["link"])
        for j in previous
        if j.get("link") is not None and str(j["link"]).strip() != ""
    }
    by_link: dict[str, dict[str, Any]] = {}
    for job in new_jobs:
        link = job.get("link")
        if link is None or str(link).strip() == "":
            continue
        link_s = str(link)
        row = dict(job)
        row["link"] = link_s
        by_link[link_s] = row

    merged: list[dict[str, Any]] = []
    for link in sorted(by_link.keys()):
        row = dict(by_link[link])
        row["net_new"] = link not in prev_links
        merged.append(row)
    return merged


def write_json_atomic(path: Path, data: Any, *, indent: int = 2) -> None:
    path = path.expanduser().resolve()
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(
        prefix=f".{path.name}.",
        suffix=".tmp",
        dir=str(path.parent),
        text=True,
    )
    tmp_path = Path(tmp_name)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as tmp_f:
            json.dump(data, tmp_f, indent=indent, ensure_ascii=False)
            tmp_f.write("\n")
            tmp_f.flush()
            os.fsync(tmp_f.fileno())
        os.replace(tmp_path, path)
    except BaseException:
        try:
            tmp_path.unlink(missing_ok=True)
        except OSError:
            pass
        raise


def collect_jobs(hub_urls: list[str]) -> list[dict[str, Any]]:
    """Placeholder until ATS/generic extractors are wired."""
    return []


def build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Career hub crawler: sync job postings to JSON (extractors plug in here)."
    )
    p.add_argument(
        "--urls",
        type=Path,
        required=True,
        help="Text file of career hub URLs (commas and/or newlines, optional whitespace).",
    )
    p.add_argument(
        "--out",
        type=Path,
        required=True,
        help="Destination JSON path (array of job objects). Written atomically.",
    )
    p.add_argument(
        "--previous",
        type=Path,
        default=None,
        help="Prior snapshot JSON for net_new and removals. Defaults to the same path as --out.",
    )
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_arg_parser().parse_args(argv)
    urls_path: Path = args.urls
    out_path: Path = args.out
    previous_path: Path = args.previous if args.previous is not None else args.out

    if not urls_path.is_file():
        print(f"error: --urls is not a file: {urls_path}", file=sys.stderr)
        return 1

    hub_urls = read_hub_urls_file(urls_path)
    if not hub_urls:
        print(f"warning: no hub URLs parsed from {urls_path}", file=sys.stderr)

    try:
        previous = load_json_jobs(previous_path)
    except (json.JSONDecodeError, OSError, ValueError) as e:
        print(f"error: cannot read --previous {previous_path}: {e}", file=sys.stderr)
        return 1

    new_jobs = collect_jobs(hub_urls)

    merged = merge_job_snapshots(previous, new_jobs)
    try:
        write_json_atomic(out_path, merged)
    except OSError as e:
        print(f"error: cannot write --out {out_path}: {e}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
