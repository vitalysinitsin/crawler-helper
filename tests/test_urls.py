from __future__ import annotations

import sys
import unittest
from pathlib import Path

# Repo root on sys.path so `import urls` works when tests live under tests/
_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from urls import parse_hub_urls, read_hub_urls_file  # noqa: E402


class TestParseHubUrls(unittest.TestCase):
    def test_comma_separated(self) -> None:
        self.assertEqual(
            parse_hub_urls("https://a.com, https://b.com"),
            ["https://a.com", "https://b.com"],
        )

    def test_newline_separated(self) -> None:
        self.assertEqual(
            parse_hub_urls("https://a.com\nhttps://b.com"),
            ["https://a.com", "https://b.com"],
        )

    def test_mixed_commas_and_newlines(self) -> None:
        self.assertEqual(
            parse_hub_urls("https://a.com,\nhttps://b.com,\r\nhttps://c.com"),
            ["https://a.com", "https://b.com", "https://c.com"],
        )

    def test_normalize_https_when_missing(self) -> None:
        self.assertEqual(
            parse_hub_urls("example.com/careers, jobs.other.co"),
            ["https://example.com/careers", "https://jobs.other.co"],
        )

    def test_preserves_http_scheme(self) -> None:
        self.assertEqual(
            parse_hub_urls("http://legacy.example/jobs"),
            ["http://legacy.example/jobs"],
        )

    def test_skips_empty_tokens(self) -> None:
        self.assertEqual(
            parse_hub_urls("https://a.com,, \n , https://b.com"),
            ["https://a.com", "https://b.com"],
        )

    def test_spaces_inside_url_not_used_as_separator(self) -> None:
        self.assertEqual(
            parse_hub_urls("https://example.com/careers/foo bar"),
            ["https://example.com/careers/foo bar"],
        )

    def test_empty_and_whitespace_only(self) -> None:
        self.assertEqual(parse_hub_urls(""), [])
        self.assertEqual(parse_hub_urls("   \n  ,,\n "), [])

    def test_utf8_bom_stripped(self) -> None:
        self.assertEqual(
            parse_hub_urls("\ufeffhttps://a.com"),
            ["https://a.com"],
        )


class TestReadHubUrlsFile(unittest.TestCase):
    def test_reads_file(self) -> None:
        import tempfile

        with tempfile.NamedTemporaryFile(
            mode="w", encoding="utf-8", suffix=".txt", delete=False
        ) as f:
            f.write("boards.greenhouse.io/foo,\nhttps://b.com")
            path = Path(f.name)
        try:
            self.assertEqual(
                read_hub_urls_file(path),
                ["https://boards.greenhouse.io/foo", "https://b.com"],
            )
        finally:
            path.unlink(missing_ok=True)


if __name__ == "__main__":
    unittest.main()
