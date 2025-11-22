#!/usr/bin/env python3

from dotenv import load_dotenv
load_dotenv()

"""
gsoc_archive_importer.py

Usage (example):
  # configure env
  export MONGO_URI="mongodb+srv://<user>:<pass>@your-cluster.mongodb.net"
  export MONGO_DB="gsoc_archive"
  export SLEEP_SECONDS=0.6

  # install deps once:
  pip install requests pymongo python-dateutil python-slugify

  # run a smoke test for 2016:
  python gsoc_archive_importer.py --years 2016

  # run full range
  python gsoc_archive_importer.py --years 2016 2017 2018 2019 2020 2021 2022 2023 2024 2025
"""

import os
import sys
import time
import argparse
from datetime import datetime
from urllib.parse import urlparse, urljoin

import requests
from pymongo import MongoClient, UpdateOne
from dateutil import parser as dateparser
from slugify import slugify

# ----------------- CONFIG -----------------
BASE = "https://summerofcode.withgoogle.com"
# Current year uses /program/, archived years use /archive/programs/
API_ORGS_LIST_CURRENT = BASE + "/api/program/{year}/organizations/"
API_ORG_DETAIL_CURRENT = BASE + "/api/organization/{slug}/?program={year}"
API_PROJECTS_CURRENT = BASE + "/api/projects/?organization_slug={slug}&program_slug={year}"
API_ORGS_LIST_ARCHIVE = BASE + "/api/archive/programs/{year}/organizations/"
API_ORG_DETAIL_ARCHIVE = BASE + "/api/archive/programs/{year}/organizations/{slug}/"
REQUEST_HEADERS = {"User-Agent": "gsoc-archive-importer/1.0"}
REQUEST_TIMEOUT = 18
SLEEP = float(os.getenv("SLEEP_SECONDS", "0.8"))
# ------------------------------------------

def get_env_var(name, default=None):
    v = os.getenv(name)
    return v if v is not None else default

def connect_mongo():
    uri = get_env_var("MONGO_URI")
    if not uri:
        print("[error] MONGO_URI not set. Export it and retry.")
        sys.exit(1)
    dbname = get_env_var("MONGO_DB", "gsoc_archive")
    client = MongoClient(uri)
    return client[dbname]

def canonical_id(program_slug, slug):
    return f"{program_slug}-{slug}"

def domain_of(url):
    if not url:
        return ""
    try:
        p = urlparse(url)
        host = p.netloc.lower()
        return host[4:] if host.startswith("www.") else host
    except:
        return ""

def fetch_json(url):
    resp = requests.get(url, headers=REQUEST_HEADERS, timeout=REQUEST_TIMEOUT)
    resp.raise_for_status()
    return resp.json()

def ensure_collections_and_indexes(db):
    # create collections if missing
    if "organizations" not in db.list_collection_names():
        db.create_collection("organizations")
    if "projects" not in db.list_collection_names():
        db.create_collection("projects")

    # indexes (idempotent)
    db.organizations.create_index({"canonical_id": 1}, unique=True)
    db.organizations.create_index({"slug": 1})
    db.organizations.create_index({"website": 1})
    db.organizations.create_index({"years_appeared": 1})

    db.projects.create_index({"project_id": 1}, unique=True)
    db.projects.create_index({"org_canonical_id": 1})
    db.projects.create_index({"year": 1})

def normalize_contact_links(contact_links):
    socials = {
        "twitter": None,
        "github": None,
        "email": None,
        "blog": None,
        "mailing_list": None,
        "other": []
    }
    for c in contact_links or []:
        url = c.get("url") or ""
        name = (c.get("name") or "").lower()
        if "twitter" in url or "twitter" in name:
            socials["twitter"] = url
        elif "github" in url or "github" in name:
            socials["github"] = url
        elif "@" in url and not url.startswith("http"):
            socials["email"] = url
        elif "blog" in name or "blog" in url:
            socials["blog"] = url
        elif "mail" in name or "list" in name or "mailing" in name:
            socials["mailing_list"] = url
        else:
            socials["other"].append({"name": c.get("name"), "url": url})
    return socials

def upsert_org_and_projects(db, org_json, year, source_url=None, projects_list=None):
    """
    Upsert organization and its projects into MongoDB.
    
    Args:
        db: MongoDB database instance
        org_json: Organization data
        year: Year being processed
        source_url: Source URL for the org data (optional)
        projects_list: List of projects (optional, will use org_json['projects'] if not provided)
    """
    orgs = db.organizations
    projects_db = db.projects

    prog = org_json.get("program_slug") or str(year)
    slug = org_json.get("slug")
    can_id = canonical_id(prog, slug)

    socials = normalize_contact_links(org_json.get("contact_links", []))
    website = org_json.get("website_url") or org_json.get("website")

    # Use provided projects_list or fall back to org_json projects
    if projects_list is None:
        projects_list = org_json.get("projects", []) or []
    chosen_count = len(projects_list)

    appearance = {
        "year": int(prog),
        "appeared": True,           # listed in year -> appeared
        "pitchedCount": None,       # not available from archive JSON
        "chosenCount": chosen_count,
        "source_url": source_url or f"{BASE}/archive/{prog}"
    }

    org_doc = {
        "canonical_id": can_id,
        "slug": slug,
        "name": org_json.get("name"),
        "logoUrl": org_json.get("logo_url"),
        "logo_bg_color": org_json.get("logo_bg_color"),
        "short_desc": org_json.get("tagline"),
        "description_html": org_json.get("description_html") or org_json.get("description"),
        "website": website,
        "contributor_guide_url": org_json.get("ideas_list_url") or org_json.get("contributor_guidance_url") or org_json.get("ideas_link"),
        "tech_stack": org_json.get("tech_tags") or [],
        "topics": org_json.get("topic_tags") or [],
        "categories": org_json.get("categories") or [],
        "socials": socials,
        "updated_at": datetime.utcnow()
        # Note: logo_local_filename is only set on insert, never updated
    }

    # upsert: set basic fields, push year -> please keep idempotent
    update = {
        "$set": org_doc,
        "$setOnInsert": {"created_at": datetime.utcnow(), "logo_local_filename": None},
        "$addToSet": {"years_appeared": int(prog), "appearances": appearance}
    }
    orgs.update_one({"canonical_id": can_id}, update, upsert=True)

    # projects bulk upsert
    ops = []
    for p in projects_list:
        pid = p.get("id") or p.get("project_id") or p.get("uid")
        if not pid:
            continue
        proj_doc = {
            "project_id": str(pid),
            "org_canonical_id": can_id,
            "org_slug": slug,
            "org_name": p.get("organization_name") or org_json.get("name"),
            "year": int(prog),
            "project_title": p.get("title"),
            "project_info_html": p.get("abstract_html") or p.get("body") or p.get("abstract_short"),
            "project_abstract_short": p.get("abstract_short") or p.get("body_short"),
            "project_code_url": p.get("project_code_url"),
            "contributor": p.get("contributor_display_name") or p.get("contributor_name"),
            "mentors": p.get("mentor_names") or p.get("assigned_mentors") or [],
            "date_created": dateparser.parse(p.get("date_created")) if p.get("date_created") else None,
            "date_archived": dateparser.parse(p.get("date_archived")) if p.get("date_archived") else None,
            "date_updated": dateparser.parse(p.get("date_updated")) if p.get("date_updated") else None,
            "lastUpdated": datetime.utcnow()
        }
        ops.append(UpdateOne({"project_id": str(pid)}, {"$set": proj_doc, "$setOnInsert": {"created_at": datetime.utcnow()}}, upsert=True))

    if ops:
        try:
            result = projects_db.bulk_write(ops, ordered=False)
            # optional logging:
            # print(f"[info] projects bulk write: matched={result.matched_count}, upserted={len(result.upserted_ids)}")
        except Exception as e:
            print(f"[error] projects bulk write failed for {slug}: {e}")

    # recompute years_count for org
    doc = orgs.find_one({"canonical_id": can_id})
    if doc:
        years_count = len(doc.get("years_appeared", []))
        orgs.update_one({"canonical_id": can_id}, {"$set": {"years_count": years_count}})

def run_years(years):
    db = connect_mongo()
    ensure_collections_and_indexes(db)

    for y in years:
        # Try current year endpoint first, fall back to archive endpoint
        list_url_current = API_ORGS_LIST_CURRENT.format(year=y)
        list_url_archive = API_ORGS_LIST_ARCHIVE.format(year=y)
        
        orgs_list = None
        is_current = False
        
        # Try current year API first
        print(f"[info] fetching org list for {y} -> {list_url_current}")
        try:
            orgs_list = fetch_json(list_url_current)
            is_current = True
            print(f"[info] found {len(orgs_list)} organizations for {y} (current year API)")
        except requests.HTTPError as e:
            if e.response.status_code == 404:
                # Try archive API
                print(f"[info] current year API not found, trying archive -> {list_url_archive}")
                try:
                    orgs_list = fetch_json(list_url_archive)
                    print(f"[info] found {len(orgs_list)} organizations for {y} (archive API)")
                except Exception as e2:
                    print(f"[error] failed to fetch {list_url_archive}: {e2}")
                    continue
            else:
                print(f"[error] failed to fetch {list_url_current}: {e}")
                continue
        except Exception as e:
            print(f"[error] failed to fetch {list_url_current}: {e}")
            continue
        
        if not orgs_list:
            continue

        if is_current:
            # Current year: list has all org data, fetch projects separately
            print(f"[info] processing {len(orgs_list)} orgs for current year {y}")
            for idx, org_data in enumerate(orgs_list):
                slug = org_data.get("slug")
                detail_url = API_ORG_DETAIL_CURRENT.format(year=y, slug=slug)
                
                # For current year, list already has all org details, but we can try detail API
                # Note: detail API might return same data or 404
                org_detail = org_data  # Use list data as base
                try:
                    org_detail_from_api = fetch_json(detail_url)
                    org_detail = org_detail_from_api
                except Exception as e:
                    # Detail API failed or 404, use list data (which is complete for current year)
                    pass
                
                # Fetch projects separately for current year
                projects_list = []
                projects_url = API_PROJECTS_CURRENT.format(slug=slug, year=y)
                try:
                    projects_response = fetch_json(projects_url)
                    # Response format: {"result": ["id1", "id2"], "entities": {"projects": [...], ...}}
                    if "entities" in projects_response and "projects" in projects_response["entities"]:
                        projects_list = projects_response["entities"]["projects"]
                    print(f"[info] found {len(projects_list)} projects for {slug}")
                except Exception as e:
                    print(f"[warn] failed to fetch projects for {slug}: {e}")
                
                try:
                    upsert_org_and_projects(db, org_detail, y, source_url=detail_url, projects_list=projects_list)
                except Exception as e:
                    print(f"[error] upsert failed for {slug} (year {y}): {e}")
                
                # polite sleep
                time.sleep(SLEEP)
        else:
            # Archive year: need to fetch detail for each org (includes projects)
            print(f"[info] processing {len(orgs_list)} orgs for archive year {y}")
            for idx, o in enumerate(orgs_list):
                slug = o.get("slug")
                detail_url = API_ORG_DETAIL_ARCHIVE.format(year=y, slug=slug)
                try:
                    org_detail = fetch_json(detail_url)
                except Exception as e:
                    print(f"[warn] failed to fetch detail {detail_url}: {e} — using list entry fallback")
                    org_detail = o
                try:
                    upsert_org_and_projects(db, org_detail, y, source_url=detail_url)
                except Exception as e:
                    print(f"[error] upsert failed for {slug} (year {y}): {e}")
                # polite sleep
                time.sleep(SLEEP)
        
        # small gap between years
        time.sleep(SLEEP * 2)

    print("[done] all years processed")

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--years", nargs="+", required=False, default=[str(y) for y in range(2016, 2026)],
                   help="years to import, e.g. 2016 2017 ... (default 2016-2025)")
    return p.parse_args()

if __name__ == "__main__":
    args = parse_args()
    years = args.years
    # ensure all are strings and trimmed
    years = [str(y).strip() for y in years]
    run_years(years)
