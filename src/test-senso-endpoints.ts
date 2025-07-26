import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function testSensoEndpoints() {
  const apiKey = process.env.SENSOAI_API_KEY;
  const baseUrl = 'https://api.senso.ai';
  
  console.log('🔍 Testing Senso.ai Endpoints\n');
  
  // Endpoints from the Django error page
  const endpoints = [
    { path: '/', method: 'GET', name: 'Healthcheck' },
    { path: '/noodle/', method: 'GET', name: 'Noodle' },
    { path: '/knowledge/', method: 'GET', name: 'Knowledge' },
    { path: '/collections/', method: 'GET', name: 'Collections' },
    { path: '/templates/', method: 'GET', name: 'Templates' },
    { path: '/analytics/', method: 'GET', name: 'Analytics' },
    { path: '/sdk/', method: 'GET', name: 'SDK' },
    { path: '/posts/', method: 'GET', name: 'Posts' },
    { path: '/events/', method: 'GET', name: 'Events' },
    { path: '/agents/', method: 'GET', name: 'Agents' },
    { path: '/knowledge/', method: 'POST', name: 'Knowledge POST', 
      data: { content: 'test', type: 'test' } },
    { path: '/events/', method: 'POST', name: 'Events POST',
      data: { event: 'test', data: { test: true } } },
    { path: '/noodle/', method: 'POST', name: 'Noodle POST',
      data: { prompt: 'test', context: 'testing' } }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testing ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
      
      const config: any = {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      };

      let response;
      if (endpoint.method === 'GET') {
        response = await axios.get(`${baseUrl}${endpoint.path}`, config);
      } else {
        response = await axios.post(`${baseUrl}${endpoint.path}`, endpoint.data, config);
      }
      
      console.log(`✅ Success! Status: ${response.status}`);
      console.log('Response preview:', JSON.stringify(response.data).substring(0, 200));
      
    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.statusText || error.message;
      
      if (status === 401) {
        console.log(`🔒 ${endpoint.name}: Authentication required`);
      } else if (status === 403) {
        console.log(`🚫 ${endpoint.name}: Forbidden (might need different permissions)`);
      } else if (status === 404) {
        console.log(`❌ ${endpoint.name}: Not found`);
      } else if (status === 405) {
        console.log(`⚠️  ${endpoint.name}: Method not allowed (endpoint exists!)`);
      } else if (status && status < 500) {
        console.log(`⚠️  ${endpoint.name}: Client error ${status} - ${message}`);
      } else {
        console.log(`❓ ${endpoint.name}: ${status || 'Network'} error - ${message}`);
      }
    }
  }
  
  console.log('\n\n🔍 Testing with different auth formats...\n');
  
  // Try different auth formats
  const authFormats = [
    { name: 'Bearer Token', header: `Bearer ${apiKey}` },
    { name: 'API Key', header: apiKey },
    { name: 'Token', header: `Token ${apiKey}` },
    { name: 'X-API-Key header', useXApiKey: true }
  ];
  
  for (const auth of authFormats) {
    try {
      console.log(`\n🔐 Trying ${auth.name}...`);
      
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      if (auth.useXApiKey) {
        headers['X-API-Key'] = apiKey;
      } else {
        headers['Authorization'] = auth.header;
      }
      
      const response = await axios.get(`${baseUrl}/`, { headers, timeout: 5000 });
      console.log(`✅ ${auth.name} worked! Status: ${response.status}`);
      break;
      
    } catch (error: any) {
      console.log(`❌ ${auth.name} failed: ${error.response?.status || error.message}`);
    }
  }
}

testSensoEndpoints().catch(console.error);