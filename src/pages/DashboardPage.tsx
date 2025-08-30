// src/pages/DashboardPage.tsx (updated)
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  FolderOpen,
  TrendingUp,
  Clock,
  CheckCircle,
  PlayCircle,
  PhilippinePeso
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { LoadingState } from "../components/common/LoadingState";
import { ErrorState } from "../components/common/ErrorState";
import { formatCurrency } from "../utils/formatters";
import { dashboardService, type DashboardData } from "../services/dashboardService";

// Simple cache implementation
const dashboardCache = {
  data: null as DashboardData | null,
  timestamp: 0,
  ttl: 2 * 60 * 1000, // 2 minutes

  get(): DashboardData | null {
    if (Date.now() - this.timestamp < this.ttl && this.data) {
      return this.data;
    }
    return null;
  },

  set(data: DashboardData) {
    this.data = data;
    this.timestamp = Date.now();
  },

  clear() {
    this.data = null;
    this.timestamp = 0;
  }
};

export function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check cache first
        const cachedData = dashboardCache.get();
        if (cachedData) {
          setDashboardData(cachedData);
          setLoading(false);
          return;
        }

        const data = await dashboardService.getDashboardData();
        setDashboardData(data);
        dashboardCache.set(data);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Refresh data every 5 minutes
    const intervalId = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const highlightAmounts = (message: string) => {
    if (!message) return '';
    
    const currencyPatterns = [
      /₱[\d,]+(?:\.\d{2})?/g, 
    ];

    let highlightedMessage = message;
    
    currencyPatterns.forEach(pattern => {
      highlightedMessage = highlightedMessage.replace(pattern, (match) => {
        return `<span class="text-green-400 font-semibold">${match}</span>`;
      });
    });

    return highlightedMessage;
  };

  if (loading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (error || !dashboardData) {
    return (
      <ErrorState 
        message={error || "Failed to load dashboard data"} 
        onRetry={() => window.location.reload()} 
      />
    );
  }

  // Defensive programming: ensure all required properties exist with defaults
  const stats = dashboardData.stats || {
    totalClients: 0,
    totalProjects: 0,
    monthlyRevenue: 0,
    totalRevenue: 0
  };

  const projectStatus = dashboardData.projectStatus || {
    started: 0,
    finished: 0,
    total: 0
  };

  const financials = dashboardData.financials || {
    totalBudget: 0,
    totalPaid: 0,
    outstanding: 0
  };

  const activities = dashboardData.activities || [];

  const statsCards = [
    {
      name: "Total Clients",
      value: stats.totalClients.toString(),
      icon: Users,
    },
    {
      name: "Total Projects",
      value: stats.totalProjects.toString(),
      icon: FolderOpen,
    },
    {
      name: "Monthly Revenue",
      value: formatCurrency(stats.monthlyRevenue),
      icon: TrendingUp,
    },
    {
      name: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
    },
  ];

  const projectStatusData = [
    { id: 1, label: "Started", value: projectStatus.started, icon: PlayCircle },
    { id: 2, label: "Finished", value: projectStatus.finished, icon: CheckCircle },
    { id: 3, label: "Total", value: projectStatus.total, icon: FolderOpen },
  ];

  const financialOverview = [
    { 
      id: 1, 
      label: "Total Budget", 
      value: formatCurrency(financials.totalBudget), 
      icon: PhilippinePeso
    },
    { 
      id: 2, 
      label: "Paid", 
      value: formatCurrency(financials.totalPaid), 
      icon: PhilippinePeso
    },
    { 
      id: 3, 
      label: "Outstanding", 
      value: formatCurrency(financials.outstanding), 
      icon: PhilippinePeso
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-2">
            Welcome back! Here's what's happening with your business today.
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-400">
                      {stat.name}
                    </p>
                    <p className="text-2xl font-bold text-white mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Recent Activity
              </h3>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            
            {!activities || activities.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No recent activities</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {activities.map((activity, index) => {
                  if (!activity || !activity.id) return null;
                  
                  const Icon = activity.icon_type === 'peso' ? PhilippinePeso : FolderOpen;
                  
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="flex items-start space-x-3 border border-gray-700 p-4 rounded-lg hover:border-gray-600 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-gray-700 rounded-full flex items-center justify-center">
                          <Icon className="h-4 w-4 text-gray-300" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p 
                          className="text-sm text-white leading-relaxed"
                          dangerouslySetInnerHTML={{ 
                            __html: highlightAmounts(activity.message || '') 
                          }}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          {activity.date || ''}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Quick Insight */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Quick Insight
              </h3>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>

            {/* Project Status */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-400 mb-2">
                Project Status
              </h4>
              <div className="space-y-3">
                {projectStatusData.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="flex items-center justify-between border border-gray-700 p-3 rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 bg-gray-700 rounded-full flex items-center justify-center">
                          <Icon className="h-4 w-4 text-gray-300" />
                        </div>
                        <span className="text-sm text-white">{item.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {item.value}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Financial Overview */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">
                Financial Overview
              </h4>
              <div className="space-y-3">
                {financialOverview.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.0 + index * 0.1 }}
                      className="flex items-center justify-between border border-gray-700 p-3 rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 bg-gray-700 rounded-full flex items-center justify-center">
                          <Icon className="h-4 w-4 text-gray-300" />
                        </div>
                        <span className="text-sm text-white">{item.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {item.value}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}