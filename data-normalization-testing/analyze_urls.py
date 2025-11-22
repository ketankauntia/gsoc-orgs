#!/usr/bin/env python3
"""
Analyze URLs in the raw organization data to find potential merge candidates.
Check website URLs and social URLs (GitHub, Twitter, etc.)
"""

import json
from collections import defaultdict
from urllib.parse import urlparse
import re

def normalize_url(url):
    """Normalize a URL for comparison."""
    if not url or not isinstance(url, str):
        return None
    
    url = url.strip().lower()
    if not url:
        return None
    
    # Remove trailing slashes
    url = url.rstrip('/')
    
    # Parse URL
    try:
        parsed = urlparse(url if '://' in url else 'http://' + url)
        
        # Remove common prefixes
        domain = parsed.netloc or parsed.path.split('/')[0]
        domain = domain.replace('www.', '').replace('http://', '').replace('https://', '')
        
        # Handle GitHub URLs specially - extract org/user
        if 'github.com' in domain:
            path_parts = parsed.path.strip('/').split('/')
            if path_parts and path_parts[0]:
                return f"github:{path_parts[0]}"
        
        # Handle Twitter URLs specially
        if 'twitter.com' in domain or 'x.com' in domain:
            path_parts = parsed.path.strip('/').split('/')
            if path_parts and path_parts[0]:
                return f"twitter:{path_parts[0]}"
        
        # For regular websites, use the domain
        if domain:
            return f"web:{domain}"
        
    except:
        pass
    
    return None

def extract_all_urls(org):
    """Extract all URLs from an organization entry."""
    urls = set()
    
    # Website URL
    if org.get('website'):
        normalized = normalize_url(org['website'])
        if normalized:
            urls.add(('website', normalized, org['website']))
    
    # Social URLs
    if org.get('socials'):
        socials = org['socials']
        
        for key in ['github', 'twitter', 'blog', 'mailing_list']:
            if socials.get(key):
                normalized = normalize_url(socials[key])
                if normalized:
                    urls.add((key, normalized, socials[key]))
        
        # Handle 'other' which might be a list
        if socials.get('other'):
            others = socials['other']
            if isinstance(others, list):
                for item in others:
                    if isinstance(item, str):
                        normalized = normalize_url(item)
                        if normalized:
                            urls.add(('other', normalized, item))
                    elif isinstance(item, dict) and 'url' in item:
                        normalized = normalize_url(item['url'])
                        if normalized:
                            urls.add(('other', normalized, item['url']))
    
    return urls

def main():
    print("Loading raw organization data...")
    with open('gsoc_archive.organizations.json', 'r', encoding='utf-8') as f:
        orgs = json.load(f)
    
    print(f"[OK] Loaded {len(orgs)} organizations\n")
    
    # Map URLs to organizations
    url_to_orgs = defaultdict(list)
    
    print("Analyzing URLs...")
    for i, org in enumerate(orgs):
        name = org.get('name', f'Unknown-{i}')
        years = org.get('years_appeared', [])
        
        urls = extract_all_urls(org)
        
        for url_type, normalized_url, original_url in urls:
            url_to_orgs[normalized_url].append({
                'name': name,
                'years': years,
                'url_type': url_type,
                'original_url': original_url,
                'index': i
            })
    
    print(f"[OK] Found {len(url_to_orgs)} unique normalized URLs\n")
    
    # Find URLs that map to multiple organizations
    duplicates = {}
    for url, org_list in url_to_orgs.items():
        if len(org_list) > 1:
            # Group by organization name to see if it's truly different orgs
            org_names = set(o['name'] for o in org_list)
            if len(org_names) > 1:
                duplicates[url] = org_list
    
    print(f"[OK] Found {len(duplicates)} URLs shared by multiple different organizations\n")
    
    # Analyze patterns
    print("="*80)
    print("ANALYSIS RESULTS")
    print("="*80)
    
    # Sort by number of organizations sharing the URL
    sorted_duplicates = sorted(duplicates.items(), key=lambda x: len(x[1]), reverse=True)
    
    print(f"\nTop URLs shared by multiple organizations:\n")
    
    for i, (url, org_list) in enumerate(sorted_duplicates[:20], 1):
        org_names = sorted(set(o['name'] for o in org_list))
        print(f"{i}. {url}")
        print(f"   Shared by {len(org_names)} different organization names:")
        for name in org_names:
            # Get years for this org name
            years_for_name = sorted(set(y for o in org_list if o['name'] == name for y in o['years']))
            print(f"     - {name} ({years_for_name})")
        print()
    
    # Create merge groups based on URL matching
    print("\n" + "="*80)
    print("POTENTIAL MERGE GROUPS (based on shared URLs)")
    print("="*80)
    
    # Create groups where organizations share significant URLs
    org_groups = defaultdict(set)
    
    for url, org_list in duplicates.items():
        org_names = sorted(set(o['name'] for o in org_list))
        if len(org_names) > 1:
            # Create a frozenset of names so we can use it as a key
            key = tuple(sorted(org_names))
            org_groups[key].add(url)
    
    print(f"\nFound {len(org_groups)} potential merge groups:\n")
    
    merge_groups = []
    for i, (org_names, urls) in enumerate(sorted(org_groups.items(), key=lambda x: len(x[1]), reverse=True)[:30], 1):
        print(f"{i}. Organizations: {' + '.join(org_names)}")
        print(f"   Shared URLs ({len(urls)}): {', '.join(sorted(urls)[:3])}")
        
        # Get all years
        all_years = set()
        for name in org_names:
            for org_list in duplicates.values():
                for o in org_list:
                    if o['name'] == name:
                        all_years.update(o['years'])
        
        print(f"   Combined years: {sorted(all_years)} ({len(all_years)} years)")
        print()
        
        merge_groups.append({
            'organizations': list(org_names),
            'shared_urls': list(urls),
            'years': sorted(all_years)
        })
    
    # Save analysis report
    report = {
        'total_orgs': len(orgs),
        'unique_urls': len(url_to_orgs),
        'shared_urls': len(duplicates),
        'merge_groups': merge_groups
    }
    
    with open('url_analysis_report.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"\n[OK] Analysis report saved to: url_analysis_report.json")
    
    # Summary statistics
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"Total organizations: {len(orgs)}")
    print(f"Unique normalized URLs: {len(url_to_orgs)}")
    print(f"URLs shared by multiple orgs: {len(duplicates)}")
    print(f"Potential merge groups: {len(merge_groups)}")
    
    # Estimate potential reduction
    org_count_in_groups = sum(len(g['organizations']) for g in merge_groups)
    potential_reduction = org_count_in_groups - len(merge_groups)
    print(f"\nPotential reduction: {potential_reduction} organizations")
    print(f"(from {org_count_in_groups} orgs in groups → {len(merge_groups)} merged orgs)")

if __name__ == '__main__':
    main()

