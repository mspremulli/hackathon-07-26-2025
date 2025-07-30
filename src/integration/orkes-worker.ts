/**
 * Integration point for Engineer 1's Orkes orchestration
 * This worker will be called by the Orkes workflow
 */

import { createReviewAnalysisWorker } from '../agents/review-scraper-agent';
import { SocialFeedbackAgent } from '../agents/social-feedback-agent';

export interface ReviewAnalysisTask {
  inputData: {
    appIds: {
      googlePlayAppId?: string;
      appStoreAppId?: string;
      businessName?: string;
      location?: string;
    };
    analysisType: 'quick' | 'comprehensive';
    includeSocial?: boolean;
  };
}

export interface ReviewAnalysisResult {
  status: 'COMPLETED' | 'FAILED';
  outputData: {
    source: string;
    timestamp: string;
    data: any;
    topInsight: string;
    confidence: number;
    recommendations?: any[];
  };
}

/**
 * Main worker function that Orkes will call
 */
export async function reviewAnalysisWorker(task: ReviewAnalysisTask): Promise<ReviewAnalysisResult> {
  const worker = await createReviewAnalysisWorker();
  return worker.execute(task);
}

/**
 * Enhanced worker with social media analysis
 */
export async function comprehensiveReviewWorker(task: ReviewAnalysisTask): Promise<ReviewAnalysisResult> {
  try {
    // Get app reviews
    const reviewWorker = await createReviewAnalysisWorker();
    const reviewResults = await reviewWorker.execute(task);
    
    // If social analysis is requested
    if (task.inputData.includeSocial) {
      const socialAgent = new SocialFeedbackAgent();
      const socialData = await socialAgent.aggregateSocialFeedback({
        productName: task.inputData.appIds.businessName || 'Product',
        redditSubreddits: ['startups', 'technology'],
        twitterHashtags: ['startup', 'app']
      });
      
      // Merge insights
      const mergedInsights = {
        ...reviewResults.outputData,
        social_insights: {
          mentions: socialData.mentions.length,
          sentiment_trend: socialData.sentiment_trend,
          viral_content: socialData.viral_content
        }
      };
      
      return {
        status: 'COMPLETED',
        outputData: mergedInsights
      };
    }
    
    return reviewResults;
    
  } catch (error: any) {
    return {
      status: 'FAILED',
      outputData: {
        source: 'brightdata_reviews',
        timestamp: new Date().toISOString(),
        data: { error: error.message },
        topInsight: 'Analysis failed',
        confidence: 0
      }
    };
  }
}

/**
 * Format data for Engineer 3's dashboard
 */
export function formatForDashboard(analysisResult: ReviewAnalysisResult): any {
  if (analysisResult.status === 'FAILED') {
    return {
      type: 'error',
      message: 'Review analysis failed',
      details: analysisResult.outputData.data.error
    };
  }
  
  const data = analysisResult.outputData.data;
  
  return {
    type: 'new_insight',
    insight: {
      id: `review_${Date.now()}`,
      title: 'Customer Feedback Analysis',
      discovery: data.detailed_analysis?.common_issues[0] 
        ? `Users report "${data.detailed_analysis.common_issues[0].issue}" (${data.detailed_analysis.common_issues[0].count} mentions)`
        : 'Multiple feedback patterns detected',
      recommendation: data.detailed_analysis?.recommendations[0]?.action || 'Review detailed analysis',
      impact: data.detailed_analysis?.recommendations[0]?.impact || 'Improve customer satisfaction',
      confidence: analysisResult.outputData.confidence,
      source: 'app_reviews',
      timestamp: analysisResult.outputData.timestamp,
      details: {
        total_reviews: data.total_reviews_analyzed,
        platforms: data.platforms_scraped,
        sentiment: data.sentiment,
        top_issues: data.detailed_analysis?.common_issues.slice(0, 3)
      }
    }
  };
}

// Example usage for testing integration
if (require.main === module) {
  async function testIntegration() {
    console.log('Testing Orkes integration...');
    
    const testTask: ReviewAnalysisTask = {
      inputData: {
        appIds: {
          googlePlayAppId: 'com.example.app',
          appStoreAppId: '123456789'
        },
        analysisType: 'comprehensive',
        includeSocial: true
      }
    };
    
    const result = await comprehensiveReviewWorker(testTask);
    console.log('Worker result:', result);
    
    const dashboardData = formatForDashboard(result);
    console.log('Dashboard format:', JSON.stringify(dashboardData, null, 2));
  }
  
  testIntegration();
}