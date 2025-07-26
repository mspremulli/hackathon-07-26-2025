const express = require('express');
const cors = require('cors');
import { getSensoClient } from '../integrations/senso-client';
import { SensoIntegratedScraper } from '../agents/senso-integrated-scraper';

const app = express();
const port = 3000;

// Enable CORS for dashboard
app.use(cors());
app.use(express.json());

const sensoClient = getSensoClient();
const scraper = new SensoIntegratedScraper();

// Get recent feedback
app.get('/api/senso/feedback', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const contexts = await sensoClient.queryContexts({
      limit,
      types: ['reviews', 'posts', 'feedback']
    });

    const feedback = contexts.map(ctx => ({
      id: ctx.id || `${ctx.source}-${Date.now()}`,
      source: ctx.source,
      type: ctx.type,
      timestamp: ctx.timestamp || new Date(),
      sentiment: ctx.metadata?.sentiment,
      rating: ctx.metadata?.rating || ctx.data?.rating,
      content: ctx.data?.content || ctx.data?.reviews?.[0]?.content || ctx.data?.text,
      metadata: ctx.metadata,
      tags: ctx.tags
    }));

    res.json(feedback);
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard statistics
app.get('/api/senso/stats', async (req, res) => {
  try {
    const contexts = await sensoClient.queryContexts({
      limit: 1000,
      types: ['reviews', 'posts', 'feedback']
    });

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

    contexts.forEach(ctx => {
      // Sentiment
      const sentiment = ctx.metadata?.sentiment || 'neutral';
      if (sentiment in sentimentBreakdown) {
        sentimentBreakdown[sentiment as keyof typeof sentimentBreakdown]++;
      }

      // Source
      sourceBreakdown[ctx.source] = (sourceBreakdown[ctx.source] || 0) + 1;

      // Rating
      const rating = ctx.metadata?.rating || ctx.data?.rating;
      if (rating) {
        totalRating += rating;
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
      
      const dayContexts = contexts.filter(ctx => 
        new Date(ctx.timestamp || '').toISOString().split('T')[0] === dateStr
      );

      recentTrends.push({
        date: dateStr,
        positive: dayContexts.filter(ctx => ctx.metadata?.sentiment === 'positive').length,
        negative: dayContexts.filter(ctx => ctx.metadata?.sentiment === 'negative').length,
        total: dayContexts.length
      });
    }

    // Mock top issues for demo
    const topIssues = [
      { issue: 'App Performance', count: 45, sentiment: 'negative' },
      { issue: 'User Interface', count: 32, sentiment: 'mixed' },
      { issue: 'New Features', count: 28, sentiment: 'positive' },
      { issue: 'Customer Support', count: 21, sentiment: 'negative' },
      { issue: 'Pricing', count: 19, sentiment: 'mixed' }
    ];

    res.json({
      totalFeedback: contexts.length,
      averageRating: ratingCount > 0 ? totalRating / ratingCount : 0,
      sentimentBreakdown,
      sourceBreakdown,
      recentTrends,
      topIssues
    });
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trigger a new scraping run
app.post('/api/scrape', async (req, res) => {
  try {
    console.log('🚀 Starting new scraping run...');
    const config = req.body || {
      appName: 'WhatsApp',
      appStoreAppId: '310633997',
      googlePlayAppId: 'com.whatsapp'
    };

    const results = await scraper.scrapeAllSources(config);
    res.json({
      success: true,
      message: 'Scraping completed and data stored in Senso.ai',
      summary: results.summary,
      sensoContextIds: results.sensoContextIds || [],
      businessContext: results.businessContext || 'Context window generated'
    });
  } catch (error: any) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get context window for AI
app.get('/api/senso/context-window', async (req, res) => {
  try {
    const contextWindow = await sensoClient.createContextWindow({
      sources: req.query.sources ? (req.query.sources as string).split(',') : undefined,
      types: req.query.types ? (req.query.types as string).split(',') : undefined,
      maxTokens: parseInt(req.query.maxTokens as string) || 4000
    });

    res.json({ contextWindow });
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`
🚀 COO/EIR Assistant API Server Running
======================================
API Endpoints:
- GET  /api/senso/feedback     - Get recent feedback
- GET  /api/senso/stats        - Get dashboard statistics  
- GET  /api/senso/context-window - Get AI context window
- POST /api/scrape             - Trigger new scraping run

Server running at: http://localhost:${port}
  `);
});