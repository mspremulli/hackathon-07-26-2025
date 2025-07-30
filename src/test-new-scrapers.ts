import { RealDataScraper } from './agents/real-data-scraper';

async function main() {
  console.log('🚀 Testing new Web Unlocker scrapers for Glassdoor and Indeed\n');
  
  const scraper = new RealDataScraper();
  
  // Test connection first
  const isWorking = await scraper.testConnection();
  if (!isWorking) {
    console.log('\n⚠️  Web Unlocker is not working. Check your API key and zone name.');
    return;
  }
  
  // Test Glassdoor
  try {
    const reviews = await scraper.scrapeGlassdoorReviews('Meta');
    console.log(`Glassdoor: ${reviews.length} reviews found`);
    if (reviews.length > 0) {
      console.log('Sample review:', reviews[0].text.substring(0, 100) + '...');
    }
  } catch (error) {
    console.log('Glassdoor scraping failed');
  }
  
  // Test Indeed
  try {
    const reviews = await scraper.scrapeIndeedReviews('Meta');
    console.log(`Indeed: ${reviews.length} reviews found`);
    if (reviews.length > 0) {
      console.log('Sample review:', reviews[0].text.substring(0, 100) + '...');
    }
  } catch (error) {
    console.log('Indeed scraping failed');
  }
}

main().catch(console.error);