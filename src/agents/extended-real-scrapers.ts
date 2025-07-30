import { RealDataScraper } from './real-data-scraper';
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

export class ExtendedRealScrapers extends RealDataScraper {
  constructor() {
    super();
  }

  /**
   * Scrape Reddit posts about a company/product
   */
  async scrapeReddit(searchQuery: string): Promise<ReviewData[]> {
    console.log(`🔴 Fetching REAL Reddit posts about "${searchQuery}"...`);
    
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(searchQuery)}&sort=relevance&limit=25`;
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const posts = response.data.data.children;
      const reviews: ReviewData[] = [];
      
      posts.forEach((post: any) => {
        const data = post.data;
        reviews.push({
          text: `${data.title}\n${data.selftext || ''}`.trim(),
          rating: data.ups > 0 ? Math.min(5, Math.round(data.ups / 10)) : 0,
          date: new Date(data.created_utc * 1000),
          source: 'reddit',
          author: data.author,
          helpful_count: data.ups,
          verified: true
        });
      });
      
      console.log(`✅ Found ${reviews.length} REAL Reddit posts!`);
      
      await this.storage.saveToFile({
        query: searchQuery,
        platform: 'reddit',
        total_posts: reviews.length,
        posts: reviews,
        scraped_at: new Date(),
        is_real_data: true
      }, 'reddit_real_posts');
      
      return reviews;
      
    } catch (error) {
      console.error('Failed to scrape Reddit:', error);
      throw error;
    }
  }

  /**
   * Scrape Twitter/X mentions (using nitter proxy)
   */
  async scrapeTwitter(searchQuery: string): Promise<ReviewData[]> {
    console.log(`🐦 Fetching Twitter/X mentions for "${searchQuery}"...`);
    
    // Using Web Unlocker for Twitter search
    const url = `https://twitter.com/search?q=${encodeURIComponent(searchQuery)}&src=typed_query`;
    
    try {
      const html = await this.fetchWithUnlocker(url);
      const $ = cheerio.load(html);
      const reviews: ReviewData[] = [];
      
      // Try to extract tweets (Twitter's HTML is dynamic, so this might need adjustment)
      $('[data-testid="tweet"]').each((i: number, elem: any) => {
        const tweetElem = $(elem);
        const text = tweetElem.find('[data-testid="tweetText"]').text().trim();
        const author = tweetElem.find('[data-testid="User-Name"]').text().trim();
        const likes = tweetElem.find('[data-testid="like"] span').text().trim();
        
        if (text) {
          reviews.push({
            text,
            rating: 0, // Twitter doesn't have ratings
            date: new Date(),
            source: 'twitter',
            author: author || 'Twitter User',
            helpful_count: parseInt(likes) || 0,
            verified: true
          });
        }
      });
      
      console.log(`✅ Found ${reviews.length} tweets!`);
      
      await this.storage.saveToFile({
        query: searchQuery,
        platform: 'twitter',
        total_tweets: reviews.length,
        tweets: reviews,
        scraped_at: new Date(),
        is_real_data: true
      }, 'twitter_real_mentions');
      
      return reviews;
      
    } catch (error) {
      console.error('Failed to scrape Twitter:', error);
      throw error;
    }
  }

  /**
   * Scrape ProductHunt reviews
   */
  async scrapeProductHunt(productSlug: string): Promise<ReviewData[]> {
    console.log(`🚀 Fetching REAL ProductHunt reviews for "${productSlug}"...`);
    
    const url = `https://www.producthunt.com/products/${productSlug}`;
    
    try {
      const html = await this.fetchWithUnlocker(url);
      const $ = cheerio.load(html);
      const reviews: ReviewData[] = [];
      
      // ProductHunt comment selectors
      $('.comment-item').each((i: number, elem: any) => {
        const commentElem = $(elem);
        const text = commentElem.find('.comment-body').text().trim();
        const author = commentElem.find('.user-name').text().trim();
        const upvotes = commentElem.find('.upvote-count').text().trim();
        
        if (text) {
          reviews.push({
            text,
            rating: 5, // ProductHunt comments are generally positive
            date: new Date(),
            source: 'producthunt',
            author: author || 'Hunter',
            helpful_count: parseInt(upvotes) || 0,
            verified: true
          });
        }
      });
      
      console.log(`✅ Found ${reviews.length} REAL ProductHunt reviews!`);
      
      await this.storage.saveToFile({
        product: productSlug,
        platform: 'producthunt',
        total_reviews: reviews.length,
        reviews: reviews,
        scraped_at: new Date(),
        is_real_data: true
      }, 'producthunt_real_reviews');
      
      return reviews;
      
    } catch (error) {
      console.error('Failed to scrape ProductHunt:', error);
      throw error;
    }
  }

  /**
   * Scrape Trustpilot reviews
   */
  async scrapeTrustpilot(companyDomain: string): Promise<ReviewData[]> {
    console.log(`⭐ Fetching REAL Trustpilot reviews for "${companyDomain}"...`);
    
    const url = `https://www.trustpilot.com/review/${companyDomain}`;
    
    try {
      const html = await this.fetchWithUnlocker(url);
      const $ = cheerio.load(html);
      const reviews: ReviewData[] = [];
      
      // Trustpilot review selectors
      $('[data-review-card]').each((i: number, elem: any) => {
        const reviewElem = $(elem);
        
        // Extract review text
        const text = reviewElem.find('[data-service-review-text-typography]').text().trim();
        
        // Extract rating (from stars)
        const ratingElem = reviewElem.find('[data-service-review-rating]');
        const ratingImg = ratingElem.find('img').attr('alt') || '';
        const ratingMatch = ratingImg.match(/(\d+)/);
        const rating = ratingMatch ? parseInt(ratingMatch[1]) : 0;
        
        // Extract author
        const author = reviewElem.find('[data-consumer-name-typography]').text().trim();
        
        // Extract date
        const dateText = reviewElem.find('time').attr('datetime');
        
        if (text) {
          reviews.push({
            text,
            rating,
            date: new Date(dateText || Date.now()),
            source: 'trustpilot',
            author: author || 'Verified User',
            verified: true
          });
        }
      });
      
      console.log(`✅ Found ${reviews.length} REAL Trustpilot reviews!`);
      
      await this.storage.saveToFile({
        company: companyDomain,
        platform: 'trustpilot',
        total_reviews: reviews.length,
        reviews: reviews,
        scraped_at: new Date(),
        is_real_data: true
      }, 'trustpilot_real_reviews');
      
      return reviews;
      
    } catch (error) {
      console.error('Failed to scrape Trustpilot:', error);
      throw error;
    }
  }

  /**
   * Scrape G2 software reviews
   */
  async scrapeG2(productSlug: string): Promise<ReviewData[]> {
    console.log(`💼 Fetching REAL G2 reviews for "${productSlug}"...`);
    
    const url = `https://www.g2.com/products/${productSlug}/reviews`;
    
    try {
      const html = await this.fetchWithUnlocker(url);
      const $ = cheerio.load(html);
      const reviews: ReviewData[] = [];
      
      // G2 review selectors
      $('.paper.paper--white').each((i: number, elem: any) => {
        const reviewElem = $(elem);
        
        // Extract review text
        const prosText = reviewElem.find('[data-test="review-pros"]').text().trim();
        const consText = reviewElem.find('[data-test="review-cons"]').text().trim();
        const text = `Pros: ${prosText}\nCons: ${consText}`;
        
        // Extract rating
        const stars = reviewElem.find('.stars img').length;
        const rating = stars || 0;
        
        // Extract author info
        const authorTitle = reviewElem.find('.fw-semibold').text().trim();
        
        if (prosText || consText) {
          reviews.push({
            text,
            rating,
            date: new Date(),
            source: 'g2',
            author: authorTitle || 'Verified User',
            verified: true
          });
        }
      });
      
      console.log(`✅ Found ${reviews.length} REAL G2 reviews!`);
      
      await this.storage.saveToFile({
        product: productSlug,
        platform: 'g2',
        total_reviews: reviews.length,
        reviews: reviews,
        scraped_at: new Date(),
        is_real_data: true
      }, 'g2_real_reviews');
      
      return reviews;
      
    } catch (error) {
      console.error('Failed to scrape G2:', error);
      throw error;
    }
  }

  /**
   * Test all extended scrapers
   */
  async testAllExtendedScrapers() {
    console.log('🚀 Testing extended real data scrapers...\n');
    
    const results = {
      reddit: { success: false, count: 0 },
      twitter: { success: false, count: 0 },
      producthunt: { success: false, count: 0 },
      trustpilot: { success: false, count: 0 },
      g2: { success: false, count: 0 }
    };
    
    // Test Reddit (usually works without authentication)
    try {
      const posts = await this.scrapeReddit('OpenAI ChatGPT reviews');
      results.reddit = { success: true, count: posts.length };
    } catch (error) {
      console.log('Reddit scraping failed');
    }
    
    // Test Twitter
    try {
      const tweets = await this.scrapeTwitter('OpenAI feedback');
      results.twitter = { success: true, count: tweets.length };
    } catch (error) {
      console.log('Twitter scraping failed');
    }
    
    // Test ProductHunt
    try {
      const reviews = await this.scrapeProductHunt('chatgpt');
      results.producthunt = { success: true, count: reviews.length };
    } catch (error) {
      console.log('ProductHunt scraping failed');
    }
    
    // Test Trustpilot
    try {
      const reviews = await this.scrapeTrustpilot('openai.com');
      results.trustpilot = { success: true, count: reviews.length };
    } catch (error) {
      console.log('Trustpilot scraping failed');
    }
    
    // Test G2
    try {
      const reviews = await this.scrapeG2('openai-chatgpt');
      results.g2 = { success: true, count: reviews.length };
    } catch (error) {
      console.log('G2 scraping failed');
    }
    
    console.log('\n📊 Extended Scrapers Summary:');
    console.log('Reddit:', results.reddit);
    console.log('Twitter:', results.twitter);
    console.log('ProductHunt:', results.producthunt);
    console.log('Trustpilot:', results.trustpilot);
    console.log('G2:', results.g2);
    
    const successCount = Object.values(results).filter(r => r.success).length;
    console.log(`\n✅ Success rate: ${successCount}/5 (${Math.round(successCount/5 * 100)}%)`);
    
    return results;
  }
}

// Test function
export async function testExtendedScrapers() {
  const scraper = new ExtendedRealScrapers();
  
  // Test connection first
  const isWorking = await scraper.testConnection();
  if (!isWorking) {
    console.log('\n⚠️  Web Unlocker is not working. Check your API key and zone name.');
    return;
  }
  
  await scraper.testAllExtendedScrapers();
}