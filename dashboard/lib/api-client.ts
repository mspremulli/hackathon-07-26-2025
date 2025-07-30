// Simple API client for the dashboard
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

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

export const apiClient = {
  async getRecentFeedback(limit: number = 50): Promise<FeedbackData[]> {
    const response = await axios.get(`${API_BASE_URL}/api/senso/feedback`, {
      params: { limit }
    });
    return response.data;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await axios.get(`${API_BASE_URL}/api/senso/stats`);
    return response.data;
  },

  async triggerScrape(config?: any): Promise<any> {
    const response = await axios.post(`${API_BASE_URL}/api/scrape`, config || {});
    return response.data;
  }
};