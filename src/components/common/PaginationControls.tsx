import React from 'react';
import { motion } from 'framer-motion';
import { Plus, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';

interface PaginationControlsProps {
  hasMore: boolean;
  canShowLess: boolean;
  onShowMore: () => void;
  onShowLess: () => void;
  visibleCount: number;
  totalCount: number;
  itemName: string;
  className?: string;
}

export function PaginationControls({
  hasMore,
  canShowLess,
  onShowMore,
  onShowLess,
  visibleCount,
  totalCount,
  itemName,
  className = ''
}: PaginationControlsProps) {
  if (!hasMore && !canShowLess) return null;

  return (
    <div className={`mt-6 pt-4 border-t border-gray-700/50 ${className}`}>
      <div className="flex items-center justify-center space-x-3">
        {hasMore && (
          <Button
            variant="ghost"
            onClick={onShowMore}
            className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
          >
            <span>View More</span>
            <motion.div
              initial={{ rotate: 0 }}
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <Plus className="h-4 w-4" />
            </motion.div>
          </Button>
        )}

        {canShowLess && (
          <Button
            variant="ghost"
            onClick={onShowLess}
            className="flex items-center space-x-2 text-gray-400 hover:text-gray-300 hover:bg-gray-500/10"
          >
            <span>Show Less</span>
            <motion.div
              initial={{ rotate: 0 }}
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <ArrowLeft className="h-4 w-4" />
            </motion.div>
          </Button>
        )}
      </div>

      <div className="text-center mt-3">
        <p className="text-xs text-gray-500">
          Showing {Math.min(visibleCount, totalCount)} of {totalCount} {itemName}
        </p>
      </div>
    </div>
  );
}