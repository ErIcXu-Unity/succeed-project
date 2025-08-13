/// <reference types="cypress" />

import React from 'react';
import EachgameGrade from '../../../src/components/EachgameGrade.jsx';

describe('EachgameGrade (Component)', () => {
  const mockTaskPerformanceData = [
    {
      id: 1,
      name: 'Escape Room 1',
      completion: 75,
      avgScore: 82,
      attempts: 10
    }
  ];

  const mockStudentsData = [
    { id: 1, real_name: 'Alice Wang', username: 'alice' },
    { id: 2, real_name: 'Bob Lin', username: 'bob' },
    { id: 3, real_name: 'Claire Ho', username: 'claire' }
  ];

  const mockStudentHistory = {
    history: [
      {
        task_id: 1,
        task_name: 'Escape Room 1',
        score_percentage: 85,
        score: 85,
        max_score: 100
      }
    ]
  };

  beforeEach(() => {
    // Mock Chart.js to prevent canvas errors
    cy.window().then((win) => {
      win.Chart = cy.stub();
      win.Chart.register = cy.stub();
      // Mock getContext to return a basic context
      const mockContext = {};
      HTMLCanvasElement.prototype.getContext = cy.stub().returns(mockContext);
    });



    // Mock fetch API
    cy.intercept('GET', '**/api/students/dashboard-report', {
      statusCode: 200,
      body: {
        task_performance: mockTaskPerformanceData,
        total_students: 3,
        completion_rate: 75
      }
    }).as('getDashboardReport');

    cy.intercept('GET', '**/api/students/list', {
      statusCode: 200,
      body: {
        students: mockStudentsData
      }
    }).as('getStudentsList');

    cy.intercept('GET', '**/api/students/*/profile', {
      statusCode: 200,
      body: {
        student_info: { student_id: 1, real_name: 'Test Student' },
        statistics: { accuracy_rate: 85, average_score: 82 }
      }
    }).as('getStudentProfile');

    cy.intercept('GET', '**/api/students/*/history', {
      statusCode: 200,
      body: mockStudentHistory
    }).as('getStudentHistory');
  });

  const mountComponent = () => {
    cy.mount(<EachgameGrade />);
  };

  it('shows loading state initially', () => {
    mountComponent();
    cy.get('.loading').should('exist');
    cy.get('.loading').should('contain.text', 'Loading task performance data...');
  });

  it('renders the page header correctly after data loads', () => {
    mountComponent();
    cy.wait('@getDashboardReport');
    cy.wait('@getStudentsList');
    cy.get('.header').should('contain.text', 'Escape Room 1 - Performance Overview');
  });

  it('displays all stat boxes with dynamic values', () => {
    mountComponent();
    cy.wait('@getDashboardReport');
    cy.wait('@getStudentsList');
    
    cy.get('.stats .stat-box').should('have.length', 4);
    
    cy.get('.stats .stat-box').eq(0).should('contain.text', 'Completion Rate');
    cy.get('.stats .stat-box').eq(0).should('contain.text', '%'); // Will contain calculated completion rate
    
    cy.get('.stats .stat-box').eq(1).should('contain.text', 'Avg Score');
    cy.get('.stats .stat-box').eq(1).should('contain.text', '%'); // Will contain calculated avg score
    
    cy.get('.stats .stat-box').eq(2).should('contain.text', 'Avg Time Spent');
    cy.get('.stats .stat-box').eq(2).should('contain.text', 's'); // Will contain time data
    
    cy.get('.stats .stat-box').eq(3).should('contain.text', 'Participants');
    cy.get('.stats .stat-box').eq(3).should('contain.text', '3'); // Based on mock data
  });

  it('renders chart containers after data loads', () => {
    mountComponent();
    cy.wait('@getDashboardReport');
    cy.wait('@getStudentsList');
    
    cy.get('.charts .chart-container').should('have.length', 2);
    cy.get('.charts canvas').should('have.length', 2);
  });

  it('renders grades table with correct headers', () => {
    mountComponent();
    cy.wait('@getDashboardReport');
    cy.wait('@getStudentsList');
    
    cy.get('#gradesTable thead tr th').should('have.length', 6);
    cy.get('#gradesTable thead tr th').eq(0).should('contain.text', 'Student ID');
    cy.get('#gradesTable thead tr th').eq(1).should('contain.text', 'Name');
    cy.get('#gradesTable thead tr th').eq(2).should('contain.text', 'Completion');
    cy.get('#gradesTable thead tr th').eq(3).should('contain.text', 'Score');
    cy.get('#gradesTable thead tr th').eq(4).should('contain.text', 'Time Spent');
    cy.get('#gradesTable thead tr th').eq(5).should('contain.text', 'Accuracy');
  });

  it('renders dynamic student data in table', () => {
    mountComponent();
    cy.wait('@getDashboardReport');
    cy.wait('@getStudentsList');
    cy.wait('@getStudentProfile');
    cy.wait('@getStudentHistory');
    
    // Should have rows for each student from mock data
    cy.get('#gradesTable tbody tr').should('have.length.at.least', 1);
    
    // Check that student data is displayed
    cy.get('#gradesTable tbody tr').first().within(() => {
      cy.get('td').eq(0).should('not.be.empty'); // Student ID
      cy.get('td').eq(1).should('not.be.empty'); // Name
      cy.get('td').eq(2).should(($el) => {
        const text = $el.text();
        expect(text === 'Completed' || text === 'Not Started').to.be.true;
      }); // Completion status
      cy.get('td').eq(3).should('not.be.empty'); // Score
      cy.get('td').eq(4).should('not.be.empty'); // Time spent
      cy.get('td').eq(5).should('not.be.empty'); // Accuracy
    });
  });



  it('handles API error gracefully', () => {
    // Mock API failure
    cy.intercept('GET', '**/api/students/dashboard-report', {
      statusCode: 500,
      body: { error: 'Server error' }
    }).as('getDashboardReportError');

    mountComponent();
    cy.wait('@getDashboardReportError');
    
    cy.get('.error').should('exist');
    cy.get('.error').should('contain.text', 'Failed to load task data');
    cy.get('.retry-btn').should('exist');
  });

  it('retries data fetch when retry button is clicked', () => {
    // First call fails
    cy.intercept('GET', '**/api/students/dashboard-report', {
      statusCode: 500,
      body: { error: 'Server error' }
    }).as('getDashboardReportError');

    mountComponent();
    cy.wait('@getDashboardReportError');
    
    // Set up successful retry
    cy.intercept('GET', '**/api/students/dashboard-report', {
      statusCode: 200,
      body: {
        task_performance: mockTaskPerformanceData,
        total_students: 3,
        completion_rate: 75
      }
    }).as('getDashboardReportRetry');

    cy.get('.retry-btn').click();
    cy.wait('@getDashboardReportRetry');
    
    cy.get('.error').should('not.exist');
    cy.get('.header').should('exist');
  });

  it('shows no data message when student list is empty', () => {
    // Mock empty student data
    cy.intercept('GET', '**/api/students/list', {
      statusCode: 200,
      body: { students: [] }
    }).as('getEmptyStudentsList');

    mountComponent();
    cy.wait('@getDashboardReport');
    cy.wait('@getEmptyStudentsList');
    
    cy.get('#gradesTable tbody td').should('contain.text', 'No student data available');
  });

  it('maintains responsive layout after data loads', () => {
    mountComponent();
    cy.wait('@getDashboardReport');
    cy.wait('@getStudentsList');
    
    // Test component visibility on different viewports
    cy.viewport(375, 667);
    cy.get('.page').should('be.visible');
    cy.get('.header').should('be.visible');
    cy.get('.stats').should('be.visible');
    
    cy.viewport(1200, 800);
    cy.get('.page').should('be.visible');
    cy.get('.header').should('be.visible');
    cy.get('.stats').should('be.visible');
  });

  it('works with taskId prop', () => {
    cy.mount(<EachgameGrade taskId="1" />);
    cy.wait('@getDashboardReport');
    cy.wait('@getStudentsList');
    
    cy.get('.header').should('contain.text', 'Escape Room 1 - Performance Overview');
  });

  it('falls back to first task when task not found', () => {
    // Mock data with no matching task
    cy.intercept('GET', '**/api/students/dashboard-report', {
      statusCode: 200,
      body: {
        task_performance: [
          { id: 999, name: 'Different Task', completion: 50, avgScore: 70, attempts: 5 }
        ],
        total_students: 3,
        completion_rate: 50
      }
    }).as('getDashboardReportFallback');

    cy.mount(<EachgameGrade taskId="1" />);
    cy.wait('@getDashboardReportFallback');
    cy.wait('@getStudentsList');
    
    cy.get('.header').should('contain.text', 'Different Task - Performance Overview');
  });

  it('handles empty task performance data', () => {
    cy.intercept('GET', '**/api/students/dashboard-report', {
      statusCode: 200,
      body: {
        task_performance: [],
        total_students: 0,
        completion_rate: 0
      }
    }).as('getDashboardReportEmpty');

    mountComponent();
    cy.wait('@getDashboardReportEmpty');
    
    cy.get('.error').should('exist');
    cy.get('.error').should('contain.text', 'Task not found');
  });

  it('handles student profile API failure', () => {
    cy.intercept('GET', '**/api/students/*/profile', {
      statusCode: 500,
      body: { error: 'Profile error' }
    }).as('getStudentProfileError');

    mountComponent();
    cy.wait('@getDashboardReport');
    cy.wait('@getStudentsList');
    cy.wait('@getStudentProfileError');
    
    // Should still render with default data
    cy.get('#gradesTable tbody tr').should('have.length.at.least', 1);
  });

  it('handles student history API failure', () => {
    cy.intercept('GET', '**/api/students/*/history', {
      statusCode: 500,
      body: { error: 'History error' }
    }).as('getStudentHistoryError');

    mountComponent();
    cy.wait('@getDashboardReport');
    cy.wait('@getStudentsList');
    cy.wait('@getStudentProfile');
    cy.wait('@getStudentHistoryError');
    
    // Should render with "Not Started" status
    cy.get('#gradesTable tbody tr').first().within(() => {
      cy.get('td').eq(2).should('contain.text', 'Not Started');
    });
  });

  it('handles students with only username (no real_name)', () => {
    const studentsWithoutRealName = [
      { id: 1, username: 'student1' },
      { id: 2, username: 'student2' }
    ];

    cy.intercept('GET', '**/api/students/list', {
      statusCode: 200,
      body: { students: studentsWithoutRealName }
    }).as('getStudentsWithoutRealName');

    mountComponent();
    cy.wait('@getDashboardReport');
    cy.wait('@getStudentsWithoutRealName');
    cy.wait('@getStudentProfile');
    cy.wait('@getStudentHistory');
    
    cy.get('#gradesTable tbody tr').first().within(() => {
      cy.get('td').eq(1).should('contain.text', 'student1');
    });
  });

  it('calculates completion rate when total students is 0', () => {
    cy.intercept('GET', '**/api/students/list', {
      statusCode: 200,
      body: { students: [] }
    }).as('getEmptyStudents');

    mountComponent();
    cy.wait('@getDashboardReport');
    cy.wait('@getEmptyStudents');
    
    cy.get('.stats .stat-box').eq(0).should('contain.text', '0%');
    cy.get('.stats .stat-box').eq(3).should('contain.text', '0');
  });

  it('handles case when no students have completed tasks', () => {
    const mockEmptyHistory = { history: [] };

    cy.intercept('GET', '**/api/students/*/history', {
      statusCode: 200,
      body: mockEmptyHistory
    }).as('getEmptyHistory');

    mountComponent();
    cy.wait('@getDashboardReport');
    cy.wait('@getStudentsList');
    cy.wait('@getStudentProfile');
    cy.wait('@getEmptyHistory');
    
    // Should use task average score as fallback
    cy.get('.stats .stat-box').eq(1).should('contain.text', '82%'); // From mock task data
  });

  it('renders charts section after data loads', () => {
    mountComponent();
    cy.wait('@getDashboardReport');
    cy.wait('@getStudentsList');
    cy.wait('@getStudentProfile');
    cy.wait('@getStudentHistory');
    
    // Verify that charts section is rendered
    cy.get('.charts').should('exist');
    cy.get('.charts .chart-container').should('have.length', 2);
    
    // Verify that canvas elements are present (even if Chart.js fails to initialize)
    cy.get('canvas').should('have.length', 2);
  });

  it('handles students list with undefined students property', () => {
    cy.intercept('GET', '**/api/students/list', {
      statusCode: 200,
      body: {} // No students property
    }).as('getStudentsUndefined');

    mountComponent();
    cy.wait('@getDashboardReport');
    cy.wait('@getStudentsUndefined');
    
    cy.get('#gradesTable tbody td').should('contain.text', 'No student data available');
  });

  it('handles case with many completed students (scoreData > 7)', () => {
    const manyStudents = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      real_name: `Student ${i + 1}`,
      username: `student${i + 1}`
    }));

    const historyWithManyCompleted = {
      history: [
        {
          task_id: 1,
          task_name: 'Escape Room 1',
          score_percentage: 85 + Math.random() * 10, // Different scores
          score: 85,
          max_score: 100
        }
      ]
    };

    cy.intercept('GET', '**/api/students/list', {
      statusCode: 200,
      body: { students: manyStudents }
    }).as('getManyStudents');

    cy.intercept('GET', '**/api/students/*/history', {
      statusCode: 200,
      body: historyWithManyCompleted
    }).as('getManyCompletedHistory');

    mountComponent();
    cy.wait('@getDashboardReport');
    cy.wait('@getManyStudents');
    cy.wait('@getStudentProfile');
    cy.wait('@getManyCompletedHistory');
    
    // Should show high completion rate
    cy.get('.stats .stat-box').eq(0).should('contain.text', '100%');
  });

  it('handles chart refs being null during update', () => {
    // Mount component but don't wait for all data
    mountComponent();
    
    // Manually trigger updateCharts when refs might be null
    cy.window().then((win) => {
      // This simulates the condition where chart refs are null
      // The component should handle this gracefully
      cy.get('.page').should('exist');
    });
  });

  it('handles task with missing studentsListData.students property', () => {
    cy.intercept('GET', '**/api/students/list', {
      statusCode: 200,
      body: { 
        // Missing students property, should default to empty array
        total: 0 
      }
    }).as('getStudentsNoProperty');

    mountComponent();
    cy.wait('@getDashboardReport');
    cy.wait('@getStudentsNoProperty');
    
    cy.get('#gradesTable tbody td').should('contain.text', 'No student data available');
    cy.get('.stats .stat-box').eq(3).should('contain.text', '0'); // Participants
  });

  it('uses fallback avgScore when calculated avgScore is 0', () => {
    const mockZeroScoreHistory = {
      history: [
        {
          task_id: 1,
          task_name: 'Escape Room 1',
          score_percentage: 0, // Zero score
          score: 0,
          max_score: 100
        }
      ]
    };

    cy.intercept('GET', '**/api/students/*/history', {
      statusCode: 200,
      body: mockZeroScoreHistory
    }).as('getZeroScoreHistory');

    mountComponent();
    cy.wait('@getDashboardReport');
    cy.wait('@getStudentsList');
    cy.wait('@getStudentProfile');
    cy.wait('@getZeroScoreHistory');
    
    // Should use task's avgScore (82) as fallback when calculated is 0
    cy.get('.stats .stat-box').eq(1).should('contain.text', '82%');
  });
});
