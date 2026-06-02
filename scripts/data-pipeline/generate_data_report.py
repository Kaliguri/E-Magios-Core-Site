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
USER_DISPLAY_NAME_BY_UID = {
    "4BzLAuul5UOkokZiXkvMajzDkgq2": "xGaida",
    "NgY5bTPvLohTQZsakTLTSozYbWo1": "Vakineti",
    "fgvej6iwakMQE7hx9rxKpBecxLc2": "Foxl",
    "hYxVKqLCrSUSyut88VXC1XvBt7t1": "Shieldomirs",
}



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


def _normalize_dice_type(raw: Any) -> str:
    text = str(raw or "").strip().lower()
    if not text:
        return ""
    if text.startswith("d"):
        return text
    if text.isdigit():
        return f"d{text}"
    return text


def _parse_sides(dice_type: str, sides_value: Any) -> int:
    if isinstance(sides_value, int) and sides_value > 0:
        return sides_value
    if dice_type.startswith("d") and dice_type[1:].isdigit():
        return int(dice_type[1:])
    return 0


def _normalize_context(event: Dict[str, Any]) -> str:
    context = str(event.get("context", "")).strip().lower()
    if context:
        return context
    roll_type = str(event.get("contextRollType", "")).strip().lower()
    if roll_type:
        return roll_type
    source = str(event.get("contextSource", "")).strip().lower()
    if "arcana" in source:
        return "arcana"
    if "hit" in source:
        return "hit"
    if "apply" in source:
        return "apply"
    return "other"


def _context_label(context: str) -> str:
    mapping = {
        "arcana": "Аркана",
        "hit": "Попадание",
        "apply": "Наложение эффекта",
        "other": "Другое",
        "custom_attack": "Кастомный: атака",
        "custom_damage": "Кастомный: урон",
        "custom_control": "Кастомный: контроль",
        "custom_support": "Кастомный: поддержка",
    }
    return mapping.get(context, context or "Не указан")


def _resolve_user_display_name(user_id: str, event: Dict[str, Any]) -> str:
    from_event = str(event.get("userDisplayName") or event.get("userLabel") or "").strip()
    if from_event:
        return from_event
    from_map = USER_DISPLAY_NAME_BY_UID.get(user_id)
    if from_map:
        return from_map
    return user_id or "anonymous"


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


def _build_empty_dice_block(reason: str) -> Dict[str, Any]:
    return {
        "status": "insufficient_data",
        "reason": reason,
        "rollsCountByDiceType": {},
        "avgResultByDiceType": {},
        "theoreticalAvgByDiceType": {},
        "avgDeltaFromTheoretical": {},
        "critFailRate": {},
        "critSuccessRate": {},
        "userAvgVsGlobal": [],
        "userSummaries": [],
        "rollTypeStats": [],
        "topRollType": None,
    }


def _build_dice_block(data_dir: Path) -> Dict[str, Any]:
    events_path = data_dir / "dice_roll_events.json"
    if not events_path.exists():
        return _build_empty_dice_block("Источник dice_roll_events.json не найден.")

    try:
        events = json.loads(events_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        events = []

    if not isinstance(events, list) or not events:
        return _build_empty_dice_block("dice_roll_events.json пуст или содержит некорректные события.")

    dice_values: Dict[str, List[int]] = defaultdict(list)
    user_dice_values: Dict[tuple[str, str], List[int]] = defaultdict(list)
    user_summary_values: Dict[str, Dict[str, Any]] = {}
    roll_type_values: Dict[str, List[int]] = defaultdict(list)
    roll_type_meta: Dict[str, Dict[str, Any]] = {}

    for event in events:
        if not isinstance(event, dict):
            continue

        dice_type = _normalize_dice_type(event.get("diceType"))
        result = event.get("result")
        sides = _parse_sides(dice_type, event.get("sides"))
        user_id = str(event.get("userId", "anonymous"))
        user_display_name = _resolve_user_display_name(user_id, event)

        if not isinstance(result, int) or not dice_type or sides <= 0:
            continue

        context = _normalize_context(event)
        expression = str(event.get("expression") or event.get("displayExpression") or dice_type).strip()
        roll_type_key = str(event.get("rollTypeKey") or f"{context}:{dice_type}").strip().lower()

        dice_values[dice_type].append(result)
        user_dice_values[(user_id, dice_type)].append(result)
        if user_id not in user_summary_values:
            user_summary_values[user_id] = {
                "userId": user_id,
                "userDisplayName": user_display_name,
                "rollsCount": 0,
                "resultSum": 0,
                "deltaSum": 0,
                "critFailCount": 0,
                "critSuccessCount": 0,
                "lastRollAt": int(event.get("createdAt") or 0),
            }
        user_pack = user_summary_values[user_id]
        user_pack["userDisplayName"] = user_display_name
        user_pack["rollsCount"] += 1
        user_pack["resultSum"] += result
        theoretical = (sides + 1) / 2
        user_pack["deltaSum"] += result - theoretical
        if result == 1:
            user_pack["critFailCount"] += 1
        if result == sides:
            user_pack["critSuccessCount"] += 1
        created_at = int(event.get("createdAt") or 0)
        if created_at > int(user_pack["lastRollAt"]):
            user_pack["lastRollAt"] = created_at
        roll_type_values[roll_type_key].append(result)
        if roll_type_key not in roll_type_meta:
            roll_type_meta[roll_type_key] = {
                "context": context,
                "diceType": dice_type,
                "expression": expression,
                "sides": sides,
                "label": f"{_context_label(context)} {dice_type.upper()} ({expression})",
            }

    if not dice_values:
        return _build_empty_dice_block("В событиях нет валидных данных по броскам.")

    rolls_count = {dice: len(values) for dice, values in dice_values.items()}
    avg_by_dice = {dice: round(mean(values), 4) for dice, values in dice_values.items() if values}
    theoretical_avg = {}
    avg_delta = {}
    crit_fail = {}
    crit_success = {}

    for dice, values in dice_values.items():
        sides = _parse_sides(dice, None)
        if sides <= 0:
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
                "userDisplayName": user_summary_values.get(user_id, {}).get("userDisplayName", user_id),
                "diceType": dice,
                "userAvg": user_avg,
                "globalAvg": global_avg,
                "delta": round(user_avg - global_avg, 4),
                "rollsCount": len(values),
            }
        )
    user_avg_vs_global.sort(key=lambda row: row["rollsCount"], reverse=True)

    user_summaries = []
    for user_pack in user_summary_values.values():
        user_rolls_count = int(user_pack["rollsCount"])
        if user_rolls_count <= 0:
            continue
        user_summaries.append(
            {
                "userId": user_pack["userId"],
                "userDisplayName": user_pack["userDisplayName"],
                "rollsCount": user_rolls_count,
                "lastRollAt": int(user_pack["lastRollAt"]),
                "avgResult": round(user_pack["resultSum"] / user_rolls_count, 4),
                "avgDeltaFromTheoretical": round(user_pack["deltaSum"] / user_rolls_count, 4),
                "critFailCount": int(user_pack["critFailCount"]),
                "critSuccessCount": int(user_pack["critSuccessCount"]),
                "critFailRate": round(user_pack["critFailCount"] / user_rolls_count, 4),
                "critSuccessRate": round(user_pack["critSuccessCount"] / user_rolls_count, 4),
            }
        )
    user_summaries.sort(key=lambda row: (-row["rollsCount"], row["userDisplayName"]))

    roll_type_stats = []
    total_rolls = sum(rolls_count.values())
    for roll_type_key, values in roll_type_values.items():
        meta = roll_type_meta.get(roll_type_key, {})
        sides = int(meta.get("sides", 0))
        if not values or sides <= 0:
            continue
        actual_avg = round(mean(values), 4)
        theor_avg = round((sides + 1) / 2, 4)
        roll_type_stats.append(
            {
                "rollTypeKey": roll_type_key,
                "label": meta.get("label"),
                "context": meta.get("context"),
                "diceType": meta.get("diceType"),
                "expression": meta.get("expression"),
                "count": len(values),
                "share": round((len(values) / total_rolls), 4) if total_rolls > 0 else 0.0,
                "avg": actual_avg,
                "theoreticalAvg": theor_avg,
                "delta": round(actual_avg - theor_avg, 4),
                "critFailRate": round(sum(1 for v in values if v == 1) / len(values), 4),
                "critSuccessRate": round(sum(1 for v in values if v == sides) / len(values), 4),
            }
        )

    roll_type_stats.sort(key=lambda row: (-row["count"], row["rollTypeKey"]))
    top_roll_type = roll_type_stats[0] if roll_type_stats else None

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
        "userSummaries": user_summaries,
        "rollTypeStats": roll_type_stats,
        "topRollType": top_roll_type,
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
    top_roll = dice.get("topRollType") or {}

    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Отчет обработки данных</title>
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
  <h1>Отчет обработки данных</h1>
  <p class="muted">Сформирован: {data_report.get("generatedAt", "")}</p>

  <h2>Качество</h2>
  <div class="cards">
    <div class="card"><strong>Ошибки</strong><div>{totals.get("error", 0)}</div></div>
    <div class="card"><strong>Предупреждения</strong><div>{totals.get("warning", 0)}</div></div>
    <div class="card"><strong>Инфо</strong><div>{totals.get("info", 0)}</div></div>
  </div>

  <h2>Контент</h2>
  <div class="cards">
    <div class="card"><strong>Заклинания</strong><div>{content.get("totals", {}).get("spells", 0)}</div></div>
    <div class="card"><strong>Школы</strong><div>{content.get("totals", {}).get("schools", 0)}</div></div>
    <div class="card"><strong>Концентрация %</strong><div>{content.get("concentrationShare", 0)}</div></div>
    <div class="card"><strong>Подзаклинания %</strong><div>{content.get("subspellShare", 0)}</div></div>
  </div>

  <h2>Броски</h2>
  <p>Статус: {dice.get("status", "unknown")}</p>
  <p class="muted">{dice.get("reason", "") or ""}</p>
  <p>Самый популярный бросок: {top_roll.get("label", "Нет данных")}</p>
  <p>Количество: {top_roll.get("count", 0)}</p>
</body>
</html>
"""
