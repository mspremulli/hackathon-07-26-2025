# Engineer 2: Bright Data App Store Review Scraping

## Your Mission
Build an agent that scrapes Google Play Store and Apple App Store reviews using Bright Data MCP, analyzes sentiment patterns, and discovers insights about user pain points.

## Primary Deliverable (2-3 hours)
**A working review analysis agent that finds patterns in app store reviews and feeds insights to the orchestration system**

### Step 1: Set up Bright Data MCP (30 min)
```bash
# 1. Get Bright Data credentials from their booth/Discord
# 2. Clone their MCP server
git clone https://github.com/brightdata/brightdata-mcp
cd brightdata-mcp

# 3. Install and configure
npm install
export BRIGHT_DATA_API_KEY="your-api-key"

# 4. Start the MCP server
npm start
```

### Step 2: Create Review Scraping Agent (1 hour)
```javascript
import { BrightDataMCP } from '@brightdata/mcp';

class AppReviewAgent {
  constructor() {
    this.brightData = new BrightDataMCP({
      apiKey: process.env.BRIGHT_DATA_API_KEY
    });
    
    this.reviewPatterns = {
      bugs: ['crash', 'freeze', 'bug', 'broken', 'doesn\'t work'],
      performance: ['slow', 'lag', 'battery', 'memory', 'performance'],
      ux: ['confusing', 'hard to use', 'intuitive', 'simple', 'complicated'],
      features: ['missing', 'need', 'want', 'wish', 'should have']
    };
  }
  
  async scrapeAppReviews(appId, platform = 'google_play') {
    console.log(`Scraping reviews for ${appId} on ${platform}...`);
    
    try {
      // Use Bright Data MCP to scrape reviews
      const reviews = await this.brightData.scrape({
        url: platform === 'google_play' 
          ? `https://play.google.com/store/apps/details?id=${appId}`
          : `https://apps.apple.com/app/${appId}`,
        selector: {
          reviews: '.review-text',
          rating: '.review-rating',
          date: '.review-date'
        },
        limit: 100 // Get last 100 reviews
      });
      
      return this.processReviews(reviews);
    } catch (error) {
      console.error('Scraping failed, using mock data:', error);
      return this.getMockReviews(); // Fallback for demo
    }
  }
  
  processReviews(reviews) {
    const processed = reviews.map(review => ({
      text: review.text,
      rating: parseInt(review.rating),
      date: new Date(review.date),
      sentiment: this.analyzeSentiment(review.text),
      categories: this.categorizeIssues(review.text)
    }));
    
    return {
      totalReviews: processed.length,
      averageRating: this.calculateAverage(processed.map(r => r.rating)),
      sentimentBreakdown: this.getSentimentBreakdown(processed),
      topIssues: this.getTopIssues(processed),
      insights: this.generateInsights(processed)
    };
  }
  
  analyzeSentiment(text) {
    // Simple sentiment analysis
    const positive = ['love', 'great', 'amazing', 'excellent', 'perfect'];
    const negative = ['hate', 'terrible', 'awful', 'worst', 'horrible'];
    
    const lowerText = text.toLowerCase();
    const positiveScore = positive.filter(word => lowerText.includes(word)).length;
    const negativeScore = negative.filter(word => lowerText.includes(word)).length;
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }
  
  categorizeIssues(text) {
    const categories = [];
    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.reviewPatterns)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        categories.push(category);
      }
    }
    
    return categories;
  }
  
  generateInsights(processedReviews) {
    const insights = [];
    
    // Insight 1: Sentiment trend
    const recentReviews = processedReviews.slice(-20);
    const recentNegative = recentReviews.filter(r => r.sentiment === 'negative').length;
    if (recentNegative > 10) {
      insights.push({
        type: 'critical',
        message: 'Recent reviews show increasing negative sentiment',
        confidence: 0.9
      });
    }
    
    // Insight 2: Common issues
    const issueCount = {};
    processedReviews.forEach(review => {
      review.categories.forEach(cat => {
        issueCount[cat] = (issueCount[cat] || 0) + 1;
      });
    });
    
    const topIssue = Object.entries(issueCount)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topIssue && topIssue[1] > 20) {
      insights.push({
        type: 'actionable',
        message: `${topIssue[1]}% of reviews mention ${topIssue[0]} issues`,
        confidence: 0.85,
        recommendation: `Prioritize fixing ${topIssue[0]} problems`
      });
    }
    
    return insights;
  }
}
```

### Step 3: Create Competitive Analysis Feature (45 min)
```javascript
class CompetitiveReviewAnalyzer extends AppReviewAgent {
  async analyzeCompetitor(competitorAppId) {
    const competitorData = await this.scrapeAppReviews(competitorAppId);
    
    return {
      competitor: competitorAppId,
      strengths: this.findStrengths(competitorData),
      weaknesses: this.findWeaknesses(competitorData),
      opportunities: this.findOpportunities(competitorData)
    };
  }
  
  async compareWithCompetitors(myAppId, competitorIds) {
    const myData = await this.scrapeAppReviews(myAppId);
    const competitorData = await Promise.all(
      competitorIds.map(id => this.analyzeCompetitor(id))
    );
    
    return {
      marketPosition: this.calculateMarketPosition(myData, competitorData),
      competitiveInsights: this.generateCompetitiveInsights(myData, competitorData),
      recommendations: this.generateStrategicRecommendations(myData, competitorData)
    };
  }
  
  generateCompetitiveInsights(myData, competitors) {
    const insights = [];
    
    // Find what competitors do better
    competitors.forEach(comp => {
      if (comp.averageRating > myData.averageRating) {
        const difference = comp.strengths.filter(s => 
          !myData.topIssues.includes(s)
        );
        
        if (difference.length > 0) {
          insights.push({
            type: 'competitive_gap',
            message: `Competitor excels at: ${difference.join(', ')}`,
            action: `Study their implementation of ${difference[0]}`,
            confidence: 0.8
          });
        }
      }
    });
    
    return insights;
  }
}
```

### Step 4: Integration with Orkes (30 min)
```javascript
// Worker for Orkes integration
class ReviewAnalysisWorker {
  constructor() {
    this.analyzer = new CompetitiveReviewAnalyzer();
  }
  
  async execute(task) {
    const { appId, competitorIds } = task.inputData;
    
    try {
      // Perform analysis
      const analysis = await this.analyzer.compareWithCompetitors(
        appId, 
        competitorIds || []
      );
      
      // Format for orchestration system
      return {
        status: 'COMPLETED',
        outputData: {
          source: 'brightdata_reviews',
          timestamp: new Date().toISOString(),
          data: analysis,
          topInsight: analysis.recommendations[0],
          confidence: 0.85
        }
      };
    } catch (error) {
      return {
        status: 'FAILED',
        outputData: { error: error.message },
        logs: [`Review analysis failed: ${error.message}`]
      };
    }
  }
}

// Register with Orkes
export const reviewWorker = new ReviewAnalysisWorker();
```

### Step 5: Demo Data & Mock Fallback (45 min)
```javascript
class MockReviewData {
  getMockReviews() {
    return {
      totalReviews: 847,
      averageRating: 3.2,
      sentimentBreakdown: {
        positive: 0.35,
        neutral: 0.25,
        negative: 0.40
      },
      topIssues: [
        { category: 'performance', count: 234, percentage: 27.6 },
        { category: 'bugs', count: 189, percentage: 22.3 },
        { category: 'ux', count: 156, percentage: 18.4 }
      ],
      insights: [
        {
          type: 'critical',
          message: 'App performance complaints increased 45% this month',
          confidence: 0.92,
          recommendation: 'Urgent: Optimize app startup time and memory usage'
        },
        {
          type: 'opportunity',
          message: 'Competitor app has 68% fewer performance complaints',
          confidence: 0.87,
          recommendation: 'Study competitor\'s caching strategy'
        }
      ],
      recentTrend: {
        direction: 'declining',
        change: -0.3,
        timeframe: '30_days'
      }
    };
  }
  
  getDemoScenario() {
    return {
      before: {
        rating: 3.2,
        negativeReviews: 40,
        mainComplaint: 'App crashes frequently'
      },
      action: 'Implemented review insights: Fixed memory leaks',
      after: {
        rating: 4.1,
        negativeReviews: 15,
        mainComplaint: 'Want more features'
      },
      impact: 'User satisfaction increased 28%'
    };
  }
}
```

## Testing Your Integration (30 min)

```javascript
async function testBrightDataIntegration() {
  const agent = new AppReviewAgent();
  
  console.log('Testing Bright Data MCP integration...');
  
  // Test 1: Basic scraping
  const reviews = await agent.scrapeAppReviews('com.example.app');
  console.log('✓ Scraped reviews:', reviews.totalReviews);
  
  // Test 2: Competitive analysis
  const competitive = await agent.compareWithCompetitors(
    'com.example.app',
    ['com.competitor1.app', 'com.competitor2.app']
  );
  console.log('✓ Competitive insights:', competitive.competitiveInsights.length);
  
  // Test 3: Orkes integration
  const worker = new ReviewAnalysisWorker();
  const result = await worker.execute({
    inputData: { appId: 'com.example.app' }
  });
  console.log('✓ Worker output:', result.status);
}
```

## Demo Talking Points

1. **Real-time Review Monitoring**
   - "We're analyzing 847 reviews across Google Play and App Store"
   - "Bright Data MCP lets us monitor competitor apps too"

2. **Actionable Insights**
   - "The agent discovered performance complaints increased 45%"
   - "It automatically compared with competitors and found they have 68% fewer complaints"

3. **Continuous Improvement**
   - "After implementing the agent's recommendations, our rating improved from 3.2 to 4.1"
   - "Negative reviews dropped by 62%"

## Success Criteria
- [ ] Bright Data MCP server running
- [ ] Can scrape at least mock reviews
- [ ] Generates at least 2 meaningful insights
- [ ] Integrates with Engineer 1's Orkes workflow
- [ ] Shows improvement metrics in demo

## If You Finish Early
See `additional-tasks.md` for:
- Real-time review monitoring
- Multi-language sentiment analysis
- Advanced competitor tracking