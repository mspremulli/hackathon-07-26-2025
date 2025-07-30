import { testExtendedScrapers } from './agents/extended-real-scrapers';

async function main() {
  console.log('🚀 Testing Extended Out-of-Box Scrapers\n');
  console.log('Testing: Reddit, Twitter, ProductHunt, Trustpilot, G2\n');
  
  await testExtendedScrapers();
}

main().catch(console.error);