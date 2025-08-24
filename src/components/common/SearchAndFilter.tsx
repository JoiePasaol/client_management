import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Button } from '../ui/Button';

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  onFilter?: () => void;
  showFilter?: boolean;
  className?: string;
}

export function SearchAndFilter({
  searchTerm,
  onSearchChange,
  placeholder = "Search...",
  onFilter,
  showFilter = true,
  className = ''
}: SearchAndFilterProps) {
  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 bg-gray-700 focus:outline-none border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      {showFilter && onFilter && (
        <Button variant="secondary" className="flex items-center space-x-2" onClick={onFilter}>
          <Filter className="h-4 w-4" />
          <span>Filter</span>
        </Button>
      )}
    </div>
  );
}