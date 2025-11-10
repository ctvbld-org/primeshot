require('dotenv').config({ path: '.env.local' });
const { Client } = require('@notionhq/client');

const token = process.env.NOTION_TOKEN;
const databaseId = process.env.NOTION_BLOG_DATABASE_ID;

console.log('🔍 Testing Notion Connection...\n');
console.log('Token:', token ? `${token.substring(0, 15)}... (${token.length} chars)` : '❌ NOT SET');
console.log('Database ID:', databaseId || '❌ NOT SET');
console.log('');

if (!token || !databaseId) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const notion = new Client({ auth: token });

(async () => {
  try {
    console.log('📡 Querying database...');
    
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 3,
    });
    
    console.log('✅ SUCCESS!\n');
    console.log(`Found ${response.results.length} page(s)`);
    
    if (response.results.length > 0) {
      console.log('\nFirst page:');
      const page = response.results[0];
      console.log('- ID:', page.id);
      console.log('- Properties:', Object.keys(page.properties).join(', '));
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.code) console.error('Code:', error.code);
    if (error.status) console.error('Status:', error.status);
    process.exit(1);
  }
})();


