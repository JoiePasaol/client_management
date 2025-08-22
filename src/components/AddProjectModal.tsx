import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, FileText, X } from "lucide-react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";

const projectSchema = z.object({
  title: z.string().min(1, "Project title is required"),
  description: z.string().min(1, "Project description is required"),
  deadline: z.string().min(1, "Deadline is required"),
  budget: z.string().min(1, "Budget is required"),
  status: z.enum(["Started", "Finished"], {
    required_error: "Please select a project status",
  }),
});

type ProjectForm = z.infer<typeof projectSchema>;

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectForm & { invoice?: File }) => void;
  clientName: string;
}

export function AddProjectModal({
  isOpen,
  onClose,
  onSubmit,
  clientName,
}: AddProjectModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
  });

  const watchedStatus = watch("status");

  const handleFormSubmit = async (data: ProjectForm) => {
    try {
      await onSubmit({ ...data, invoice: selectedFile || undefined });
      reset();
      setSelectedFile(null);
      onClose();
    } catch (error) {
      console.error("Error adding project:", error);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedFile(null);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Add Project for ${clientName}`}
    >
      {/* This div handles the scrolling behavior for this specific modal */}
      <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-6 p-6"
        >
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
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              Invoice Upload (Optional)
            </label>
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
                    Drop your PDF invoice here or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF files only, up to 10MB
                  </p>
                </div>
              )}
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
                onClick={handleSubmit(handleFormSubmit)}
              >
                {isSubmitting ? "Adding Project..." : "Add Project"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
