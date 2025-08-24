import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FolderOpen, Plus, DollarSign, Clock, Calendar } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/Dialog";
import { ProjectModal } from "../components/ProjectModal";
import { LoadingState } from "../components/common/LoadingState";
import { ErrorState } from "../components/common/ErrorState";
import { EmptyState } from "../components/common/EmptyState";
import { SearchAndFilter } from "../components/common/SearchAndFilter";
import { StatusBadge } from "../components/common/StatusBadge";
import { ProgressBar } from "../components/common/ProgressBar";
import { DeadlineInfo } from "../components/common/DeadlineInfo";
import { ActionButtons } from "../components/common/ActionButtons";
import { projectService, fileService } from "../services/database";
import { useNavigate } from "react-router-dom";
import { useToaster } from "../context/ToasterContext";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import { useModal } from "../hooks/useModal";
import { formatCurrency, formatDate } from "../utils/formatters";
import { calculatePaymentProgress } from "../utils/calculations";

// Project with client info and payment stats type
type ProjectWithClientAndStats = {
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
  };
  payment_count: number;
  total_paid: number;
  update_count: number;
};

export function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithClientAndStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Use global toaster
  const { showSuccess, showError } = useToaster();

  // Custom hooks for modals and dialogs
  const addProjectModal = useModal();
  const editProjectModal = useModal<ProjectWithClientAndStats>();
  const deleteDialog = useConfirmDialog<{ id: number; name: string }>();

  useEffect(() => {
    loadProjects();
  }, []);

  const navigate = useNavigate();

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the enhanced method to get all projects with client info AND payment stats
      const allProjects = await projectService.getAllProjectsWithStats();
      setProjects(allProjects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
      console.error("Error loading projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async (projectData: {
    clientId: number;
    title: string;
    description: string;
    deadline: string;
    budget: string;
    status: "Started" | "Finished";
    invoice?: File;
  }) => {
    try {
      let invoiceUrl;

      // First create the project
      const newProject = await projectService.createProject({
        client_id: projectData.clientId,
        title: projectData.title,
        description: projectData.description,
        deadline: projectData.deadline,
        budget: parseFloat(projectData.budget.replace(/[^0-9.-]+/g, "")),
        status: projectData.status,
      });

      // Then upload invoice if provided
      if (projectData.invoice) {
        invoiceUrl = await fileService.uploadInvoice(
          projectData.invoice,
          newProject.id
        );
        // Update project with invoice URL
        await projectService.updateProject(newProject.id, {
          invoice_url: invoiceUrl,
        });
      }

      setProjectModalOpen(false);

      // Show success toast
      showSuccess(
        "Project Added Successfully",
        `${projectData.title} has been added`
      );

      // Reload projects to show the new one
      await loadProjects();
    } catch (err) {
      console.error("Error adding project:", err);
      showError(
        "Failed to Add Project",
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

  const handleDeleteProject = (
    projectId: number,
    projectName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    deleteDialog.openDialog({ id: projectId, name: projectName });
  };

  const confirmDeleteProject = async () => {
    if (!deleteDialog.data) return;

    try {
      deleteDialog.setLoading(true);

      await projectService.deleteProject(deleteDialog.data.id);

      // Remove project from local state
      setProjects((prev) =>
        prev.filter((project) => project.id !== deleteDialog.data?.id)
      );

      // Show success toast for deletion
      showError(
        "Project Deleted",
        `${deleteDialog.data.name} has been permanently removed`
      );

      // Close delete dialog
      deleteDialog.closeDialog();
    } catch (err) {
      console.error("Error deleting project:", err);
      deleteDialog.setLoading(false);
      showError(
        "Failed to Delete Project",
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

  const handleEditProject = (project: ProjectWithClientAndStats) => {
    editProjectModal.openModal(project);
  };

  const handleUpdateProject = async (projectId: number, projectData: any) => {
    try {
      // Handle file upload if needed
      let invoiceUrl = editDialog.project?.invoice_url;
      if (projectData.invoice) {
        invoiceUrl = await fileService.uploadInvoice(
          projectData.invoice,
          projectId
        );
      }

      // Update project
      await projectService.updateProject(projectId, {
        title: projectData.title,
        description: projectData.description,
        deadline: projectData.deadline,
        budget: parseFloat(projectData.budget.replace(/[^0-9.-]+/g, "")),
        status: projectData.status,
        ...(invoiceUrl && { invoice_url: invoiceUrl }),
      });

      showSuccess("Project Updated", `${projectData.title} has been updated`);
      await loadProjects(); // Refresh the list
      editProjectModal.closeModal();
    } catch (err) {
      showError(
        "Failed to Update Project",
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client.full_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      project.client.company_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  // Calculate stats - now using actual payment data
  const inProgressProjects = projects.filter(
    (p) => p.status === "Started"
  ).length;
  const completedProjects = projects.filter(
    (p) => p.status === "Finished"
  ).length;
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);

  if (loading) {
    return <LoadingState message="Loading projects..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Projects</h1>
          </div>
          <Button
            onClick={() => addProjectModal.openModal()}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </Button>
        </div>

        <ErrorState
          title="Error Loading Projects"
          message={error}
          onRetry={loadProjects}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
        </div>
        <Button
          onClick={() => addProjectModal.openModal()}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "In Progress",
            value: inProgressProjects.toString(),
            icon: FolderOpen,
            color: "blue",
          },
          {
            label: "Completed",
            value: completedProjects.toString(),
            icon: FolderOpen,
            color: "green",
          },
          {
            label: "Total Budget",
            value: formatCurrency(totalBudget),
            icon: DollarSign,
            color: "green",
          },
        ].map((stat, index) => {
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
                    <p className="text-sm font-medium text-gray-400">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-white mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`h-12 w-12 bg-${stat.color}-500/10 rounded-lg flex items-center justify-center`}
                  >
                    <Icon className={`h-6 w-6 text-${stat.color}-400`} />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Search */}
      <SearchAndFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search projects..."
      />

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={Plus}
          title={searchTerm ? "No projects found" : "No projects yet"}
          description={
            searchTerm
              ? "Try adjusting your search terms"
              : "Get started by creating your first project"
          }
          actionLabel={!searchTerm ? "Create Your First Project" : undefined}
          onAction={!searchTerm ? () => addProjectModal.openModal() : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map((project, index) => {
            // Calculate actual payment progress
            const paymentProgress = calculatePaymentProgress(
              project.total_paid,
              project.budget
            );

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="p-6 hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {project.title}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {project.client.full_name} •{" "}
                        {project.client.company_name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={project.status} />
                      <ActionButtons
                        onEdit={() => handleEditProject(project)}
                        onDelete={(e) =>
                          handleDeleteProject(project.id, project.title, e)
                        }
                      />
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  {/* Functional Progress Bar */}
                  <ProgressBar
                    progress={paymentProgress}
                    totalPaid={project.total_paid}
                    budget={project.budget}
                    className="mb-4"
                  />

                  {/* Deadline */}
                  <div className="mb-4 flex justify-between">
                    <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">
                      Due: {formatDate(project.deadline)}
                    </span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">
                      Created: {formatDate(project.created_at)}
                    </span>
                    </div>
                  </div>

                  {project.invoice_url && (
                    <div className="pt-2 border-t border-gray-700 mb-4">
                      <a
                        href={project.invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        View Invoice →
                      </a>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Project Modal for new projects */}
      <ProjectModal
        isOpen={addProjectModal.isOpen}
        onClose={addProjectModal.closeModal}
        onSubmit={handleAddProject}
      />

      {/* Edit Project Modal */}
      <ProjectModal
        isOpen={editProjectModal.isOpen}
        onClose={editProjectModal.closeModal}
        onUpdate={handleUpdateProject}
        editingProject={editProjectModal.data}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.closeDialog}
        onConfirm={confirmDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteDialog.data?.name}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isLoading={deleteDialog.isLoading}
        variant="danger"
      />
    </div>
  );
}
