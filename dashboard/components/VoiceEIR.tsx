import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react';
import Vapi from '@vapi-ai/web';

export default function VoiceEIR() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Ready to connect');
  const [transcript, setTranscript] = useState('');
  const vapiRef = useRef<Vapi | null>(null);

  useEffect(() => {
    // Initialize Vapi with your API key
    const vapiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY || 'cf68648d-f5c3-4eaa-aebe-489120f48afd';
    console.log('Initializing Vapi with key:', vapiKey.substring(0, 10) + '...');
    
    try {
      vapiRef.current = new Vapi(vapiKey);
    } catch (initError) {
      console.error('Failed to initialize Vapi:', initError);
      setStatusMessage('Failed to initialize Vapi');
      return;
    }
    
    const vapi = vapiRef.current;
    
    // Set up event listeners
    vapi.on('call-start', () => {
      setIsCallActive(true);
      setStatusMessage('Connected to your EIR');
    });
    
    vapi.on('call-end', () => {
      setIsCallActive(false);
      setStatusMessage('Call ended');
      setTranscript('');
    });
    
    vapi.on('speech-start', () => {
      setStatusMessage('Listening...');
    });
    
    vapi.on('speech-end', () => {
      setStatusMessage('Processing...');
    });
    
    vapi.on('message', (message: any) => {
      if (message.type === 'transcript' && message.role === 'user') {
        setTranscript(message.transcript);
      }
    });
    
    vapi.on('error', (error: any) => {
      console.error('Vapi error:', error);
      setStatusMessage('Error: ' + (error?.message || error?.error || JSON.stringify(error)));
    });
    
    return () => {
      vapi.stop();
    };
  }, []);

  const toggleCall = async () => {
    const vapi = vapiRef.current;
    if (!vapi) return;
    
    if (isCallActive) {
      vapi.stop();
    } else {
      setStatusMessage('Connecting...');
      
      try {
        console.log('Starting Vapi call...');
        
        await vapi.start({
          name: "EIR Assistant",
          assistant: {
            firstMessage: "Hello, I'm your AI Entrepreneur in Residence. I've been analyzing your product metrics and user feedback. How can I help you today?",
            model: {
              provider: "openai",
              model: "gpt-4-turbo-preview",
              messages: [
                {
                  role: "system",
                  content: `You are an experienced Entrepreneur in Residence (EIR) at a top tech company. 
                  You have access to real-time data about user feedback, sentiment analysis, and product metrics.
                  
                  Current data:
                  - Total feedback: 30 items
                  - Sentiment: 43% negative, 33% positive, 23% neutral  
                  - Top sources: GitHub, Discord, Glassdoor, HackerNews
                  - Key issue: Increased negative feedback about app crashes
                  
                  Be concise, strategic, and actionable. Reference real data when answering.`
                }
              ]
            },
            voice: {
              provider: "playht",
              voiceId: "jennifer"
            },
            silenceTimeoutSeconds: 30
          }
        });
      } catch (error) {
        console.error('Failed to start Vapi:', error);
        setStatusMessage('Failed to connect');
        setIsCallActive(false);
      }
    }
  };

  // Add data query capability
  const queryData = async (query: string) => {
    try {
      const response = await fetch('/api/senso/stats');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch data:', error);
      return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-8 right-8 z-50"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-96">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">AI EIR Assistant</h3>
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">Powered by Vapi</span>
          </div>
        </div>
        
        <div className="mb-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Status</span>
            <motion.div
              animate={{ 
                scale: isCallActive ? [1, 1.2, 1] : 1,
                opacity: isCallActive ? [1, 0.8, 1] : 1
              }}
              transition={{ 
                repeat: isCallActive ? Infinity : 0,
                duration: 2
              }}
              className={`w-2 h-2 rounded-full ${
                isCallActive ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
          </div>
          <p className="text-sm text-gray-600">{statusMessage}</p>
        </div>
        
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-primary-50 rounded-lg"
          >
            <p className="text-xs text-gray-600 mb-1">You said:</p>
            <p className="text-sm font-medium text-primary-900">{transcript}</p>
          </motion.div>
        )}
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleCall}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            isCallActive 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {isCallActive ? (
            <>
              <PhoneOff className="w-5 h-5" />
              End Conversation
            </>
          ) : (
            <>
              <Phone className="w-5 h-5" />
              Talk to Your EIR
            </>
          )}
        </motion.button>
        
        <div className="mt-4 space-y-2">
          <p className="text-xs text-gray-500 text-center">
            Try asking your EIR:
          </p>
          <div className="space-y-1">
            <p className="text-xs text-gray-400 text-center">
              "What's our current user sentiment?"
            </p>
            <p className="text-xs text-gray-400 text-center">
              "Should I be worried about the negative feedback?"
            </p>
            <p className="text-xs text-gray-400 text-center">
              "What should be our top priority?"
            </p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Real-time data integration</span>
            <span className="flex items-center gap-1">
              <Mic className="w-3 h-3" />
              Voice by ElevenLabs
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}