import { AppReviewScraperAgent } from './review-scraper-agent';
import { RealDataScraper } from './real-data-scraper';
import { FileStorage } from '../utils/file-storage';

/**
 * Hybrid scraper that attempts real data first, then falls back to mock
 */
export class HybridScraperAgent {
  private mockScraper: AppReviewScraperAgent;
  private realScraper: RealDataScraper;
  private storage: FileStorage;
  
  constructor() {
    this.mockScraper = new AppReviewScraperAgent();
    this.realScraper = new RealDataScraper();
    this.storage = new FileStorage('./output');
  }
  
  /**
   * Scrape with real data attempt first
   */
  async scrapeWithRealDataFirst(config: any) {
    const results = {
      real_data_sources: [] as string[],
      mock_data_sources: [] as string[],
      total_real_reviews: 0,
      total_mock_reviews: 0,
      all_data: {} as any
    };
    
    console.log('\n🎯 Attempting to fetch REAL data from Bright Data...\n');
    
    // Test connection first
    const isConnected = await this.realScraper.testConnection();
    
    if (!isConnected) {
      console.log('⚠️  Bright Data not available, using all mock data\n');
      return await this.mockScraper.scrapeAllFeedbackSources(config);
    }
    
    // Try each source with real data first
    
    // 1. Google Play
    if (config.googlePlayAppId) {
      try {
        console.log('Attempting Google Play with real data...');
        const realReviews = await this.realScraper.scrapeGooglePlayReviews(config.googlePlayAppId);
        if (realReviews.length > 0) {
          results.real_data_sources.push('google_play');
          results.total_real_reviews += realReviews.length;
          results.all_data.google_play = {
            reviews: realReviews,
            is_real_data: true
          };
        } else {
          throw new Error('No reviews found');
        }
      } catch (error) {
        console.log('Falling back to mock Google Play data');
        const mockData = await this.mockScraper.scrapeGooglePlayReviews(config.googlePlayAppId);
        results.mock_data_sources.push('google_play');
        results.total_mock_reviews += mockData.reviews.length;
        results.all_data.google_play = {
          ...mockData,
          is_real_data: false
        };
      }
    }
    
    // 2. App Store
    if (config.appStoreAppId) {
      try {
        console.log('Attempting App Store with real data...');
        const realReviews = await this.realScraper.scrapeAppStoreReviews(config.appStoreAppId);
        if (realReviews.length > 0) {
          results.real_data_sources.push('app_store');
          results.total_real_reviews += realReviews.length;
          results.all_data.app_store = {
            reviews: realReviews,
            is_real_data: true
          };
        } else {
          throw new Error('No reviews found');
        }
      } catch (error) {
        console.log('Falling back to mock App Store data');
        const mockData = await this.mockScraper.scrapeAppStoreReviews(config.appStoreAppId);
        results.mock_data_sources.push('app_store');
        results.total_mock_reviews += mockData.reviews.length;
        results.all_data.app_store = {
          ...mockData,
          is_real_data: false
        };
      }
    }
    
    // 3. Google Reviews
    if (config.businessName && config.location) {
      try {
        console.log('Attempting Google Reviews with real data...');
        const query = `${config.businessName} ${config.location}`;
        const realReviews = await this.realScraper.scrapeGoogleReviews(query);
        if (realReviews.length > 0) {
          results.real_data_sources.push('google_reviews');
          results.total_real_reviews += realReviews.length;
          results.all_data.google_reviews = {
            reviews: realReviews,
            is_real_data: true
          };
        } else {
          throw new Error('No reviews found');
        }
      } catch (error) {
        console.log('Falling back to mock Google Reviews data');
        const mockData = await this.mockScraper.scrapeGoogleReviews(config.businessName, config.location);
        results.mock_data_sources.push('google_reviews');
        results.total_mock_reviews += mockData.reviews.length;
        results.all_data.google_reviews = {
          ...mockData,
          is_real_data: false
        };
      }
    }
    
    // Generate summary
    const summary = {
      total_sources: results.real_data_sources.length + results.mock_data_sources.length,
      real_data_percentage: Math.round((results.real_data_sources.length / (results.real_data_sources.length + results.mock_data_sources.length)) * 100),
      total_reviews: results.total_real_reviews + results.total_mock_reviews,
      real_reviews_percentage: Math.round((results.total_real_reviews / (results.total_real_reviews + results.total_mock_reviews)) * 100),
      sources_with_real_data: results.real_data_sources,
      sources_with_mock_data: results.mock_data_sources,
      bright_data_status: 'connected'
    };
    
    // Save results
    await this.storage.saveToFile({
      summary,
      results,
      scraped_at: new Date()
    }, 'hybrid_scraping_results');
    
    console.log('\n📊 Hybrid Scraping Summary:');
    console.log(`✅ Real data sources: ${results.real_data_sources.join(', ') || 'none'}`);
    console.log(`📦 Mock data sources: ${results.mock_data_sources.join(', ') || 'none'}`);
    console.log(`📈 Real data percentage: ${summary.real_data_percentage}%`);
    console.log(`📝 Total reviews: ${summary.total_reviews} (${summary.real_reviews_percentage}% real)\n`);
    
    return {
      ...results,
      summary
    };
  }
}