#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple


DICE_EXPRESSION_RE = re.compile(r"\b(\d{1,3})d(2|4|6|8|10|12|20|100)([+\-]\d+)?\b", flags=re.IGNORECASE)
BASE_ROLL_TYPES = ("arcana", "hit", "apply")


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Parse all roll types and expressions used on the site.")
    parser.add_argument("--data-dir", default="data", help="Directory with source JSON data (default: data).")
    parser.add_argument(
        "--output",
        default="scripts/data-pipeline/roll_types_catalog.json",
        help="Output catalog path (default: scripts/data-pipeline/roll_types_catalog.json).",
    )
    return parser.parse_args()


def iter_strings(payload: Any) -> List[str]:
    collected: List[str] = []
    stack = [payload]
    while stack:
        item = stack.pop()
        if isinstance(item, dict):
            stack.extend(item.values())
            continue
        if isinstance(item, list):
            stack.extend(item)
            continue
        if isinstance(item, str) and item.strip():
            collected.append(item)
    return collected


def detect_roll_type(text: str) -> str:
    lowered = text.lower()
    if "бросок на аркану" in lowered:
        return "arcana"
    if "бросок на попадание" in lowered:
        return "hit"
    if "бросок на наложение эффекта" in lowered:
        return "apply"
    if "урон" in lowered:
        return "damage"
    return "custom"


def expression_entry(roll_type: str, expression: str, source: str) -> Dict[str, Any]:
    match = DICE_EXPRESSION_RE.search(expression)
    if not match:
        raise ValueError("Invalid dice expression")
    sides = int(match.group(2))
    return {
        "rollType": roll_type,
        "diceExpression": expression.lower(),
        "diceType": f"d{sides}",
        "sides": sides,
        "source": source,
    }


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def build_catalog(data_dir: Path) -> Dict[str, Any]:
    entries: List[Dict[str, Any]] = []
    seen: Set[Tuple[str, str, str]] = set()

    for roll_type in BASE_ROLL_TYPES:
        key = (roll_type, "1d12", "d12")
        if key in seen:
            continue
        seen.add(key)
        entries.append(expression_entry(roll_type, "1d12", "system:base-roll-type"))

    for path in sorted(data_dir.glob("*.json")):
        payload = load_json(path)
        if payload is None:
            continue
        strings = iter_strings(payload)
        for text in strings:
            roll_type = detect_roll_type(text)
            for match in DICE_EXPRESSION_RE.finditer(text):
                expression = match.group(0).lower()
                dice_type = f"d{int(match.group(2))}"
                key = (roll_type, expression, dice_type)
                if key in seen:
                    continue
                seen.add(key)
                entries.append(expression_entry(roll_type, expression, f"data:{path.name}"))

    entries.sort(key=lambda item: (item["rollType"], item["diceType"], item["diceExpression"]))
    by_roll_type: Dict[str, int] = {}
    by_dice_type: Dict[str, int] = {}
    for item in entries:
        by_roll_type[item["rollType"]] = by_roll_type.get(item["rollType"], 0) + 1
        by_dice_type[item["diceType"]] = by_dice_type.get(item["diceType"], 0) + 1

    return {
        "schemaVersion": "1.0.0",
        "generatedAt": utc_now_iso(),
        "summary": {
            "totalEntries": len(entries),
            "byRollType": by_roll_type,
            "byDiceType": by_dice_type,
        },
        "entries": entries,
    }


def main() -> int:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[2]
    data_dir = (repo_root / args.data_dir).resolve()
    output_path = (repo_root / args.output).resolve()

    catalog = build_catalog(data_dir)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Каталог типов бросков сохранен: {output_path}")
    print(f"Всего типов: {catalog['summary']['totalEntries']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
