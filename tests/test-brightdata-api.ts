import axios from 'axios';
import { config } from 'dotenv';

config();

async function testBrightDataAPI() {
  const apiKey = process.env.BRIGHT_DATA_API_KEY;
  const customerId = process.env.BRIGHT_DATA_CUSTOMER_ID;
  
  console.log('🔍 Testing Bright Data API Access\n');
  console.log(`Customer ID: ${customerId}`);
  console.log(`API Key: ${apiKey?.substring(0, 10)}...${apiKey?.substring(apiKey.length - 4)}\n`);

  // Test 1: Try different API endpoints
  const endpoints = [
    'https://api.brightdata.com/datasets/v3/list',
    'https://api.brightdata.com/datasets/v3/status',
    `https://api.brightdata.com/datasets/v3/trigger/${customerId}`,
    'https://api.brightdata.com/dca/collectors',
    `https://api.brightdata.com/dca/collectors/${customerId}`,
  ];

  for (const endpoint of endpoints) {
    console.log(`\nTesting: ${endpoint}`);
    try {
      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      });
      console.log('✅ Success:', response.status);
      console.log('Response:', JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
    } catch (error: any) {
      console.log('❌ Failed:', error.response?.status || error.message);
      if (error.response?.data) {
        console.log('Error:', error.response.data);
      }
    }
  }

  // Test 2: Try different collector names
  console.log('\n\n📋 Testing Different Collector Names:\n');
  
  const collectors = [
    // Standard collectors
    'google_play_reviews',
    'app_store_reviews',
    'google_maps_reviews',
    
    // Alternative names
    'google-play-reviews',
    'app-store-reviews',
    'google-maps-reviews',
    
    // Simplified names
    'google_play',
    'app_store',
    'google_maps',
    
    // Generic collectors
    'web_scraper',
    'universal_scraper',
    'custom_scraper',
    
    // Social media
    'twitter',
    'facebook',
    'instagram',
    'reddit',
    
    // E-commerce
    'amazon_reviews',
    'amazon',
    'shopify',
  ];

  for (const collector of collectors) {
    console.log(`\nTesting collector: ${collector}`);
    try {
      const response = await axios.post(
        'https://api.brightdata.com/datasets/v3/trigger',
        {
          customer_id: customerId,
          collector: collector,
          params: {
            url: 'https://www.google.com',
            limit: 1
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000
        }
      );
      console.log('✅ SUCCESS! This collector exists:', collector);
      console.log('Response:', response.data);
      break; // Stop if we find one that works
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('❌ Not found');
      } else {
        console.log('❌ Error:', error.response?.status || error.message);
      }
    }
  }

  // Test 3: Try Web Unblocker API (different product)
  console.log('\n\n🌐 Testing Web Unblocker API:\n');
  try {
    const response = await axios.get('https://www.google.com/search?q=test', {
      proxy: {
        host: 'brd.superproxy.io',
        port: 22225,
        auth: {
          username: `${customerId}-zone-unblocker`,
          password: apiKey || ''
        }
      },
      timeout: 10000
    });
    console.log('✅ Web Unblocker works!');
    console.log('Response length:', response.data.length);
  } catch (error: any) {
    console.log('❌ Web Unblocker failed:', error.message);
  }

  // Test 4: Try SERP API
  console.log('\n\n🔍 Testing SERP API:\n');
  try {
    const response = await axios.get('https://www.google.com/search', {
      params: {
        q: 'test query',
        num: 10
      },
      proxy: {
        host: 'brd.superproxy.io',
        port: 22225,
        auth: {
          username: `${customerId}-zone-serp`,
          password: apiKey || ''
        }
      },
      timeout: 10000
    });
    console.log('✅ SERP API works!');
    console.log('Response length:', response.data.length);
  } catch (error: any) {
    console.log('❌ SERP API failed:', error.message);
  }
}

// Run the test
testBrightDataAPI().catch(console.error);