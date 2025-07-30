import { config } from 'dotenv';
import { AppReviewScraperAgent } from '../src/agents/review-scraper-agent';
import { SocialFeedbackAgent } from '../src/agents/social-feedback-agent';

// Load environment variables
config();

async function testReviewScraping() {
  console.log('🧪 Testing Bright Data Review Scraping...\n');
  
  const scraper = new AppReviewScraperAgent();
  
  // Test 1: Google Play Store
  console.log('1️⃣ Testing Google Play Store scraping...');
  const googlePlayResults = await scraper.scrapeGooglePlayReviews('com.example.app', 10);
  console.log(`   ✅ Found ${googlePlayResults.total_reviews} reviews`);
  console.log(`   ⭐ Average rating: ${googlePlayResults.average_rating}`);
  console.log(`   📝 Sample review: "${googlePlayResults.reviews[0]?.text.substring(0, 100)}..."`);
  
  // Test 2: App Store
  console.log('\n2️⃣ Testing App Store scraping...');
  const appStoreResults = await scraper.scrapeAppStoreReviews('123456789', 10);
  console.log(`   ✅ Found ${appStoreResults.total_reviews} reviews`);
  console.log(`   ⭐ Average rating: ${appStoreResults.average_rating}`);
  
  // Test 3: Review Analysis
  console.log('\n3️⃣ Testing review analysis...');
  const allReviews = [
    ...googlePlayResults.reviews,
    ...appStoreResults.reviews
  ];
  const analysis = scraper.analyzeReviews(allReviews);
  console.log('   📊 Sentiment breakdown:', analysis.sentiment_breakdown);
  console.log('   🔥 Top issues:');
  analysis.common_issues.slice(0, 3).forEach((issue, i) => {
    console.log(`      ${i + 1}. ${issue.issue} (${issue.count} mentions)`);
  });
  console.log('   💡 Recommendations:');
  analysis.recommendations.slice(0, 2).forEach((rec, i) => {
    console.log(`      ${i + 1}. [${rec.priority}] ${rec.action}`);
    console.log(`         Impact: ${rec.impact}`);
  });
}

async function testSocialFeedback() {
  console.log('\n\n🧪 Testing Social Media Feedback Scraping...\n');
  
  const socialAgent = new SocialFeedbackAgent();
  
  // Test Reddit mentions
  console.log('1️⃣ Testing Reddit scraping...');
  const redditMentions = await socialAgent.scrapeRedditMentions('YourProductName', ['startups', 'technology']);
  console.log(`   ✅ Found ${redditMentions.length} Reddit mentions`);
  if (redditMentions[0]) {
    console.log(`   🔝 Top mention: "${redditMentions[0].text.substring(0, 100)}..."`);
    console.log(`   📈 Engagement: ${redditMentions[0].engagement.upvotes} upvotes`);
  }
  
  // Test aggregated insights
  console.log('\n2️⃣ Testing aggregated social insights...');
  const aggregated = await socialAgent.aggregateSocialFeedback({
    productName: 'YourProductName',
    redditSubreddits: ['startups'],
    twitterHashtags: ['startup', 'app']
  });
  
  console.log(`   📊 Total mentions: ${aggregated.mentions.length}`);
  console.log(`   💭 Platform breakdown:`, aggregated.insights.platform_breakdown);
  console.log(`   🔥 Viral content found: ${aggregated.viral_content.length} posts`);
}

async function testFullDemo() {
  console.log('\n\n🎯 Running Full Demo Scenario...\n');
  
  const scraper = new AppReviewScraperAgent();
  const socialAgent = new SocialFeedbackAgent();
  
  // Simulate real product analysis
  const config = {
    googlePlayAppId: 'com.yourcompany.app',
    appStoreAppId: '123456789',
    businessName: 'Your Company',
    location: 'San Francisco, CA'
  };
  
  console.log('📱 Analyzing app reviews across all platforms...');
  const results = await scraper.scrapeAllFeedbackSources(config);
  
  console.log('\n🎉 Executive Summary:');
  console.log('─'.repeat(50));
  console.log(`Total reviews analyzed: ${results.summary.total_reviews_analyzed}`);
  console.log(`Overall rating: ${results.summary.overall_rating} ⭐`);
  console.log(`Platforms: ${results.summary.platforms_scraped.join(', ')}`);
  
  console.log('\n💡 Key Insights:');
  results.summary.key_insights.forEach((insight: string) => {
    console.log(`   ${insight}`);
  });
  
  console.log('\n🚀 Recommended Actions:');
  results.summary.recommended_actions.forEach((action: any, i: number) => {
    console.log(`   ${i + 1}. [${action.priority.toUpperCase()}] ${action.action}`);
    console.log(`      Expected Impact: ${action.impact}`);
  });
  
  // Social media insights
  console.log('\n📣 Social Media Buzz:');
  const social = await socialAgent.aggregateSocialFeedback({
    productName: 'YourApp',
    redditSubreddits: ['startups'],
    twitterHashtags: ['yourapp']
  });
  
  console.log(`   Mentions found: ${social.mentions.length}`);
  if (social.viral_content.length > 0) {
    console.log(`   🔥 Viral post: "${social.viral_content[0].text}"`);
  }
  
  console.log('\n✨ Demo Complete! Ready for hackathon presentation.');
}

// Main execution
async function main() {
  console.log('🚀 Bright Data Review Scraper - Test Suite');
  console.log('=========================================\n');
  
  // Check for API credentials
  if (!process.env.BRIGHT_DATA_API_KEY) {
    console.warn('⚠️  WARNING: BRIGHT_DATA_API_KEY not set in .env');
    console.warn('   Using mock data for demo...\n');
  }
  
  try {
    // Run tests based on command line argument
    const testType = process.argv[2] || 'all';
    
    switch (testType) {
      case 'reviews':
        await testReviewScraping();
        break;
      case 'social':
        await testSocialFeedback();
        break;
      case 'demo':
        await testFullDemo();
        break;
      default:
        await testReviewScraping();
        await testSocialFeedback();
        await testFullDemo();
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Add to package.json scripts:
// "test:scraper": "ts-node test-scraper.ts",
// "test:reviews": "ts-node test-scraper.ts reviews",
// "test:social": "ts-node test-scraper.ts social",
// "test:demo": "ts-node test-scraper.ts demo"

main();