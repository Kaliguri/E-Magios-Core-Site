#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Validation checks for compendium JSON collections."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_collections(data_dir: Path) -> Dict[str, Any]:
    collections: Dict[str, Any] = {}
    for path in sorted(data_dir.glob("*.json")):
        try:
            collections[path.stem] = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            collections[path.stem] = None
    return collections


def _record_issue(
    issues: List[Dict[str, Any]],
    level: str,
    rule: str,
    collection: str,
    entity_id: str | None,
    message: str,
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


def _require_fields(
    issues: List[Dict[str, Any]],
    collection_name: str,
    item: Dict[str, Any],
    required: List[str],
) -> None:
    for field in required:
        value = item.get(field)
        if value is None or (isinstance(value, str) and value.strip() == ""):
            _record_issue(
                issues,
                "error",
                "required-field-missing",
                collection_name,
                str(item.get("id", "")) or None,
                f"Missing required field '{field}'.",
            )


def _check_short_description(
    issues: List[Dict[str, Any]], collection_name: str, item: Dict[str, Any], minimum: int = 20
) -> None:
    if "description" not in item:
        return
    description = item.get("description")
    if isinstance(description, str) and description.strip() and len(description.strip()) < minimum:
        _record_issue(
            issues,
            "warning",
            "description-too-short",
            collection_name,
            str(item.get("id", "")) or None,
            f"Description is shorter than {minimum} chars.",
        )


def _check_types(
    issues: List[Dict[str, Any]], collection_name: str, item: Dict[str, Any], type_rules: Dict[str, Tuple[type, ...]]
) -> None:
    for field, expected_types in type_rules.items():
        if field not in item:
            continue
        value = item[field]
        if not isinstance(value, expected_types):
            expected = ", ".join(tp.__name__ for tp in expected_types)
            _record_issue(
                issues,
                "error",
                "invalid-field-type",
                collection_name,
                str(item.get("id", "")) or None,
                f"Field '{field}' expected type {expected}.",
            )


def _check_enum(
    issues: List[Dict[str, Any]],
    collection_name: str,
    item: Dict[str, Any],
    field: str,
    allowed: List[str],
    level: str = "warning",
) -> None:
    if field not in item:
        return
    value = item.get(field)
    if not isinstance(value, str):
        return
    if value and value not in allowed:
        _record_issue(
            issues,
            level,
            "enum-value-invalid",
            collection_name,
            str(item.get("id", "")) or None,
            f"Field '{field}' has unsupported value '{value}'.",
        )


def run_validation(data_dir: Path) -> Dict[str, Any]:
    collections = _load_collections(data_dir)
    issues: List[Dict[str, Any]] = []

    enum_action_type = {"Действие", "Реакция"}
    enum_source = {"Учебное", "Фирменное"}
    enum_effect_type = {"Обычный", "Относительное"}
    enum_school_rarity = {"Редкая", "Эпическая", "Скрытая"}

    summary: Dict[str, Dict[str, int]] = {}

    required_fields_map: Dict[str, List[str]] = {
        "news": ["id", "title"],
        "spells": ["id", "name", "type"],
        "schools": ["id", "name", "rarity"],
        "effects": ["id", "name", "description"],
    }

    for collection_name, data in collections.items():
        summary[collection_name] = {"items": 0}
        if data is None:
            _record_issue(
                issues,
                "error",
                "json-invalid",
                collection_name,
                None,
                "Collection file contains invalid JSON.",
            )
            continue

        if not isinstance(data, list):
            _record_issue(
                issues,
                "error",
                "collection-not-array",
                collection_name,
                None,
                "Top-level JSON must be an array.",
            )
            continue

        summary[collection_name]["items"] = len(data)
        seen_ids: set[str] = set()

        for item in data:
            if not isinstance(item, dict):
                _record_issue(
                    issues,
                    "error",
                    "record-not-object",
                    collection_name,
                    None,
                    "Record must be an object.",
                )
                continue

            item_id = str(item.get("id", "")).strip()
            if item_id:
                if item_id in seen_ids:
                    _record_issue(
                        issues,
                        "error",
                        "duplicate-id",
                        collection_name,
                        item_id,
                        "Duplicate id in collection.",
                    )
                seen_ids.add(item_id)

            _require_fields(
                issues,
                collection_name,
                item,
                required_fields_map.get(collection_name, ["id", "name"]),
            )
            _check_short_description(issues, collection_name, item)

            if collection_name == "spells":
                has_subspells = isinstance(item.get("subSpells"), list) and len(item.get("subSpells")) > 0
                description = item.get("description")
                if not has_subspells and (
                    description is None or (isinstance(description, str) and description.strip() == "")
                ):
                    _record_issue(
                        issues,
                        "error",
                        "required-field-missing",
                        collection_name,
                        str(item.get("id", "")) or None,
                        "Missing required field 'description'.",
                    )
                _check_types(
                    issues,
                    collection_name,
                    item,
                    {
                        "id": (str,),
                        "name": (str,),
                        "description": (str,),
                        "school": (list, str),
                        "requiredLevel": (int,),
                        "type": (str,),
                        "source": (str,),
                        "actionType": (str,),
                    },
                )
                _check_enum(issues, collection_name, item, "actionType", sorted(enum_action_type))
                _check_enum(issues, collection_name, item, "source", sorted(enum_source))

            elif collection_name == "schools":
                _check_types(
                    issues,
                    collection_name,
                    item,
                    {
                        "id": (str,),
                        "name": (str,),
                        "rarity": (str,),
                        "properties": (list,),
                        "relatedSchools": (list,),
                        "educationalSpells": (list,),
                    },
                )
                _check_enum(issues, collection_name, item, "rarity", sorted(enum_school_rarity))

            elif collection_name == "effects":
                _check_types(
                    issues,
                    collection_name,
                    item,
                    {"id": (str,), "name": (str,), "description": (str,), "actionType": (str,)},
                )
                _check_enum(issues, collection_name, item, "actionType", sorted(enum_effect_type))

            elif collection_name == "news":
                _check_types(
                    issues,
                    collection_name,
                    item,
                    {"id": (str,), "title": (str,), "date": (str,)},
                )

            else:
                _check_types(issues, collection_name, item, {"id": (str,), "name": (str,)})

    return {
        "generatedAt": _utc_now_iso(),
        "issues": issues,
        "summary": summary,
    }
