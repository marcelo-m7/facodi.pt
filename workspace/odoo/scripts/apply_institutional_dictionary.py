from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

PROJECT_DIR = Path(__file__).resolve().parents[1]
if str(PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_DIR))

from odoo_test_utils import OdooClient, get_odoo_credentials, load_env


CHANNEL_FIELD_SPECS: List[Dict[str, str]] = [
    {"name": "x_facodi_company_name", "field_description": "FACODI Company Name", "ttype": "char"},
    {"name": "x_facodi_company_site", "field_description": "FACODI Company Site", "ttype": "char"},
    {"name": "x_facodi_company_tagline", "field_description": "FACODI Company Tagline", "ttype": "text"},
    {"name": "x_facodi_company_manifesto", "field_description": "FACODI Company Manifesto", "ttype": "text"},
    {"name": "x_facodi_project_name", "field_description": "FACODI Project Name", "ttype": "char"},
    {"name": "x_facodi_project_slug", "field_description": "FACODI Project Slug", "ttype": "char"},
    {"name": "x_facodi_project_site", "field_description": "FACODI Project Site", "ttype": "char"},
    {"name": "x_facodi_project_value_proposition", "field_description": "FACODI Value Proposition", "ttype": "text"},
    {"name": "x_facodi_partnership_model", "field_description": "FACODI Partnership Model", "ttype": "char"},
    {"name": "x_facodi_content_license", "field_description": "FACODI Content License", "ttype": "char"},
    {"name": "x_facodi_primary_language", "field_description": "FACODI Primary Language", "ttype": "char"},
    {"name": "x_facodi_supported_languages", "field_description": "FACODI Supported Languages", "ttype": "text"},
    {"name": "x_facodi_source_institution", "field_description": "FACODI Source Institution", "ttype": "char"},
    {"name": "x_facodi_source_type", "field_description": "FACODI Source Type", "ttype": "char"},
    {"name": "x_facodi_source_api_doc", "field_description": "FACODI Source API Doc", "ttype": "char"},
    {"name": "x_facodi_editorial_state", "field_description": "FACODI Editorial State", "ttype": "char"},
    {"name": "x_facodi_curriculum_version", "field_description": "FACODI Curriculum Version", "ttype": "char"},
    {"name": "x_facodi_dictionary_version", "field_description": "FACODI Dictionary Version", "ttype": "char"},
]

SLIDE_FIELD_SPECS: List[Dict[str, str]] = [
    {"name": "x_facodi_company_name", "field_description": "FACODI Company Name", "ttype": "char"},
    {"name": "x_facodi_project_name", "field_description": "FACODI Project Name", "ttype": "char"},
    {"name": "x_facodi_project_slug", "field_description": "FACODI Project Slug", "ttype": "char"},
    {"name": "x_facodi_content_license", "field_description": "FACODI Content License", "ttype": "char"},
    {"name": "x_facodi_primary_language", "field_description": "FACODI Primary Language", "ttype": "char"},
    {"name": "x_facodi_source_institution", "field_description": "FACODI Source Institution", "ttype": "char"},
    {"name": "x_facodi_source_type", "field_description": "FACODI Source Type", "ttype": "char"},
    {"name": "x_facodi_editorial_state", "field_description": "FACODI Editorial State", "ttype": "char"},
    {"name": "x_facodi_curriculum_version", "field_description": "FACODI Curriculum Version", "ttype": "char"},
    {"name": "x_facodi_dictionary_version", "field_description": "FACODI Dictionary Version", "ttype": "char"},
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Apply Monynha/FACODI institutional dictionary to Odoo")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("workspace/odoo/data/institutional_dictionary.json"),
        help="Institutional dictionary JSON path",
    )
    parser.add_argument(
        "--module",
        default="facodi",
        help="External ID module prefix used in ir.model.data",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply writes (default is dry-run)",
    )
    return parser.parse_args()


def _find_model_id(client: OdooClient, model_name: str) -> int:
    row_ids = client.execute("ir.model", "search", [[("model", "=", model_name)]], {"limit": 1})
    if not row_ids:
        raise RuntimeError(f"Model not found in Odoo: {model_name}")
    return int(row_ids[0])


def _ensure_field(client: OdooClient, model_name: str, model_id: int, spec: Dict[str, str], apply: bool) -> str:
    existing = client.execute(
        "ir.model.fields",
        "search_read",
        [[("model", "=", model_name), ("name", "=", spec["name"]) ]],
        {"fields": ["id", "name"], "limit": 1},
    )
    if existing:
        return "exists"

    if not apply:
        return "would_create"

    payload = {
        "name": spec["name"],
        "field_description": spec["field_description"],
        "model_id": model_id,
        "model": model_name,
        "ttype": spec["ttype"],
        "state": "manual",
    }
    client.execute("ir.model.fields", "create", [payload])
    return "created"


def _get_target_record_ids(client: OdooClient, module: str, model: str) -> List[int]:
    rows = client.execute(
        "ir.model.data",
        "search_read",
        [[("module", "=", module), ("model", "=", model)]],
        {"fields": ["res_id"], "limit": 10000},
    )
    ids = sorted({int(r["res_id"]) for r in rows if r.get("res_id")})
    return ids


def _build_channel_values(data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "x_facodi_company_name": data["empresa"]["nome"],
        "x_facodi_company_site": data["empresa"]["site"],
        "x_facodi_company_tagline": data["empresa"]["tagline"],
        "x_facodi_company_manifesto": data["empresa"]["manifesto"],
        "x_facodi_project_name": data["projeto"]["nome"],
        "x_facodi_project_slug": data["projeto"]["slug"],
        "x_facodi_project_site": data["projeto"]["site"],
        "x_facodi_project_value_proposition": data["projeto"]["proposta_valor"],
        "x_facodi_partnership_model": data["parceria"]["modelo"],
        "x_facodi_content_license": data["licenca"]["tipo"],
        "x_facodi_primary_language": data["idioma"]["primario"],
        "x_facodi_supported_languages": ",".join(data["idioma"]["suportados"]),
        "x_facodi_source_institution": data["fonte"]["instituicao_base"],
        "x_facodi_source_type": data["fonte"]["tipo"],
        "x_facodi_source_api_doc": data["fonte"]["documentacao_api"],
        "x_facodi_editorial_state": data["estado_editorial"]["padrao"],
        "x_facodi_curriculum_version": data["versao_curricular"]["valor"],
        "x_facodi_dictionary_version": data["dictionary_version"],
    }


def _build_slide_values(data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "x_facodi_company_name": data["empresa"]["nome"],
        "x_facodi_project_name": data["projeto"]["nome"],
        "x_facodi_project_slug": data["projeto"]["slug"],
        "x_facodi_content_license": data["licenca"]["tipo"],
        "x_facodi_primary_language": data["idioma"]["primario"],
        "x_facodi_source_institution": data["fonte"]["instituicao_base"],
        "x_facodi_source_type": data["fonte"]["tipo"],
        "x_facodi_editorial_state": data["estado_editorial"]["padrao"],
        "x_facodi_curriculum_version": data["versao_curricular"]["valor"],
        "x_facodi_dictionary_version": data["dictionary_version"],
    }


def _safe_write_many(client: OdooClient, model: str, ids: List[int], values: Dict[str, Any], apply: bool) -> str:
    if not ids:
        return "skipped_no_records"
    if not apply:
        return f"would_write_{len(ids)}"
    client.execute(model, "write", [ids, values])
    return f"written_{len(ids)}"


def _field_summary(results: List[Tuple[str, str]]) -> Dict[str, int]:
    summary: Dict[str, int] = {}
    for _, status in results:
        summary[status] = summary.get(status, 0) + 1
    return summary


def main() -> int:
    args = parse_args()

    if not args.input.exists():
        raise FileNotFoundError(f"Dictionary input not found: {args.input}")

    payload = json.loads(args.input.read_text(encoding="utf-8"))

    workspace_root = Path(__file__).resolve().parents[3]
    project_root = workspace_root / "Projects" / "facodi.pt"

    env_used = load_env(workspace_root=workspace_root, project_root=project_root)
    host, db, user, password = get_odoo_credentials()
    client = OdooClient(host=host, db=db, user=user, password=password)
    uid = client.authenticate()

    channel_model = "slide.channel"
    slide_model = "slide.slide"

    channel_model_id = _find_model_id(client, channel_model)
    slide_model_id = _find_model_id(client, slide_model)

    channel_fields_result: List[Tuple[str, str]] = []
    for spec in CHANNEL_FIELD_SPECS:
        status = _ensure_field(client, channel_model, channel_model_id, spec, apply=args.apply)
        channel_fields_result.append((spec["name"], status))

    slide_fields_result: List[Tuple[str, str]] = []
    for spec in SLIDE_FIELD_SPECS:
        status = _ensure_field(client, slide_model, slide_model_id, spec, apply=args.apply)
        slide_fields_result.append((spec["name"], status))

    channel_ids = _get_target_record_ids(client, args.module, channel_model)
    slide_ids = _get_target_record_ids(client, args.module, slide_model)

    channel_values = _build_channel_values(payload)
    slide_values = _build_slide_values(payload)

    channel_write_status = _safe_write_many(client, channel_model, channel_ids, channel_values, apply=args.apply)
    slide_write_status = _safe_write_many(client, slide_model, slide_ids, slide_values, apply=args.apply)

    output = {
        "status": "ok",
        "mode": "apply" if args.apply else "dry-run",
        "env_file_used": str(env_used),
        "auth_uid": uid,
        "dictionary_input": str(args.input),
        "field_results": {
            "slide.channel": {
                "summary": _field_summary(channel_fields_result),
                "details": [{"field": field, "status": status} for field, status in channel_fields_result],
            },
            "slide.slide": {
                "summary": _field_summary(slide_fields_result),
                "details": [{"field": field, "status": status} for field, status in slide_fields_result],
            },
        },
        "targets": {
            "slide.channel": {"count": len(channel_ids), "write_status": channel_write_status},
            "slide.slide": {"count": len(slide_ids), "write_status": slide_write_status},
        },
        "applied_values_preview": {
            "slide.channel": channel_values,
            "slide.slide": slide_values,
        },
    }

    print(json.dumps(output, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
