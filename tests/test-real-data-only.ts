import axios from 'axios';
import { config } from 'dotenv';

config();

async function testRealDataOnly() {
  const apiKey = process.env.BRIGHT_DATA_API_KEY;
  const customerId = process.env.BRIGHT_DATA_CUSTOMER_ID;
  
  console.log('🔍 Testing Bright Data with REAL DATA ONLY (no mock fallback)\n');
  console.log(`Customer ID: ${customerId}`);
  console.log(`New API Key: ${apiKey?.substring(0, 10)}...${apiKey?.substring(apiKey.length - 4)}\n`);

  // Test 1: Try Data Collector API format
  console.log('1️⃣ Testing Data Collector API format:\n');
  
  try {
    const response = await axios.post(
      'https://api.brightdata.com/dca/trigger_immediate',
      {
        collector: customerId + '_google_play',
        queue_next: 1
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      }
    );
    console.log('✅ SUCCESS with DCA format!');
    console.log('Response:', response.data);
  } catch (error: any) {
    console.log('❌ DCA format failed:', error.response?.status);
    if (error.response?.data) {
      console.log('Error details:', error.response.data);
    }
  }

  // Test 2: Try Web Scraper API format
  console.log('\n2️⃣ Testing Web Scraper API format:\n');
  
  try {
    const response = await axios.post(
      `https://api.brightdata.com/datasets/trigger`,
      {
        dataset_id: 'gd_l7q7dkf244hwjntr0',  // Example dataset ID
        url: 'https://play.google.com/store/apps/details?id=com.example.app',
        format: 'json'
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      }
    );
    console.log('✅ SUCCESS with Web Scraper format!');
    console.log('Response:', response.data);
  } catch (error: any) {
    console.log('❌ Web Scraper format failed:', error.response?.status);
    if (error.response?.data) {
      console.log('Error details:', error.response.data);
    }
  }

  // Test 3: Try different authentication methods
  console.log('\n3️⃣ Testing different auth methods:\n');

  // Basic auth
  try {
    const response = await axios.post(
      'https://api.brightdata.com/datasets/v3/trigger',
      {
        collector: 'google_play_reviews',
        params: { app_id: 'com.example.app' }
      },
      {
        auth: {
          username: customerId,
          password: apiKey || ''
        }
      }
    );
    console.log('✅ SUCCESS with Basic Auth!');
    console.log('Response:', response.data);
  } catch (error: any) {
    console.log('❌ Basic Auth failed:', error.response?.status);
  }

  // Test 4: Try Bright Data's Scraping Browser API
  console.log('\n4️⃣ Testing Scraping Browser API:\n');
  
  try {
    const response = await axios.post(
      'https://brightdata.com/api/v1/browser/start',
      {
        zone: 'scraping_browser',
        country: 'us'
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      }
    );
    console.log('✅ SUCCESS with Scraping Browser!');
    console.log('Response:', response.data);
  } catch (error: any) {
    console.log('❌ Scraping Browser failed:', error.response?.status);
  }

  // Test 5: List available datasets/collectors
  console.log('\n5️⃣ Trying to list available datasets:\n');
  
  const listEndpoints = [
    'https://api.brightdata.com/datasets',
    'https://api.brightdata.com/dca/get_collectors',
    `https://api.brightdata.com/customer/${customerId}/datasets`,
    'https://api.brightdata.com/api/trigger_lists'
  ];

  for (const endpoint of listEndpoints) {
    try {
      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        }
      });
      console.log(`✅ SUCCESS at ${endpoint}`);
      console.log('Available:', JSON.stringify(response.data, null, 2).substring(0, 500));
      break;
    } catch (error: any) {
      console.log(`❌ ${endpoint}: ${error.response?.status || error.message}`);
    }
  }

  // Test 6: Try Google Play specific endpoint
  console.log('\n6️⃣ Testing Google Play specific endpoint:\n');
  
  try {
    const response = await axios.get(
      'https://play.google.com/store/apps/details?id=com.whatsapp&hl=en&gl=US',
      {
        proxy: {
          host: 'brd.superproxy.io',
          port: 22225,
          auth: {
            username: customerId,
            password: apiKey || ''
          }
        },
        headers: {
          'X-BRD-Client': 'hackathon-test'
        }
      }
    );
    console.log('✅ SUCCESS with proxy approach!');
    console.log('Response length:', response.data.length);
    
    // Extract some review data if present
    const reviewMatch = response.data.match(/"review".*?"text":"([^"]+)"/);
    if (reviewMatch) {
      console.log('Found review:', reviewMatch[1]);
    }
  } catch (error: any) {
    console.log('❌ Proxy approach failed:', error.message);
  }
}

testRealDataOnly().catch(console.error);