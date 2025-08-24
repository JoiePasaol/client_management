import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`flex items-center justify-center min-h-[300px] ${className}`}>
      <Card className="p-8 text-center max-w-md">
        <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-4">{description}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </Card>
    </div>
  );
}