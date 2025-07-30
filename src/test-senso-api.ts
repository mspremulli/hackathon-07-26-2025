import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function exploreSensoAPI() {
  const apiKey = process.env.SENSOAI_API_KEY;
  console.log('🔍 Exploring Senso.ai API Structure\n');
  console.log('API Key:', apiKey?.substring(0, 15) + '...\n');

  // Try different possible endpoints
  const baseUrls = [
    'https://api.senso.ai',
    'https://api.senso.ai/v1',
    'https://senso.ai/api',
    'https://senso.ai/api/v1'
  ];

  const endpoints = [
    '/contexts',
    '/context',
    '/store',
    '/data',
    '/memory',
    '/agent/context',
    '/agent/store'
  ];

  for (const baseUrl of baseUrls) {
    console.log(`\nTrying base URL: ${baseUrl}`);
    
    // Try a simple GET to root
    try {
      const response = await axios.get(baseUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 5000
      });
      console.log(`✅ Root endpoint responded: ${response.status}`);
      console.log('Response:', JSON.stringify(response.data).substring(0, 100));
    } catch (error: any) {
      console.log(`❌ Root failed: ${error.response?.status || error.code}`);
    }

    // Try each endpoint
    for (const endpoint of endpoints) {
      try {
        const response = await axios.post(
          `${baseUrl}${endpoint}`,
          {
            test: true,
            message: 'API discovery'
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          }
        );
        console.log(`✅ ${endpoint} responded: ${response.status}`);
        break; // Found a working endpoint
      } catch (error: any) {
        const status = error.response?.status || error.code;
        if (status !== 404) {
          console.log(`⚠️  ${endpoint}: ${status} (not 404, might be valid)`);
        }
      }
    }
  }

  // Also try without /v1
  console.log('\n🔍 Trying simpler structure...');
  try {
    const response = await axios.post(
      'https://api.senso.ai/store',
      {
        data: { test: 'Hello Senso.ai' },
        type: 'test'
      },
      {
        headers: {
          'Authorization': apiKey, // Try without Bearer
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Simple store worked!', response.data);
  } catch (error: any) {
    console.log('Simple store failed:', error.response?.status);
  }
}

exploreSensoAPI().catch(console.error);