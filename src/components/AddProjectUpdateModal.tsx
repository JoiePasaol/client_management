import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";

const projectUpdateSchema = z.object({
  description: z.string()
    .min(1, "Update description is required")
    .min(10, "Update description must be at least 10 characters long"),
});

type ProjectUpdateForm = z.infer<typeof projectUpdateSchema>;

interface AddProjectUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectUpdateForm) => void;
  projectTitle?: string;
}

export function AddProjectUpdateModal({
  isOpen,
  onClose,
  onSubmit,
}: AddProjectUpdateModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProjectUpdateForm>({
    resolver: zodResolver(projectUpdateSchema),
  });

  const handleFormSubmit = async (data: ProjectUpdateForm) => {
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error("Error adding project update:", error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Project Update">
      <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 p-6">
          <div>
            <textarea
              {...register("description")}
              rows={6}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              placeholder="Describe the project progress, milestones achieved, challenges faced, or any important updates..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Minimum 10 characters required</p>
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
              {isSubmitting ? "Adding Update..." : "Add Update"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}