import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Plus, 
  Calendar,
  DollarSign,
  Clock,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/Dialog";
import { ProjectModal } from "../components/ProjectModal";
import { ClientModal } from "../components/ClientModal";
import { ActionButtons } from "../components/common/ActionButtons";
import { ContactInfo } from "../components/common/ContactInfo";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { StatusBadge } from "../components/common/StatusBadge";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import { useModal } from "../hooks/useModal";
import { clientService, projectService, fileService, type ClientWithProjects } from "../services/database";
import { useToaster } from "../context/ToasterContext";
import { formatCurrency, formatDate, parseBudget } from "../utils/formatters";

interface DeleteClientData {
  clientId: number;
  clientName: string;
}

interface DeleteProjectData {
  projectId: number;
  projectTitle: string;
}

export function ClientInformation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToaster();

  // State
  const [client, setClient] = useState<ClientWithProjects | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const addProjectModal = useModal();
  const clientModal = useModal<ClientWithProjects>();
  const projectModal = useModal<any>();

  // Confirm dialogs
  const deleteClientDialog = useConfirmDialog<DeleteClientData>();
  const deleteProjectDialog = useConfirmDialog<DeleteProjectData>();

  useEffect(() => {
    if (id) {
      loadClientData(parseInt(id));
    }
  }, [id]);

  const loadClientData = async (clientId: number) => {
    try {
      setLoading(true);
      setError(null);
      const clientData = await clientService.getClientWithProjects(clientId);
      if (!clientData) {
        setError('Client not found');
        return;
      }
      setClient(clientData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load client data');
      console.error('Error loading client:', err);
    } finally {
      setLoading(false);
    }
  };

  // Client handlers
  const handleEditClient = (client: ClientWithProjects, e: React.MouseEvent) => {
    e.stopPropagation();
    clientModal.openModal(client);
  };

  const handleUpdateClient = async (clientId: number, clientData: {
    fullName: string;
    email: string;
    phoneNumber: string;
    address: string;
    companyName: string;
  }) => {
    try {
      await clientService.updateClient(clientId, {
        full_name: clientData.fullName,
        email: clientData.email,
        phone_number: clientData.phoneNumber,
        address: clientData.address,
        company_name: clientData.companyName,
      });
      
      clientModal.closeModal();
      showSuccess(
        'Client Updated Successfully',
        `${clientData.fullName}'s information has been updated`
      );
      
      if (client) {
        await loadClientData(client.id);
      }
    } catch (err) {
      console.error("Error updating client:", err);
      showError(
        'Failed to Update Client',
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    }
  };

  const handleDeleteClient = (clientId: number, clientName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteClientDialog.openDialog({ clientId, clientName });
  };

  const confirmDeleteClient = async () => {
    if (!deleteClientDialog.data) return;

    try {
      deleteClientDialog.setLoading(true);
      
      await clientService.deleteClient(deleteClientDialog.data.clientId);
      
      showError(
        'Client Deleted',
        `${deleteClientDialog.data.clientName} has been permanently removed`
      );
      
      navigate('/clients');
    } catch (err) {
      console.error("Error deleting client:", err);
      deleteClientDialog.setLoading(false);
      showError(
        'Failed to Delete Client',
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    }
  };

  // Project handlers
  const handleAddProject = async (projectData: {
    title: string;
    description: string;
    deadline: string;
    budget: string;
    status: 'Started' | 'Finished';
    invoice?: File;
  }) => {
    if (!client) return;

    try {
      let invoiceUrl;
      
      const newProject = await projectService.createProject({
        client_id: client.id,
        title: projectData.title,
        description: projectData.description,
        deadline: projectData.deadline,
        budget: parseBudget(projectData.budget),
        status: projectData.status,
      });

      if (projectData.invoice) {
        invoiceUrl = await fileService.uploadInvoice(projectData.invoice, newProject.id);
        await projectService.updateProject(newProject.id, { invoice_url: invoiceUrl });
      }

      addProjectModal.closeModal();
      showSuccess(
        'Project Added Successfully',
        `${projectData.title} has been added to ${client.full_name}'s projects`
      );
      
      await loadClientData(client.id);
    } catch (err) {
      console.error("Error adding project:", err);
      showError(
        'Failed to Add Project',
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    }
  };

  const handleEditProject = (project: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const editingProject = {
      id: project.id,
      title: project.title,
      description: project.description,
      deadline: project.deadline,
      budget: project.budget,
      status: project.status,
      invoice_url: project.invoice_url,
      client: {
        id: client!.id,
        full_name: client!.full_name,
        company_name: client!.company_name,
      },
    };

    projectModal.openModal(editingProject);
  };

  const handleUpdateProject = async (projectId: number, projectData: {
    title: string;
    description: string;
    deadline: string;
    budget: string;
    status: 'Started' | 'Finished';
    invoice?: File;
  }) => {
    try {
      let invoiceUrl = undefined;

      if (projectData.invoice) {
        invoiceUrl = await fileService.uploadInvoice(projectData.invoice, projectId);
      }

      await projectService.updateProject(projectId, {
        title: projectData.title,
        description: projectData.description,
        deadline: projectData.deadline,
        budget: parseBudget(projectData.budget),
        status: projectData.status,
        ...(invoiceUrl && { invoice_url: invoiceUrl }),
      });

      projectModal.closeModal();
      showSuccess(
        'Project Updated Successfully',
        `${projectData.title} has been updated`
      );

      if (client) {
        await loadClientData(client.id);
      }
    } catch (err) {
      console.error("Error updating project:", err);
      showError(
        'Failed to Update Project',
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    }
  };

  const handleDeleteProject = (projectId: number, projectTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteProjectDialog.openDialog({ projectId, projectTitle });
  };

  const confirmDeleteProject = async () => {
    if (!deleteProjectDialog.data) return;

    try {
      deleteProjectDialog.setLoading(true);
      
      await projectService.deleteProject(deleteProjectDialog.data.projectId);
      
      showError(
        'Project Deleted',
        `${deleteProjectDialog.data.projectTitle} has been permanently removed`
      );

      if (client) {
        await loadClientData(client.id);
      }
      
      deleteProjectDialog.closeDialog();
    } catch (err) {
      console.error("Error deleting project:", err);
      deleteProjectDialog.setLoading(false);
      showError(
        'Failed to Delete Project',
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    }
  };

  // Render states
  if (loading) {
    return <LoadingState message="Loading client data..." />;
  }

  if (error || !client) {
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
              onClick={() => navigate("/clients")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Clients</span>
            </Button>
          </div>
        </motion.div>

        <ErrorState
          title={error === 'Client not found' ? 'Client Not Found' : 'Error Loading Client'}
          message={error || 'Unknown error'}
          onRetry={() => navigate('/clients')}
          retryLabel="Back to Clients"
        />
      </div>
    );
  }

  // Calculate statistics
  const totalRevenue = client.projects.reduce((sum, project) => sum + project.budget, 0);
  const activeProjects = client.projects.filter(project => project.status === 'Started').length;
  const completedProjects = client.projects.filter(project => project.status === 'Finished').length;

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
            onClick={() => navigate("/clients")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Clients</span>
          </Button>
        </div>
      </motion.div>

      {/* Client Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">
                Contact Information
              </h3>
              <div className="mb-4">
                <p className="text-white font-medium text-lg">{client.full_name}</p>
                <p className="text-gray-400 font-medium text-md">{client.company_name}</p>
              </div>
              <ContactInfo
                email={client.email}
                phoneNumber={client.phone_number}
                address={client.address}
              />
            </div>

            {/* Projects Statistics */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-4">
                Projects
              </h3>
              <div className="space-y-3">
                <p className="text-white font-medium">
                  Total: {client.projects.length}
                </p>
                <p className="text-blue-400 font-medium">
                  Active: {activeProjects}
                </p>
                <p className="text-green-400">
                  Completed: {completedProjects}
                </p>
              </div>
            </div>

            {/* Revenue */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-4">
                Revenue
              </h3>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(totalRevenue)}
              </p>
            </div>

            {/* Actions */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-4">
                Actions
              </h3>
              <div className="flex flex-col space-y-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => handleEditClient(client, e)}
                  className="flex items-center justify-start space-x-2 w-full"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Client</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleDeleteClient(client.id, client.full_name, e)}
                  className="flex items-center justify-start space-x-2 w-full text-red-400 hover:text-red-300 hover:bg-red-400/10"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Client</span>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Projects Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Projects</h2>
          <Button
            onClick={() => addProjectModal.openModal()}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Project</span>
          </Button>
        </div>

        {client.projects.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="No projects yet"
            description={`Get started by adding the first project for ${client.full_name}`}
            actionLabel="Add First Project"
            onAction={() => addProjectModal.openModal()}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {client.projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <div
                  className="cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <Card className="p-6 hover:bg-gray-700/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium text-white text-lg mb-1">
                          {project.title}
                        </h3>
                        <StatusBadge status={project.status} />
                      </div>
                      <ActionButtons
                        onEdit={(e) => handleEditProject(project, e)}
                        onDelete={(e) => handleDeleteProject(project.id, project.title, e)}
                        className="z-10 relative"
                      />
                    </div>

                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">
                          Due: {formatDate(project.deadline)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 text-sm">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">
                          {formatCurrency(project.budget)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 text-sm">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">
                          Created: {formatDate(project.created_at)}
                        </span>
                      </div>

                      {project.invoice_url && (
                        <div className="pt-2 border-t border-gray-700">
                          <a
                            href={project.invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Invoice →
                          </a>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <ProjectModal
        isOpen={addProjectModal.isOpen}
        onClose={addProjectModal.closeModal}
        onSubmit={handleAddProject}
        clientName={client.full_name}
        clientId={client.id}
      />

      <ProjectModal
        isOpen={projectModal.isOpen}
        onClose={projectModal.closeModal}
        onSubmit={() => {}}
        onUpdate={handleUpdateProject}
        editingProject={projectModal.data}
      />

      <ClientModal
        isOpen={clientModal.isOpen}
        onClose={clientModal.closeModal}
        onSubmit={() => {}}
        onUpdate={handleUpdateClient}
        editingClient={clientModal.data}
      />

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={deleteClientDialog.isOpen}
        onClose={deleteClientDialog.closeDialog}
        onConfirm={confirmDeleteClient}
        title="Delete Client"
        message={`Are you sure you want to delete "${deleteClientDialog.data?.clientName}"? This action will permanently remove the client and all associated projects. This cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isLoading={deleteClientDialog.isLoading}
        variant="danger"
      />

      <ConfirmDialog
        isOpen={deleteProjectDialog.isOpen}
        onClose={deleteProjectDialog.closeDialog}
        onConfirm={confirmDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteProjectDialog.data?.projectTitle}"? This action will permanently remove the project and all associated data. This cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isLoading={deleteProjectDialog.isLoading}
        variant="danger"
      />
    </div>
  );
}