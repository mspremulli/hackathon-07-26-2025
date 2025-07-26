# COO/EIR Assistant - 3 Engineer Vertical Slices

## Engineer 1: Core Agent Infrastructure + Senso.ai + Orkes
**Goal**: Build the foundational agent system with workflow orchestration

### Deliverables:
1. **Base Agent Framework with Orkes** (1.5 hours)
   - Set up Orkes workflow orchestration
   - Define workflows for agent coordination:
     * Data collection workflow (parallel agent execution)
     * Learning feedback workflow
     * Recommendation generation workflow
   - Implement retry logic and error handling
   - Create base agent class with Orkes task workers

2. **Senso.ai Context OS Integration** (1.5 hours)
   - Connect to Senso API
   - Implement data ingestion pipeline
   - Build context retrieval and synthesis
   - Store recommendations and outcomes
   - Integrate with Orkes workflows for data flow

3. **Advisory Synthesis Agent** (1 hour)
   - Orchestrate multi-agent insights via Orkes
   - Generate prioritized recommendations
   - Track recommendation outcomes
   - Implement continuous learning loop

### Demo Contribution:
- Shows the core learning system
- Demonstrates how recommendations improve over time
- Displays the Senso context window evolution

---

## Engineer 2: Data Collection Agents (Sales + Product)
**Goal**: Build agents that monitor business data and extract insights

### Assigned Sponsors:
1. **Mixpanel** (Primary) - Product analytics via MCP
2. **LlamaIndex** - Knowledge graph for pattern storage
3. **Datadog** - Monitor agent performance metrics

### Deliverables:
1. **Sales Intelligence Agent** (2 hours)
   - Mock CRM data ingestion
   - Pattern detection using LlamaIndex knowledge graphs
   - Extract and store sales insights
   - Monitor agent performance with Datadog
   - Share learnings via A2A protocol

2. **Product Analytics Agent with Mixpanel MCP** (2 hours)
   - Connect to Mixpanel demo environment (get demo access from Discord)
   - Natural language queries: "What drives retention?"
   - Build knowledge graph of feature correlations (LlamaIndex)
   - Track query performance (Datadog)
   - Identify usage patterns

### Demo Contribution:
- Live Mixpanel MCP query: "What features drive retention?"
- Show LlamaIndex knowledge graph visualizing discovered patterns
- Display Datadog metrics showing agent efficiency improvements
- Cross-agent insight: "Sales + Product discovered enterprise customers need Feature X"

---

## Engineer 3: Market Intelligence + Demo UI
**Goal**: External data monitoring and user interface

### Assigned Sponsors:
1. **Bright Data** (Primary) - Market/competitor intelligence via MCP
2. **Vapi** - Voice interface for briefings
3. **Arcade** - Interactive demo elements
4. **Mastra** - Quick UI deployment framework

### Deliverables:
1. **Market Intelligence Agent with Bright Data MCP** (1.5 hours)
   - Set up Bright Data MCP server (docs: github.com/brightdata/brightdata-mcp)
   - Monitor competitor sentiment and news
   - Track market trends and opportunities
   - Use Mastra for rapid agent deployment
   - Feed insights to synthesis agent

2. **Demo Dashboard UI** (2.5 hours)
   - Build with Mastra for quick deployment
   - Real-time agent status display
   - Recommendation feed with approval/reject
   - Learning metrics visualization
   - "Agent IQ" score that increases during demo
   - Vapi voice briefing integration
   - Arcade interactive elements for engagement

### Demo Contribution:
- Slick UI built with Mastra showing all agents working
- Live Bright Data alert: "Competitor just lost their CTO"
- Vapi voice briefing: "Three urgent insights need your attention"
- Arcade interactive element showing learning progress
- Metrics showing continuous improvement in real-time

---

## Integration Timeline (5.5 hours total)

### Hour 1-2: Foundation
- All: Environment setup, API keys, initial scaffolding
- Engineer 1: Base agent framework
- Engineer 2: Mock data generators
- Engineer 3: UI boilerplate

### Hour 2-4: Core Development
- Engineer 1: Senso integration + synthesis agent
- Engineer 2: Sales + Product agents with real APIs
- Engineer 3: Bright Data integration + UI components

### Hour 4-5: Integration
- All: Connect agents via A2A protocol
- Test end-to-end flow
- Debug cross-agent communication

### Hour 5-5.5: Demo Polish
- Engineer 1: Ensure learning metrics work
- Engineer 2: Prime demo with good data
- Engineer 3: Polish UI animations
- All: Practice demo flow

---

## Key Integration Points

### Shared Interfaces:
```javascript
// All agents implement this
interface Agent {
  analyzeData(): Promise<Insights>;
  learnFromOutcome(outcome: Outcome): void;
  shareInsights(): Promise<SharedInsight>;
}

// Orkes workflow definition
const agentWorkflow = {
  name: 'coo_assistant_analysis',
  tasks: [
    {
      name: 'parallel_agent_analysis',
      type: 'FORK_JOIN',
      forkTasks: [
        [{ name: 'sales_analysis', type: 'SIMPLE' }],
        [{ name: 'product_analysis', type: 'SIMPLE' }],
        [{ name: 'market_analysis', type: 'SIMPLE' }]
      ]
    },
    {
      name: 'synthesis',
      type: 'SIMPLE',
      inputParameters: {
        insights: '${parallel_agent_analysis.output}'
      }
    }
  ]
};

// Shared message format
interface AgentMessage {
  from: string;
  to: string;
  type: 'insight' | 'request' | 'outcome';
  data: any;
  confidence: number;
}
```

### Mock Data Strategy:
- Engineer 2 creates realistic mock data streams
- Include both "before" and "after" data to show improvement
- Ensure data tells a compelling story for demo

### Demo Coordination:
1. Engineer 3's UI drives the demo narrative
2. Engineer 2 triggers key insights at right moments
3. Engineer 1 shows learning/improvement metrics

---

## Risk Mitigation

### If Running Behind:
- **Minimum Viable Demo** (3 hours):
  - Engineer 1: Just Senso + basic learning
  - Engineer 2: Just one agent (Product Analytics)
  - Engineer 3: Simple UI + one sponsor integration

### Backup Plans:
- Pre-recorded video clips for complex integrations
- Mock data fallbacks if APIs fail
- Static improvement metrics if real-time learning doesn't work

---

## Sponsor Coverage Summary

### Total: 9 Sponsor Integrations
- **Engineer 1**: Senso.ai, Orkes (2 sponsors)
- **Engineer 2**: Mixpanel, LlamaIndex, Datadog (3 sponsors)  
- **Engineer 3**: Bright Data, Vapi, Arcade, Mastra (4 sponsors)

### Primary Sponsors (Deep Integration):
1. **Senso.ai** - Context OS for all data (Eng 1)
2. **Mixpanel** - Product analytics with MCP (Eng 2)
3. **Bright Data** - Market intelligence with MCP (Eng 3)
4. **Orkes** - Workflow orchestration (Eng 1)

### Supporting Sponsors:
5. **Vapi** - Voice briefings (Eng 3)
6. **LlamaIndex** - Knowledge graphs (Eng 2)
7. **Datadog** - Performance monitoring (Eng 2)
8. **Mastra** - Rapid UI deployment (Eng 3)
9. **Arcade** - Interactive demo elements (Eng 3)

## Success Criteria
1. ✅ 9 sponsor integrations (exceeds 3+ requirement)
2. ✅ Visible continuous improvement
3. ✅ Multi-agent collaboration demonstrated
4. ✅ Clean 3-minute demo flow
5. ✅ "Wow" moment when agents discover non-obvious insight