# Engineer 3: Mixpanel Analytics + Dashboard UI

## Your Mission
Build a Product Analytics Agent using Mixpanel MCP that discovers usage patterns, plus create the demo dashboard that visualizes all agents working together.

## Primary Deliverable (2-3 hours)
**A working Mixpanel integration that queries product data + a live dashboard showing continuous improvement**

### Step 1: Set up Mixpanel MCP Access (30 min)
```javascript
// 1. Get demo account access
// - Go to Mixpanel channel in Discord
// - Post your email to get added to demo account
// - You'll receive credentials for MCP integration

// 2. Initialize Mixpanel MCP
import { MixpanelMCP } from '@mixpanel/mcp';

const mixpanelMCP = new MixpanelMCP({
  projectToken: process.env.MIXPANEL_DEMO_TOKEN,
  mcp: {
    enabled: true,
    apiKey: process.env.MIXPANEL_MCP_KEY
  }
});

// 3. Test connection
async function testMixpanel() {
  const test = await mixpanelMCP.query({
    natural_language: "Show me daily active users"
  });
  console.log('Mixpanel connected:', test);
}
```

### Step 2: Create Product Analytics Agent (1 hour)
```javascript
class ProductAnalyticsAgent {
  constructor() {
    this.mixpanel = mixpanelMCP;
    this.insights = [];
    this.patterns = new Map();
  }
  
  async analyzeUserBehavior() {
    console.log('Analyzing product usage patterns...');
    
    // Query 1: Feature adoption
    const featureAdoption = await this.mixpanel.query({
      natural_language: "Which features have the highest adoption in first week?"
    });
    
    // Query 2: Retention drivers
    const retentionDrivers = await this.mixpanel.query({
      natural_language: "What actions correlate with 30-day retention?"
    });
    
    // Query 3: Drop-off points
    const dropOffPoints = await this.mixpanel.query({
      natural_language: "Where do users drop off in the onboarding flow?"
    });
    
    return this.synthesizeInsights({
      featureAdoption,
      retentionDrivers,
      dropOffPoints
    });
  }
  
  synthesizeInsights(data) {
    const insights = [];
    
    // Insight 1: Key retention driver
    if (data.retentionDrivers?.topAction) {
      insights.push({
        type: 'retention',
        discovery: `Users who ${data.retentionDrivers.topAction} retain 3x better`,
        confidence: 0.89,
        recommendation: `Prompt all users to ${data.retentionDrivers.topAction} in first session`,
        expectedImpact: '+15% 30-day retention'
      });
    }
    
    // Insight 2: Feature adoption gap
    if (data.featureAdoption?.underused) {
      insights.push({
        type: 'adoption',
        discovery: `Only 12% use ${data.featureAdoption.underused} but it drives highest engagement`,
        confidence: 0.85,
        recommendation: `Add tutorial for ${data.featureAdoption.underused} in onboarding`,
        expectedImpact: '+23% daily active users'
      });
    }
    
    // Insight 3: Onboarding optimization
    if (data.dropOffPoints?.biggest) {
      insights.push({
        type: 'onboarding',
        discovery: `42% of users abandon at ${data.dropOffPoints.biggest}`,
        confidence: 0.92,
        recommendation: `Simplify ${data.dropOffPoints.biggest} to single tap`,
        expectedImpact: '+38% activation rate'
      });
    }
    
    return {
      insights,
      summary: this.generateExecutiveSummary(insights),
      metrics: this.calculateMetrics(data)
    };
  }
  
  // Track improvement over time
  async trackOutcome(insightId, implemented, result) {
    const pattern = this.patterns.get(insightId) || { 
      suggested: 0, 
      implemented: 0, 
      successful: 0 
    };
    
    pattern.suggested++;
    if (implemented) {
      pattern.implemented++;
      if (result.improved) {
        pattern.successful++;
      }
    }
    
    this.patterns.set(insightId, pattern);
    
    // Learn from outcomes
    return this.updateConfidence(insightId, result);
  }
}
```

### Step 3: Build Demo Dashboard (1.5 hours)
```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>COO AI Assistant - Live Demo</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0a0b0d;
      color: #fff;
      margin: 0;
      padding: 20px;
    }
    
    .dashboard {
      display: grid;
      grid-template-columns: 1fr 2fr 1fr;
      gap: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .agent-status {
      background: #1a1d21;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #2a2d31;
    }
    
    .agent {
      display: flex;
      align-items: center;
      margin: 15px 0;
      padding: 12px;
      background: #0f1114;
      border-radius: 8px;
      transition: all 0.3s ease;
    }
    
    .agent.active {
      border-left: 3px solid #00d4ff;
      background: #0f1114;
    }
    
    .agent.complete {
      border-left: 3px solid #00ff88;
    }
    
    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 12px;
      animation: pulse 2s infinite;
    }
    
    .status-indicator.analyzing { background: #00d4ff; }
    .status-indicator.complete { background: #00ff88; }
    
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
    
    .insights-feed {
      background: #1a1d21;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #2a2d31;
    }
    
    .insight {
      background: #0f1114;
      border-radius: 8px;
      padding: 16px;
      margin: 12px 0;
      border-left: 3px solid #00d4ff;
      animation: slideIn 0.5s ease;
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(-20px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    .metrics {
      background: #1a1d21;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #2a2d31;
    }
    
    .agent-iq {
      font-size: 48px;
      font-weight: bold;
      color: #00d4ff;
      text-align: center;
      margin: 20px 0;
    }
    
    .improvement-chart {
      height: 200px;
      position: relative;
      margin: 20px 0;
    }
    
    .recommendation {
      background: #0a0b0d;
      border: 2px solid #00ff88;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    
    .action-buttons {
      display: flex;
      gap: 10px;
      margin-top: 12px;
    }
    
    button {
      background: #00d4ff;
      color: #000;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    button:hover {
      background: #00a8cc;
      transform: translateY(-1px);
    }
    
    button.reject {
      background: #ff3366;
    }
  </style>
</head>
<body>
  <h1 style="text-align: center; margin-bottom: 30px;">
    COO AI Assistant - Continuous Learning Demo
  </h1>
  
  <div class="dashboard">
    <!-- Left: Agent Status -->
    <div class="agent-status">
      <h2>Active Agents</h2>
      <div id="agents-list">
        <div class="agent" data-agent="reviews">
          <div class="status-indicator analyzing"></div>
          <div>
            <strong>Review Analysis</strong><br>
            <small>Scanning app store reviews...</small>
          </div>
        </div>
        <div class="agent" data-agent="product">
          <div class="status-indicator analyzing"></div>
          <div>
            <strong>Product Analytics</strong><br>
            <small>Analyzing user behavior...</small>
          </div>
        </div>
        <div class="agent" data-agent="synthesis">
          <div class="status-indicator"></div>
          <div>
            <strong>AI Synthesis</strong><br>
            <small>Waiting for data...</small>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Center: Insights Feed -->
    <div class="insights-feed">
      <h2>Live Insights & Recommendations</h2>
      <div id="insights-container">
        <!-- Insights will be added here dynamically -->
      </div>
    </div>
    
    <!-- Right: Metrics -->
    <div class="metrics">
      <h2>AI Performance</h2>
      <div class="agent-iq" id="agent-iq">156</div>
      <small style="text-align: center; display: block;">Agent IQ Score</small>
      
      <div class="improvement-chart">
        <canvas id="improvement-chart"></canvas>
      </div>
      
      <div style="margin-top: 20px;">
        <div>Recommendations Made: <strong id="rec-count">47</strong></div>
        <div>Success Rate: <strong id="success-rate">71%</strong></div>
        <div>Avg Impact: <strong id="avg-impact">+24%</strong></div>
      </div>
    </div>
  </div>

  <script>
    // Dashboard Controller
    class DashboardController {
      constructor() {
        this.agentIQ = 156;
        this.recommendations = 47;
        this.successRate = 71;
        this.ws = null;
        this.connectWebSocket();
        this.startDemo();
      }
      
      connectWebSocket() {
        // Connect to backend for real-time updates
        this.ws = new WebSocket('ws://localhost:3001');
        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          this.handleUpdate(data);
        };
      }
      
      handleUpdate(data) {
        switch(data.type) {
          case 'agent_status':
            this.updateAgentStatus(data.agent, data.status);
            break;
          case 'new_insight':
            this.addInsight(data.insight);
            break;
          case 'metrics_update':
            this.updateMetrics(data.metrics);
            break;
        }
      }
      
      updateAgentStatus(agentName, status) {
        const agent = document.querySelector(`[data-agent="${agentName}"]`);
        if (agent) {
          agent.className = `agent ${status}`;
          const indicator = agent.querySelector('.status-indicator');
          indicator.className = `status-indicator ${status}`;
        }
      }
      
      addInsight(insight) {
        const container = document.getElementById('insights-container');
        const insightEl = document.createElement('div');
        insightEl.className = 'insight';
        insightEl.innerHTML = `
          <h3>${insight.title}</h3>
          <p>${insight.discovery}</p>
          <div class="recommendation">
            <strong>Recommendation:</strong> ${insight.recommendation}
            <br><small>Expected Impact: ${insight.impact}</small>
            <div class="action-buttons">
              <button onclick="dashboard.approveRecommendation('${insight.id}')">
                Implement
              </button>
              <button class="reject" onclick="dashboard.rejectRecommendation('${insight.id}')">
                Skip
              </button>
            </div>
          </div>
        `;
        
        container.insertBefore(insightEl, container.firstChild);
      }
      
      approveRecommendation(id) {
        // Simulate learning from approval
        this.agentIQ += 2;
        this.updateMetrics({
          agentIQ: this.agentIQ,
          recommendations: ++this.recommendations,
          successRate: Math.min(this.successRate + 1, 95)
        });
        
        // Show improvement
        this.showNotification('Recommendation implemented! Agent learning...');
      }
      
      updateMetrics(metrics) {
        if (metrics.agentIQ) {
          document.getElementById('agent-iq').textContent = metrics.agentIQ;
        }
        if (metrics.recommendations) {
          document.getElementById('rec-count').textContent = metrics.recommendations;
        }
        if (metrics.successRate) {
          document.getElementById('success-rate').textContent = metrics.successRate + '%';
        }
      }
      
      // Demo sequence
      async startDemo() {
        await this.delay(2000);
        this.updateAgentStatus('reviews', 'complete');
        
        await this.delay(1500);
        this.addInsight({
          id: '1',
          title: 'Critical: App Performance Issues',
          discovery: 'Review analysis found 42% of negative reviews mention crashes',
          recommendation: 'Prioritize fixing memory leak in video player',
          impact: 'Could improve rating from 3.2 to 4.1 stars'
        });
        
        await this.delay(2000);
        this.updateAgentStatus('product', 'complete');
        
        await this.delay(1500);
        this.addInsight({
          id: '2',
          title: 'Retention Opportunity Discovered',
          discovery: 'Users who complete tutorial have 3x better retention',
          recommendation: 'Make tutorial mandatory with skip option after 10 seconds',
          impact: '+28% 30-day retention'
        });
        
        await this.delay(2000);
        this.updateAgentStatus('synthesis', 'active');
        
        await this.delay(2000);
        this.addInsight({
          id: '3',
          title: 'Cross-Agent Insight: Feature-Review Correlation',
          discovery: 'Poor reviews correlate with users who never discovered Feature X',
          recommendation: 'Add Feature X to onboarding flow',
          impact: 'Address root cause of 31% of complaints'
        });
      }
      
      delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }
      
      showNotification(message) {
        // Add floating notification
        const notif = document.createElement('div');
        notif.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #00ff88;
          color: #000;
          padding: 16px 24px;
          border-radius: 8px;
          font-weight: 600;
          animation: slideIn 0.3s ease;
        `;
        notif.textContent = message;
        document.body.appendChild(notif);
        
        setTimeout(() => notif.remove(), 3000);
      }
    }
    
    // Initialize dashboard
    const dashboard = new DashboardController();
  </script>
</body>
</html>
```

### Step 4: Backend Integration Service (30 min)
```javascript
// backend.js - Connects everything together
import express from 'express';
import { WebSocket } from 'ws';

class IntegrationServer {
  constructor() {
    this.app = express();
    this.insights = [];
    this.setupRoutes();
  }
  
  setupRoutes() {
    // Receive data from other agents
    this.app.post('/api/insight', (req, res) => {
      const insight = req.body;
      this.processInsight(insight);
      res.json({ success: true });
    });
    
    // Mixpanel queries endpoint
    this.app.post('/api/mixpanel/query', async (req, res) => {
      const result = await mixpanelMCP.query({
        natural_language: req.body.query
      });
      res.json(result);
    });
  }
  
  processInsight(insight) {
    // Enhance with Mixpanel data
    if (insight.source === 'brightdata_reviews') {
      this.enhanceWithProductData(insight);
    }
    
    // Broadcast to dashboard
    this.broadcast({
      type: 'new_insight',
      insight: this.formatForUI(insight)
    });
  }
  
  async enhanceWithProductData(insight) {
    // Cross-reference with Mixpanel
    const query = `Users who experienced "${insight.issue}"`;
    const productData = await mixpanelMCP.query({
      natural_language: query
    });
    
    if (productData.correlation) {
      insight.enhanced = true;
      insight.productCorrelation = productData;
    }
  }
}
```

## Testing Your Integration (30 min)

```javascript
async function testFullIntegration() {
  console.log('Testing Mixpanel + Dashboard integration...');
  
  // Test 1: Mixpanel MCP
  const analytics = new ProductAnalyticsAgent();
  const insights = await analytics.analyzeUserBehavior();
  console.log('✓ Mixpanel insights:', insights.insights.length);
  
  // Test 2: Dashboard updates
  // Open index.html in browser
  console.log('✓ Open http://localhost:3000 to see dashboard');
  
  // Test 3: Cross-agent communication
  const server = new IntegrationServer();
  server.processInsight({
    source: 'brightdata_reviews',
    issue: 'app crashes',
    severity: 'high'
  });
  console.log('✓ Cross-agent insight processed');
}
```

## Demo Script for Your Part

1. **Show Dashboard** (30 seconds)
   - "Here's our AI executive assistant monitoring everything in real-time"
   - Point out the three agents working

2. **Mixpanel Insight** (30 seconds)
   - "Watch as Product Analytics discovers something interesting..."
   - Show the retention insight appearing

3. **Cross-Agent Discovery** (30 seconds)
   - "Now the magic happens - agents are connecting insights"
   - Show the correlation between reviews and feature usage

4. **Continuous Improvement** (30 seconds)
   - "Notice the Agent IQ increasing as we approve recommendations"
   - "The system is learning what works for our specific business"

## Success Criteria
- [ ] Mixpanel MCP queries working (or convincing mock)
- [ ] Dashboard shows all 3 agents
- [ ] At least 3 insights appear during demo
- [ ] Agent IQ visibly increases
- [ ] Smooth animations and professional look

## If You Finish Early
See `additional-tasks.md` for:
- Vapi voice integration
- Real-time WebSocket updates
- Advanced visualizations