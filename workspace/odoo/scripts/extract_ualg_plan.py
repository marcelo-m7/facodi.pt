from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path
from typing import Dict, List


def parse_markdown_table_lines(text: str) -> List[Dict[str, str]]:
    rows: List[Dict[str, str]] = []
    pattern = re.compile(r"\|\s*([^|]+?)\s*\|\s*(\d+)\s*\|\s*(\d{8})\s*\|")

    for match in pattern.finditer(text):
        title = match.group(1).strip()
        ects = match.group(2).strip()
        code = match.group(3).strip()
        rows.append(
            {
                "code": code,
                "title": title,
                "ects": ects,
            }
        )

    # Deduplicate by code while preserving first occurrence.
    deduped: List[Dict[str, str]] = []
    seen = set()
    for row in rows:
        if row["code"] in seen:
            continue
        seen.add(row["code"])
        deduped.append(row)
    return deduped


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Extract UAlg plan entries from a markdown-like source file containing rows in format "
            "| UC NAME | ECTS | CODE |"
        )
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("Projects/facodi/data/ualg_plan_source.txt"),
        help="Input text file with markdown-like UAlg plan rows",
    )
    parser.add_argument(
        "--output-json",
        type=Path,
        default=Path("Projects/facodi/data/ualg_plan_extracted.json"),
        help="Output JSON file",
    )
    parser.add_argument(
        "--output-csv",
        type=Path,
        default=Path("Projects/facodi/data/ualg_plan_extracted.csv"),
        help="Output CSV file",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.input.exists():
        raise FileNotFoundError(
            f"Input not found: {args.input}. Save UAlg plan text into this file first."
        )

    source_text = args.input.read_text(encoding="utf-8")
    rows = parse_markdown_table_lines(source_text)

    args.output_json.parent.mkdir(parents=True, exist_ok=True)
    args.output_json.write_text(
        json.dumps({"status": "ok", "rows": rows}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    with args.output_csv.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=["code", "title", "ects"])
        writer.writeheader()
        writer.writerows(rows)

    payload = {
        "status": "ok",
        "input": str(args.input),
        "rows": len(rows),
        "output_json": str(args.output_json),
        "output_csv": str(args.output_csv),
    }
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
