#!/usr/bin/env python3
"""
Small helper to bump the cache-busting version of common.js across all HTML files
and the README. Usage:

    python update_common_version.py 1.6

Only updates strings that look like `common.js?v=X.Y`. Exits with code 1 on bad
input and prints a short summary of modified files.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python update_common_version.py <version>", file=sys.stderr)
        return 1

    raw_version = sys.argv[1].strip()
    if raw_version.startswith("v"):
        raw_version = raw_version[1:]

    if not re.fullmatch(r"\d+(?:\.\d+)*", raw_version):
        print("Version must be numeric, e.g. 1.6 or 2.0.1", file=sys.stderr)
        return 1

    root = Path(__file__).resolve().parent
    targets = list(root.rglob("*.html"))
    readme = root / "README.md"
    if readme.exists():
        targets.append(readme)

    pattern = re.compile(r"(common\.js\?v=)(\d+(?:\.\d+)*)")
    changed_files = []

    for path in targets:
        text = path.read_text(encoding="utf-8")
        new_text = pattern.sub(rf"\1{raw_version}", text)
        if new_text != text:
            path.write_text(new_text, encoding="utf-8")
            changed_files.append(path.relative_to(root))

    print(f"Updated version to {raw_version} in {len(changed_files)} file(s).")
    for rel in changed_files:
        print(f" - {rel}")

    return 0


if __name__ == "__main__":
    sys.exit(main())

