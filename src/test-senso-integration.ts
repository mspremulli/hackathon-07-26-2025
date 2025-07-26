import { testSensoIntegration } from './agents/senso-integrated-scraper';

async function main() {
  console.log('🚀 Testing Senso.ai Integration for COO/EIR Assistant\n');
  console.log('This will:');
  console.log('1. Scrape data from Bright Data sources');
  console.log('2. Store all data in Senso.ai Context OS');
  console.log('3. Create a business context window');
  console.log('4. Generate personalized COO/EIR recommendations\n');
  
  await testSensoIntegration();
}

main().catch(console.error);