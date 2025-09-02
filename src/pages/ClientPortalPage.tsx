// src/pages/ClientPortalPage.tsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Calendar,
  PhilippinePeso,
  User,
  Clock,
  CheckCircle,
  FileText,
  CreditCard,
  AlertCircle
} from 'lucide-react'

import { clientPortalService, type ClientPortalWithProject } from '../services/clientPortalService'
import { formatCurrency, formatDate } from '../utils/formatters'
import { calculatePaymentProgress, getDeadlineStatus, isPaymentCompleted } from '../utils/calculations'
import { Card } from '../components/ui/Card'
import { StatusBadge } from '../components/common/StatusBadge'
import { ProgressBar } from '../components/common/ProgressBar'
import { DeadlineInfo } from '../components/common/DeadlineInfo'
import { LoadingState } from '../components/common/LoadingState'

export function ClientPortalPage() {
  const { token } = useParams<{ token: string }>()
  const [portalData, setPortalData] = useState<ClientPortalWithProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      loadPortalData(token)
    }
  }, [token])

  const loadPortalData = async (accessToken: string) => {
    try {
      setLoading(true)
      setError(null)

      const data = await clientPortalService.getPortalByToken(accessToken)
      
      if (!data) {
        setError('Portal not found or access has been disabled')
        return
      }

      setPortalData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portal data')
      console.error('Error loading portal data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingState message="Loading project information..." />
  }

  if (error || !portalData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-medium text-white mb-2">Access Unavailable</h1>
          <p className="text-gray-400 mb-4">
            {error || 'The project portal you are trying to access is not available.'}
          </p>
          <p className="text-sm text-gray-500">
            Please contact your project manager for assistance.
          </p>
        </Card>
      </div>
    )
  }

  const { project } = portalData
  const totalPaid = project.payments.reduce((sum, payment) => sum + payment.amount, 0)
  const paymentProgress = calculatePaymentProgress(totalPaid, project.budget)
  const deadlineStatus = getDeadlineStatus(project.deadline)
  const paymentCompleted = isPaymentCompleted(totalPaid, project.budget)

  // Sort payments by date (most recent first)
  const sortedPayments = [...project.payments].sort(
    (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
  )

  // Sort updates by date (most recent first)
  const sortedUpdates = [...project.project_updates].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Project Portal</h1>
          <p className="text-gray-400">Track your project progress and payments</p>
        </motion.div>

        {/* Project Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8">
            <div className="space-y-6">
              {/* Project Header */}
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-white mb-3">
                  {project.title}
                </h2>
                <p className="text-gray-300 mb-4 max-w-2xl mx-auto">
                  {project.description}
                </p>
                
                {/* Client Info */}
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{project.client.full_name} • {project.client.company_name}</span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex justify-center">
                <StatusBadge status={project.status} />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {/* Project Budget */}
                <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600 text-center">
                  <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <PhilippinePeso className="h-6 w-6 text-green-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-400 mb-2">
                    Total Budget
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(project.budget)}
                  </p>
                </div>

                {/* Deadline */}
                <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600 text-center">
                  <div
                    className={`h-12 w-12 rounded-lg flex items-center justify-center mx-auto mb-4 ${
                      project.status === 'Finished'
                        ? 'bg-green-500/10'
                        : deadlineStatus.isOverdue
                        ? 'bg-red-500/10'
                        : deadlineStatus.days <= 7
                        ? 'bg-yellow-500/10'
                        : 'bg-green-500/10'
                    }`}
                  >
                    <Calendar
                      className={`h-6 w-6 ${
                        project.status === 'Finished'
                          ? 'text-green-400'
                          : deadlineStatus.isOverdue
                          ? 'text-red-400'
                          : deadlineStatus.days <= 7
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }`}
                    />
                  </div>
                  <p className="text-sm font-medium text-gray-400 mb-2">
                    Project Deadline
                  </p>
                  <DeadlineInfo
                    deadline={project.deadline}
                    status={project.status}
                    showIcon={false}
                    className="justify-center"
                  />
                </div>

                {/* Total Paid */}
                <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600 text-center">
                  <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <PhilippinePeso className="h-6 w-6 text-blue-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-400 mb-2">
                    Amount Paid
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(totalPaid)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Payment Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white text-center">
                Payment Progress
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    {formatCurrency(totalPaid)} of {formatCurrency(project.budget)}
                  </span>
                  <span className="text-white font-medium">
                    {Math.round(paymentProgress)}% Complete
                  </span>
                </div>

                <ProgressBar
                  progress={paymentProgress}
                  totalPaid={totalPaid}
                  budget={project.budget}
                  showAmounts={false}
                />

                {paymentCompleted && (
                  <div className="flex items-center justify-center space-x-2 pt-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-green-400 font-medium">
                      Payment Complete - All funds received!
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Payment History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-medium text-white mb-6 text-center">
              Payment History
            </h3>

            {sortedPayments.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No payments recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedPayments.map((payment, index) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-lg border border-gray-600/50 p-4"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg flex items-center justify-center">
                        <PhilippinePeso className="h-5 w-5 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-white">
                              {formatCurrency(payment.amount)}
                            </p>
                            <div className="flex items-center space-x-2 text-sm text-gray-400 mt-1">
                              <span className="px-2 py-0.5 bg-gray-700/50 rounded text-xs">
                                {payment.payment_method}
                              </span>
                              <span>•</span>
                              <span>{formatDate(payment.payment_date)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Project Updates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-medium text-white mb-6 text-center">
              Project Updates
            </h3>

            {sortedUpdates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No updates available yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedUpdates.map((update, index) => (
                  <motion.div
                    key={update.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-lg border border-gray-600/50 p-4"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <FileText className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white break-words leading-relaxed">
                          {update.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-2 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(update.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-gray-500 py-4"
        >
          <p>This portal provides real-time updates on your project progress.</p>
          <p>For questions or concerns, please contact your project manager.</p>
        </motion.div>
      </div>
    </div>
  )
}