#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Entry point for data-processing pipeline.

Usage:
  python scripts/data-pipeline/process_data.py
  python scripts/data-pipeline/process_data.py --include-normalize
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List

from normalize_data import normalize_data
from validate_data import run_validation
from check_relations import run_relation_checks
from generate_data_report import build_data_report, build_data_report_html


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def write_json(path: Path, payload: Dict[str, Any]) -> None:
    ensure_dir(path.parent)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run E'Magios data-processing pipeline.")
    parser.add_argument(
        "--data-dir",
        default="data",
        help="Directory with source JSON collections (default: data).",
    )
    parser.add_argument(
        "--reports-dir",
        default="reports",
        help="Directory where pipeline reports are written (default: reports).",
    )
    parser.add_argument(
        "--include-normalize",
        action="store_true",
        help="Run normalization and write normalized data copy to data/processed.",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Return non-zero exit code when warnings are present.",
    )
    parser.add_argument(
        "--no-fail-on-errors",
        action="store_true",
        help="Always exit with code 0 (useful for initial CI adoption).",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    data_dir = (repo_root / args.data_dir).resolve()
    reports_dir = (repo_root / args.reports_dir).resolve()
    ensure_dir(reports_dir)

    normalize_summary: Dict[str, Any] | None = None
    if args.include_normalize:
        normalize_summary = normalize_data(
            data_dir=data_dir,
            output_dir=(data_dir / "processed"),
        )

    validation = run_validation(data_dir=data_dir)
    relations = run_relation_checks(data_dir=data_dir)

    all_issues: List[Dict[str, Any]] = []
    all_issues.extend(validation["issues"])
    all_issues.extend(relations["issues"])

    totals = {"error": 0, "warning": 0, "info": 0}
    for issue in all_issues:
        level = issue.get("level", "info")
        if level not in totals:
            level = "info"
        totals[level] += 1

    validation_report = {
        "schemaVersion": "1.0.0",
        "generatedAt": validation["generatedAt"],
        "sourceDataDir": str(data_dir),
        "totals": totals,
        "issues": all_issues,
        "validationSummary": validation["summary"],
        "relationSummary": relations["summary"],
    }
    if normalize_summary is not None:
        validation_report["normalizationSummary"] = normalize_summary

    write_json(reports_dir / "validation_report.json", validation_report)

    data_report = build_data_report(
        data_dir=data_dir,
        validation_report=validation_report,
    )
    write_json(reports_dir / "data_report.json", data_report)
    (reports_dir / "data_report.html").write_text(
        build_data_report_html(data_report),
        encoding="utf-8",
    )

    print("Pipeline completed.")
    print(f"Errors: {totals['error']}, warnings: {totals['warning']}, info: {totals['info']}")
    print(f"Reports: {reports_dir}")

    if args.no_fail_on_errors:
        return 0
    if totals["error"] > 0:
        return 1
    if args.strict and totals["warning"] > 0:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
