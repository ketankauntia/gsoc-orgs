#!/usr/bin/env python3
"""
Align our organization data with the API data.
Uses the API as the source of truth for organization names and years.
"""

import json
from difflib import SequenceMatcher
from collections import defaultdict

def similarity_ratio(name1, name2):
    """Calculate similarity between two names."""
    return SequenceMatcher(None, name1.lower(), name2.lower()).ratio()

def are_names_compatible(name1, name2):
    """
    Check if two names could plausibly be the same organization.
    Prevents obviously wrong matches like "Debian" → "PEcAn".
    """
    # Normalize for comparison
    n1 = name1.lower().strip()
    n2 = name2.lower().strip()
    
    # Extract first significant word (after "the", etc.)
    def get_first_word(s):
        words = s.split()
        if words and words[0] in ['the', 'a', 'an']:
            words = words[1:]
        return words[0] if words else ''
    
    word1 = get_first_word(n1)
    word2 = get_first_word(n2)
    
    # If first words are completely different, likely not a match
    if word1 and word2:
        word_similarity = similarity_ratio(word1, word2)
        if word_similarity < 0.50:
            return False
    
    # Check if one name contains a significant part of the other
    # Remove common suffixes for this check
    def remove_suffixes(s):
        for suffix in [' foundation', ' project', ' initiative', ' community', ' organization', '.org', '.com', ' gmbh']:
            if s.endswith(suffix):
                s = s[:-len(suffix)].strip()
        if s.startswith('the '):
            s = s[4:].strip()
        return s
    
    core1 = remove_suffixes(n1)
    core2 = remove_suffixes(n2)
    
    # If core names are very different, not a match
    if core1 and core2:
        core_similarity = similarity_ratio(core1, core2)
        if core_similarity < 0.60:
            return False
    
    return True

def find_best_api_match(our_org_name, api_orgs, threshold=0.88):
    """
    Find the best matching organization in the API for our organization.
    Returns (api_org, confidence) or (None, 0) if no good match.
    """
    best_match = None
    best_ratio = 0
    
    for api_org in api_orgs:
        # First check if names are compatible
        if not are_names_compatible(our_org_name, api_org['name']):
            continue
        
        ratio = similarity_ratio(our_org_name, api_org['name'])
        if ratio > best_ratio:
            best_ratio = ratio
            best_match = api_org
    
    if best_ratio >= threshold:
        return best_match, best_ratio
    
    return None, 0

def main():
    # Load API data (source of truth)
    print("Loading API data...")
    with open('gsoc_api_organizations.json', 'r', encoding='utf-8') as f:
        api_orgs = json.load(f)
    print(f"[OK] Loaded {len(api_orgs)} organizations from API")
    
    # Load our original merged data (before fuzzy matching)
    print("\nLoading our original merged data...")
    with open('gsoc_archive.organizations.merged.json', 'r', encoding='utf-8') as f:
        our_orgs = json.load(f)
    print(f"[OK] Loaded {len(our_orgs)} organizations from our data")
    
    # Create API lookup by name
    api_by_name = {org['name']: org for org in api_orgs}
    
    # Manual mapping for known problematic cases
    manual_mappings = {
        'AboutCode.org': 'AboutCode',
        'Ardupilot.org': 'ArduPilot',
        '52° North GmbH': '52°North Spatial Information Research GmbH',
        '52°North GmbH': '52°North Spatial Information Research GmbH',
        '52° North Initiative for Geospatial Open Source Software GmbH': '52°North Spatial Information Research GmbH',
        '52°North Initiative for Geospatial Open Source Software GmbH': '52°North Spatial Information Research GmbH',
        'BeagleBoard.org Foundation': 'BeagleBoard.org',
        'AOSSIE - Australian Open Source Software Innovation and Education': 'AOSSIE - The Australian National University\'s Open-Source Software Innovation and Education',
        'Berkman Klein Center for Internet & Society at Harvard University': 'Berkman Klein Center for Internet and Society',
        'Berkman Klein Center for Internet and Society at Harvard University': 'Berkman Klein Center for Internet and Society',
        'afl++': 'AFLplusplus',
        'AFLplusplus': 'AFLplusplus',
        'apertus° Association': 'Apertus Association',
        'Apertus Association': 'Apertus Association',
        'Canadian Center for Computational Genomics': 'Canadian Centre for Computational Genomics',
        'Canadian Centre for Computational Genomics (C3G) - Montreal node': 'Canadian Centre for Computational Genomics',
        'Catrobat': 'Catrobat.org',
        'Center for Research In Open Source Software (CROSS) at UC Santa Cruz': 'Center for Research in Open Source Software (CROSS)',
        'Center for Research in Open Source Software at UC Santa Cruz': 'Center for Research in Open Source Software (CROSS)',
        'Center for Research in Open Source Software, UC Santa Cruz': 'Center for Research in Open Source Software (CROSS)',
        'Ceph': 'Ceph Foundation',
        'Ceph Foundation': 'Ceph Foundation',
        'CHAOSS: Community Health Analytics Open Source Software': 'CHAOSS',
        'CHAOSS Project': 'CHAOSS',
        'Checkstyle': 'checkstyle',
        'checkstyle': 'checkstyle',
        'CiviCRM': 'CiviCRM',
        'CiviCRM LLC': 'CiviCRM',
        'Cloud Native Computing Foundation (CNCF)': 'CNCF',
        'CNCF': 'CNCF',
        'CRIU (Checkpoint/Restore in User-space)': 'CRIU',
        'CRIU': 'CRIU',
        'D Programming Language': 'D Language Foundation',
        'Debian': 'Debian',
        'Debian Project': 'Debian',
        'Department of Biomedical Informatics (BMI), Emory University School of Medicine': 'Department of Biomedical Informatics, Emory University',
        'Earth Science Information Partners (ESIP)': 'Earth Science Information Partners',
        'The Eclipse Foundation': 'Eclipse Foundation',
        'Elm Tooling': 'Elm Software Foundation',
        'Eta': 'Eta',
        'FOSDEM VZW': 'FOSDEM',
        'FOSSology': 'FOSSology',
        'FOSSology Project': 'FOSSology',
        'Freifunk': 'freifunk',
        'freifunk': 'freifunk',
        'GENIVI Alliance': 'COVESA',
        'Inkscape Project': 'Inkscape',
        'Intel Media and Audio for Linux': 'Intel Video and Audio for Linux',
        'Intel Media And Audio For Linux': 'Intel Video and Audio for Linux',
        'Kodi Foundation': 'Kodi',
        'MariaDB Foundation': 'MariaDB',
        'MetaBrainz Foundation Inc': 'MetaBrainz Foundation Inc',
        'MetaBrainz Foundation': 'MetaBrainz Foundation Inc',
        'Open Roberta Lab': 'Open Roberta',
        'R Foundation for Statistical Computing': 'R project for statistical computing',
        'Scala': 'Scala Center',
        'Shogun': 'Shogun',
        'shogun.ml': 'Shogun',
        'Software and Computational Systems Lab at LMU Munich': 'Software and Computational Systems Lab, LMU Munich',
        'Software Heritage': 'The Software Heritage Project',
        'The CGAL Project': 'CGAL Project',
        'CGAL project': 'CGAL Project',
        'CGAL Project': 'CGAL Project',
        'The FreeBSD Project': 'The FreeBSD Project',
        'FreeBSD': 'The FreeBSD Project',
        'The FreeType Project': 'FreeType',
        'The GNU Project': 'GNU Project',
        'The MacPorts Project': 'MacPorts',
        'The STE||AR Group': 'Ste||ar group',
        'TimVideos': 'TimVideos.us',
        'XBMC Foundation': 'Kodi',
    }
    
    # Group our organizations by their best API match
    api_groups = defaultdict(list)
    unmatched_orgs = []
    
    print("\nMatching our organizations to API organizations...")
    match_count = 0
    for org in our_orgs:
        our_name = org['name']
        
        # Try manual mapping first
        if our_name in manual_mappings:
            mapped_name = manual_mappings[our_name]
            if mapped_name in api_by_name:
                api_groups[mapped_name].append(org)
                match_count += 1
                continue
        
        # Try exact match
        if our_name in api_by_name:
            api_groups[our_name].append(org)
            match_count += 1
        else:
            # Try fuzzy match
            api_match, confidence = find_best_api_match(our_name, api_orgs)
            if api_match:
                api_groups[api_match['name']].append(org)
                if confidence < 0.95:
                    print(f"  Fuzzy match ({confidence:.2%}): '{our_name}' → '{api_match['name']}'")
                match_count += 1
            else:
                unmatched_orgs.append(org)
    
    print(f"\n[OK] Matched {match_count} organizations")
    print(f"[WARNING] Unmatched {len(unmatched_orgs)} organizations")
    
    if unmatched_orgs:
        print("\nUnmatched organizations (first 10):")
        for org in unmatched_orgs[:10]:
            print(f"  - {org['name']} (years: {org['years_appeared']})")
    
    # Build aligned organizations using API names
    print("\nBuilding aligned organization data...")
    aligned_orgs = []
    
    for api_org in api_orgs:
        api_name = api_org['name']
        api_years = sorted([int(y) for y in api_org.get('years', {}).keys()])
        
        # Get our orgs that match this API org
        our_matching_orgs = api_groups.get(api_name, [])
        
        if our_matching_orgs:
            # Merge all matching orgs
            merged_org = merge_orgs_for_api_match(api_org, our_matching_orgs)
            aligned_orgs.append(merged_org)
        else:
            # No match found in our data - this shouldn't happen often
            # Create a minimal entry from API data
            print(f"  Warning: No data found for '{api_name}'")
    
    # Add unmatched organizations that might be valid (from years not in API)
    for org in unmatched_orgs:
        # Check if this org has years that might not be in the API's coverage
        aligned_orgs.append(org)
    
    # Sort by name
    aligned_orgs.sort(key=lambda x: x['name'].lower())
    
    print(f"\n[OK] Created {len(aligned_orgs)} aligned organizations")
    
    # Save aligned data
    output_file = 'gsoc_archive.organizations.api_aligned.json'
    print(f"\nSaving to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(aligned_orgs, f, indent=2, ensure_ascii=False)
    
    print("[OK] Done!")
    
    # Statistics
    print("\n" + "="*60)
    print("Statistics:")
    print("="*60)
    print(f"API organizations: {len(api_orgs)}")
    print(f"Our original organizations: {len(our_orgs)}")
    print(f"Aligned organizations: {len(aligned_orgs)}")
    print(f"Matched to API: {len(api_orgs)}")
    print(f"Unmatched (kept): {len(unmatched_orgs)}")


def merge_orgs_for_api_match(api_org, our_orgs):
    """
    Merge our organizations that match an API organization.
    Uses API name as canonical name, but keeps our detailed data.
    """
    # Use API name as the canonical name
    merged = {
        'name': api_org['name'],
    }
    
    # Collect all data from our matching orgs
    all_years = set()
    all_appearances = []
    seen_years = set()
    all_categories = set()
    all_tech_stack = {}
    all_topics = set()
    
    for org in our_orgs:
        # Years
        if 'years_appeared' in org and org['years_appeared']:
            all_years.update(org['years_appeared'])
        
        # Appearances
        if 'appearances' in org and org['appearances']:
            for app in org['appearances']:
                year = app.get('year')
                if year and year not in seen_years:
                    all_appearances.append(app)
                    seen_years.add(year)
        
        # Categories
        if 'categories' in org and org['categories']:
            all_categories.update(org['categories'])
        
        # Tech stack
        if 'tech_stack' in org and org['tech_stack']:
            for tech in org['tech_stack']:
                if tech:
                    tech_lower = tech.lower()
                    if tech_lower not in all_tech_stack:
                        all_tech_stack[tech_lower] = tech
        
        # Topics
        if 'topics' in org and org['topics']:
            all_topics.update(org['topics'])
    
    merged['years_appeared'] = sorted(list(all_years))
    merged['years_count'] = len(all_years)
    merged['appearances'] = sorted(all_appearances, key=lambda x: x.get('year', 0))
    merged['categories'] = sorted(list(all_categories))
    merged['tech_stack'] = sorted(list(all_tech_stack.values()))
    merged['topics'] = sorted(list(all_topics))
    
    # Use first org for other fields (could be improved)
    first_org = our_orgs[0]
    
    merged['_id'] = first_org.get('_id')
    merged['canonical_id'] = first_org.get('canonical_id')
    merged['slug'] = first_org.get('slug')
    merged['description_html'] = first_org.get('description_html', '')
    merged['short_desc'] = first_org.get('short_desc', '')
    merged['website'] = first_org.get('website')
    merged['logoUrl'] = first_org.get('logoUrl')
    merged['logo_bg_color'] = first_org.get('logo_bg_color')
    merged['logo_local_filename'] = first_org.get('logo_local_filename')
    merged['contributor_guide_url'] = first_org.get('contributor_guide_url')
    merged['socials'] = first_org.get('socials', {})
    merged['created_at'] = first_org.get('created_at')
    merged['updated_at'] = first_org.get('updated_at')
    
    # Take longest description if available
    for org in our_orgs[1:]:
        if org.get('description_html') and len(org['description_html']) > len(merged.get('description_html', '')):
            merged['description_html'] = org['description_html']
        if org.get('short_desc') and len(org['short_desc']) > len(merged.get('short_desc', '')):
            merged['short_desc'] = org['short_desc']
        # Prefer https website
        if org.get('website') and org['website'].startswith('https://'):
            merged['website'] = org['website']
    
    return merged


if __name__ == '__main__':
    main()

