import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { Feedback } from '../database/schemas/feedback.schema';
import { mongoClient } from '../database/mongodb-client';

// Central message bus for agent communication
export class AgentMessageBus extends EventEmitter {
  private ws: WebSocket.Server;
  
  constructor(port: number = 8080) {
    super();
    this.ws = new WebSocket.Server({ port });
    console.log(`🚀 Agent Communication Hub running on ws://localhost:${port}`);
    
    this.ws.on('connection', (socket) => {
      console.log('👁️ Observer connected to agent communications');
      
      // Send message history to new observers
      socket.send(JSON.stringify({
        type: 'system',
        message: 'Connected to Agent Communication Hub',
        timestamp: new Date()
      }));
    });
  }
  
  broadcast(message: any) {
    const payload = JSON.stringify(message);
    this.ws.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }
}

// Base Agent Class
export abstract class BaseAgent {
  constructor(
    protected name: string,
    protected bus: AgentMessageBus
  ) {
    this.bus.on('message', this.handleMessage.bind(this));
  }
  
  protected abstract handleMessage(message: any): Promise<void>;
  
  protected async sendMessage(to: string, type: string, data: any) {
    const message = {
      from: this.name,
      to,
      type,
      data,
      timestamp: new Date()
    };
    
    console.log(`📤 ${this.name} → ${to}: ${type}`);
    this.bus.emit('message', message);
    this.bus.broadcast(message);
  }
}

// 1. Data Monitoring Agent - Watches MongoDB for changes
export class DataMonitorAgent extends BaseAgent {
  private lastCheck: Date = new Date();
  
  constructor(bus: AgentMessageBus) {
    super('DataMonitor', bus);
    this.startMonitoring();
  }
  
  private async startMonitoring() {
    setInterval(async () => {
      const newFeedback = await Feedback.find({
        created_at: { $gt: this.lastCheck }
      }).limit(10);
      
      if (newFeedback.length > 0) {
        await this.sendMessage('Analyst', 'new_data', {
          count: newFeedback.length,
          items: newFeedback
        });
      }
      
      this.lastCheck = new Date();
    }, 5000); // Check every 5 seconds
  }
  
  protected async handleMessage(message: any): Promise<void> {
    if (message.to !== this.name) return;
    
    if (message.type === 'query_data') {
      const data = await Feedback.find(message.data.filter || {})
        .sort({ timestamp: -1 })
        .limit(message.data.limit || 10);
      
      await this.sendMessage(message.from, 'data_response', { data });
    }
  }
}

// 2. Analysis Agent - Analyzes patterns and trends
export class AnalystAgent extends BaseAgent {
  constructor(bus: AgentMessageBus) {
    super('Analyst', bus);
  }
  
  protected async handleMessage(message: any): Promise<void> {
    if (message.to !== this.name) return;
    
    if (message.type === 'new_data') {
      const analysis = await this.analyzeData(message.data.items);
      
      if (analysis.alertLevel === 'high') {
        await this.sendMessage('EIR', 'urgent_insight', analysis);
      } else {
        await this.sendMessage('EIR', 'insight', analysis);
      }
    }
  }
  
  private async analyzeData(items: any[]): Promise<any> {
    const sentiments = items.map(i => i.sentiment);
    const negativeCount = sentiments.filter(s => s === 'negative').length;
    const negativeRatio = negativeCount / items.length;
    
    return {
      trend: negativeRatio > 0.6 ? 'concerning' : 'normal',
      alertLevel: negativeRatio > 0.7 ? 'high' : 'low',
      metrics: {
        negativeRatio,
        totalAnalyzed: items.length,
        topIssue: this.findTopIssue(items)
      },
      recommendation: negativeRatio > 0.6 
        ? 'Immediate attention needed on user complaints'
        : 'Continue monitoring'
    };
  }
  
  private findTopIssue(items: any[]): string {
    // Simple keyword analysis
    const keywords = items.flatMap(i => 
      i.content.toLowerCase().split(' ')
    );
    return keywords[0] || 'general feedback'; // Simplified
  }
}

// 3. EIR Agent - Makes strategic decisions
export class EIRAgent extends BaseAgent {
  private insights: any[] = [];
  
  constructor(bus: AgentMessageBus) {
    super('EIR', bus);
  }
  
  protected async handleMessage(message: any): Promise<void> {
    if (message.to !== this.name) return;
    
    if (message.type === 'insight' || message.type === 'urgent_insight') {
      this.insights.push(message.data);
      
      const decision = this.makeStrategicDecision(message.data);
      
      if (decision.action) {
        await this.sendMessage('ActionTaker', 'execute_action', decision);
      }
      
      // Ambient communication - EIR thinking out loud
      await this.sendMessage('broadcast', 'eir_thoughts', {
        thought: `Hmm, seeing ${message.data.trend} trends. ${decision.reasoning}`,
        confidence: decision.confidence
      });
    }
    
    if (message.type === 'user_question') {
      // EIR can also respond to direct questions
      const response = await this.answerQuestion(message.data.question);
      await this.sendMessage('User', 'eir_response', { answer: response });
    }
  }
  
  private makeStrategicDecision(analysis: any): any {
    if (analysis.alertLevel === 'high') {
      return {
        action: 'emergency_meeting',
        reasoning: 'Critical negative feedback spike detected',
        confidence: 0.9,
        details: {
          issue: analysis.metrics.topIssue,
          severity: 'high',
          recommendedActions: [
            'Schedule emergency product review',
            'Prepare incident response',
            'Draft user communication'
          ]
        }
      };
    }
    
    return {
      action: null,
      reasoning: 'Situation stable, continuing to monitor',
      confidence: 0.7
    };
  }
  
  private async answerQuestion(question: string): Promise<string> {
    // Request data from DataMonitor
    await this.sendMessage('DataMonitor', 'query_data', {
      filter: {},
      limit: 50
    });
    
    // In real implementation, wait for response
    return `Based on recent data analysis, here's my EIR perspective on "${question}"...`;
  }
}

// 4. Action Agent - Executes decisions
export class ActionAgent extends BaseAgent {
  constructor(bus: AgentMessageBus) {
    super('ActionTaker', bus);
  }
  
  protected async handleMessage(message: any): Promise<void> {
    if (message.to !== this.name) return;
    
    if (message.type === 'execute_action') {
      const result = await this.executeAction(message.data);
      
      await this.sendMessage('broadcast', 'action_taken', {
        action: message.data.action,
        result,
        timestamp: new Date()
      });
    }
  }
  
  private async executeAction(decision: any): Promise<any> {
    console.log(`🎯 Executing action: ${decision.action}`);
    
    switch (decision.action) {
      case 'emergency_meeting':
        return {
          status: 'scheduled',
          details: 'Emergency meeting scheduled for 30 minutes from now',
          attendees: ['Product', 'Engineering', 'Support']
        };
      
      case 'send_alert':
        return {
          status: 'sent',
          channels: ['Slack', 'Email'],
          recipients: 12
        };
      
      default:
        return { status: 'completed' };
    }
  }
}

// Start the multi-agent system
export async function startAgentSystem() {
  await mongoClient.connect();
  
  const bus = new AgentMessageBus(8080);
  
  // Initialize all agents
  const agents = [
    new DataMonitorAgent(bus),
    new AnalystAgent(bus),
    new EIRAgent(bus),
    new ActionAgent(bus)
  ];
  
  console.log('🤖 Multi-Agent EIR System Started');
  console.log('📡 Agents are now communicating autonomously');
  console.log('👁️ Connect to ws://localhost:8080 to observe agent chatter');
  
  // Simulate some ambient activity
  setTimeout(() => {
    bus.emit('message', {
      from: 'User',
      to: 'EIR',
      type: 'user_question',
      data: { question: "What's the current state of user satisfaction?" }
    });
  }, 3000);
  
  return { bus, agents };
}