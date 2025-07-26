import axios from 'axios';
import { config } from 'dotenv';

config();

async function testBrightDataControlAPI() {
  const apiKey = process.env.BRIGHT_DATA_API_KEY;
  const customerId = process.env.BRIGHT_DATA_CUSTOMER_ID;
  
  console.log('🔍 Testing Bright Data Control Panel API\n');

  // Test 1: Account info
  console.log('1️⃣ Testing account/customer info:\n');
  
  const accountEndpoints = [
    'https://luminati.io/api/customer',
    'https://brightdata.com/api/customer',
    `https://luminati.io/api/customer/${customerId}`,
    'https://luminati-china.io/api/customer',
    'https://api.brightdata.com/customer'
  ];

  for (const endpoint of accountEndpoints) {
    try {
      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 5000
      });
      console.log(`✅ SUCCESS at ${endpoint}`);
      console.log('Response:', JSON.stringify(response.data, null, 2).substring(0, 300));
      break;
    } catch (error: any) {
      console.log(`❌ ${endpoint}: ${error.response?.status || error.code}`);
    }
  }

  // Test 2: Check zones/products
  console.log('\n2️⃣ Testing zones/products:\n');
  
  try {
    const response = await axios.get(
      `https://luminati.io/api/zone?customer=${customerId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        }
      }
    );
    console.log('✅ Found zones/products:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.log('❌ Zones failed:', error.response?.status);
  }

  // Test 3: Try Data Collector with correct format
  console.log('\n3️⃣ Testing Data Collector with documentation format:\n');
  
  try {
    // According to docs, DC API uses different endpoint
    const response = await axios.post(
      'https://api.datacollector.com/v1/datasets/trigger',
      {
        token: apiKey,
        dataset: 'google_play_reviews',
        params: {
          app_id: 'com.whatsapp'
        }
      }
    );
    console.log('✅ Data Collector SUCCESS!');
    console.log('Response:', response.data);
  } catch (error: any) {
    console.log('❌ Data Collector failed:', error.response?.status || error.code);
  }

  // Test 4: Test with cURL equivalent
  console.log('\n4️⃣ Testing with exact cURL equivalent:\n');
  
  try {
    const response = await axios({
      method: 'POST',
      url: 'https://api.brightdata.com/dca/trigger',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      data: {
        collector: `${customerId}_google_play`,
        input: {
          url: 'https://play.google.com/store/apps/details?id=com.whatsapp'
        }
      }
    });
    console.log('✅ cURL format SUCCESS!');
    console.log('Response:', response.data);
  } catch (error: any) {
    console.log('❌ cURL format failed:', error.response?.status);
    if (error.response?.headers) {
      console.log('Response headers:', error.response.headers);
    }
  }

  // Test 5: Check API key format
  console.log('\n5️⃣ API Key validation:\n');
  console.log('API Key length:', apiKey?.length);
  console.log('API Key format:', apiKey?.match(/^[a-f0-9-]{36}$/) ? '✅ Valid UUID' : '❌ Invalid format');
  console.log('Customer ID format:', customerId?.match(/^hl_[a-z0-9]+$/) ? '✅ Valid' : '❌ Invalid');

  // Test 6: Try with API token in different positions
  console.log('\n6️⃣ Testing different API key positions:\n');
  
  // As query parameter
  try {
    const response = await axios.post(
      `https://api.brightdata.com/dca/trigger?token=${apiKey}`,
      {
        collector: 'google_play_reviews',
        params: { app_id: 'com.whatsapp' }
      }
    );
    console.log('✅ Query param SUCCESS!');
  } catch (error: any) {
    console.log('❌ Query param failed:', error.response?.status);
  }

  // As X-API-Key header
  try {
    const response = await axios.post(
      'https://api.brightdata.com/dca/trigger',
      {
        collector: 'google_play_reviews',
        params: { app_id: 'com.whatsapp' }
      },
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ X-API-Key SUCCESS!');
  } catch (error: any) {
    console.log('❌ X-API-Key failed:', error.response?.status);
  }
}

testBrightDataControlAPI().catch(console.error);