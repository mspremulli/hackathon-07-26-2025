import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  TrendingUp, 
  Users, 
  Star,
  RefreshCw,
  Download,
  Bell,
  BarChart3,
  Building2
} from 'lucide-react';
import StatsCard from '../components/StatsCard';
import SentimentChart from '../components/SentimentChart';
import TrendChart from '../components/TrendChart';
import FeedbackList from '../components/FeedbackList';
import TopIssues from '../components/TopIssues';
import DataUpload from '../components/DataUpload';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues
const VoiceEIR = dynamic(() => import('../components/VoiceDemo'), {
  ssr: false,
  loading: () => <div className="fixed bottom-8 right-8 bg-gray-200 rounded-lg p-4">Loading Voice...</div>
});

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [companyConfig, setCompanyConfig] = useState<any>({ 
    companyName: 'Your Company',
    logo: '🏢'
  });

  const fetchCompanyConfig = async () => {
    try {
      const res = await fetch('/api/company-config');
      if (res.ok) {
        const config = await res.json();
        setCompanyConfig(config);
      }
    } catch (error) {
      console.error('Failed to fetch company config:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // Try MongoDB API first, fallback to Senso API
      let statsRes, feedbackRes;
      
      try {
        // Try MongoDB API on port 3003
        const [mongoStatsRes, mongoFeedbackRes] = await Promise.all([
          fetch('http://localhost:3003/api/stats'),
          fetch('http://localhost:3003/api/feedback?limit=50')
        ]);
        
        if (mongoStatsRes.ok && mongoFeedbackRes.ok) {
          statsRes = await mongoStatsRes.json();
          feedbackRes = await mongoFeedbackRes.json();
          console.log('📊 Loaded data from MongoDB');
        } else {
          throw new Error('MongoDB API not available');
        }
      } catch (mongoError) {
        // Fallback to Senso API
        console.log('📡 Falling back to Senso API');
        const [sensoStatsRes, sensoFeedbackRes] = await Promise.all([
          fetch('/api/senso/stats').then(r => r.json()),
          fetch('/api/senso/feedback').then(r => r.json())
        ]);
        statsRes = sensoStatsRes;
        feedbackRes = sensoFeedbackRes;
      }
      
      setStats(statsRes);
      setFeedback(feedbackRes);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyConfig();
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="w-8 h-8 text-primary-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">COO/EIR Assistant</h1>
              <div className="ml-4 flex items-center bg-primary-50 px-3 py-1 rounded-lg">
                <span className="text-lg mr-2">{companyConfig.logo}</span>
                <span className="text-sm font-medium text-primary-700">{companyConfig.companyName}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchData}
                className="p-2 rounded-lg bg-primary-100 text-primary-600 hover:bg-primary-200 transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <Bell className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium hover:from-primary-700 hover:to-primary-800 transition-all"
              >
                <Download className="w-4 h-4 inline mr-2" />
                Export Report
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Feedback"
            value={stats?.totalFeedback || 0}
            subtitle="From all sources"
            icon={MessageSquare}
            trend={12}
            color="primary"
          />
          <StatsCard
            title="Average Rating"
            value={stats?.averageRating ? parseFloat(stats.averageRating).toFixed(1) : '0.0'}
            subtitle="Out of 5.0"
            icon={Star}
            trend={-5}
            color="warning"
          />
          <StatsCard
            title="Active Sources"
            value={Object.keys(stats?.sourceBreakdown || {}).length}
            subtitle="Data sources"
            icon={Users}
            color="success"
          />
          <StatsCard
            title="Sentiment Score"
            value={`${((stats?.sentimentBreakdown?.positive || 0) / (stats?.totalFeedback || 1) * 100).toFixed(0)}%`}
            subtitle="Positive feedback"
            icon={TrendingUp}
            trend={8}
            color="purple"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <SentimentChart data={stats?.sentimentBreakdown || { positive: 0, negative: 0, neutral: 0, mixed: 0 }} />
          <TrendChart data={stats?.recentTrends || []} />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <FeedbackList feedback={feedback} />
          </div>
          <div className="space-y-6">
            <TopIssues issues={stats?.topIssues || []} />
            <DataUpload onUploadComplete={fetchData} />
          </div>
        </div>

        {/* Source Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-8 rounded-2xl bg-white p-6 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Sources</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats?.sourceBreakdown || {}).map(([source, count]) => (
              <motion.div
                key={source}
                whileHover={{ scale: 1.05 }}
                className="p-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 text-center"
              >
                <p className="text-2xl font-bold text-gray-900">{count as number}</p>
                <p className="text-sm text-gray-600 mt-1 capitalize">{source.replace('_', ' ')}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
      
      {/* Voice EIR Assistant */}
      <VoiceEIR />
    </div>
  );
}