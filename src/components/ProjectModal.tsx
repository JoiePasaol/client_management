import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, FileText, X, ChevronDown, User } from "lucide-react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { clientService } from "../services/database";

// Define schema based on whether client selection is needed
const createProjectSchema = (requireClientSelection: boolean) => z.object({
  ...(requireClientSelection && {
    clientId: z.number({ required_error: "Please select a client" }).min(1, "Please select a client")
  }),
  title: z.string().min(1, "Project title is required"),
  description: z.string().min(1, "Project description is required"),
  deadline: z.string().min(1, "Deadline is required"),
  budget: z.string().min(1, "Budget is required"),
  status: z.enum(["Started", "Finished"], {
    required_error: "Please select a project status",
  }),
});

// Project type for editing
type ProjectForEdit = {
  id: number;
  title: string;
  description: string;
  deadline: string;
  budget: number;
  status: "Started" | "Finished";
  invoice_url?: string;
  client: {
    id: number;
    full_name: string;
    company_name: string;
  };
};

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any & { invoice?: File }) => void;
  onUpdate?: (projectId: number, data: any & { invoice?: File }) => void;
  clientName?: string; // If provided, we're adding to a specific client
  clientId?: number; // If provided, we're adding to a specific client
  editingProject?: ProjectForEdit; // If provided, we're editing this project
}

type ClientOption = {
  id: number;
  full_name: string;
  company_name: string;
};

export function ProjectModal({
  isOpen,
  onClose,
  onSubmit,
  onUpdate,
  clientName,
  clientId,
  editingProject,
}: ProjectModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);

  // Determine if we need client selection
  const needsClientSelection = !clientId && !editingProject;
  const isEditing = !!editingProject;
  
  const projectSchema = createProjectSchema(needsClientSelection);
  type ProjectForm = z.infer<typeof projectSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    clearErrors,
  } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
  });

  const watchedStatus = watch("status");
  const watchedClientId = needsClientSelection ? watch("clientId" as keyof ProjectForm) : (clientId || editingProject?.client.id);

  // Load clients when modal opens and client selection is needed
  useEffect(() => {
    if (isOpen && needsClientSelection) {
      loadClients();
    }
  }, [isOpen, needsClientSelection]);

  // Set form values when editing
  useEffect(() => {
    if (isOpen && editingProject) {
      setValue("title", editingProject.title);
      setValue("description", editingProject.description);
      setValue("deadline", editingProject.deadline);
      setValue("budget", `$${editingProject.budget.toLocaleString()}`);
      setValue("status", editingProject.status);
      
      // Don't need to set clientId as it's handled by the existing client
    }
  }, [isOpen, editingProject, setValue]);

  // Reset form when modal closes or opens for new project
  useEffect(() => {
    if (isOpen && !editingProject) {
      reset({
        ...(clientId && { clientId }),
      });
      setSelectedFile(null);
    }
  }, [isOpen, editingProject, clientId, reset]);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const clientsData = await clientService.getAllClientsWithStats();
      setClients(clientsData.map(client => ({
        id: client.id,
        full_name: client.full_name,
        company_name: client.company_name
      })));
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleFormSubmit = async (data: ProjectForm) => {
    try {
      if (isEditing && editingProject && onUpdate) {
        // Handle update
        const updateData = {
          ...data,
          invoice: selectedFile || undefined
        };
        await onUpdate(editingProject.id, updateData);
      } else {
        // Handle create
        const submitData = {
          ...data,
          ...(clientId && { clientId }),
          invoice: selectedFile || undefined
        };
        await onSubmit(submitData);
      }
      
      reset();
      setSelectedFile(null);
      onClose();
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} project:`, error);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedFile(null);
    setClientDropdownOpen(false);
    onClose();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
      } else {
        alert("Please select a PDF file");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
      } else {
        alert("Please select a PDF file");
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const handleClientSelect = (selectedClientId: number) => {
    setValue("clientId" as keyof ProjectForm, selectedClientId as any);
    clearErrors("clientId" as keyof ProjectForm);
    setClientDropdownOpen(false);
  };

  const selectedClient = needsClientSelection 
    ? clients.find(client => client.id === watchedClientId)
    : null;

  // Determine modal title
  const getModalTitle = () => {
    if (isEditing) {
      return `Edit Project: ${editingProject?.title}`;
    }
    if (clientName) {
      return `Add Project for ${clientName}`;
    }
    return "Add New Project";
  };

  // Get current client info for display
  const getCurrentClient = () => {
    if (editingProject) {
      return editingProject.client;
    }
    if (selectedClient) {
      return selectedClient;
    }
    return null;
  };

  const currentClient = getCurrentClient();

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getModalTitle()}
    >
      <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-6 p-6"
        >
          {/* Client Selection - Only show when needed and not editing */}
          {needsClientSelection && !isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Select Client
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
                  className={`w-full px-3 py-2 bg-gray-700 focus:outline-none border border-gray-600 rounded-lg text-left flex items-center justify-between focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    selectedClient ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      {selectedClient ? (
                        <div>
                          <span className="text-white">{selectedClient.full_name}</span>
                          <span className="text-gray-400 text-sm ml-2">• {selectedClient.company_name}</span>
                        </div>
                      ) : (
                        <span>Select a client...</span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
                    clientDropdownOpen ? 'transform rotate-180' : ''
                  }`} />
                </button>

                {clientDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-gray-700 focus:outline-none border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {loadingClients ? (
                      <div className="px-3 py-2 text-gray-400 text-center">Loading clients...</div>
                    ) : clients.length === 0 ? (
                      <div className="px-3 py-2 text-gray-400 text-center">No clients found</div>
                    ) : (
                      clients.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => handleClientSelect(client.id)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-800 focus:bg-gray-800 focus:outline-none transition-colors"
                        >
                          <div className="text-white">{client.full_name}</div>
                          <div className="text-gray-400 text-sm">{client.company_name}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {errors.clientId && (
                <p className="mt-2 text-sm text-red-400">
                  {errors.clientId.message}
                </p>
              )}
            </div>
          )}

          {/* Show current client info when editing or have pre-selected client */}
          {(isEditing || clientName) && currentClient && (
            <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600">
              <label className="block text-sm font-medium text-gray-200 mb-1">
                Client
              </label>
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <span className="text-white">{currentClient.full_name}</span>
                  <span className="text-gray-400 text-sm ml-2">• {currentClient.company_name}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-200 mb-2"
            >
              Project Title
            </label>
            <input
              {...register("title")}
              type="text"
              className="w-full px-3 py-2 bg-gray-700 focus:outline-none border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter project title"
            />
            {errors.title && (
              <p className="mt-2 text-sm text-red-400">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-200 mb-2"
            >
              Project Description
            </label>
            <textarea
              {...register("description")}
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 focus:outline-none border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter project description"
            />
            {errors.description && (
              <p className="mt-2 text-sm text-red-400">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="deadline"
                className="block text-sm font-medium text-gray-200 mb-2"
              >
                Deadline
              </label>
              <input
                {...register("deadline")}
                type="date"
                className="w-full px-3 py-2 bg-gray-700 focus:outline-none border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60"
              />
              {errors.deadline && (
                <p className="mt-2 text-sm text-red-400">
                  {errors.deadline.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="budget"
                className="block text-sm font-medium text-gray-200 mb-2"
              >
                Budget
              </label>
              <input
                {...register("budget")}
                type="text"
                className="w-full px-3 py-2 bg-gray-700 focus:outline-none border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., $10,000"
              />
              {errors.budget && (
                <p className="mt-2 text-sm text-red-400">
                  {errors.budget.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-3">
              Project Status
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  {...register("status")}
                  type="radio"
                  value="Started"
                  className="sr-only"
                  onChange={() => setValue("status", "Started")}
                />
                <div
                  className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    watchedStatus === "Started"
                      ? "border-blue-500 bg-blue-500/10 text-blue-400 shadow-lg"
                      : "border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-800/30"
                  }`}
                >
                  <div className="text-center">
                    <p className="font-medium">Started</p>
                    <p className="text-xs opacity-75 mt-1">(In Progress)</p>
                  </div>
                </div>
              </label>

              <label className="flex items-center">
                <input
                  {...register("status")}
                  type="radio"
                  value="Finished"
                  className="sr-only"
                  onChange={() => setValue("status", "Finished")}
                />
                <div
                  className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    watchedStatus === "Finished"
                      ? "border-green-500 bg-green-500/10 text-green-400 shadow-lg"
                      : "border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-800/30"
                  }`}
                >
                  <div className="text-center">
                    <p className="font-medium">Finished</p>
                    <p className="text-xs opacity-75 mt-1">(Completed)</p>
                  </div>
                </div>
              </label>
            </div>
            {errors.status && (
              <p className="mt-2 text-sm text-red-400">
                {errors.status.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              {isEditing && editingProject?.invoice_url ? "Update Invoice (Optional)" : "Invoice Upload (Optional)"}
            </label>
            
            {/* Show current invoice if editing and has one */}
            {isEditing && editingProject?.invoice_url && !selectedFile && (
              <div className="mb-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-sm text-white">Current Invoice</p>
                      <p className="text-xs text-gray-400">PDF file attached</p>
                    </div>
                  </div>
                  <a
                    href={editingProject.invoice_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                  >
                    View →
                  </a>
                </div>
              </div>
            )}

            <div
              className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
                dragActive
                  ? "border-blue-500 bg-blue-500/10 scale-[1.02]"
                  : "border-gray-600 hover:border-gray-500 hover:bg-gray-800/20"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {selectedFile ? (
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center space-x-3 min-w-0">
                    <FileText className="h-8 w-8 text-red-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 flex-shrink-0 ml-3"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="text-center py-2">
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-300 mb-2">
                    {isEditing && editingProject?.invoice_url 
                      ? "Drop a new PDF invoice here to replace current one" 
                      : "Drop your PDF invoice here or click to browse"
                    }
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF files only, up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-4 mt-2 flex-shrink-0">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting 
                ? (isEditing ? "Updating Project..." : "Adding Project...") 
                : (isEditing ? "Update Project" : "Add Project")
              }
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}