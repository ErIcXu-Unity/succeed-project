// useSearchFilter.jsx - Generic search and filter hook

import { useState, useMemo } from 'react';

/**
 * Generic search and filter hook
 * @param {Array} data - Data array to filter
 * @param {Object} config - Configuration object
 * @param {Function} config.searchFields - Function returning the list of fields to search
 * @param {Object} config.filterConfig - Filter configuration
 * @param {Array} config.sortConfig - Sort configuration
 * @param {Object} config.defaultValues - Default values
 */
export const useSearchFilter = (data = [], config = {}) => {
  const {
    searchFields = () => [],
    filterConfig = {},
    sortConfig = [],
    defaultValues = {}
  } = config;

  // Search state
  const [searchTerm, setSearchTerm] = useState(defaultValues.searchTerm || '');
  
  // Dynamic filter state
  const [filters, setFilters] = useState(() => {
    const initialFilters = {};
    Object.keys(filterConfig).forEach(key => {
      initialFilters[key] = defaultValues[key] || '';
    });
    return initialFilters;
  });

  // Sort state
  const [sortBy, setSortBy] = useState(defaultValues.sortBy || (sortConfig[0]?.value || ''));
  const [sortOrder, setSortOrder] = useState(defaultValues.sortOrder || 'asc');

  // Update a single filter
  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    const clearedFilters = {};
    Object.keys(filterConfig).forEach(key => {
      clearedFilters[key] = '';
    });
    setFilters(clearedFilters);
    setSortBy(sortConfig[0]?.value || '');
    setSortOrder('asc');
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(item => {
        const fields = searchFields(item);
        return fields.some(field => 
          field && field.toString().toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply filters
    Object.keys(filterConfig).forEach(filterKey => {
      const filterValue = filters[filterKey];
      if (filterValue) {
        const filterFn = filterConfig[filterKey].filterFn;
        if (typeof filterFn === 'function') {
          result = result.filter(item => filterFn(item, filterValue));
        }
      }
    });

    // Apply sorting
    if (sortBy) {
      const sortConfig_item = sortConfig.find(config => config.value === sortBy);
      if (sortConfig_item && sortConfig_item.sortFn) {
        result.sort((a, b) => {
          const comparison = sortConfig_item.sortFn(a, b);
          return sortOrder === 'asc' ? comparison : -comparison;
        });
      }
    }

    return result;
  }, [data, searchTerm, filters, sortBy, sortOrder, searchFields, filterConfig, sortConfig]);

  // Generate filter options (for SearchFilter component)
  const filterOptions = useMemo(() => {
    return Object.keys(filterConfig).map(key => {
      const config = filterConfig[key];
      return {
        label: config.label,
        value: filters[key],
        onChange: (value) => updateFilter(key, value),
        options: config.options || [],
        allOption: config.allOption
      };
    });
  }, [filters, filterConfig]);

  return {
    // State
    searchTerm,
    filters,
    sortBy,
    sortOrder,
    
    // Update functions
    setSearchTerm,
    updateFilter,
    setSortBy,
    setSortOrder,
    clearFilters,
    
    // Computed results
    filteredData: filteredAndSortedData,
    filterOptions,
    sortOptions: sortConfig,
    
    // Statistics
    totalCount: data.length,
    filteredCount: filteredAndSortedData.length
  };
};


