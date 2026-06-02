#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from __future__ import annotations

import argparse
import json
import random
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List


DEFAULT_USER_IDS = [
    "4BzLAuul5UOkokZiXkvMajzDkgq2",
    "NgY5bTPvLohTQZsakTLTSozYbWo1",
    "fgvej6iwakMQE7hx9rxKpBecxLc2",
    "hYxVKqLCrSUSyut88VXC1XvBt7t1",
]

CUSTOM_KINDS = ["custom_attack", "custom_damage", "custom_control", "custom_support"]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate reusable seeded dice events dataset.")
    parser.add_argument("--catalog", default="scripts/data-pipeline/roll_types_catalog.json", help="Roll types catalog path.")
    parser.add_argument("--output", default="data/dice_roll_events.json", help="Output dice events path.")
    parser.add_argument("--mirror-output", default="apps/web/public/data/dice_roll_events.json", help="Optional mirror output path.")
    parser.add_argument("--total-events", type=int, default=600, help="Total events to generate.")
    parser.add_argument("--d12-events", type=int, default=500, help="Count of events that must use D12.")
    parser.add_argument("--custom-events", type=int, default=100, help="Count of custom events.")
    parser.add_argument("--custom-kinds", type=int, default=4, help="Count of unique custom kinds.")
    parser.add_argument("--seed", type=int, default=42, help="Seed for deterministic generation.")
    parser.add_argument(
        "--user-ids",
        nargs="+",
        default=DEFAULT_USER_IDS,
        help="User IDs for generated events.",
    )
    return parser.parse_args()


def load_catalog(path: Path) -> List[Dict[str, Any]]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []
    entries = payload.get("entries", []) if isinstance(payload, dict) else []
    return [item for item in entries if isinstance(item, dict)]


def create_event(
    user_id: str,
    entry: Dict[str, Any],
    context: str,
    created_at: int,
    sequence: int,
    rng: random.Random,
) -> Dict[str, Any]:
    sides = int(entry.get("sides", 0))
    result = rng.randint(1, max(1, sides))
    dice_type = str(entry.get("diceType", f"d{sides}")).lower()
    expression = str(entry.get("diceExpression", dice_type)).lower()
    roll_type_key = f"{context}:{dice_type}"
    event_id = str(uuid.uuid4())
    event_name = f"{context} {dice_type}".strip()
    return {
        "id": event_id,
        "name": event_name,
        "eventId": event_id,
        "sequence": sequence,
        "userId": user_id,
        "userLabel": f"uid-{user_id[:6]}",
        "characterId": None,
        "diceType": dice_type,
        "sides": sides,
        "result": result,
        "modifier": 0,
        "total": result,
        "context": context,
        "rollTypeKey": roll_type_key,
        "expression": expression,
        "sessionId": f"seed-{sequence:04d}",
        "createdAt": created_at,
        "appVersion": "seed-generator-v1",
    }


def weighted_pick(pool: List[Dict[str, Any]], rng: random.Random) -> Dict[str, Any]:
    if not pool:
        return {"diceType": "d12", "sides": 12, "diceExpression": "1d12"}
    return pool[rng.randrange(0, len(pool))]


def split_counts(total: int, groups: int) -> List[int]:
    base = total // groups
    rest = total % groups
    return [base + (1 if idx < rest else 0) for idx in range(groups)]


def build_events(args: argparse.Namespace, catalog_entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if args.total_events <= 0:
        return []
    if args.d12_events + args.custom_events > args.total_events:
        raise ValueError("Сумма d12-events и custom-events превышает total-events.")

    rng = random.Random(args.seed)
    now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
    users = args.user_ids or DEFAULT_USER_IDS
    if not users:
        raise ValueError("Нужен хотя бы один userId.")

    d12_pool = [item for item in catalog_entries if str(item.get("diceType", "")).lower() == "d12"]
    if not d12_pool:
        d12_pool = [{"rollType": "arcana", "diceExpression": "1d12", "diceType": "d12", "sides": 12}]

    custom_pool = [item for item in catalog_entries if str(item.get("diceType", "")).lower() != "d12"]
    if not custom_pool:
        custom_pool = [{"rollType": "custom", "diceExpression": "2d4", "diceType": "d4", "sides": 4}]

    custom_kind_count = max(1, min(args.custom_kinds, len(CUSTOM_KINDS)))
    selected_custom_kinds = CUSTOM_KINDS[:custom_kind_count]
    custom_kind_distribution = split_counts(args.custom_events, custom_kind_count)

    events: List[Dict[str, Any]] = []
    sequence = 1

    user_cursor = 0
    d12_contexts = ["arcana", "hit", "apply", "other"]
    for idx in range(args.d12_events):
        entry = weighted_pick(d12_pool, rng)
        context = d12_contexts[idx % len(d12_contexts)]
        user_id = users[user_cursor % len(users)]
        user_cursor += 1
        event = create_event(user_id, entry, context, now_ms + sequence * 1000, sequence, rng)
        events.append(event)
        sequence += 1

    for kind_idx, custom_kind in enumerate(selected_custom_kinds):
        kind_events = custom_kind_distribution[kind_idx]
        for _ in range(kind_events):
            entry = weighted_pick(custom_pool, rng)
            user_id = users[user_cursor % len(users)]
            user_cursor += 1
            event = create_event(user_id, entry, custom_kind, now_ms + sequence * 1000, sequence, rng)
            events.append(event)
            sequence += 1

    remaining_events = args.total_events - len(events)
    if remaining_events > 0:
        mixed_pool = d12_pool + custom_pool
        mixed_contexts = ["arcana", "hit", "apply", "other"] + selected_custom_kinds
        for idx in range(remaining_events):
            entry = weighted_pick(mixed_pool, rng)
            context = mixed_contexts[idx % len(mixed_contexts)]
            user_id = users[user_cursor % len(users)]
            user_cursor += 1
            event = create_event(user_id, entry, context, now_ms + sequence * 1000, sequence, rng)
            events.append(event)
            sequence += 1

    rng.shuffle(events)
    events.sort(key=lambda item: int(item["createdAt"]))
    return events


def summarize(events: List[Dict[str, Any]]) -> Dict[str, Any]:
    by_context: Dict[str, int] = {}
    by_dice_type: Dict[str, int] = {}
    by_user: Dict[str, int] = {}
    for item in events:
        context = str(item.get("context", "other"))
        dice_type = str(item.get("diceType", "unknown"))
        user = str(item.get("userId", "anonymous"))
        by_context[context] = by_context.get(context, 0) + 1
        by_dice_type[dice_type] = by_dice_type.get(dice_type, 0) + 1
        by_user[user] = by_user.get(user, 0) + 1
    return {
        "totalEvents": len(events),
        "byContext": by_context,
        "byDiceType": by_dice_type,
        "byUser": by_user,
    }


def main() -> int:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[2]
    catalog_path = (repo_root / args.catalog).resolve()
    output_path = (repo_root / args.output).resolve()
    mirror_path = (repo_root / args.mirror_output).resolve() if args.mirror_output else None

    entries = load_catalog(catalog_path)
    events = build_events(args, entries)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(events, ensure_ascii=False, indent=2), encoding="utf-8")

    if mirror_path is not None:
        mirror_path.parent.mkdir(parents=True, exist_ok=True)
        mirror_path.write_text(json.dumps(events, ensure_ascii=False, indent=2), encoding="utf-8")

    summary = summarize(events)
    print(f"Сгенерировано событий: {summary['totalEvents']}")
    print(f"По контекстам: {summary['byContext']}")
    print(f"По кубам: {summary['byDiceType']}")
    print(f"По пользователям: {summary['byUser']}")
    print(f"Файл: {output_path}")
    if mirror_path is not None:
        print(f"Зеркальный файл: {mirror_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
