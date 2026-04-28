#!/usr/bin/env python3
"""Seed sample video URLs into Odoo slide lessons for MVP validation.

Usage:
  python features/seed_odoo_lesson_videos.py --dry-run
  python features/seed_odoo_lesson_videos.py --apply --limit 15

Environment:
  ODOO_HOST       e.g. edu-facodi.odoo.com or https://edu-facodi.odoo.com
  ODOO_DB         e.g. edu-facodi
  ODOO_UID        optional, defaults to 2
  ODOO_PASSWORD   API key/password (preferred)
  ODOO_PWD        fallback password variable
"""

from __future__ import annotations

import argparse
import os
import sys
import xmlrpc.client
from dataclasses import dataclass
from typing import Dict, List, Tuple


SAMPLE_VIDEOS: Dict[str, str] = {
    "19411008": "https://www.youtube.com/embed/videoseries?list=PLqwusuKj4Z8M0uW7zPcB6FTCqfN9eCRpQ",
    "ANALISE MATEMATICA II": "https://www.youtube.com/embed/videoseries?list=PLqwusuKj4Z8M0uW7zPcB6FTCqfN9eCRpQ",
    "ALGEBRA LINEAR": "https://www.youtube.com/embed/videoseries?list=PLIb_io8a5NtPDq8aw-mC6QpG8NQZQY9Ap",
    "ANALISE MATEMATICA": "https://www.youtube.com/embed/videoseries?list=PLqwusuKj4Z8M0uW7zPcB6FTCqfN9eCRpQ",
    "DESIGN": "https://www.youtube.com/embed/videoseries?list=PLMu59V03eW-LO4Vy8qJhqb2DxXLR9xC5v",
    "DESENHO": "https://www.youtube.com/embed/videoseries?list=PLqwusuKj4Z8PhYhJP8T9mLGRz3wU-Pu3v",
    "DEFAULT": "https://www.youtube.com/watch?v=M7lc1UVf-VE",
}


@dataclass
class OdooConfig:
    host: str
    db: str
    uid: int
    password: str


def normalize_host(host: str) -> str:
    normalized = host.replace("https://", "").replace("http://", "").strip().strip("/")
    return normalized


def load_config() -> OdooConfig:
    raw_host = os.environ.get("ODOO_HOST", "").strip()
    db = os.environ.get("ODOO_DB", "").strip()
    uid = int(os.environ.get("ODOO_UID", "2"))
    password = (os.environ.get("ODOO_PASSWORD") or os.environ.get("ODOO_PWD") or "").strip()

    if not raw_host or not db or not password:
        print("ERROR: Missing required Odoo environment variables.")
        print(f"  ODOO_HOST present: {'yes' if raw_host else 'no'}")
        print(f"  ODOO_DB present: {'yes' if db else 'no'}")
        print(f"  ODOO_UID: {uid}")
        print(f"  ODOO_PASSWORD/ODOO_PWD present: {'yes' if password else 'no'}")
        sys.exit(1)

    return OdooConfig(host=normalize_host(raw_host), db=db, uid=uid, password=password)


def build_models_proxy(config: OdooConfig) -> xmlrpc.client.ServerProxy:
    base = f"https://{config.host}"
    return xmlrpc.client.ServerProxy(f"{base}/xmlrpc/2/object")


def pick_video_url(slide_name: str, unit_code: str = "") -> str:
    upper_name = slide_name.upper()
    upper_code = unit_code.upper().strip()
    # Accent-insensitive fallback for common Portuguese terms.
    upper_name = (
        upper_name.replace("Á", "A")
        .replace("À", "A")
        .replace("Â", "A")
        .replace("Ã", "A")
        .replace("É", "E")
        .replace("Ê", "E")
        .replace("Í", "I")
        .replace("Ó", "O")
        .replace("Ô", "O")
        .replace("Õ", "O")
        .replace("Ú", "U")
        .replace("Ç", "C")
    )
    upper_code = (
        upper_code.replace("Á", "A")
        .replace("À", "A")
        .replace("Â", "A")
        .replace("Ã", "A")
        .replace("É", "E")
        .replace("Ê", "E")
        .replace("Í", "I")
        .replace("Ó", "O")
        .replace("Ô", "O")
        .replace("Õ", "O")
        .replace("Ú", "U")
        .replace("Ç", "C")
    )

    # Prioritize exact curricular unit code mapping when available.
    if upper_code and upper_code in SAMPLE_VIDEOS:
        return SAMPLE_VIDEOS[upper_code]

    for keyword, url in SAMPLE_VIDEOS.items():
        if keyword == "DEFAULT":
            continue
        if keyword in upper_name:
            return url
    return SAMPLE_VIDEOS["DEFAULT"]


def fetch_target_slides(
    models: xmlrpc.client.ServerProxy,
    config: OdooConfig,
    channel_ids: List[int],
    limit: int,
    unit_codes: List[str],
) -> List[dict]:
    domain = [
        ["channel_id", "in", channel_ids],
        ["is_category", "=", False],
        ["video_url", "=", False],
    ]
    if unit_codes:
        domain.append(["x_facodi_unit_code", "in", unit_codes])
    return models.execute_kw(
        config.db,
        config.uid,
        config.password,
        "slide.slide",
        "search_read",
        [domain],
        {
            "fields": ["id", "name", "channel_id", "video_url", "x_facodi_unit_code"],
            "limit": limit,
            "order": "channel_id asc, sequence asc, id asc",
        },
    )


def apply_updates(
    models: xmlrpc.client.ServerProxy,
    config: OdooConfig,
    updates: List[Tuple[int, str, str]],
) -> int:
    applied = 0
    for slide_id, slide_name, video_url in updates:
        models.execute_kw(
            config.db,
            config.uid,
            config.password,
            "slide.slide",
            "write",
            [[slide_id], {"video_url": video_url}],
        )
        applied += 1
        print(f"  UPDATED [{slide_id}] {slide_name}")
    return applied


def verify_seeded_count(models: xmlrpc.client.ServerProxy, config: OdooConfig, channel_ids: List[int]) -> int:
    return models.execute_kw(
        config.db,
        config.uid,
        config.password,
        "slide.slide",
        "search_count",
        [[
            ["channel_id", "in", channel_ids],
            ["is_category", "=", False],
            ["video_url", "!=", False],
        ]],
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed sample Odoo lesson videos for MVP")
    parser.add_argument("--limit", type=int, default=15, help="Maximum number of slides to seed")
    parser.add_argument("--channel-ids", type=int, nargs="+", default=[9, 10], help="Odoo channel IDs to target")
    parser.add_argument(
        "--unit-codes",
        nargs="+",
        default=[],
        help="Optional unit code filter (e.g. 19411008)",
    )
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--apply", action="store_true", help="Persist updates to Odoo")
    mode.add_argument("--dry-run", action="store_true", help="Preview updates only (default)")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    dry_run = not args.apply

    config = load_config()
    models = build_models_proxy(config)

    print("=== Odoo Lesson Video Seeder ===")
    print(f"Host: {config.host}")
    print(f"DB: {config.db}")
    print(f"UID: {config.uid}")
    print(f"Mode: {'DRY-RUN' if dry_run else 'APPLY'}")
    print(f"Channels: {args.channel_ids}")
    print(f"Unit codes: {args.unit_codes if args.unit_codes else 'ALL'}")
    print(f"Limit: {args.limit}\n")

    slides = fetch_target_slides(models, config, args.channel_ids, args.limit, args.unit_codes)
    if not slides:
        print("No target slides found (all have video_url or no matching records).")
        return

    updates: List[Tuple[int, str, str]] = []
    for slide in slides:
        slide_id = int(slide["id"])
        slide_name = str(slide["name"])
        unit_code = str(slide.get("x_facodi_unit_code") or "").strip()
        video_url = pick_video_url(slide_name, unit_code)
        updates.append((slide_id, slide_name, video_url))

    print(f"Proposed updates: {len(updates)}")
    for slide_id, slide_name, video_url in updates:
        print(f"  [{slide_id}] {slide_name}")
        print(f"      -> {video_url}")

    if dry_run:
        print("\nDry-run complete. Re-run with --apply to persist changes.")
        return

    print("\nApplying updates...")
    applied = apply_updates(models, config, updates)
    seeded_count = verify_seeded_count(models, config, args.channel_ids)

    print(f"\nApplied: {applied} updates")
    print(f"Current seeded lessons in target channels: {seeded_count}")


if __name__ == "__main__":
    main()
