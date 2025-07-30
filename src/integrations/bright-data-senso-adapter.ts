import { getSensoClient, SensoClient } from './senso-client';
import { FileStorage } from '../utils/file-storage';

interface ReviewData {
  text: string;
  rating: number;
  date: Date;
  source: string;
  author?: string;
  helpful_count?: number;
  verified?: boolean;
}

interface ScrapedData {
  platform: string;
  app_id?: string;
  company?: string;
  query?: string;
  total_reviews: number;
  reviews: ReviewData[];
  scraped_at: Date;
  is_real_data: boolean;
}

/**
 * Adapter to store Bright Data scraped results in Senso.ai
 */
export class BrightDataSensoAdapter {
  public sensoClient: SensoClient;
  private fileStorage: FileStorage;
  
  constructor() {
    this.sensoClient = getSensoClient();
    this.fileStorage = new FileStorage('./output');
  }

  /**
   * Store scraped data in both Senso.ai and local files
   */
  async storeScrapedData(data: ScrapedData): Promise<string> {
    console.log(`\n🔄 Storing ${data.platform} data in Senso.ai...`);
    
    // Prepare context data for Senso.ai
    const contextData = {
      source: `bright-data-${data.platform}`,
      type: 'reviews',
      data: {
        platform: data.platform,
        app_id: data.app_id,
        company: data.company,
        query: data.query,
        total_reviews: data.total_reviews,
        is_real_data: data.is_real_data,
        scraped_at: data.scraped_at,
        reviews: data.reviews
      },
      metadata: {
        scraper: 'bright-data',
        real_data_percentage: data.is_real_data ? 100 : 0,
        review_count: data.total_reviews
      },
      tags: [
        data.platform,
        data.is_real_data ? 'real-data' : 'mock-data',
        'reviews',
        'feedback'
      ],
      timestamp: data.scraped_at
    };
    
    try {
      // Store in Senso.ai
      const contextId = await this.sensoClient.storeContext(contextData);
      
      // Also save to local file for backup
      await this.fileStorage.saveToFile({
        ...data,
        senso_context_id: contextId
      }, `${data.platform}_senso_stored`);
      
      console.log(`✅ Stored in Senso.ai with ID: ${contextId}`);
      return contextId;
      
    } catch (error) {
      console.error('Failed to store in Senso.ai:', error);
      // Fallback to file storage only
      await this.fileStorage.saveToFile(data, `${data.platform}_local_only`);
      return 'local-only';
    }
  }

  /**
   * Store batch of reviews
   */
  async storeBatchReviews(platform: string, reviews: ReviewData[], metadata: any = {}): Promise<string[]> {
    console.log(`\n🔄 Storing ${reviews.length} ${platform} reviews in Senso.ai...`);
    
    const contexts = reviews.map(review => ({
      source: `bright-data-${platform}`,
      type: 'review',
      data: review,
      metadata: {
        ...metadata,
        platform,
        rating: review.rating,
        is_verified: review.verified
      },
      tags: [
        platform,
        'review',
        `rating-${review.rating}`,
        review.verified ? 'verified' : 'unverified'
      ],
      timestamp: review.date
    }));
    
    try {
      const ids = await this.sensoClient.storeBatch(contexts);
      console.log(`✅ Stored ${ids.length} reviews in Senso.ai`);
      return ids;
    } catch (error) {
      console.error('Batch store failed:', error);
      return [];
    }
  }

  /**
   * Create a context window for the COO/EIR Assistant
   */
  async createBusinessContext(options: {
    appName?: string;
    companyName?: string;
    timeRange?: number; // days
    sources?: string[];
  }): Promise<string> {
    console.log(`\n📊 Creating business context window...`);
    
    const queryOptions = {
      sources: options.sources || [
        'bright-data-app_store',
        'bright-data-google_play',
        'bright-data-google_reviews',
        'bright-data-reddit',
        'bright-data-glassdoor',
        'bright-data-trustpilot'
      ],
      types: ['reviews', 'review', 'feedback'],
      limit: 100
    };
    
    if (options.timeRange) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - options.timeRange);
      queryOptions['startDate'] = startDate;
      queryOptions['endDate'] = endDate;
    }
    
    try {
      // Query relevant contexts
      const contexts = await this.sensoClient.queryContexts(queryOptions);
      
      // Group by source and analyze
      const analysis = this.analyzeContexts(contexts);
      
      // Create focused context window
      const contextWindow = await this.sensoClient.createContextWindow({
        sources: queryOptions.sources,
        types: queryOptions.types,
        maxTokens: 8000,
        relevanceThreshold: 0.7
      });
      
      // Combine with analysis
      const businessContext = `
# Business Feedback Context
Generated: ${new Date().toISOString()}

## Summary
- Total feedback items: ${contexts.length}
- Sources: ${Object.keys(analysis.bySources).join(', ')}
- Average sentiment: ${analysis.avgSentiment.toFixed(2)}/5
- Real data percentage: ${analysis.realDataPercentage}%

## Key Insights
${analysis.insights.join('\n')}

## Recent Feedback
${contextWindow}
`;
      
      console.log(`✅ Created business context (${contexts.length} items)`);
      return businessContext;
      
    } catch (error) {
      console.error('Failed to create business context:', error);
      return 'Unable to create context window';
    }
  }

  /**
   * Analyze contexts for insights
   */
  private analyzeContexts(contexts: any[]): any {
    const bySources: Record<string, number> = {};
    let totalRating = 0;
    let ratingCount = 0;
    let realDataCount = 0;
    
    contexts.forEach(ctx => {
      // Count by source
      bySources[ctx.source] = (bySources[ctx.source] || 0) + 1;
      
      // Average rating
      if (ctx.data.rating) {
        totalRating += ctx.data.rating;
        ratingCount++;
      }
      
      // Real data percentage
      if (ctx.metadata?.is_real_data || ctx.tags?.includes('real-data')) {
        realDataCount++;
      }
    });
    
    const avgSentiment = ratingCount > 0 ? totalRating / ratingCount : 0;
    const realDataPercentage = Math.round((realDataCount / contexts.length) * 100);
    
    // Generate insights
    const insights = [];
    if (avgSentiment < 3) {
      insights.push('⚠️ Low average rating indicates significant user dissatisfaction');
    } else if (avgSentiment > 4) {
      insights.push('✅ High average rating shows strong user satisfaction');
    }
    
    if (realDataPercentage < 50) {
      insights.push('📊 Consider increasing real data collection for better insights');
    }
    
    // Find most common complaints (simplified)
    const negativeReviews = contexts.filter(ctx => 
      ctx.data.rating && ctx.data.rating <= 2
    );
    
    if (negativeReviews.length > 0) {
      insights.push(`🔍 ${negativeReviews.length} negative reviews require attention`);
    }
    
    return {
      bySources,
      avgSentiment,
      realDataPercentage,
      insights
    };
  }

  /**
   * Get recent feedback for a specific platform
   */
  async getRecentFeedback(platform: string, limit: number = 10): Promise<any[]> {
    const contexts = await this.sensoClient.queryContexts({
      sources: [`bright-data-${platform}`],
      types: ['reviews', 'review'],
      limit
    });
    
    return contexts.map(ctx => ctx.data);
  }
}

// Example usage
export async function testSensoIntegration() {
  const adapter = new BrightDataSensoAdapter();
  
  // Example: Store scraped data
  const exampleData: ScrapedData = {
    platform: 'app_store',
    app_id: '310633997',
    total_reviews: 3,
    reviews: [
      {
        text: 'Great app for communication',
        rating: 5,
        date: new Date(),
        source: 'app_store',
        author: 'User123',
        verified: true
      }
    ],
    scraped_at: new Date(),
    is_real_data: true
  };
  
  // Store the data
  const contextId = await adapter.storeScrapedData(exampleData);
  console.log('Stored with ID:', contextId);
  
  // Create business context
  const context = await adapter.createBusinessContext({
    appName: 'WhatsApp',
    timeRange: 30,
    sources: ['bright-data-app_store', 'bright-data-reddit']
  });
  
  console.log('\nBusiness Context Preview:');
  console.log(context.substring(0, 500) + '...');
}