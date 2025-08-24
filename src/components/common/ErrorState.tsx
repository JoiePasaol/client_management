import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = "Error",
  message,
  onRetry,
  retryLabel = "Try Again",
  className = "min-h-[300px]"
}: ErrorStateProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Card className="p-8 text-center max-w-md">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-4">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="secondary">
            {retryLabel}
          </Button>
        )}
      </Card>
    </div>
  );
}