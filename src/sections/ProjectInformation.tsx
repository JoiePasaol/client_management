import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Calendar,
  DollarSign,
  FileText,
  CreditCard,
  User,
  Check,
} from "lucide-react";

import {
  clientService,
  projectService,
  paymentService,
  projectUpdateService,
} from "../services/database";
import { useToaster } from "../context/ToasterContext";
import type { Payment, ProjectUpdate } from "../lib/supabase";

// Utility imports
import { formatCurrency, formatDate, parseBudget } from "../utils/formatters";
import {
  calculatePaymentProgress,
  getDeadlineStatus,
  shouldRevertProjectStatus,
  isPaymentCompleted,
} from "../utils/calculations";

// Component imports
import { ActionButtons } from "../components/common/ActionButtons";
import { DeadlineInfo } from "../components/common/DeadlineInfo";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { PaginationControls } from "../components/common/PaginationControls";
import { ProgressBar } from "../components/common/ProgressBar";
import { StatusBadge } from "../components/common/StatusBadge";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/Dialog";
import { RecordPaymentModal } from "../components/RecordPaymentModal";
import { AddProjectUpdateModal } from "../components/AddProjectUpdateModal";
import { ProjectModal } from "../components/ProjectModal";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import { useModal } from "../hooks/useModal";
import { usePagination } from "../hooks/usePagination";

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

type PaymentForm = {
  amount: number;
  paymentDate: string;
  paymentMethod: "Bank Transfer" | "Cash" | "Check";
};

type ProjectUpdateForm = {
  description: string;
};

type DeleteData = {
  type: "project" | "payment" | "update";
  id: number;
  name: string;
  amount?: number;
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

  // Custom hooks
  const deleteDialog = useConfirmDialog<DeleteData>();
  const editProjectModal = useModal();
  const recordPaymentModal = useModal();
  const addUpdateModal = useModal();
  const markAsDoneDialog = useConfirmDialog();

  // Pagination hooks
  const paymentPagination = usePagination(payments);
  const updatePagination = usePagination(projectUpdates);

  useEffect(() => {
    if (id) {
      loadProjectData(parseInt(id));
    }
  }, [id]);

  const loadProjectData = async (projectId: number) => {
    try {
      setLoading(true);
      setError(null);

      const projectData = await projectService.getProjectWithStats(projectId);
      if (!projectData) {
        setError("Project not found");
        return;
      }

      const clientData = await clientService.getClientWithProjects(
        projectData.client.id
      );
      if (!clientData) {
        setError("Client data not found");
        return;
      }

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

      const sortedPayments = (projectData.payments || []).sort(
        (a, b) =>
          new Date(b.payment_date).getTime() -
          new Date(a.payment_date).getTime()
      );
      setPayments(sortedPayments);

      const sortedUpdates = (projectData.project_updates || []).sort(
        (a, b) =>
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

  const handleMarkAsDone = async () => {
    if (!project) return;

    try {
      markAsDoneDialog.setLoading(true);

      // Update project status to finished
      await projectService.updateProject(project.id, { status: "Finished" });

      showSuccess(
        "Project Completed!",
        "Project has been marked as finished successfully."
      );

      markAsDoneDialog.closeDialog();
      await loadProjectData(project.id);
    } catch (error) {
      console.error("Error marking project as done:", error);
      markAsDoneDialog.setLoading(false);
      showError(
        "Failed to Mark as Done",
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteDialog.data || !project) return;

    try {
      deleteDialog.setLoading(true);
      await projectService.deleteProject(deleteDialog.data.id);

      showError(
        "Project Deleted",
        `${deleteDialog.data.name} has been permanently removed`
      );
      navigate("/projects");
    } catch (err) {
      console.error("Error deleting project:", err);
      deleteDialog.setLoading(false);
      showError(
        "Failed to Delete Project",
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

  const handleDeletePayment = async () => {
    if (!deleteDialog.data || !project) return;

    try {
      deleteDialog.setLoading(true);
      await paymentService.deletePayment(deleteDialog.data.id);

      const newTotalPaid = payments.reduce((sum, payment) => {
        return payment.id === deleteDialog.data!.id
          ? sum
          : sum + payment.amount;
      }, 0);

      if (
        shouldRevertProjectStatus(project.status, newTotalPaid, project.budget)
      ) {
        try {
          await projectService.updateProject(project.id, { status: "Started" });

          showSuccess(
            "Payment Deleted & Status Updated",
            `Payment of ${formatCurrency(
              deleteDialog.data.amount!
            )} has been removed. Project status reverted to 'Started'.`
          );
        } catch (error) {
          console.error("Error reverting project status:", error);
          showSuccess(
            "Payment Deleted",
            `Payment of ${formatCurrency(
              deleteDialog.data.amount!
            )} has been removed`
          );
        }
      } else {
        showSuccess(
          "Payment Deleted",
          `Payment of ${formatCurrency(
            deleteDialog.data.amount!
          )} has been removed`
        );
      }

      setPayments((prev) =>
        prev.filter((payment) => payment.id !== deleteDialog.data!.id)
      );
      deleteDialog.closeDialog();
      await loadProjectData(project.id);
    } catch (err) {
      console.error("Error deleting payment:", err);
      deleteDialog.setLoading(false);
      showError(
        "Failed to Delete Payment",
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

  const handleDeleteUpdate = async () => {
    if (!deleteDialog.data || !project) return;

    try {
      deleteDialog.setLoading(true);
      await projectUpdateService.deleteProjectUpdate(deleteDialog.data.id);

      setProjectUpdates((prev) =>
        prev.filter((update) => update.id !== deleteDialog.data!.id)
      );
      showSuccess(
        "Update Deleted",
        "Project update has been removed successfully"
      );

      deleteDialog.closeDialog();
      await loadProjectData(project.id);
    } catch (err) {
      console.error("Error deleting project update:", err);
      deleteDialog.setLoading(false);
      showError(
        "Failed to Delete Update",
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialog.data) return;

    switch (deleteDialog.data.type) {
      case "project":
        await handleDeleteProject();
        break;
      case "payment":
        await handleDeletePayment();
        break;
      case "update":
        await handleDeleteUpdate();
        break;
    }
  };

  const handleUpdateProject = async (projectId: number, updateData: any) => {
    try {
      const budgetNumber =
        typeof updateData.budget === "string"
          ? parseBudget(updateData.budget)
          : updateData.budget;

      const projectUpdatePayload = {
        title: updateData.title,
        description: updateData.description,
        deadline: updateData.deadline,
        budget: budgetNumber,
        status: updateData.status,
        ...(updateData.invoice && { invoice_url: updateData.invoice }),
      };

      await projectService.updateProject(projectId, projectUpdatePayload);
      showSuccess(
        "Project Updated",
        "Project information has been updated successfully"
      );
      await loadProjectData(projectId);
    } catch (err) {
      console.error("Error updating project:", err);
      showError(
        "Failed to Update Project",
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      throw err;
    }
  };

  const handleRecordPayment = async (paymentData: PaymentForm) => {
    if (!project) return;

    try {
      const newPayment = await paymentService.createPayment({
        projectId: project.id,
        amount: paymentData.amount,
        paymentDate: paymentData.paymentDate,
        paymentMethod: paymentData.paymentMethod,
      });

      setPayments((prev) => {
        const updated = [newPayment, ...prev];
        return updated.sort(
          (a, b) =>
            new Date(b.payment_date).getTime() -
            new Date(a.payment_date).getTime()
        );
      });

      showSuccess(
        "Payment Recorded",
        `Payment of ${formatCurrency(
          paymentData.amount
        )} has been recorded successfully`
      );

      recordPaymentModal.closeModal();
      await loadProjectData(project.id);
    } catch (err) {
      console.error("Error recording payment:", err);
      showError(
        "Failed to Record Payment",
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

  const handleAddProjectUpdate = async (updateData: ProjectUpdateForm) => {
    if (!project) return;

    try {
      const newUpdate = await projectUpdateService.createProjectUpdate({
        projectId: project.id,
        description: updateData.description,
      });

      setProjectUpdates((prev) => {
        const updated = [newUpdate, ...prev];
        return updated.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      showSuccess("Update Added", "Project update has been added successfully");
      addUpdateModal.closeModal();
      await loadProjectData(project.id);
    } catch (err) {
      console.error("Error adding project update:", err);
      showError(
        "Failed to Add Update",
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

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

  const getDeleteMessage = () => {
    if (!deleteDialog.data) return "";

    switch (deleteDialog.data.type) {
      case "project":
        return `Are you sure you want to delete "${deleteDialog.data.name}"? This action will permanently remove the project and cannot be undone.`;
      case "payment":
        return `Are you sure you want to delete this payment of ${formatCurrency(
          deleteDialog.data.amount!
        )}? This action cannot be undone.`;
      case "update":
        return `Are you sure you want to delete this update: "${deleteDialog.data.name}"? This action cannot be undone.`;
      default:
        return "";
    }
  };

  if (loading) {
    return <LoadingState message="Loading project data..." />;
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

        <ErrorState
          title={
            error === "Project not found"
              ? "Project Not Found"
              : "Error Loading Project"
          }
          message={error || "Unknown error occurred"}
          onRetry={() => navigate("/projects")}
          retryLabel="Back to Projects"
        />
      </div>
    );
  }

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const paymentProgress = calculatePaymentProgress(totalPaid, project.budget);
  const deadlineStatus = getDeadlineStatus(project.deadline);
  const paymentCompleted = isPaymentCompleted(totalPaid, project.budget);

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
              <ActionButtons
                onEdit={() => editProjectModal.openModal()}
                onDelete={() =>
                  deleteDialog.openDialog({
                    type: "project",
                    id: project.id,
                    name: project.title,
                  })
                }
                className="absolute top-0 right-0"
              />

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
                    <DeadlineInfo
                      deadline={project.deadline}
                      status={project.status}
                      showIcon={false}
                    />
                  </div>
                  <div
                    className={`h-12 w-12 rounded-lg mt-2 flex items-center justify-center ${
                      project.status === "Finished"
                        ? "bg-green-500/10"
                        : deadlineStatus.isOverdue
                        ? "bg-red-500/10"
                        : deadlineStatus.days <= 7
                        ? "bg-yellow-500/10"
                        : "bg-green-500/10"
                    }`}
                  >
                    <Calendar
                      className={`h-6 w-6 ${
                        project.status === "Finished"
                          ? "text-green-400"
                          : deadlineStatus.isOverdue
                          ? "text-red-400"
                          : deadlineStatus.days <= 7
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
                <div className="flex items-center space-x-3">
                  <StatusBadge status={project.status} />
                </div>
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

                <ProgressBar
                  progress={paymentProgress}
                  totalPaid={totalPaid}
                  budget={project.budget}
                  showAmounts={false}
                />

                {/* Payment Completed Message */}
                {paymentCompleted && (
                  <div className="flex items-center justify-between space-x-2 pt-2">
                    <div className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-400" />

                      <span className="text-green-400 text-sm font-medium">
                        Payment Completed - All funds received!
                      </span>
                    </div>
                    <div>
                      {/* Mark as Done button - only show when payment is completed and status is not finished */}
                      {paymentCompleted && project.status !== "Finished" && (
                        <Button
                          size="sm"
                          onClick={() => markAsDoneDialog.openDialog()}
                          className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
                        >
                          <Check className="h-4 w-4" />
                          <span>Mark as Done</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
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

      {/* Payment History - Always render */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-medium text-white">
            Payment History
          </h2>
          <Button onClick={() => recordPaymentModal.openModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>

        {payments.length === 0 ? (
          <Card variant="secondary" className="p-8 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No payments recorded yet
            </h3>
            <p className="text-gray-400 mb-4">
              Start tracking payments by adding your first payment record
            </p>
            <Button onClick={() => recordPaymentModal.openModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Payment
            </Button>
          </Card>
        ) : (
          <Card variant="secondary">
            <div className="p-6">
              <div className="space-y-3">
                {paymentPagination.visibleItems.map((payment, index) => (
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
                              <span>
                                {formatDate(payment.payment_date)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <ActionButtons
                          showEdit={false}
                          onDelete={() =>
                            deleteDialog.openDialog({
                              type: "payment",
                              id: payment.id,
                              name: "",
                              amount: payment.amount,
                            })
                          }
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <PaginationControls
                hasMore={paymentPagination.hasMore}
                canShowLess={paymentPagination.canShowLess}
                onShowMore={paymentPagination.showMore}
                onShowLess={paymentPagination.showLess}
                visibleCount={paymentPagination.visibleCount}
                totalCount={paymentPagination.totalCount}
                itemName="payments"
              />
            </div>
          </Card>
        )}
      </motion.div>

      {/* Project Updates - Always render */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-medium text-white">
            Project Updates
          </h2>
          <Button onClick={() => addUpdateModal.openModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Update
          </Button>
        </div>

        {projectUpdates.length === 0 ? (
          <Card variant="secondary" className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No updates yet
            </h3>
            <p className="text-gray-400 mb-4">
              Keep track of project progress by adding updates and milestones
            </p>
            <Button onClick={() => addUpdateModal.openModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Update
            </Button>
          </Card>
        ) : (
          <Card variant="secondary">
            <div className="p-6">
              <div className="space-y-3">
                {updatePagination.visibleItems.map((update, index) => (
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
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDate(update.created_at)}
                              </p>
                            </div>

                            <ActionButtons
                              onEdit={() => {}} // No edit for updates in current design
                              onDelete={() => {
                                const truncatedDescription =
                                  update.description.length > 50
                                    ? update.description.substring(0, 50) +
                                      "..."
                                    : update.description;
                                deleteDialog.openDialog({
                                  type: "update",
                                  id: update.id,
                                  name: truncatedDescription,
                                });
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <PaginationControls
                hasMore={updatePagination.hasMore}
                canShowLess={updatePagination.canShowLess}
                onShowMore={updatePagination.showMore}
                onShowLess={updatePagination.showLess}
                visibleCount={updatePagination.visibleCount}
                totalCount={updatePagination.totalCount}
                itemName="updates"
              />
            </div>
          </Card>
        )}
      </motion.div>

      {/* Edit Project Modal */}
      <ProjectModal
        isOpen={editProjectModal.isOpen}
        onClose={editProjectModal.closeModal}
        onSubmit={() => {}}
        onUpdate={handleUpdateProject}
        editingProject={formatProjectForEdit()}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={recordPaymentModal.isOpen}
        onClose={recordPaymentModal.closeModal}
        onSubmit={handleRecordPayment}
        projectTitle={project?.title}
      />

      {/* Add Project Update Modal */}
      <AddProjectUpdateModal
        isOpen={addUpdateModal.isOpen}
        onClose={addUpdateModal.closeModal}
        onSubmit={handleAddProjectUpdate}
        projectTitle={project?.title}
      />

      {/* Mark as Done Confirmation Dialog */}
      <ConfirmDialog
        isOpen={markAsDoneDialog.isOpen}
        onClose={markAsDoneDialog.closeDialog}
        onConfirm={handleMarkAsDone}
        title="Mark Project as Done"
        message={`Are you sure you want to mark "${project?.title}" as completed? This will change the project status to 'Finished'.`}
        confirmText="Yes, Mark as Done"
        cancelText="Cancel"
        isLoading={markAsDoneDialog.isLoading}
        variant="success"
      />

      {/* Unified Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.closeDialog}
        onConfirm={confirmDelete}
        title={`Delete ${
          deleteDialog.data?.type === "project"
            ? "Project"
            : deleteDialog.data?.type === "payment"
            ? "Payment"
            : "Project Update"
        }`}
        message={getDeleteMessage()}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isLoading={deleteDialog.isLoading}
        variant="danger"
      />
    </div>
  );
}