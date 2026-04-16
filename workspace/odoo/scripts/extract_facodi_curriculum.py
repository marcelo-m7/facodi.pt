from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple, cast

PROJECT_DIR = Path(__file__).resolve().parents[1]
if str(PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_DIR))

from odoo_curriculum_schema import CurriculumBundle, UCRecord, course_from_dict, uc_from_dict

try:
    import yaml
except ImportError as exc:
    raise SystemExit(
        "Missing dependency PyYAML. Install with: pip install pyyaml"
    ) from exc


def _extract_front_matter(md_path: Path) -> Dict[str, Any]:
    text = md_path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return {}

    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}

    payload = yaml.safe_load(parts[1])
    if isinstance(payload, dict):
        return cast(Dict[str, Any], payload)
    return {}


def _collect_uc_files(course_root: Path) -> List[Path]:
    uc_root = course_root / "uc"
    if not uc_root.exists():
        return []
    return sorted(uc_root.glob("*/_index.md"))


def _build_bundle(course_root: Path) -> CurriculumBundle:
    course_path = course_root / "_index.md"
    if not course_path.exists():
        raise FileNotFoundError(f"Missing course file: {course_path}")

    course_dict = _extract_front_matter(course_path)
    uc_files = _collect_uc_files(course_root)

    ucs: List[UCRecord] = []
    for uc_path in uc_files:
        uc_data = _extract_front_matter(uc_path)
        if not uc_data.get("code"):
            continue
        uc_record = uc_from_dict(uc_data)
        ucs.append(uc_record)

    bundle = CurriculumBundle(
        source="facodi.pt",
        course=course_from_dict(course_dict),
        ucs=ucs,
        metadata={
            "course_path": str(course_path),
            "uc_files_count": len(uc_files),
        },
    )
    bundle.validate()
    return bundle


def _bundle_to_dict(bundle: CurriculumBundle) -> Dict[str, Any]:
    course: Dict[str, Any] = {
        "code": bundle.course.code,
        "title": bundle.course.title,
        "plan_version": bundle.course.plan_version,
        "degree": "bachelor",
        "ects_total": bundle.course.ects_total,
        "duration_semesters": bundle.course.duration_semesters,
        "institution": bundle.course.institution,
        "school": bundle.course.school,
        "language": bundle.course.language,
        "summary": bundle.course.summary,
        "uc_refs": bundle.course.uc_refs,
    }

    ucs: List[Dict[str, Any]] = []
    for uc in bundle.ucs:
        ucs.append(
            {
                "code": uc.code,
                "title": uc.title,
                "ects": uc.ects,
                "semester": uc.semester,
                "year": uc.year,
                "language": uc.language,
                "summary": uc.summary,
                "description": uc.description,
                "prerequisites": uc.prerequisites,
                "learning_outcomes": uc.learning_outcomes,
                "playlists": [{"id": p.id, "priority": p.priority} for p in uc.playlists],
                "topics": [
                    {
                        "slug": t.slug,
                        "name": t.name,
                        "summary": t.summary,
                        "tags": t.tags,
                        "playlists": [{"id": p.id, "priority": p.priority} for p in t.playlists],
                    }
                    for t in uc.topics
                ],
            }
        )

    return {
        "source": bundle.source,
        "course": course,
        "ucs": ucs,
        "metadata": bundle.metadata,
    }


def _write_csvs(bundle_dict: Dict[str, Any], out_dir: Path) -> Tuple[Path, Path, Path]:
    ucs_csv = out_dir / "curriculum_ucs.csv"
    topics_csv = out_dir / "curriculum_topics.csv"
    playlists_csv = out_dir / "curriculum_playlists.csv"

    with ucs_csv.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(
            fh,
            fieldnames=[
                "course_code",
                "uc_code",
                "title",
                "ects",
                "semester",
                "year",
                "language",
                "prerequisites_count",
                "learning_outcomes_count",
                "topics_count",
                "playlists_count",
            ],
        )
        writer.writeheader()
        for uc in bundle_dict["ucs"]:
            writer.writerow(
                {
                    "course_code": bundle_dict["course"]["code"],
                    "uc_code": uc["code"],
                    "title": uc["title"],
                    "ects": uc["ects"],
                    "semester": uc["semester"],
                    "year": uc["year"],
                    "language": uc["language"],
                    "prerequisites_count": len(uc["prerequisites"]),
                    "learning_outcomes_count": len(uc["learning_outcomes"]),
                    "topics_count": len(uc["topics"]),
                    "playlists_count": len(uc["playlists"]),
                }
            )

    with topics_csv.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(
            fh,
            fieldnames=["uc_code", "topic_slug", "topic_name", "tags", "playlists_count"],
        )
        writer.writeheader()
        for uc in bundle_dict["ucs"]:
            for topic in uc["topics"]:
                writer.writerow(
                    {
                        "uc_code": uc["code"],
                        "topic_slug": topic["slug"],
                        "topic_name": topic["name"],
                        "tags": ",".join(topic["tags"]),
                        "playlists_count": len(topic["playlists"]),
                    }
                )

    with playlists_csv.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(
            fh,
            fieldnames=["level", "uc_code", "topic_slug", "playlist_id", "priority"],
        )
        writer.writeheader()

        for uc in bundle_dict["ucs"]:
            for playlist in uc["playlists"]:
                writer.writerow(
                    {
                        "level": "uc",
                        "uc_code": uc["code"],
                        "topic_slug": "",
                        "playlist_id": playlist["id"],
                        "priority": playlist["priority"],
                    }
                )
            for topic in uc["topics"]:
                for playlist in topic["playlists"]:
                    writer.writerow(
                        {
                            "level": "topic",
                            "uc_code": uc["code"],
                            "topic_slug": topic["slug"],
                            "playlist_id": playlist["id"],
                            "priority": playlist["priority"],
                        }
                    )

    return ucs_csv, topics_csv, playlists_csv


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Extract FACODI curriculum from facodi.pt markdown files")
    parser.add_argument(
        "--course-root",
        type=Path,
        default=Path("Projects/facodi.pt/content/courses/lesti"),
        help="Course folder containing _index.md and uc/**/_index.md",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("Projects/facodi/data"),
        help="Output directory for JSON and CSV files",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    output_dir = args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)

    bundle = _build_bundle(args.course_root)
    bundle_dict = _bundle_to_dict(bundle)

    json_path = output_dir / "curriculum_bundle_raw.json"
    json_path.write_text(json.dumps(bundle_dict, ensure_ascii=False, indent=2), encoding="utf-8")

    ucs_csv, topics_csv, playlists_csv = _write_csvs(bundle_dict, output_dir)

    payload: Dict[str, Any] = {
        "status": "ok",
        "course_code": bundle.course.code,
        "course_title": bundle.course.title,
        "ucs_total": len(bundle.ucs),
        "output": {
            "bundle_json": str(json_path),
            "ucs_csv": str(ucs_csv),
            "topics_csv": str(topics_csv),
            "playlists_csv": str(playlists_csv),
        },
    }
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
