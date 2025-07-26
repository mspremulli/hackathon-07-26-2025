import { testBrightDataCollectors } from './agents/bright-data-collectors';

async function main() {
  console.log('🚀 Testing Bright Data Collectors approach\n');
  await testBrightDataCollectors();
}

main().catch(console.error);