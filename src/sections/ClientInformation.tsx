import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Edit, 
  Trash2, 
  Plus, 
  Loader2, 
  AlertCircle,
  Calendar,
  DollarSign,
  Clock,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/Dialog";
import { AddProjectModal } from "../components/AddProjectModal";
import { EditClientModal } from "../components/EditClientModal";
import { clientService, projectService, fileService } from "../services/database";
import { useToaster } from "../context/ToasterContext";
import type { ClientWithProjects } from "../lib/supabase";

export function ClientInformation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [client, setClient] = useState<ClientWithProjects | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use global toaster
  const { showSuccess, showError } = useToaster();

  // Edit client modal state
  const [editClientModal, setEditClientModal] = useState<{
    isOpen: boolean;
    client: ClientWithProjects | null;
  }>({
    isOpen: false,
    client: null,
  });

  // Delete client confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    clientId: number | null;
    clientName: string;
    isDeleting: boolean;
  }>({
    isOpen: false,
    clientId: null,
    clientName: "",
    isDeleting: false,
  });

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

  const handleEditClient = (client: ClientWithProjects, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditClientModal({
      isOpen: true,
      client: client,
    });
  };

  const handleUpdateClient = async (clientData: {
    fullName: string;
    email: string;
    phoneNumber: string;
    address: string;
    companyName: string;
  }) => {
    if (!editClientModal.client) return;

    try {
      await clientService.updateClient(editClientModal.client.id, {
        full_name: clientData.fullName,
        email: clientData.email,
        phone_number: clientData.phoneNumber,
        address: clientData.address,
        company_name: clientData.companyName,
      });
      
      setEditClientModal({ isOpen: false, client: null });
      
      // Show success toast
      showSuccess(
        'Client Updated Successfully',
        `${clientData.fullName}'s information has been updated`
      );
      
      // Reload client data to show the updated information
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
    setDeleteDialog({
      isOpen: true,
      clientId,
      clientName,
      isDeleting: false,
    });
  };

  const confirmDeleteClient = async () => {
    if (!deleteDialog.clientId) return;

    try {
      setDeleteDialog(prev => ({ ...prev, isDeleting: true }));
      
      await clientService.deleteClient(deleteDialog.clientId);
      
      // Show success toast
      showError(
        'Client Deleted',
        `${deleteDialog.clientName} has been permanently removed`
      );
      
      // Navigate back to clients page after successful deletion
      navigate('/clients');
    } catch (err) {
      console.error("Error deleting client:", err);
      setDeleteDialog(prev => ({ ...prev, isDeleting: false }));
      showError(
        'Failed to Delete Client',
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    }
  };

  const closeDeleteDialog = () => {
    if (!deleteDialog.isDeleting) {
      setDeleteDialog({
        isOpen: false,
        clientId: null,
        clientName: "",
        isDeleting: false,
      });
    }
  };

  const closeEditModal = () => {
    setEditClientModal({ isOpen: false, client: null });
  };

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
      
      // First create the project
      const newProject = await projectService.createProject({
        client_id: client.id,
        title: projectData.title,
        description: projectData.description,
        deadline: projectData.deadline,
        budget: parseFloat(projectData.budget.replace(/[^0-9.-]+/g, "")),
        status: projectData.status,
      });

      // Then upload invoice if provided
      if (projectData.invoice) {
        invoiceUrl = await fileService.uploadInvoice(projectData.invoice, newProject.id);
        // Update project with invoice URL
        await projectService.updateProject(newProject.id, { invoice_url: invoiceUrl });
      }

      setIsAddProjectModalOpen(false);
      
      // Show success toast
      showSuccess(
        'Project Added Successfully',
        `${projectData.title} has been added to ${client.full_name}'s projects`
      );
      
      // Reload client data to show the new project
      await loadClientData(client.id);
    } catch (err) {
      console.error("Error adding project:", err);
      showError(
        'Failed to Add Project',
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    return status === 'Started' ? 'text-blue-400' : 'text-green-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3 text-gray-300">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Loading client data...</p>
        </div>
      </div>
    );
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

        <div className="flex items-center justify-center min-h-[300px]">
          <Card className="p-8 text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {error === 'Client not found' ? 'Client Not Found' : 'Error Loading Client'}
            </h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <Button onClick={() => navigate('/clients')} variant="secondary">
              Back to Clients
            </Button>
          </Card>
        </div>
      </div>
    );
  }

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
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">
                Contact Information
              </h3>
        
              <p className="text-white font-medium text-lg">
                {client.full_name}
              </p>
              <p className="text-gray-400 font-medium text-md">
                {client.company_name}
              </p>
               
              <div className="space-y-4 mt-4">
                <div className="flex items-center space-x-3 text-gray-300">
                  <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm">{client.email}</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm">{client.phone_number}</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm">{client.address}</span>
                </div>
              </div>
            </div>

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

            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-4">
                Revenue
              </h3>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(totalRevenue)}
              </p>
            </div>

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
            onClick={() => setIsAddProjectModalOpen(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Project</span>
          </Button>
        </div>

        {client.projects.length === 0 ? (
          <Card className="p-8 text-center">
            <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
            <p className="text-gray-400 mb-4">
              Get started by adding the first project for {client.full_name}
            </p>
            <Button onClick={() => setIsAddProjectModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Project
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {client.projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="p-6 hover:bg-gray-700/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium text-white text-lg mb-1">
                        {project.title}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          project.status === 'Started'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-green-500/10 text-green-400 border border-green-500/20'
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <button className="p-1 text-gray-400 hover:text-blue-400 transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
                        >
                          View Invoice →
                        </a>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={isAddProjectModalOpen}
        onClose={() => setIsAddProjectModalOpen(false)}
        onSubmit={handleAddProject}
        clientName={client.full_name}
      />

      {/* Edit Client Modal */}
      <EditClientModal
        isOpen={editClientModal.isOpen}
        onClose={closeEditModal}
        onSubmit={handleUpdateClient}
        client={editClientModal.client}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteClient}
        title="Delete Client"
        message={`Are you sure you want to delete "${deleteDialog.clientName}"? This action will permanently remove the client and all associated projects. This cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isLoading={deleteDialog.isDeleting}
        variant="danger"
      />
    </div>
  );
}