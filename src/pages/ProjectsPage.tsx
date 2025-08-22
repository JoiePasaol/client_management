import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FolderOpen,
  Plus,
  Calendar,
  Users,
  DollarSign,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  Edit,
  Trash2,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/Dialog";
import { AddProjectModal } from "../components/AddProjectModal";
import {
  clientService,
  projectService,
  fileService,
} from "../services/database";
import { useToaster } from "../context/ToasterContext";

// Project with client info type
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
  };
};

export function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);

  // Use global toaster
  const { showSuccess, showError } = useToaster();

  // Delete project dialog state
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

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the optimized method to get all projects with client info
      const allProjects = await projectService.getAllProjectsWithClients();
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

      setIsAddProjectModalOpen(false);

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

      // Remove project from local state
      setProjects((prev) =>
        prev.filter((project) => project.id !== deleteDialog.projectId)
      );

      // Show success toast for deletion
      showError(
        "Project Deleted",
        `${deleteDialog.projectName} has been permanently removed`
      );

      // Close delete dialog
      setDeleteDialog({
        isOpen: false,
        projectId: null,
        projectName: "",
        isDeleting: false,
      });
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

  const getStatusColor = (status: string) => {
    return status === "Started"
      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
      : "bg-green-500/10 text-green-400 border border-green-500/20";
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

  // Calculate stats
  const totalProjects = projects.length;
  const inProgressProjects = projects.filter(
    (p) => p.status === "Started"
  ).length;
  const completedProjects = projects.filter(
    (p) => p.status === "Finished"
  ).length;
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3 text-gray-300">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Projects</h1>
            <p className="text-gray-400 mt-2">
              Track and manage all your active projects in one place.
            </p>
          </div>
          <Button
            onClick={() => setIsAddProjectModalOpen(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </Button>
        </div>

        <div className="flex items-center justify-center min-h-[300px]">
          <Card className="p-8 text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Error Loading Projects
            </h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <Button onClick={loadProjects} variant="secondary">
              Try Again
            </Button>
          </Card>
        </div>
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
          <p className="text-gray-400 mt-2">
            Track and manage all your active projects in one place.
            <span className="text-white"> ({totalProjects} total)</span>
          </p>
        </div>
        <Button
          onClick={() => setIsAddProjectModalOpen(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: "Total Projects",
            value: totalProjects.toString(),
            icon: FolderOpen,
            color: "blue",
          },
          {
            label: "In Progress",
            value: inProgressProjects.toString(),
            icon: FolderOpen,
            color: "yellow",
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
            color: "purple",
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
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="secondary" className="flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <span>Filter</span>
        </Button>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Card className="p-8 text-center max-w-md">
            <h3 className="text-lg font-medium text-white mb-2">
              {searchTerm ? "No projects found" : "No projects yet"}
            </h3>
            <p className="text-gray-400 mb-4">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Get started by creating your first project"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsAddProjectModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            )}
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map((project, index) => (
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
                      {project.client.full_name} • {project.client.company_name}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                    <div className="flex space-x-1">
                      <button className="p-1 text-gray-400 hover:text-blue-400 transition-colors">
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
                  </div>
                </div>

                <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>

                {/* Project Details */}

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">
                      {formatCurrency(project.budget)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">
                      {formatDate(project.deadline)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-400">Progress</span>
                    <span className="text-xs text-gray-400">
                      {project.status === "Finished" ? "100%" : "40%"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: project.status === "Finished" ? "100%" : "40%",
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-2 rounded-full ${
                        project.status === "Finished"
                          ? "bg-green-500"
                          : "bg-blue-500"
                      }`}
                    />
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
                  <Button variant="ghost" size="sm" className="w-full">
                    View Details
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={isAddProjectModalOpen}
        onClose={() => setIsAddProjectModalOpen(false)}
        onSubmit={handleAddProject}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteDialog.projectName}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isLoading={deleteDialog.isDeleting}
        variant="danger"
      />
    </div>
  );
}
