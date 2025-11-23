#!/usr/bin/env python3
"""
Transform GSoC organizations data to match the enhanced schema.
Generates final-org-data.json and inserts into MongoDB.
"""

import json
import re
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional
from collections import defaultdict


def create_slug(text: str) -> str:
    """Create URL-friendly slug from text."""
    # Convert to lowercase
    slug = text.lower()
    # Replace special characters with hyphens
    slug = re.sub(r'[^\w\s-]', '', slug)
    # Replace whitespace with hyphens
    slug = re.sub(r'[-\s]+', '-', slug)
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    return slug


def clean_email(email: str) -> Optional[str]:
    """Remove 'mailto:' prefix from email."""
    if not email:
        return None
    return email.replace('mailto:', '').strip()


def extract_social_media(org: Dict[str, Any]) -> Dict[str, Optional[str]]:
    """Extract social media links from organization data."""
    social = {
        "twitter": None,
        "blog": None,
        "github": None,
        "gitlab": None,
        "facebook": None,
        "linkedin": None,
        "youtube": None,
        "instagram": None,
        "medium": None,
        "slack": None,
        "discord": None,
        "reddit": None,
        "mastodon": None,
        "twitch": None,
        "stackoverflow": None
    }
    
    # Check twitter_url field
    if org.get('twitter_url'):
        social['twitter'] = org['twitter_url']
    
    # Check blog_url field
    if org.get('blog_url'):
        url = org['blog_url']
        # Detect if it's Medium
        if 'medium.com' in url:
            social['medium'] = url
        else:
            social['blog'] = url
    
    # Check IRC channel for Slack/Discord
    irc = org.get('irc_channel', '')
    if irc:
        if 'slack.com' in irc:
            social['slack'] = irc
        elif 'discord' in irc:
            social['discord'] = irc
    
    # Try to extract GitHub from org URL or other fields
    url = org.get('url', '')
    if 'github.com' in url:
        social['github'] = url
    elif 'gitlab.com' in url:
        social['gitlab'] = url
    
    return social


def calculate_stats(years_data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate statistics from years data."""
    projects_by_year = {}
    students_by_year = {}
    all_students = set()
    
    for year, year_info in years_data.items():
        num_projects = year_info.get('num_projects', 0)
        projects_by_year[year] = num_projects
        
        # Count unique students for this year
        projects = year_info.get('projects', [])
        year_students = set()
        for project in projects:
            student_name = project.get('student_name', '')
            if student_name:
                year_students.add(student_name)
                all_students.add(student_name)
        
        students_by_year[year] = len(year_students)
    
    total_students = len(all_students)
    total_projects = sum(projects_by_year.values())
    num_years = len(years_data)
    avg_projects = round(total_projects / num_years, 2) if num_years > 0 else 0
    
    return {
        "projects_by_year": projects_by_year,
        "students_by_year": students_by_year,
        "total_students": total_students,
        "avg_projects_per_appeared_year": avg_projects
    }


def transform_project(project: Dict[str, Any], org_slug: str, year: str, index: int) -> Dict[str, Any]:
    """Transform a single project to match schema."""
    # Generate project ID and slug
    project_id = f"proj_{org_slug[:20]}_{year}_{index:03d}"
    title_slug = create_slug(project.get('title', ''))
    
    # Extract tags from title and description
    tags = []
    title = project.get('title', '').lower()
    description = project.get('description', '').lower()
    
    # Common tech keywords to extract as tags
    tech_keywords = [
        'angular', 'react', 'vue', 'python', 'java', 'javascript', 'typescript',
        'android', 'ios', 'web', 'mobile', 'api', 'ml', 'ai', 'database',
        'docker', 'kubernetes', 'cloud', 'ui', 'ux', 'frontend', 'backend'
    ]
    
    for keyword in tech_keywords:
        if keyword in title or keyword in description:
            if keyword not in tags:
                tags.append(keyword)
    
    # Determine difficulty (placeholder logic - could be enhanced)
    difficulty = None
    if 'beginner' in description or 'easy' in description:
        difficulty = 'beginner'
    elif 'advanced' in description or 'complex' in description:
        difficulty = 'advanced'
    elif 'intermediate' in description or 'medium' in description:
        difficulty = 'medium'
    
    # Determine status based on code_url presence
    status = None
    if project.get('code_url'):
        status = 'completed'
    elif int(year) >= 2025:
        status = 'in-progress'
    
    return {
        "id": project_id,
        "slug": title_slug,
        "title": project.get('title', ''),
        "short_description": project.get('short_description', ''),
        "description": project.get('description', ''),
        "student_name": project.get('student_name', ''),
        "student_profile": project.get('student_profile'),
        "code_url": project.get('code_url'),
        "project_url": project.get('project_url', ''),
        "proposal_id": project.get('proposal_id'),
        "difficulty": difficulty,
        "status": status,
        "tags": tags[:5],  # Limit to 5 tags
        "mentor_names": []  # Could be populated if we had mentor data
    }


def transform_years(years_data: Dict[str, Any], org_slug: str) -> Dict[str, Any]:
    """Transform years data with enhanced project information."""
    transformed_years = {}
    
    for year, year_info in years_data.items():
        projects = []
        for idx, project in enumerate(year_info.get('projects', []), 1):
            transformed_project = transform_project(project, org_slug, year, idx)
            projects.append(transformed_project)
        
        transformed_years[year] = {
            "projects_url": year_info.get('projects_url', ''),
            "num_projects": year_info.get('num_projects', 0),
            "projects": projects
        }
    
    return transformed_years


def transform_organization(org: Dict[str, Any], current_year: int = 2025) -> Dict[str, Any]:
    """Transform a single organization to match the enhanced schema."""
    
    # Generate ID and slug
    org_slug = create_slug(org.get('name', ''))
    org_id = f"org_{org_slug[:30]}"
    
    # Calculate participation metrics
    years_data = org.get('years', {})
    active_years = sorted([int(year) for year in years_data.keys()])
    first_year = min(active_years) if active_years else None
    last_year = max(active_years) if active_years else None
    is_currently_active = last_year == current_year if last_year else False
    
    # Calculate total projects
    total_projects = sum(year_info.get('num_projects', 0) for year_info in years_data.values())
    
    # Transform years data
    transformed_years = transform_years(years_data, org_slug)
    
    # Calculate stats
    stats = calculate_stats(transformed_years)
    
    # Extract social media
    social = extract_social_media(org)
    
    # Current timestamp
    now = datetime.utcnow().isoformat() + 'Z'
    
    # Build transformed organization
    transformed = {
        "id": org_id,
        "slug": org_slug,
        "name": org.get('name', ''),
        "created_at": now,
        "last_updated": now,
        "url": org.get('url', ''),
        "description": org.get('description', ''),
        "category": org.get('category', ''),
        "image_url": org.get('image_url', ''),
        "image_slug": org_slug,  # Use org slug as image slug
        "image_background_color": org.get('image_background_color', '#ffffff'),
        "topics": org.get('topics', []),
        "technologies": org.get('technologies', []),
        "total_projects": total_projects,
        "active_years": active_years,
        "first_year": first_year,
        "last_year": last_year,
        "is_currently_active": is_currently_active,
        "contact": {
            "email": clean_email(org.get('contact_email', '')),
            "mailing_list": org.get('mailing_list') if org.get('mailing_list') else None,
            "irc_channel": org.get('irc_channel') if org.get('irc_channel') else None,
            "ideas_url": org.get('ideas_url') if org.get('ideas_url') else None,
            "guide_url": org.get('guide_url') if org.get('guide_url') else None
        },
        "social": social,
        "mentors": [],  # Placeholder - could be populated from project data
        "stats": stats,
        "years": transformed_years
    }
    
    return transformed


def main():
    """Main transformation function."""
    print("🚀 Starting data transformation...")
    
    # Read original data
    print("📖 Reading original data...")
    with open('api-data/orgs-data-gsocorg-dev.json', 'r', encoding='utf-8') as f:
        original_data = json.load(f)
    
    print(f"✅ Found {len(original_data)} organizations")
    
    # Transform all organizations
    print("🔄 Transforming organizations...")
    transformed_data = []
    
    for idx, org in enumerate(original_data, 1):
        try:
            transformed_org = transform_organization(org)
            transformed_data.append(transformed_org)
            
            if idx % 50 == 0:
                print(f"   Processed {idx}/{len(original_data)} organizations...")
        except Exception as e:
            print(f"❌ Error transforming {org.get('name', 'Unknown')}: {e}")
            continue
    
    print(f"✅ Transformed {len(transformed_data)} organizations")
    
    # Save transformed data
    output_file = 'api-data/final-org-data.json'
    print(f"💾 Saving to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(transformed_data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Saved transformed data to {output_file}")
    
    # Print summary statistics
    print("\n📊 Summary Statistics:")
    print(f"   Total Organizations: {len(transformed_data)}")
    
    total_all_projects = sum(org['total_projects'] for org in transformed_data)
    print(f"   Total Projects: {total_all_projects}")
    
    active_orgs = sum(1 for org in transformed_data if org['is_currently_active'])
    print(f"   Currently Active: {active_orgs}")
    
    all_years = set()
    for org in transformed_data:
        all_years.update(org['active_years'])
    print(f"   Years Covered: {min(all_years) if all_years else 'N/A'} - {max(all_years) if all_years else 'N/A'}")
    
    print("\n✨ Transformation complete!")


if __name__ == '__main__':
    main()

