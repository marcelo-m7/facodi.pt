from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Set

PROJECT_DIR = Path(__file__).resolve().parents[1]
if str(PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_DIR))

from odoo_test_utils import OdooClient, get_odoo_credentials, load_env


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Verify FACODI curriculum sync consistency in Odoo")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("Projects/facodi/data/curriculum_bundle_normalized.json"),
        help="Normalized curriculum bundle JSON",
    )
    parser.add_argument(
        "--module",
        default="facodi",
        help="External ID module prefix used in ir.model.data",
    )
    parser.add_argument(
        "--course-model",
        default="slide.channel",
        help="Expected course model",
    )
    parser.add_argument(
        "--slide-model",
        default="slide.slide",
        help="Expected UC/topic model",
    )
    return parser.parse_args()


def _expected_ids(bundle: Dict[str, Any]) -> Set[str]:
    ids: Set[str] = set()
    ids.add(bundle["course"]["external_id"])
    for uc in bundle.get("ucs", []):
        ids.add(uc["external_id"])
        for topic in uc.get("topics", []):
            ids.add(topic["external_id"])
    return ids


def _expected_course_slide_count(bundle: Dict[str, Any]) -> int:
    return len(bundle.get("ucs", [])) + sum(len(uc.get("topics", [])) for uc in bundle.get("ucs", []))


def main() -> int:
    args = parse_args()

    if not args.input.exists():
        raise FileNotFoundError(f"Input not found: {args.input}")

    bundle = json.loads(args.input.read_text(encoding="utf-8"))
    expected = _expected_ids(bundle)

    workspace_root = Path(__file__).resolve().parents[3]
    project_root = workspace_root / "Projects" / "facodi.pt"

    env_used = load_env(workspace_root=workspace_root, project_root=project_root)
    host, db, user, password = get_odoo_credentials()
    client = OdooClient(host=host, db=db, user=user, password=password)
    uid = client.authenticate()

    xml_rows: List[Dict[str, Any]] = client.execute(
        "ir.model.data",
        "search_read",
        [[("module", "=", args.module)]],
        {"fields": ["module", "name", "model", "res_id"], "limit": 10000},
    )

    actual_full_ids: Set[str] = {f"{row['module']}.{row['name']}" for row in xml_rows}
    missing_xmlids = sorted(expected - actual_full_ids)
    orphan_xmlids = sorted(actual_full_ids - expected)

    invalid_model_xmlids = []
    broken_record_xmlids = []

    expected_course_id = bundle["course"]["external_id"]
    expected_course_record_id = None

    for row in xml_rows:
        full_id = f"{row['module']}.{row['name']}"
        if full_id not in expected:
            continue

        model = str(row.get("model") or "")
        res_id = int(row.get("res_id") or 0)

        if full_id == expected_course_id:
            expected_course_record_id = res_id
            if model != args.course_model:
                invalid_model_xmlids.append({"xmlid": full_id, "model": model, "expected": args.course_model})
        else:
            if model != args.slide_model:
                invalid_model_xmlids.append({"xmlid": full_id, "model": model, "expected": args.slide_model})

        exists = client.execute(model, "search_count", [[("id", "=", res_id)]]) if res_id else 0
        if not exists:
            broken_record_xmlids.append({"xmlid": full_id, "model": model, "res_id": res_id})

    expected_slides = _expected_course_slide_count(bundle)
    linked_slides = 0
    if expected_course_record_id:
        linked_slides = client.execute(
            args.slide_model,
            "search_count",
            [[("channel_id", "=", expected_course_record_id)]],
        )

    summary = {
        "expected_total_xmlids": len(expected),
        "actual_total_xmlids": len(actual_full_ids),
        "missing_xmlids": len(missing_xmlids),
        "orphan_xmlids": len(orphan_xmlids),
        "invalid_model_xmlids": len(invalid_model_xmlids),
        "broken_record_xmlids": len(broken_record_xmlids),
        "expected_linked_slides": expected_slides,
        "actual_linked_slides": linked_slides,
        "slides_match": expected_slides == linked_slides,
    }

    payload = {
        "status": "ok" if all([
            summary["missing_xmlids"] == 0,
            summary["invalid_model_xmlids"] == 0,
            summary["broken_record_xmlids"] == 0,
            summary["slides_match"],
        ]) else "mismatch",
        "env_file_used": str(env_used),
        "auth_uid": uid,
        "summary": summary,
        "missing_xmlids": missing_xmlids,
        "orphan_xmlids": orphan_xmlids,
        "invalid_model_xmlids": invalid_model_xmlids,
        "broken_record_xmlids": broken_record_xmlids,
    }

    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0 if payload["status"] == "ok" else 1


if __name__ == "__main__":
    raise SystemExit(main())
