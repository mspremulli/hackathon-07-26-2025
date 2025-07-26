import * as dotenv from 'dotenv';
dotenv.config();

import { getSensoClientV2 } from './integrations/senso-client-v2';

async function testSensoV2() {
  console.log('🚀 Testing Senso.ai V2 (Based on Working Implementation)\n');
  
  const client = getSensoClientV2();
  
  // Test data from our scrapers
  const testData = {
    startup_name: 'WhatsApp',
    analysis_date: new Date().toISOString(),
    data_sources: {
      app_store: {
        total_reviews: 3,
        average_rating: 2.33,
        sentiment: 'mixed'
      },
      reddit: {
        total_posts: 25,
        engagement: 'high',
        key_topics: ['privacy', 'features', 'performance']
      }
    },
    social_metrics: {
      total_posts: 28,
      platforms: {
        app_store: {
          post_count: 3,
          average_rating: 2.33
        },
        reddit: {
          post_count: 25,
          average_karma: 500
        }
      }
    },
    key_feedback: [
      "Privacy concerns about data collection",
      "App performance issues reported",
      "Feature requests for better UI",
      "Positive feedback on family connectivity"
    ]
  };
  
  try {
    console.log('📤 Sending data to Senso.ai for summarization...\n');
    
    const summary = await client.summarize(testData);
    
    console.log('✅ SUCCESS! Senso.ai Response:\n');
    console.log('Summary:', summary.summary || summary.text);
    
    if (summary.insights && summary.insights.length > 0) {
      console.log('\nKey Insights:');
      summary.insights.forEach((insight, i) => {
        console.log(`${i + 1}. ${insight}`);
      });
    }
    
    if (summary.recommendations && summary.recommendations.length > 0) {
      console.log('\nRecommendations:');
      summary.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }
    
    console.log('\n🎉 Senso.ai integration is working correctly!');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testSensoV2().catch(console.error);