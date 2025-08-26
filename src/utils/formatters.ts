/**
 * Utility functions for formatting data
 */

export const formatCurrency = (amount: number): string => {
  // Convert to absolute value for formatting
  const absAmount = Math.abs(amount);
  const isNegative = amount < 0;
  
  let formattedAmount = '';
  
  if (absAmount >= 1000000000) {
    // Billions
    formattedAmount = `₱${(absAmount / 1000000000).toFixed(1)}B`;
  } else if (absAmount >= 1000000) {
    // Millions
    formattedAmount = `₱${(absAmount / 1000000).toFixed(1)}M`;
  } else if (absAmount >= 1000) {
    // Thousands
    formattedAmount = `₱${(absAmount / 1000).toFixed(1)}k`;
  } else {
    // Less than 1000
    formattedAmount = `₱${absAmount.toFixed(0)}`;
  }
  
  // Add negative sign if needed
  return isNegative ? `-${formattedAmount}` : formattedAmount;
};

// Alternative function for full PHP currency format (when you need exact amounts)
export const formatCurrencyFull = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  
  return formatDate(dateString);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const parseBudget = (budgetString: string): number => {
  return parseFloat(budgetString.replace(/[^0-9.-]+/g, ''));
};