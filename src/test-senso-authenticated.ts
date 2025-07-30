import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function testAuthenticatedEndpoints() {
  const apiKey = process.env.SENSOAI_API_KEY;
  const baseUrl = 'https://api.senso.ai';
  
  console.log('🔐 Testing Authenticated Senso.ai Endpoints\n');
  console.log('API Key:', apiKey?.substring(0, 15) + '...\n');
  
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  // Test endpoints that returned 401 (need auth)
  const endpoints = [
    {
      name: 'List Collections',
      method: 'GET',
      path: '/collections/'
    },
    {
      name: 'Create Collection',
      method: 'POST',
      path: '/collections/',
      data: {
        name: 'test-collection',
        description: 'Test collection for hackathon'
      }
    },
    {
      name: 'List Templates',
      method: 'GET',
      path: '/templates/'
    },
    {
      name: 'List Posts',
      method: 'GET',
      path: '/posts/'
    },
    {
      name: 'Create Post',
      method: 'POST',
      path: '/posts/',
      data: {
        content: 'Test post from hackathon',
        collection: 'default',
        metadata: {
          source: 'hackathon-test',
          timestamp: new Date().toISOString()
        }
      }
    },
    {
      name: 'Knowledge Base',
      method: 'POST',
      path: '/knowledge/',
      data: {
        query: 'test',
        context: 'hackathon testing'
      }
    },
    {
      name: 'Store Event',
      method: 'POST',
      path: '/events/',
      data: {
        event_type: 'test.event',
        data: {
          message: 'Testing Senso.ai integration',
          timestamp: new Date().toISOString()
        }
      }
    }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
      
      let response;
      if (endpoint.method === 'GET') {
        response = await axios.get(`${baseUrl}${endpoint.path}`, { headers });
      } else {
        response = await axios.post(`${baseUrl}${endpoint.path}`, endpoint.data, { headers });
      }
      
      console.log(`✅ Success! Status: ${response.status}`);
      
      // Pretty print response
      if (typeof response.data === 'object') {
        console.log('Response:', JSON.stringify(response.data, null, 2).substring(0, 500));
      } else {
        console.log('Response:', response.data.toString().substring(0, 200));
      }
      
      // If we successfully created something, try to retrieve it
      if (endpoint.method === 'POST' && response.data.id) {
        console.log(`\n📥 Retrieving created item...`);
        const getResponse = await axios.get(
          `${baseUrl}${endpoint.path}${response.data.id}/`,
          { headers }
        );
        console.log('Retrieved:', JSON.stringify(getResponse.data, null, 2).substring(0, 300));
      }
      
    } catch (error: any) {
      const status = error.response?.status;
      const data = error.response?.data;
      
      console.log(`❌ Failed: ${status} ${error.response?.statusText || error.message}`);
      if (data) {
        console.log('Error details:', JSON.stringify(data, null, 2).substring(0, 300));
      }
    }
  }
  
  // Try to understand the data model
  console.log('\n\n🔍 Exploring Data Model...\n');
  
  try {
    // First, try to get collections
    const collectionsResponse = await axios.get(`${baseUrl}/collections/`, { headers });
    console.log('📚 Collections available:', collectionsResponse.data);
    
    // If we have collections, try to use one
    if (collectionsResponse.data && collectionsResponse.data.length > 0) {
      const firstCollection = collectionsResponse.data[0];
      console.log(`\n📁 Using collection: ${firstCollection.name || firstCollection.id}`);
      
      // Try to post to this collection
      const postResponse = await axios.post(
        `${baseUrl}/posts/`,
        {
          collection_id: firstCollection.id,
          content: {
            type: 'startup_analysis',
            data: {
              startup: 'TestStartup',
              feedback: 'Great product!',
              source: 'hackathon'
            }
          },
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'coo-eir-assistant'
          }
        },
        { headers }
      );
      console.log('✅ Posted to collection:', postResponse.data);
    }
  } catch (error: any) {
    console.log('❌ Data model exploration failed:', error.response?.status, error.response?.data);
  }
}

testAuthenticatedEndpoints().catch(console.error);