#!/usr/bin/env python3
"""
Compare URL-merged organizations with API.
"""

import json

def main():
    print("Loading files...")
    
    # Load API data
    with open('gsoc_api_organizations_latest.json', 'r', encoding='utf-8') as f:
        api_orgs = json.load(f)
    
    # Load URL-merged data
    with open('gsoc_archive.organizations.url_merged.json', 'r', encoding='utf-8') as f:
        our_orgs = json.load(f)
    
    print(f"API: {len(api_orgs)} organizations")
    print(f"Ours (URL-merged): {len(our_orgs)} organizations\n")
    
    # Create lookups
    api_by_name = {org['name']: org for org in api_orgs}
    our_by_name = {org['name']: org for org in our_orgs}
    
    # Comparison
    perfect_matches = []
    year_mismatches = []
    
    for api_org in api_orgs:
        api_name = api_org['name']
        api_years = sorted([int(y) for y in api_org.get('years', {}).keys()])
        
        if api_name in our_by_name:
            our_years = sorted(our_by_name[api_name]['years_appeared'])
            
            if set(api_years) == set(our_years):
                perfect_matches.append(api_name)
            else:
                missing = sorted(set(api_years) - set(our_years))
                extra = sorted(set(our_years) - set(api_years))
                year_mismatches.append({
                    'name': api_name,
                    'api_years': api_years,
                    'our_years': our_years,
                    'missing': missing,
                    'extra': extra
                })
    
    print("="*80)
    print("COMPARISON RESULTS")
    print("="*80)
    print(f"Perfect matches: {len(perfect_matches)}/{len(api_orgs)} ({len(perfect_matches)*100//len(api_orgs)}%)")
    print(f"Year mismatches: {len(year_mismatches)}/{len(api_orgs)} ({len(year_mismatches)*100//len(api_orgs)}%)")
    print(f"Missing from ours: {len(api_orgs) - len(perfect_matches) - len(year_mismatches)}")
    
    if year_mismatches:
        print("\n" + "="*80)
        print(f"YEAR MISMATCHES ({len(year_mismatches)} organizations)")
        print("="*80)
        
        # Sort by number of missing years
        year_mismatches.sort(key=lambda x: len(x['missing']) + len(x['extra']), reverse=True)
        
        for i, m in enumerate(year_mismatches[:20], 1):
            match_pct = len(set(m['api_years']) & set(m['our_years'])) * 100 // max(len(set(m['api_years']) | set(m['our_years'])), 1)
            print(f"\n{i}. {m['name']} ({match_pct}% match)")
            print(f"   API:  {m['api_years']}")
            print(f"   Ours: {m['our_years']}")
            if m['missing']:
                print(f"   Missing: {m['missing']}")
            if m['extra']:
                print(f"   Extra: {m['extra']}")
    
    # Test cases
    print("\n" + "="*80)
    print("TEST CASES")
    print("="*80)
    
    test_cases = ['AboutCode', 'BeagleBoard.org', 'The FreeBSD Project', 'Debian']
    
    for name in test_cases:
        if name in api_by_name and name in our_by_name:
            api_years = sorted([int(y) for y in api_by_name[name].get('years', {}).keys()])
            our_years = our_by_name[name]['years_appeared']
            
            status = "[OK]" if set(api_years) == set(our_years) else "[MISMATCH]"
            print(f"\n{status} {name}")
            print(f"  API:  {api_years}")
            print(f"  Ours: {our_years}")

if __name__ == '__main__':
    main()

