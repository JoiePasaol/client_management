/**
 * Utility functions for styling and CSS classes
 */

export const getStatusBadgeColor = (status: string): string => {
  return status === "Started"
    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
    : "bg-green-500/10 text-green-400 border border-green-500/20";
};

export const getDeadlineColor = (isOverdue: boolean, daysRemaining: number): string => {
  if (isOverdue) return "text-red-400";
  if (daysRemaining <= 7) return "text-yellow-400";
  return "text-green-400";
};

export const getDeadlineBackgroundColor = (isOverdue: boolean, daysRemaining: number): string => {
  if (isOverdue) return "bg-red-500/10";
  if (daysRemaining <= 7) return "bg-yellow-500/10";
  return "bg-green-500/10";
};

export const getProgressBarColor = (progress: number): string => {
  if (progress >= 100) return "bg-green-500";
  if (progress > 0) return "bg-blue-500";
  return "bg-gray-600";
};

export const getIconColor = (isOverdue: boolean, daysRemaining: number): string => {
  if (isOverdue) return "text-red-400";
  if (daysRemaining <= 7) return "text-yellow-400";
  return "text-green-400";
};