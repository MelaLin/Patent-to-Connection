const { initializeDatabase } = require('./database');
const dbService = require('./databaseService');

async function testSupabaseIntegration() {
  console.log('🧪 Testing Supabase Integration...\n');
  
  try {
    // Initialize database
    console.log('1. Initializing database tables...');
    await initializeDatabase();
    console.log('✅ Database tables created successfully\n');
    
    // Test user operations
    console.log('2. Testing user operations...');
    const testEmail = 'test@example.com';
    const user = await dbService.getOrCreateUser(testEmail, 'Test User');
    console.log('✅ User created/found:', user.email, 'ID:', user.id);
    
    // Test thesis operations
    console.log('\n3. Testing thesis operations...');
    const thesis = await dbService.createThesis(user.id, 'Test Thesis', 'This is a test thesis content');
    console.log('✅ Thesis created:', thesis.title);
    
    const theses = await dbService.getTheses(user.id);
    console.log('✅ Theses fetched:', theses.length, 'theses');
    
    // Test patent operations
    console.log('\n4. Testing patent operations...');
    const patentData = {
      patent_id: 'US123456789',
      title: 'Test Patent',
      abstract: 'This is a test patent abstract',
      assignee: 'Test Corp',
      inventors: [
        { name: 'John Doe', linkedin_url: 'https://linkedin.com/in/johndoe' },
        { name: 'Jane Smith', linkedin_url: 'https://linkedin.com/in/janesmith' }
      ],
      link: 'https://example.com/patent',
      date_filed: '2023-01-01'
    };
    const patent = await dbService.createPatent(user.id, patentData);
    console.log('✅ Patent created:', patent.title);
    
    // Test watchlist operations
    console.log('\n5. Testing watchlist operations...');
    await dbService.addToWatchlist(user.id, 'patent', patentData.patent_id, patentData);
    await dbService.addToWatchlist(user.id, 'query', 'test query', { query: 'test query' });
    await dbService.addToWatchlist(user.id, 'inventor', 'John Doe', { linkedin_url: 'https://linkedin.com/in/johndoe' });
    
    const watchlistData = await dbService.getWatchlistData(user.id);
    console.log('✅ Watchlist data:', {
      patents: watchlistData.patents.length,
      queries: watchlistData.queries.length,
      inventors: watchlistData.inventors.length
    });
    
    
    console.log('\n🎉 All tests passed! Supabase integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testSupabaseIntegration().then(() => {
    console.log('\n✅ Integration test completed successfully');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Integration test failed:', error);
    process.exit(1);
  });
}

module.exports = testSupabaseIntegration;
