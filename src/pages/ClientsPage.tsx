import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/Dialog";
import { AddClientModal } from "../components/AddClientModal";
import { EditClientModal } from "../components/EditClientModal";
import { useNavigate } from "react-router-dom";
import { clientService } from "../services/database";
import { useToaster } from "../context/ToasterContext";

// Client types
type ClientWithStats = {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
  company_name: string;
  created_at: string;
  project_count: number;
  active_project_count: number;
  total_revenue: number;
};

export function ClientsPage() {
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use global toaster
  const { showSuccess, showError } = useToaster();
  
  // Edit client modal state
  const [editClientModal, setEditClientModal] = useState<{
    isOpen: boolean;
    client: ClientWithStats | null;
  }>({
    isOpen: false,
    client: null,
  });
  
  // Dialog states
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
      
      setIsAddClientModalOpen(false);
      
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
      
      // Remove client from local state
      setClients(prev => prev.filter(client => client.id !== deleteDialog.clientId));
      
      // Show success toast for deletion
      showError(
        'Client Deleted',
        `${deleteDialog.clientName} has been permanently removed from your client list`
      );
      
      // Close delete dialog
      setDeleteDialog({
        isOpen: false,
        clientId: null,
        clientName: "",
        isDeleting: false,
      });
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

  const handleClientClick = (client: ClientWithStats) => {
    navigate(`/clients/${client.id}`);
  };

  const filteredClients = clients.filter((client) =>
    client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3 text-gray-300">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Loading clients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Clients</h1>
            <p className="text-gray-400 mt-2">Manage your client relationships</p>
          </div>
          <Button
            onClick={() => setIsAddClientModalOpen(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Client</span>
          </Button>
        </div>

        <div className="flex items-center justify-center min-h-[300px]">
          <Card className="p-8 text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Error Loading Clients</h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <Button onClick={loadClients} variant="secondary">
              Try Again
            </Button>
          </Card>
        </div>

        <AddClientModal
          isOpen={isAddClientModalOpen}
          onClose={() => setIsAddClientModalOpen(false)}
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
          <p className="text-gray-400 mt-2">
            Manage your client relationships <span className="text-white"> ({clients.length} total) </span>
          </p>
        </div>
        <Button
          onClick={() => setIsAddClientModalOpen(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Client</span>
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
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

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="flex items-center justify-center  min-h-[300px]">
          <Card className="p-8 text-center max-w-md">
            <h3 className="text-lg font-medium text-white mb-2">
              {searchTerm ? 'No clients found' : 'No clients yet'}
            </h3>
            <p className="text-gray-400 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Get started by adding your first client'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsAddClientModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Client
              </Button>
            )}
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
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
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => handleEditClient(client, e)}
                      className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClient(client.id, client.full_name, e)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Contact Info Blocks */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-700 rounded-lg">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-300 truncate">{client.email}</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-700 rounded-lg">
                      <Phone className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-300">{client.phone_number}</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-700 rounded-lg">
                      <MapPin className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-300 truncate">{client.address}</p>
                  </div>
                </div>

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

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onSubmit={handleAddClient}
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