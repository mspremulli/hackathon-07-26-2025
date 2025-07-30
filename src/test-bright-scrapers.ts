import { testBrightDataScrapers } from './agents/bright-data-scrapers';

async function main() {
  console.log('🚀 Testing Bright Data pre-built scrapers\n');
  
  // Make sure we have API key
  if (!process.env.BRIGHT_DATA_API_KEY) {
    console.log('⚠️  Setting API key from previous configuration...');
    process.env.BRIGHT_DATA_API_KEY = 'brd_V9WnAYdEz5m6BPG8lS8eJxaYFiRJKelE';
    process.env.BRIGHT_DATA_CUSTOMER_ID = 'hl_de59c417';
  }
  
  await testBrightDataScrapers();
}

main().catch(console.error);