import { testUltimateHybridScraper } from './agents/ultimate-hybrid-scraper';

async function main() {
  console.log('🎯 Testing Ultimate Hybrid Scraper\n');
  console.log('This combines:');
  console.log('- Core sources: App Store ✅, Google Play, Google Reviews');
  console.log('- Extended sources: Reddit ✅, Twitter, ProductHunt, Trustpilot, Glassdoor, Indeed\n');
  
  await testUltimateHybridScraper();
}

main().catch(console.error);