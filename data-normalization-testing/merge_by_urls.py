#!/usr/bin/env python3
"""
Merge organizations based on shared URLs (website, GitHub, Twitter, etc.).
This is more reliable than name matching.
"""

import json
from collections import defaultdict
from urllib.parse import urlparse
from datetime import datetime

def normalize_url(url):
    """Normalize a URL for comparison."""
    if not url or not isinstance(url, str):
        return None
    
    url = url.strip().lower().rstrip('/')
    if not url:
        return None
    
    try:
        parsed = urlparse(url if '://' in url else 'http://' + url)
        domain = parsed.netloc or parsed.path.split('/')[0]
        domain = domain.replace('www.', '').replace('http://', '').replace('https://', '')
        
        # GitHub URLs - extract org/user
        if 'github.com' in domain:
            path_parts = parsed.path.strip('/').split('/')
            if path_parts and path_parts[0]:
                return f"github:{path_parts[0]}"
        
        # Twitter URLs
        if 'twitter.com' in domain or 'x.com' in domain:
            path_parts = parsed.path.strip('/').split('/')
            if path_parts and path_parts[0]:
                return f"twitter:{path_parts[0]}"
        
        # Regular websites
        if domain:
            return f"web:{domain}"
    except:
        pass
    
    return None

def extract_key_urls(org):
    """Extract key identifying URLs (website, GitHub, Twitter)."""
    urls = set()
    
    # Website is the most important identifier
    if org.get('website'):
        normalized = normalize_url(org['website'])
        if normalized and not normalized.startswith('web:groups.google.com') and not normalized.startswith('web:plus.google.com'):
            urls.add(('website', normalized, org['website']))
    
    # Social URLs
    if org.get('socials'):
        socials = org['socials']
        
        # GitHub is very reliable
        if socials.get('github'):
            normalized = normalize_url(socials['github'])
            if normalized and normalized.startswith('github:'):
                urls.add(('github', normalized, socials['github']))
        
        # Twitter is also reliable
        if socials.get('twitter'):
            normalized = normalize_url(socials['twitter'])
            if normalized and normalized.startswith('twitter:'):
                urls.add(('twitter', normalized, socials['twitter']))
    
    return urls

def parse_mongo_date(date_obj):
    """Parse MongoDB date format."""
    if isinstance(date_obj, dict) and '$date' in date_obj:
        return datetime.fromisoformat(date_obj['$date'].replace('Z', '+00:00'))
    return datetime.now()

def merge_organizations(orgs):
    """Merge multiple organization entries."""
    if len(orgs) == 1:
        return orgs[0]
    
    merged = {}
    
    # Use first org as base
    merged['_id'] = orgs[0]['_id']
    
    # Choose best name (prefer without year suffix, longer names)
    names = [org['name'] for org in orgs]
    # Sort by: no Foundation/Project suffix (lower), then length (desc)
    best_name = sorted(names, key=lambda n: (
        'Foundation' in n or 'Project' in n,
        -len(n)
    ))[0]
    merged['name'] = best_name
    
    # Merge years
    all_years = set()
    for org in orgs:
        if 'years_appeared' in org:
            all_years.update(org['years_appeared'])
    merged['years_appeared'] = sorted(list(all_years))
    merged['years_count'] = len(all_years)
    
    # Merge appearances
    all_appearances = []
    seen_years = set()
    for org in orgs:
        if 'appearances' in org:
            for app in org['appearances']:
                year = app.get('year')
                if year and year not in seen_years:
                    all_appearances.append(app)
                    seen_years.add(year)
    merged['appearances'] = sorted(all_appearances, key=lambda x: x.get('year', 0))
    
    # Merge categories (unique)
    all_categories = set()
    for org in orgs:
        if 'categories' in org:
            all_categories.update(org['categories'])
    merged['categories'] = sorted(list(all_categories))
    
    # Merge tech_stack
    tech_stack_map = {}
    for org in orgs:
        if 'tech_stack' in org:
            for tech in org['tech_stack']:
                if tech:
                    tech_lower = tech.lower()
                    if tech_lower not in tech_stack_map:
                        tech_stack_map[tech_lower] = tech
    merged['tech_stack'] = sorted(list(tech_stack_map.values()))
    
    # Merge topics
    all_topics = set()
    for org in orgs:
        if 'topics' in org:
            all_topics.update(org['topics'])
    merged['topics'] = sorted(list(all_topics))
    
    # Merge socials
    merged['socials'] = {}
    for key in ['twitter', 'github', 'email', 'blog', 'mailing_list', 'other']:
        merged['socials'][key] = None
        for org in orgs:
            if 'socials' in org and org['socials'] and key in org['socials']:
                value = org['socials'][key]
                if value and value != []:
                    merged['socials'][key] = value
                    break
    
    # Merge 'other' in socials
    all_other = []
    seen_other = set()
    for org in orgs:
        if 'socials' in org and org['socials'] and 'other' in org['socials']:
            if isinstance(org['socials']['other'], list):
                for item in org['socials']['other']:
                    if isinstance(item, dict):
                        item_str = json.dumps(item, sort_keys=True)
                        if item_str not in seen_other:
                            seen_other.add(item_str)
                            all_other.append(item)
                    elif item and item not in seen_other:
                        seen_other.add(item)
                        all_other.append(item)
    merged['socials']['other'] = all_other
    
    # Take longest description
    longest_desc = ""
    for org in orgs:
        if org.get('description_html') and len(org['description_html']) > len(longest_desc):
            longest_desc = org['description_html']
    merged['description_html'] = longest_desc
    
    # Take longest short_desc
    longest_short = ""
    for org in orgs:
        if org.get('short_desc') and len(org['short_desc']) > len(longest_short):
            longest_short = org['short_desc']
    merged['short_desc'] = longest_short
    
    # Website - prefer https
    websites = [org.get('website') for org in orgs if org.get('website')]
    https_sites = [w for w in websites if w.startswith('https://')]
    merged['website'] = https_sites[0] if https_sites else (websites[0] if websites else None)
    
    # Canonical_id - most recent
    canonical_ids = [org.get('canonical_id') for org in orgs if org.get('canonical_id')]
    if canonical_ids:
        merged['canonical_id'] = sorted(canonical_ids, reverse=True)[0]
    else:
        merged['canonical_id'] = None
    
    # Slug - from same org as canonical_id
    for org in orgs:
        if org.get('canonical_id') == merged['canonical_id']:
            merged['slug'] = org.get('slug')
            break
    else:
        merged['slug'] = orgs[0].get('slug')
    
    # Logo - first available
    logos = [org.get('logoUrl') for org in orgs if org.get('logoUrl')]
    merged['logoUrl'] = logos[0] if logos else None
    
    # Logo bg color - first non-null
    for org in orgs:
        if org.get('logo_bg_color'):
            merged['logo_bg_color'] = org['logo_bg_color']
            break
    else:
        merged['logo_bg_color'] = None
    
    # Logo local filename - first non-null
    for org in orgs:
        if org.get('logo_local_filename'):
            merged['logo_local_filename'] = org['logo_local_filename']
            break
    else:
        merged['logo_local_filename'] = None
    
    # Contributor guide URL - most recent
    guides = [org.get('contributor_guide_url') for org in orgs if org.get('contributor_guide_url')]
    merged['contributor_guide_url'] = guides[-1] if guides else None
    
    # Created_at - earliest
    earliest = None
    for org in orgs:
        if 'created_at' in org:
            dt = parse_mongo_date(org['created_at'])
            if earliest is None or dt < earliest:
                earliest = dt
                merged['created_at'] = org['created_at']
    
    # Updated_at - latest
    latest = None
    for org in orgs:
        if 'updated_at' in org:
            dt = parse_mongo_date(org['updated_at'])
            if latest is None or dt > latest:
                latest = dt
                merged['updated_at'] = org['updated_at']
    
    return merged

def main():
    print("Loading raw organization data...")
    with open('gsoc_archive.organizations.json', 'r', encoding='utf-8') as f:
        orgs = json.load(f)
    
    print(f"[OK] Loaded {len(orgs)} organizations\n")
    
    # Map organizations by their key URLs
    url_to_orgs = defaultdict(list)
    
    print("Extracting key URLs...")
    for i, org in enumerate(orgs):
        urls = extract_key_urls(org)
        
        for url_type, normalized_url, original_url in urls:
            url_to_orgs[normalized_url].append({
                'org': org,
                'index': i
            })
    
    print(f"[OK] Found {len(url_to_orgs)} unique key URLs\n")
    
    # Build merge groups using Union-Find approach
    print("Building merge groups...")
    
    # Map each org index to a group ID
    parent = list(range(len(orgs)))
    
    def find(x):
        if parent[x] != x:
            parent[x] = find(parent[x])
        return parent[x]
    
    def union(x, y):
        px, py = find(x), find(y)
        if px != py:
            parent[px] = py
    
    # Union organizations that share URLs
    for url, org_list in url_to_orgs.items():
        if len(org_list) > 1:
            # Union all orgs sharing this URL
            first_idx = org_list[0]['index']
            for item in org_list[1:]:
                union(first_idx, item['index'])
    
    # Group organizations by their root parent
    groups = defaultdict(list)
    for i, org in enumerate(orgs):
        root = find(i)
        groups[root].append(org)
    
    merged_orgs = []
    multi_org_groups = 0
    
    for group_orgs in groups.values():
        if len(group_orgs) > 1:
            multi_org_groups += 1
            names = sorted(set(o['name'] for o in group_orgs))
            years = sorted(set(y for o in group_orgs for y in o.get('years_appeared', [])))
            print(f"  Merging: {' + '.join(names)} → {len(years)} years")
        
        merged = merge_organizations(group_orgs)
        merged_orgs.append(merged)
    
    # Sort by name
    merged_orgs.sort(key=lambda x: x['name'].lower())
    
    print(f"\n[OK] Created {len(merged_orgs)} organizations")
    print(f"[OK] Merged {multi_org_groups} groups")
    
    # Statistics
    total_years_before = sum(org.get('years_count', 0) for org in orgs)
    total_years_after = sum(org.get('years_count', 0) for org in merged_orgs)
    
    print(f"\nStatistics:")
    print(f"  Before: {len(orgs)} entries")
    print(f"  After:  {len(merged_orgs)} entries")
    print(f"  Reduced by: {len(orgs) - len(merged_orgs)} entries")
    print(f"  Total years preserved: {total_years_after}")
    
    # Save
    output_file = 'gsoc_archive.organizations.url_merged.json'
    print(f"\nSaving to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(merged_orgs, f, indent=2, ensure_ascii=False)
    
    print("[OK] Done!\n")
    
    # Show some examples
    print("Examples of merged organizations:")
    examples = [
        'BeagleBoard.org',
        'Apache Software Foundation',
        'GNOME',
        'FreeBSD',
        'Debian'
    ]
    
    for name in examples:
        for org in merged_orgs:
            if name.lower() in org['name'].lower():
                print(f"  {org['name']}: {org['years_appeared']} ({org['years_count']} years)")
                break

if __name__ == '__main__':
    main()

