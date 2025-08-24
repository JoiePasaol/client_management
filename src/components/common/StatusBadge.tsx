import React from 'react';
import { getStatusBadgeColor } from '../../utils/styles';

interface StatusBadgeProps {
  status: 'Started' | 'Finished';
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeColor(
        status
      )} ${className}`}
    >
      {status}
    </span>
  );
}