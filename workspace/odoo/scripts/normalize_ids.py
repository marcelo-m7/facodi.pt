from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any, Dict, List


def slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower())
    return cleaned.strip("-")


def normalize_bundle(data: Dict[str, Any]) -> Dict[str, Any]:
    course = data.get("course", {})
    ucs = data.get("ucs", [])

    course_code = str(course.get("code", "")).strip()
    plan_version = str(course.get("plan_version", "")).strip().replace("/", "-")
    course_id = f"{course_code}-{plan_version}" if plan_version else course_code

    normalized_ucs: List[Dict[str, Any]] = []
    issues: List[str] = []

    seen_uc_codes = set()
    for uc in ucs:
        uc_code = str(uc.get("code", "")).strip()
        if not uc_code:
            issues.append("UC sem code encontrado")
            continue
        if uc_code in seen_uc_codes:
            issues.append(f"UC duplicada: {uc_code}")
            continue
        seen_uc_codes.add(uc_code)

        uc_slug = slugify(uc.get("title", uc_code))
        uc_id = f"UC-{uc_code}"
        uc_external_id = f"facodi.uc_{uc_code}"

        normalized_topics = []
        for index, topic in enumerate(uc.get("topics", []), start=1):
            topic_slug = slugify(topic.get("slug") or topic.get("name") or str(index))
            topic_id = f"{uc_id}-TOPIC-{index:02d}"
            topic_external_id = f"facodi.topic_{uc_code}_{topic_slug}"
            normalized_topics.append(
                {
                    "id": topic_id,
                    "external_id": topic_external_id,
                    "slug": topic_slug,
                    "name": topic.get("name", ""),
                    "summary": topic.get("summary", ""),
                    "tags": topic.get("tags", []),
                    "playlists": topic.get("playlists", []),
                }
            )

        normalized_ucs.append(
            {
                "id": uc_id,
                "external_id": uc_external_id,
                "code": uc_code,
                "title": uc.get("title", ""),
                "slug": uc_slug,
                "ects": uc.get("ects"),
                "semester": uc.get("semester"),
                "year": uc.get("year"),
                "language": uc.get("language"),
                "summary": uc.get("summary"),
                "description": uc.get("description"),
                "prerequisites": uc.get("prerequisites", []),
                "learning_outcomes": uc.get("learning_outcomes", []),
                "playlists": uc.get("playlists", []),
                "topics": normalized_topics,
            }
        )

    normalized = {
        "source": data.get("source", "facodi.pt"),
        "course": {
            "id": course_id,
            "external_id": f"facodi.course_{slugify(course_id)}",
            "code": course_code,
            "title": course.get("title", ""),
            "plan_version": course.get("plan_version", ""),
            "degree": course.get("degree", "bachelor"),
            "ects_total": course.get("ects_total"),
            "duration_semesters": course.get("duration_semesters"),
            "institution": course.get("institution", ""),
            "school": course.get("school", ""),
            "language": course.get("language", "pt"),
            "summary": course.get("summary", ""),
        },
        "ucs": normalized_ucs,
        "issues": issues,
    }
    return normalized


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Normalize FACODI curriculum IDs")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("Projects/facodi/data/curriculum_bundle_raw.json"),
        help="Raw curriculum bundle JSON",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("Projects/facodi/data/curriculum_bundle_normalized.json"),
        help="Normalized curriculum bundle JSON",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.input.exists():
        raise FileNotFoundError(f"Input not found: {args.input}")

    raw = json.loads(args.input.read_text(encoding="utf-8"))
    normalized = normalize_bundle(raw)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(normalized, ensure_ascii=False, indent=2), encoding="utf-8")

    payload = {
        "status": "ok",
        "input": str(args.input),
        "output": str(args.output),
        "course_id": normalized["course"]["id"],
        "ucs_total": len(normalized["ucs"]),
        "issues_count": len(normalized["issues"]),
    }
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
