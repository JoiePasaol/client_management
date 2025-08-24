import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

interface ActionButtonsProps {
  onEdit?: (e: React.MouseEvent) => void; 
  onDelete: (e: React.MouseEvent) => void;
  className?: string;
  showEdit?: boolean; 
}

export function ActionButtons({
  onEdit,
  onDelete,
  className = '',
  showEdit = true,
}: ActionButtonsProps) {
  return (
    <div className={`flex space-x-2 ${className}`}>
      {showEdit && (
        <button
          onClick={onEdit}
          className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </button>
      )}
      <button
        onClick={onDelete}
        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
