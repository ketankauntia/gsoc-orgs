#!/usr/bin/env python3
"""
upload_logos_to_r2.py

Uploads locally downloaded logos to Cloudflare R2 and updates MongoDB.
Assumes compressed logos are already downloaded in the logos-webp/ directory.

Usage:
  # Upload all logos that exist locally but not in R2
  python upload_logos_to_r2.py

  # Upload specific orgs
  python upload_logos_to_r2.py --orgs unikraft jitsi

  # Test with a single org (dry-run)
  python upload_logos_to_r2.py --test-org unikraft --dry-run

  # Force re-upload even if already in R2
  python upload_logos_to_r2.py --force
"""

import os
import sys
import time
import argparse
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

import boto3
from pymongo import MongoClient
from urllib.parse import urlparse

# ----------------- CONFIG -----------------
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_BUCKET = os.getenv("R2_BUCKET_NAME")
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "").rstrip("/")

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB", "gsoc_archive")

DRY_RUN = os.getenv("DRY_RUN", "false").lower() in ("1", "true", "yes")
SLEEP_SECONDS = float(os.getenv("SLEEP_SECONDS", "0.6"))

# Local directory where logos are stored
# Use logos-webp for WebP files, or logos for original formats
LOGOS_DIR = Path(os.getenv("LOGOS_DIR", "./logos"))
# ------------------------------------------

def validate_config():
    """Validate that all required config is present."""
    missing = []
    if not R2_ACCESS_KEY:
        missing.append("R2_ACCESS_KEY_ID")
    if not R2_SECRET_KEY:
        missing.append("R2_SECRET_ACCESS_KEY")
    if not R2_ACCOUNT_ID:
        missing.append("R2_ACCOUNT_ID")
    if not R2_BUCKET:
        missing.append("R2_BUCKET_NAME")
    if not MONGO_URI:
        missing.append("MONGO_URI")
    
    if missing:
        print("[error] Missing required environment variables:")
        for var in missing:
            print(f"  - {var}")
        print("\nPlease add them to your .env file.")
        sys.exit(1)
    
    if not LOGOS_DIR.exists():
        print(f"[error] Logos directory not found: {LOGOS_DIR.absolute()}")
        print("Please run download_logos.py first to download logos.")
        sys.exit(1)

def connect_mongo():
    """Connect to MongoDB."""
    client = MongoClient(MONGO_URI)
    return client[MONGO_DB]

def get_r2_client():
    """Create and return S3 client for R2."""
    endpoint = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
    return boto3.client(
        "s3",
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        endpoint_url=endpoint
    )

def upload_to_r2(s3_client, local_path, r2_key, content_type="image/webp"):
    """Upload file to R2."""
    try:
        with open(local_path, "rb") as f:
            s3_client.put_object(
                Bucket=R2_BUCKET,
                Key=r2_key,
                Body=f,
                ContentType=content_type
            )
        return True
    except Exception as e:
        print(f"[error] Failed to upload to R2: {e}")
        return False

def get_content_type(filename):
    """Guess content type from filename extension."""
    ext = Path(filename).suffix.lower()
    mapping = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".webp": "image/webp"
    }
    return mapping.get(ext, "image/png")

def process_organization(db, s3_client, org_doc, dry_run=False, force=False):
    """Upload logo for a single organization."""
    slug = org_doc.get("slug")
    doc_id = org_doc.get("_id")
    image_slug = org_doc.get("image_slug")
    
    if not image_slug:
        print(f"[skip] {slug}: No image_slug")
        return False
    
    # Check if already uploaded (unless force)
    if not force and org_doc.get("logo_r2_url"):
        print(f"[skip] {slug}: Already uploaded to R2")
        return True
    
    # Find the actual file in LOGOS_DIR
    # Try common extensions in order of preference
    possible_extensions = ['.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg']
    local_path = None
    filename = None
    
    for ext in possible_extensions:
        test_path = LOGOS_DIR / f"{image_slug}{ext}"
        if test_path.exists():
            local_path = test_path
            filename = f"{image_slug}{ext}"
            break
    
    # Check if local file exists
    if not local_path or not local_path.exists():
        print(f"[skip] {slug}: Local file not found for image_slug '{image_slug}'")
        print(f"  Tried extensions: {', '.join(possible_extensions)}")
        print(f"  Run download_logos.py first to download this logo.")
        return False
    
    print(f"\n[info] Processing: {slug}")
    print(f"  Image Slug: {image_slug}")
    print(f"  Local file: {local_path}")
    
    file_size = local_path.stat().st_size
    print(f"  File size: {file_size} bytes")
    
    # R2 key (filename in R2)
    r2_key = filename
    
    if dry_run:
        print(f"  [dry-run] Would upload to R2: {r2_key}")
        if R2_PUBLIC_URL:
            print(f"  [dry-run] Public URL: {R2_PUBLIC_URL}/{r2_key}")
        print(f"  [dry-run] Would update MongoDB for {slug}")
        return True
    
    # Upload to R2
    content_type = get_content_type(filename)
    print(f"  Uploading to R2: {r2_key}")
    if not upload_to_r2(s3_client, local_path, r2_key, content_type):
        return False
    
    # Build public URL
    if R2_PUBLIC_URL:
        public_url = f"{R2_PUBLIC_URL}/{r2_key}"
    else:
        public_url = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com/{R2_BUCKET}/{r2_key}"
    
    print(f"  Uploaded! Public URL: {public_url}")
    
    # Update MongoDB using _id
    try:
        db.organizations.update_one(
            {"_id": doc_id},
            {
                "$set": {
                    "logo_local_filename": r2_key,
                    "logo_r2_url": public_url,
                    "logo_uploaded_at": datetime.utcnow()
                }
            }
        )
        print(f"  Updated MongoDB for {slug}")
    except Exception as e:
        print(f"[error] Failed to update MongoDB: {e}")
        return False
    
    print(f"[success] Completed: {slug}")
    return True

def run(test_org=None, org_slugs=None, dry_run=None, force=False, use_webp=False):
    """Main runner."""
    global LOGOS_DIR
    
    if dry_run is None:
        dry_run = DRY_RUN
    
    # Override LOGOS_DIR if --webp flag is set
    if use_webp:
        LOGOS_DIR = Path("./logos-webp")
    
    validate_config()
    
    print("[info] Connecting to MongoDB...")
    db = connect_mongo()
    
    print("[info] Connecting to R2...")
    s3_client = get_r2_client()
    
    print(f"[info] DRY_RUN = {dry_run}")
    print(f"[info] Force re-upload = {force}")
    print(f"[info] R2 Bucket = {R2_BUCKET}")
    print(f"[info] Logos directory = {LOGOS_DIR.absolute()}")
    print(f"[info] Upload WebP = {use_webp}")
    
    # Build query
    if test_org:
        query = {"slug": test_org}
        print(f"\n[info] TEST MODE: Processing org '{test_org}'")
        orgs = list(db.organizations.find(query).limit(1))
    elif org_slugs:
        query = {"slug": {"$in": org_slugs}}
        print(f"\n[info] Processing {len(org_slugs)} specified orgs")
        orgs = list(db.organizations.find(query))
    else:
        if force:
            # Force: upload all orgs with image_slug
            query = {"image_slug": {"$exists": True, "$ne": None, "$ne": ""}}
            print("\n[info] Force mode: Processing all orgs with image_slug")
        else:
            # Normal: only orgs without R2 URL that have image_slug
            query = {
                "$and": [
                    {
                        "$or": [
                            {"logo_r2_url": {"$exists": False}},
                            {"logo_r2_url": None},
                            {"logo_r2_url": ""}
                        ]
                    },
                    {"image_slug": {"$exists": True, "$ne": None, "$ne": ""}}
                ]
            }
            print("\n[info] Processing all orgs without R2 logos")
        orgs = list(db.organizations.find(query))
    
    print(f"[info] Found {len(orgs)} organizations to process\n")
    
    if not orgs:
        print("[info] No organizations to process!")
        return
    
    success_count = 0
    skip_count = 0
    fail_count = 0
    
    for idx, org in enumerate(orgs, 1):
        print(f"\n{'='*60}")
        print(f"[{idx}/{len(orgs)}]")
        try:
            result = process_organization(db, s3_client, org, dry_run=dry_run, force=force)
            if result:
                # Check if actually uploaded or skipped
                if org.get("logo_r2_url") and not force:
                    skip_count += 1
                else:
                    success_count += 1
            else:
                fail_count += 1
        except Exception as e:
            print(f"[error] Unexpected error processing {org.get('slug', 'unknown')}: {e}")
            fail_count += 1
        
        # Sleep between orgs
        if idx < len(orgs):
            time.sleep(SLEEP_SECONDS)
    
    print(f"\n{'='*60}")
    print(f"[done] Processed {len(orgs)} organizations")
    print(f"  Uploaded: {success_count}")
    print(f"  Skipped: {skip_count}")
    print(f"  Failed: {fail_count}")

def parse_args():
    """Parse command line arguments."""
    p = argparse.ArgumentParser(description="Upload GSoC org logos to Cloudflare R2")
    p.add_argument("--test-org", type=str, help="Test with a single org (by slug)")
    p.add_argument("--orgs", nargs="+", help="Process specific orgs (by slug)")
    p.add_argument("--dry-run", action="store_true", help="Dry run (don't upload)")
    p.add_argument("--force", action="store_true", help="Force re-upload even if already in R2")
    p.add_argument("--webp", action="store_true", help="Upload WebP versions from logos-webp/ folder")
    return p.parse_args()

if __name__ == "__main__":
    args = parse_args()
    run(
        test_org=args.test_org,
        org_slugs=args.orgs,
        dry_run=args.dry_run,
        force=args.force,
        use_webp=args.webp
    )

