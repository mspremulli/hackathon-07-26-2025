/**
 * Senso.ai as primary data storage and context management
 * Replaces MongoDB for the hackathon
 */

import axios from 'axios';

interface SensoConfig {
  apiKey: string;
  workspace?: string;
}

interface SensoDocument {
  id?: string;
  type: string;
  data: any;
  metadata?: {
    source?: string;
    timestamp?: Date;
    confidence?: number;
    tags?: string[];
    relationships?: string[];
  };
}

export class SensoStorageService {
  private apiKey: string;
  private baseUrl = 'https://api.senso.ai/v1';
  private workspace: string;
  
  constructor(config: SensoConfig) {
    this.apiKey = config.apiKey || process.env.SENSOAI_API_KEY || '';
    this.workspace = config.workspace || 'coo-assistant';
  }
  
  /**
   * Store review analysis results in Senso
   */
  async storeReviewAnalysis(analysis: any): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/ingest`,
        {
          workspace: this.workspace,
          documents: [{
            type: 'review_analysis',
            data: {
              app_name: analysis.app_name,
              platform: analysis.platform,
              total_reviews: analysis.total_reviews,
              average_rating: analysis.average_rating,
              sentiment: analysis.sentiment,
              top_issues: analysis.top_issues,
              insights: analysis.insights
            },
            metadata: {
              source: 'brightdata',
              timestamp: new Date(),
              confidence: 0.85,
              tags: ['customer_feedback', 'app_reviews', analysis.platform],
              relationships: analysis.competitor_ids || []
            }
          }]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.document_ids[0];
    } catch (error) {
      console.error('Senso storage error:', error);
      throw error;
    }
  }
  
  /**
   * Store social media mentions
   */
  async storeSocialMentions(mentions: any[]): Promise<string[]> {
    const documents = mentions.map(mention => ({
      type: 'social_mention',
      data: mention,
      metadata: {
        source: mention.platform,
        timestamp: mention.date,
        tags: ['social_media', mention.platform, mention.sentiment],
        confidence: mention.confidence || 0.7
      }
    }));
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/ingest`,
        {
          workspace: this.workspace,
          documents: documents
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.document_ids;
    } catch (error) {
      console.error('Senso storage error:', error);
      throw error;
    }
  }
  
  /**
   * Store learned patterns for continuous improvement
   */
  async storeLearnedPattern(pattern: {
    pattern_type: string;
    description: string;
    evidence: any;
    success_rate: number;
    recommendation: string;
  }): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/ingest`,
        {
          workspace: this.workspace,
          documents: [{
            type: 'learned_pattern',
            data: pattern,
            metadata: {
              source: 'continuous_learning',
              timestamp: new Date(),
              confidence: pattern.success_rate,
              tags: ['ml_pattern', 'improvement', pattern.pattern_type],
              schema_version: '1.0'
            }
          }]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.document_ids[0];
    } catch (error) {
      console.error('Senso pattern storage error:', error);
      throw error;
    }
  }
  
  /**
   * Query historical data with context window management
   */
  async queryHistoricalData(params: {
    type?: string;
    time_range?: string;
    tags?: string[];
    limit?: number;
  }): Promise<any[]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/query`,
        {
          workspace: this.workspace,
          filter: {
            type: params.type,
            time_range: params.time_range || '30d',
            tags: params.tags
          },
          limit: params.limit || 100,
          include_metadata: true
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.documents;
    } catch (error) {
      console.error('Senso query error:', error);
      return [];
    }
  }
  
  /**
   * Find similar patterns using Senso's vector search
   */
  async findSimilarPatterns(query: string, limit: number = 5): Promise<any[]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/search`,
        {
          workspace: this.workspace,
          query: query,
          search_type: 'semantic',
          limit: limit,
          filter: {
            type: 'learned_pattern'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.results;
    } catch (error) {
      console.error('Senso similarity search error:', error);
      return [];
    }
  }
  
  /**
   * Synthesize insights across multiple data sources
   */
  async synthesizeInsights(sources: string[]): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/synthesize`,
        {
          workspace: this.workspace,
          sources: sources,
          synthesis_type: 'cross_correlation',
          include_recommendations: true
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.synthesis;
    } catch (error) {
      console.error('Senso synthesis error:', error);
      return null;
    }
  }
  
  /**
   * Update document with outcome for learning
   */
  async updateWithOutcome(documentId: string, outcome: {
    success: boolean;
    metrics_improved: any;
    user_feedback?: string;
  }): Promise<void> {
    try {
      await axios.patch(
        `${this.baseUrl}/documents/${documentId}`,
        {
          workspace: this.workspace,
          update: {
            outcome: outcome,
            outcome_recorded_at: new Date(),
            learning_applied: true
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Senso update error:', error);
    }
  }
  
  /**
   * Get aggregated metrics for dashboard
   */
  async getAggregatedMetrics(timeRange: string = '7d'): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/aggregate`,
        {
          workspace: this.workspace,
          aggregations: [
            {
              name: 'sentiment_trend',
              field: 'data.sentiment',
              type: 'time_series',
              interval: 'day'
            },
            {
              name: 'issue_frequency',
              field: 'data.top_issues',
              type: 'terms',
              size: 10
            },
            {
              name: 'success_rate',
              field: 'outcome.success',
              type: 'percentage'
            }
          ],
          time_range: timeRange
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.aggregations;
    } catch (error) {
      console.error('Senso aggregation error:', error);
      return {};
    }
  }
}

// Singleton instance
let sensoInstance: SensoStorageService;

export function getSensoStorage(): SensoStorageService {
  if (!sensoInstance) {
    sensoInstance = new SensoStorageService({
      apiKey: process.env.SENSOAI_API_KEY || '',
      workspace: 'coo-assistant'
    });
  }
  return sensoInstance;
}

// Helper functions for easy migration from MongoDB
export async function saveToSenso(type: string, data: any): Promise<string> {
  const senso = getSensoStorage();
  
  switch (type) {
    case 'review_analysis':
      return senso.storeReviewAnalysis(data);
    case 'social_mentions':
      return senso.storeSocialMentions(data);
    case 'learned_pattern':
      return senso.storeLearnedPattern(data);
    default:
      // Generic storage
      const response = await axios.post(
        'https://api.senso.ai/v1/ingest',
        {
          workspace: 'coo-assistant',
          documents: [{
            type: type,
            data: data,
            metadata: {
              timestamp: new Date(),
              source: 'coo_assistant'
            }
          }]
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.SENSOAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data.document_ids[0];
  }
}