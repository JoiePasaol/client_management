import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/Dialog";
import { ClientModal } from "../components/ClientModal";
import { LoadingState } from "../components/common/LoadingState";
import { ErrorState } from "../components/common/ErrorState";
import { EmptyState } from "../components/common/EmptyState";
import { SearchAndFilter } from "../components/common/SearchAndFilter";
import { ContactInfo } from "../components/common/ContactInfo";
import { ActionButtons } from "../components/common/ActionButtons";
import { useNavigate } from "react-router-dom";
import { clientService, type ClientWithStats } from "../services/database";
import { useToaster } from "../context/ToasterContext";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import { useModal } from "../hooks/useModal";
import { formatCurrency } from "../utils/formatters";




export function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use global toaster
  const { showSuccess, showError } = useToaster();
  
  // Custom hooks for modals and dialogs
  const addClientModal = useModal();
  const editClientModal = useModal<ClientWithStats>();
  const deleteDialog = useConfirmDialog<{ id: number; name: string }>();

  const navigate = useNavigate();

  // Load clients on component mount
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const clientsData = await clientService.getAllClientsWithStats();
      setClients(clientsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients');
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (clientData: {
    fullName: string;
    email: string;
    phoneNumber: string;
    address: string;
    companyName: string;
  }) => {
    try {
      await clientService.createClient({
        full_name: clientData.fullName,
        email: clientData.email,
        phone_number: clientData.phoneNumber,
        address: clientData.address,
        company_name: clientData.companyName,
      });
      
      addClientModal.closeModal();
      
      // Show success toast
      showSuccess(
        'Client Added Successfully',
        `${clientData.fullName} has been added to your client list`
      );
      
      // Reload clients to show the new one
      await loadClients();
    } catch (err) {
      console.error("Error adding client:", err);
      showError(
        'Failed to Add Client',
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    }
  };

  const handleEditClient = (client: ClientWithStats, e: React.MouseEvent) => {
    e.stopPropagation();
    editClientModal.openModal(client);
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
      
      editClientModal.closeModal();
      
      // Show success toast
      showSuccess(
        'Client Updated Successfully',
        `${clientData.fullName}'s information has been updated`
      );
      
      // Reload clients to show the updated information
      await loadClients();
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
    deleteDialog.openDialog({ id: clientId, name: clientName });
  };

  const confirmDeleteClient = async () => {
    if (!deleteDialog.data) return;

    try {
      deleteDialog.setLoading(true);
      
      await clientService.deleteClient(deleteDialog.data.id);
      
      // Remove client from local state
      setClients(prev => prev.filter(client => client.id !== deleteDialog.data?.id));
      
      // Show success toast for deletion
      showError(
        'Client Deleted',
        `${deleteDialog.data.name} has been permanently removed from your client list`
      );
      
      // Close delete dialog
      deleteDialog.closeDialog();
    } catch (err) {
      console.error("Error deleting client:", err);
      deleteDialog.setLoading(false);
      showError(
        'Failed to Delete Client',
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    }
  };

  const handleClientClick = (client: ClientWithStats) => {
    navigate(`/clients/${client.id}`);
  };

  const filteredClients = clients.filter((client) =>
    client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingState message="Loading clients..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Clients</h1>
         
          </div>
          <Button
            onClick={() => addClientModal.openModal()}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Client</span>
          </Button>
        </div>

        <ErrorState
          title="Error Loading Clients"
          message={error}
          onRetry={loadClients}
        />

        <ClientModal
          isOpen={addClientModal.isOpen}
          onClose={addClientModal.closeModal}
          onSubmit={handleAddClient}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Clients</h1>
         
        </div>
        <Button
          onClick={() => addClientModal.openModal()}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Client</span>
        </Button>
      </div>

      {/* Search and Filter */}
      <SearchAndFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search clients..."
      />

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <EmptyState
          icon={Plus}
          title={searchTerm ? 'No clients found' : 'No clients yet'}
          description={
            searchTerm 
              ? 'Try adjusting your search terms' 
              : 'Get started by adding your first client'
          }
          actionLabel={!searchTerm ? "Add Your First Client" : undefined}
          onAction={!searchTerm ? () => addClientModal.openModal() : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleClientClick(client)}
              className="cursor-pointer"
            >
              <Card className="p-6 hover:bg-gray-700/50 transition-colors">
                {/* Header with name and action buttons */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-white text-lg">
                      {client.full_name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {client.company_name}
                    </p>
                  </div>
                  <ActionButtons
                    onEdit={(e) => handleEditClient(client, e)}
                    onDelete={(e) => handleDeleteClient(client.id, client.full_name, e)}
                  />
                </div>

                {/* Contact Info Blocks */}
                <ContactInfo
                  email={client.email}
                  phoneNumber={client.phone_number}
                  address={client.address}
                  className="mb-4"
                />

                {/* Stats Row */}
                <div className="flex justify-between items-center border-t border-gray-700 pt-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Projects</p>
                    <p
                      className={`font-medium ${
                        client.project_count > 0 ? "text-white" : "text-gray-400"
                      }`}
                    >
                      {client.project_count}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Revenue</p>
                    <p
                      className={`font-medium ${
                        client.total_revenue > 0
                          ? "text-white"
                          : "text-gray-400"
                      }`}
                    >
                      {formatCurrency(client.total_revenue)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-blue-400">Active</p>
                    <p
                      className={`font-medium ${
                        client.active_project_count > 0
                          ? "text-blue-400"
                          : "text-gray-400"
                      }`}
                    >
                      {client.active_project_count}
                    </p>
                  </div>
                  
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Client Modal - For new clients */}
      <ClientModal
        isOpen={addClientModal.isOpen}
        onClose={addClientModal.closeModal}
        onSubmit={handleAddClient}
      />

      {/* Edit Client Modal - Using unified component */}
      <ClientModal
        isOpen={editClientModal.isOpen}
        onClose={editClientModal.closeModal}
        onSubmit={handleAddClient} // Still needed for type compatibility
        onUpdate={handleUpdateClient} // Handler for updates
        editingClient={editClientModal.data}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.closeDialog}
        onConfirm={confirmDeleteClient}
        title="Delete Client"
        message={`Are you sure you want to delete "${deleteDialog.data?.name}"? This action will permanently remove the client and all associated projects. This cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isLoading={deleteDialog.isLoading}
        variant="danger"
      />
    </div>
  );
}