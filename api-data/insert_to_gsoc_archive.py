#!/usr/bin/env python3
"""
Insert data directly into gsoc_archive.organizations
(This matches what you see in MongoDB Compass)
"""

import json
import os
from dotenv import load_dotenv
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure

load_dotenv()

# Use gsoc_archive database (the one you see in Compass)
MONGODB_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("MONGO_DB")
COLLECTION_NAME = "organizations"

def main():
    print("="*60)
    print("   Insert to gsoc_archive.organizations")
    print("="*60)
    
    # Read data
    print("\n📖 Reading data...")
    try:
        with open('final-org-data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"✅ Loaded {len(data)} organizations")
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return
    
    # Connect to MongoDB
    print(f"\n🔌 Connecting to MongoDB...")
    print(f"   URI: {MONGODB_URI}")
    print(f"   Database: {DATABASE_NAME}")
    print(f"   Collection: {COLLECTION_NAME}")
    
    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        print("✅ Connected successfully")
    except ConnectionFailure as e:
        print(f"❌ Connection failed: {e}")
        return
    
    db = client[DATABASE_NAME]
    collection = db[COLLECTION_NAME]
    
    # Check existing data
    existing_count = collection.count_documents({})
    print(f"\n📝 Current documents in collection: {existing_count}")
    
    if existing_count > 0:
        response = input(f"\n⚠️  Collection already has {existing_count} documents. Replace? (yes/no): ").strip().lower()
        if response not in ['yes', 'y']:
            print("❌ Operation cancelled")
            return
        print("🗑️  Clearing existing data...")
        collection.delete_many({})
    
    # Insert data
    print(f"\n📥 Inserting {len(data)} organizations...")
    inserted = 0
    errors = 0
    
    try:
        for i, org in enumerate(data, 1):
            try:
                result = collection.replace_one(
                    {'id': org['id']},
                    org,
                    upsert=True
                )
                
                if result.upserted_id or result.matched_count > 0:
                    inserted += 1
                
                if i % 50 == 0:
                    print(f"   Progress: {i}/{len(data)} ({i*100//len(data)}%)")
                    
            except Exception as e:
                errors += 1
                print(f"❌ Error inserting {org.get('name', 'unknown')}: {e}")
                if errors > 10:
                    print("❌ Too many errors, stopping...")
                    break
        
        print(f"\n✅ Insertion complete!")
        print(f"   📝 Successfully inserted/updated: {inserted}")
        print(f"   ❌ Errors: {errors}")
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return
    
    # Verify
    print(f"\n🔍 Verifying...")
    final_count = collection.count_documents({})
    print(f"   Total documents in collection: {final_count}")
    
    if final_count > 0:
        # Show sample
        print(f"\n📊 Sample data:")
        sample = collection.find_one({})
        if sample:
            print(f"   ID: {sample.get('id')}")
            print(f"   Name: {sample.get('name')}")
            print(f"   Slug: {sample.get('slug')}")
            print(f"   Category: {sample.get('category')}")
            print(f"   Total Projects: {sample.get('total_projects')}")
        
        # Show active orgs
        active = collection.count_documents({'is_currently_active': True})
        print(f"\n   Currently active orgs (2025): {active}")
        
        # Create indexes
        print(f"\n🔍 Creating indexes...")
        try:
            collection.create_index([("id", ASCENDING)], unique=True)
            collection.create_index([("slug", ASCENDING)], unique=True)
            collection.create_index([("name", ASCENDING)])
            collection.create_index([("category", ASCENDING)])
            collection.create_index([("is_currently_active", ASCENDING)])
            collection.create_index([("total_projects", DESCENDING)])
            collection.create_index([
                ("name", "text"),
                ("description", "text"),
                ("topics", "text"),
                ("technologies", "text")
            ])
            print("✅ Indexes created")
        except Exception as e:
            print(f"⚠️  Index creation: {e}")
        
        print(f"\n✅ SUCCESS! Check MongoDB Compass:")
        print(f"   Database: {DATABASE_NAME}")
        print(f"   Collection: {COLLECTION_NAME}")
        print(f"   Refresh and you should see {final_count} documents!")
    
    client.close()
    
    print("\n" + "="*60)
    print("   ✨ Complete!")
    print("="*60)


if __name__ == '__main__':
    main()

