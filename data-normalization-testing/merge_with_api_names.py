#!/usr/bin/env python3
"""
Merge organizations using URL matching BUT use API names as canonical names.
This ensures we match API exactly while still merging duplicates.
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
        
        # GitHub URLs
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
        if domain and domain not in ['groups.google.com', 'plus.google.com', 'gitter.im', 'webchat.freenode.net', 'medium.com', 'lists.sourceforge.net']:
            return f"web:{domain}"
    except:
        pass
    
    return None

def extract_key_urls(org):
    """Extract key identifying URLs."""
    urls = set()
    
    if org.get('website'):
        normalized = normalize_url(org['website'])
        if normalized:
            urls.add(normalized)
    
    if org.get('socials'):
        socials = org['socials']
        
        if socials.get('github'):
            normalized = normalize_url(socials['github'])
            if normalized and normalized.startswith('github:'):
                urls.add(normalized)
        
        if socials.get('twitter'):
            normalized = normalize_url(socials['twitter'])
            if normalized and normalized.startswith('twitter:'):
                urls.add(normalized)
    
    return urls

def parse_mongo_date(date_obj):
    """Parse MongoDB date format."""
    if isinstance(date_obj, dict) and '$date' in date_obj:
        return datetime.fromisoformat(date_obj['$date'].replace('Z', '+00:00'))
    return datetime.now()

def merge_organizations(orgs, canonical_name):
    """Merge multiple organization entries using canonical name."""
    if len(orgs) == 1:
        org = orgs[0].copy()
        org['name'] = canonical_name
        return org
    
    merged = {'name': canonical_name}
    
    # Use first org as base ID
    merged['_id'] = orgs[0]['_id']
    
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
    
    # Merge categories
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
    
    # Merge 'other'
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
    merged['canonical_id'] = sorted(canonical_ids, reverse=True)[0] if canonical_ids else None
    
    # Slug
    for org in orgs:
        if org.get('canonical_id') == merged['canonical_id']:
            merged['slug'] = org.get('slug')
            break
    else:
        merged['slug'] = orgs[0].get('slug')
    
    # Logo
    logos = [org.get('logoUrl') for org in orgs if org.get('logoUrl')]
    merged['logoUrl'] = logos[0] if logos else None
    
    # Logo bg color
    for org in orgs:
        if org.get('logo_bg_color'):
            merged['logo_bg_color'] = org['logo_bg_color']
            break
    else:
        merged['logo_bg_color'] = None
    
    # Logo local filename
    for org in orgs:
        if org.get('logo_local_filename'):
            merged['logo_local_filename'] = org['logo_local_filename']
            break
    else:
        merged['logo_local_filename'] = None
    
    # Contributor guide URL
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
    print("Loading data...")
    
    # Load API (source of truth for names)
    with open('gsoc_api_organizations_latest.json', 'r', encoding='utf-8') as f:
        api_orgs = json.load(f)
    print(f"[OK] API: {len(api_orgs)} organizations")
    
    # Load raw data
    with open('gsoc_archive.organizations.json', 'r', encoding='utf-8') as f:
        raw_orgs = json.load(f)
    print(f"[OK] Raw: {len(raw_orgs)} organizations\n")
    
    # Build URL to API name mapping
    api_url_to_name = {}
    api_by_name = {}
    for api_org in api_orgs:
        api_name = api_org['name']
        api_by_name[api_name] = api_org
        
        # Extract URLs from API
        if api_org.get('url'):
            url = normalize_url(api_org['url'])
            if url:
                api_url_to_name[url] = api_name
        
        # Check image URL domain
        if api_org.get('image_url'):
            # Sometimes org domain is in image URL
            pass
    
    # Build URL to raw orgs mapping
    url_to_raw_orgs = defaultdict(list)
    
    print("Extracting URLs from raw data...")
    for i, org in enumerate(raw_orgs):
        urls = extract_key_urls(org)
        for url in urls:
            url_to_raw_orgs[url].append(org)
    
    print(f"[OK] Found {len(url_to_raw_orgs)} unique URLs\n")
    
    # Group raw orgs by API name
    print("Mapping raw orgs to API names...")
    api_name_to_raw_orgs = defaultdict(list)
    unmatched_raw_orgs = []
    
    processed_indices = set()
    
    # First pass: Direct URL matching
    for url, raw_org_list in url_to_raw_orgs.items():
        if url in api_url_to_name:
            api_name = api_url_to_name[url]
            for org in raw_org_list:
                idx = raw_orgs.index(org)
                if idx not in processed_indices:
                    api_name_to_raw_orgs[api_name].append(org)
                    processed_indices.add(idx)
    
    # Second pass: Name matching for remaining
    for i, org in enumerate(raw_orgs):
        if i in processed_indices:
            continue
        
        raw_name = org.get('name', '')
        
        # Try exact match
        if raw_name in api_by_name:
            api_name_to_raw_orgs[raw_name].append(org)
            processed_indices.add(i)
            continue
        
        # Try fuzzy match
        matched = False
        for api_name in api_by_name.keys():
            # Check if names are very similar
            if (api_name.lower() in raw_name.lower() or 
                raw_name.lower() in api_name.lower() or
                api_name.replace(' ', '').lower() == raw_name.replace(' ', '').lower()):
                api_name_to_raw_orgs[api_name].append(org)
                processed_indices.add(i)
                matched = True
                break
        
        if not matched:
            unmatched_raw_orgs.append(org)
    
    print(f"[OK] Matched {len(processed_indices)} raw orgs to API names")
    print(f"[OK] {len(unmatched_raw_orgs)} raw orgs don't match any API name\n")
    
    # Merge organizations using API names
    print("Merging organizations...")
    final_orgs = []
    
    for api_org in api_orgs:
        api_name = api_org['name']
        raw_orgs_for_api = api_name_to_raw_orgs.get(api_name, [])
        
        if raw_orgs_for_api:
            merged = merge_organizations(raw_orgs_for_api, api_name)
            final_orgs.append(merged)
            
            api_years = sorted([int(y) for y in api_org.get('years', {}).keys()])
            our_years = merged['years_appeared']
            
            if set(api_years) != set(our_years):
                missing = sorted(set(api_years) - set(our_years))
                if missing:
                    print(f"  Warning: {api_name} missing years {missing}")
        else:
            print(f"  ERROR: No raw data found for '{api_name}'")
    
    # Add unmatched orgs
    for org in unmatched_raw_orgs:
        final_orgs.append(org)
    
    # Sort by name
    final_orgs.sort(key=lambda x: x['name'].lower())
    
    print(f"\n[OK] Final count: {len(final_orgs)} organizations")
    print(f"    - {len(api_orgs)} from API")
    print(f"    - {len(unmatched_raw_orgs)} additional from raw data")
    
    # Save
    output_file = 'gsoc_archive.organizations.final.json'
    print(f"\nSaving to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(final_orgs, f, indent=2, ensure_ascii=False)
    
    print("[OK] Done!")

if __name__ == '__main__':
    main()

