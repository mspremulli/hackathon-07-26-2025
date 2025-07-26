import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface SentimentData {
  positive: number;
  negative: number;
  neutral: number;
  mixed: number;
}

interface SentimentChartProps {
  data: SentimentData;
}

export default function SentimentChart({ data }: SentimentChartProps) {
  const chartData = [
    { name: 'Positive', value: data.positive, color: '#10B981' },
    { name: 'Negative', value: data.negative, color: '#EF4444' },
    { name: 'Neutral', value: data.neutral, color: '#6B7280' },
    { name: 'Mixed', value: data.mixed, color: '#F59E0B' }
  ].filter(item => item.value > 0);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl bg-white p-6 shadow-lg"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Analysis</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${((value / total) * 100).toFixed(1)}%`, 'Percentage']}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center">
            <div 
              className="w-4 h-4 rounded-full mr-2" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-gray-600">
              {item.name}: {item.value} ({((item.value / total) * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}