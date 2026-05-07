from __future__ import annotations

import re
from pathlib import Path

# Career hub URLs are separated by commas and/or line breaks only — do not split on
# spaces so paths like "/jobs/foo bar" stay intact when pasted without encoding.
_SPLIT_RE = re.compile(r",|[\r\n]+")


def parse_hub_urls(raw: str) -> list[str]:
    """Split raw text into hub URLs.

    Tokens are separated by commas and/or newlines (CRLF counts as one break).
    Each token is stripped; empty tokens are skipped. Schemes default to https://.
    """
    text = raw.lstrip("\ufeff").strip()
    if not text:
        return []
    out: list[str] = []
    for token in _SPLIT_RE.split(text):
        u = token.strip()
        if not u:
            continue
        if not u.startswith(("http://", "https://")):
            u = f"https://{u}"
        out.append(u)
    return out


def read_hub_urls_file(path: Path) -> list[str]:
    return parse_hub_urls(path.read_text(encoding="utf-8"))
