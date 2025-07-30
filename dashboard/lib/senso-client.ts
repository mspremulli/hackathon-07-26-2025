// Simple client to connect to our Senso.ai Context OS
import { getSensoClient } from '../../src/integrations/senso-client';

export interface FeedbackData {
  id: string;
  source: string;
  type: string;
  timestamp: Date;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
  rating?: number;
  content?: string;
  metadata?: any;
  tags?: string[];
}

export interface DashboardStats {
  totalFeedback: number;
  averageRating: number;
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
  };
  sourceBreakdown: Record<string, number>;
  recentTrends: {
    date: string;
    positive: number;
    negative: number;
    total: number;
  }[];
  topIssues: {
    issue: string;
    count: number;
    sentiment: string;
  }[];
}

class DashboardSensoClient {
  private client = getSensoClient();

  async getRecentFeedback(limit: number = 50): Promise<FeedbackData[]> {
    const contexts = await this.client.queryContexts({
      limit,
      types: ['reviews', 'posts', 'feedback']
    });

    return contexts.map(ctx => ({
      id: ctx.id || `${ctx.source}-${Date.now()}`,
      source: ctx.source,
      type: ctx.type,
      timestamp: new Date(ctx.timestamp || Date.now()),
      sentiment: ctx.metadata?.sentiment,
      rating: ctx.metadata?.rating || ctx.data?.rating,
      content: ctx.data?.content || ctx.data?.reviews?.[0]?.content || ctx.data?.text,
      metadata: ctx.metadata,
      tags: ctx.tags
    }));
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const allFeedback = await this.getRecentFeedback(1000);
    
    // Calculate statistics
    const sentimentBreakdown = {
      positive: 0,
      negative: 0,
      neutral: 0,
      mixed: 0
    };

    const sourceBreakdown: Record<string, number> = {};
    let totalRating = 0;
    let ratingCount = 0;

    allFeedback.forEach(feedback => {
      // Sentiment
      if (feedback.sentiment) {
        sentimentBreakdown[feedback.sentiment]++;
      }

      // Source
      sourceBreakdown[feedback.source] = (sourceBreakdown[feedback.source] || 0) + 1;

      // Rating
      if (feedback.rating) {
        totalRating += feedback.rating;
        ratingCount++;
      }
    });

    // Calculate trends (last 7 days)
    const now = new Date();
    const recentTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayFeedback = allFeedback.filter(f => 
        f.timestamp.toISOString().split('T')[0] === dateStr
      );

      recentTrends.push({
        date: dateStr,
        positive: dayFeedback.filter(f => f.sentiment === 'positive').length,
        negative: dayFeedback.filter(f => f.sentiment === 'negative').length,
        total: dayFeedback.length
      });
    }

    // Mock top issues for now
    const topIssues = [
      { issue: 'App Performance', count: 45, sentiment: 'negative' },
      { issue: 'User Interface', count: 32, sentiment: 'mixed' },
      { issue: 'New Features', count: 28, sentiment: 'positive' },
      { issue: 'Customer Support', count: 21, sentiment: 'negative' },
      { issue: 'Pricing', count: 19, sentiment: 'mixed' }
    ];

    return {
      totalFeedback: allFeedback.length,
      averageRating: ratingCount > 0 ? totalRating / ratingCount : 0,
      sentimentBreakdown,
      sourceBreakdown,
      recentTrends,
      topIssues
    };
  }

  async getContextWindow(options?: any): Promise<string> {
    return this.client.createContextWindow(options || {
      sources: ['app_store', 'reddit'],
      types: ['reviews', 'posts'],
      maxTokens: 4000
    });
  }
}

export const dashboardClient = new DashboardSensoClient();