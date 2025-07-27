# 🎙️ Vapi Voice EIR Demo Guide

## Setup

1. **Add your Vapi API key to `.env.local`**:
```bash
NEXT_PUBLIC_VAPI_API_KEY=your-vapi-api-key
```

2. **Start the services**:
```bash
# Terminal 1 - MongoDB API
npm run api:mongodb

# Terminal 2 - Agent System (optional for full demo)
npm run agents:start

# Terminal 3 - Dashboard
cd dashboard && npm run dev
```

3. **Open Dashboard**: http://localhost:3001

## Voice EIR Features

### What it does:
- **Real Voice Conversation**: Talk naturally with your AI EIR using ElevenLabs voice
- **Live Data Integration**: The EIR knows your current metrics (30 feedback items, 43% negative sentiment)
- **Strategic Advisor**: Acts like a real EIR - gives actionable advice, not just data

### Demo Script

1. **Click "Talk to Your EIR"** button in bottom right

2. **Wait for connection** (status will show "Connected to your EIR")

3. **The EIR will introduce itself** with a professional voice

4. **Try these questions**:
   - "What's our current user sentiment?"
   - "Should I be worried about the negative feedback?"
   - "What should be our top priority right now?"
   - "How bad is the crash issue?"
   - "What would you recommend we do next?"

### Key Points for Judges

- **Vapi Integration**: Shows sponsor technology in action
- **Real-time Data**: EIR references actual MongoDB data
- **Natural Conversation**: Deepgram transcription + GPT-4 + ElevenLabs
- **Agent Communication**: Voice is another agent in the system

### Technical Details

- **Transcription**: Deepgram Nova-2 (ultra-low latency)
- **LLM**: GPT-4 Turbo with custom EIR prompt
- **Voice**: ElevenLabs Adam (professional male voice)
- **Latency**: ~500ms end-to-end

### Troubleshooting

If voice doesn't work:
1. Check browser console for errors
2. Ensure Vapi API key is set
3. Try refreshing the page
4. Check microphone permissions

## Agent-to-Agent Demo

For full ambient agent communication:
1. Open `agent-viewer.html` in another tab
2. Watch agents communicate in real-time
3. Ask the Voice EIR a question
4. See how it triggers other agents to gather data

The Voice EIR is essentially another agent in the multi-agent system!