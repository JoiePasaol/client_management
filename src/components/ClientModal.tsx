import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";

const clientSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address/City is required"),
  companyName: z.string().min(1, "Company name is required"),
});

type ClientForm = z.infer<typeof clientSchema>;

type ClientForEdit = {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
  company_name: string;
};

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClientForm) => void;
  onUpdate?: (clientId: number, data: ClientForm) => void;
  editingClient?: ClientForEdit;
}

export function ClientModal({
  isOpen,
  onClose,
  onSubmit,
  onUpdate,
  editingClient,
}: ClientModalProps) {
  const isEditing = !!editingClient;
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
  });

  useEffect(() => {
    if (isOpen && editingClient) {
      setValue("fullName", editingClient.full_name);
      setValue("email", editingClient.email);
      setValue("phoneNumber", editingClient.phone_number);
      setValue("address", editingClient.address);
      setValue("companyName", editingClient.company_name);
    } else if (isOpen && !editingClient) {
      reset();
    }
  }, [isOpen, editingClient, setValue, reset]);

  const handleFormSubmit = async (data: ClientForm) => {
    try {
      if (isEditing && editingClient && onUpdate) {
        await onUpdate(editingClient.id, data);
      } else {
        await onSubmit(data);
      }
      
      reset();
      onClose();
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} client:`, error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const getModalTitle = () => {
    return isEditing ? `Edit Client: ${editingClient?.full_name}` : "Add New Client";
  };

  const formFields = [
    { name: "fullName", label: "Full Name", type: "text", placeholder: "Enter full name" },
    { name: "email", label: "Email Address", type: "email", placeholder: "Enter email address" },
    { name: "phoneNumber", label: "Phone Number", type: "tel", placeholder: "Enter phone number" },
    { name: "address", label: "Address", type: "text", placeholder: "Enter address" },
    { name: "companyName", label: "Company Name", type: "text", placeholder: "Enter company name" },
  ] as const;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={getModalTitle()}>
      <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 p-6">
          {formFields.map((field) => (
            <div key={field.name}>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-200 mb-1"
              >
                {field.label}
              </label>
              <input
                {...register(field.name)}
                type={field.type}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={field.placeholder}
              />
              {errors[field.name] && (
                <p className="mt-1 text-sm text-red-400">
                  {errors[field.name]?.message}
                </p>
              )}
            </div>
          ))}

          <div className="flex space-x-3 pt-2 flex-shrink-0">
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
                ? (isEditing ? "Updating Client..." : "Adding Client...") 
                : (isEditing ? "Update Client" : "Add Client")
              }
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}