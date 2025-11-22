#!/usr/bin/env python3
"""
Create a detailed comparison report between API data and our final aligned data.
This will help identify which organizations match properly and which need manual review.
"""

import json
import requests

def main():
    # Download latest API data
    # api_url = ""
    print("Downloading latest API data...")
    try:
        response = requests.get(api_url, timeout=30)
        response.raise_for_status()
        api_orgs = response.json()
        print(f"[OK] Downloaded {len(api_orgs)} organizations from API")
        
        # Save for reference
        with open('gsoc_api_organizations_latest.json', 'w', encoding='utf-8') as f:
            json.dump(api_orgs, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[ERROR] Failed to download API data: {e}")
        print("Using cached API data...")
        with open('gsoc_api_organizations.json', 'r', encoding='utf-8') as f:
            api_orgs = json.load(f)
    
    # Load our final aligned data
    print("\nLoading our final aligned data...")
    with open('gsoc_archive.organizations.api_aligned.json', 'r', encoding='utf-8') as f:
        our_orgs = json.load(f)
    print(f"[OK] Loaded {len(our_orgs)} organizations from our data")
    
    # Create lookups
    api_by_name = {org['name']: org for org in api_orgs}
    our_by_name = {org['name']: org for org in our_orgs}
    
    # Classification
    perfect_matches = []
    year_mismatches = []
    name_only_matches = []
    only_in_api = []
    only_in_ours = []
    
    print("\nAnalyzing matches...")
    
    # Check each API organization
    for api_org in api_orgs:
        api_name = api_org['name']
        api_years = sorted([int(y) for y in api_org.get('years', {}).keys()])
        
        if api_name in our_by_name:
            our_org = our_by_name[api_name]
            our_years = sorted(our_org.get('years_appeared', []))
            
            if set(api_years) == set(our_years):
                perfect_matches.append({
                    'name': api_name,
                    'years': api_years,
                    'count': len(api_years)
                })
            else:
                missing_years = sorted(set(api_years) - set(our_years))
                extra_years = sorted(set(our_years) - set(api_years))
                year_mismatches.append({
                    'name': api_name,
                    'api_years': api_years,
                    'our_years': our_years,
                    'missing': missing_years,
                    'extra': extra_years,
                    'match_percent': len(set(api_years) & set(our_years)) * 100 // len(set(api_years) | set(our_years))
                })
        else:
            only_in_api.append({
                'name': api_name,
                'years': api_years,
                'count': len(api_years)
            })
    
    # Check for organizations only in our data
    for our_org in our_orgs:
        our_name = our_org['name']
        if our_name not in api_by_name:
            only_in_ours.append({
                'name': our_name,
                'years': sorted(our_org.get('years_appeared', [])),
                'count': our_org.get('years_count', 0)
            })
    
    # Sort by severity
    year_mismatches.sort(key=lambda x: len(x['missing']) + len(x['extra']), reverse=True)
    only_in_api.sort(key=lambda x: x['name'])
    only_in_ours.sort(key=lambda x: x['name'])
    
    # Print summary
    print("\n" + "="*80)
    print("COMPARISON SUMMARY")
    print("="*80)
    print(f"Total API organizations:        {len(api_orgs)}")
    print(f"Total our organizations:        {len(our_orgs)}")
    print(f"\nPerfect matches:                {len(perfect_matches)} ({len(perfect_matches)*100//len(api_orgs)}%)")
    print(f"Year mismatches:                {len(year_mismatches)} ({len(year_mismatches)*100//len(api_orgs)}%)")
    print(f"Only in API (missing from ours): {len(only_in_api)}")
    print(f"Only in ours (not in API):       {len(only_in_ours)}")
    
    # Create detailed report file
    report = {
        'summary': {
            'api_total': len(api_orgs),
            'our_total': len(our_orgs),
            'perfect_matches': len(perfect_matches),
            'year_mismatches': len(year_mismatches),
            'only_in_api': len(only_in_api),
            'only_in_ours': len(only_in_ours),
            'match_percentage': len(perfect_matches) * 100 // len(api_orgs)
        },
        'perfect_matches': perfect_matches,
        'year_mismatches': year_mismatches,
        'only_in_api': only_in_api,
        'only_in_ours': only_in_ours
    }
    
    report_file = 'FINAL_COMPARISON_REPORT.json'
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"\n[OK] Detailed report saved to: {report_file}")
    
    # Create human-readable report
    readable_file = 'FINAL_COMPARISON_REPORT.txt'
    with open(readable_file, 'w', encoding='utf-8') as f:
        f.write("="*80 + "\n")
        f.write("GSoC Organizations - Final Comparison Report\n")
        f.write("="*80 + "\n\n")
        
        f.write("SUMMARY\n")
        f.write("-"*80 + "\n")
        f.write(f"API Organizations:           {len(api_orgs)}\n")
        f.write(f"Our Organizations:           {len(our_orgs)}\n")
        f.write(f"Perfect Matches:             {len(perfect_matches)} ({len(perfect_matches)*100//len(api_orgs)}%)\n")
        f.write(f"Year Mismatches:             {len(year_mismatches)} ({len(year_mismatches)*100//len(api_orgs)}%)\n")
        f.write(f"Missing from Our Data:       {len(only_in_api)}\n")
        f.write(f"Extra in Our Data:           {len(only_in_ours)}\n\n")
        
        if year_mismatches:
            f.write("\n" + "="*80 + "\n")
            f.write(f"YEAR MISMATCHES ({len(year_mismatches)} organizations)\n")
            f.write("="*80 + "\n")
            f.write("These organizations exist in both datasets but have different years.\n")
            f.write("MANUAL REVIEW NEEDED!\n\n")
            
            for i, mismatch in enumerate(year_mismatches, 1):
                f.write(f"\n{i}. {mismatch['name']}\n")
                f.write(f"   Match: {mismatch['match_percent']}%\n")
                f.write(f"   API years:  {mismatch['api_years']}\n")
                f.write(f"   Our years:  {mismatch['our_years']}\n")
                if mismatch['missing']:
                    f.write(f"   MISSING:    {mismatch['missing']}\n")
                if mismatch['extra']:
                    f.write(f"   EXTRA:      {mismatch['extra']}\n")
        
        if only_in_api:
            f.write("\n" + "="*80 + "\n")
            f.write(f"MISSING FROM OUR DATA ({len(only_in_api)} organizations)\n")
            f.write("="*80 + "\n")
            f.write("These organizations are in the API but not in our data.\n")
            f.write("MANUAL REVIEW NEEDED!\n\n")
            
            for i, org in enumerate(only_in_api, 1):
                f.write(f"{i:3d}. {org['name']}\n")
                f.write(f"     Years: {org['years']} ({org['count']} years)\n")
        
        if only_in_ours:
            f.write("\n" + "="*80 + "\n")
            f.write(f"EXTRA IN OUR DATA ({len(only_in_ours)} organizations)\n")
            f.write("="*80 + "\n")
            f.write("These organizations are in our data but not in the API.\n")
            f.write("These might be from years not covered by the API or different naming.\n\n")
            
            for i, org in enumerate(only_in_ours, 1):
                f.write(f"{i:3d}. {org['name']}\n")
                f.write(f"     Years: {org['years']} ({org['count']} years)\n")
        
        f.write("\n" + "="*80 + "\n")
        f.write(f"PERFECT MATCHES ({len(perfect_matches)} organizations)\n")
        f.write("="*80 + "\n")
        f.write("These organizations match perfectly (name and years).\n")
        f.write("NO ACTION NEEDED - These are correct!\n\n")
        
        # Group by year count for readability
        by_year_count = {}
        for match in perfect_matches:
            count = match['count']
            if count not in by_year_count:
                by_year_count[count] = []
            by_year_count[count].append(match['name'])
        
        for count in sorted(by_year_count.keys(), reverse=True):
            orgs = sorted(by_year_count[count])
            f.write(f"\n{count} years ({len(orgs)} organizations):\n")
            for org in orgs:
                f.write(f"  - {org}\n")
    
    print(f"[OK] Human-readable report saved to: {readable_file}")
    
    # Print preview of issues
    if year_mismatches:
        print("\n" + "="*80)
        print("YEAR MISMATCHES - TOP 10 (Manual review needed)")
        print("="*80)
        for i, mismatch in enumerate(year_mismatches[:10], 1):
            print(f"\n{i}. {mismatch['name']} ({mismatch['match_percent']}% match)")
            print(f"   API: {mismatch['api_years']}")
            print(f"   Ours: {mismatch['our_years']}")
            if mismatch['missing']:
                print(f"   Missing: {mismatch['missing']}")
            if mismatch['extra']:
                print(f"   Extra: {mismatch['extra']}")
    
    if only_in_api:
        print("\n" + "="*80)
        print(f"MISSING FROM OUR DATA - First 10 of {len(only_in_api)}")
        print("="*80)
        for i, org in enumerate(only_in_api[:10], 1):
            print(f"{i}. {org['name']} - {org['years']}")
    
    if only_in_ours:
        print("\n" + "="*80)
        print(f"EXTRA IN OUR DATA - First 10 of {len(only_in_ours)}")
        print("="*80)
        for i, org in enumerate(only_in_ours[:10], 1):
            print(f"{i}. {org['name']} - {org['years']}")
    
    print("\n" + "="*80)
    print("REPORT GENERATION COMPLETE")
    print("="*80)
    print(f"\nFiles created:")
    print(f"  1. {report_file} - JSON format (for programmatic access)")
    print(f"  2. {readable_file} - Text format (for manual review)")
    print(f"\nReview these files to identify organizations that need manual fixing.")


if __name__ == '__main__':
    main()

