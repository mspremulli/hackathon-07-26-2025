# Vapi Troubleshooting Guide

## Current Issue
Getting "Error: undefined" when trying to start a Vapi call.

## Possible Causes

1. **Missing Assistant ID**: Vapi might require you to create an assistant first in their dashboard
2. **API Key Issues**: The public key might need to be paired with a specific assistant
3. **Browser Permissions**: Microphone permissions not granted

## Quick Fixes to Try

### 1. Open test-vapi.html
```bash
# Open in browser
open test-vapi.html
```
This tests Vapi in isolation without Next.js complications.

### 2. Create an Assistant in Vapi Dashboard
1. Go to https://dashboard.vapi.ai
2. Create a new assistant
3. Get the assistant ID
4. Update VoiceEIRClient.tsx with:
```javascript
await vapiRef.current.start({
  assistantId: "your-assistant-id-here"
});
```

### 3. Alternative: Use Web Speech API Demo
If Vapi isn't working, we have a fallback using native browser speech:

```javascript
// In dashboard/components/VoiceFallback.tsx
const recognition = new webkitSpeechRecognition();
const synth = window.speechSynthesis;
```

## For Demo Purposes

If Vapi isn't working in time:
1. Show the integration code and explain the sponsor technology
2. Demonstrate the agent-to-agent communication with the WebSocket viewer
3. Show how voice would enhance the EIR experience
4. Reference the MongoDB data integration that the voice agent would access

## Debug Info
- Public Key: cf68648d-f5c3-4eaa-aebe-489120f48afd
- Error: Generic "undefined" suggests configuration issue
- Vapi requires: Assistant configuration, proper API key, microphone permissions