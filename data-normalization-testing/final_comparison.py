#!/usr/bin/env python3
"""
Final comparison with API.
"""

import json

def main():
    # Load API
    with open('gsoc_api_organizations_latest.json', 'r', encoding='utf-8') as f:
        api_orgs = json.load(f)
    
    # Load our final
    with open('gsoc_archive.organizations.final.json', 'r', encoding='utf-8') as f:
        final_orgs = json.load(f)
    
    print("="*80)
    print("FINAL COMPARISON WITH API")
    print("="*80)
    print(f"API: {len(api_orgs)} organizations")
    print(f"Ours: {len(final_orgs)} organizations\n")
    
    # Create lookups
    api_by_name = {org['name']: org for org in api_orgs}
    final_by_name = {org['name']: org for org in final_orgs}
    
    perfect_matches = []
    year_mismatches = []
    missing_from_ours = []
    
    for api_org in api_orgs:
        api_name = api_org['name']
        api_years = sorted([int(y) for y in api_org.get('years', {}).keys()])
        
        if api_name not in final_by_name:
            missing_from_ours.append({
                'name': api_name,
                'years': api_years
            })
        else:
            our_years = sorted(final_by_name[api_name]['years_appeared'])
            
            if set(api_years) == set(our_years):
                perfect_matches.append(api_name)
            else:
                missing_years = sorted(set(api_years) - set(our_years))
                extra_years = sorted(set(our_years) - set(api_years))
                year_mismatches.append({
                    'name': api_name,
                    'api_years': api_years,
                    'our_years': our_years,
                    'missing': missing_years,
                    'extra': extra_years,
                    'match_pct': len(set(api_years) & set(our_years)) * 100 // max(len(set(api_years) | set(our_years)), 1)
                })
    
    print(f"Perfect matches: {len(perfect_matches)}/{len(api_orgs)} ({len(perfect_matches)*100//len(api_orgs)}%)")
    print(f"Year mismatches: {len(year_mismatches)}/{len(api_orgs)} ({len(year_mismatches)*100//len(api_orgs)}%)")
    print(f"Missing from ours: {len(missing_from_ours)}/{len(api_orgs)} ({len(missing_from_ours)*100//len(api_orgs)}%)")
    
    if missing_from_ours:
        print("\n" + "="*80)
        print(f"MISSING FROM OUR DATA ({len(missing_from_ours)} organizations)")
        print("="*80)
        print("These are in API but we have NO raw data for them:")
        for org in missing_from_ours:
            print(f"  - {org['name']} (years: {org['years']})")
    
    if year_mismatches:
        print("\n" + "="*80)
        print(f"YEAR MISMATCHES ({len(year_mismatches)} organizations)")
        print("="*80)
        
        # Sort by missing years
        year_mismatches.sort(key=lambda x: len(x['missing']), reverse=True)
        
        for i, m in enumerate(year_mismatches, 1):
            print(f"\n{i}. {m['name']} ({m['match_pct']}% match)")
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
    
    test_cases = ['AboutCode', 'BeagleBoard.org', 'The FreeBSD Project', 'Debian', 'Apache Software Foundation']
    
    for name in test_cases:
        # Try both with and without "The"
        check_names = [name, f"The {name}", name.replace('The ', '')]
        found = False
        
        for check_name in check_names:
            if check_name in api_by_name and check_name in final_by_name:
                api_years = sorted([int(y) for y in api_by_name[check_name].get('years', {}).keys()])
                our_years = final_by_name[check_name]['years_appeared']
                
                status = "[OK]" if set(api_years) == set(our_years) else "[MISMATCH]"
                print(f"\n{status} {check_name}")
                print(f"  API:  {api_years}")
                print(f"  Ours: {our_years}")
                found = True
                break
        
        if not found:
            print(f"\n[NOT FOUND] {name}")
    
    # Extra in ours
    extra_in_ours = []
    for final_org in final_orgs:
        if final_org['name'] not in api_by_name:
            extra_in_ours.append(final_org['name'])
    
    if extra_in_ours:
        print("\n" + "="*80)
        print(f"EXTRA IN OUR DATA ({len(extra_in_ours)} organizations)")
        print("="*80)
        print("These are in our data but not in API:")
        for name in sorted(extra_in_ours)[:20]:
            print(f"  - {name}")
        if len(extra_in_ours) > 20:
            print(f"  ... and {len(extra_in_ours) - 20} more")

if __name__ == '__main__':
    main()

