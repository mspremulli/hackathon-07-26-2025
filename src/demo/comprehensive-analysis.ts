/**
 * Comprehensive Customer Feedback Analysis
 * Demonstrates all feedback sources working together
 */

import { AppReviewScraperAgent } from '../agents/review-scraper-agent';
import { SocialFeedbackAgent } from '../agents/social-feedback-agent';

interface ComprehensiveInsight {
  type: 'critical' | 'warning' | 'opportunity';
  title: string;
  description: string;
  evidence: {
    source: string;
    data: any;
  }[];
  recommendation: string;
  expectedImpact: string;
  confidence: number;
}

export class ComprehensiveFeedbackAnalyzer {
  private reviewAgent: AppReviewScraperAgent;
  private socialAgent: SocialFeedbackAgent;
  
  constructor() {
    this.reviewAgent = new AppReviewScraperAgent();
    this.socialAgent = new SocialFeedbackAgent();
  }
  
  /**
   * Analyze all feedback sources and correlate insights
   */
  async analyzeAllFeedback(config: {
    appName: string;
    googlePlayId?: string;
    appStoreId?: string;
    businessName?: string;
    location?: string;
    redditSubreddits?: string[];
    twitterHashtags?: string[];
  }): Promise<{
    insights: ComprehensiveInsight[];
    metrics: any;
    recommendations: any[];
  }> {
    console.log(`🔍 Running comprehensive analysis for ${config.appName}...`);
    
    // Gather data from all sources in parallel
    const [appReviews, socialFeedback] = await Promise.all([
      this.reviewAgent.scrapeAllFeedbackSources({
        googlePlayAppId: config.googlePlayId,
        appStoreAppId: config.appStoreId,
        businessName: config.businessName,
        location: config.location
      }),
      this.socialAgent.aggregateSocialFeedback({
        productName: config.appName,
        redditSubreddits: config.redditSubreddits,
        twitterHashtags: config.twitterHashtags
      })
    ]);
    
    // Correlate insights across sources
    const insights = this.correlateInsights(appReviews, socialFeedback);
    
    // Generate executive metrics
    const metrics = this.calculateMetrics(appReviews, socialFeedback);
    
    // Create prioritized recommendations
    const recommendations = this.generateRecommendations(insights, metrics);
    
    return { insights, metrics, recommendations };
  }
  
  private correlateInsights(
    appReviews: any,
    socialFeedback: any
  ): ComprehensiveInsight[] {
    const insights: ComprehensiveInsight[] = [];
    
    // Look for patterns across sources
    const reviewAnalysis = appReviews.all_reviews;
    const socialMentions = socialFeedback.mentions;
    
    // Pattern 1: Performance issues mentioned in both reviews and social
    const performanceInReviews = reviewAnalysis.filter(
      (r: any) => r.text.toLowerCase().includes('slow') || 
                  r.text.toLowerCase().includes('crash') ||
                  r.text.toLowerCase().includes('lag')
    ).length;
    
    const performanceInSocial = socialMentions.filter(
      (m: any) => m.text.toLowerCase().includes('slow') ||
                  m.text.toLowerCase().includes('crash') ||
                  m.text.toLowerCase().includes('lag')
    ).length;
    
    if (performanceInReviews > 10 && performanceInSocial > 5) {
      insights.push({
        type: 'critical',
        title: 'Performance Crisis Detected',
        description: 'Performance issues are damaging brand reputation across multiple channels',
        evidence: [
          {
            source: 'app_reviews',
            data: `${performanceInReviews} reviews mention performance issues`
          },
          {
            source: 'social_media',
            data: `${performanceInSocial} social posts complaining about performance`
          }
        ],
        recommendation: 'Emergency performance optimization sprint required',
        expectedImpact: 'Prevent 30% user churn, improve rating by 1.2 stars',
        confidence: 0.92
      });
    }
    
    // Pattern 2: Competitor mentioned frequently
    const competitorMentions = [...reviewAnalysis, ...socialMentions].filter(
      (item: any) => item.text.toLowerCase().includes('competitor')
    );
    
    if (competitorMentions.length > 15) {
      insights.push({
        type: 'warning',
        title: 'Losing Ground to Competitors',
        description: 'Users frequently comparing unfavorably to competitors',
        evidence: [
          {
            source: 'combined',
            data: `${competitorMentions.length} mentions of competitors`
          }
        ],
        recommendation: 'Conduct competitive analysis and feature parity assessment',
        expectedImpact: 'Reduce customer churn by 20%',
        confidence: 0.85
      });
    }
    
    // Pattern 3: Feature requests across channels
    const featureRequests = this.extractFeatureRequests(reviewAnalysis, socialMentions);
    
    if (featureRequests.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'High-Demand Feature Identified',
        description: `Users consistently requesting: ${featureRequests[0].feature}`,
        evidence: [
          {
            source: 'app_reviews',
            data: `${featureRequests[0].reviewCount} reviews`
          },
          {
            source: 'social_media',
            data: `${featureRequests[0].socialCount} social mentions`
          }
        ],
        recommendation: `Prioritize development of ${featureRequests[0].feature}`,
        expectedImpact: 'Increase user satisfaction by 35%, potential 15% revenue growth',
        confidence: 0.88
      });
    }
    
    return insights;
  }
  
  private extractFeatureRequests(reviews: any[], social: any[]): any[] {
    const featureKeywords = ['need', 'want', 'wish', 'should have', 'missing', 'add'];
    const requests: Record<string, { reviewCount: number; socialCount: number }> = {};
    
    // Simplified feature extraction
    const commonFeatures = ['dark mode', 'offline', 'export', 'integration', 'api', 'dashboard'];
    
    commonFeatures.forEach(feature => {
      const reviewCount = reviews.filter(r => 
        r.text.toLowerCase().includes(feature) &&
        featureKeywords.some(keyword => r.text.toLowerCase().includes(keyword))
      ).length;
      
      const socialCount = social.filter(s =>
        s.text.toLowerCase().includes(feature) &&
        featureKeywords.some(keyword => s.text.toLowerCase().includes(keyword))
      ).length;
      
      if (reviewCount + socialCount > 5) {
        requests[feature] = { reviewCount, socialCount };
      }
    });
    
    return Object.entries(requests)
      .map(([feature, counts]) => ({
        feature,
        ...counts,
        total: counts.reviewCount + counts.socialCount
      }))
      .sort((a, b) => b.total - a.total);
  }
  
  private calculateMetrics(appReviews: any, socialFeedback: any): any {
    const totalFeedback = appReviews.all_reviews.length + socialFeedback.mentions.length;
    
    return {
      total_feedback_analyzed: totalFeedback,
      sources: {
        app_reviews: appReviews.all_reviews.length,
        social_mentions: socialFeedback.mentions.length
      },
      sentiment: {
        app_reviews: appReviews.summary.sentiment,
        social_media: socialFeedback.insights.sentiment_breakdown
      },
      velocity: {
        reviews_per_day: this.calculateVelocity(appReviews.all_reviews),
        social_mentions_per_day: this.calculateVelocity(socialFeedback.mentions)
      },
      health_score: this.calculateHealthScore(appReviews, socialFeedback)
    };
  }
  
  private calculateVelocity(items: any[]): number {
    if (items.length === 0) return 0;
    
    const dates = items.map(item => new Date(item.date).getTime());
    const oldestDate = Math.min(...dates);
    const newestDate = Math.max(...dates);
    const daysDiff = (newestDate - oldestDate) / (1000 * 60 * 60 * 24) || 1;
    
    return Number((items.length / daysDiff).toFixed(1));
  }
  
  private calculateHealthScore(appReviews: any, socialFeedback: any): number {
    // Simple health score calculation
    const avgRating = appReviews.summary.overall_rating || 3;
    const sentimentScore = appReviews.summary.sentiment?.positive || 50;
    const socialSentiment = socialFeedback.insights.sentiment_breakdown?.positive || 50;
    
    const healthScore = (
      (avgRating / 5) * 40 +  // 40% weight on rating
      (sentimentScore / 100) * 30 +  // 30% weight on review sentiment
      (socialSentiment / 100) * 30  // 30% weight on social sentiment
    );
    
    return Number(healthScore.toFixed(0));
  }
  
  private generateRecommendations(
    insights: ComprehensiveInsight[],
    metrics: any
  ): any[] {
    const recommendations = [];
    
    // Priority 1: Address critical issues
    const criticalInsights = insights.filter(i => i.type === 'critical');
    criticalInsights.forEach(insight => {
      recommendations.push({
        priority: 1,
        action: insight.recommendation,
        impact: insight.expectedImpact,
        effort: 'high',
        timeline: 'immediate'
      });
    });
    
    // Priority 2: Quick wins
    if (metrics.health_score < 70) {
      recommendations.push({
        priority: 2,
        action: 'Implement quick fixes for top 3 user complaints',
        impact: 'Improve health score by 10-15 points',
        effort: 'medium',
        timeline: '1-2 weeks'
      });
    }
    
    // Priority 3: Strategic improvements
    const opportunities = insights.filter(i => i.type === 'opportunity');
    opportunities.forEach(insight => {
      recommendations.push({
        priority: 3,
        action: insight.recommendation,
        impact: insight.expectedImpact,
        effort: 'medium',
        timeline: '1-2 months'
      });
    });
    
    return recommendations.sort((a, b) => a.priority - b.priority);
  }
}

// Demo execution
export async function runComprehensiveDemo() {
  const analyzer = new ComprehensiveFeedbackAnalyzer();
  
  const results = await analyzer.analyzeAllFeedback({
    appName: 'DemoApp',
    googlePlayId: 'com.demo.app',
    appStoreId: '123456789',
    businessName: 'Demo Company',
    location: 'San Francisco, CA',
    redditSubreddits: ['startups', 'technology'],
    twitterHashtags: ['demoapp', 'startup']
  });
  
  console.log('\n📊 COMPREHENSIVE FEEDBACK ANALYSIS');
  console.log('═'.repeat(50));
  
  console.log('\n🎯 Key Insights:');
  results.insights.forEach((insight, i) => {
    console.log(`\n${i + 1}. [${insight.type.toUpperCase()}] ${insight.title}`);
    console.log(`   ${insight.description}`);
    console.log(`   Evidence:`);
    insight.evidence.forEach(e => {
      console.log(`   - ${e.source}: ${e.data}`);
    });
    console.log(`   ➡️  ${insight.recommendation}`);
    console.log(`   📈 Impact: ${insight.expectedImpact}`);
  });
  
  console.log('\n📈 Health Metrics:');
  console.log(`   Overall Health Score: ${results.metrics.health_score}/100`);
  console.log(`   Total Feedback Analyzed: ${results.metrics.total_feedback_analyzed}`);
  console.log(`   Review Velocity: ${results.metrics.velocity.reviews_per_day}/day`);
  console.log(`   Social Velocity: ${results.metrics.velocity.social_mentions_per_day}/day`);
  
  console.log('\n🚀 Prioritized Action Plan:');
  results.recommendations.forEach((rec, i) => {
    console.log(`\n${i + 1}. [P${rec.priority}] ${rec.action}`);
    console.log(`   Impact: ${rec.impact}`);
    console.log(`   Effort: ${rec.effort} | Timeline: ${rec.timeline}`);
  });
  
  return results;
}

// Run demo if called directly
if (require.main === module) {
  runComprehensiveDemo().catch(console.error);
}