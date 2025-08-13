import React from 'react';
import { mount } from 'cypress/react18';
import SearchFilter from '../../../src/components/SearchFilter';

describe('SearchFilter (Component)', () => {
  const mockFilters = [
    {
      label: 'Category',
      value: 'all',
      onChange: cy.stub(),
      allOption: 'All Categories',
      options: [
        { label: 'Option 1', value: 'opt1' },
        { label: 'Option 2', value: 'opt2' }
      ]
    }
  ];

  const mockSortOptions = [
    { label: 'Name', value: 'name' },
    { label: 'Date', value: 'date' }
  ];

  const defaultProps = {
    searchTerm: '',
    onSearchChange: cy.stub(),
    filters: mockFilters,
    sortOptions: mockSortOptions,
    sortBy: 'name',
    sortOrder: 'asc',
    onSortByChange: cy.stub(),
    onSortOrderChange: cy.stub(),
    onClearFilters: cy.stub()
  };

  it('renders with default props', () => {
    mount(<SearchFilter {...defaultProps} />);
    cy.get('.search-filter-container').should('exist');
    cy.get('.search-input').should('have.attr', 'placeholder', 'Search...');
  });

  it('renders with custom placeholder', () => {
    mount(<SearchFilter {...defaultProps} placeholder="Search tasks..." />);
    cy.get('.search-input').should('have.attr', 'placeholder', 'Search tasks...');
  });

  it('displays search term in input field', () => {
    mount(<SearchFilter {...defaultProps} searchTerm="test query" />);
    cy.get('.search-input').should('have.value', 'test query');
  });

  it('shows clear search button when search term exists', () => {
    mount(<SearchFilter {...defaultProps} searchTerm="test" />);
    cy.get('.clear-search').should('be.visible');
  });

  it('hides clear search button when search term is empty', () => {
    mount(<SearchFilter {...defaultProps} searchTerm="" />);
    cy.get('.clear-search').should('not.exist');
  });

  it('calls onSearchChange when typing in search input', () => {
    const onSearchChange = cy.stub();
    mount(<SearchFilter {...defaultProps} onSearchChange={onSearchChange} />);
    
    cy.get('.search-input').type('new search');
    cy.then(() => {
      expect(onSearchChange).to.have.been.calledWith('new search');
    });
  });

  it('calls onSearchChange with empty string when clicking clear button', () => {
    const onSearchChange = cy.stub();
    mount(<SearchFilter {...defaultProps} searchTerm="test" onSearchChange={onSearchChange} />);
    
    cy.get('.clear-search').click();
    cy.then(() => {
      expect(onSearchChange).to.have.been.calledWith('');
    });
  });

  it('renders filter controls when showFilters is true', () => {
    mount(<SearchFilter {...defaultProps} showFilters={true} />);
    cy.get('.filter-controls').should('exist');
    cy.get('.filter-group').should('have.length.at.least', 1);
  });

  it('hides filter controls when showFilters is false', () => {
    mount(<SearchFilter {...defaultProps} showFilters={false} />);
    cy.get('.filter-controls').should('not.exist');
  });

  it('renders sort controls when showSort is true and sortOptions exist', () => {
    mount(<SearchFilter {...defaultProps} showSort={true} />);
    cy.get('#sortBy').should('exist');
    cy.get('#sortOrder').should('exist');
  });

  it('hides sort controls when showSort is false', () => {
    mount(<SearchFilter {...defaultProps} showSort={false} />);
    cy.get('#sortBy').should('not.exist');
    cy.get('#sortOrder').should('not.exist');
  });

  it('calls filter onChange when filter selection changes', () => {
    const filterOnChange = cy.stub();
    const filtersWithStub = [{
      ...mockFilters[0],
      onChange: filterOnChange
    }];
    
    mount(<SearchFilter {...defaultProps} filters={filtersWithStub} />);
    cy.get('select[id="filter-0"]').select('opt1');
    cy.then(() => {
      expect(filterOnChange).to.have.been.calledWith('opt1');
    });
  });

  it('calls onSortByChange when sort by selection changes', () => {
    const onSortByChange = cy.stub();
    mount(<SearchFilter {...defaultProps} onSortByChange={onSortByChange} />);
    
    cy.get('#sortBy').select('date');
    cy.then(() => {
      expect(onSortByChange).to.have.been.calledWith('date');
    });
  });

  it('calls onSortOrderChange when sort order selection changes', () => {
    const onSortOrderChange = cy.stub();
    mount(<SearchFilter {...defaultProps} onSortOrderChange={onSortOrderChange} />);
    
    cy.get('#sortOrder').select('desc');
    cy.then(() => {
      expect(onSortOrderChange).to.have.been.calledWith('desc');
    });
  });

  it('calls onClearFilters when clear filters button is clicked', () => {
    const onClearFilters = cy.stub();
    mount(<SearchFilter {...defaultProps} onClearFilters={onClearFilters} />);
    
    cy.get('.clear-filters-btn').click();
    cy.then(() => {
      expect(onClearFilters).to.have.been.called;
    });
  });

  it('renders multiple filters correctly', () => {
    const multipleFilters = [
      ...mockFilters,
      {
        label: 'Status',
        value: 'active',
        onChange: cy.stub(),
        allOption: 'All Statuses',
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' }
        ]
      }
    ];

    mount(<SearchFilter {...defaultProps} filters={multipleFilters} />);
    cy.get('.filter-group').should('have.length', 4); // 2 filters + sort by + sort order
    cy.get('select[id="filter-0"]').should('exist');
    cy.get('select[id="filter-1"]').should('exist');
  });

  it('renders without filters when filters array is empty', () => {
    mount(<SearchFilter {...defaultProps} filters={[]} />);
    cy.get('select[id^="filter-"]').should('not.exist');
  });

  it('renders without sort controls when sortOptions array is empty', () => {
    mount(<SearchFilter {...defaultProps} sortOptions={[]} />);
    cy.get('#sortBy').should('not.exist');
    cy.get('#sortOrder').should('not.exist');
  });

  it('has proper accessibility attributes', () => {
    mount(<SearchFilter {...defaultProps} />);
    cy.get('.search-input').should('have.attr', 'type', 'text');
    cy.get('.clear-search').should('have.attr', 'title', 'Clear search');
    cy.get('.clear-filters-btn').should('have.attr', 'title', 'Clear all filters');
    cy.get('label[for="filter-0"]').should('contain', 'Category');
    cy.get('label[for="sortBy"]').should('contain', 'Sort by');
    cy.get('label[for="sortOrder"]').should('contain', 'Order');
  });
});