import express from 'express';
import cors from 'cors';
import { mongoClient } from '../database/mongodb-client';
import { Feedback } from '../database/schemas/feedback.schema';

const app = express();
const port = process.env.MONGODB_API_PORT || 3003;

app.use(cors());
app.use(express.json());

// Connect to MongoDB on startup
mongoClient.connect().catch(console.error);

// Get all feedback
app.get('/api/feedback', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const source = req.query.source as string;
    const sentiment = req.query.sentiment as string;
    
    const query: any = {};
    if (source) query.source = source;
    if (sentiment) query.sentiment = sentiment;
    
    const feedback = await Feedback
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    
    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    const [
      totalCount,
      sentimentAgg,
      sourceAgg,
      ratingAgg,
      recentTrends
    ] = await Promise.all([
      // Total count
      Feedback.countDocuments(),
      
      // Sentiment breakdown
      Feedback.aggregate([
        { $group: { _id: '$sentiment', count: { $sum: 1 } } }
      ]),
      
      // Source breakdown
      Feedback.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } }
      ]),
      
      // Average rating
      Feedback.aggregate([
        { $match: { rating: { $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
      ]),
      
      // Recent trends (last 7 days)
      Feedback.aggregate([
        {
          $match: {
            timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
              sentiment: '$sentiment'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ])
    ]);
    
    // Transform aggregation results
    const sentimentBreakdown = sentimentAgg.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, { positive: 0, negative: 0, neutral: 0, mixed: 0 });
    
    const sourceBreakdown = sourceAgg.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
    
    const averageRating = ratingAgg[0]?.avg || 0;
    
    // Transform trends data
    const trendsMap = new Map();
    recentTrends.forEach(item => {
      if (!trendsMap.has(item._id.date)) {
        trendsMap.set(item._id.date, { 
          date: item._id.date, 
          positive: 0, 
          negative: 0, 
          total: 0 
        });
      }
      const day = trendsMap.get(item._id.date);
      if (item._id.sentiment === 'positive') day.positive = item.count;
      if (item._id.sentiment === 'negative') day.negative = item.count;
      day.total += item.count;
    });
    
    res.json({
      totalFeedback: totalCount,
      averageRating: averageRating.toFixed(1),
      sentimentBreakdown,
      sourceBreakdown,
      recentTrends: Array.from(trendsMap.values())
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Add new feedback (for scrapers to use)
app.post('/api/feedback', async (req, res) => {
  try {
    const feedbackData = req.body;
    
    // Validate required fields
    if (!feedbackData.id || !feedbackData.source || !feedbackData.content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const feedback = new Feedback(feedbackData);
    await feedback.save();
    
    res.status(201).json({ success: true, id: feedback.id });
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// Bulk insert feedback
app.post('/api/feedback/bulk', async (req, res) => {
  try {
    const { feedbackList } = req.body;
    
    if (!Array.isArray(feedbackList)) {
      return res.status(400).json({ error: 'feedbackList must be an array' });
    }
    
    // Use bulkWrite for better duplicate handling
    const bulkOps = feedbackList.map((item: any) => ({
      updateOne: {
        filter: { id: item.id },
        update: { $set: item },
        upsert: true
      }
    }));
    
    const result = await Feedback.bulkWrite(bulkOps);
    
    res.json({ 
      success: true, 
      inserted: result.upsertedCount,
      modified: result.modifiedCount,
      message: `Successfully processed ${feedbackList.length} items (${result.upsertedCount} new, ${result.modifiedCount} updated)`
    });
  } catch (error) {
    console.error('Error bulk inserting feedback:', error);
    res.status(500).json({ error: 'Failed to bulk insert feedback' });
  }
});

// Health check for Orkes
app.get('/health', async (req, res) => {
  try {
    const dbStatus = mongoClient.getConnection().readyState === 1 ? 'connected' : 'disconnected';
    const count = await Feedback.countDocuments();
    
    res.json({
      status: 'healthy',
      database: dbStatus,
      feedbackCount: count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error.message 
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`
🚀 MongoDB API Server Running
==============================
This API provides access to feedback data stored in MongoDB
Perfect for Orkes orchestration integration!

Endpoints:
- GET  /api/feedback     - Get feedback items
- GET  /api/stats        - Get statistics
- POST /api/feedback     - Add single feedback
- POST /api/feedback/bulk - Bulk insert feedback
- GET  /health           - Health check

Server running at: http://localhost:${port}

MongoDB URI: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}
  `);
});

export default app;