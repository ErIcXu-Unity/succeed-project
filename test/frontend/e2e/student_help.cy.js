/// <reference types="cypress" />

// Student Help - Quick Actions navigation tests (minimal set)

describe('StudentHelp Quick Actions', () => {
  const api = Cypress.env('apiBaseUrl');
  const student = { role: 'stu', user_id: 9000001, username: '9000001@stu.com', real_name: 'Stub Stu' };

  const seedStudentOnHelp = () => {
    cy.visit('/student/help', {
      onBeforeLoad(win) {
        win.localStorage.setItem('user_data', JSON.stringify(student));
      },
    });
    cy.contains('h1', 'Help & Support Center', { timeout: 10000 }).should('be.visible');
  };

  const stubTasksAndProgress = () => {
    cy.fixture('tasks.json').then((tasks) => {
      const sortedByName = [...tasks].sort((a, b) => a.name.localeCompare(b.name));
      cy.intercept('GET', `${api}/api/tasks*`, { statusCode: 200, body: sortedByName }).as('tasks');
    });
    cy.intercept('GET', `${api}/api/students/*/task-progress`, { statusCode: 200, body: {} }).as('progress');
  };

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('Start New Task → /student/home', () => {
    stubTasksAndProgress();
    seedStudentOnHelp();
    cy.contains('.quick-actions .action-card', 'Start New Task').click();
    cy.wait(['@tasks', '@progress']);
    cy.location('pathname').should('eq', '/student/home');
    cy.get('.student-dashboard-content').should('be.visible');
  });

  it('View Achievements → /student/achievements', () => {
    cy.intercept('GET', `${api}/api/students/${student.user_id}/profile`, {
      statusCode: 200,
      body: {
        student_info: { real_name: 'Alice', student_id: 's1234567' },
        statistics: { accuracy_rate: 80, average_score: 70, completed_tasks: 3 },
      },
    }).as('profile');
    cy.intercept('GET', `${api}/api/students/${student.user_id}/achievements`, {
      statusCode: 200,
      body: { achievements: [] },
    }).as('achv');

    seedStudentOnHelp();
    cy.contains('.quick-actions .action-card', 'View Achievements').click();
    cy.wait(['@profile', '@achv']);
    cy.location('pathname').should('eq', '/student/achievements');
    cy.get('.student-achievements-content').should('be.visible');
  });

  it('Accessibility Settings → /student/accessibility', () => {
    // Do not modify window.speechSynthesis to avoid read-only property errors
    seedStudentOnHelp();
    cy.contains('h1', 'Help & Support Center').should('be.visible');
    cy.contains('.quick-actions .action-card', 'Accessibility Settings').click();
    cy.location('pathname').should('eq', '/student/accessibility');
    cy.contains('h1', 'Accessibility Settings Center').should('be.visible');
  });

  it('Check History → /student/history', () => {
    cy.intercept('GET', `${api}/api/students/${student.user_id}/history`, {
      statusCode: 200,
      body: { student_name: 'Alice', history: [] },
    }).as('hist');

    seedStudentOnHelp();
    cy.contains('.quick-actions .action-card', 'Check History').click();
    cy.wait('@hist');
    cy.location('pathname').should('eq', '/student/history');
    cy.get('.student-history-content').should('be.visible');
  });
});
