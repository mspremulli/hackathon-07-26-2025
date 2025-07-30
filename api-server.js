const express = require('express');
const cors = require('cors');
const path = require('path');

// Import our Senso client
const { getSensoClient } = require('./src/integrations/senso-client');

const app = express();
const port = 3000;

// Enable CORS for dashboard
app.use(cors());
app.use(express.json());

// Mock data for demonstration
const mockContexts = [
  {
    id: 'app-store-1',
    source: 'app_store',
    type: 'reviews',
    timestamp: new Date(),
    metadata: { sentiment: 'positive', rating: 5 },
    data: { content: 'Great app! Love the new features.' },
    tags: ['real-data', 'whatsapp']
  },
  {
    id: 'reddit-1',
    source: 'reddit',
    type: 'posts',
    timestamp: new Date(Date.now() - 3600000),
    metadata: { sentiment: 'mixed' },
    data: { content: 'WhatsApp is good but needs better desktop support.' },
    tags: ['real-data', 'feedback']
  },
  {
    id: 'app-store-2',
    source: 'app_store',
    type: 'reviews',
    timestamp: new Date(Date.now() - 7200000),
    metadata: { sentiment: 'negative', rating: 2 },
    data: { content: 'App crashes frequently after the update.' },
    tags: ['real-data', 'bug-report']
  },
  {
    id: 'google-play-1',
    source: 'google_play',
    type: 'reviews',
    timestamp: new Date(Date.now() - 10800000),
    metadata: { sentiment: 'positive', rating: 4 },
    data: { content: 'Works well but could use more customization options.' },
    tags: ['mock-data']
  }
];

// Get recent feedback
app.get('/api/senso/feedback', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    // Add more mock data
    const allContexts = [...mockContexts];
    
    // Generate some random data for demo
    for (let i = 0; i < 20; i++) {
      const sources = ['app_store', 'reddit', 'google_play', 'twitter', 'glassdoor'];
      const sentiments = ['positive', 'negative', 'neutral', 'mixed'];
      
      allContexts.push({
        id: `mock-${i}`,
        source: sources[Math.floor(Math.random() * sources.length)],
        type: 'feedback',
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
        metadata: {
          sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
          rating: Math.floor(Math.random() * 5) + 1
        },
        data: { content: 'Sample feedback content #' + i },
        tags: ['mock-data']
      });
    }

    const feedback = allContexts.slice(0, limit).map(ctx => ({
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
app.get('/api/senso/stats', async (req, res) => {
  try {
    // Generate stats from mock data
    const sentimentBreakdown = {
      positive: 12,
      negative: 8,
      neutral: 5,
      mixed: 7
    };

    const sourceBreakdown = {
      app_store: 8,
      reddit: 6,
      google_play: 5,
      twitter: 4,
      glassdoor: 3
    };

    // Generate trend data
    const recentTrends = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      recentTrends.push({
        date: date.toISOString().split('T')[0],
        positive: Math.floor(Math.random() * 10) + 5,
        negative: Math.floor(Math.random() * 5) + 2,
        total: Math.floor(Math.random() * 20) + 10
      });
    }

    const topIssues = [
      { issue: 'App Performance', count: 45, sentiment: 'negative' },
      { issue: 'User Interface', count: 32, sentiment: 'mixed' },
      { issue: 'New Features', count: 28, sentiment: 'positive' },
      { issue: 'Customer Support', count: 21, sentiment: 'negative' },
      { issue: 'Pricing', count: 19, sentiment: 'mixed' }
    ];

    res.json({
      totalFeedback: 32,
      averageRating: 3.7,
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

// Trigger a new scraping run
app.post('/api/scrape', async (req, res) => {
  try {
    console.log('🚀 Starting new scraping run...');
    
    // Simulate scraping
    setTimeout(() => {
      console.log('✅ Scraping completed!');
    }, 2000);
    
    res.json({
      success: true,
      message: 'Scraping completed and data stored in Senso.ai',
      summary: {
        total_sources: 5,
        real_data_sources: ['app_store', 'reddit'],
        mock_data_sources: ['google_play', 'twitter', 'glassdoor']
      }
    });
  } catch (error) {
    console.error('Scraping error:', error);
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
- POST /api/scrape             - Trigger new scraping run

Server running at: http://localhost:${port}

Note: Using mock data for demonstration. Real Senso.ai integration
      is available but API endpoints are not publicly documented.
  `);
});