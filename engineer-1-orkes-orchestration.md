# Engineer 1: Core Agent Orchestration with Orkes

## Your Mission
Build the central orchestration system that coordinates all agents and implements the continuous learning loop.

## Primary Deliverable (2-3 hours)
**A working Orkes workflow that runs multiple agents in parallel and synthesizes their insights**

### Step 1: Set up Orkes (30 min)
```javascript
// 1. Get Orkes credentials from their booth/Discord
// 2. Install SDK
npm install @io.orkes/conductor-nodejs

// 3. Initialize client
import { orkes } from '@io.orkes/conductor-nodejs';

const orkesClient = new orkes.OrkesApiClient(
  'https://play.orkes.io', // or their hackathon instance
  YOUR_API_KEY
);
```

### Step 2: Define the COO Assistant Workflow (45 min)
```javascript
const cooAssistantWorkflow = {
  name: 'coo_assistant_analysis',
  version: 1,
  description: 'Analyzes business data and provides AI recommendations',
  tasks: [
    {
      name: 'collect_data',
      taskReferenceName: 'collect_data',
      type: 'SIMPLE',
      inputParameters: {
        startup_id: '${workflow.input.startup_id}'
      }
    },
    {
      name: 'parallel_analysis',
      taskReferenceName: 'parallel_analysis',
      type: 'FORK_JOIN',
      forkTasks: [
        [{
          name: 'analyze_reviews',
          taskReferenceName: 'review_analysis',
          type: 'SIMPLE',
          inputParameters: {
            data: '${collect_data.output.reviews}'
          }
        }],
        [{
          name: 'analyze_product_metrics',
          taskReferenceName: 'product_analysis',
          type: 'SIMPLE',
          inputParameters: {
            data: '${collect_data.output.metrics}'
          }
        }]
      ]
    },
    {
      name: 'synthesize_insights',
      taskReferenceName: 'synthesis',
      type: 'SIMPLE',
      inputParameters: {
        reviews: '${review_analysis.output}',
        metrics: '${product_analysis.output}'
      }
    },
    {
      name: 'generate_recommendation',
      taskReferenceName: 'recommendation',
      type: 'SIMPLE',
      inputParameters: {
        insights: '${synthesis.output}'
      }
    }
  ]
};

// Register workflow
await orkesClient.registerWorkflow(cooAssistantWorkflow);
```

### Step 3: Implement Worker Tasks (1 hour)
```javascript
// Base worker class
class AgentWorker {
  constructor(taskName) {
    this.taskName = taskName;
  }
  
  async execute(task) {
    // Override in subclasses
  }
}

// Synthesis worker (your main logic)
class SynthesisWorker extends AgentWorker {
  constructor() {
    super('synthesize_insights');
  }
  
  async execute(task) {
    const { reviews, metrics } = task.inputData;
    
    // Combine insights from different agents
    const synthesis = {
      topInsight: this.findTopInsight(reviews, metrics),
      confidence: this.calculateConfidence(reviews, metrics),
      recommendation: this.generateRecommendation(reviews, metrics),
      timestamp: new Date().toISOString()
    };
    
    return {
      status: 'COMPLETED',
      outputData: synthesis
    };
  }
  
  findTopInsight(reviews, metrics) {
    // Logic to find the most important insight
    if (reviews.sentiment < 0.5 && metrics.churnRate > 0.2) {
      return "Critical: Poor reviews correlating with high churn";
    }
    // Add more logic
  }
}

// Start workers
const synthesisWorker = new SynthesisWorker();
await orkesClient.startWorker('synthesize_insights', synthesisWorker.execute);
```

### Step 4: Implement Continuous Learning (45 min)
```javascript
class LearningCoordinator {
  constructor() {
    this.recommendations = new Map();
    this.outcomes = new Map();
  }
  
  async trackRecommendation(workflowId, recommendation) {
    this.recommendations.set(workflowId, {
      recommendation,
      timestamp: Date.now(),
      implemented: false
    });
  }
  
  async recordOutcome(workflowId, outcome) {
    const rec = this.recommendations.get(workflowId);
    if (rec) {
      this.outcomes.set(workflowId, {
        ...rec,
        outcome,
        success: outcome.metricImproved
      });
      
      // Trigger learning workflow
      await this.triggerLearning(rec, outcome);
    }
  }
  
  async triggerLearning(recommendation, outcome) {
    // This is your continuous improvement!
    await orkesClient.startWorkflow('learning_workflow', {
      recommendation: recommendation.recommendation,
      outcome: outcome,
      success: outcome.metricImproved,
      adjustments: this.calculateAdjustments(recommendation, outcome)
    });
  }
  
  getImprovementMetrics() {
    const total = this.outcomes.size;
    const successful = Array.from(this.outcomes.values())
      .filter(o => o.success).length;
    
    return {
      totalRecommendations: total,
      successRate: total > 0 ? successful / total : 0,
      improvementTrend: this.calculateTrend()
    };
  }
}
```

### Step 5: Create Demo Simulation (30 min)
```javascript
// For the demo, simulate continuous improvement
class DemoSimulator {
  constructor() {
    this.baseAccuracy = 0.45;
    this.currentAccuracy = 0.45;
  }
  
  async runDemoFlow() {
    // Start workflow
    const result = await orkesClient.startWorkflow('coo_assistant_analysis', {
      startup_id: 'demo_startup',
      demo_mode: true
    });
    
    // Simulate improvement
    this.currentAccuracy = Math.min(this.currentAccuracy * 1.15, 0.92);
    
    return {
      workflowId: result.workflowId,
      recommendation: "Focus on improving app store ratings",
      metrics: {
        accuracyBefore: this.baseAccuracy,
        accuracyNow: this.currentAccuracy,
        improvementRate: ((this.currentAccuracy - this.baseAccuracy) / this.baseAccuracy * 100).toFixed(1) + '%'
      }
    };
  }
}
```

## Testing Your Integration (30 min)

```javascript
// Quick test script
async function testOrchestration() {
  console.log('Starting Orkes orchestration test...');
  
  // 1. Register workflow
  await orkesClient.registerWorkflow(cooAssistantWorkflow);
  console.log('✓ Workflow registered');
  
  // 2. Start a test workflow
  const result = await orkesClient.startWorkflow('coo_assistant_analysis', {
    startup_id: 'test_123'
  });
  console.log('✓ Workflow started:', result.workflowId);
  
  // 3. Check status
  const status = await orkesClient.getWorkflow(result.workflowId);
  console.log('✓ Workflow status:', status.status);
  
  // 4. Show improvement metrics
  const metrics = learningCoordinator.getImprovementMetrics();
  console.log('✓ Improvement metrics:', metrics);
}
```

## Demo Integration Points

Your Orkes workflow needs to:
1. Accept data from Engineer 2's Bright Data scraper
2. Accept data from Engineer 3's Mixpanel integration
3. Output recommendations to Engineer 3's dashboard

```javascript
// Integration interfaces
export interface AgentData {
  source: 'brightdata' | 'mixpanel' | 'other';
  data: any;
  confidence: number;
  timestamp: string;
}

export interface Recommendation {
  id: string;
  insight: string;
  action: string;
  confidence: number;
  expectedImpact: string;
}
```

## Success Criteria
- [ ] Orkes workflow registered and visible in UI
- [ ] Can trigger workflow via API
- [ ] Workflow completes successfully
- [ ] Learning metrics show improvement
- [ ] Integration with other engineers' components works

## If You Finish Early
See `additional-tasks.md` for:
- Senso.ai integration
- Complex workflow patterns
- Real-time monitoring dashboard