#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Normalization stage for compendium JSON collections."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict


def _normalize_value(value: Any) -> Any:
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, list):
        return [_normalize_value(item) for item in value]
    if isinstance(value, dict):
        return {key: _normalize_value(val) for key, val in value.items()}
    return value


def normalize_data(data_dir: Path, output_dir: Path) -> Dict[str, Any]:
    output_dir.mkdir(parents=True, exist_ok=True)

    processed_files = 0
    processed_records = 0

    for path in sorted(data_dir.glob("*.json")):
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue

        normalized = _normalize_value(raw)
        out_path = output_dir / path.name
        out_path.write_text(json.dumps(normalized, ensure_ascii=False, indent=2), encoding="utf-8")

        processed_files += 1
        if isinstance(normalized, list):
            processed_records += len(normalized)
        elif isinstance(normalized, dict):
            processed_records += 1

    return {
        "processedFiles": processed_files,
        "processedRecords": processed_records,
        "outputDir": str(output_dir),
    }
