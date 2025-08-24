import React from 'react';
import { Calendar } from 'lucide-react';
import { getDeadlineStatus } from '../../utils/calculations';
import { getDeadlineColor, getDeadlineBackgroundColor, getIconColor } from '../../utils/styles';
import { formatDate } from '../../utils/formatters';

interface DeadlineInfoProps {
  deadline: string;
  showIcon?: boolean;
  showBackground?: boolean;
  className?: string;
}

export function DeadlineInfo({ 
  deadline, 
  showIcon = true, 
  showBackground = false,
  className = '' 
}: DeadlineInfoProps) {
  const deadlineStatus = getDeadlineStatus(deadline);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showIcon && (
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
          showBackground ? getDeadlineBackgroundColor(deadlineStatus.isOverdue, deadlineStatus.days) : ''
        }`}>
          <Calendar className={`h-4 w-4 ${getIconColor(deadlineStatus.isOverdue, deadlineStatus.days)}`} />
        </div>
      )}
      <div>
        <p className="text-sm text-white">{formatDate(deadline)}</p>
        <p className={`text-xs ${getDeadlineColor(deadlineStatus.isOverdue, deadlineStatus.days)}`}>
          {deadlineStatus.message}
        </p>
      </div>
    </div>
  );
}