import * as dotenv from 'dotenv';
dotenv.config();

import { getSensoClient } from './integrations/senso-client';

async function testRealSensoConnection() {
  console.log('🚀 Testing REAL Senso.ai API Connection\n');
  
  // Check if API key is loaded
  console.log('Environment check:');
  console.log('SENSOAI_API_KEY:', process.env.SENSOAI_API_KEY ? '✅ Found' : '❌ Not found');
  console.log('API Key preview:', process.env.SENSOAI_API_KEY?.substring(0, 15) + '...\n');
  
  const client = getSensoClient();
  
  // Test storing data
  try {
    const testData = {
      source: 'test-connection',
      type: 'api-verification',
      data: { 
        message: 'Testing Senso.ai API connection',
        timestamp: new Date().toISOString(),
        app: 'COO/EIR Assistant'
      },
      tags: ['test', 'api-check', 'hackathon']
    };
    
    console.log('📤 Attempting to store test data in Senso.ai...');
    const id = await client.storeContext(testData);
    console.log('📥 Response:', id);
    
    if (id.startsWith('local-')) {
      console.log('\n⚠️  Using local fallback storage');
      console.log('This means the API connection failed or returned an error');
    } else {
      console.log('\n✅ SUCCESS! Connected to Senso.ai API');
      console.log('Context stored with ID:', id);
      
      // Try to retrieve it
      console.log('\n📖 Attempting to retrieve the stored context...');
      const retrieved = await client.getContext(id);
      if (retrieved) {
        console.log('✅ Successfully retrieved:', JSON.stringify(retrieved, null, 2));
      }
    }
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
  
  // Test creating a context window
  console.log('\n📊 Testing context window creation...');
  try {
    const contextWindow = await client.createContextWindow({
      sources: ['test-connection'],
      types: ['api-verification'],
      maxTokens: 1000
    });
    console.log('Context window preview:', contextWindow.substring(0, 200) + '...');
  } catch (error: any) {
    console.error('Context window error:', error.message);
  }
}

testRealSensoConnection().catch(console.error);