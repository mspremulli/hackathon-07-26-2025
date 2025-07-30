import axios from 'axios';
import { FileStorage } from '../utils/file-storage';

interface CollectorConfig {
  name: string;
  id: string;
  params: any;
}

// Based on Bright Data's pre-built collectors
const COLLECTORS: Record<string, CollectorConfig> = {
  glassdoor: {
    name: 'Glassdoor Company Reviews',
    id: 'glassdoor_reviews',
    params: {
      company_url: '', // Will be set dynamically
      max_pages: 5
    }
  },
  indeed: {
    name: 'Indeed Company Reviews', 
    id: 'indeed_reviews',
    params: {
      company_url: '', // Will be set dynamically
      max_pages: 5
    }
  },
  yelp: {
    name: 'Yelp Business Reviews',
    id: 'yelp_reviews', 
    params: {
      business_url: '', // Will be set dynamically
      max_pages: 5
    }
  },
  crunchbase: {
    name: 'Crunchbase Company Profile',
    id: 'crunchbase_company',
    params: {
      company_url: '' // Will be set dynamically
    }
  }
};

export class BrightDataCollectors {
  private apiKey: string;
  private customerId: string;
  private storage: FileStorage;
  
  constructor() {
    this.apiKey = process.env.BRIGHT_DATA_API_KEY || 'brd_V9WnAYdEz5m6BPG8lS8eJxaYFiRJKelE';
    this.customerId = process.env.BRIGHT_DATA_CUSTOMER_ID || 'hl_de59c417';
    this.storage = new FileStorage('./output');
  }

  /**
   * Create a collection job
   */
  async createCollectionJob(collectorId: string, params: any) {
    try {
      console.log(`📋 Creating collection job for ${collectorId}...`);
      
      const response = await axios.post(
        `https://api.brightdata.com/datasets/v3/snapshots`,
        {
          collector: collectorId,
          customer: this.customerId,
          ...params
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.snapshot_id;
      
    } catch (error: any) {
      console.error(`Failed to create collection job:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Check job status
   */
  async checkJobStatus(snapshotId: string): Promise<string> {
    try {
      const response = await axios.get(
        `https://api.brightdata.com/datasets/v3/snapshots/${snapshotId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      return response.data.status;
      
    } catch (error: any) {
      console.error(`Failed to check job status:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get collection results
   */
  async getResults(snapshotId: string): Promise<any[]> {
    try {
      // Wait for job to complete
      let status = await this.checkJobStatus(snapshotId);
      let attempts = 0;
      
      while (status !== 'ready' && attempts < 30) {
        console.log(`⏳ Job status: ${status}, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        status = await this.checkJobStatus(snapshotId);
        attempts++;
      }
      
      if (status !== 'ready') {
        throw new Error('Job did not complete in time');
      }
      
      // Get results
      const response = await axios.get(
        `https://api.brightdata.com/datasets/v3/snapshots/${snapshotId}/data`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      return response.data;
      
    } catch (error: any) {
      console.error(`Failed to get results:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Scrape Glassdoor reviews
   */
  async scrapeGlassdoor(companyUrl: string) {
    console.log(`🏢 Scraping Glassdoor reviews from: ${companyUrl}`);
    
    try {
      const params = {
        ...COLLECTORS.glassdoor.params,
        company_url: companyUrl
      };
      
      const snapshotId = await this.createCollectionJob(COLLECTORS.glassdoor.id, params);
      console.log(`✅ Job created: ${snapshotId}`);
      
      const results = await this.getResults(snapshotId);
      console.log(`✅ Found ${results.length} reviews`);
      
      // Save results
      await this.storage.saveToFile({
        platform: 'glassdoor',
        url: companyUrl,
        total_reviews: results.length,
        reviews: results,
        scraped_at: new Date(),
        is_real_data: true
      }, 'glassdoor_collector_results');
      
      return results;
      
    } catch (error) {
      console.error('Glassdoor scraping failed:', error);
      throw error;
    }
  }

  /**
   * Scrape Indeed reviews
   */
  async scrapeIndeed(companyUrl: string) {
    console.log(`💼 Scraping Indeed reviews from: ${companyUrl}`);
    
    try {
      const params = {
        ...COLLECTORS.indeed.params,
        company_url: companyUrl
      };
      
      const snapshotId = await this.createCollectionJob(COLLECTORS.indeed.id, params);
      console.log(`✅ Job created: ${snapshotId}`);
      
      const results = await this.getResults(snapshotId);
      console.log(`✅ Found ${results.length} reviews`);
      
      // Save results
      await this.storage.saveToFile({
        platform: 'indeed',
        url: companyUrl,
        total_reviews: results.length,
        reviews: results,
        scraped_at: new Date(),
        is_real_data: true
      }, 'indeed_collector_results');
      
      return results;
      
    } catch (error) {
      console.error('Indeed scraping failed:', error);
      throw error;
    }
  }

  /**
   * Demo function to show how to find and use collectors
   */
  async listAvailableCollectors() {
    console.log('📋 Checking available collectors...\n');
    
    console.log('Based on Bright Data dashboard, these collectors are available:');
    console.log('1. glassdoor.com - Extract company reviews, salaries, and job postings');
    console.log('2. indeed.com - Extract job postings, company reviews, and salaries');
    console.log('3. yelp.com - Extract business profiles, customer reviews, and ratings');
    console.log('4. crunchbase.com - Extract company profiles and industry insights');
    console.log('5. google.com - Extract search results, images, news articles, maps');
    
    console.log('\nTo use these collectors:');
    console.log('1. Go to Bright Data dashboard -> Web Scrapers');
    console.log('2. Click on the collector you want to use');
    console.log('3. Get the collector ID and required parameters');
    console.log('4. Use the createCollectionJob() method with the collector ID');
    
    return true;
  }
}

// Test function
export async function testBrightDataCollectors() {
  const collectors = new BrightDataCollectors();
  
  // First list available collectors
  await collectors.listAvailableCollectors();
  
  console.log('\n🚀 To test specific collectors:');
  console.log('1. Get the exact collector IDs from Bright Data dashboard');
  console.log('2. Update the COLLECTORS object with correct IDs');
  console.log('3. Run scraping methods with actual company URLs');
  
  // Example usage (would need real collector IDs):
  // await collectors.scrapeGlassdoor('https://www.glassdoor.com/Overview/Working-at-Meta-EI_IE40772.htm');
  // await collectors.scrapeIndeed('https://www.indeed.com/cmp/Meta');
}