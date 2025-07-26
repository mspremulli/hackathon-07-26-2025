import { motion } from 'framer-motion';
import { MessageSquare, Star, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface FeedbackItem {
  id: string;
  source: string;
  type: string;
  timestamp: Date;
  sentiment?: string;
  rating?: number;
  content?: string;
  tags?: string[];
}

interface FeedbackListProps {
  feedback: FeedbackItem[];
}

export default function FeedbackList({ feedback }: FeedbackListProps) {
  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'negative':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'neutral':
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      app_store: 'bg-blue-100 text-blue-800',
      reddit: 'bg-orange-100 text-orange-800',
      google_play: 'bg-green-100 text-green-800',
      twitter: 'bg-sky-100 text-sky-800',
      glassdoor: 'bg-purple-100 text-purple-800',
      default: 'bg-gray-100 text-gray-800'
    };
    return colors[source] || colors.default;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-2xl bg-white shadow-lg overflow-hidden"
    >
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Feedback</h3>
      </div>
      
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {feedback.slice(0, 10).map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start space-x-3">
              {getSentimentIcon(item.sentiment)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSourceColor(item.source)}`}>
                      {item.source.replace('_', ' ')}
                    </span>
                    {item.rating && (
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm text-gray-600">{item.rating}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {format(new Date(item.timestamp), 'MMM dd, HH:mm')}
                  </span>
                </div>
                
                {item.content && (
                  <p className="text-sm text-gray-700 line-clamp-2">{item.content}</p>
                )}
                
                {item.tags && item.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}