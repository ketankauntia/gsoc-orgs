#!/usr/bin/env python3
"""
Upload API-aligned organizations to MongoDB.
"""

import json
import os
from datetime import datetime
from pymongo import MongoClient

def convert_dates(org):
    """Convert MongoDB date format to datetime objects."""
    if 'created_at' in org and isinstance(org['created_at'], dict) and '$date' in org['created_at']:
        org['created_at'] = datetime.fromisoformat(org['created_at']['$date'].replace('Z', '+00:00'))
    if 'updated_at' in org and isinstance(org['updated_at'], dict) and '$date' in org['updated_at']:
        org['updated_at'] = datetime.fromisoformat(org['updated_at']['$date'].replace('Z', '+00:00'))
    # Remove _id if it exists
    if '_id' in org and isinstance(org['_id'], dict):
        del org['_id']
    return org

def main():
    # Load aligned data
    print("Loading API-aligned data...")
    with open('gsoc_archive.organizations.api_aligned.json', 'r', encoding='utf-8') as f:
        orgs = json.load(f)
    
    print(f"[OK] Loaded {len(orgs)} organizations")
    
    # Convert dates
    print("Converting date formats...")
    orgs = [convert_dates(org) for org in orgs]
    
    # Connect to MongoDB
    mongo_uri = os.getenv('MONGO_URI')
    mongo_db = os.getenv('MONGO_DB')
    
    if not mongo_uri or not mongo_db:
        print("[ERROR] MONGO_URI and MONGO_DB environment variables must be set")
        return
    
    print(f"\nConnecting to MongoDB...")
    client = MongoClient(mongo_uri)
    db = client[mongo_db]
    collection = db['organizations']
    
    # Get current count
    current_count = collection.count_documents({})
    print(f"Current collection has {current_count} documents")
    
    # Drop and recreate
    print(f"\nDropping existing collection...")
    collection.drop()
    
    print(f"Inserting {len(orgs)} organizations...")
    result = collection.insert_many(orgs)
    
    print(f"[OK] Uploaded {len(result.inserted_ids)} organizations!")
    
    # Verify
    final_count = collection.count_documents({})
    print(f"\nVerification: {final_count} organizations in database")
    
    # Check test cases
    print("\nTest cases:")
    test_names = ['AboutCode', 'BeagleBoard.org', 'The FreeBSD Project']
    for name in test_names:
        org = collection.find_one({'name': name})
        if org:
            print(f"  {name}: {org['years_count']} years {org['years_appeared']}")
        else:
            print(f"  {name}: NOT FOUND")
    
    client.close()
    print("\n[OK] Upload complete!")

if __name__ == '__main__':
    main()

