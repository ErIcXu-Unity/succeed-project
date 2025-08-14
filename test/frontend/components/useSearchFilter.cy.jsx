import React, { useState } from 'react';
import { mount } from 'cypress/react18';
import { useSearchFilter } from '../../../src/components/useSearchFilter';

// Test component that uses the useSearchFilter hook
const TestComponent = ({ data, config }) => {
  const {
    searchTerm,
    filters,
    sortBy,
    sortOrder,
    setSearchTerm,
    updateFilter,
    setSortBy,
    setSortOrder,
    clearFilters,
    filteredData,
    filterOptions,
    sortOptions,
    totalCount,
    filteredCount
  } = useSearchFilter(data, config);

  return (
    <div data-testid="search-filter-test">
      <div data-testid="search-input">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
        />
      </div>

      <div data-testid="filter-controls">
        {filterOptions.map((filter, index) => (
          <select
            key={index}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            data-testid={`filter-${index}`}
          >
            <option value="">{filter.allOption || `All ${filter.label}`}</option>
            {filter.options.map((option, optIndex) => (
              <option key={optIndex} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ))}
      </div>

      <div data-testid="sort-controls">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          data-testid="sort-by"
        >
          {sortOptions.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          data-testid="sort-order"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      <button onClick={clearFilters} data-testid="clear-filters">
        Clear Filters
      </button>

      <div data-testid="results">
        <div data-testid="total-count">Total: {totalCount}</div>
        <div data-testid="filtered-count">Filtered: {filteredCount}</div>
        <div data-testid="filtered-items">
          {filteredData.map((item, index) => (
            <div key={index} data-testid={`item-${index}`}>
              {JSON.stringify(item)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

describe('useSearchFilter Hook', () => {
  const sampleData = [
    { id: 1, name: 'Apple', category: 'fruit', price: 1.20, rating: 4.5 },
    { id: 2, name: 'Banana', category: 'fruit', price: 0.80, rating: 4.0 },
    { id: 3, name: 'Carrot', category: 'vegetable', price: 0.50, rating: 3.8 },
    { id: 4, name: 'Broccoli', category: 'vegetable', price: 2.00, rating: 3.5 },
    { id: 5, name: 'Orange', category: 'fruit', price: 1.50, rating: 4.2 }
  ];

  const basicConfig = {
    searchFields: (item) => [item.name],
    filterConfig: {
      category: {
        label: 'Category',
        options: [
          { value: 'fruit', label: 'Fruit' },
          { value: 'vegetable', label: 'Vegetable' }
        ],
        filterFn: (item, value) => item.category === value,
        allOption: 'All Categories'
      }
    },
    sortConfig: [
      {
        value: 'name',
        label: 'Name',
        sortFn: (a, b) => a.name.localeCompare(b.name)
      },
      {
        value: 'price',
        label: 'Price',
        sortFn: (a, b) => a.price - b.price
      }
    ],
    defaultValues: {
      sortBy: 'name',
      sortOrder: 'asc'
    }
  };

  describe('Basic Functionality', () => {
    it('renders with initial state', () => {
      mount(<TestComponent data={sampleData} config={basicConfig} />);
      
      cy.get('[data-testid="search-filter-test"]').should('exist');
      cy.get('[data-testid="total-count"]').should('contain', 'Total: 5');
      cy.get('[data-testid="filtered-count"]').should('contain', 'Filtered: 5');
      cy.get('[data-testid="filtered-items"] [data-testid^="item-"]').should('have.length', 5);
    });

    it('displays all items initially', () => {
      mount(<TestComponent data={sampleData} config={basicConfig} />);
      
      cy.get('[data-testid="item-0"]').should('contain', 'Apple');
      cy.get('[data-testid="item-1"]').should('contain', 'Banana');
      cy.get('[data-testid="item-2"]').should('contain', 'Broccoli');
      cy.get('[data-testid="item-3"]').should('contain', 'Carrot');
      cy.get('[data-testid="item-4"]').should('contain', 'Orange');
    });
  });

  describe('Search Functionality', () => {
    it('filters items based on search term', () => {
      mount(<TestComponent data={sampleData} config={basicConfig} />);
      
      cy.get('[data-testid="search-input"] input').type('app');
      
      cy.get('[data-testid="filtered-count"]').should('contain', 'Filtered: 1');
      cy.get('[data-testid="filtered-items"] [data-testid^="item-"]').should('have.length', 1);
      cy.get('[data-testid="item-0"]').should('contain', 'Apple');
    });

    it('performs case-insensitive search', () => {
      mount(<TestComponent data={sampleData} config={basicConfig} />);
      
      cy.get('[data-testid="search-input"] input').type('ORANGE');
      
      cy.get('[data-testid="filtered-count"]').should('contain', 'Filtered: 1');
      cy.get('[data-testid="item-0"]').should('contain', 'Orange');
    });

    it('shows no results for non-matching search', () => {
      mount(<TestComponent data={sampleData} config={basicConfig} />);
      
      cy.get('[data-testid="search-input"] input').type('xyz');
      
      cy.get('[data-testid="filtered-count"]').should('contain', 'Filtered: 0');
      cy.get('[data-testid="filtered-items"] [data-testid^="item-"]').should('have.length', 0);
    });

    it('clears search when input is cleared', () => {
      mount(<TestComponent data={sampleData} config={basicConfig} />);
      
      cy.get('[data-testid="search-input"] input').type('apple');
      cy.get('[data-testid="filtered-count"]').should('contain', 'Filtered: 1');
      
      cy.get('[data-testid="search-input"] input').clear();
      cy.get('[data-testid="filtered-count"]').should('contain', 'Filtered: 5');
    });
  });

  describe('Filter Functionality', () => {
    it('renders filter options', () => {
      mount(<TestComponent data={sampleData} config={basicConfig} />);
      
      cy.get('[data-testid="filter-0"]').should('exist');
      cy.get('[data-testid="filter-0"] option').should('have.length', 3);
      cy.get('[data-testid="filter-0"] option').first().should('contain', 'All Categories');
    });

    it('filters by category', () => {
      mount(<TestComponent data={sampleData} config={basicConfig} />);
      
      cy.get('[data-testid="filter-0"]').select('fruit');
      
      cy.get('[data-testid="filtered-count"]').should('contain', 'Filtered: 3');
      cy.get('[data-testid="filtered-items"] [data-testid^="item-"]').should('have.length', 3);
    });

    it('combines search and filter', () => {
      mount(<TestComponent data={sampleData} config={basicConfig} />);
      
      cy.get('[data-testid="search-input"] input').type('a');
      cy.get('[data-testid="filter-0"]').select('fruit');
      
      cy.get('[data-testid="filtered-count"]').should('contain', 'Filtered: 3'); // Apple, Banana, Orange
      cy.get('[data-testid="item-0"]').should('contain', 'Apple');
      cy.get('[data-testid="item-1"]').should('contain', 'Banana');
    });
  });

  describe('Sort Functionality', () => {
    it('renders sort options', () => {
      mount(<TestComponent data={sampleData} config={basicConfig} />);
      
      cy.get('[data-testid="sort-by"]').should('exist');
      cy.get('[data-testid="sort-by"] option').should('have.length', 2);
      cy.get('[data-testid="sort-order"]').should('exist');
    });

    it('sorts by name ascending by default', () => {
      mount(<TestComponent data={sampleData} config={basicConfig} />);
      
      // Should be sorted alphabetically: Apple, Banana, Broccoli, Carrot, Orange
      cy.get('[data-testid="item-0"]').should('contain', 'Apple');
      cy.get('[data-testid="item-1"]').should('contain', 'Banana');
      cy.get('[data-testid="item-2"]').should('contain', 'Broccoli');
    });

    it('sorts by price', () => {
      mount(<TestComponent data={sampleData} config={basicConfig} />);
      
      cy.get('[data-testid="sort-by"]').select('price');
      
      // Should be sorted by price: Carrot (0.50), Banana (0.80), Apple (1.20), Orange (1.50), Broccoli (2.00)
      cy.get('[data-testid="item-0"]').should('contain', 'Carrot');
      cy.get('[data-testid="item-1"]').should('contain', 'Banana');
      cy.get('[data-testid="item-4"]').should('contain', 'Broccoli');
    });

    it('reverses sort order', () => {
      mount(<TestComponent data={sampleData} config={basicConfig} />);
      
      cy.get('[data-testid="sort-order"]').select('desc');
      
      // Should be sorted by name descending: Orange, Carrot, Broccoli, Banana, Apple
      cy.get('[data-testid="item-0"]').should('contain', 'Orange');
      cy.get('[data-testid="item-1"]').should('contain', 'Carrot');
      cy.get('[data-testid="item-4"]').should('contain', 'Apple');
    });
  });

  describe('Clear Filters', () => {
    it('clears all filters and search', () => {
      mount(<TestComponent data={sampleData} config={basicConfig} />);
      
      // Apply some filters
      cy.get('[data-testid="search-input"] input').type('apple');
      cy.get('[data-testid="filter-0"]').select('fruit');
      cy.get('[data-testid="sort-by"]').select('price');
      cy.get('[data-testid="sort-order"]').select('desc');
      
      // Clear filters
      cy.get('[data-testid="clear-filters"]').click();
      
      // Check everything is reset
      cy.get('[data-testid="search-input"] input').should('have.value', '');
      cy.get('[data-testid="filter-0"]').should('have.value', '');
      cy.get('[data-testid="sort-by"]').should('have.value', 'name');
      cy.get('[data-testid="sort-order"]').should('have.value', 'asc');
      cy.get('[data-testid="filtered-count"]').should('contain', 'Filtered: 5');
    });
  });

  describe('Multiple Search Fields', () => {
    const multiFieldConfig = {
      ...basicConfig,
      searchFields: (item) => [item.name, item.category]
    };

    it('searches across multiple fields', () => {
      mount(<TestComponent data={sampleData} config={multiFieldConfig} />);
      
      cy.get('[data-testid="search-input"] input').type('vegetable');
      
      cy.get('[data-testid="filtered-count"]').should('contain', 'Filtered: 2');
      cy.get('[data-testid="item-0"]').should('contain', 'Broccoli');
      cy.get('[data-testid="item-1"]').should('contain', 'Carrot');
    });
  });

  describe('Empty Data', () => {
    it('handles empty data array', () => {
      mount(<TestComponent data={[]} config={basicConfig} />);
      
      cy.get('[data-testid="total-count"]').should('contain', 'Total: 0');
      cy.get('[data-testid="filtered-count"]').should('contain', 'Filtered: 0');
      cy.get('[data-testid="filtered-items"] [data-testid^="item-"]').should('have.length', 0);
    });
  });

  describe('Default Values', () => {
    const configWithDefaults = {
      ...basicConfig,
      defaultValues: {
        searchTerm: 'apple',
        category: 'fruit',
        sortBy: 'price',
        sortOrder: 'desc'
      }
    };

    it('applies default values on initialization', () => {
      mount(<TestComponent data={sampleData} config={configWithDefaults} />);
      
      cy.get('[data-testid="search-input"] input').should('have.value', 'apple');
      cy.get('[data-testid="filter-0"]').should('have.value', 'fruit');
      cy.get('[data-testid="sort-by"]').should('have.value', 'price');
      cy.get('[data-testid="sort-order"]').should('have.value', 'desc');
      cy.get('[data-testid="filtered-count"]').should('contain', 'Filtered: 1');
    });
  });

  describe('Statistics', () => {
    it('provides correct count statistics', () => {
      mount(<TestComponent data={sampleData} config={basicConfig} />);
      
      cy.get('[data-testid="total-count"]').should('contain', 'Total: 5');
      cy.get('[data-testid="filtered-count"]').should('contain', 'Filtered: 5');
      
      cy.get('[data-testid="search-input"] input').type('a');
      cy.get('[data-testid="filtered-count"]').should('contain', 'Filtered: 4');
      
      cy.get('[data-testid="filter-0"]').select('fruit');
      cy.get('[data-testid="filtered-count"]').should('contain', 'Filtered: 3');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined data gracefully', () => {
      mount(<TestComponent data={undefined} config={basicConfig} />);
      
      cy.get('[data-testid="total-count"]').should('contain', 'Total: 0');
      cy.get('[data-testid="filtered-count"]').should('contain', 'Filtered: 0');
    });

    it('handles empty config object', () => {
      mount(<TestComponent data={sampleData} config={{}} />);
      
      cy.get('[data-testid="total-count"]').should('contain', 'Total: 5');
      cy.get('[data-testid="filtered-count"]').should('contain', 'Filtered: 5');
    });

    it('handles items with null/undefined fields', () => {
      const dataWithNulls = [
        { id: 1, name: null, category: 'fruit' },
        { id: 2, name: 'Apple', category: undefined },
        { id: 3, name: 'Banana', category: 'fruit' }
      ];

      mount(<TestComponent data={dataWithNulls} config={basicConfig} />);
      
      cy.get('[data-testid="search-input"] input').type('apple');
      cy.get('[data-testid="filtered-count"]').should('contain', 'Filtered: 1');
    });
  });
});