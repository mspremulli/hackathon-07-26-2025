import axios from 'axios';
import { config } from 'dotenv';

config();

async function testWebUnlocker() {
  const apiKey = process.env.BRIGHT_DATA_API_KEY;
  const customerId = process.env.BRIGHT_DATA_CUSTOMER_ID;
  
  console.log('🔍 Testing Bright Data Web Unlocker API\n');

  // Test 1: Web Unlocker API with proper format
  console.log('1️⃣ Testing Web Unlocker for Google Play:\n');
  
  try {
    const response = await axios.post(
      'https://api.brightdata.com/request',
      {
        zone: 'web_unlocker',  // Try different zone names
        url: 'https://play.google.com/store/apps/details?id=com.whatsapp',
        format: 'raw'
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Web Unlocker SUCCESS!');
    console.log('Response length:', response.data.length);
    
    // Extract reviews if present
    const reviews = response.data.match(/data-review-id="([^"]+)"[^>]*>([^<]+)</g);
    if (reviews) {
      console.log('Found reviews:', reviews.length);
    }
  } catch (error: any) {
    console.log('❌ Web Unlocker failed:', error.response?.status);
    if (error.response?.data) {
      console.log('Error:', error.response.data);
    }
  }

  // Test 2: Try with customer-specific zone
  console.log('\n2️⃣ Testing with customer-specific zone:\n');
  
  const zones = [
    `${customerId}_web_unlocker`,
    `${customerId}-web_unlocker`,
    'web_unlocker',
    'unlocker',
    'scraper'
  ];

  for (const zone of zones) {
    try {
      const response = await axios.post(
        'https://api.brightdata.com/request',
        {
          zone: zone,
          url: 'https://www.google.com/search?q=test',
          format: 'json'
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      console.log(`✅ SUCCESS with zone: ${zone}`);
      console.log('Response preview:', JSON.stringify(response.data).substring(0, 200));
      break;
    } catch (error: any) {
      console.log(`❌ Zone ${zone}: ${error.response?.status || error.code}`);
    }
  }

  // Test 3: SERP API
  console.log('\n3️⃣ Testing SERP API:\n');
  
  try {
    const response = await axios.post(
      'https://api.brightdata.com/serp/req',
      {
        zone: 'serp',
        query: {
          q: 'WhatsApp reviews',
          num: 10
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ SERP API SUCCESS!');
    console.log('Results:', response.data.organic_results?.length || 0);
  } catch (error: any) {
    console.log('❌ SERP API failed:', error.response?.status);
  }

  // Test 4: Check account status first
  console.log('\n4️⃣ Checking account status:\n');
  
  try {
    const response = await axios.get(
      'https://api.brightdata.com/status',
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    console.log('✅ Account status:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.log('❌ Status check failed:', error.response?.status);
    if (error.response?.status === 401) {
      console.log('\n⚠️  API Key might not be valid or not activated for API access');
      console.log('Please check:');
      console.log('1. The API key is from a Web Unlocker or SERP API zone');
      console.log('2. The zone is active and has available bandwidth');
      console.log('3. The API key was copied correctly');
    }
  }

  // Test 5: Direct scraping with structured data
  console.log('\n5️⃣ Testing structured data extraction:\n');
  
  try {
    const response = await axios.post(
      'https://api.brightdata.com/request',
      {
        zone: 'web_unlocker',
        url: 'https://apps.apple.com/us/app/whatsapp-messenger/id310633997',
        format: 'json',
        js_render: true,
        extract_rules: {
          reviews: {
            selector: '[class*="review"]',
            type: 'list',
            output: {
              text: { selector: '[class*="content"]', type: 'text' },
              rating: { selector: '[class*="rating"]', type: 'attribute', attribute: 'aria-label' },
              author: { selector: '[class*="author"]', type: 'text' }
            }
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Structured extraction SUCCESS!');
    console.log('Extracted data:', response.data);
  } catch (error: any) {
    console.log('❌ Structured extraction failed:', error.response?.status);
  }
}

testWebUnlocker().catch(console.error);