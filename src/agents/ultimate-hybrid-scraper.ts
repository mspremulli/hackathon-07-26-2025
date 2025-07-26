import { HybridScraperAgent } from './hybrid-scraper-agent';
import { ExtendedRealScrapers } from './extended-real-scrapers';
import { FileStorage } from '../utils/file-storage';

export class UltimateHybridScraper {
  private hybridScraper: HybridScraperAgent;
  private extendedScraper: ExtendedRealScrapers;
  private storage: FileStorage;
  
  constructor() {
    this.hybridScraper = new HybridScraperAgent();
    this.extendedScraper = new ExtendedRealScrapers();
    this.storage = new FileStorage('./output');
  }
  
  async scrapeAllSources(config: any) {
    console.log('🚀 Starting Ultimate Hybrid Scraping with Extended Sources\n');
    
    const results = {
      core_sources: {} as any,
      extended_sources: {} as any,
      summary: {
        total_sources: 0,
        real_data_sources: [] as string[],
        mock_data_sources: [] as string[],
        total_reviews: 0,
        real_reviews: 0,
        mock_reviews: 0,
        real_data_percentage: 0
      }
    };
    
    // 1. Run core hybrid scraper (App Store, Google Play, Google Reviews)
    console.log('📱 Phase 1: Core App Store Scrapers\n');
    const coreResults = await this.hybridScraper.scrapeWithRealDataFirst(config);
    
    // Type guard to check if it's the extended result type
    if ('all_data' in coreResults) {
      results.core_sources = coreResults.all_data;
    }
    
    // 2. Run extended scrapers
    console.log('\n🌐 Phase 2: Extended Social Media Scrapers\n');
    
    // Reddit (worked!)
    try {
      const redditPosts = await this.extendedScraper.scrapeReddit(`${config.appName || 'app'} reviews feedback`);
      if (redditPosts.length > 0) {
        results.extended_sources.reddit = {
          posts: redditPosts,
          is_real_data: true,
          count: redditPosts.length
        };
        results.summary.real_data_sources.push('reddit');
        results.summary.real_reviews += redditPosts.length;
      }
    } catch (error) {
      console.log('Reddit scraping failed, skipping...');
    }
    
    // Twitter
    try {
      const tweets = await this.extendedScraper.scrapeTwitter(`${config.appName || config.businessName} feedback`);
      if (tweets.length > 0) {
        results.extended_sources.twitter = {
          tweets: tweets,
          is_real_data: true,
          count: tweets.length
        };
        results.summary.real_data_sources.push('twitter');
        results.summary.real_reviews += tweets.length;
      }
    } catch (error) {
      console.log('Twitter scraping failed, skipping...');
    }
    
    // ProductHunt
    if (config.productHuntSlug) {
      try {
        const phReviews = await this.extendedScraper.scrapeProductHunt(config.productHuntSlug);
        if (phReviews.length > 0) {
          results.extended_sources.producthunt = {
            reviews: phReviews,
            is_real_data: true,
            count: phReviews.length
          };
          results.summary.real_data_sources.push('producthunt');
          results.summary.real_reviews += phReviews.length;
        }
      } catch (error) {
        console.log('ProductHunt scraping failed, skipping...');
      }
    }
    
    // Trustpilot
    if (config.trustpilotDomain) {
      try {
        const tpReviews = await this.extendedScraper.scrapeTrustpilot(config.trustpilotDomain);
        if (tpReviews.length > 0) {
          results.extended_sources.trustpilot = {
            reviews: tpReviews,
            is_real_data: true,
            count: tpReviews.length
          };
          results.summary.real_data_sources.push('trustpilot');
          results.summary.real_reviews += tpReviews.length;
        }
      } catch (error) {
        console.log('Trustpilot scraping failed, skipping...');
      }
    }
    
    // Glassdoor
    if (config.glassdoorCompany) {
      try {
        const gdReviews = await this.extendedScraper.scrapeGlassdoorReviews(config.glassdoorCompany);
        if (gdReviews.length > 0) {
          results.extended_sources.glassdoor = {
            reviews: gdReviews,
            is_real_data: true,
            count: gdReviews.length
          };
          results.summary.real_data_sources.push('glassdoor');
          results.summary.real_reviews += gdReviews.length;
        }
      } catch (error) {
        console.log('Glassdoor scraping failed, skipping...');
      }
    }
    
    // Indeed
    if (config.indeedCompany) {
      try {
        const indeedReviews = await this.extendedScraper.scrapeIndeedReviews(config.indeedCompany);
        if (indeedReviews.length > 0) {
          results.extended_sources.indeed = {
            reviews: indeedReviews,
            is_real_data: true,
            count: indeedReviews.length
          };
          results.summary.real_data_sources.push('indeed');
          results.summary.real_reviews += indeedReviews.length;
        }
      } catch (error) {
        console.log('Indeed scraping failed, skipping...');
      }
    }
    
    // Combine results from core scraper
    if ('real_data_sources' in coreResults) {
      results.summary.real_data_sources = [
        ...coreResults.real_data_sources,
        ...results.summary.real_data_sources
      ];
      results.summary.mock_data_sources = coreResults.mock_data_sources;
      results.summary.real_reviews += coreResults.total_real_reviews;
      results.summary.mock_reviews = coreResults.total_mock_reviews;
    }
    
    // Calculate totals
    results.summary.total_sources = results.summary.real_data_sources.length + results.summary.mock_data_sources.length;
    results.summary.total_reviews = results.summary.real_reviews + results.summary.mock_reviews;
    results.summary.real_data_percentage = Math.round(
      (results.summary.real_data_sources.length / results.summary.total_sources) * 100
    );
    
    // Save results
    await this.storage.saveToFile({
      summary: results.summary,
      core_sources: results.core_sources,
      extended_sources: results.extended_sources,
      scraped_at: new Date()
    }, 'ultimate_hybrid_results');
    
    // Display summary
    console.log('\n📊 Ultimate Hybrid Scraping Summary:');
    console.log('================================');
    console.log(`✅ Real data sources (${results.summary.real_data_sources.length}):`, results.summary.real_data_sources.join(', '));
    console.log(`📦 Mock data sources (${results.summary.mock_data_sources.length}):`, results.summary.mock_data_sources.join(', '));
    console.log(`📈 Real data percentage: ${results.summary.real_data_percentage}%`);
    console.log(`📝 Total reviews/posts: ${results.summary.total_reviews}`);
    console.log(`   - Real: ${results.summary.real_reviews} (${Math.round(results.summary.real_reviews / results.summary.total_reviews * 100)}%)`);
    console.log(`   - Mock: ${results.summary.mock_reviews} (${Math.round(results.summary.mock_reviews / results.summary.total_reviews * 100)}%)`);
    console.log('================================\n');
    
    return results;
  }
}

export async function testUltimateHybridScraper() {
  const scraper = new UltimateHybridScraper();
  
  const config = {
    // Core sources
    googlePlayAppId: 'com.whatsapp',
    appStoreAppId: '310633997',  // WhatsApp
    businessName: 'OpenAI',
    location: 'San Francisco',
    appName: 'WhatsApp',
    
    // Extended sources
    productHuntSlug: 'whatsapp',
    trustpilotDomain: 'whatsapp.com',
    glassdoorCompany: 'Meta',
    indeedCompany: 'Meta'
  };
  
  await scraper.scrapeAllSources(config);
}