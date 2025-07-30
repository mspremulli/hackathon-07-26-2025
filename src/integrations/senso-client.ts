import axios from 'axios';

interface SensoConfig {
  apiKey: string;
  baseUrl: string;
  namespace: string;
}

interface ContextData {
  id?: string;
  source: string;
  type: string;
  data: any;
  metadata?: any;
  timestamp?: Date;
  tags?: string[];
}

interface QueryOptions {
  sources?: string[];
  types?: string[];
  tags?: string[];
  limit?: number;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Senso.ai Client for Context Storage and Management
 * This is the "Context OS" for storing and retrieving agent data
 */
export class SensoClient {
  private config: SensoConfig;
  
  constructor(config?: Partial<SensoConfig>) {
    this.config = {
      apiKey: process.env.SENSOAI_API_KEY || process.env.SENSO_API_KEY || 'demo-key',
      baseUrl: process.env.SENSO_BASE_URL || 'https://api.senso.ai',
      namespace: process.env.SENSO_NAMESPACE || 'coo-eir-assistant',
      ...config
    };
    
    // Log connection info
    console.log('🔐 Senso.ai Client initialized');
    console.log('API Key:', this.config.apiKey.substring(0, 10) + '...');
    console.log('Base URL:', this.config.baseUrl);
    console.log('Namespace:', this.config.namespace);
  }

  /**
   * Store context data in Senso.ai
   * NOTE: Currently using local storage fallback until Senso.ai API documentation is available
   */
  async storeContext(context: ContextData): Promise<string> {
    // For now, we'll use local storage as Senso.ai API endpoints are not publicly documented
    // The API key format (tgr_xxx) suggests it's valid but endpoints return 401/404
    // This maintains functionality while we await proper API documentation
    
    if (this.config.apiKey && this.config.apiKey !== 'demo-key') {
      console.log('📝 Note: Senso.ai API key detected but API endpoints not accessible');
      console.log('Using local Context OS storage (fully functional for hackathon demo)');
    }
    
    return this.simulateStore(context);
  }

  /**
   * Store multiple contexts in batch
   * NOTE: Currently using local storage fallback
   */
  async storeBatch(contexts: ContextData[]): Promise<string[]> {
    // Using local storage until Senso.ai API is properly documented
    return Promise.all(contexts.map(c => this.simulateStore(c)));
  }

  /**
   * Query contexts from Senso.ai
   * NOTE: Currently using local storage fallback
   */
  async queryContexts(options: QueryOptions = {}): Promise<ContextData[]> {
    // Using local storage until Senso.ai API is properly documented
    return this.simulateQuery(options);
  }

  /**
   * Get context by ID
   * NOTE: Currently using local storage fallback
   */
  async getContext(id: string): Promise<ContextData | null> {
    // Using local storage until Senso.ai API is properly documented
    return this.localStore.get(id) || null;
  }

  /**
   * Create a context window for AI agents
   * NOTE: Currently using local storage fallback
   */
  async createContextWindow(options: {
    sources?: string[];
    types?: string[];
    maxTokens?: number;
    relevanceThreshold?: number;
  }): Promise<string> {
    // Using local storage until Senso.ai API is properly documented
    const contexts = await this.queryContexts({
      sources: options.sources,
      types: options.types,
      limit: 50
    });
    
    console.log(`✅ Created context window with ${contexts.length} contexts`);
    return this.formatContextWindow(contexts);
  }

  /**
   * Format contexts into a window for AI consumption
   */
  private formatContextWindow(contexts: ContextData[]): string {
    return contexts.map(ctx => {
      return `[${ctx.source}/${ctx.type}] ${new Date(ctx.timestamp!).toISOString()}\n${JSON.stringify(ctx.data, null, 2)}`;
    }).join('\n\n---\n\n');
  }

  /**
   * Local storage simulation (fallback)
   */
  private localStore: Map<string, ContextData> = new Map();
  
  private simulateStore(context: ContextData): string {
    const id = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.localStore.set(id, { ...context, id });
    console.log(`📁 Stored locally (Senso.ai unavailable): ${id}`);
    return id;
  }
  
  private simulateQuery(options: QueryOptions): ContextData[] {
    const contexts = Array.from(this.localStore.values());
    
    return contexts.filter(ctx => {
      if (options.sources && !options.sources.includes(ctx.source)) return false;
      if (options.types && !options.types.includes(ctx.type)) return false;
      if (options.tags && !options.tags.some(tag => ctx.tags?.includes(tag))) return false;
      return true;
    }).slice(0, options.limit || 100);
  }
}

// Singleton instance
let sensoClient: SensoClient | null = null;

export function getSensoClient(config?: Partial<SensoConfig>): SensoClient {
  if (!sensoClient) {
    sensoClient = new SensoClient(config);
  }
  return sensoClient;
}