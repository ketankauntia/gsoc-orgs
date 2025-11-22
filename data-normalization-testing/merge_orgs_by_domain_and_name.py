#!/usr/bin/env python3
"""
merge_orgs_by_domain_and_name.py

Idempotent migration:
- Groups organizations by domain (preferred) and merges docs in a canonical org doc
- Updates projects.org_canonical_id to point to the new canonical_id
- Keeps provenance: merges appearances/projects, unions arrays, earliest created_at, latest updated_at
- Optionally deletes (or archives) old org docs

Usage:
  pip install pymongo python-slugify rapidfuzz python-dotenv
  export MONGO_URI=...
  export MONGO_DB=gsoc_archive
  python merge_orgs_by_domain_and_name.py --dry-run

Options:
  --dry-run       : don't write changes, print what would change
  --delete-old    : delete old docs after merge (default false)
  --fuzzy-thresh  : fuzzy name match threshold for merging when domain missing (default 90)
"""
import os, sys, argparse, hashlib
from collections import defaultdict
from datetime import datetime
from slugify import slugify
from pymongo import MongoClient
from rapidfuzz.fuzz import token_set_ratio

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB", "gsoc_archive")
if not MONGO_URI:
    print("MONGO_URI missing")
    sys.exit(1)

client = MongoClient(MONGO_URI)
db = client[MONGO_DB]
orgs = db.organizations
projects = db.projects

def domain_from_url(url):
    if not url:
        return None
    try:
        from urllib.parse import urlparse
        host = urlparse(url).netloc.lower()
        if host.startswith("www."):
            host = host[4:]
        return host
    except:
        return None

def make_canonical_org_id(name, domain=None):
    # slugify name + 6-char hash of domain or name to avoid collisions
    base = slugify(name)[:60]
    h = hashlib.sha1((domain or name).encode("utf-8")).hexdigest()[:6]
    return f"{base}-{h}"

def union_lists(*lists):
    out = []
    for l in lists:
        if not l: continue
        for x in l:
            if x not in out:
                out.append(x)
    return out

def merge_group(docs, dry_run=True, delete_old=False):
    # docs: list of org documents (pymongo docs)
    if not docs:
        return None
    # choose primary: prefer doc with latest created_at? or pick first
    docs_sorted = sorted(docs, key=lambda d: d.get("created_at") or datetime.utcnow())
    primary = docs_sorted[0]

    # build merged
    name = primary.get("name") or docs[0].get("name")
    domain = None
    for d in docs:
        domain = domain_from_url(d.get("website")) or domain
    canonical_id = make_canonical_org_id(name, domain)

    merged = {
        "canonical_id": canonical_id,
        "slug": slugify(name)[:60],
        "name": name,
        "website": domain or primary.get("website"),
        "logoUrl": primary.get("logoUrl") or next((d.get("logoUrl") for d in docs if d.get("logoUrl")), None),
        "logo_local_filename": None,
        "short_desc": primary.get("short_desc") or None,
        "description_html": primary.get("description_html") or None,
        "tech_stack": union_lists(*[d.get("tech_stack") or [] for d in docs]),
        "topics": union_lists(*[d.get("topics") or [] for d in docs]),
        "categories": union_lists(*[d.get("categories") or [] for d in docs]),
        "socials": {}, # merge heuristics below
        "years_appeared": sorted(list(set(sum([[y for y in d.get("years_appeared") or []] for d in docs], [])))),
        "years_count": None,
        "appearances": union_lists(*[d.get("appearances") or [] for d in docs]),
        "created_at": min([d.get("created_at") for d in docs if d.get("created_at")] or [datetime.utcnow()]),
        "updated_at": datetime.utcnow()
    }
    merged["years_count"] = len(merged["years_appeared"])

    # merge socials: prefer non-null values
    socials = {}
    for d in docs:
        s = d.get("socials") or {}
        for k,v in s.items():
            if v and k not in socials:
                socials[k] = v
    merged["socials"] = socials

    print(f"[merge] will merge {len(docs)} docs into canonical_id={canonical_id} name='{name[:60]}' years={merged['years_appeared']}")

    if not dry_run:
        # upsert merged doc
        orgs.update_one({"canonical_id": canonical_id}, {"$set": merged}, upsert=True)
        # update projects: any project referencing any old doc id -> update to new canonical_id
        old_cans = [d.get("canonical_id") for d in docs if d.get("canonical_id")]
        if old_cans:
            res = projects.update_many({"org_canonical_id": {"$in": old_cans}}, {"$set": {"org_canonical_id": canonical_id}})
            print(f"  [projects] updated {res.modified_count} project(s) to new canonical_id")
        if delete_old:
            res = orgs.delete_many({"canonical_id": {"$in": old_cans}})
            print(f"  [orgs] deleted {res.deleted_count} old org docs")
    return canonical_id

def find_domain_groups():
    # group by domain (preferred)
    cursor = orgs.find({}, {"_id":1,"canonical_id":1,"name":1,"website":1,"slug":1,"years_appeared":1,"created_at":1,"logoUrl":1,"short_desc":1,"socials":1,"topics":1,"tech_stack":1})
    by_domain = {}
    no_domain = []
    for d in cursor:
        domain = domain_from_url(d.get("website"))
        if domain:
            by_domain.setdefault(domain, []).append(d)
        else:
            no_domain.append(d)
    return by_domain, no_domain

def fuzzy_group_remaining(docs, thresh=90):
    # docs: list of docs without domain — do aggressive dedupe by token_set_ratio on name
    groups = []
    used = set()
    for i,d in enumerate(docs):
        if d["_id"] in used:
            continue
        group = [d]
        used.add(d["_id"])
        name_i = (d.get("name") or "").lower()
        for j in range(i+1,len(docs)):
            e = docs[j]
            if e["_id"] in used: continue
            name_j = (e.get("name") or "").lower()
            score = token_set_ratio(name_i, name_j)
            if score >= thresh:
                group.append(e)
                used.add(e["_id"])
        groups.append(group)
    return groups

def main(dry_run=True, delete_old=False, fuzzy_thresh=90):
    by_domain, no_domain = find_domain_groups()
    print(f"Found {len(by_domain)} domain groups and {len(no_domain)} docs without domain")

    # process domain groups with >1 doc
    for domain, docs in by_domain.items():
        if len(docs) > 1:
            merge_group(docs, dry_run=dry_run, delete_old=delete_old)

    # for those without domain - fuzzy group and merge
    print("Grouping docs without domain by fuzzy name match ...")
    docs_list = list(orgs.find({"website": {"$in": [None, ""]}}, {"_id":1,"canonical_id":1,"name":1,"website":1,"slug":1,"years_appeared":1,"created_at":1,"logoUrl":1,"short_desc":1,"socials":1,"topics":1,"tech_stack":1}))
    groups = fuzzy_group_remaining(docs_list, thresh=fuzzy_thresh)
    for g in groups:
        if len(g) > 1:
            merge_group(g, dry_run=dry_run, delete_old=delete_old)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="print actions but do not write")
    parser.add_argument("--delete-old", action="store_true", help="delete old per-year org docs after merge")
    parser.add_argument("--fuzzy-thresh", type=int, default=90, help="fuzzy match threshold for names")
    args = parser.parse_args()
    main(dry_run=args.dry_run, delete_old=args.delete_old, fuzzy_thresh=args.fuzzy_thresh)
