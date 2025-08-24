import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  Calendar,
  DollarSign,
  FileText,
  CreditCard,
  User,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/Dialog";
import { RecordPaymentModal } from "../components/RecordPaymentModal";
import { AddProjectUpdateModal } from "../components/AddProjectUpdateModal";
import { ProjectModal } from "../components/ProjectModal"; 
import {
  clientService,
  projectService,
  paymentService,
  projectUpdateService,
} from "../services/database";
import { useToaster } from "../context/ToasterContext";
import type { Payment, ProjectUpdate } from "../lib/supabase";


type ProjectWithClient = {
  id: number;
  title: string;
  description: string;
  deadline: string;
  budget: number;
  status: "Started" | "Finished";
  invoice_url?: string;
  created_at: string;
  client: {
    id: number;
    full_name: string;
    company_name: string;
    email: string;
    phone_number: string;
    address: string;
  };
};

// Payment form type
type PaymentForm = {
  amount: number;
  paymentDate: string;
  paymentMethod: "Bank Transfer" | "Cash" | "Check";
};

// Project update form type
type ProjectUpdateForm = {
  description: string;
};

export function ProjectInformation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectWithClient | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [projectUpdates, setProjectUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use global toaster
  const { showSuccess, showError } = useToaster();

  // Delete project confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    projectId: number | null;
    projectName: string;
    isDeleting: boolean;
  }>({
    isOpen: false,
    projectId: null,
    projectName: "",
    isDeleting: false,
  });

  // Delete payment confirmation dialog state
  const [deletePaymentDialog, setDeletePaymentDialog] = useState<{
    isOpen: boolean;
    paymentId: number | null;
    paymentAmount: number;
    isDeleting: boolean;
  }>({
    isOpen: false,
    paymentId: null,
    paymentAmount: 0,
    isDeleting: false,
  });

  // Delete project update confirmation dialog state
  const [deleteUpdateDialog, setDeleteUpdateDialog] = useState<{
    isOpen: boolean;
    updateId: number | null;
    updateDescription: string;
    isDeleting: boolean;
  }>({
    isOpen: false,
    updateId: null,
    updateDescription: "",
    isDeleting: false,
  });

  // Record payment modal state
  const [recordPaymentModal, setRecordPaymentModal] = useState<{
    isOpen: boolean;
  }>({
    isOpen: false,
  });

  // Add project update modal state
  const [addUpdateModal, setAddUpdateModal] = useState<{
    isOpen: boolean;
  }>({
    isOpen: false,
  });

  // Edit project modal state
  const [editProjectModal, setEditProjectModal] = useState<{
    isOpen: boolean;
  }>({
    isOpen: false,
  });

  // Pagination for payments
  const [visiblePaymentsCount, setVisiblePaymentsCount] = useState(4);

  // Pagination for project updates
  const [visibleUpdatesCount, setVisibleUpdatesCount] = useState(4);

  useEffect(() => {
    if (id) {
      loadProjectData(parseInt(id));
    }
  }, [id]);

  // Helper function to check if project should be marked as completed
  const checkAndUpdateProjectStatus = async (projectId: number, currentBudget: number, totalPaid: number, currentStatus: string) => {
    // Only auto-complete if currently "Started" and payments >= budget
    if (currentStatus === "Started" && totalPaid >= currentBudget) {
      try {
        await projectService.updateProject(projectId, { status: "Finished" });
        
        // Add automatic project update for completion
        await projectUpdateService.createProjectUpdate({
          projectId: projectId,
          description: "Project automatically marked as completed - full payment received."
        });

        showSuccess(
          "Project Completed!",
          "Project has been automatically marked as finished since full payment has been received."
        );
        
        return true; // Status was updated
      } catch (error) {
        console.error("Error auto-updating project status:", error);
        // Don't throw error, just log it - payment recording should still succeed
      }
    }
    return false; // Status was not updated
  };

  const loadProjectData = async (projectId: number) => {
    try {
      setLoading(true);
      setError(null);

      // Get project with enhanced stats (includes payments and updates)
      const projectData = await projectService.getProjectWithStats(projectId);

      if (!projectData) {
        setError("Project not found");
        return;
      }

      // Get full client details
      const clientData = await clientService.getClientWithProjects(
        projectData.client.id
      );
      if (!clientData) {
        setError("Client data not found");
        return;
      }

      // Combine project and client data
      const fullProject: ProjectWithClient = {
        ...projectData,
        client: {
          id: clientData.id,
          full_name: clientData.full_name,
          company_name: clientData.company_name,
          email: clientData.email,
          phone_number: clientData.phone_number,
          address: clientData.address,
        },
      };

      setProject(fullProject);

      // Sort payments by payment_date (newest first)
      const sortedPayments = (projectData.payments || []).sort((a, b) => 
        new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
      );
      setPayments(sortedPayments);

      // Sort project updates by createdAt (newest first)
      const sortedUpdates = (projectData.project_updates || []).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setProjectUpdates(sortedUpdates);

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load project data"
      );
      console.error("Error loading project:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = (
    projectId: number,
    projectName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setDeleteDialog({
      isOpen: true,
      projectId,
      projectName,
      isDeleting: false,
    });
  };

  const confirmDeleteProject = async () => {
    if (!deleteDialog.projectId) return;

    try {
      setDeleteDialog((prev) => ({ ...prev, isDeleting: true }));

      await projectService.deleteProject(deleteDialog.projectId);

         // Show toast for deletion
      showError(
        "Project Deleted",
        `${deleteDialog.projectName} has been permanently removed`
      );

      // Navigate back to projects page after successful deletion
      navigate("/projects");
    } catch (err) {
      console.error("Error deleting project:", err);
      setDeleteDialog((prev) => ({ ...prev, isDeleting: false }));
      showError(
        "Failed to Delete Project",
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

  const closeDeleteDialog = () => {
    if (!deleteDialog.isDeleting) {
      setDeleteDialog({
        isOpen: false,
        projectId: null,
        projectName: "",
        isDeleting: false,
      });
    }
  };

  // Handle edit project
  const handleEditProject = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditProjectModal({ isOpen: true });
  };

  // Handle project update
  const handleUpdateProject = async (projectId: number, updateData: any) => {
    try {
      // Parse budget from string format (e.g., "$10,000" -> 10000)
      const budgetNumber = typeof updateData.budget === 'string' 
        ? parseFloat(updateData.budget.replace(/[$,]/g, '')) 
        : updateData.budget;

      const projectUpdatePayload = {
        title: updateData.title,
        description: updateData.description,
        deadline: updateData.deadline,
        budget: budgetNumber,
        status: updateData.status,
        // Handle invoice if provided
        ...(updateData.invoice && { invoice_url: updateData.invoice })
      };

      await projectService.updateProject(projectId, projectUpdatePayload);

      // Show success toast
      showSuccess(
        "Project Updated",
        "Project information has been updated successfully"
      );

      // Reload project data to reflect changes
      await loadProjectData(projectId);
      
    } catch (err) {
      console.error("Error updating project:", err);
      showError(
        "Failed to Update Project",
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      throw err; // Re-throw to handle in the modal
    }
  };

  const handleDeletePayment = (
    paymentId: number,
    paymentAmount: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setDeletePaymentDialog({
      isOpen: true,
      paymentId,
      paymentAmount,
      isDeleting: false,
    });
  };

  const confirmDeletePayment = async () => {
    if (!deletePaymentDialog.paymentId || !project) return;

    try {
      setDeletePaymentDialog((prev) => ({ ...prev, isDeleting: true }));

      await paymentService.deletePayment(deletePaymentDialog.paymentId);

      // Calculate new total after payment deletion
      const newTotalPaid = payments.reduce((sum, payment) => {
        return payment.id === deletePaymentDialog.paymentId ? sum : sum + payment.amount;
      }, 0);

      // Check if project should be reverted to "Started" status
      if (project.status === "Finished" && newTotalPaid < project.budget) {
        try {
          await projectService.updateProject(project.id, { status: "Started" });
          
          // Add automatic project update for status reversion
          await projectUpdateService.createProjectUpdate({
            projectId: project.id,
            description: "Project status reverted to 'Started' - payment was removed and total is now below budget."
          });

          showSuccess(
            "Payment Deleted & Status Updated",
            `Payment of ${formatCurrency(deletePaymentDialog.paymentAmount)} has been removed. Project status reverted to 'Started'.`
          );
        } catch (error) {
          console.error("Error reverting project status:", error);
          // Still show success for payment deletion even if status update fails
          showSuccess(
            "Payment Deleted",
            `Payment of ${formatCurrency(deletePaymentDialog.paymentAmount)} has been removed`
          );
        }
      } else {
        // Show success toast for deletion only
        showSuccess(
          "Payment Deleted",
          `Payment of ${formatCurrency(deletePaymentDialog.paymentAmount)} has been removed`
        );
      }

      // Remove the payment from local state
      setPayments((prev) => 
        prev.filter(payment => payment.id !== deletePaymentDialog.paymentId)
      );

      // Close dialog
      setDeletePaymentDialog({
        isOpen: false,
        paymentId: null,
        paymentAmount: 0,
        isDeleting: false,
      });

      // Reload project data to update stats and status
      await loadProjectData(project.id);
    } catch (err) {
      console.error("Error deleting payment:", err);
      setDeletePaymentDialog((prev) => ({ ...prev, isDeleting: false }));
      showError(
        "Failed to Delete Payment",
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

  const closeDeletePaymentDialog = () => {
    if (!deletePaymentDialog.isDeleting) {
      setDeletePaymentDialog({
        isOpen: false,
        paymentId: null,
        paymentAmount: 0,
        isDeleting: false,
      });
    }
  };

  const handleDeleteUpdate = (
    updateId: number,
    updateDescription: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    // Truncate description for display
    const truncatedDescription = updateDescription.length > 50 
      ? updateDescription.substring(0, 50) + "..." 
      : updateDescription;
    
    setDeleteUpdateDialog({
      isOpen: true,
      updateId,
      updateDescription: truncatedDescription,
      isDeleting: false,
    });
  };

  const confirmDeleteUpdate = async () => {
    if (!deleteUpdateDialog.updateId) return;

    try {
      setDeleteUpdateDialog((prev) => ({ ...prev, isDeleting: true }));

      await projectUpdateService.deleteProjectUpdate(deleteUpdateDialog.updateId);

      // Remove the update from local state
      setProjectUpdates((prev) => 
        prev.filter(update => update.id !== deleteUpdateDialog.updateId)
      );

      // Show success toast for deletion
      showSuccess(
        "Update Deleted",
        "Project update has been removed successfully"
      );

      // Close dialog
      setDeleteUpdateDialog({
        isOpen: false,
        updateId: null,
        updateDescription: "",
        isDeleting: false,
      });

      // Reload project data to update stats
      if (project) {
        await loadProjectData(project.id);
      }
    } catch (err) {
      console.error("Error deleting project update:", err);
      setDeleteUpdateDialog((prev) => ({ ...prev, isDeleting: false }));
      showError(
        "Failed to Delete Update",
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

  const closeDeleteUpdateDialog = () => {
    if (!deleteUpdateDialog.isDeleting) {
      setDeleteUpdateDialog({
        isOpen: false,
        updateId: null,
        updateDescription: "",
        isDeleting: false,
      });
    }
  };

  const handleRecordPayment = async (paymentData: PaymentForm) => {
    if (!project) return;

    try {
      // Create payment in database
      const newPayment = await paymentService.createPayment({
        projectId: project.id,
        amount: paymentData.amount,
        paymentDate: paymentData.paymentDate,
        paymentMethod: paymentData.paymentMethod,
      });

      // Calculate new total including this payment
      const currentTotalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const newTotalPaid = currentTotalPaid + paymentData.amount;

      // Check if project should be automatically completed
      const statusWasUpdated = await checkAndUpdateProjectStatus(
        project.id,
        project.budget,
        newTotalPaid,
        project.status
      );

      // Update local payments state with sorted array (newest first)
      setPayments((prev) => {
        const updated = [newPayment, ...prev];
        return updated.sort((a, b) => 
          new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
        );
      });

      if (!statusWasUpdated) {
        // Only show payment success if status wasn't updated (to avoid duplicate notifications)
        showSuccess(
          "Payment Recorded",
          `Payment of ${formatCurrency(
            paymentData.amount
          )} has been recorded successfully`
        );
      }

      // Close modal
      setRecordPaymentModal({ isOpen: false });

      // Reload project data to update stats and status
      await loadProjectData(project.id);
    } catch (err) {
      console.error("Error recording payment:", err);
      showError(
        "Failed to Record Payment",
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

  const handleViewMorePayments = () => {
    setVisiblePaymentsCount((prev) => prev + 4);
  };

  const handleViewLessPayments = () => {
    setVisiblePaymentsCount(4);
  };

  const handleViewMoreUpdates = () => {
    setVisibleUpdatesCount((prev) => prev + 4);
  };

  const handleViewLessUpdates = () => {
    setVisibleUpdatesCount(4);
  };

  const handleAddProjectUpdate = async (updateData: ProjectUpdateForm) => {
    if (!project) return;

    try {
      // Create project update in database
      const newUpdate = await projectUpdateService.createProjectUpdate({
        projectId: project.id,
        description: updateData.description,
      });

      // Update local project updates state with sorted array (newest first)
      setProjectUpdates((prev) => {
        const updated = [newUpdate, ...prev];
        return updated.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      showSuccess("Update Added", "Project update has been added successfully");

      // Close modal
      setAddUpdateModal({ isOpen: false });

      // Reload project data to update stats
      await loadProjectData(project.id);
    } catch (err) {
      console.error("Error adding project update:", err);
      showError(
        "Failed to Add Update",
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadgeColor = (status: string) => {
    return status === "Started"
      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
      : "bg-green-500/10 text-green-400 border border-green-500/20";
  };

  // Calculate total paid from actual payments
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const paymentProgress = project ? (totalPaid / project.budget) * 100 : 0;

  // Get visible payments for pagination (already sorted)
  const visiblePayments = payments.slice(0, visiblePaymentsCount);
  const hasMorePayments = payments.length > visiblePaymentsCount;
  const canShowLess = visiblePaymentsCount > 4 && payments.length > 4;

  // Get visible updates for pagination (already sorted)
  const visibleUpdates = projectUpdates.slice(0, visibleUpdatesCount);
  const hasMoreUpdates = projectUpdates.length > visibleUpdatesCount;
  const canShowLessUpdates =
    visibleUpdatesCount > 4 && projectUpdates.length > 4;

  // Format project for editing
  const formatProjectForEdit = () => {
    if (!project) return undefined;
    
    return {
      id: project.id,
      title: project.title,
      description: project.description,
      deadline: project.deadline,
      budget: project.budget,
      status: project.status,
      invoice_url: project.invoice_url,
      client: {
        id: project.client.id,
        full_name: project.client.full_name,
        company_name: project.client.company_name,
      },
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3 text-gray-300">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Loading project data...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/projects")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Projects</span>
            </Button>
          </div>
        </motion.div>

        <div className="flex items-center justify-center min-h-[300px]">
          <Card className="p-8 text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {error === "Project not found"
                ? "Project Not Found"
                : "Error Loading Project"}
            </h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <Button onClick={() => navigate("/projects")} variant="secondary">
              Back to Projects
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const daysUntilDeadline = Math.ceil(
    (new Date(project.deadline).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const isOverdue = daysUntilDeadline < 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/projects")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Projects</span>
          </Button>
        </div>
      </motion.div>

      {/* Project Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-8">
          <div className="space-y-8">
            {/* Project Header */}
            <div className="text-start relative">
              {/* Edit and Delete buttons - Top right */}
              <div className="absolute top-0 right-0 flex space-x-2">
                <button
                  onClick={handleEditProject}
                  className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) =>
                    handleDeleteProject(project.id, project.title, e)
                  }
                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <h1 className="text-3xl font-medium text-white mb-2 pr-20">
                {project.title}
              </h1>
              <p className="text-gray-400 text-md mb-4 pr-20">
                {project.description}
              </p>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300 text-sm">
                  {project.client.full_name} • {project.client.company_name}
                </span>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Project Budget */}
              <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">
                      Project Budget
                    </p>
                    <p className="text-3xl font-bold text-white mt-2">
                      {formatCurrency(project.budget)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-400" />
                  </div>
                </div>
              </div>

              {/* Deadline */}
              <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">
                      Deadline
                    </p>
                    <p className="text-2xl font-bold text-white mt-2">
                      {formatDate(project.deadline)}
                    </p>
                    <p
                      className={`text-sm mt-1 ${
                        isOverdue
                          ? "text-red-400"
                          : daysUntilDeadline <= 7
                          ? "text-yellow-400"
                          : "text-green-400"
                      }`}
                    >
                      {isOverdue
                        ? `${Math.abs(daysUntilDeadline)} days overdue`
                        : `${daysUntilDeadline} days remaining`}
                    </p>
                  </div>
                  <div
                    className={`h-12 w-12 rounded-lg mb-4 flex items-center justify-center ${
                      isOverdue
                        ? "bg-red-500/10"
                        : daysUntilDeadline <= 7
                        ? "bg-yellow-500/10"
                        : "bg-green-500/10"
                    }`}
                  >
                    <Calendar
                      className={`h-6 w-6 ${
                        isOverdue
                          ? "text-red-400"
                          : daysUntilDeadline <= 7
                          ? "text-yellow-400"
                          : "text-green-400"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Total Paid */}
              <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">
                      Total Paid
                    </p>
                    <p className="text-3xl font-bold text-white mt-2">
                      {formatCurrency(totalPaid)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Progress */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">
                  Payment Progress
                </h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                    project.status
                  )}`}
                >
                  {project.status}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    {formatCurrency(totalPaid)} of{" "}
                    {formatCurrency(project.budget)}
                  </span>
                  <span className="text-white font-medium">
                    {Math.round(paymentProgress)}% Complete
                  </span>
                </div>

                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(paymentProgress, 100)}%`,
                    }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-3 rounded-full ${
                      paymentProgress >= 100 ? "bg-green-500" : "bg-blue-500"
                    }`}
                  />
                </div>
              </div>

              {project.invoice_url && (
                <div className="pt-4 border-t border-gray-700">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(project.invoice_url, "_blank")}
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                  >
                    <FileText className="h-4 w-4" />
                    <span>View Invoice</span>
                  </Button>
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
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-medium text-white">Payment History</h2>
          <Button onClick={() => setRecordPaymentModal({ isOpen: true })}>
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>

        <Card variant="secondary">
          {payments.length === 0 ? (
            <div className="p-8 text-center">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No payments recorded yet
              </h3>
              <p className="text-gray-400 mb-4">
                Start tracking payments by adding your first payment record
              </p>
              <Button onClick={() => setRecordPaymentModal({ isOpen: true })}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Payment
              </Button>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-3">
                {visiblePayments.map((payment, index) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative overflow-hidden bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-xl border border-gray-600/50 hover:border-gray-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-gray-900/20"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative h-12 w-12 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl flex items-center justify-center ring-1 ring-green-500/20">
                            <DollarSign className="h-6 w-6 text-green-400" />
                            <div className="absolute inset-0 bg-green-500/10 rounded-xl blur-sm" />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-white mb-1">
                              {formatCurrency(payment.amount)}
                            </p>
                            <div className="flex items-center space-x-2 text-sm text-gray-400">
                              <span className="px-2 py-1 bg-gray-700/50 rounded-md text-xs font-medium">
                                {payment.payment_method}
                              </span>
                              <span>•</span>
                              <span>{formatDate(payment.payment_date)}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDeletePayment(payment.id, payment.amount, e)}
                          className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination Controls */}
              {(hasMorePayments || canShowLess) && (
                <div className="mt-6 pt-4 border-t border-gray-700/50">
                  <div className="flex items-center justify-center space-x-3">
                    {hasMorePayments && (
                      <Button
                        variant="ghost"
                        onClick={handleViewMorePayments}
                        className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                      >
                        <span>View More</span>
                        <motion.div
                          initial={{ rotate: 0 }}
                          whileHover={{ rotate: 180 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Plus className="h-4 w-4" />
                        </motion.div>
                      </Button>
                    )}

                    {canShowLess && (
                      <Button
                        variant="ghost"
                        onClick={handleViewLessPayments}
                        className="flex items-center space-x-2 text-gray-400 hover:text-gray-300 hover:bg-gray-500/10"
                      >
                        <span>Show Less</span>
                        <motion.div
                          initial={{ rotate: 0 }}
                          whileHover={{ rotate: 180 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </motion.div>
                      </Button>
                    )}
                  </div>

                  {/* Payment Counter */}
                  <div className="text-center mt-3">
                    <p className="text-xs text-gray-500">
                      Showing {Math.min(visiblePaymentsCount, payments.length)}{" "}
                      of {payments.length} payments
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Project Updates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-medium text-white">Project Updates</h2>
          <Button onClick={() => setAddUpdateModal({ isOpen: true })}>
            <Plus className="h-4 w-4 mr-2" />
            Add Update
          </Button>
        </div>

        {projectUpdates.length === 0 ? (
          <Card className="p-6 text-center" variant="secondary">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No updates yet
            </h3>
            <p className="text-gray-400 mb-4">
              Keep track of project progress by adding updates and milestones
            </p>
            <Button onClick={() => setAddUpdateModal({ isOpen: true })}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Update
            </Button>
          </Card>
        ) : (
          <Card variant="secondary">
            <div className="p-6">
              <div className="space-y-3">
                {visibleUpdates.map((update, index) => (
                  <motion.div
                    key={update.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative overflow-hidden bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-xl border border-gray-600/50 hover:border-gray-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-gray-900/20"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative p-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative h-12 w-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl flex items-center justify-center ring-1 ring-blue-500/20 flex-shrink-0">
                          <FileText className="h-6 w-6 text-blue-400" />
                          <div className="absolute inset-0 bg-blue-500/10 rounded-xl blur-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <div className="max-w-xl">
                              <p className="text-white leading-relaxed text-sm break-words">
                                {update.description}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDate(update.created_at)}
                              </p>
                            </div>

                            <button
                              onClick={(e) => handleDeleteUpdate(update.id, update.description, e)}
                              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination Controls */}
              {(hasMoreUpdates || canShowLessUpdates) && (
                <div className="mt-6 pt-4 border-t border-gray-700/50">
                  <div className="flex items-center justify-center space-x-3">
                    {hasMoreUpdates && (
                      <Button
                        variant="ghost"
                        onClick={handleViewMoreUpdates}
                        className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                      >
                        <span>View More</span>
                        <motion.div
                          initial={{ rotate: 0 }}
                          whileHover={{ rotate: 180 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Plus className="h-4 w-4" />
                        </motion.div>
                      </Button>
                    )}

                    {canShowLessUpdates && (
                      <Button
                        variant="ghost"
                        onClick={handleViewLessUpdates}
                        className="flex items-center space-x-2 text-gray-400 hover:text-gray-300 hover:bg-gray-500/10"
                      >
                        <span>Show Less</span>
                        <motion.div
                          initial={{ rotate: 0 }}
                          whileHover={{ rotate: 180 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </motion.div>
                      </Button>
                    )}
                  </div>

                  {/* Update Counter */}
                  <div className="text-center mt-3">
                    <p className="text-xs text-gray-500">
                      Showing{" "}
                      {Math.min(visibleUpdatesCount, projectUpdates.length)} of{" "}
                      {projectUpdates.length} updates
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </motion.div>

      {/* Edit Project Modal */}
      <ProjectModal
        isOpen={editProjectModal.isOpen}
        onClose={() => setEditProjectModal({ isOpen: false })}
        onSubmit={() => {}} 
        onUpdate={handleUpdateProject}
        editingProject={formatProjectForEdit()}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={recordPaymentModal.isOpen}
        onClose={() => setRecordPaymentModal({ isOpen: false })}
        onSubmit={handleRecordPayment}
        projectTitle={project?.title}
      />

      {/* Add Project Update Modal */}
      <AddProjectUpdateModal
        isOpen={addUpdateModal.isOpen}
        onClose={() => setAddUpdateModal({ isOpen: false })}
        onSubmit={handleAddProjectUpdate}
        projectTitle={project?.title}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteDialog.projectName}"? This action will permanently remove the project and cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isLoading={deleteDialog.isDeleting}
        variant="danger"
      />

      {/* Delete Payment Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deletePaymentDialog.isOpen}
        onClose={closeDeletePaymentDialog}
        onConfirm={confirmDeletePayment}
        title="Delete Payment"
        message={`Are you sure you want to delete this payment of ${formatCurrency(deletePaymentDialog.paymentAmount)}? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isLoading={deletePaymentDialog.isDeleting}
        variant="danger"
      />

      {/* Delete Project Update Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteUpdateDialog.isOpen}
        onClose={closeDeleteUpdateDialog}
        onConfirm={confirmDeleteUpdate}
        title="Delete Project Update"
        message={`Are you sure you want to delete this update: "${deleteUpdateDialog.updateDescription}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isLoading={deleteUpdateDialog.isDeleting}
        variant="danger"
      />
    </div>
  );
}