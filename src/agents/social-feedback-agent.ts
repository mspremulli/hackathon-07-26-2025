import axios from 'axios';

interface SocialMention {
  text: string;
  author: string;
  platform: string;
  url: string;
  date: Date;
  engagement: {
    likes?: number;
    shares?: number;
    comments?: number;
    upvotes?: number;
  };
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export class SocialFeedbackAgent {
  private brightDataApiKey: string;
  
  constructor() {
    this.brightDataApiKey = process.env.BRIGHT_DATA_API_KEY || '';
  }

  /**
   * Scrape Reddit mentions
   */
  async scrapeRedditMentions(productName: string, subreddits?: string[]): Promise<SocialMention[]> {
    console.log(`🔍 Searching Reddit for mentions of ${productName}...`);
    
    try {
      const searchQuery = subreddits 
        ? `${productName} subreddit:${subreddits.join(' OR subreddit:')}`
        : productName;

      const response = await axios.post(
        'https://api.brightdata.com/datasets/v3/trigger',
        {
          collector: 'reddit_search',
          params: {
            query: searchQuery,
            sort: 'relevance',
            time: 'month',
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

      return response.data.map((post: any) => ({
        text: post.title + ' ' + post.selftext,
        author: post.author,
        platform: 'reddit',
        url: `https://reddit.com${post.permalink}`,
        date: new Date(post.created_utc * 1000),
        engagement: {
          upvotes: post.ups,
          comments: post.num_comments
        },
        sentiment: this.analyzeSentiment(post.title + ' ' + post.selftext)
      }));

    } catch (error) {
      console.error('Failed to scrape Reddit, using mock data:', error);
      return this.getMockRedditMentions(productName);
    }
  }

  /**
   * Scrape Twitter/X mentions
   */
  async scrapeTwitterMentions(productName: string, hashtags?: string[]): Promise<SocialMention[]> {
    console.log(`🔍 Searching Twitter/X for mentions of ${productName}...`);
    
    try {
      const query = hashtags 
        ? `${productName} ${hashtags.map(h => `#${h}`).join(' OR ')}`
        : productName;

      const response = await axios.post(
        'https://api.brightdata.com/datasets/v3/trigger',
        {
          collector: 'twitter_search',
          params: {
            query: query,
            limit: 100,
            include_replies: true
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.brightDataApiKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      return response.data.map((tweet: any) => ({
        text: tweet.text,
        author: tweet.username,
        platform: 'twitter',
        url: tweet.url,
        date: new Date(tweet.created_at),
        engagement: {
          likes: tweet.favorite_count,
          shares: tweet.retweet_count,
          comments: tweet.reply_count
        },
        sentiment: this.analyzeSentiment(tweet.text)
      }));

    } catch (error) {
      console.error('Failed to scrape Twitter, using mock data:', error);
      return this.getMockTwitterMentions(productName);
    }
  }

  /**
   * Scrape Trustpilot reviews
   */
  async scrapeTrustpilot(companyUrl: string): Promise<any> {
    console.log(`🔍 Scraping Trustpilot reviews...`);
    
    try {
      const response = await axios.post(
        'https://api.brightdata.com/datasets/v3/trigger',
        {
          collector: 'trustpilot_reviews',
          params: {
            url: companyUrl,
            limit: 50
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.brightDataApiKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      return {
        platform: 'trustpilot',
        reviews: response.data.map((review: any) => ({
          text: review.text,
          rating: review.rating,
          date: new Date(review.date),
          author: review.reviewer_name,
          verified: review.verified_order
        })),
        summary: {
          total_reviews: response.data.length,
          average_rating: this.calculateAverage(response.data.map((r: any) => r.rating)),
          trust_score: response.data[0]?.company_trust_score
        }
      };

    } catch (error) {
      console.error('Failed to scrape Trustpilot:', error);
      return this.getMockTrustpilotData();
    }
  }

  /**
   * Scrape G2 reviews (for B2B software)
   */
  async scrapeG2Reviews(productSlug: string): Promise<any> {
    console.log(`🔍 Scraping G2 reviews for ${productSlug}...`);
    
    try {
      const response = await axios.post(
        'https://api.brightdata.com/datasets/v3/trigger',
        {
          collector: 'g2_reviews',
          params: {
            product: productSlug,
            limit: 50
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.brightDataApiKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      return {
        platform: 'g2',
        reviews: response.data.reviews,
        ratings: {
          overall: response.data.overall_rating,
          ease_of_use: response.data.ease_of_use,
          customer_support: response.data.customer_support,
          value_for_money: response.data.value_for_money
        },
        comparisons: response.data.compared_to // Competitors users also looked at
      };

    } catch (error) {
      console.error('Failed to scrape G2:', error);
      return this.getMockG2Data(productSlug);
    }
  }

  /**
   * Scrape Product Hunt comments
   */
  async scrapeProductHunt(productSlug: string): Promise<any> {
    console.log(`🔍 Scraping Product Hunt for ${productSlug}...`);
    
    try {
      const response = await axios.post(
        'https://api.brightdata.com/datasets/v3/trigger',
        {
          collector: 'producthunt_product',
          params: {
            slug: productSlug
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.brightDataApiKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      return {
        platform: 'producthunt',
        upvotes: response.data.votes_count,
        comments: response.data.comments.map((c: any) => ({
          text: c.body,
          author: c.user.name,
          upvotes: c.votes,
          date: new Date(c.created_at)
        })),
        featured_date: response.data.featured_at,
        makers: response.data.makers
      };

    } catch (error) {
      console.error('Failed to scrape Product Hunt:', error);
      return this.getMockProductHuntData(productSlug);
    }
  }

  /**
   * Aggregate all social feedback
   */
  async aggregateSocialFeedback(config: {
    productName: string;
    redditSubreddits?: string[];
    twitterHashtags?: string[];
    trustpilotUrl?: string;
    g2Slug?: string;
    productHuntSlug?: string;
  }): Promise<{
    mentions: SocialMention[];
    insights: any;
    sentiment_trend: any;
    viral_content: any[];
  }> {
    const mentions: SocialMention[] = [];
    
    // Collect from all sources in parallel
    const promises = [];

    promises.push(
      this.scrapeRedditMentions(config.productName, config.redditSubreddits)
        .then(data => mentions.push(...data))
    );

    promises.push(
      this.scrapeTwitterMentions(config.productName, config.twitterHashtags)
        .then(data => mentions.push(...data))
    );

    await Promise.all(promises);

    // Analyze the aggregated data
    const insights = this.generateSocialInsights(mentions);
    const sentimentTrend = this.analyzeSentimentTrend(mentions);
    const viralContent = this.findViralContent(mentions);

    return {
      mentions: mentions.sort((a, b) => b.date.getTime() - a.date.getTime()),
      insights,
      sentiment_trend: sentimentTrend,
      viral_content: viralContent
    };
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positive = ['love', 'great', 'amazing', 'excellent', 'best', 'awesome'];
    const negative = ['hate', 'terrible', 'worst', 'awful', 'sucks', 'horrible'];
    
    const lowerText = text.toLowerCase();
    const positiveScore = positive.filter(word => lowerText.includes(word)).length;
    const negativeScore = negative.filter(word => lowerText.includes(word)).length;
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  private generateSocialInsights(mentions: SocialMention[]): any {
    const insights = [];

    // Platform distribution
    const platforms = mentions.reduce((acc, m) => {
      acc[m.platform] = (acc[m.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Sentiment analysis
    const sentiments = mentions.reduce((acc, m) => {
      if (m.sentiment) {
        acc[m.sentiment] = (acc[m.sentiment] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Find trending topics
    const topics = this.extractTopics(mentions);

    if (sentiments.negative > sentiments.positive) {
      insights.push({
        type: 'warning',
        message: 'Negative sentiment dominates social mentions',
        action: 'Engage with critics and address concerns publicly'
      });
    }

    if (mentions.filter(m => m.platform === 'reddit').length > mentions.length * 0.6) {
      insights.push({
        type: 'opportunity',
        message: 'Strong Reddit presence - consider AMA or community engagement',
        action: 'Host Reddit AMA in relevant subreddits'
      });
    }

    return {
      platform_breakdown: platforms,
      sentiment_breakdown: sentiments,
      trending_topics: topics,
      actionable_insights: insights
    };
  }

  private analyzeSentimentTrend(mentions: SocialMention[]): any {
    // Group by week
    const weeks: Record<string, { positive: number; negative: number; neutral: number }> = {};
    
    mentions.forEach(mention => {
      const weekKey = this.getWeekKey(mention.date);
      if (!weeks[weekKey]) {
        weeks[weekKey] = { positive: 0, negative: 0, neutral: 0 };
      }
      if (mention.sentiment) {
        weeks[weekKey][mention.sentiment]++;
      }
    });

    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, sentiments]) => ({
        week,
        sentiments,
        trend: this.calculateTrend(sentiments)
      }));
  }

  private findViralContent(mentions: SocialMention[]): any[] {
    return mentions
      .filter(m => {
        const totalEngagement = (m.engagement.likes || 0) + 
                              (m.engagement.shares || 0) + 
                              (m.engagement.upvotes || 0);
        return totalEngagement > 100; // Threshold for "viral"
      })
      .sort((a, b) => {
        const aTotal = (a.engagement.likes || 0) + (a.engagement.shares || 0) + (a.engagement.upvotes || 0);
        const bTotal = (b.engagement.likes || 0) + (b.engagement.shares || 0) + (b.engagement.upvotes || 0);
        return bTotal - aTotal;
      })
      .slice(0, 5)
      .map(m => ({
        platform: m.platform,
        text: m.text.substring(0, 200) + '...',
        engagement: m.engagement,
        url: m.url,
        sentiment: m.sentiment,
        insights: this.analyzeViralContent(m)
      }));
  }

  private analyzeViralContent(mention: SocialMention): string {
    if (mention.sentiment === 'positive') {
      return 'Leverage this positive content in marketing materials';
    } else if (mention.sentiment === 'negative') {
      return 'Address this criticism publicly to prevent further spread';
    }
    return 'Monitor discussion and engage if appropriate';
  }

  private extractTopics(mentions: SocialMention[]): string[] {
    // Simple topic extraction - in production, use NLP
    const commonTopics = ['feature', 'price', 'support', 'bug', 'update', 'competitor'];
    const topicCounts: Record<string, number> = {};

    mentions.forEach(mention => {
      const text = mention.text.toLowerCase();
      commonTopics.forEach(topic => {
        if (text.includes(topic)) {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        }
      });
    });

    return Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
    return `${year}-W${week}`;
  }

  private calculateTrend(sentiments: { positive: number; negative: number; neutral: number }): string {
    const total = sentiments.positive + sentiments.negative + sentiments.neutral;
    const positiveRatio = sentiments.positive / total;
    if (positiveRatio > 0.6) return 'positive';
    if (positiveRatio < 0.3) return 'negative';
    return 'mixed';
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  // Mock data methods
  private getMockRedditMentions(productName: string): SocialMention[] {
    return [
      {
        text: `Just switched to ${productName} and the performance issues are killing me. Anyone else experiencing crashes?`,
        author: 'frustrated_user_123',
        platform: 'reddit',
        url: 'https://reddit.com/r/software/comments/mock1',
        date: new Date('2024-01-20'),
        engagement: { upvotes: 145, comments: 67 },
        sentiment: 'negative'
      },
      {
        text: `${productName} saved my business! The automation features are incredible.`,
        author: 'happy_entrepreneur',
        platform: 'reddit',
        url: 'https://reddit.com/r/startups/comments/mock2',
        date: new Date('2024-01-19'),
        engagement: { upvotes: 892, comments: 134 },
        sentiment: 'positive'
      },
      {
        text: `Comparing ${productName} to competitors - here's what I found...`,
        author: 'tech_reviewer',
        platform: 'reddit',
        url: 'https://reddit.com/r/technology/comments/mock3',
        date: new Date('2024-01-18'),
        engagement: { upvotes: 2341, comments: 298 },
        sentiment: 'neutral'
      }
    ];
  }

  private getMockTwitterMentions(productName: string): SocialMention[] {
    return [
      {
        text: `The new @${productName} update is 🔥 Finally fixed the sync issues!`,
        author: 'techie_sarah',
        platform: 'twitter',
        url: 'https://twitter.com/techie_sarah/status/mock1',
        date: new Date('2024-01-20'),
        engagement: { likes: 234, shares: 45, comments: 12 },
        sentiment: 'positive'
      },
      {
        text: `Why is @${productName} customer support so slow? Been waiting 3 days for a response 😤`,
        author: 'angry_customer',
        platform: 'twitter',
        url: 'https://twitter.com/angry_customer/status/mock2',
        date: new Date('2024-01-19'),
        engagement: { likes: 567, shares: 123, comments: 89 },
        sentiment: 'negative'
      }
    ];
  }

  private getMockTrustpilotData(): any {
    return {
      platform: 'trustpilot',
      reviews: [
        {
          text: 'Great product but overpriced for small businesses',
          rating: 3,
          date: new Date('2024-01-15'),
          author: 'John D.',
          verified: true
        }
      ],
      summary: {
        total_reviews: 1523,
        average_rating: 3.7,
        trust_score: 3.8
      }
    };
  }

  private getMockG2Data(productSlug: string): any {
    return {
      platform: 'g2',
      reviews: [],
      ratings: {
        overall: 4.2,
        ease_of_use: 4.0,
        customer_support: 3.5,
        value_for_money: 3.8
      },
      comparisons: ['Competitor A', 'Competitor B', 'Competitor C']
    };
  }

  private getMockProductHuntData(productSlug: string): any {
    return {
      platform: 'producthunt',
      upvotes: 1234,
      comments: [
        {
          text: 'This is exactly what I was looking for!',
          author: 'Hunter123',
          upvotes: 45,
          date: new Date('2024-01-10')
        }
      ],
      featured_date: '2024-01-01',
      makers: ['Founder Name']
    };
  }
}