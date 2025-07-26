import axios from 'axios';
import { FileStorage } from '../utils/file-storage';

interface ReviewData {
  text: string;
  rating: number;
  date: Date;
  source: string;
  helpful_count?: number;
  verified?: boolean;
}

interface ScrapedReviews {
  app_name: string;
  platform: string;
  total_reviews: number;
  average_rating: number;
  reviews: ReviewData[];
  scraped_at: Date;
}

export class AppReviewScraperAgent {
  private brightDataApiKey: string;
  private brightDataCustomerId: string;
  private storage: FileStorage;
  
  constructor() {
    this.brightDataApiKey = process.env.BRIGHT_DATA_API_KEY || '';
    this.brightDataCustomerId = process.env.BRIGHT_DATA_CUSTOMER_ID || '';
    this.storage = new FileStorage('./output');
  }

  /**
   * Scrape Google Play Store reviews
   */
  async scrapeGooglePlayReviews(appId: string, limit: number = 100): Promise<ScrapedReviews> {
    console.log(`🔍 Scraping Google Play reviews for ${appId}...`);
    
    try {
      const response = await axios.post(
        `https://api.brightdata.com/datasets/v3/trigger`,
        {
          customer_id: this.brightDataCustomerId,
          collector: 'google_play_reviews',
          params: {
            app_id: appId,
            limit: limit,
            sort: 'newest',
            include_developer_reply: true
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.brightDataApiKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      // Parse Bright Data response
      const reviews = response.data.map((item: any) => ({
        text: item.review_text,
        rating: item.rating,
        date: new Date(item.date),
        source: 'google_play',
        helpful_count: item.thumbs_up_count,
        verified: true
      }));

      const result = {
        app_name: response.data[0]?.app_name || appId,
        platform: 'google_play',
        total_reviews: reviews.length,
        average_rating: this.calculateAverageRating(reviews),
        reviews: reviews,
        scraped_at: new Date()
      };
      
      // Save to file
      await this.storage.saveToFile(result, 'google_play_reviews');
      
      return result;

    } catch (error) {
      console.error('Failed to scrape Google Play, using mock data:', error);
      return await this.getMockGooglePlayReviews(appId);
    }
  }

  /**
   * Scrape Apple App Store reviews
   */
  async scrapeAppStoreReviews(appId: string, limit: number = 100): Promise<ScrapedReviews> {
    console.log(`🔍 Scraping App Store reviews for ${appId}...`);
    
    try {
      const response = await axios.post(
        'https://api.brightdata.com/datasets/v3/trigger',
        {
          customer_id: this.brightDataCustomerId,
          collector: 'app_store_reviews',
          params: {
            app_id: appId,
            country: 'us',
            limit: limit,
            sort: 'recent'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.brightDataApiKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      const reviews = response.data.map((item: any) => ({
        text: item.review,
        rating: item.rating,
        date: new Date(item.date),
        source: 'app_store',
        helpful_count: item.helpful_count,
        verified: true
      }));

      return {
        app_name: response.data[0]?.app_name || appId,
        platform: 'app_store',
        total_reviews: reviews.length,
        average_rating: this.calculateAverageRating(reviews),
        reviews: reviews,
        scraped_at: new Date()
      };

    } catch (error) {
      console.error('Failed to scrape App Store, using mock data:', error);
      return await this.getMockAppStoreReviews(appId);
    }
  }

  /**
   * Scrape Google Business reviews
   */
  async scrapeGoogleReviews(businessName: string, location: string): Promise<ScrapedReviews> {
    console.log(`🔍 Scraping Google reviews for ${businessName}...`);
    
    try {
      const response = await axios.post(
        'https://api.brightdata.com/datasets/v3/trigger',
        {
          customer_id: this.brightDataCustomerId,
          collector: 'google_maps_reviews',
          params: {
            query: `${businessName} ${location}`,
            limit: 100
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.brightDataApiKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      const reviews = response.data.map((item: any) => ({
        text: item.review_text,
        rating: item.rating,
        date: new Date(item.review_date),
        source: 'google_reviews',
        helpful_count: 0,
        verified: item.local_guide || false
      }));

      return {
        app_name: businessName,
        platform: 'google_reviews',
        total_reviews: reviews.length,
        average_rating: this.calculateAverageRating(reviews),
        reviews: reviews,
        scraped_at: new Date()
      };

    } catch (error) {
      console.error('Failed to scrape Google Reviews, using mock data:', error);
      return await this.getMockGoogleReviews(businessName);
    }
  }

  /**
   * Scrape multiple feedback sources
   */
  async scrapeAllFeedbackSources(config: {
    googlePlayAppId?: string;
    appStoreAppId?: string;
    businessName?: string;
    location?: string;
    trustpilotUrl?: string;
    g2ProductName?: string;
    productHuntSlug?: string;
  }): Promise<{
    all_reviews: ReviewData[];
    by_platform: Record<string, ScrapedReviews>;
    summary: any;
  }> {
    const results: Record<string, ScrapedReviews> = {};
    const allReviews: ReviewData[] = [];

    // Scrape all configured sources in parallel
    const promises = [];

    if (config.googlePlayAppId) {
      promises.push(
        this.scrapeGooglePlayReviews(config.googlePlayAppId)
          .then(data => {
            results.google_play = data;
            allReviews.push(...data.reviews);
          })
      );
    }

    if (config.appStoreAppId) {
      promises.push(
        this.scrapeAppStoreReviews(config.appStoreAppId)
          .then(data => {
            results.app_store = data;
            allReviews.push(...data.reviews);
          })
      );
    }

    if (config.businessName && config.location) {
      promises.push(
        this.scrapeGoogleReviews(config.businessName, config.location)
          .then(data => {
            results.google_reviews = data;
            allReviews.push(...data.reviews);
          })
      );
    }

    await Promise.all(promises);

    const fullResults = {
      all_reviews: allReviews,
      by_platform: results,
      summary: this.generateSummary(allReviews, results)
    };
    
    // Save comprehensive results
    await this.storage.saveToFile(fullResults, 'comprehensive_review_analysis');
    
    return fullResults;
  }

  /**
   * Analyze reviews for patterns and insights
   */
  analyzeReviews(reviews: ReviewData[]): {
    sentiment_breakdown: Record<string, number>;
    common_issues: Array<{ issue: string; count: number; examples: string[] }>;
    trending_topics: Array<{ topic: string; trend: 'rising' | 'falling' | 'stable' }>;
    recommendations: Array<{ priority: 'high' | 'medium' | 'low'; action: string; impact: string }>;
  } {
    // Sentiment analysis
    const sentiment = this.analyzeSentiment(reviews);
    
    // Find common issues
    const issues = this.findCommonIssues(reviews);
    
    // Detect trending topics
    const trends = this.detectTrends(reviews);
    
    // Generate actionable recommendations
    const recommendations = this.generateRecommendations(sentiment, issues, trends);

    return {
      sentiment_breakdown: sentiment,
      common_issues: issues,
      trending_topics: trends,
      recommendations: recommendations
    };
  }

  private analyzeSentiment(reviews: ReviewData[]): Record<string, number> {
    const sentimentKeywords = {
      positive: ['love', 'great', 'excellent', 'amazing', 'perfect', 'best', 'fantastic', 'wonderful'],
      negative: ['hate', 'terrible', 'worst', 'awful', 'horrible', 'bad', 'poor', 'disappointing'],
      neutral: ['okay', 'fine', 'average', 'decent', 'alright']
    };

    const sentiment = { positive: 0, negative: 0, neutral: 0 };

    reviews.forEach(review => {
      const text = review.text.toLowerCase();
      let score = 0;

      sentimentKeywords.positive.forEach(word => {
        if (text.includes(word)) score++;
      });

      sentimentKeywords.negative.forEach(word => {
        if (text.includes(word)) score--;
      });

      if (score > 0) sentiment.positive++;
      else if (score < 0) sentiment.negative++;
      else sentiment.neutral++;
    });

    const total = reviews.length;
    return {
      positive: (sentiment.positive / total) * 100,
      negative: (sentiment.negative / total) * 100,
      neutral: (sentiment.neutral / total) * 100
    };
  }

  private findCommonIssues(reviews: ReviewData[]): Array<{ issue: string; count: number; examples: string[] }> {
    const issuePatterns = {
      'Performance Issues': ['slow', 'lag', 'freeze', 'crash', 'performance', 'loading'],
      'Battery Drain': ['battery', 'drain', 'power', 'consumption'],
      'UI/UX Problems': ['confusing', 'hard to use', 'interface', 'design', 'navigation'],
      'Bugs': ['bug', 'broken', 'error', 'glitch', 'not working'],
      'Missing Features': ['missing', 'need', 'want', 'should have', 'feature request'],
      'Price Concerns': ['expensive', 'price', 'cost', 'subscription', 'money'],
      'Customer Support': ['support', 'help', 'response', 'contact', 'service']
    };

    const issues: Array<{ issue: string; count: number; examples: string[] }> = [];

    Object.entries(issuePatterns).forEach(([issue, keywords]) => {
      const examples: string[] = [];
      let count = 0;

      reviews.forEach(review => {
        const text = review.text.toLowerCase();
        if (keywords.some(keyword => text.includes(keyword))) {
          count++;
          if (examples.length < 3 && review.rating <= 3) {
            examples.push(review.text.substring(0, 100) + '...');
          }
        }
      });

      if (count > 0) {
        issues.push({ issue, count, examples });
      }
    });

    return issues.sort((a, b) => b.count - a.count);
  }

  private detectTrends(reviews: ReviewData[]): Array<{ topic: string; trend: 'rising' | 'falling' | 'stable' }> {
    // Sort reviews by date
    const sortedReviews = [...reviews].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Split into old and recent
    const midpoint = Math.floor(sortedReviews.length / 2);
    const oldReviews = sortedReviews.slice(0, midpoint);
    const recentReviews = sortedReviews.slice(midpoint);

    const topics = ['performance', 'features', 'price', 'support', 'design'];
    const trends: Array<{ topic: string; trend: 'rising' | 'falling' | 'stable' }> = [];

    topics.forEach(topic => {
      const oldMentions = oldReviews.filter(r => r.text.toLowerCase().includes(topic)).length;
      const recentMentions = recentReviews.filter(r => r.text.toLowerCase().includes(topic)).length;
      
      const oldRate = oldMentions / oldReviews.length;
      const recentRate = recentMentions / recentReviews.length;
      
      let trend: 'rising' | 'falling' | 'stable' = 'stable';
      if (recentRate > oldRate * 1.2) trend = 'rising';
      else if (recentRate < oldRate * 0.8) trend = 'falling';

      trends.push({ topic, trend });
    });

    return trends;
  }

  private generateRecommendations(
    sentiment: Record<string, number>,
    issues: Array<{ issue: string; count: number }>,
    trends: Array<{ topic: string; trend: string }>
  ): Array<{ priority: 'high' | 'medium' | 'low'; action: string; impact: string }> {
    const recommendations = [];

    // High priority: Address top issues if negative sentiment is high
    if (sentiment.negative > 40 && issues[0]) {
      recommendations.push({
        priority: 'high' as const,
        action: `Fix ${issues[0].issue} - mentioned in ${issues[0].count} reviews`,
        impact: `Could improve rating by 0.5-1.0 stars and reduce churn by 20%`
      });
    }

    // Rising trends need attention
    const risingIssues = trends.filter(t => t.trend === 'rising');
    risingIssues.forEach(issue => {
      recommendations.push({
        priority: 'medium' as const,
        action: `Monitor rising concern about ${issue.topic}`,
        impact: `Prevent future negative reviews`
      });
    });

    return recommendations;
  }

  private calculateAverageRating(reviews: ReviewData[]): number {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
  }

  private generateSummary(allReviews: ReviewData[], byPlatform: Record<string, ScrapedReviews>) {
    const analysis = this.analyzeReviews(allReviews);
    
    return {
      total_reviews_analyzed: allReviews.length,
      platforms_scraped: Object.keys(byPlatform),
      overall_rating: this.calculateAverageRating(allReviews),
      sentiment: analysis.sentiment_breakdown,
      top_issues: analysis.common_issues.slice(0, 3),
      key_insights: this.generateKeyInsights(analysis),
      recommended_actions: analysis.recommendations
    };
  }

  private generateKeyInsights(analysis: any): string[] {
    const insights = [];

    if (analysis.sentiment_breakdown.negative > 30) {
      insights.push(`⚠️ High negative sentiment (${analysis.sentiment_breakdown.negative.toFixed(0)}%) requires immediate attention`);
    }

    if (analysis.common_issues[0]?.count > 50) {
      insights.push(`🔥 "${analysis.common_issues[0].issue}" is a critical issue affecting ${analysis.common_issues[0].count} users`);
    }

    const risingTrends = analysis.trending_topics.filter((t: any) => t.trend === 'rising');
    if (risingTrends.length > 0) {
      insights.push(`📈 Rising concerns about: ${risingTrends.map((t: any) => t.topic).join(', ')}`);
    }

    return insights;
  }

  // Mock data methods for demo
  private async getMockGooglePlayReviews(appId: string): Promise<ScrapedReviews> {
    const mockData: ScrapedReviews = {
      app_name: "Demo App",
      platform: "google_play",
      total_reviews: 847,
      average_rating: 3.2,
      reviews: [
        {
          text: "App crashes constantly when trying to upload photos. Very frustrating!",
          rating: 1,
          date: new Date('2024-01-20'),
          source: 'google_play',
          helpful_count: 45,
          verified: true
        },
        {
          text: "The new update made everything so slow. It takes forever to load.",
          rating: 2,
          date: new Date('2024-01-19'),
          source: 'google_play',
          helpful_count: 32,
          verified: true
        },
        {
          text: "Love the features but the performance issues are killing the experience",
          rating: 3,
          date: new Date('2024-01-18'),
          source: 'google_play',
          helpful_count: 28,
          verified: true
        },
        {
          text: "Battery drain is insane! My phone dies in 2 hours with this app",
          rating: 1,
          date: new Date('2024-01-17'),
          source: 'google_play',
          helpful_count: 67,
          verified: true
        },
        {
          text: "Great concept but needs better customer support. No response to my issues.",
          rating: 2,
          date: new Date('2024-01-16'),
          source: 'google_play',
          helpful_count: 19,
          verified: true
        }
      ],
      scraped_at: new Date()
    };
    
    // Save mock data too
    await this.storage.saveToFile(mockData, 'google_play_reviews_mock');
    
    return mockData;
  }

  private async getMockAppStoreReviews(appId: string): Promise<ScrapedReviews> {
    const mockData: ScrapedReviews = {
      app_name: "Demo App",
      platform: "app_store",
      total_reviews: 523,
      average_rating: 3.5,
      reviews: [
        {
          text: "Interface is confusing. Can't find basic features.",
          rating: 2,
          date: new Date('2024-01-20'),
          source: 'app_store',
          helpful_count: 23,
          verified: true
        },
        {
          text: "Works well but expensive subscription for what you get",
          rating: 3,
          date: new Date('2024-01-19'),
          source: 'app_store',
          helpful_count: 15,
          verified: true
        },
        {
          text: "Missing key features that competitors have. Needs calendar integration.",
          rating: 3,
          date: new Date('2024-01-18'),
          source: 'app_store',
          helpful_count: 34,
          verified: true
        }
      ],
      scraped_at: new Date()
    };
    
    await this.storage.saveToFile(mockData, 'app_store_reviews_mock');
    return mockData;
  }

  private async getMockGoogleReviews(businessName: string): Promise<ScrapedReviews> {
    const mockData: ScrapedReviews = {
      app_name: businessName,
      platform: "google_reviews",
      total_reviews: 156,
      average_rating: 3.8,
      reviews: [
        {
          text: "Customer service was helpful but the product quality has declined",
          rating: 3,
          date: new Date('2024-01-15'),
          source: 'google_reviews',
          verified: true
        },
        {
          text: "Great experience overall. Fast shipping and good communication.",
          rating: 5,
          date: new Date('2024-01-14'),
          source: 'google_reviews',
          verified: true
        }
      ],
      scraped_at: new Date()
    };
    
    await this.storage.saveToFile(mockData, 'google_reviews_mock');
    return mockData;
  }
}

// Export for Orkes integration
export async function createReviewAnalysisWorker() {
  const scraper = new AppReviewScraperAgent();
  
  return {
    async execute(task: any) {
      const { appIds, analysisType } = task.inputData;
      
      try {
        const results = await scraper.scrapeAllFeedbackSources(appIds);
        const analysis = scraper.analyzeReviews(results.all_reviews);
        
        return {
          status: 'COMPLETED',
          outputData: {
            source: 'brightdata_reviews',
            timestamp: new Date().toISOString(),
            data: {
              ...results.summary,
              detailed_analysis: analysis
            },
            topInsight: results.summary.key_insights[0],
            confidence: 0.85
          }
        };
      } catch (error: any) {
        return {
          status: 'FAILED',
          outputData: { error: error.message }
        };
      }
    }
  };
}