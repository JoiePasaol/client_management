// src/serctions/ClientPortal.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Link2,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  Globe,
  Shield,
  ShieldOff,
} from "lucide-react";

import {
  clientPortalService,
  type ClientPortal,
} from "../services/clientPortalService";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/Dialog";
import { useConfirmDialog } from "../hooks/useConfirmDialog";

interface ClientPortalSectionProps {
  projectId: number;
  projectTitle: string;
  onSuccess: (message: string) => void;
  onError: (title: string, message: string) => void;
}

export function ClientPortalSection({
  projectId,
  projectTitle,
  onSuccess,
  onError,
}: ClientPortalSectionProps) {
  const [portal, setPortal] = useState<ClientPortal | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const deleteDialog = useConfirmDialog();

  useEffect(() => {
    loadPortalData();
  }, [projectId]);

  const loadPortalData = async () => {
    try {
      setLoading(true);
      const data = await clientPortalService.getPortalByProject(projectId);
      setPortal(data);
    } catch (err) {
      console.error("Error loading portal data:", err);
      onError(
        "Failed to Load Portal",
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortal = async () => {
    try {
      setActionLoading(true);
      const newPortal = await clientPortalService.createOrUpdatePortal(
        projectId
      );
      setPortal(newPortal);
      onSuccess(
        "Client portal created successfully! You can now share the link with your client."
      );
    } catch (err) {
      console.error("Error creating portal:", err);
      onError(
        "Failed to Create Portal",
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePortal = async () => {
    if (!portal) return;

    try {
      setActionLoading(true);
      const updatedPortal = await clientPortalService.togglePortalStatus(
        projectId,
        !portal.is_enabled
      );
      setPortal(updatedPortal);

      if (updatedPortal.is_enabled) {
        onSuccess(
          "Client portal has been enabled. Your client can now access the project."
        );
      } else {
        onSuccess("Client portal has been disabled. Access is now restricted.");
      }
    } catch (err) {
      console.error("Error toggling portal:", err);
      onError(
        "Failed to Update Portal",
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePortal = async () => {
    try {
      deleteDialog.setLoading(true);
      await clientPortalService.deletePortal(projectId);
      setPortal(null);
      deleteDialog.closeDialog();
      onSuccess("Client portal has been deleted successfully.");
    } catch (err) {
      console.error("Error deleting portal:", err);
      deleteDialog.setLoading(false);
      onError(
        "Failed to Delete Portal",
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

  const handleCopyLink = async () => {
    if (!portal) return;

    try {
      const portalUrl = clientPortalService.generatePortalUrl(
        portal.access_token
      );
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onSuccess("Portal link copied to clipboard!");
    } catch (err) {
      console.error("Error copying link:", err);
      onError(
        "Failed to Copy Link",
        "Unable to copy the portal link to clipboard"
      );
    }
  };

  const handleOpenPortal = () => {
    if (!portal) return;

    const portalUrl = clientPortalService.generatePortalUrl(
      portal.access_token
    );
    window.open(portalUrl, "_blank");
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="animate-pulse"
      >
        <Card variant="secondary">
          <div className="p-6">
            <div className="h-6 bg-gray-700 rounded mb-4 w-48"></div>
            <div className="h-32 bg-gray-700 rounded"></div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card variant="secondary">
        <div className="p-6">
          {!portal ? (
            <div className="text-center py-8">
              <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No Client Portal Created
              </h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Create a secure portal link for your client to track project
                progress, view payment history, and receive updates without
                accessing your admin panel.
              </p>
              <Button
                onClick={handleCreatePortal}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Link2 className="h-4 w-4 mr-2" />
                {actionLoading ? "Creating..." : "Create Portal Link"}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Portal Status */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-600">
                <div className="flex items-center space-x-3">
                  {portal.is_enabled ? (
                    <div className="h-10 w-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-green-400" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                      <ShieldOff className="h-5 w-5 text-red-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-white">
                      Portal Status: {portal.is_enabled ? "Active" : "Disabled"}
                    </p>
                    <p className="text-sm text-gray-400">
                      {portal.is_enabled
                        ? "Your client can access the project portal"
                        : "Client access is currently disabled"}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleTogglePortal}
                  disabled={actionLoading}
                  variant={portal.is_enabled ? "secondary" : "primary"}
                  size="sm"
                >
                  {portal.is_enabled ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Disable Access
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Enable Access
                    </>
                  )}
                </Button>
              </div>

              {/* Portal Link */}
              {portal.is_enabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Client Portal Link
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-700/50 rounded-lg px-4 py-3 border border-gray-600">
                        <p className="text-sm text-gray-300 font-mono break-all">
                          {clientPortalService.generatePortalUrl(
                            portal.access_token
                          )}
                        </p>
                      </div>
                      <Button
                        onClick={handleCopyLink}
                        variant="secondary"
                        size="sm"
                        className="flex-shrink-0"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={handleOpenPortal}
                    variant="secondary"
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Portal
                  </Button>
                </div>
              )}

              {/* Portal Actions */}
              <div className="border-t border-gray-600 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Portal Management
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Created on{" "}
                      {new Date(portal.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <Button
                    onClick={() => deleteDialog.openDialog()}
                    variant="ghost"
                    size="sm"
                    className=" text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Portal
                  </Button>
                </div>
              </div>

              {/* Portal Features Info */}
              <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                <h4 className="text-sm font-medium text-white mb-2">
                  What clients can view:
                </h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Project details and current status</li>
                  <li>• Payment history and progress</li>
                  <li>• Project updates and milestones</li>
                  <li>• Deadline information</li>
                </ul>
                <p className="text-xs text-gray-500 mt-2">
                  Clients cannot create, edit, or delete any data through the
                  portal.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.closeDialog}
        onConfirm={handleDeletePortal}
        title="Delete Client Portal"
        message={`Are you sure you want to delete the client portal for "${projectTitle}"? This will permanently remove the access link and your client will no longer be able to view the project.`}
        confirmText="Yes, Delete Portal"
        cancelText="Cancel"
        isLoading={deleteDialog.isLoading}
        variant="danger"
      />
    </motion.div>
  );
}
