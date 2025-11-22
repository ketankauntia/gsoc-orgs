#!/usr/bin/env python3
"""
Create CSV report for easier review in Excel.
"""

import json
import csv

with open('FINAL_COMPARISON_REPORT.json', 'r', encoding='utf-8') as f:
    report = json.load(f)

# Create year mismatches CSV
with open('year_mismatches.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['Organization Name', 'Match %', 'API Years', 'Our Years', 'Missing Years', 'Extra Years', 'Status'])
    
    for org in report['year_mismatches']:
        writer.writerow([
            org['name'],
            f"{org['match_percent']}%",
            ','.join(map(str, org['api_years'])),
            ','.join(map(str, org['our_years'])),
            ','.join(map(str, org['missing'])) if org['missing'] else '',
            ','.join(map(str, org['extra'])) if org['extra'] else '',
            'NEEDS_REVIEW'
        ])

print(f"[OK] Created year_mismatches.csv ({len(report['year_mismatches'])} rows)")

# Create missing orgs CSV
with open('missing_orgs.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['Organization Name', 'Years', 'Status'])
    
    for org in report['only_in_api']:
        writer.writerow([
            org['name'],
            ','.join(map(str, org['years'])),
            'MISSING_FROM_OURS'
        ])

print(f"[OK] Created missing_orgs.csv ({len(report['only_in_api'])} rows)")

# Create extra orgs CSV
with open('extra_orgs.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['Organization Name', 'Years', 'Status'])
    
    for org in report['only_in_ours']:
        writer.writerow([
            org['name'],
            ','.join(map(str, org['years'])),
            'EXTRA_IN_OURS'
        ])

print(f"[OK] Created extra_orgs.csv ({len(report['only_in_ours'])} rows)")

print("\n[OK] All CSV files created! You can open these in Excel for easier review.")

