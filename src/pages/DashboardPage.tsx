import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  FolderOpen,
  TrendingUp,
  Clock,
  CheckCircle,
  PlayCircle,
  PhilippinePeso,
  Edit,
  Trash2
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { LoadingState } from "../components/common/LoadingState";
import { ErrorState } from "../components/common/ErrorState";
import { 
  clientService, 
  projectService,
  paymentService,
  projectUpdateService,
  type DashboardStats,
  type ProjectStatusStats,
  type FinancialStats,
  type PaymentWithDetails,
  type ProjectUpdateWithDetails,
  type ProjectWithStats
} from "../services/database";
import { formatCurrency } from "../utils/formatters";

interface RecentActivity {
  id: string;
  type: 'payment' | 'update' | 'project_finished' | 'project_started' | 'payment_deleted' | 'update_deleted';
  clientName: string;
  projectTitle: string;
  message: string;
  date: string;
  icon: React.ComponentType<any>;
  amount?: number;
  updateDescription?: string;
}

export function DashboardPage() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [projectStatusStats, setProjectStatusStats] = useState<ProjectStatusStats | null>(null);
  const [financialStats, setFinancialStats] = useState<FinancialStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDateOnly = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset time to compare dates only
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const truncateText = (text: string, maxLength: number = 60): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const fetchRecentActivities = async (): Promise<RecentActivity[]> => {
    try {
      // Get recent payments, updates, and projects
      const [payments, updates, projects] = await Promise.all([
        paymentService.getAllPaymentsWithDetails(),
        projectUpdateService.getAllUpdatesWithDetails(),
        projectService.getAllProjectsWithStats()
      ]);

      const activities: RecentActivity[] = [];

      // Add recent payments (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      payments
        .filter(payment => new Date(payment.created_at) >= thirtyDaysAgo)
        .forEach(payment => {
          if (payment.project?.client) {
            activities.push({
              id: `payment-${payment.id}`,
              type: 'payment',
              clientName: payment.project.client.full_name,
              projectTitle: payment.project.title,
              message: `Payment received ${formatCurrency(payment.amount)} for ${truncateText(payment.project.title, 30)}`,
              date: payment.created_at,
              icon: PhilippinePeso,
              amount: payment.amount
            });
          }
        });

      // Add recent project updates (last 30 days)
      updates
        .filter(update => new Date(update.created_at) >= thirtyDaysAgo)
        .forEach(update => {
          if (update.project?.client) {
            activities.push({
              id: `update-${update.id}`,
              type: 'update',
              clientName: update.project.client.full_name,
              projectTitle: update.project.title,
              message: `Project updates for ${truncateText(update.project.title, 30)}`,
              date: update.created_at,
              icon: Edit,
              updateDescription: update.description
            });
          }
        });

      // Add recently finished projects (last 30 days)
      projects
        .filter(project => {
          if (project.status !== 'Finished') return false;
          // Assuming projects have an updated_at field, or we can use created_at as a fallback
          const projectDate = new Date(project.created_at);
          return projectDate >= thirtyDaysAgo;
        })
        .forEach(project => {
          if (project.client) {
            activities.push({
              id: `project-finished-${project.id}`,
              type: 'project_finished',
              clientName: project.client.full_name,
              projectTitle: project.title,
              message: `Project completed for ${truncateText(project.title, 30)}`,
              date: project.created_at,
              icon: CheckCircle
            });
          }
        });

      // Add recently started projects (last 30 days)
      projects
        .filter(project => {
          if (project.status !== 'Started') return false;
          const projectDate = new Date(project.created_at);
          return projectDate >= thirtyDaysAgo;
        })
        .forEach(project => {
          if (project.client) {
            activities.push({
              id: `project-started-${project.id}`,
              type: 'project_started',
              clientName: project.client.full_name,
              projectTitle: project.title,
              message: `New project started from ${project.client.full_name} for ${truncateText(project.title, 30)}`,
              date: project.created_at,
              icon: PlayCircle
            });
          }
        });

      // Sort by date (most recent first) and limit to 4 items
      return activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 4);

    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch clients, projects, and payments data
        const [clients, projects, allPayments, activities] = await Promise.all([
          clientService.getAllClientsWithStats(),
          projectService.getAllProjectsWithStats(),
          paymentService.getAllPaymentsWithDetails(),
          fetchRecentActivities()
        ]);

        // Calculate dashboard statistics
        const totalClients = clients.length;
        const totalProjects = projects.length;
        const totalBudget = projects.reduce((sum, project) => sum + (project.budget || 0), 0);
        const totalPaid = projects.reduce((sum, project) => sum + (project.total_paid || 0), 0);
        
        // Calculate monthly revenue (last 30 days of payments)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const monthlyRevenue = allPayments
          .filter(payment => new Date(payment.payment_date) >= thirtyDaysAgo)
          .reduce((sum, payment) => sum + (payment.amount || 0), 0);
        
        // Calculate total revenue (all payments)
        const totalRevenue = allPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        
        setDashboardStats({
          totalClients,
          totalProjects,
          monthlyRevenue,
          totalRevenue
        });

        // Calculate project status statistics
        const startedProjects = projects.filter(p => p.status === 'Started').length;
        const finishedProjects = projects.filter(p => p.status === 'Finished').length;
        
        setProjectStatusStats({
          started: startedProjects,
          finished: finishedProjects,
          total: totalProjects
        });

        // Calculate financial statistics
        const outstanding = totalBudget - totalPaid;
        
        setFinancialStats({
          totalBudget,
          totalPaid,
          outstanding
        });

        // Set recent activities
        setRecentActivities(activities);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (error || !dashboardStats || !projectStatusStats || !financialStats) {
    return (
      <ErrorState 
        message={error || "Failed to load dashboard data"} 
        onRetry={() => window.location.reload()} 
      />
    );
  }

  const stats = [
    {
      name: "Total Clients",
      value: dashboardStats.totalClients.toString(),
      icon: Users,
    },
    {
      name: "Total Projects",
      value: dashboardStats.totalProjects.toString(),
      icon: FolderOpen,
    },
    {
      name: "Monthly Revenue",
      value: formatCurrency(dashboardStats.monthlyRevenue),
      icon: TrendingUp,
    },
    {
      name: "Total Revenue",
      value: formatCurrency(dashboardStats.totalRevenue),
      icon: TrendingUp,
    },
  ];

  // Project Status Data 
  const projectStatus = [
    { id: 1, label: "Started", value: projectStatusStats.started, icon: PlayCircle },
    { id: 2, label: "Finished", value: projectStatusStats.finished, icon: CheckCircle },
    { id: 3, label: "Total", value: projectStatusStats.total, icon: FolderOpen },
  ];

  // Financial Overview Data 
  const financialOverview = [
    { 
      id: 1, 
      label: "Total Budget", 
      value: formatCurrency(financialStats.totalBudget), 
      icon: PhilippinePeso
    },
    { 
      id: 2, 
      label: "Paid", 
      value: formatCurrency(financialStats.totalPaid), 
      icon: PhilippinePeso
    },
    { 
      id: 3, 
      label: "Outstanding", 
      value: formatCurrency(financialStats.outstanding), 
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
        {/* Recent Activity (Now Functional) */}
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
              {recentActivities.length > 0 ? (
                recentActivities.slice(0, 4).map((activity, index) => {
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
                        <p className="text-sm text-white font-medium">
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Client: {activity.clientName}
                        </p>
                        {activity.type === 'update' && activity.updateDescription && (
                          <p className="text-xs text-gray-300 mt-1">
                            "{truncateText(activity.updateDescription, 50)}"
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {formatDateOnly(activity.date)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No recent activity</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Activity from the last 30 days will appear here
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Quick Insight (functional) */}
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