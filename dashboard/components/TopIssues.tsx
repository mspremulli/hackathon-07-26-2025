import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Issue {
  issue: string;
  count: number;
  sentiment: string;
}

interface TopIssuesProps {
  issues: Issue[];
}

export default function TopIssues({ issues }: TopIssuesProps) {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-50';
      case 'negative':
        return 'text-red-600 bg-red-50';
      case 'mixed':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="w-4 h-4" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="rounded-2xl bg-white p-6 shadow-lg"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Issues & Topics</h3>
      
      <div className="space-y-3">
        {issues.map((issue, index) => (
          <motion.div
            key={issue.issue}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${getSentimentColor(issue.sentiment)}`}>
                {getSentimentIcon(issue.sentiment)}
              </div>
              <div>
                <p className="font-medium text-gray-900">{issue.issue}</p>
                <p className="text-sm text-gray-500">{issue.count} mentions</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    issue.sentiment === 'negative' ? 'bg-red-500' : 
                    issue.sentiment === 'positive' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.min((issue.count / issues[0].count) * 100, 100)}%` }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="mt-4 w-full py-2 px-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all"
      >
        View All Issues
      </motion.button>
    </motion.div>
  );
}