import React from 'react';
import './SearchFilter.css';

const SearchFilter = ({
  searchTerm,
  onSearchChange,
  filters = [],
  sortOptions = [],
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
  onClearFilters,
  placeholder = "Search...",
  showFilters = true,
  showSort = true
}) => {
  return (
    <div className="search-filter-container">
      {/* Search Bar */}
      <div className="search-bar">
        <div className="search-input-group">
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => onSearchChange('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      {(showFilters || showSort) && (
        <div className="filter-controls">
          {/* Dynamic Filters */}
          {showFilters && filters.map((filter, index) => (
            <div key={index} className="filter-group">
              <label htmlFor={`filter-${index}`}>{filter.label}:</label>
              <select
                id={`filter-${index}`}
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="filter-select"
              >
                <option value="">{filter.allOption || `All ${filter.label}`}</option>
                {filter.options.map((option, optionIndex) => (
                  <option key={optionIndex} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Sort Controls */}
          {showSort && sortOptions.length > 0 && (
            <>
              <div className="filter-group">
                <label htmlFor="sortBy">Sort by:</label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => onSortByChange(e.target.value)}
                  className="filter-select"
                >
                  {sortOptions.map((option, index) => (
                    <option key={index} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="sortOrder">Order:</label>
                <select
                  id="sortOrder"
                  value={sortOrder}
                  onChange={(e) => onSortOrderChange(e.target.value)}
                  className="filter-select"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </>
          )}

          {/* Clear Filters Button */}
          <button 
            className="clear-filters-btn"
            onClick={onClearFilters}
            title="Clear all filters"
          >
            <i className="fas fa-eraser"></i>
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchFilter; 