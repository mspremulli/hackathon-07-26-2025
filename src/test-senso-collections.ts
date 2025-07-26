import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function testSensoCollections() {
  const apiKey = process.env.SENSOAI_API_KEY;
  console.log('🔍 Testing Senso.ai Collections API\n');
  console.log('API Key format: tgr_xxxx... (looks like a token grant)\n');
  
  // Based on the Django URL patterns, let's try to understand the API structure
  const baseUrl = 'https://api.senso.ai';
  
  // Try different authentication methods based on the token format
  const authMethods = [
    {
      name: 'Token Authentication (Django style)',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'API Key Header',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'TGR Token (custom format)',
      headers: {
        'Authorization': `TGR ${apiKey}`,
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'Direct API Key in Header',
      headers: {
        'API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    }
  ];

  // Test collections endpoint with different auth methods
  for (const auth of authMethods) {
    console.log(`\n🔐 Testing with ${auth.name}:`);
    
    try {
      const response = await axios.get(`${baseUrl}/collections/`, {
        headers: auth.headers,
        timeout: 5000
      });
      
      console.log(`✅ SUCCESS! Auth method works!`);
      console.log('Response:', JSON.stringify(response.data, null, 2).substring(0, 500));
      
      // If successful, try to create a collection
      console.log('\n📝 Attempting to create a collection...');
      const createResponse = await axios.post(
        `${baseUrl}/collections/`,
        {
          name: 'hackathon-test-collection',
          description: 'Test collection for COO/EIR Assistant',
          metadata: {
            created_by: 'hackathon',
            purpose: 'startup_feedback_storage'
          }
        },
        { headers: auth.headers }
      );
      
      console.log('✅ Collection created:', createResponse.data);
      
      // Now try to post data to the collection
      if (createResponse.data.id || createResponse.data.name) {
        const collectionId = createResponse.data.id || createResponse.data.name;
        console.log(`\n📤 Posting data to collection ${collectionId}...`);
        
        const postResponse = await axios.post(
          `${baseUrl}/posts/`,
          {
            collection: collectionId,
            content: {
              type: 'startup_feedback',
              startup: 'TestStartup',
              feedback: {
                app_store_rating: 4.5,
                review_sentiment: 'positive',
                key_issues: ['performance', 'UI'],
                source: 'hackathon-scraper'
              }
            },
            tags: ['feedback', 'app-store', 'hackathon'],
            metadata: {
              scraped_at: new Date().toISOString(),
              scraper_version: '1.0'
            }
          },
          { headers: auth.headers }
        );
        
        console.log('✅ Data posted:', postResponse.data);
      }
      
      break; // Found working auth method
      
    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.data?.error || error.response?.data?.detail || error.message;
      
      if (status === 401) {
        console.log(`❌ Authentication failed: ${message}`);
      } else if (status === 403) {
        console.log(`🚫 Forbidden: ${message}`);
      } else {
        console.log(`❌ Error ${status}: ${message}`);
      }
    }
  }
  
  // Also test if we need to login first
  console.log('\n\n🔐 Testing if login is required...');
  
  try {
    // Try to get a session token
    const loginResponse = await axios.post(
      `${baseUrl}/auth/login/`,
      {
        api_key: apiKey
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Login successful:', loginResponse.data);
    
    if (loginResponse.data.token) {
      // Use the session token
      const sessionHeaders = {
        'Authorization': `Bearer ${loginResponse.data.token}`,
        'Content-Type': 'application/json'
      };
      
      const collectionsResponse = await axios.get(`${baseUrl}/collections/`, {
        headers: sessionHeaders
      });
      
      console.log('✅ Collections with session token:', collectionsResponse.data);
    }
    
  } catch (error: any) {
    console.log('❌ Login attempt failed:', error.response?.status, error.response?.data);
  }
}

testSensoCollections().catch(console.error);