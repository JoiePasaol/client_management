import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  FolderOpen,
  Globe,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  PlayCircle,
  CircleDollarSign,
} from "lucide-react";
import { Card } from "../components/ui/Card";

const stats = [
  {
    name: "Total Clients",
    value: "24",
    change: "+12%",
    changeType: "positive",
    icon: Users,
  },
  {
    name: "Active Projects",
    value: "18",
    change: "+8%",
    changeType: "positive",
    icon: FolderOpen,
  },
  {
    name: "Portal Views",
    value: "2.4k",
    change: "+24%",
    changeType: "positive",
    icon: Globe,
  },
  {
    name: "Revenue",
    value: "$84.2k",
    change: "+15%",
    changeType: "positive",
    icon: TrendingUp,
  },
];

const recentActivities = [
  {
    id: 1,
    type: "client",
    message: 'New client "Acme Corp" added to the system',
    date: "08/12/2025",
    icon: Users,
  },
  {
    id: 2,
    type: "project",
    message: 'Project "E-commerce Platform" marked as completed',
    date: "08/13/2025",
    icon: FolderOpen,
  },
  {
    id: 3,
    type: "portal",
    message: "Portal accessed by 5 new users today",
    date: "08/14/2025",
    icon: Globe,
  },
  {
    id: 4,
    type: "system",
    message: "System maintenance completed successfully",
    date: "08/15/2025",
    icon: Activity,
  },
];

// Quick Insight Data
const projectStatus = [
  { id: 1, label: "Started", value: 12, icon: PlayCircle },
  { id: 2, label: "Finished", value: 6, icon: CheckCircle },
  { id: 3, label: "Total", value: 18, icon: FolderOpen },
];

const financialOverview = [
  { id: 1, label: "Total Budget", value: "$120k", icon: CircleDollarSign },
  { id: 2, label: "Paid", value: "$84k", icon: CircleDollarSign },
  { id: 3, label: "Outstanding", value: "$36k", icon: CircleDollarSign },
];

export function DashboardPage() {
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
        <div className="text-right">
          <p className="text-sm text-gray-400">Last updated</p>
          <p className="text-sm font-medium text-white">
            {new Date().toLocaleString()}
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
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
                    <p className="text-sm font-medium text-gray-400">
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
                <div className="mt-4 flex items-center">
                  <span className="text-green-600 text-sm font-medium">
                    {stat.change}
                  </span>
                  <span className="text-gray-400 text-sm ml-2">
                    from last month
                  </span>
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
            <div className="space-y-4">
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-start space-x-3 border border-gray-700 p-4 rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-gray-700 rounded-full flex items-center justify-center">
                        <Icon className="h-4 w-4 text-gray-300" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">{activity.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {activity.date}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
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
                {projectStatus.map((item, index) => {
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
