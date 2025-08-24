import { useState } from 'react';

interface PaginationOptions {
  initialCount?: number;
  increment?: number;
}

export function usePagination<T>(
  items: T[],
  options: PaginationOptions = {}
) {
  const { initialCount = 4, increment = 4 } = options;
  const [visibleCount, setVisibleCount] = useState(initialCount);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = items.length > visibleCount;
  const canShowLess = visibleCount > initialCount && items.length > initialCount;

  const showMore = () => {
    setVisibleCount(prev => prev + increment);
  };

  const showLess = () => {
    setVisibleCount(initialCount);
  };

  const reset = () => {
    setVisibleCount(initialCount);
  };

  return {
    visibleItems,
    visibleCount,
    hasMore,
    canShowLess,
    showMore,
    showLess,
    reset,
    totalCount: items.length,
  };
}