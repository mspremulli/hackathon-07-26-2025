import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Phone, PhoneOff, Volume2 } from 'lucide-react';
import Vapi from '@vapi-ai/web';

export default function VoiceEIRSimple() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Ready to connect');
  const vapiRef = useRef<Vapi | null>(null);

  useEffect(() => {
    // Initialize Vapi
    const publicKey = 'cf68648d-f5c3-4eaa-aebe-489120f48afd';
    
    try {
      vapiRef.current = new Vapi(publicKey);
      console.log('Vapi initialized successfully');
    } catch (error) {
      console.error('Vapi init error:', error);
    }
  }, []);

  const startCall = async () => {
    if (!vapiRef.current) return;
    
    setStatusMessage('Connecting...');
    
    try {
      // Simple configuration
      await vapiRef.current.start({
        assistantId: undefined, // Let Vapi create a default assistant
        assistant: {
          firstMessage: "Hi, I'm your EIR assistant. How can I help with your product today?",
          context: "You are an EIR. The user has a product with 30 feedback items, 43% negative sentiment.",
          voice: "jennifer-playht"
        }
      });
      
      setIsCallActive(true);
      setStatusMessage('Connected');
    } catch (error: any) {
      console.error('Start call error:', error);
      setStatusMessage(`Error: ${error.message || 'Failed to connect'}`);
    }
  };

  const endCall = () => {
    if (vapiRef.current) {
      vapiRef.current.stop();
      setIsCallActive(false);
      setStatusMessage('Call ended');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-8 left-8 z-50"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Voice EIR (Simple)</h3>
          <Volume2 className="w-4 h-4 text-gray-400" />
        </div>
        
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">{statusMessage}</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isCallActive ? endCall : startCall}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            isCallActive 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {isCallActive ? (
            <>
              <PhoneOff className="w-5 h-5" />
              End Call
            </>
          ) : (
            <>
              <Phone className="w-5 h-5" />
              Start Call
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}