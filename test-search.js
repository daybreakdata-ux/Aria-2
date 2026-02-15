// Test script for LangSearch API
import { searchWeb } from './lib/searxng.js';

async function testSearch() {
  console.log('Testing LangSearch API...\n');
  
  try {
    const result = await searchWeb('Lafayette Indiana reviews', { maxResults: 3 });
    
    console.log('✅ Search successful!');
    console.log(`Query: ${result.query}`);
    console.log(`Instance: ${result.instance}`);
    console.log(`Results: ${result.stats.totalResults}`);
    console.log(`Time: ${result.stats.searchTime}ms\n`);
    
    console.log('Search Results:');
    result.results.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.title}`);
      console.log(`   URL: ${item.url}`);
      console.log(`   Content: ${item.content.substring(0, 100)}...`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Search failed:', error.message);
    process.exit(1);
  }
}

testSearch();
