import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Minimize2, Maximize2 } from 'lucide-react';

export default function VoiceDemo() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [eirResponse, setEirResponse] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setEirResponse('');
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      setTranscript(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (transcript) {
        generateEIRResponse(transcript);
      }
    };

    recognition.start();
  };

  const generateEIRResponse = async (question: string) => {
    // Simulate EIR response based on question
    let response = '';
    
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('sentiment') || lowerQuestion.includes('users')) {
      response = "Based on our data, we're seeing 43% negative sentiment, which is concerning. The main issue is app crashes. I recommend prioritizing a hotfix for the crash issue this sprint.";
    } else if (lowerQuestion.includes('priority') || lowerQuestion.includes('focus')) {
      response = "Your top priority should be fixing the app crash issue. We have 13 negative reviews mentioning crashes. This is impacting user retention. Assign your best engineers to this immediately.";
    } else if (lowerQuestion.includes('worry') || lowerQuestion.includes('concerned')) {
      response = "Yes, you should be concerned. A 43% negative sentiment rate is above the danger threshold. But it's fixable - focus on the crash issues first, then address the UI complaints.";
    } else {
      response = "As your EIR, I see we have 30 feedback items to analyze. The data shows clear patterns - crashes and performance issues. Let's discuss your product roadmap to address these concerns.";
    }
    
    setEirResponse(response);
    speak(response);
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    speechSynthesis.speak(utterance);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-8 right-8 z-50"
    >
      <AnimatePresence mode="wait">
        {isMinimized ? (
          // Minimized state - small floating button
          <motion.div
            key="minimized"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="bg-primary-600 rounded-full shadow-lg p-4 cursor-pointer hover:bg-primary-700 transition-all group relative animate-pulse"
            onClick={() => setIsMinimized(false)}
          >
            <div className="flex items-center gap-2">
              <Mic className="w-6 h-6 text-white" />
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                Open Voice EIR
              </div>
              <div className="absolute top-full right-4 -mt-1 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-900"></div>
            </div>
          </motion.div>
        ) : (
          // Expanded state - full interface
          <motion.div
            key="expanded"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl p-6 w-96">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">AI EIR Voice Demo</h3>
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-gray-400" />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
            >
              <Minimize2 className="w-4 h-4 text-gray-600" />
            </motion.button>
          </div>
        </div>
        
        <div className="mb-4 p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg">
          <p className="text-sm font-medium text-primary-900 mb-2">Live Data Context:</p>
          <div className="text-xs text-primary-700 space-y-1">
            <p>• 30 feedback items analyzed</p>
            <p>• 43% negative sentiment (↑ trending)</p>
            <p>• Top issue: App crashes</p>
            <p>• Sources: GitHub, Discord, Glassdoor</p>
          </div>
        </div>
        
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 p-3 bg-gray-50 rounded-lg"
          >
            <p className="text-xs text-gray-600">You asked:</p>
            <p className="text-sm font-medium">{transcript}</p>
          </motion.div>
        )}
        
        {eirResponse && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-blue-50 rounded-lg"
          >
            <p className="text-xs text-gray-600">EIR Analysis:</p>
            <p className="text-sm font-medium text-blue-900">{eirResponse}</p>
          </motion.div>
        )}
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startListening}
          disabled={isListening}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            isListening 
              ? 'bg-red-500 text-white' 
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-5 h-5" />
              Listening...
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              Ask Your EIR
            </>
          )}
        </motion.button>
        
        <div className="mt-4 space-y-1">
          <p className="text-xs text-gray-500 text-center font-medium">Try asking:</p>
          <p className="text-xs text-gray-400 text-center">"What's our user sentiment?"</p>
          <p className="text-xs text-gray-400 text-center">"Should I be worried?"</p>
          <p className="text-xs text-gray-400 text-center">"What's our top priority?"</p>
        </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}