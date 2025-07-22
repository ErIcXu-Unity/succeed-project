// useSearchFilter.js - 通用搜索筛选Hook

import { useState, useMemo } from 'react';

/**
 * 通用搜索筛选Hook
 * @param {Array} data - 要筛选的数据数组
 * @param {Object} config - 配置对象
 * @param {Function} config.searchFields - 返回要搜索的字段数组的函数
 * @param {Object} config.filterConfig - 筛选配置
 * @param {Array} config.sortConfig - 排序配置
 * @param {Object} config.defaultValues - 默认值
 */
export const useSearchFilter = (data = [], config = {}) => {
  const {
    searchFields = () => [],
    filterConfig = {},
    sortConfig = [],
    defaultValues = {}
  } = config;

  // 搜索状态
  const [searchTerm, setSearchTerm] = useState(defaultValues.searchTerm || '');
  
  // 动态筛选状态
  const [filters, setFilters] = useState(() => {
    const initialFilters = {};
    Object.keys(filterConfig).forEach(key => {
      initialFilters[key] = defaultValues[key] || '';
    });
    return initialFilters;
  });

  // 排序状态
  const [sortBy, setSortBy] = useState(defaultValues.sortBy || (sortConfig[0]?.value || ''));
  const [sortOrder, setSortOrder] = useState(defaultValues.sortOrder || 'asc');

  // 更新单个筛选器
  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 清除所有筛选器
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

  // 筛选和排序数据
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // 应用搜索
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(item => {
        const fields = searchFields(item);
        return fields.some(field => 
          field && field.toString().toLowerCase().includes(searchLower)
        );
      });
    }

    // 应用筛选器
    Object.keys(filterConfig).forEach(filterKey => {
      const filterValue = filters[filterKey];
      if (filterValue) {
        const filterFn = filterConfig[filterKey];
        result = result.filter(item => filterFn(item, filterValue));
      }
    });

    // 应用排序
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

  // 生成筛选器配置（用于SearchFilter组件）
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
    // 状态
    searchTerm,
    filters,
    sortBy,
    sortOrder,
    
    // 更新函数
    setSearchTerm,
    updateFilter,
    setSortBy,
    setSortOrder,
    clearFilters,
    
    // 计算结果
    filteredData: filteredAndSortedData,
    filterOptions,
    sortOptions: sortConfig,
    
    // 统计信息
    totalCount: data.length,
    filteredCount: filteredAndSortedData.length
  };
}; 