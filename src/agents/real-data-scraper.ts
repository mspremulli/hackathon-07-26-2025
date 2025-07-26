import axios from 'axios';
import { FileStorage } from '../utils/file-storage';
const cheerio = require('cheerio');

interface ReviewData {
  text: string;
  rating: number;
  date: Date;
  source: string;
  author?: string;
  helpful_count?: number;
  verified?: boolean;
}

export class RealDataScraper {
  protected apiKey: string;
  protected zone: string;
  protected storage: FileStorage;
  
  constructor() {
    // Use the working API key from the zone
    this.apiKey = '296668d701e1bc5b11f43f8956150eafb48465a3921677e51dd2bdf9fa511a2f';
    this.zone = 'web_unlocker1';
    this.storage = new FileStorage('./output');
  }

  /**
   * Fetch URL using Web Unlocker
   */
  protected async fetchWithUnlocker(url: string, jsRender: boolean = false): Promise<string> {
    try {
      const requestBody: any = {
        zone: this.zone,
        url: url,
        format: 'raw'
      };
      
      // Only add js_render if needed
      if (jsRender) {
        requestBody.js_render = true;
      }
      
      const response = await axios.post(
        'https://api.brightdata.com/request',
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000  // 30 second timeout
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch ${url}:`, error.response?.status || error.message);
      if (error.response?.data) {
        console.error('Error details:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  /**
   * Scrape Google Play Store reviews
   */
  async scrapeGooglePlayReviews(appId: string): Promise<ReviewData[]> {
    console.log(`🎯 Fetching REAL Google Play reviews for ${appId}...`);
    
    const url = `https://play.google.com/store/apps/details?id=${appId}&showAllReviews=true`;
    
    try {
      const html = await this.fetchWithUnlocker(url);
      const $ = cheerio.load(html);
      const reviews: ReviewData[] = [];
      
      // Parse reviews from the HTML
      $('[jscontroller="H6eOGe"]').each((i, elem) => {
        const reviewElem = $(elem);
        
        // Extract review text
        const text = reviewElem.find('[jsname="fbQN7e"]').text().trim();
        
        // Extract rating (aria-label contains star rating)
        const ratingText = reviewElem.find('[class*="pf5lIe"] [role="img"]').attr('aria-label') || '';
        const ratingMatch = ratingText.match(/(\d+)/);
        const rating = ratingMatch ? parseInt(ratingMatch[1]) : 0;
        
        // Extract author
        const author = reviewElem.find('[class*="X43Kjb"]').text().trim();
        
        // Extract date
        const dateText = reviewElem.find('[class*="p2TkOb"]').text().trim();
        
        // Extract helpful count
        const helpfulText = reviewElem.find('[jsname="EKyjbe"]').text().trim();
        const helpfulMatch = helpfulText.match(/(\d+)/);
        const helpful_count = helpfulMatch ? parseInt(helpfulMatch[1]) : 0;
        
        if (text) {
          reviews.push({
            text,
            rating,
            date: new Date(dateText || Date.now()),
            source: 'google_play',
            author,
            helpful_count,
            verified: true
          });
        }
      });
      
      console.log(`✅ Found ${reviews.length} REAL reviews!`);
      
      // Save to file
      const result = {
        app_id: appId,
        platform: 'google_play',
        total_reviews: reviews.length,
        reviews: reviews,
        scraped_at: new Date(),
        is_real_data: true
      };
      
      await this.storage.saveToFile(result, 'google_play_real_reviews');
      
      return reviews;
      
    } catch (error) {
      console.error('Failed to scrape Google Play:', error);
      throw error;
    }
  }

  /**
   * Scrape Apple App Store reviews
   */
  async scrapeAppStoreReviews(appId: string): Promise<ReviewData[]> {
    console.log(`🎯 Fetching REAL App Store reviews for ${appId}...`);
    
    const url = `https://apps.apple.com/us/app/id${appId}`;
    
    try {
      const html = await this.fetchWithUnlocker(url);
      const $ = cheerio.load(html);
      const reviews: ReviewData[] = [];
      
      // App Store review selectors
      $('.we-customer-review').each((i, elem) => {
        const reviewElem = $(elem);
        
        // Extract review text
        const text = reviewElem.find('.we-customer-review__body').text().trim() ||
                    reviewElem.find('[class*="truncated-content"]').text().trim() ||
                    reviewElem.find('blockquote').text().trim();
        
        // Extract rating from aria-label
        const ratingElem = reviewElem.find('[class*="we-star-rating"]');
        const ariaLabel = ratingElem.attr('aria-label') || '';
        const ratingMatch = ariaLabel.match(/(\d+(\.\d+)?)\s*(out of|stars|étoiles)/i);
        const rating = ratingMatch ? Math.round(parseFloat(ratingMatch[1])) : 0;
        
        // Extract author
        const author = reviewElem.find('.we-customer-review__user').text().trim() ||
                      reviewElem.find('[class*="reviewer"]').text().trim();
        
        // Extract date
        const dateText = reviewElem.find('time').attr('datetime') || 
                        reviewElem.find('.we-customer-review__date').text().trim();
        
        if (text) {
          reviews.push({
            text,
            rating,
            date: new Date(dateText || Date.now()),
            source: 'app_store',
            author,
            verified: true
          });
        }
      });
      
      console.log(`✅ Found ${reviews.length} REAL reviews!`);
      
      // Save to file
      const result = {
        app_id: appId,
        platform: 'app_store',
        total_reviews: reviews.length,
        reviews: reviews,
        scraped_at: new Date(),
        is_real_data: true
      };
      
      await this.storage.saveToFile(result, 'app_store_real_reviews');
      
      return reviews;
      
    } catch (error) {
      console.error('Failed to scrape App Store:', error);
      throw error;
    }
  }

  /**
   * Scrape Google Business reviews
   */
  async scrapeGoogleReviews(query: string): Promise<ReviewData[]> {
    console.log(`🎯 Fetching REAL Google reviews for "${query}"...`);
    
    // First search for the business
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query + ' reviews')}`;
    
    try {
      const html = await this.fetchWithUnlocker(searchUrl);
      const $ = cheerio.load(html);
      const reviews: ReviewData[] = [];
      
      // Look for review snippets in search results
      $('[data-async-type="review"]').each((i, elem) => {
        const reviewElem = $(elem);
        
        const text = reviewElem.find('[class*="review-snippet"]').text().trim();
        const ratingText = reviewElem.find('[role="img"]').attr('aria-label') || '';
        const ratingMatch = ratingText.match(/(\d+)/);
        const rating = ratingMatch ? parseInt(ratingMatch[1]) : 0;
        const author = reviewElem.find('[class*="reviewer-name"]').text().trim();
        
        if (text) {
          reviews.push({
            text,
            rating,
            date: new Date(),
            source: 'google_reviews',
            author,
            verified: true
          });
        }
      });
      
      console.log(`✅ Found ${reviews.length} REAL reviews!`);
      
      // Save to file
      const result = {
        query: query,
        platform: 'google_reviews',
        total_reviews: reviews.length,
        reviews: reviews,
        scraped_at: new Date(),
        is_real_data: true
      };
      
      await this.storage.saveToFile(result, 'google_real_reviews');
      
      return reviews;
      
    } catch (error) {
      console.error('Failed to scrape Google Reviews:', error);
      throw error;
    }
  }

  /**
   * Scrape Glassdoor reviews using Web Unlocker
   */
  async scrapeGlassdoorReviews(companyName: string): Promise<ReviewData[]> {
    console.log(`🏢 Fetching REAL Glassdoor reviews for ${companyName}...`);
    
    const url = `https://www.glassdoor.com/Reviews/${companyName.replace(/\s+/g, '-')}-Reviews-E0.htm`;
    
    try {
      const html = await this.fetchWithUnlocker(url, false);
      const $ = cheerio.load(html);
      const reviews: ReviewData[] = [];
      
      // Glassdoor review selectors
      $('.empReview').each((i, elem) => {
        const reviewElem = $(elem);
        
        // Extract review text
        const pros = reviewElem.find('[data-test="pros"]').text().trim();
        const cons = reviewElem.find('[data-test="cons"]').text().trim();
        const text = `Pros: ${pros} Cons: ${cons}`;
        
        // Extract rating
        const ratingText = reviewElem.find('.ratingNumber').text().trim();
        const rating = parseFloat(ratingText) || 0;
        
        // Extract job title
        const jobTitle = reviewElem.find('.authorJobTitle').text().trim();
        
        // Extract date
        const dateText = reviewElem.find('.authorInfo time').text().trim();
        
        if (pros || cons) {
          reviews.push({
            text,
            rating,
            date: new Date(dateText || Date.now()),
            source: 'glassdoor',
            author: jobTitle || 'Employee',
            verified: true
          });
        }
      });
      
      console.log(`✅ Found ${reviews.length} REAL reviews!`);
      
      // Save to file
      await this.storage.saveToFile({
        company: companyName,
        platform: 'glassdoor',
        total_reviews: reviews.length,
        reviews: reviews,
        scraped_at: new Date(),
        is_real_data: true
      }, 'glassdoor_real_reviews');
      
      return reviews;
      
    } catch (error) {
      console.error('Failed to scrape Glassdoor:', error);
      throw error;
    }
  }

  /**
   * Scrape Indeed reviews using Web Unlocker
   */
  async scrapeIndeedReviews(companyName: string): Promise<ReviewData[]> {
    console.log(`💼 Fetching REAL Indeed reviews for ${companyName}...`);
    
    const url = `https://www.indeed.com/cmp/${companyName.toLowerCase().replace(/\s+/g, '-')}/reviews`;
    
    try {
      const html = await this.fetchWithUnlocker(url, false);
      const $ = cheerio.load(html);
      const reviews: ReviewData[] = [];
      
      // Indeed review selectors
      $('.cmp-Review').each((i, elem) => {
        const reviewElem = $(elem);
        
        // Extract review text
        const text = reviewElem.find('.cmp-Review-text').text().trim();
        
        // Extract rating
        const ratingMeta = reviewElem.find('[itemprop="ratingValue"]').attr('content');
        const rating = parseFloat(ratingMeta || '0') || 0;
        
        // Extract job title
        const jobTitle = reviewElem.find('.cmp-ReviewAuthor').text().trim();
        
        // Extract date
        const dateText = reviewElem.find('.cmp-Review-date').text().trim();
        
        if (text) {
          reviews.push({
            text,
            rating,
            date: new Date(dateText || Date.now()),
            source: 'indeed',
            author: jobTitle || 'Employee',
            verified: true
          });
        }
      });
      
      console.log(`✅ Found ${reviews.length} REAL reviews!`);
      
      // Save to file
      await this.storage.saveToFile({
        company: companyName,
        platform: 'indeed',
        total_reviews: reviews.length,
        reviews: reviews,
        scraped_at: new Date(),
        is_real_data: true
      }, 'indeed_real_reviews');
      
      return reviews;
      
    } catch (error) {
      console.error('Failed to scrape Indeed:', error);
      throw error;
    }
  }

  /**
   * Test the Web Unlocker connection
   */
  async testConnection(): Promise<boolean> {
    console.log('🔍 Testing Web Unlocker connection...');
    console.log('API Key:', this.apiKey.substring(0, 10) + '...');
    console.log('Zone:', this.zone);
    
    try {
      const data = JSON.stringify({
        zone: 'web_unlocker1',
        url: 'https://geo.brdtest.com/welcome.txt?product=unlocker&method=api',
        format: 'raw'
      });
      
      const response = await axios({
        method: 'post',
        url: 'https://api.brightdata.com/request',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 296668d701e1bc5b11f43f8956150eafb48465a3921677e51dd2bdf9fa511a2f'
        },
        data: data
      });
      
      console.log('✅ Web Unlocker is working!');
      console.log('Response:', response.data.substring(0, 200) + '...');
      return true;
      
    } catch (error: any) {
      console.error('❌ Web Unlocker test failed:', error.response?.status || error.message);
      if (error.response?.data) {
        console.error('Error details:', error.response.data);
      }
      return false;
    }
  }
}

// Test function
export async function testRealDataScraping() {
  const scraper = new RealDataScraper();
  
  // Test connection first
  const isWorking = await scraper.testConnection();
  if (!isWorking) {
    console.log('\n⚠️  Web Unlocker is not working. Check your API key and zone name.');
    return;
  }
  
  console.log('\n🚀 Testing real data scraping...\n');
  
  // Test Google Play
  try {
    const reviews = await scraper.scrapeGooglePlayReviews('com.whatsapp');
    console.log(`Google Play: ${reviews.length} reviews found`);
    if (reviews.length > 0) {
      console.log('Sample review:', reviews[0].text.substring(0, 100) + '...');
    }
  } catch (error) {
    console.log('Google Play scraping failed');
  }
  
  // Test App Store
  try {
    const reviews = await scraper.scrapeAppStoreReviews('310633997'); // WhatsApp ID
    console.log(`App Store: ${reviews.length} reviews found`);
    if (reviews.length > 0) {
      console.log('Sample review:', reviews[0].text.substring(0, 100) + '...');
    }
  } catch (error) {
    console.log('App Store scraping failed');
  }
  
  // Test Google Reviews
  try {
    const reviews = await scraper.scrapeGoogleReviews('OpenAI San Francisco');
    console.log(`Google Reviews: ${reviews.length} reviews found`);
    if (reviews.length > 0) {
      console.log('Sample review:', reviews[0].text.substring(0, 100) + '...');
    }
  } catch (error) {
    console.log('Google Reviews scraping failed');
  }
}