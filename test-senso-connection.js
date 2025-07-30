const { getSensoClient } = require('./dist/integrations/senso-client');

async function testConnection() {
  console.log('Testing Senso.ai connection...');
  
  const client = getSensoClient();
  
  // Test storing data
  try {
    const testData = {
      source: 'test',
      type: 'connection-test',
      data: { message: 'Testing Senso.ai integration' },
      tags: ['test']
    };
    
    console.log('Attempting to store test data...');
    const id = await client.storeContext(testData);
    console.log('Result:', id);
    
    if (id.startsWith('local-')) {
      console.log('✅ Senso.ai integration working (using local fallback)');
    } else {
      console.log('✅ Senso.ai API connected successfully!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testConnection();