#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Relation integrity checks for compendium data."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Set


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_list(data_dir: Path, file_name: str) -> List[Dict[str, Any]]:
    path = data_dir / file_name
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []
    return data if isinstance(data, list) else []


def _build_lookup(records: Iterable[Dict[str, Any]]) -> Set[str]:
    values: Set[str] = set()
    for rec in records:
        rec_id = rec.get("id")
        name = rec.get("name")
        if isinstance(rec_id, str) and rec_id.strip():
            values.add(rec_id.strip().lower())
        if isinstance(name, str) and name.strip():
            values.add(name.strip().lower())
    return values


def _as_list(value: Any) -> List[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []


def _issue(
    issues: List[Dict[str, Any]],
    collection: str,
    entity_id: str | None,
    rule: str,
    message: str,
    level: str = "error",
) -> None:
    issues.append(
        {
            "level": level,
            "rule": rule,
            "collection": collection,
            "entityId": entity_id,
            "message": message,
        }
    )


def run_relation_checks(data_dir: Path) -> Dict[str, Any]:
    spells = _load_list(data_dir, "spells.json")
    schools = _load_list(data_dir, "schools.json")
    effects = _load_list(data_dir, "effects.json")
    action_types = _load_list(data_dir, "action_types.json")

    school_lookup = _build_lookup(schools)
    spell_lookup = _build_lookup(spells)
    action_type_lookup = _build_lookup(action_types)

    issues: List[Dict[str, Any]] = []
    checked = 0

    for spell in spells:
        checked += 1
        spell_id = str(spell.get("id", "")).strip() or None
        for school_ref in _as_list(spell.get("school")):
            if school_ref.lower() not in school_lookup:
                _issue(
                    issues,
                    "spells",
                    spell_id,
                    "missing-school-reference",
                    f"spell.school references unknown school '{school_ref}'.",
                )

    for school in schools:
        checked += 1
        school_id = str(school.get("id", "")).strip() or None
        for related_ref in _as_list(school.get("relatedSchools")):
            if related_ref.lower() not in school_lookup:
                _issue(
                    issues,
                    "schools",
                    school_id,
                    "missing-related-school-reference",
                    f"school.relatedSchools references unknown school '{related_ref}'.",
                )
        for spell_ref in _as_list(school.get("educationalSpells")):
            if spell_ref.lower() not in spell_lookup:
                _issue(
                    issues,
                    "schools",
                    school_id,
                    "missing-educational-spell-reference",
                    f"school.educationalSpells references unknown spell '{spell_ref}'.",
                )

    effect_enum_values = {"обычный", "относительное"}

    for effect in effects:
        checked += 1
        effect_id = str(effect.get("id", "")).strip() or None
        action_type = effect.get("actionType")
        if isinstance(action_type, str) and action_type.strip():
            normalized = action_type.strip().lower()
            if normalized in effect_enum_values:
                continue
            if normalized not in action_type_lookup:
                _issue(
                    issues,
                    "effects",
                    effect_id,
                    "missing-action-type-reference",
                    f"effect.actionType references unknown action type '{action_type}'.",
                    level="warning",
                )

    return {
        "generatedAt": _utc_now_iso(),
        "issues": issues,
        "summary": {
            "checkedEntities": checked,
            "failedChecks": len(issues),
        },
    }
