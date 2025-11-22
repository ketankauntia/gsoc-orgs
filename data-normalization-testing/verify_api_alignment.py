#!/usr/bin/env python3
"""
Verify that the API-aligned data matches the API correctly.
"""

import json

def main():
    # Load API data
    with open('gsoc_api_organizations.json', 'r', encoding='utf-8') as f:
        api_orgs = json.load(f)
    
    # Load aligned data
    with open('gsoc_archive.organizations.api_aligned.json', 'r', encoding='utf-8') as f:
        aligned_orgs = json.load(f)
    
    api_by_name = {org['name']: org for org in api_orgs}
    aligned_by_name = {org['name']: org for org in aligned_orgs}
    
    print("="*60)
    print("API Alignment Verification")
    print("="*60)
    print(f"API organizations: {len(api_orgs)}")
    print(f"Aligned organizations: {len(aligned_orgs)}")
    
    # Check specific test cases
    test_cases = ['AboutCode', 'BeagleBoard.org', 'The FreeBSD Project', 'checkstyle', 'Debian']
    
    print("\n" + "="*60)
    print("Test Cases:")
    print("="*60)
    
    perfect_matches = 0
    for name in test_cases:
        if name in api_by_name and name in aligned_by_name:
            api_years = sorted([int(y) for y in api_by_name[name].get('years', {}).keys()])
            our_years = aligned_by_name[name]['years_appeared']
            
            print(f"\n{name}:")
            print(f"  API years:  {api_years}")
            print(f"  Our years:  {our_years}")
            
            if set(api_years) == set(our_years):
                print("  [OK] Perfect match!")
                perfect_matches += 1
            else:
                missing = sorted(set(api_years) - set(our_years))
                extra = sorted(set(our_years) - set(api_years))
                if missing:
                    print(f"  [WARNING] Missing years: {missing}")
                if extra:
                    print(f"  [WARNING] Extra years: {extra}")
        elif name not in aligned_by_name:
            print(f"\n{name}:")
            print(f"  [ERROR] Not found in aligned data!")
    
    print(f"\nPerfect matches: {perfect_matches}/{len(test_cases)}")
    
    # Count overall statistics
    print("\n" + "="*60)
    print("Overall Verification:")
    print("="*60)
    
    perfect_count = 0
    close_count = 0
    mismatch_count = 0
    
    for api_org in api_orgs:
        name = api_org['name']
        if name in aligned_by_name:
            api_years = set(int(y) for y in api_org.get('years', {}).keys())
            our_years = set(aligned_by_name[name]['years_appeared'])
            
            if api_years == our_years:
                perfect_count += 1
            elif len(api_years.symmetric_difference(our_years)) <= 2:
                close_count += 1
            else:
                mismatch_count += 1
    
    print(f"Perfect matches: {perfect_count}/{len(api_orgs)} ({perfect_count*100//len(api_orgs)}%)")
    print(f"Close matches (1-2 year difference): {close_count}/{len(api_orgs)}")
    print(f"Significant mismatches: {mismatch_count}/{len(api_orgs)}")
    
    if mismatch_count > 0:
        print(f"\nShowing first 10 mismatches:")
        count = 0
        for api_org in api_orgs:
            if count >= 10:
                break
            name = api_org['name']
            if name in aligned_by_name:
                api_years = set(int(y) for y in api_org.get('years', {}).keys())
                our_years = set(aligned_by_name[name]['years_appeared'])
                
                if len(api_years.symmetric_difference(our_years)) > 2:
                    print(f"\n{name}:")
                    print(f"  API: {sorted(api_years)}")
                    print(f"  Ours: {sorted(our_years)}")
                    missing = sorted(api_years - our_years)
                    extra = sorted(our_years - api_years)
                    if missing:
                        print(f"  Missing: {missing}")
                    if extra:
                        print(f"  Extra: {extra}")
                    count += 1


if __name__ == '__main__':
    main()

