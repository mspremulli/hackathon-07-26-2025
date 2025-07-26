import axios from 'axios';
import { FileStorage } from '../utils/file-storage';

interface FeedbackItem {
  text: string;
  author?: string;
  date: Date;
  source: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  engagement?: {
    likes?: number;
    replies?: number;
    views?: number;
  };
  url?: string;
}

export class ExtendedFeedbackAgent {
  private brightDataApiKey: string;
  private brightDataCustomerId: string;
  private storage: FileStorage;
  
  constructor() {
    this.brightDataApiKey = process.env.BRIGHT_DATA_API_KEY || '';
    this.brightDataCustomerId = process.env.BRIGHT_DATA_CUSTOMER_ID || '';
    this.storage = new FileStorage('./output');
  }

  /**
   * 1. GitHub Issues and Pull Request Comments
   */
  async scrapeGitHubFeedback(repoOwner: string, repoName: string): Promise<FeedbackItem[]> {
    console.log(`🐙 Scraping GitHub feedback for ${repoOwner}/${repoName}...`);
    
    try {
      const response = await axios.post(
        'https://api.brightdata.com/datasets/v3/trigger',
        {
          customer_id: this.brightDataCustomerId,
          collector: 'github_issues',
          params: {
            repository: `${repoOwner}/${repoName}`,
            include_prs: true,
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

      const feedback = response.data.map((item: any) => ({
        text: item.body || item.title,
        author: item.user,
        date: new Date(item.created_at),
        source: 'github',
        sentiment: this.analyzeSentiment(item.body || item.title),
        engagement: {
          replies: item.comments_count,
          likes: item.reactions?.total_count
        },
        url: item.html_url
      }));

      await this.storage.saveToFile({ repository: `${repoOwner}/${repoName}`, feedback }, 'github_feedback');
      return feedback;

    } catch (error) {
      console.error('GitHub scraping failed, using mock data:', error);
      return this.getMockGitHubFeedback(repoOwner, repoName);
    }
  }

  /**
   * 2. Discord Community Messages
   */
  async scrapeDiscordFeedback(serverId: string, channelIds: string[]): Promise<FeedbackItem[]> {
    console.log(`💬 Scraping Discord feedback from server ${serverId}...`);
    
    try {
      const response = await axios.post(
        'https://api.brightdata.com/datasets/v3/trigger',
        {
          customer_id: this.brightDataCustomerId,
          collector: 'discord_messages',
          params: {
            server_id: serverId,
            channel_ids: channelIds,
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

      const feedback = response.data.map((item: any) => ({
        text: item.content,
        author: item.author,
        date: new Date(item.timestamp),
        source: 'discord',
        sentiment: this.analyzeSentiment(item.content),
        engagement: {
          likes: item.reactions?.length || 0,
          replies: item.reply_count
        }
      }));

      await this.storage.saveToFile({ serverId, channelIds, feedback }, 'discord_feedback');
      return feedback;

    } catch (error) {
      console.error('Discord scraping failed, using mock data:', error);
      return this.getMockDiscordFeedback();
    }
  }

  /**
   * 3. YouTube Video Comments
   */
  async scrapeYouTubeComments(videoIds: string[]): Promise<FeedbackItem[]> {
    console.log(`📺 Scraping YouTube comments...`);
    
    try {
      const allComments: FeedbackItem[] = [];
      
      for (const videoId of videoIds) {
        const response = await axios.post(
          'https://api.brightdata.com/datasets/v3/trigger',
          {
            customer_id: this.brightDataCustomerId,
            collector: 'youtube_comments',
            params: {
              video_id: videoId,
              limit: 50,
              sort: 'relevance'
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${this.brightDataApiKey}`,
              'Content-Type': 'application/json',
            }
          }
        );

        const comments = response.data.map((item: any) => ({
          text: item.text,
          author: item.author,
          date: new Date(item.published_at),
          source: 'youtube',
          sentiment: this.analyzeSentiment(item.text),
          engagement: {
            likes: item.like_count,
            replies: item.reply_count
          },
          url: `https://youtube.com/watch?v=${videoId}`
        }));

        allComments.push(...comments);
      }

      await this.storage.saveToFile({ videoIds, comments: allComments }, 'youtube_feedback');
      return allComments;

    } catch (error) {
      console.error('YouTube scraping failed, using mock data:', error);
      return this.getMockYouTubeComments();
    }
  }

  /**
   * 4. LinkedIn Company Mentions
   */
  async scrapeLinkedInMentions(companyName: string): Promise<FeedbackItem[]> {
    console.log(`💼 Scraping LinkedIn mentions for ${companyName}...`);
    
    try {
      const response = await axios.post(
        'https://api.brightdata.com/datasets/v3/trigger',
        {
          customer_id: this.brightDataCustomerId,
          collector: 'linkedin_posts',
          params: {
            query: companyName,
            post_type: 'all',
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

      const feedback = response.data.map((item: any) => ({
        text: item.content,
        author: item.author_name,
        date: new Date(item.posted_at),
        source: 'linkedin',
        sentiment: this.analyzeSentiment(item.content),
        engagement: {
          likes: item.reactions_count,
          replies: item.comments_count,
          views: item.views_count
        },
        url: item.post_url
      }));

      await this.storage.saveToFile({ companyName, feedback }, 'linkedin_feedback');
      return feedback;

    } catch (error) {
      console.error('LinkedIn scraping failed, using mock data:', error);
      return this.getMockLinkedInFeedback(companyName);
    }
  }

  /**
   * 5. Stack Overflow Questions/Answers
   */
  async scrapeStackOverflow(tags: string[], productName: string): Promise<FeedbackItem[]> {
    console.log(`📚 Scraping Stack Overflow for ${productName}...`);
    
    try {
      const response = await axios.post(
        'https://api.brightdata.com/datasets/v3/trigger',
        {
          customer_id: this.brightDataCustomerId,
          collector: 'stackoverflow_questions',
          params: {
            tags: tags,
            query: productName,
            limit: 50,
            sort: 'votes'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.brightDataApiKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      const feedback = response.data.map((item: any) => ({
        text: `Q: ${item.title}\n${item.body}`,
        author: item.owner_name,
        date: new Date(item.creation_date),
        source: 'stackoverflow',
        sentiment: item.score > 0 ? 'positive' : 'negative',
        engagement: {
          likes: item.score,
          replies: item.answer_count,
          views: item.view_count
        },
        url: item.link
      }));

      await this.storage.saveToFile({ tags, productName, feedback }, 'stackoverflow_feedback');
      return feedback;

    } catch (error) {
      console.error('Stack Overflow scraping failed, using mock data:', error);
      return this.getMockStackOverflowFeedback(productName);
    }
  }

  /**
   * 6. Hacker News Discussions
   */
  async scrapeHackerNews(query: string): Promise<FeedbackItem[]> {
    console.log(`🔥 Scraping Hacker News for ${query}...`);
    
    try {
      const response = await axios.post(
        'https://api.brightdata.com/datasets/v3/trigger',
        {
          customer_id: this.brightDataCustomerId,
          collector: 'hackernews_search',
          params: {
            query: query,
            type: 'all',
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

      const feedback = response.data.map((item: any) => ({
        text: item.title || item.comment_text,
        author: item.author,
        date: new Date(item.created_at),
        source: 'hackernews',
        sentiment: this.analyzeSentiment(item.comment_text || item.title),
        engagement: {
          likes: item.points,
          replies: item.num_comments
        },
        url: `https://news.ycombinator.com/item?id=${item.objectID}`
      }));

      await this.storage.saveToFile({ query, feedback }, 'hackernews_feedback');
      return feedback;

    } catch (error) {
      console.error('Hacker News scraping failed, using mock data:', error);
      return this.getMockHackerNewsFeedback(query);
    }
  }

  /**
   * 7. Glassdoor Employee Reviews
   */
  async scrapeGlassdoor(companyName: string): Promise<FeedbackItem[]> {
    console.log(`🏢 Scraping Glassdoor reviews for ${companyName}...`);
    
    try {
      const response = await axios.post(
        'https://api.brightdata.com/datasets/v3/trigger',
        {
          customer_id: this.brightDataCustomerId,
          collector: 'glassdoor_reviews',
          params: {
            company: companyName,
            limit: 30
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.brightDataApiKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      const feedback = response.data.map((item: any) => ({
        text: `Pros: ${item.pros}\nCons: ${item.cons}`,
        author: item.job_title,
        date: new Date(item.review_date),
        source: 'glassdoor',
        sentiment: item.rating >= 3.5 ? 'positive' : 'negative',
        engagement: {
          likes: item.helpful_count
        }
      }));

      await this.storage.saveToFile({ companyName, feedback }, 'glassdoor_feedback');
      return feedback;

    } catch (error) {
      console.error('Glassdoor scraping failed, using mock data:', error);
      return this.getMockGlassdoorFeedback(companyName);
    }
  }

  /**
   * Aggregate all extended feedback sources
   */
  async scrapeAllExtendedSources(config: {
    github?: { owner: string; repo: string };
    discord?: { serverId: string; channelIds: string[] };
    youtube?: { videoIds: string[] };
    linkedin?: { companyName: string };
    stackoverflow?: { tags: string[]; productName: string };
    hackernews?: { query: string };
    glassdoor?: { companyName: string };
  }): Promise<{
    all_feedback: FeedbackItem[];
    by_source: Record<string, FeedbackItem[]>;
    insights: any;
  }> {
    const results: Record<string, FeedbackItem[]> = {};
    const allFeedback: FeedbackItem[] = [];

    const promises = [];

    if (config.github) {
      promises.push(
        this.scrapeGitHubFeedback(config.github.owner, config.github.repo)
          .then(data => {
            results.github = data;
            allFeedback.push(...data);
          })
      );
    }

    if (config.discord) {
      promises.push(
        this.scrapeDiscordFeedback(config.discord.serverId, config.discord.channelIds)
          .then(data => {
            results.discord = data;
            allFeedback.push(...data);
          })
      );
    }

    if (config.youtube) {
      promises.push(
        this.scrapeYouTubeComments(config.youtube.videoIds)
          .then(data => {
            results.youtube = data;
            allFeedback.push(...data);
          })
      );
    }

    if (config.linkedin) {
      promises.push(
        this.scrapeLinkedInMentions(config.linkedin.companyName)
          .then(data => {
            results.linkedin = data;
            allFeedback.push(...data);
          })
      );
    }

    if (config.stackoverflow) {
      promises.push(
        this.scrapeStackOverflow(config.stackoverflow.tags, config.stackoverflow.productName)
          .then(data => {
            results.stackoverflow = data;
            allFeedback.push(...data);
          })
      );
    }

    if (config.hackernews) {
      promises.push(
        this.scrapeHackerNews(config.hackernews.query)
          .then(data => {
            results.hackernews = data;
            allFeedback.push(...data);
          })
      );
    }

    if (config.glassdoor) {
      promises.push(
        this.scrapeGlassdoor(config.glassdoor.companyName)
          .then(data => {
            results.glassdoor = data;
            allFeedback.push(...data);
          })
      );
    }

    await Promise.all(promises);

    const fullResults = {
      all_feedback: allFeedback,
      by_source: results,
      insights: this.generateExtendedInsights(allFeedback, results)
    };

    await this.storage.saveToFile(fullResults, 'extended_feedback_analysis');
    return fullResults;
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const lower = text.toLowerCase();
    const positiveWords = ['great', 'excellent', 'love', 'amazing', 'perfect', 'best'];
    const negativeWords = ['bad', 'terrible', 'hate', 'worst', 'awful', 'broken'];
    
    const positiveCount = positiveWords.filter(word => lower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lower.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private generateExtendedInsights(allFeedback: FeedbackItem[], bySource: Record<string, FeedbackItem[]>) {
    const totalEngagement = allFeedback.reduce((sum, item) => {
      const engagement = item.engagement || {};
      return sum + (engagement.likes || 0) + (engagement.replies || 0);
    }, 0);

    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    allFeedback.forEach(item => {
      if (item.sentiment) sentimentCounts[item.sentiment]++;
    });

    const mostEngaged = [...allFeedback]
      .sort((a, b) => {
        const aEngagement = (a.engagement?.likes || 0) + (a.engagement?.replies || 0);
        const bEngagement = (b.engagement?.likes || 0) + (b.engagement?.replies || 0);
        return bEngagement - aEngagement;
      })
      .slice(0, 3);

    return {
      total_feedback_items: allFeedback.length,
      sources_analyzed: Object.keys(bySource),
      total_engagement: totalEngagement,
      sentiment_distribution: sentimentCounts,
      most_engaged_content: mostEngaged.map(item => ({
        source: item.source,
        text: item.text.substring(0, 100) + '...',
        engagement: item.engagement
      })),
      source_breakdown: Object.entries(bySource).map(([source, items]) => ({
        source,
        count: items.length,
        avg_sentiment: this.calculateAverageSentiment(items)
      }))
    };
  }

  private calculateAverageSentiment(items: FeedbackItem[]): string {
    const scores = items.map(item => {
      if (item.sentiment === 'positive') return 1;
      if (item.sentiment === 'negative') return -1;
      return 0;
    });
    
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg > 0.3) return 'mostly positive';
    if (avg < -0.3) return 'mostly negative';
    return 'mixed';
  }

  // Mock data methods
  private async getMockGitHubFeedback(owner: string, repo: string): Promise<FeedbackItem[]> {
    const mockData = [
      {
        text: "The new API is breaking backwards compatibility. This is a major issue for enterprise users.",
        author: "enterprise-user",
        date: new Date('2024-01-20'),
        source: 'github' as const,
        sentiment: 'negative' as const,
        engagement: { replies: 23, likes: 45 },
        url: `https://github.com/${owner}/${repo}/issues/123`
      },
      {
        text: "Great work on the performance improvements! Seeing 3x faster load times.",
        author: "happy-dev",
        date: new Date('2024-01-19'),
        source: 'github' as const,
        sentiment: 'positive' as const,
        engagement: { replies: 12, likes: 67 },
        url: `https://github.com/${owner}/${repo}/issues/124`
      }
    ];
    
    await this.storage.saveToFile({ repository: `${owner}/${repo}`, feedback: mockData }, 'github_feedback_mock');
    return mockData;
  }

  private async getMockDiscordFeedback(): Promise<FeedbackItem[]> {
    const mockData = [
      {
        text: "Anyone else having issues with the mobile app crashing?",
        author: "user123",
        date: new Date('2024-01-20'),
        source: 'discord' as const,
        sentiment: 'negative' as const,
        engagement: { likes: 5, replies: 12 }
      },
      {
        text: "The new feature is amazing! Finally what we've been waiting for",
        author: "poweruser",
        date: new Date('2024-01-19'),
        source: 'discord' as const,
        sentiment: 'positive' as const,
        engagement: { likes: 34, replies: 8 }
      }
    ];
    
    await this.storage.saveToFile({ feedback: mockData }, 'discord_feedback_mock');
    return mockData;
  }

  private async getMockYouTubeComments(): Promise<FeedbackItem[]> {
    const mockData = [
      {
        text: "This tutorial saved me hours of debugging. Thank you!",
        author: "DevTutorials",
        date: new Date('2024-01-18'),
        source: 'youtube' as const,
        sentiment: 'positive' as const,
        engagement: { likes: 234, replies: 45 },
        url: "https://youtube.com/watch?v=abc123"
      },
      {
        text: "The audio quality is terrible, can barely hear the explanation",
        author: "Viewer99",
        date: new Date('2024-01-17'),
        source: 'youtube' as const,
        sentiment: 'negative' as const,
        engagement: { likes: 12, replies: 3 }
      }
    ];
    
    await this.storage.saveToFile({ comments: mockData }, 'youtube_feedback_mock');
    return mockData;
  }

  private async getMockLinkedInFeedback(companyName: string): Promise<FeedbackItem[]> {
    const mockData = [
      {
        text: `Impressed by ${companyName}'s commitment to sustainability. More tech companies should follow their lead.`,
        author: "Tech Executive",
        date: new Date('2024-01-20'),
        source: 'linkedin' as const,
        sentiment: 'positive' as const,
        engagement: { likes: 567, replies: 89, views: 12000 }
      },
      {
        text: `Former employees of ${companyName} - what was your experience with work-life balance?`,
        author: "HR Professional",
        date: new Date('2024-01-19'),
        source: 'linkedin' as const,
        sentiment: 'neutral' as const,
        engagement: { likes: 234, replies: 156, views: 8900 }
      }
    ];
    
    await this.storage.saveToFile({ companyName, feedback: mockData }, 'linkedin_feedback_mock');
    return mockData;
  }

  private async getMockStackOverflowFeedback(productName: string): Promise<FeedbackItem[]> {
    const mockData = [
      {
        text: `Q: How to fix memory leak in ${productName} v3.0?\nI'm seeing constant memory growth when using the streaming API...`,
        author: "developer123",
        date: new Date('2024-01-18'),
        source: 'stackoverflow' as const,
        sentiment: 'negative' as const,
        engagement: { likes: 45, replies: 12, views: 2340 },
        url: "https://stackoverflow.com/questions/12345"
      },
      {
        text: `Q: Best practices for ${productName} authentication?\nWhat's the recommended approach for handling OAuth2...`,
        author: "security-focused",
        date: new Date('2024-01-17'),
        source: 'stackoverflow' as const,
        sentiment: 'neutral' as const,
        engagement: { likes: 89, replies: 23, views: 5670 }
      }
    ];
    
    await this.storage.saveToFile({ productName, feedback: mockData }, 'stackoverflow_feedback_mock');
    return mockData;
  }

  private async getMockHackerNewsFeedback(query: string): Promise<FeedbackItem[]> {
    const mockData = [
      {
        text: `${query} is overhyped. We tried it and went back to our old solution after 2 months.`,
        author: "skeptical_dev",
        date: new Date('2024-01-20'),
        source: 'hackernews' as const,
        sentiment: 'negative' as const,
        engagement: { likes: 234, replies: 89 },
        url: "https://news.ycombinator.com/item?id=38912345"
      },
      {
        text: `We've been using ${query} in production for 6 months. Rock solid and great performance.`,
        author: "cto_startup",
        date: new Date('2024-01-19'),
        source: 'hackernews' as const,
        sentiment: 'positive' as const,
        engagement: { likes: 456, replies: 123 }
      }
    ];
    
    await this.storage.saveToFile({ query, feedback: mockData }, 'hackernews_feedback_mock');
    return mockData;
  }

  private async getMockGlassdoorFeedback(companyName: string): Promise<FeedbackItem[]> {
    const mockData = [
      {
        text: "Pros: Great benefits and learning opportunities\nCons: Long hours and high pressure environment",
        author: "Software Engineer",
        date: new Date('2024-01-15'),
        source: 'glassdoor' as const,
        sentiment: 'neutral' as const,
        engagement: { likes: 45 }
      },
      {
        text: "Pros: Innovation-focused culture\nCons: Management needs improvement, unclear career progression",
        author: "Product Manager",
        date: new Date('2024-01-14'),
        source: 'glassdoor' as const,
        sentiment: 'negative' as const,
        engagement: { likes: 67 }
      }
    ];
    
    await this.storage.saveToFile({ companyName, feedback: mockData }, 'glassdoor_feedback_mock');
    return mockData;
  }
}