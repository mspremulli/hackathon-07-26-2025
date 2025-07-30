import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: number;
  color?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  color = 'primary'
}: StatsCardProps) {
  const colorClasses = {
    primary: 'from-blue-500 to-blue-600',
    success: 'from-green-500 to-green-600',
    warning: 'from-yellow-500 to-yellow-600',
    danger: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow"
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
            {trend !== undefined && (
              <div className="mt-2 flex items-center">
                <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trend >= 0 ? '+' : ''}{trend}%
                </span>
                <span className="ml-1 text-sm text-gray-500">vs last week</span>
              </div>
            )}
          </div>
          <div className={`rounded-lg bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses]} p-3`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent shimmer" />
    </motion.div>
  );
}