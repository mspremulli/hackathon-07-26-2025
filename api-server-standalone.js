const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000;

// Enable CORS for dashboard
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware
app.use((req, res, next) => {
  if (req.method !== 'GET') {
    console.log(`${req.method} ${req.url}`);
  }
  next();
});

// In-memory storage for contexts (simulating Senso.ai)
const contextStore = new Map();

// Initialize with some demo data
function initializeDemoData() {
  const demoContexts = [
    {
      id: 'demo-1',
      source: 'app_store',
      type: 'reviews',
      timestamp: new Date(),
      metadata: { sentiment: 'positive', rating: 5 },
      data: { content: 'Amazing app! The new update fixed all my issues. WhatsApp is now faster than ever.' },
      tags: ['real-data', 'whatsapp', 'positive-feedback']
    },
    {
      id: 'demo-2',
      source: 'reddit',
      type: 'posts',
      timestamp: new Date(Date.now() - 3600000),
      metadata: { sentiment: 'mixed' },
      data: { content: 'WhatsApp is great for messaging but I wish they had better desktop support. The web version is too limited.' },
      tags: ['real-data', 'feature-request', 'desktop']
    },
    {
      id: 'demo-3',
      source: 'app_store',
      type: 'reviews',
      timestamp: new Date(Date.now() - 7200000),
      metadata: { sentiment: 'negative', rating: 2 },
      data: { content: 'App keeps crashing after the latest update. Please fix this ASAP!' },
      tags: ['real-data', 'bug-report', 'crash']
    },
    {
      id: 'demo-4',
      source: 'reddit',
      type: 'posts',
      timestamp: new Date(Date.now() - 10800000),
      metadata: { sentiment: 'positive' },
      data: { content: 'Just discovered WhatsApp communities feature - this is a game changer for organizing groups!' },
      tags: ['real-data', 'feature-discovery', 'communities']
    },
    {
      id: 'demo-5',
      source: 'google_play',
      type: 'reviews',
      timestamp: new Date(Date.now() - 14400000),
      metadata: { sentiment: 'positive', rating: 4 },
      data: { content: 'Good app overall. Voice calls are crystal clear. Just needs better file sharing options.' },
      tags: ['mock-data', 'voice-calls', 'file-sharing']
    }
  ];

  // Store demo contexts
  demoContexts.forEach(ctx => contextStore.set(ctx.id, ctx));

  // Generate more varied demo data
  const sources = ['app_store', 'reddit', 'google_play', 'twitter', 'glassdoor'];
  const sentiments = ['positive', 'negative', 'neutral', 'mixed'];
  const issues = [
    'App Performance', 'User Interface', 'Battery Drain', 'Privacy Concerns',
    'Feature Request', 'Bug Report', 'Customer Support', 'Pricing'
  ];

  for (let i = 0; i < 50; i++) {
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    const issue = issues[Math.floor(Math.random() * issues.length)];
    
    const ctx = {
      id: `generated-${i}`,
      source: source,
      type: source === 'reddit' || source === 'twitter' ? 'posts' : 'reviews',
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
      metadata: {
        sentiment: sentiment,
        rating: source.includes('store') || source.includes('play') ? Math.floor(Math.random() * 5) + 1 : undefined,
        issue: issue
      },
      data: {
        content: `Sample ${sentiment} feedback about ${issue}. This is ${source === 'app_store' || source === 'reddit' ? 'real' : 'mock'} data.`
      },
      tags: [
        source === 'app_store' || source === 'reddit' ? 'real-data' : 'mock-data',
        issue.toLowerCase().replace(' ', '-'),
        sentiment
      ]
    };
    
    contextStore.set(ctx.id, ctx);
  }
}

// Initialize data on startup
initializeDemoData();

// API Routes

// Get recent feedback
app.get('/api/senso/feedback', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    // Get all contexts and sort by timestamp
    const allContexts = Array.from(contextStore.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    const feedback = allContexts.map(ctx => ({
      id: ctx.id,
      source: ctx.source,
      type: ctx.type,
      timestamp: ctx.timestamp,
      sentiment: ctx.metadata?.sentiment,
      rating: ctx.metadata?.rating,
      content: ctx.data?.content,
      metadata: ctx.metadata,
      tags: ctx.tags
    }));

    res.json(feedback);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard statistics
app.get('/api/senso/stats', (req, res) => {
  try {
    const allContexts = Array.from(contextStore.values());
    
    // Calculate real statistics
    const sentimentBreakdown = {
      positive: 0,
      negative: 0,
      neutral: 0,
      mixed: 0
    };

    const sourceBreakdown = {};
    const issueCount = {};
    let totalRating = 0;
    let ratingCount = 0;

    allContexts.forEach(ctx => {
      // Sentiment
      if (ctx.metadata?.sentiment) {
        sentimentBreakdown[ctx.metadata.sentiment]++;
      }

      // Source
      sourceBreakdown[ctx.source] = (sourceBreakdown[ctx.source] || 0) + 1;

      // Issues
      if (ctx.metadata?.issue) {
        issueCount[ctx.metadata.issue] = (issueCount[ctx.metadata.issue] || 0) + 1;
      }

      // Rating
      if (ctx.metadata?.rating) {
        totalRating += ctx.metadata.rating;
        ratingCount++;
      }
    });

    // Calculate trends for last 7 days
    const recentTrends = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayContexts = allContexts.filter(ctx => 
        new Date(ctx.timestamp).toISOString().split('T')[0] === dateStr
      );

      recentTrends.push({
        date: dateStr,
        positive: dayContexts.filter(ctx => ctx.metadata?.sentiment === 'positive').length,
        negative: dayContexts.filter(ctx => ctx.metadata?.sentiment === 'negative').length,
        total: dayContexts.length
      });
    }

    // Get top issues
    const topIssues = Object.entries(issueCount)
      .map(([issue, count]) => ({
        issue,
        count,
        sentiment: allContexts
          .filter(ctx => ctx.metadata?.issue === issue)
          .reduce((acc, ctx) => {
            const s = ctx.metadata?.sentiment;
            return s === 'negative' ? 'negative' : 
                   s === 'positive' ? 'positive' : 'mixed';
          }, 'mixed')
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      totalFeedback: allContexts.length,
      averageRating: ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0,
      sentimentBreakdown,
      sourceBreakdown,
      recentTrends,
      topIssues
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trigger a new scraping run (simulation)
app.post('/api/scrape', (req, res) => {
  try {
    console.log('🚀 Simulating new scraping run...');
    
    // Add some new contexts to simulate scraping
    const newContexts = [
      {
        id: `scrape-${Date.now()}-1`,
        source: 'app_store',
        type: 'reviews',
        timestamp: new Date(),
        metadata: { sentiment: 'positive', rating: 5 },
        data: { content: 'Just scraped: Love this app!' },
        tags: ['real-data', 'fresh-scrape']
      },
      {
        id: `scrape-${Date.now()}-2`,
        source: 'reddit',
        type: 'posts',
        timestamp: new Date(),
        metadata: { sentiment: 'mixed' },
        data: { content: 'Just scraped: WhatsApp vs Signal debate continues...' },
        tags: ['real-data', 'fresh-scrape']
      }
    ];

    newContexts.forEach(ctx => contextStore.set(ctx.id, ctx));
    
    res.json({
      success: true,
      message: 'Scraping simulation completed! Added fresh data to Context OS.',
      summary: {
        total_sources: 5,
        real_data_sources: ['app_store', 'reddit'],
        mock_data_sources: ['google_play', 'twitter', 'glassdoor'],
        new_contexts_added: newContexts.length
      }
    });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get context window (for AI agents)
app.get('/api/senso/context-window', (req, res) => {
  try {
    const sources = req.query.sources ? req.query.sources.split(',') : null;
    const limit = parseInt(req.query.limit) || 10;
    
    let contexts = Array.from(contextStore.values());
    
    if (sources) {
      contexts = contexts.filter(ctx => sources.includes(ctx.source));
    }
    
    contexts = contexts
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    const contextWindow = contexts.map(ctx => 
      `[${ctx.source}/${ctx.type}] ${new Date(ctx.timestamp).toISOString()}\n` +
      `Sentiment: ${ctx.metadata?.sentiment || 'unknown'}\n` +
      `Content: ${ctx.data?.content || 'No content'}\n` +
      `Tags: ${ctx.tags?.join(', ') || 'None'}`
    ).join('\n\n---\n\n');

    res.json({ 
      contextWindow,
      contextCount: contexts.length,
      sources: [...new Set(contexts.map(c => c.source))]
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle CSV upload from dashboard
app.post('/api/upload/csv', (req, res) => {
  console.log('📊 CSV upload endpoint hit!');
  try {
    const { contexts } = req.body;
    console.log('Received contexts:', contexts?.length || 0);
    
    if (!contexts || !Array.isArray(contexts)) {
      return res.status(400).json({ error: 'Invalid contexts data' });
    }
    
    // Store uploaded contexts
    contexts.forEach(ctx => {
      contextStore.set(ctx.id, ctx);
    });
    
    console.log(`📊 Stored ${contexts.length} rows from CSV upload`);
    
    res.json({ 
      success: true, 
      message: `Stored ${contexts.length} contexts from CSV`,
      totalContexts: contextStore.size 
    });
  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle Google Analytics data
app.post('/api/upload/google-analytics', (req, res) => {
  try {
    const { data } = req.body;
    
    // Simulate processing Google Analytics data
    const gaContexts = [
      {
        id: `ga-${Date.now()}-1`,
        source: 'google_analytics',
        type: 'metrics',
        timestamp: new Date(),
        data: {
          metric: 'User Engagement',
          value: '85%',
          trend: '+12%'
        },
        metadata: {
          sentiment: 'positive',
          category: 'engagement'
        },
        tags: ['google-analytics', 'metrics', 'engagement']
      },
      {
        id: `ga-${Date.now()}-2`,
        source: 'google_analytics',
        type: 'metrics',
        timestamp: new Date(),
        data: {
          metric: 'Bounce Rate',
          value: '35%',
          trend: '-5%'
        },
        metadata: {
          sentiment: 'positive',
          category: 'performance'
        },
        tags: ['google-analytics', 'metrics', 'bounce-rate']
      }
    ];
    
    gaContexts.forEach(ctx => contextStore.set(ctx.id, ctx));
    
    console.log(`📈 Integrated Google Analytics data`);
    
    res.json({ 
      success: true, 
      message: 'Google Analytics data integrated successfully',
      metricsAdded: gaContexts.length
    });
  } catch (error) {
    console.error('GA upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    contextsStored: contextStore.size,
    uptime: process.uptime()
  });
});

app.listen(port, () => {
  console.log(`
🚀 COO/EIR Assistant API Server Running
======================================
This server simulates the Senso.ai Context OS with:
- ${contextStore.size} contexts pre-loaded
- Real-time statistics calculation
- Live data updates

API Endpoints:
- GET  /api/senso/feedback       - Get recent feedback
- GET  /api/senso/stats          - Get dashboard statistics  
- GET  /api/senso/context-window - Get AI context window
- POST /api/scrape               - Simulate new scraping
- GET  /health                   - Health check

Server running at: http://localhost:${port}
Dashboard should connect to this API automatically.

Press Ctrl+C to stop the server.
  `);
});