import { config } from 'dotenv';
import { ExtendedFeedbackAgent } from '../src/agents/extended-feedback-agent';
import { AppReviewScraperAgent } from '../src/agents/review-scraper-agent';

// Load environment variables
config();

async function testExtendedSources() {
  console.log('🚀 Testing Extended Feedback Sources\n');
  console.log('=' .repeat(50) + '\n');
  
  const agent = new ExtendedFeedbackAgent();
  
  // Test each source individually to see which ones work
  console.log('Testing each Bright Data collector:\n');
  
  // 1. GitHub
  console.log('1️⃣ Testing GitHub Issues/PRs...');
  try {
    const github = await agent.scrapeGitHubFeedback('facebook', 'react');
    console.log(`   ✅ GitHub: Found ${github.length} items`);
    if (github[0]) {
      console.log(`   Sample: "${github[0].text.substring(0, 80)}..."`);
    }
  } catch (error) {
    console.log('   ❌ GitHub failed');
  }
  
  // 2. Discord
  console.log('\n2️⃣ Testing Discord...');
  try {
    const discord = await agent.scrapeDiscordFeedback('123456789', ['general', 'support']);
    console.log(`   ✅ Discord: Found ${discord.length} messages`);
  } catch (error) {
    console.log('   ❌ Discord failed');
  }
  
  // 3. YouTube
  console.log('\n3️⃣ Testing YouTube Comments...');
  try {
    const youtube = await agent.scrapeYouTubeComments(['dQw4w9WgXcQ']);
    console.log(`   ✅ YouTube: Found ${youtube.length} comments`);
  } catch (error) {
    console.log('   ❌ YouTube failed');
  }
  
  // 4. LinkedIn
  console.log('\n4️⃣ Testing LinkedIn Posts...');
  try {
    const linkedin = await agent.scrapeLinkedInMentions('OpenAI');
    console.log(`   ✅ LinkedIn: Found ${linkedin.length} mentions`);
  } catch (error) {
    console.log('   ❌ LinkedIn failed');
  }
  
  // 5. Stack Overflow
  console.log('\n5️⃣ Testing Stack Overflow...');
  try {
    const stackoverflow = await agent.scrapeStackOverflow(['javascript', 'react'], 'React');
    console.log(`   ✅ Stack Overflow: Found ${stackoverflow.length} questions`);
  } catch (error) {
    console.log('   ❌ Stack Overflow failed');
  }
  
  // 6. Hacker News
  console.log('\n6️⃣ Testing Hacker News...');
  try {
    const hackernews = await agent.scrapeHackerNews('ChatGPT');
    console.log(`   ✅ Hacker News: Found ${hackernews.length} discussions`);
  } catch (error) {
    console.log('   ❌ Hacker News failed');
  }
  
  // 7. Glassdoor
  console.log('\n7️⃣ Testing Glassdoor...');
  try {
    const glassdoor = await agent.scrapeGlassdoor('Google');
    console.log(`   ✅ Glassdoor: Found ${glassdoor.length} reviews`);
  } catch (error) {
    console.log('   ❌ Glassdoor failed');
  }
  
  // Test aggregated collection
  console.log('\n\n📊 Testing Aggregated Collection...\n');
  
  const config = {
    github: { owner: 'vercel', repo: 'next.js' },
    discord: { serverId: '12345', channelIds: ['general'] },
    youtube: { videoIds: ['abc123'] },
    linkedin: { companyName: 'Microsoft' },
    stackoverflow: { tags: ['python'], productName: 'Django' },
    hackernews: { query: 'AI startup' },
    glassdoor: { companyName: 'Meta' }
  };
  
  const results = await agent.scrapeAllExtendedSources(config);
  
  console.log('🎯 Extended Feedback Summary:');
  console.log('─'.repeat(50));
  console.log(`Total feedback items: ${results.insights.total_feedback_items}`);
  console.log(`Sources analyzed: ${results.insights.sources_analyzed.join(', ')}`);
  console.log(`Total engagement: ${results.insights.total_engagement}`);
  console.log('\nSentiment Distribution:');
  console.log(`  Positive: ${results.insights.sentiment_distribution.positive}`);
  console.log(`  Negative: ${results.insights.sentiment_distribution.negative}`);
  console.log(`  Neutral: ${results.insights.sentiment_distribution.neutral}`);
  
  console.log('\n🔥 Most Engaged Content:');
  results.insights.most_engaged_content.forEach((item: any, i: number) => {
    console.log(`  ${i + 1}. [${item.source}] ${item.text}`);
    console.log(`     Engagement: ${JSON.stringify(item.engagement)}`);
  });
  
  console.log('\n📈 Source Breakdown:');
  results.insights.source_breakdown.forEach((source: any) => {
    console.log(`  ${source.source}: ${source.count} items (${source.avg_sentiment})`);
  });
}

async function testCombinedAnalysis() {
  console.log('\n\n🔗 Testing Combined Analysis (App Reviews + Extended Sources)...\n');
  
  const reviewAgent = new AppReviewScraperAgent();
  const extendedAgent = new ExtendedFeedbackAgent();
  
  // Collect app reviews
  const appReviews = await reviewAgent.scrapeAllFeedbackSources({
    googlePlayAppId: 'com.company.app',
    appStoreAppId: '123456789',
    businessName: 'Your Company',
    location: 'San Francisco, CA'
  });
  
  // Collect extended feedback
  const extendedFeedback = await extendedAgent.scrapeAllExtendedSources({
    github: { owner: 'yourcompany', repo: 'product' },
    stackoverflow: { tags: ['yourproduct'], productName: 'YourProduct' },
    hackernews: { query: 'YourCompany' }
  });
  
  // Combined insights
  const totalFeedback = appReviews.all_reviews.length + extendedFeedback.all_feedback.length;
  const allSources = [
    ...appReviews.summary.platforms_scraped,
    ...extendedFeedback.insights.sources_analyzed
  ];
  
  console.log('🌟 Combined Feedback Analysis:');
  console.log('─'.repeat(50));
  console.log(`Total feedback collected: ${totalFeedback}`);
  console.log(`Sources: ${allSources.join(', ')}`);
  console.log(`\nApp Store Rating: ${appReviews.summary.overall_rating} ⭐`);
  console.log(`Extended Source Engagement: ${extendedFeedback.insights.total_engagement}`);
  
  console.log('\n💡 Key Insights Across All Channels:');
  // Combine insights from both sources
  const allInsights = [
    ...appReviews.summary.key_insights,
    `📊 ${extendedFeedback.insights.total_feedback_items} discussions found across developer/social channels`
  ];
  
  allInsights.forEach(insight => {
    console.log(`  • ${insight}`);
  });
}

// Main execution
async function main() {
  console.log('🔍 Bright Data Extended Feedback Scraper');
  console.log('Testing 7 Additional Data Sources');
  console.log('=====================================\n');
  
  if (!process.env.BRIGHT_DATA_API_KEY) {
    console.warn('⚠️  WARNING: BRIGHT_DATA_API_KEY not set');
    console.warn('   Will use mock data for all sources\n');
  }
  
  try {
    await testExtendedSources();
    await testCombinedAnalysis();
    
    console.log('\n\n✅ All tests completed!');
    console.log('Check the output/ directory for saved JSON files.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

main();