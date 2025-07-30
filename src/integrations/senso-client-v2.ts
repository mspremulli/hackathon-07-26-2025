import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

interface SensoResponse {
  summary?: string;
  text?: string;
  insights?: string[];
  recommendations?: string[];
  metrics?: any;
}

/**
 * Senso.ai Client - Based on working implementation
 */
export class SensoClientV2 {
  private apiKey: string;
  private baseUrl: string;
  
  constructor() {
    this.apiKey = process.env.SENSOAI_API_KEY || '';
    this.baseUrl = 'https://api.senso.ai/v1';
    
    if (!this.apiKey) {
      console.warn('⚠️  SENSOAI_API_KEY not found in environment');
    }
  }

  /**
   * Generate a summary using Senso.ai
   */
  async summarize(data: any, prompt?: string): Promise<SensoResponse> {
    try {
      const defaultPrompt = `Summarize this business feedback data focusing on:
1. Overall sentiment and key themes
2. Most critical issues to address
3. Recommended actions for improvement
4. Key metrics and insights`;

      const response = await axios.post(
        `${this.baseUrl}/summarize`,
        {
          prompt: prompt || defaultPrompt,
          data: JSON.stringify(data),
          model: 'senso-1',
          temperature: 0.3,
          max_tokens: 2000,
          format: 'structured'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );
      
      console.log('✅ Senso.ai summary generated successfully');
      return response.data;
      
    } catch (error: any) {
      console.error('Senso.ai error:', error.response?.status, error.response?.data);
      throw error;
    }
  }

  /**
   * Store context data (if supported)
   */
  async storeContext(data: any): Promise<string> {
    // First try to use summarize endpoint to verify connection
    try {
      const summary = await this.summarize({
        test: true,
        data: data,
        purpose: 'context_storage'
      }, 'Store this context for future use');
      
      return `senso-${Date.now()}`; // Return a pseudo ID
    } catch (error) {
      throw new Error('Context storage not directly supported, use summarize endpoint');
    }
  }
}

// Export singleton
let client: SensoClientV2 | null = null;

export function getSensoClientV2(): SensoClientV2 {
  if (!client) {
    client = new SensoClientV2();
  }
  return client;
}