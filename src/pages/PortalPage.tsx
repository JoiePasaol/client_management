import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Users, Eye, TrendingUp, ExternalLink, Share2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const portalStats = [
  { label: 'Total Views', value: '2,847', change: '+24%', icon: Eye },
  { label: 'Active Users', value: '156', change: '+12%', icon: Users },
  { label: 'Engagement Rate', value: '68%', change: '+8%', icon: TrendingUp },
  { label: 'Shared Links', value: '42', change: '+18%', icon: Share2 },
];

const recentVisitors = [
  { name: 'John Smith', company: 'Acme Corp', time: '2 min ago', page: 'Project Gallery' },
  { name: 'Sarah Johnson', company: 'TechStart', time: '15 min ago', page: 'Services' },
  { name: 'Mike Wilson', company: 'Global Solutions', time: '1 hour ago', page: 'Case Studies' },
  { name: 'Emma Davis', company: 'Innovation Labs', time: '2 hours ago', page: 'Contact' },
];

export function PortalPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portal</h1>
          <p className="text-gray-600 mt-2">Monitor your public portal performance and visitor engagement.</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" className="flex items-center space-x-2">
            <ExternalLink className="h-4 w-4" />
            <span>View Portal</span>
          </Button>
          <Button className="flex items-center space-x-2">
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {portalStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span className="text-green-600 text-sm font-medium">
                    {stat.change}
                  </span>
                  <span className="text-gray-600 text-sm ml-2">from last month</span>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Portal Preview and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Portal Preview */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Portal Preview
            </h3>
            <div className="aspect-video bg-gradient-to-br from-blue-50 via-white to-cyan-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <Globe className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Your Portal</h4>
                <p className="text-gray-600 mb-4">Preview of your public-facing portal</p>
                <Button variant="secondary" className="flex items-center space-x-2 mx-auto">
                  <ExternalLink className="h-4 w-4" />
                  <span>Open Portal</span>
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Recent Visitors */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Visitors</h3>
            <div className="space-y-4">
              {recentVisitors.map((visitor, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-white">
                      {visitor.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{visitor.name}</p>
                    <p className="text-xs text-gray-500">{visitor.company}</p>
                    <p className="text-xs text-blue-600 mt-1">{visitor.page}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{visitor.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Traffic Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Traffic Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Page Views</h4>
              <p className="text-2xl font-bold text-blue-600">2,847</p>
              <p className="text-sm text-gray-600">This month</p>
            </div>
            
            <div className="text-center">
              <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Unique Visitors</h4>
              <p className="text-2xl font-bold text-green-600">1,284</p>
              <p className="text-sm text-gray-600">This month</p>
            </div>
            
            <div className="text-center">
              <div className="h-24 w-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Conversion Rate</h4>
              <p className="text-2xl font-bold text-purple-600">3.2%</p>
              <p className="text-sm text-gray-600">This month</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}