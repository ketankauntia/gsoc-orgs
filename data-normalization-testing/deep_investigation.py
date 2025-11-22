#!/usr/bin/env python3
"""
Deep investigation: Why don't we match the API perfectly?
Check the raw data to see if the years actually exist.
"""

import json
from collections import defaultdict

def main():
    print("Loading files...")
    
    # Load API (source of truth)
    with open('gsoc_api_organizations_latest.json', 'r', encoding='utf-8') as f:
        api_orgs = json.load(f)
    
    # Load our URL-merged result
    with open('gsoc_archive.organizations.url_merged.json', 'r', encoding='utf-8') as f:
        merged_orgs = json.load(f)
    
    # Load raw data to investigate
    with open('gsoc_archive.organizations.json', 'r', encoding='utf-8') as f:
        raw_orgs = json.load(f)
    
    print(f"API: {len(api_orgs)} organizations")
    print(f"Our URL-merged: {len(merged_orgs)} organizations")
    print(f"Raw data: {len(raw_orgs)} organizations\n")
    
    # Create lookups
    api_by_name = {org['name']: org for org in api_orgs}
    merged_by_name = {org['name']: org for org in merged_orgs}
    
    # Create raw data lookup by name
    raw_by_name = defaultdict(list)
    for org in raw_orgs:
        raw_by_name[org['name']].append(org)
    
    print("="*80)
    print("INVESTIGATION: Why we don't match API perfectly")
    print("="*80)
    
    missing_orgs = []
    perfect_matches = []
    year_mismatches = []
    
    for api_org in api_orgs:
        api_name = api_org['name']
        api_years = sorted([int(y) for y in api_org.get('years', {}).keys()])
        
        if api_name not in merged_by_name:
            # Organization completely missing from our merged data
            # Check if it exists in raw data
            found_in_raw = []
            for raw_name, raw_list in raw_by_name.items():
                # Check for similar names
                if api_name.lower() in raw_name.lower() or raw_name.lower() in api_name.lower():
                    for raw_org in raw_list:
                        found_in_raw.append({
                            'raw_name': raw_name,
                            'years': raw_org.get('years_appeared', []),
                            'website': raw_org.get('website'),
                            'github': raw_org.get('socials', {}).get('github') if raw_org.get('socials') else None
                        })
            
            missing_orgs.append({
                'api_name': api_name,
                'api_years': api_years,
                'found_in_raw': found_in_raw
            })
        else:
            # Organization exists, check years
            our_years = sorted(merged_by_name[api_name]['years_appeared'])
            
            if set(api_years) == set(our_years):
                perfect_matches.append(api_name)
            else:
                missing_years = sorted(set(api_years) - set(our_years))
                extra_years = sorted(set(our_years) - set(api_years))
                
                # Check raw data for missing years
                missing_year_data = []
                for year in missing_years:
                    # Find in raw data
                    for raw_name, raw_list in raw_by_name.items():
                        for raw_org in raw_list:
                            if year in raw_org.get('years_appeared', []):
                                # Check if this could be the same org
                                if (api_name.lower() in raw_name.lower() or 
                                    raw_name.lower() in api_name.lower() or
                                    api_name.replace(' ', '').lower() == raw_name.replace(' ', '').lower()):
                                    missing_year_data.append({
                                        'year': year,
                                        'raw_name': raw_name,
                                        'website': raw_org.get('website'),
                                        'github': raw_org.get('socials', {}).get('github') if raw_org.get('socials') else None,
                                        'twitter': raw_org.get('socials', {}).get('twitter') if raw_org.get('socials') else None
                                    })
                
                year_mismatches.append({
                    'name': api_name,
                    'api_years': api_years,
                    'our_years': our_years,
                    'missing_years': missing_years,
                    'extra_years': extra_years,
                    'missing_in_raw': missing_year_data
                })
    
    print(f"\nPerfect matches: {len(perfect_matches)}/{len(api_orgs)} ({len(perfect_matches)*100//len(api_orgs)}%)")
    print(f"Year mismatches: {len(year_mismatches)}/{len(api_orgs)} ({len(year_mismatches)*100//len(api_orgs)}%)")
    print(f"Completely missing: {len(missing_orgs)}/{len(api_orgs)} ({len(missing_orgs)*100//len(api_orgs)}%)")
    
    # Report missing organizations
    if missing_orgs:
        print("\n" + "="*80)
        print(f"COMPLETELY MISSING FROM OUR MERGE ({len(missing_orgs)} organizations)")
        print("="*80)
        
        for i, org in enumerate(missing_orgs, 1):
            print(f"\n{i}. {org['api_name']}")
            print(f"   API years: {org['api_years']}")
            if org['found_in_raw']:
                print(f"   Found in raw data with different names:")
                for raw in org['found_in_raw'][:3]:  # Show first 3
                    print(f"     - '{raw['raw_name']}' years={raw['years']}")
                    if raw['website']:
                        print(f"       website: {raw['website']}")
            else:
                print(f"   NOT FOUND IN RAW DATA AT ALL")
    
    # Report year mismatches with raw data investigation
    if year_mismatches:
        print("\n" + "="*80)
        print(f"YEAR MISMATCHES WITH RAW DATA INVESTIGATION ({len(year_mismatches)})")
        print("="*80)
        
        # Sort by number of missing years
        year_mismatches.sort(key=lambda x: len(x['missing_years']), reverse=True)
        
        for i, mismatch in enumerate(year_mismatches[:30], 1):
            print(f"\n{i}. {mismatch['name']}")
            print(f"   API years:  {mismatch['api_years']}")
            print(f"   Our years:  {mismatch['our_years']}")
            
            if mismatch['missing_years']:
                print(f"   Missing:    {mismatch['missing_years']}")
                
                if mismatch['missing_in_raw']:
                    print(f"   FOUND {len(mismatch['missing_in_raw'])} entries in raw data:")
                    for raw in mismatch['missing_in_raw'][:5]:
                        print(f"     - Year {raw['year']}: '{raw['raw_name']}'")
                        if raw['website']:
                            print(f"       Website: {raw['website']}")
                        if raw['github']:
                            print(f"       GitHub: {raw['github']}")
                else:
                    print(f"   NOT FOUND in raw data - might be genuinely missing")
            
            if mismatch['extra_years']:
                print(f"   Extra:      {mismatch['extra_years']}")
    
    # Save detailed report
    report = {
        'summary': {
            'api_total': len(api_orgs),
            'merged_total': len(merged_orgs),
            'perfect_matches': len(perfect_matches),
            'year_mismatches': len(year_mismatches),
            'completely_missing': len(missing_orgs)
        },
        'missing_organizations': missing_orgs,
        'year_mismatches': year_mismatches
    }
    
    with open('deep_investigation_report.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"\n\n[OK] Detailed report saved to: deep_investigation_report.json")
    
    # Summary of the problem
    print("\n" + "="*80)
    print("SUMMARY OF ISSUES")
    print("="*80)
    
    orgs_with_data_in_raw = sum(1 for m in year_mismatches if m['missing_in_raw'])
    print(f"\nYear mismatches where data EXISTS in raw: {orgs_with_data_in_raw}/{len(year_mismatches)}")
    print(f"This means our URL merge FAILED to group these correctly!")
    
    if orgs_with_data_in_raw > 0:
        print("\nREASON: Different name variants that share URLs weren't detected.")
        print("SOLUTION: Need to improve URL extraction or add more merge rules.")

if __name__ == '__main__':
    main()

