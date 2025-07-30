import axios from 'axios';
import { FileStorage } from '../utils/file-storage';

interface ScraperConfig {
  api_key: string;
  customer_id: string;
}

interface ReviewData {
  text: string;
  rating: number;
  date: Date;
  source: string;
  author?: string;
  helpful_count?: number;
  verified?: boolean;
}

export class BrightDataScrapers {
  private config: ScraperConfig;
  private storage: FileStorage;
  
  constructor() {
    this.config = {
      api_key: process.env.BRIGHT_DATA_API_KEY || '',
      customer_id: process.env.BRIGHT_DATA_CUSTOMER_ID || 'hl_de59c417'
    };
    this.storage = new FileStorage('./output');
  }

  /**
   * Trigger a pre-built Bright Data scraper
   */
  private async triggerScraper(collector: string, params: any): Promise<any> {
    try {
      const response = await axios.post(
        'https://api.brightdata.com/datasets/v3/trigger',
        {
          customer_id: this.config.customer_id,
          collector: collector,
          params: params
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.api_key}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Get the dataset ID from response
      const datasetId = response.data.dataset_id;
      
      // Wait a bit for data to be collected
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Fetch the results
      return await this.fetchDatasetResults(datasetId);
      
    } catch (error: any) {
      console.error(`Failed to trigger ${collector}:`, error.response?.status || error.message);
      throw error;
    }
  }

  /**
   * Fetch results from a dataset
   */
  private async fetchDatasetResults(datasetId: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://api.brightdata.com/datasets/v3/${datasetId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.api_key}`
          }
        }
      );
      
      return response.data;
      
    } catch (error: any) {
      console.error(`Failed to fetch dataset ${datasetId}:`, error.response?.status || error.message);
      throw error;
    }
  }

  /**
   * Scrape Glassdoor company reviews
   */
  async scrapeGlassdoor(companyName: string): Promise<ReviewData[]> {
    console.log(`🏢 Fetching Glassdoor reviews for ${companyName}...`);
    
    try {
      const params = {
        company_name: companyName,
        limit: 50
      };
      
      const data = await this.triggerScraper('glassdoor_reviews', params);
      
      const reviews: ReviewData[] = data.map((item: any) => ({
        text: item.review_text || item.pros + ' ' + item.cons,
        rating: item.rating || 0,
        date: new Date(item.date || Date.now()),
        source: 'glassdoor',
        author: item.job_title || 'Anonymous',
        verified: true
      }));
      
      console.log(`✅ Found ${reviews.length} Glassdoor reviews`);
      
      await this.storage.saveToFile({
        company: companyName,
        platform: 'glassdoor',
        total_reviews: reviews.length,
        reviews: reviews,
        scraped_at: new Date(),
        is_real_data: true
      }, 'glassdoor_reviews');
      
      return reviews;
      
    } catch (error) {
      console.error('Glassdoor scraping failed:', error);
      throw error;
    }
  }

  /**
   * Scrape Google search results and reviews
   */
  async scrapeGoogleSearch(query: string): Promise<any> {
    console.log(`🔍 Searching Google for "${query}"...`);
    
    try {
      const params = {
        query: query,
        num_results: 20,
        include_related_searches: true
      };
      
      const data = await this.triggerScraper('google_search', params);
      
      console.log(`✅ Found ${data.results?.length || 0} Google search results`);
      
      await this.storage.saveToFile({
        query: query,
        platform: 'google_search',
        results: data,
        scraped_at: new Date(),
        is_real_data: true
      }, 'google_search_results');
      
      return data;
      
    } catch (error) {
      console.error('Google search scraping failed:', error);
      throw error;
    }
  }

  /**
   * Scrape Indeed company reviews
   */
  async scrapeIndeed(companyName: string): Promise<ReviewData[]> {
    console.log(`💼 Fetching Indeed reviews for ${companyName}...`);
    
    try {
      const params = {
        company_name: companyName,
        limit: 50
      };
      
      const data = await this.triggerScraper('indeed_reviews', params);
      
      const reviews: ReviewData[] = data.map((item: any) => ({
        text: item.review_text || item.summary,
        rating: item.rating || 0,
        date: new Date(item.date || Date.now()),
        source: 'indeed',
        author: item.job_title || 'Employee',
        verified: true
      }));
      
      console.log(`✅ Found ${reviews.length} Indeed reviews`);
      
      await this.storage.saveToFile({
        company: companyName,
        platform: 'indeed',
        total_reviews: reviews.length,
        reviews: reviews,
        scraped_at: new Date(),
        is_real_data: true
      }, 'indeed_reviews');
      
      return reviews;
      
    } catch (error) {
      console.error('Indeed scraping failed:', error);
      throw error;
    }
  }

  /**
   * Scrape Yelp business reviews
   */
  async scrapeYelp(businessName: string, location: string): Promise<ReviewData[]> {
    console.log(`⭐ Fetching Yelp reviews for ${businessName} in ${location}...`);
    
    try {
      const params = {
        business_name: businessName,
        location: location,
        limit: 50
      };
      
      const data = await this.triggerScraper('yelp_reviews', params);
      
      const reviews: ReviewData[] = data.map((item: any) => ({
        text: item.text || item.comment,
        rating: item.rating || 0,
        date: new Date(item.date || Date.now()),
        source: 'yelp',
        author: item.user_name || 'Yelp User',
        helpful_count: item.useful_count || 0,
        verified: true
      }));
      
      console.log(`✅ Found ${reviews.length} Yelp reviews`);
      
      await this.storage.saveToFile({
        business: businessName,
        location: location,
        platform: 'yelp',
        total_reviews: reviews.length,
        reviews: reviews,
        scraped_at: new Date(),
        is_real_data: true
      }, 'yelp_reviews');
      
      return reviews;
      
    } catch (error) {
      console.error('Yelp scraping failed:', error);
      throw error;
    }
  }

  /**
   * Scrape Crunchbase company data
   */
  async scrapeCrunchbase(companyName: string): Promise<any> {
    console.log(`🚀 Fetching Crunchbase data for ${companyName}...`);
    
    try {
      const params = {
        company_name: companyName
      };
      
      const data = await this.triggerScraper('crunchbase_company', params);
      
      console.log(`✅ Found Crunchbase data for ${companyName}`);
      
      await this.storage.saveToFile({
        company: companyName,
        platform: 'crunchbase',
        data: data,
        scraped_at: new Date(),
        is_real_data: true
      }, 'crunchbase_data');
      
      return data;
      
    } catch (error) {
      console.error('Crunchbase scraping failed:', error);
      throw error;
    }
  }

  /**
   * Test all scrapers
   */
  async testAllScrapers(companyName: string = 'OpenAI', location: string = 'San Francisco') {
    console.log('🚀 Testing Bright Data pre-built scrapers...\n');
    
    const results = {
      glassdoor: { success: false, count: 0 },
      google: { success: false, count: 0 },
      indeed: { success: false, count: 0 },
      yelp: { success: false, count: 0 },
      crunchbase: { success: false, data: null }
    };
    
    // Test Glassdoor
    try {
      const reviews = await this.scrapeGlassdoor(companyName);
      results.glassdoor = { success: true, count: reviews.length };
    } catch (error) {
      console.log('Glassdoor failed');
    }
    
    // Test Google
    try {
      const data = await this.scrapeGoogleSearch(`${companyName} reviews`);
      results.google = { success: true, count: data.results?.length || 0 };
    } catch (error) {
      console.log('Google search failed');
    }
    
    // Test Indeed
    try {
      const reviews = await this.scrapeIndeed(companyName);
      results.indeed = { success: true, count: reviews.length };
    } catch (error) {
      console.log('Indeed failed');
    }
    
    // Test Yelp
    try {
      const reviews = await this.scrapeYelp(companyName, location);
      results.yelp = { success: true, count: reviews.length };
    } catch (error) {
      console.log('Yelp failed');
    }
    
    // Test Crunchbase
    try {
      const data = await this.scrapeCrunchbase(companyName);
      results.crunchbase = { success: true, data: data };
    } catch (error) {
      console.log('Crunchbase failed');
    }
    
    console.log('\n📊 Summary:');
    console.log('Glassdoor:', results.glassdoor);
    console.log('Google:', results.google);
    console.log('Indeed:', results.indeed);
    console.log('Yelp:', results.yelp);
    console.log('Crunchbase:', results.crunchbase);
    
    return results;
  }
}

// Test function
export async function testBrightDataScrapers() {
  const scrapers = new BrightDataScrapers();
  await scrapers.testAllScrapers();
}