#!/usr/bin/env python3
"""
Cache-busting helper for static assets.

Default mode:
- Creates hashed copies of every *.js/*.css (e.g., common.abcdef12.js)
- Rewrites HTML/MD references to point at hashed names
- Rewrites import specifiers inside hashed copies so module graphs stay valid

Optional flags:
--query   Use ?v=<hash> instead of renaming files (no copies created)
--dry-run Show what would change without touching files
"""

from __future__ import annotations

import argparse
import hashlib
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, Tuple

ASSET_EXTS = {".js", ".css"}
HASH_LEN = 8
HASHED_NAME_RE = re.compile(r"\.[0-9a-f]{8}\.")


@dataclass
class Asset:
    path: Path
    digest: str

    @property
    def base_name(self) -> str:
        return self.path.name

    @property
    def hashed_name(self) -> str:
        return f"{self.path.stem}.{self.digest}{self.path.suffix}"

    @property
    def hashed_path(self) -> Path:
        return self.path.with_name(self.hashed_name)


def compute_digest(path: Path) -> str:
    data = path.read_bytes()
    return hashlib.sha1(data).hexdigest()[:HASH_LEN]


def collect_assets(root: Path) -> Dict[str, Asset]:
    assets: Dict[str, Asset] = {}
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in ASSET_EXTS:
            continue
        if HASHED_NAME_RE.search(path.name):
            # Skip already versioned copies
            continue
        digest = compute_digest(path)
        asset = Asset(path=path, digest=digest)
        assets[asset.base_name] = asset
    return assets


def replace_paths(text: str, mapping: Dict[str, str], *, use_query: bool) -> Tuple[str, int]:
    total = 0
    for base, replacement in mapping.items():
        # Avoid touching substrings of longer names (e.g. firebase-auth.js should not match auth.js)
        pattern = re.compile(rf"(?<![\w-]){re.escape(base)}(?:\?[^\"'\s>]*)?")
        repl = f"{base}?v={replacement}" if use_query else replacement
        text, count = pattern.subn(repl, text)
        total += count
    return text, total


def update_html_and_md(root: Path, mapping: Dict[str, str], *, use_query: bool, dry_run: bool) -> int:
    changed_files = 0
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".html", ".md"}:
            continue
        text = path.read_text(encoding="utf-8")
        new_text, count = replace_paths(text, mapping, use_query=use_query)
        if count and new_text != text:
            changed_files += 1
            if not dry_run:
                path.write_text(new_text, encoding="utf-8")
    return changed_files


def write_hashed_assets(assets: Iterable[Asset], name_map: Dict[str, str], *, dry_run: bool) -> int:
    written = 0
    for asset in assets:
        original_text = asset.path.read_text(encoding="utf-8")
        hashed_text, _ = replace_paths(original_text, name_map, use_query=False)
        if not dry_run:
            asset.hashed_path.write_text(hashed_text, encoding="utf-8")
        written += 1
    return written


def main() -> int:
    parser = argparse.ArgumentParser(description="Add cache-busting hashes to JS/CSS references.")
    parser.add_argument(
        "--query",
        action="store_true",
        help="Use ?v=<hash> query strings instead of renaming files (no copies created).",
    )
    parser.add_argument("--dry-run", action="store_true", help="Show planned changes without writing files.")
    args = parser.parse_args()

    root = Path(__file__).resolve().parent
    assets = collect_assets(root)

    if not assets:
        print("No assets found.")
        return 0

    name_map = {asset.base_name: asset.hashed_name for asset in assets.values()}
    hash_map = {asset.base_name: asset.digest for asset in assets.values()}

    if args.query:
        changed_html = update_html_and_md(root, hash_map, use_query=True, dry_run=args.dry_run)
        print(f"Updated references with query strings in {changed_html} file(s).")
        return 0

    written = write_hashed_assets(assets.values(), name_map, dry_run=args.dry_run)
    changed_html = update_html_and_md(root, name_map, use_query=False, dry_run=args.dry_run)

    print(f"Prepared {written} hashed asset(s).")
    print(f"Updated references to hashed names in {changed_html} file(s).")
    if args.dry_run:
        print("Dry-run mode: no files were written.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

