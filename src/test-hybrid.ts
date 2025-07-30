import { HybridScraperAgent } from './agents/hybrid-scraper-agent';

async function main() {
  console.log('🚀 Testing Hybrid Scraper (Real + Mock Data)\n');
  
  const agent = new HybridScraperAgent();
  
  const config = {
    googlePlayAppId: 'com.whatsapp',
    appStoreAppId: '310633997',  // WhatsApp
    businessName: 'OpenAI',
    location: 'San Francisco'
  };
  
  const results = await agent.scrapeWithRealDataFirst(config);
  
  console.log('\n✅ Test completed! Check the output folder for detailed results.');
}

main().catch(console.error);