'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Phone, PhoneOff } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import Vapi to avoid SSR issues
const Vapi = dynamic(() => import('@vapi-ai/web'), { ssr: false });

export default function VoiceEIRClient() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Ready');
  const vapiRef = useRef<any>(null);

  const handleStartCall = async () => {
    try {
      const VapiModule = await import('@vapi-ai/web');
      const VapiClass = VapiModule.default;
      
      if (!vapiRef.current) {
        vapiRef.current = new VapiClass('cf68648d-f5c3-4eaa-aebe-489120f48afd');
      }
      
      setStatusMessage('Connecting...');
      
      // Basic call with minimal config
      await vapiRef.current.start();
      
      setIsCallActive(true);
      setStatusMessage('Connected - Say hello!');
    } catch (error: any) {
      console.error('Vapi error details:', error);
      setStatusMessage('Error: Check console');
    }
  };

  const handleEndCall = () => {
    if (vapiRef.current) {
      vapiRef.current.stop();
      setIsCallActive(false);
      setStatusMessage('Call ended');
    }
  };

  return (
    <div className="fixed bottom-8 right-8 bg-white rounded-lg shadow-lg p-4">
      <p className="text-sm mb-2">{statusMessage}</p>
      <button
        onClick={isCallActive ? handleEndCall : handleStartCall}
        className={`px-4 py-2 rounded flex items-center gap-2 ${
          isCallActive ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
        }`}
      >
        {isCallActive ? (
          <>
            <PhoneOff size={16} />
            End
          </>
        ) : (
          <>
            <Phone size={16} />
            Call EIR
          </>
        )}
      </button>
    </div>
  );
}