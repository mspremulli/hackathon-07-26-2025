import { startAgentSystem } from './src/agents/agent-system';

async function main() {
  console.log('🚀 Starting Multi-Agent EIR System...\n');
  
  try {
    const { bus, agents } = await startAgentSystem();
    
    console.log('\n📡 Agent system is running!');
    console.log('👁️  Open agent-viewer.html in your browser to watch agents communicate');
    console.log('💬 Agents will autonomously monitor data and make decisions\n');
    
    // Simulate some user interactions after 10 seconds
    setTimeout(() => {
      console.log('🧑 User asking a question...');
      bus.emit('message', {
        from: 'User',
        to: 'EIR',
        type: 'user_question',
        data: { 
          question: "Should we be concerned about the recent feedback trends?" 
        }
      });
    }, 10000);
    
    // Simulate urgent data after 20 seconds
    setTimeout(() => {
      console.log('⚠️  Simulating negative feedback spike...');
      bus.emit('message', {
        from: 'DataMonitor',
        to: 'Analyst',
        type: 'new_data',
        data: {
          count: 15,
          items: Array(15).fill(null).map((_, i) => ({
            id: `urgent-${i}`,
            sentiment: 'negative',
            content: 'App keeps crashing on startup!',
            source: 'app_store',
            timestamp: new Date()
          }))
        }
      });
    }, 20000);
    
  } catch (error) {
    console.error('❌ Failed to start agent system:', error);
    process.exit(1);
  }
}

main();