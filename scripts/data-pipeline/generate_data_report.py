#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build dashboard-friendly data report from validation outputs."""

from __future__ import annotations

import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean
from typing import Any, Dict, Iterable, List


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_list(data_dir: Path, file_name: str) -> List[Dict[str, Any]]:
    path = data_dir / file_name
    if not path.exists():
        return []
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []
    return payload if isinstance(payload, list) else []


def _iter_values(value: Any) -> Iterable[str]:
    if isinstance(value, list):
        for item in value:
            if isinstance(item, str) and item.strip():
                yield item.strip()
    elif isinstance(value, str) and value.strip():
        yield value.strip()


def _build_quality_block(validation_report: Dict[str, Any]) -> Dict[str, Any]:
    issues = validation_report.get("issues", [])
    totals = validation_report.get("totals", {"error": 0, "warning": 0, "info": 0})

    by_collection: Dict[str, Dict[str, int]] = defaultdict(lambda: {"error": 0, "warning": 0, "info": 0})
    rules_counter: Counter[str] = Counter()

    for issue in issues:
        collection = issue.get("collection", "unknown")
        level = issue.get("level", "info")
        rule = issue.get("rule", "unknown")

        if level not in ("error", "warning", "info"):
            level = "info"

        by_collection[collection][level] += 1
        rules_counter[rule] += 1

    top_rules = [{"rule": rule, "count": count} for rule, count in rules_counter.most_common(10)]

    return {
        "totals": totals,
        "issuesByCollection": by_collection,
        "topRules": top_rules,
    }


def _build_content_block(data_dir: Path) -> Dict[str, Any]:
    spells = _load_list(data_dir, "spells.json")
    schools = _load_list(data_dir, "schools.json")

    spells_by_school: Counter[str] = Counter()
    concentration_yes = 0
    spells_with_subspells = 0
    incomplete_objects = 0

    for spell in spells:
        for school in _iter_values(spell.get("school")):
            spells_by_school[school] += 1

        concentration = spell.get("concentration")
        if isinstance(concentration, str) and concentration.strip().lower() == "да":
            concentration_yes += 1

        subspells = spell.get("subspells")
        if isinstance(subspells, list) and subspells:
            spells_with_subspells += 1

        required = ("id", "name", "description", "type", "school")
        if any(
            key not in spell
            or spell.get(key) in (None, "", [])
            for key in required
        ):
            incomplete_objects += 1

    school_without_spells = 0
    links_counts: List[int] = []
    for school in schools:
        school_name = school.get("name", "")
        if isinstance(school_name, str) and school_name:
            if spells_by_school.get(school_name, 0) == 0:
                school_without_spells += 1
        related = school.get("relatedSchools")
        if isinstance(related, list):
            links_counts.append(len(related))

    total_spells = len(spells)
    total_schools = len(schools)
    avg_link_density = round(mean(links_counts), 3) if links_counts else 0.0

    return {
        "totals": {"spells": total_spells, "schools": total_schools},
        "spellsBySchool": [{"school": name, "count": count} for name, count in spells_by_school.most_common()],
        "concentrationShare": round((concentration_yes / total_spells) * 100, 2) if total_spells else 0.0,
        "subspellShare": round((spells_with_subspells / total_spells) * 100, 2) if total_spells else 0.0,
        "incompleteObjects": incomplete_objects,
        "schoolsWithoutSpells": school_without_spells,
        "relationDensityAvg": avg_link_density,
    }


def _build_dice_block(data_dir: Path) -> Dict[str, Any]:
    events_path = data_dir / "dice_roll_events.json"
    if not events_path.exists():
        return {
            "status": "insufficient_data",
            "reason": "No dice_roll_events.json source found.",
            "rollsCountByDiceType": {},
            "avgResultByDiceType": {},
            "theoreticalAvgByDiceType": {},
            "avgDeltaFromTheoretical": {},
            "critFailRate": {},
            "critSuccessRate": {},
            "userAvgVsGlobal": [],
        }

    try:
        events = json.loads(events_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        events = []

    if not isinstance(events, list) or not events:
        return {
            "status": "insufficient_data",
            "reason": "dice_roll_events.json exists but has no valid events.",
            "rollsCountByDiceType": {},
            "avgResultByDiceType": {},
            "theoreticalAvgByDiceType": {},
            "avgDeltaFromTheoretical": {},
            "critFailRate": {},
            "critSuccessRate": {},
            "userAvgVsGlobal": [],
        }

    dice_values: Dict[str, List[int]] = defaultdict(list)
    user_dice_values: Dict[tuple[str, str], List[int]] = defaultdict(list)

    for event in events:
        if not isinstance(event, dict):
            continue
        dice_type = event.get("diceType")
        result = event.get("result")
        sides = event.get("sides")
        user_id = event.get("userId", "anonymous")

        if not isinstance(dice_type, str) or not isinstance(result, int) or not isinstance(sides, int):
            continue
        if sides <= 0:
            continue

        dice_values[dice_type].append(result)
        user_dice_values[(str(user_id), dice_type)].append(result)

    rolls_count = {dice: len(values) for dice, values in dice_values.items()}
    avg_by_dice = {dice: round(mean(values), 4) for dice, values in dice_values.items() if values}
    theoretical_avg = {}
    avg_delta = {}
    crit_fail = {}
    crit_success = {}

    for dice, values in dice_values.items():
        sides = int(dice.lower().replace("d", "")) if dice.lower().startswith("d") else None
        if not sides or sides <= 0:
            continue
        theor = (sides + 1) / 2
        theoretical_avg[dice] = round(theor, 4)
        actual = avg_by_dice.get(dice, 0.0)
        avg_delta[dice] = round(actual - theor, 4)
        crit_fail[dice] = round(sum(1 for v in values if v == 1) / len(values), 4) if values else 0.0
        crit_success[dice] = round(sum(1 for v in values if v == sides) / len(values), 4) if values else 0.0

    user_avg_vs_global = []
    for (user_id, dice), values in user_dice_values.items():
        if not values:
            continue
        global_avg = avg_by_dice.get(dice)
        if global_avg is None:
            continue
        user_avg = round(mean(values), 4)
        user_avg_vs_global.append(
            {
                "userId": user_id,
                "diceType": dice,
                "userAvg": user_avg,
                "globalAvg": global_avg,
                "delta": round(user_avg - global_avg, 4),
                "rollsCount": len(values),
            }
        )

    return {
        "status": "ok",
        "reason": None,
        "rollsCountByDiceType": rolls_count,
        "avgResultByDiceType": avg_by_dice,
        "theoreticalAvgByDiceType": theoretical_avg,
        "avgDeltaFromTheoretical": avg_delta,
        "critFailRate": crit_fail,
        "critSuccessRate": crit_success,
        "userAvgVsGlobal": user_avg_vs_global,
    }


def build_data_report(data_dir: Path, validation_report: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "schemaVersion": "1.0.0",
        "generatedAt": _utc_now_iso(),
        "quality": _build_quality_block(validation_report),
        "content": _build_content_block(data_dir),
        "dice": _build_dice_block(data_dir),
    }


def build_data_report_html(data_report: Dict[str, Any]) -> str:
    quality = data_report.get("quality", {})
    totals = quality.get("totals", {})
    content = data_report.get("content", {})
    dice = data_report.get("dice", {})

    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Data Report</title>
  <style>
    body {{ font-family: Arial, sans-serif; background: #1a1a1a; color: #e0e0e0; margin: 0; padding: 24px; }}
    h1, h2 {{ color: #10b981; }}
    .cards {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }}
    .card {{ background: #2a2a2a; border: 1px solid #3a3a3a; border-radius: 10px; padding: 12px; }}
    .muted {{ color: #999999; }}
    ul {{ margin: 0; padding-left: 16px; }}
  </style>
</head>
<body>
  <h1>Data Processing Report</h1>
  <p class="muted">Generated at: {data_report.get("generatedAt", "")}</p>

  <h2>Quality</h2>
  <div class="cards">
    <div class="card"><strong>Errors</strong><div>{totals.get("error", 0)}</div></div>
    <div class="card"><strong>Warnings</strong><div>{totals.get("warning", 0)}</div></div>
    <div class="card"><strong>Info</strong><div>{totals.get("info", 0)}</div></div>
  </div>

  <h2>Content</h2>
  <div class="cards">
    <div class="card"><strong>Spells</strong><div>{content.get("totals", {}).get("spells", 0)}</div></div>
    <div class="card"><strong>Schools</strong><div>{content.get("totals", {}).get("schools", 0)}</div></div>
    <div class="card"><strong>Concentration %</strong><div>{content.get("concentrationShare", 0)}</div></div>
    <div class="card"><strong>Subspell %</strong><div>{content.get("subspellShare", 0)}</div></div>
  </div>

  <h2>Dice</h2>
  <p>Status: {dice.get("status", "unknown")}</p>
  <p class="muted">{dice.get("reason", "") or ""}</p>
</body>
</html>
"""
