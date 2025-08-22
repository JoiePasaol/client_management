import React, { useEffect } from "react";
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

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClientForm) => void;
  client?: {
    id: number;
    full_name: string;
    email: string;
    phone_number: string;
    address: string;
    company_name: string;
  } | null;
}

export function EditClientModal({
  isOpen,
  onClose,
  onSubmit,
  client,
}: EditClientModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
  });

  // Populate form with existing client data when modal opens
  useEffect(() => {
    if (isOpen && client) {
      setValue("fullName", client.full_name);
      setValue("email", client.email);
      setValue("phoneNumber", client.phone_number);
      setValue("address", client.address);
      setValue("companyName", client.company_name);
    }
  }, [isOpen, client, setValue]);

  const handleFormSubmit = async (data: ClientForm) => {
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error("Error updating client:", error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Client">
      {/* Scrollable content area */}
      <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4 p-6"
        >
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-200 mb-1"
            >
              Full Name
            </label>
            <input
              {...register("fullName")}
              type="text"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter full name"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-400">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-200 mb-1"
            >
              Email Address
            </label>
            <input
              {...register("email")}
              type="email"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-200 mb-1"
            >
              Phone Number
            </label>
            <input
              {...register("phoneNumber")}
              type="tel"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter phone number"
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-sm text-red-400">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-200 mb-1"
            >
              Address/City
            </label>
            <input
              {...register("address")}
              type="text"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter address or city"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-400">
                {errors.address.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="companyName"
              className="block text-sm font-medium text-gray-200 mb-1"
            >
              Company Name
            </label>
            <input
              {...register("companyName")}
              type="text"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter company name"
            />
            {errors.companyName && (
              <p className="mt-1 text-sm text-red-400">
                {errors.companyName.message}
              </p>
            )}
          </div>

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
              {isSubmitting ? "Updating Client..." : "Update Client"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}