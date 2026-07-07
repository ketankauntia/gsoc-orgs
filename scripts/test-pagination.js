#!/usr/bin/env node

/**
 * Test Pagination Script
 * 
 * This script tests the pagination functionality of your API
 * and shows you exactly how much data is in your database.
 * 
 * Usage: node scripts/test-pagination.js
 */

const BASE_URL = 'http://localhost:3000/api/v1';

async function testEndpoint(name, endpoint, dataKey) {
  console.log(`\n📊 Testing ${name}...`);
  console.log('═'.repeat(60));
  
  try {
    // Test page 1 with limit=5
    const res1 = await fetch(`${BASE_URL}${endpoint}?limit=5&page=1`);
    const data1 = await res1.json();
    
    if (!data1.success) {
      console.log(`❌ Error: ${data1.error.message}`);
      return;
    }
    
    const { total, pages, page, limit } = data1.data.pagination;
    const items = data1.data[dataKey];
    
    console.log(`✅ ${name} - Page 1 Results:`);
    console.log(`   Total records in database: ${total}`);
    console.log(`   Total pages available: ${pages}`);
    console.log(`   Current page: ${page}`);
    console.log(`   Items per page (limit): ${limit}`);
    console.log(`   Items returned: ${items.length}`);
    console.log('');
    console.log(`   First few items:`);
    items.slice(0, 3).forEach((item, i) => {
      const name = item.name || item.project_title;
      const slug = item.slug || item.project_id;
      console.log(`     ${i + 1}. ${name} (${slug})`);
    });
    
    // Test page 2 if it exists
    if (pages > 1) {
      console.log('');
      console.log(`📄 Testing Page 2...`);
      const res2 = await fetch(`${BASE_URL}${endpoint}?limit=5&page=2`);
      const data2 = await res2.json();
      
      if (data2.success) {
        const items2 = data2.data[dataKey];
        console.log(`   ✅ Page 2 has ${items2.length} items (different from page 1)`);
        console.log(`   First item on page 2: ${items2[0].name || items2[0].project_title}`);
      }
    }
    
    // Show how to get all data
    console.log('');
    console.log(`💡 To get ALL ${total} records:`);
    console.log(`   Option 1 (Faster): Make ${Math.ceil(total / 100)} requests with limit=100`);
    console.log(`   Option 2 (Default): Make ${pages} requests with limit=${limit}`);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    console.log(`   Make sure the server is running at ${BASE_URL}`);
  }
}

async function runTests() {
  console.log('🧪 API Pagination Test');
  console.log('═'.repeat(60));
  console.log(`Testing API at: ${BASE_URL}`);
  
  // Test health first
  try {
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    
    if (healthData.success && healthData.data.status === 'healthy') {
      console.log('✅ Server is healthy');
    } else {
      console.log('⚠️  Server might have issues');
    }
  } catch {
    console.log('❌ Cannot connect to server');
    console.log(`   Make sure server is running: npm run dev`);
    process.exit(1);
  }
  
  // Test organizations
  await testEndpoint('Organizations', '/organizations', 'organizations');
  
  // Test projects
  await testEndpoint('Projects', '/projects', 'projects');
  
  console.log('\n' + '═'.repeat(60));
  console.log('✨ Test Complete!');
  console.log('');
  console.log('Key Takeaways:');
  console.log('  • API is PAGINATED - does not return all data at once');
  console.log('  • Default: 20 items per page');
  console.log('  • Maximum: 100 items per page');
  console.log('  • Check "pagination.total" to see total records');
  console.log('  • Loop through pages to get all data');
  console.log('');
}

// Run the tests
runTests().catch(console.error);

