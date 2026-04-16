from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

PROJECT_DIR = Path(__file__).resolve().parents[1]
if str(PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_DIR))

from odoo_test_utils import OdooClient, get_odoo_credentials, load_env


def _model_exists(client: OdooClient, model: str) -> bool:
    count = client.execute(
        "ir.model",
        "search_count",
        [[("model", "=", model)]],
    )
    return bool(count)


def _available_fields(client: OdooClient, model: str) -> Dict[str, Dict[str, Any]]:
    return client.execute(model, "fields_get", [], {"attributes": ["type", "readonly", "required", "selection"]})


def _filter_values(fields: Dict[str, Dict[str, Any]], values: Dict[str, Any]) -> Dict[str, Any]:
    filtered = {}
    for key, value in values.items():
        meta = fields.get(key)
        if not meta:
            continue
        if meta.get("readonly"):
            continue
        filtered[key] = value
    return filtered


def _get_res_id_by_external_id(client: OdooClient, xmlid: str) -> Optional[int]:
    parts = xmlid.split(".", 1)
    if len(parts) != 2:
        raise ValueError(f"Invalid xmlid: {xmlid}")
    module, name = parts

    rows = client.execute(
        "ir.model.data",
        "search_read",
        [[("module", "=", module), ("name", "=", name)]],
        {"fields": ["res_id"], "limit": 1},
    )
    if not rows:
        return None
    return int(rows[0]["res_id"])


def _upsert_xmlid_link(client: OdooClient, xmlid: str, model: str, res_id: int) -> None:
    module, name = xmlid.split(".", 1)
    row_ids = client.execute(
        "ir.model.data",
        "search",
        [[("module", "=", module), ("name", "=", name)]],
        {"limit": 1},
    )
    payload = {
        "module": module,
        "name": name,
        "model": model,
        "res_id": res_id,
        "noupdate": True,
    }
    if row_ids:
        client.execute("ir.model.data", "write", [row_ids, payload])
    else:
        client.execute("ir.model.data", "create", [payload])


def _upsert_record(
    client: OdooClient,
    *,
    model: str,
    xmlid: str,
    values: Dict[str, Any],
    dry_run: bool,
    incremental: bool,
    state: Dict[str, str],
) -> Tuple[str, Optional[int], Dict[str, Any]]:
    fields = _available_fields(client, model)
    filtered = _filter_values(fields, values)
    fingerprint = hashlib.sha256(
        json.dumps(filtered, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()

    existing_id = _get_res_id_by_external_id(client, xmlid)
    if dry_run:
        status = "would_update" if existing_id else "would_create"
        return status, existing_id, filtered

    if existing_id and incremental:
        previous = state.get(xmlid)
        if previous and previous == fingerprint:
            return "unchanged", existing_id, filtered

    if existing_id:
        client.execute(model, "write", [[existing_id], filtered])
        state[xmlid] = fingerprint
        return "updated", existing_id, filtered

    res_id = client.execute(model, "create", [filtered])
    _upsert_xmlid_link(client, xmlid, model, int(res_id))
    state[xmlid] = fingerprint
    return "created", int(res_id), filtered


def _pick_slide_type(fields: Dict[str, Dict[str, Any]]) -> Optional[str]:
    meta = fields.get("slide_type")
    if not meta:
        return None

    raw_selection = meta.get("selection") or []
    allowed = [str(item[0]) for item in raw_selection if isinstance(item, (list, tuple)) and item]
    if not allowed:
        return None

    # Prefer text-like content types for curriculum/topic textual payloads.
    for candidate in ["article", "doc", "pdf", "slides", "sheet"]:
        if candidate in allowed:
            return candidate
    return allowed[0]


def _build_course_values(course: Dict[str, Any], fields: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    values = {
        "name": course.get("title"),
        "description": course.get("summary"),
    }

    if "x_facodi_code" in fields:
        values["x_facodi_code"] = course.get("code")
    if "x_facodi_plan_version" in fields:
        values["x_facodi_plan_version"] = course.get("plan_version")
    if "x_facodi_ects_total" in fields:
        values["x_facodi_ects_total"] = course.get("ects_total")

    return values


def _build_uc_values(uc: Dict[str, Any], fields: Dict[str, Dict[str, Any]], channel_id: Optional[int]) -> Dict[str, Any]:
    description_parts = []
    if uc.get("summary"):
        description_parts.append(str(uc["summary"]))
    if uc.get("description"):
        description_parts.append(str(uc["description"]))
    if uc.get("learning_outcomes"):
        description_parts.append("\n\nLearning outcomes:\n- " + "\n- ".join(uc["learning_outcomes"]))

    values = {
        "name": f"{uc.get('code')} - {uc.get('title')}",
        "description": "\n".join(description_parts).strip(),
    }

    if channel_id and "channel_id" in fields:
        values["channel_id"] = channel_id

    picked_slide_type = _pick_slide_type(fields)
    if picked_slide_type:
        values["slide_type"] = picked_slide_type

    if "x_facodi_uc_code" in fields:
        values["x_facodi_uc_code"] = uc.get("code")
    if "x_facodi_semester" in fields:
        values["x_facodi_semester"] = uc.get("semester")
    if "x_facodi_ects" in fields:
        values["x_facodi_ects"] = uc.get("ects")

    return values


def _build_topic_values(topic: Dict[str, Any], uc: Dict[str, Dict[str, Any]], fields: Dict[str, Dict[str, Any]], channel_id: Optional[int]) -> Dict[str, Any]:
    values = {
        "name": f"{uc.get('code')} | {topic.get('name')}",
        "description": topic.get("summary") or "",
    }

    if channel_id and "channel_id" in fields:
        values["channel_id"] = channel_id

    picked_slide_type = _pick_slide_type(fields)
    if picked_slide_type:
        values["slide_type"] = picked_slide_type

    if "x_facodi_topic_slug" in fields:
        values["x_facodi_topic_slug"] = topic.get("slug")

    return values


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import FACODI normalized curriculum bundle to Odoo")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("Projects/facodi/data/curriculum_bundle_normalized.json"),
        help="Normalized curriculum bundle JSON",
    )
    parser.add_argument(
        "--course-model",
        default="slide.channel",
        help="Target model for course entities",
    )
    parser.add_argument(
        "--uc-model",
        default="slide.slide",
        help="Target model for UCs",
    )
    parser.add_argument(
        "--topic-model",
        default="slide.slide",
        help="Target model for topics",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply writes to Odoo (default is dry-run)",
    )
    parser.add_argument(
        "--incremental",
        action="store_true",
        help="Skip unchanged records using local state fingerprints (apply mode only)",
    )
    parser.add_argument(
        "--state-file",
        type=Path,
        default=Path("Projects/facodi/data/import_state.json"),
        help="State file path used by incremental mode",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    workspace_root = Path(__file__).resolve().parents[3]
    project_root = workspace_root / "Projects" / "facodi.pt"

    if not args.input.exists():
        raise FileNotFoundError(f"Input not found: {args.input}")

    bundle = json.loads(args.input.read_text(encoding="utf-8"))

    env_used = load_env(workspace_root=workspace_root, project_root=project_root)
    host, db, user, password = get_odoo_credentials()
    client = OdooClient(host=host, db=db, user=user, password=password)
    uid = client.authenticate()

    model_checks = {
        args.course_model: _model_exists(client, args.course_model),
        args.uc_model: _model_exists(client, args.uc_model),
        args.topic_model: _model_exists(client, args.topic_model),
    }

    state: Dict[str, str] = {}
    if args.incremental and args.apply and args.state_file.exists():
        raw_state = json.loads(args.state_file.read_text(encoding="utf-8"))
        if isinstance(raw_state, dict):
            state = {str(k): str(v) for k, v in raw_state.items()}

    actions: List[Dict[str, Any]] = []

    course_record_id: Optional[int] = None
    course_payload = bundle["course"]

    if model_checks[args.course_model]:
        fields = _available_fields(client, args.course_model)
        values = _build_course_values(course_payload, fields)
        status, record_id, filtered = _upsert_record(
            client,
            model=args.course_model,
            xmlid=course_payload["external_id"],
            values=values,
            dry_run=not args.apply,
            incremental=args.incremental,
            state=state,
        )
        course_record_id = record_id
        actions.append(
            {
                "entity": "course",
                "external_id": course_payload["external_id"],
                "model": args.course_model,
                "status": status,
                "record_id": record_id,
                "fields": filtered,
            }
        )
    else:
        actions.append(
            {
                "entity": "course",
                "external_id": course_payload["external_id"],
                "model": args.course_model,
                "status": "skipped_model_missing",
            }
        )

    for uc in bundle.get("ucs", []):
        if not model_checks[args.uc_model]:
            actions.append(
                {
                    "entity": "uc",
                    "external_id": uc["external_id"],
                    "model": args.uc_model,
                    "status": "skipped_model_missing",
                }
            )
            continue

        uc_fields = _available_fields(client, args.uc_model)
        uc_values = _build_uc_values(uc, uc_fields, channel_id=course_record_id)
        uc_status, uc_id, uc_filtered = _upsert_record(
            client,
            model=args.uc_model,
            xmlid=uc["external_id"],
            values=uc_values,
            dry_run=not args.apply,
            incremental=args.incremental,
            state=state,
        )
        actions.append(
            {
                "entity": "uc",
                "external_id": uc["external_id"],
                "model": args.uc_model,
                "status": uc_status,
                "record_id": uc_id,
                "fields": uc_filtered,
            }
        )

        for topic in uc.get("topics", []):
            if not model_checks[args.topic_model]:
                actions.append(
                    {
                        "entity": "topic",
                        "external_id": topic["external_id"],
                        "model": args.topic_model,
                        "status": "skipped_model_missing",
                    }
                )
                continue

            topic_fields = _available_fields(client, args.topic_model)
            topic_values = _build_topic_values(topic, uc, topic_fields, channel_id=course_record_id)
            topic_status, topic_id, topic_filtered = _upsert_record(
                client,
                model=args.topic_model,
                xmlid=topic["external_id"],
                values=topic_values,
                dry_run=not args.apply,
                incremental=args.incremental,
                state=state,
            )
            actions.append(
                {
                    "entity": "topic",
                    "external_id": topic["external_id"],
                    "model": args.topic_model,
                    "status": topic_status,
                    "record_id": topic_id,
                    "fields": topic_filtered,
                }
            )

    summary = {
        "created": sum(1 for x in actions if x["status"] == "created"),
        "updated": sum(1 for x in actions if x["status"] == "updated"),
        "unchanged": sum(1 for x in actions if x["status"] == "unchanged"),
        "would_create": sum(1 for x in actions if x["status"] == "would_create"),
        "would_update": sum(1 for x in actions if x["status"] == "would_update"),
        "skipped_model_missing": sum(1 for x in actions if x["status"] == "skipped_model_missing"),
    }

    if args.incremental and args.apply:
        args.state_file.parent.mkdir(parents=True, exist_ok=True)
        args.state_file.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")

    payload = {
        "status": "ok",
        "mode": "apply" if args.apply else "dry-run",
        "incremental": bool(args.incremental),
        "state_file": str(args.state_file),
        "env_file_used": str(env_used),
        "auth_uid": uid,
        "model_checks": model_checks,
        "summary": summary,
        "actions": actions,
    }
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
