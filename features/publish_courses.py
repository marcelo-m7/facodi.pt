#!/usr/bin/env python3
"""Publish LESTI and Design courses on Odoo instance.

Usage:
  python features/publish_courses.py --dry-run
  python features/publish_courses.py --apply

Environment:
  ODOO_HOST       e.g. edu-facodi.odoo.com
  ODOO_DB         e.g. edu-facodi
  ODOO_PASSWORD   API key/password
"""

from __future__ import annotations

import argparse
import os
import sys
import xmlrpc.client
from dataclasses import dataclass
from typing import List, Dict


@dataclass
class OdooConfig:
    host: str
    db: str
    uid: int
    password: str


def normalize_host(host: str) -> str:
    """Normalize Odoo host URL."""
    normalized = host.replace("https://", "").replace("http://", "").strip().strip("/")
    return normalized


def load_config() -> OdooConfig:
    """Load Odoo config from environment."""
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
    """Build XML-RPC proxy for models."""
    base = f"https://{config.host}"
    return xmlrpc.client.ServerProxy(f"{base}/xmlrpc/2/object")


def find_courses(
    models: xmlrpc.client.ServerProxy,
    config: OdooConfig,
    course_names: List[str],
) -> Dict[str, dict]:
    """Search for courses by name or keyword."""
    courses_found = {}
    
    # Map course names/acronyms to keywords
    search_keywords = {
        "LESTI": ["Engenharia", "Sistemas", "Tecnologias"],
        "Design": ["Design", "Comunicação"],
    }
    
    # First, get all courses
    all_courses = models.execute_kw(
        config.db,
        config.uid,
        config.password,
        "slide.channel",
        "search_read",
        [[]],
        {
            "fields": ["id", "name", "is_published", "website_published"],
            "limit": 100,
        },
    )
    
    for name in course_names:
        found = False
        name_upper = name.upper()
        keywords = search_keywords.get(name, [name])
        
        for course in all_courses:
            course_name = course["name"].upper()
            
            # Check if any keyword matches
            if any(keyword.upper() in course_name for keyword in keywords):
                courses_found[course["name"]] = course
                print(f"Found: {course['name']} (ID: {course['id']})")
                found = True
                break
        
        if not found:
            print(f"Not found: {name}")
    
    return courses_found


def publish_course(
    models: xmlrpc.client.ServerProxy,
    config: OdooConfig,
    course_id: int,
    course_name: str,
) -> bool:
    """Publish a course."""
    try:
        models.execute_kw(
            config.db,
            config.uid,
            config.password,
            "slide.channel",
            "write",
            [[course_id], {"is_published": True, "website_published": True}],
        )
        print(f"  ✓ Published: {course_name} (ID: {course_id})")
        return True
    except Exception as e:
        print(f"  ✗ Error publishing {course_name}: {e}")
        return False


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Publish courses on Odoo")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--apply", action="store_true", help="Persist updates to Odoo")
    mode.add_argument("--dry-run", action="store_true", help="Preview updates only (default)")
    return parser.parse_args()


def main() -> None:
    """Main entry point."""
    args = parse_args()
    dry_run = not args.apply

    config = load_config()
    models = build_models_proxy(config)

    print("=== Odoo Course Publisher ===")
    print(f"Host: {config.host}")
    print(f"DB: {config.db}")
    print(f"UID: {config.uid}")
    print(f"Mode: {'DRY-RUN' if dry_run else 'APPLY'}\n")

    # Search for courses
    course_names = ["LESTI", "Design"]
    print(f"Searching for courses: {course_names}\n")
    
    courses = find_courses(models, config, course_names)
    
    if not courses:
        print("\nNo courses found matching the search criteria.")
        return

    print(f"\nFound {len(courses)} course(s):\n")
    for name, course in courses.items():
        is_pub = "✓" if course["is_published"] else "✗"
        web_pub = "✓" if course["website_published"] else "✗"
        print(f"  {name}")
        print(f"    ID: {course['id']}")
        print(f"    is_published: {is_pub} ({course['is_published']})")
        print(f"    website_published: {web_pub} ({course['website_published']})")

    # Determine which courses need publishing
    to_publish = [
        (name, course) for name, course in courses.items()
        if not (course["is_published"] and course["website_published"])
    ]

    if not to_publish:
        print("\nAll courses are already published.")
        return

    print(f"\n--- Publishing {len(to_publish)} course(s) ---\n")
    
    if dry_run:
        for name, course in to_publish:
            print(f"  Would publish: {name} (ID: {course['id']})")
        print("\nDry-run complete. Re-run with --apply to persist changes.")
        return

    # Apply updates
    print("Applying updates...\n")
    published_count = 0
    for name, course in to_publish:
        if publish_course(models, config, course["id"], name):
            published_count += 1

    print(f"\nPublished: {published_count}/{len(to_publish)} course(s)")


if __name__ == "__main__":
    main()
