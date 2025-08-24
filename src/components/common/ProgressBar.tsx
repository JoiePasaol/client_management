import React from 'react';
import { motion } from 'framer-motion';
import { getProgressBarColor } from '../../utils/styles';
import { formatCurrency } from '../../utils/formatters';

interface ProgressBarProps {
  progress: number;
  totalPaid: number;
  budget: number;
  label?: string;
  showAmounts?: boolean;
  className?: string;
}

export function ProgressBar({
  progress,
  totalPaid,
  budget,
  label = "Payment Progress",
  showAmounts = true,
  className = ''
}: ProgressBarProps) {
  return (
    <div className={className}>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-400">{label}</span>
        {showAmounts && (
          <span className="text-xs text-gray-400">
            {progress >= 100
              ? "100%"
              : `${formatCurrency(totalPaid)}/${formatCurrency(budget)}`}
          </span>
        )}
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-2 rounded-full ${getProgressBarColor(progress)}`}
        />
      </div>
    </div>
  );
}