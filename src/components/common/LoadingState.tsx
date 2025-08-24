import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ 
  message = "Loading...", 
  className = "min-h-[400px]" 
}: LoadingStateProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center space-x-3 text-gray-300">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p>{message}</p>
      </div>
    </div>
  );
}