#!/usr/bin/env python3
"""List all courses in Odoo."""

import xmlrpc.client
import os

host = os.environ.get("ODOO_HOST", "https://edu-facodi.odoo.com").replace("https://", "").replace("http://", "").strip().strip("/")
db = os.environ.get("ODOO_DB", "edu-facodi")
uid = int(os.environ.get("ODOO_UID", "2"))
password = os.environ.get("ODOO_PASSWORD", "")

if not password:
    print("ERROR: ODOO_PASSWORD not set")
    exit(1)

models = xmlrpc.client.ServerProxy(f"https://{host}/xmlrpc/2/object")

# Get all channels
channels = models.execute_kw(
    db, uid, password, "slide.channel", "search_read",
    [[]],
    {"fields": ["id", "name", "is_published", "website_published"], "limit": 100}
)

print("All courses in Odoo:")
for channel in channels:
    is_pub = "✓" if channel["is_published"] else "✗"
    web_pub = "✓" if channel["website_published"] else "✗"
    print(f"  [{channel['id']}] {channel['name']}")
    print(f"      is_published: {is_pub}, website_published: {web_pub}")
