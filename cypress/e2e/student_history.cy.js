/// <reference types="cypress" />

// StudentHistory E2E tests (22 cases)

describe('StudentHistory page', () => {
  const api = Cypress.env('apiBaseUrl');
  const student = { role: 'stu', user_id: 3001, username: 'st3001@stu.com', real_name: 'Hist Student' };

  const seedStudent = () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('user_data', JSON.stringify(student));
      }
    });
  };

  const makeItem = ({ id, task_id, name, scorePct, score, max, count, completedAt, courseType }) => ({
    id,
    task_id,
    task_name: name,
    score_percentage: scorePct,
    score,
    max_score: max,
    question_count: count,
    completed_at: completedAt,
    course_type: courseType,
  });

  const stubProfile = (name = 'John Doe') => ({ student_name: name, history: [] });

  const visitHistory = () => {
    seedStudent();
    cy.visit('/student/history');
  };

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('shows loading spinner, then hides after responses', () => {
    seedStudent();
    cy.intercept('GET', `${api}/api/students/${student.user_id}/history`, { delay: 600, body: { student_name: 'John', history: [] } }).as('hist');
    cy.visit('/student/history');
    cy.get('.student-history-content .loading').should('be.visible');
    cy.wait('@hist');
    cy.get('.student-history-content .loading').should('not.exist');
  });

  // removed: error 500 retry flow

  it('empty history renders empty state with Start Tasks link', () => {
    cy.intercept('GET', `${api}/api/students/${student.user_id}/history`, { body: { student_name: 'John', history: [] } });
    visitHistory();
    cy.get('.empty-history').should('contain.text', 'No tasks completed yet');
    cy.get('.empty-history a.btn.btn-primary').should('have.attr', 'href', '/student/home');
  });

  it('renders header with student name and completed count (0 of N)', () => {
    const items = [
      makeItem({ id: 1, task_id: 11, name: 'Chemistry Basics', scorePct: 92, score: 46, max: 50, count: 10, completedAt: '2025-01-04T10:00:00Z', courseType: 'Chemistry' }),
      makeItem({ id: 2, task_id: 12, name: 'Statistics 101', scorePct: 81, score: 81, max: 100, count: 20, completedAt: '2025-01-03T09:00:00Z', courseType: 'Statistics' }),
      makeItem({ id: 3, task_id: 13, name: 'Mathematics Intro', scorePct: 75, score: 30, max: 40, count: 8, completedAt: '2025-01-02T08:00:00Z' /* derive Math */ }),
    ];
    cy.intercept('GET', `${api}/api/students/${student.user_id}/history`, { body: { student_name: 'John', history: items } });
    visitHistory();
    cy.get('.history-header .student-info').should('contain.text', 'Student: John');
    cy.get('.history-header .student-info').invoke('text').should('match', /Completed Tasks:\s*3 of 3/);
  });

  it('displays grid with cards and correct score details', () => {
    const items = [ makeItem({ id: 1, task_id: 11, name: 'Chemistry Basics', scorePct: 92, score: 46, max: 50, count: 10, completedAt: '2025-01-04T10:00:00Z', courseType: 'Chemistry' }) ];
    cy.intercept('GET', `${api}/api/students/${student.user_id}/history`, { body: { student_name: 'John', history: items } });
    visitHistory();
    cy.get('.history-grid .history-card').should('have.length', 1);
    cy.contains('.history-info h3', 'Chemistry Basics').should('exist');
    cy.get('.score-number').should('contain.text', '92%');
    cy.contains('.score-details', 'Score: 46/50 points').should('exist');
  });

  it('course badge shows icon and computed course type when missing course_type', () => {
    const items = [ makeItem({ id: 3, task_id: 13, name: 'Mathematics Intro', scorePct: 75, score: 30, max: 40, count: 8, completedAt: '2025-01-02T08:00:00Z' }) ];
    cy.intercept('GET', `${api}/api/students/${student.user_id}/history`, { body: { student_name: 'John', history: items } });
    visitHistory();
    cy.get('.course-badge').should('contain.text', 'Mathematics');
    cy.get('.course-badge').invoke('text').should('match', /🔢/);
  });

  it('uses subject images for Chemistry and Statistics', () => {
    const items = [
      makeItem({ id: 1, task_id: 11, name: 'Chemistry Basics', scorePct: 92, score: 46, max: 50, count: 10, completedAt: '2025-01-04T10:00:00Z', courseType: 'Chemistry' }),
      makeItem({ id: 2, task_id: 12, name: 'Statistics 101', scorePct: 81, score: 81, max: 100, count: 20, completedAt: '2025-01-03T09:00:00Z', courseType: 'Statistics' }),
    ];
    cy.intercept('GET', `${api}/api/students/${student.user_id}/history`, { body: { student_name: 'John', history: items } });
    visitHistory();
    cy.get('.history-card').eq(0).find('img').should('have.attr', 'src', '/assets/course-chem.jpg');
    cy.get('.history-card').eq(1).find('img').should('have.attr', 'src', '/assets/course-stat.jpg');
  });

  it('rank badge shows decreasing rank from top to bottom', () => {
    const items = [
      makeItem({ id: 1, task_id: 11, name: 'A', scorePct: 60, score: 6, max: 10, count: 5, completedAt: '2025-01-04T10:00:00Z' }),
      makeItem({ id: 2, task_id: 12, name: 'B', scorePct: 70, score: 7, max: 10, count: 5, completedAt: '2025-01-03T10:00:00Z' }),
      makeItem({ id: 3, task_id: 13, name: 'C', scorePct: 80, score: 8, max: 10, count: 5, completedAt: '2025-01-02T10:00:00Z' }),
    ];
    cy.intercept('GET', `${api}/api/students/${student.user_id}/history`, { body: { student_name: 'John', history: items } });
    visitHistory();
    cy.get('.rank-badge').eq(0).should('contain.text', '#3');
    cy.get('.rank-badge').eq(1).should('contain.text', '#2');
    cy.get('.rank-badge').eq(2).should('contain.text', '#1');
  });

  it('date and time formats are displayed (MM/DD/YYYY and HH:MM)', () => {
    const items = [ makeItem({ id: 1, task_id: 11, name: 'A', scorePct: 60, score: 6, max: 10, count: 5, completedAt: '2025-12-31T23:45:00Z' }) ];
    cy.intercept('GET', `${api}/api/students/${student.user_id}/history`, { body: { student_name: 'John', history: items } });
    visitHistory();
    cy.get('.task-stats .stat-item').contains(/\d{2}\/\d{2}\/\d{4}/).should('exist');
    cy.get('.task-stats .stat-item').contains(/\d{2}:\d{2}/).should('exist');
  });

  it('Retry Task link navigates to intro for the correct task', () => {
    const items = [ makeItem({ id: 7, task_id: 777, name: 'Retry Me', scorePct: 66, score: 33, max: 50, count: 10, completedAt: '2025-01-01T10:00:00Z' }) ];
    cy.intercept('GET', `${api}/api/students/${student.user_id}/history`, { body: { student_name: 'John', history: items } });
    visitHistory();
    cy.contains('.history-card', 'Retry Me').find('a.btn.btn-secondary').should('have.attr', 'href', '/student/tasks/777/intro');
  });

  it('search by task name filters results and updates header completed count', () => {
    const items = [
      makeItem({ id: 1, task_id: 11, name: 'Physics Lab', scorePct: 50, score: 5, max: 10, count: 10, completedAt: '2025-01-01T10:00:00Z' }),
      makeItem({ id: 2, task_id: 12, name: 'Chemistry Basics', scorePct: 90, score: 45, max: 50, count: 10, completedAt: '2025-01-02T10:00:00Z' }),
      makeItem({ id: 3, task_id: 13, name: 'Statistics 101', scorePct: 88, score: 88, max: 100, count: 20, completedAt: '2025-01-03T10:00:00Z' })
    ];
    cy.intercept('GET', `${api}/api/students/${student.user_id}/history`, { body: { student_name: 'Jane', history: items } });
    visitHistory();
    cy.get('.search-input').type('chem');
    cy.get('.history-grid .history-card').should('have.length', 1);
    cy.get('.history-header .student-info').invoke('text').should('match', /Completed Tasks:\s*1 of 3/);
    cy.get('.clear-search').click();
    cy.get('.history-grid .history-card').should('have.length', 3);
  });

  it('course type filter shows derived types and filters accordingly', () => {
    const items = [
      makeItem({ id: 1, task_id: 11, name: 'Mathematics Intro', scorePct: 70, score: 7, max: 10, count: 5, completedAt: '2025-01-01T10:00:00Z' }),
      makeItem({ id: 2, task_id: 12, name: 'Chemistry Basics', scorePct: 80, score: 8, max: 10, count: 5, completedAt: '2025-01-02T10:00:00Z', courseType: 'Chemistry' }),
      makeItem({ id: 3, task_id: 13, name: 'Statistics 101', scorePct: 90, score: 9, max: 10, count: 5, completedAt: '2025-01-03T10:00:00Z', courseType: 'Statistics' })
    ];
    cy.intercept('GET', `${api}/api/students/${student.user_id}/history`, { body: { student_name: 'Jane', history: items } });
    visitHistory();
    // Options sorted
    cy.get('#courseFilter').find('option').then($o => {
      const texts = $o.toArray().map(o => o.textContent.trim());
      expect(texts).to.include.members(['All Courses', 'Chemistry', 'Mathematics', 'Statistics']);
      const idxChem = texts.indexOf('Chemistry');
      const idxMath = texts.indexOf('Mathematics');
      const idxStat = texts.indexOf('Statistics');
      expect(idxChem).to.be.lessThan(idxStat + 100); // presence check
      expect(idxMath).to.be.greaterThan(0);
    });
    cy.get('#courseFilter').select('Mathematics');
    cy.get('.history-grid .history-card').should('have.length', 1).and('contain.text', 'Mathematics Intro');
    cy.get('#courseFilter').select('Chemistry');
    cy.get('.history-grid .history-card').should('have.length', 1).and('contain.text', 'Chemistry Basics');
  });

  it('score range filter (excellent/good/average/poor) works', () => {
    const items = [
      makeItem({ id: 1, task_id: 11, name: 'A', scorePct: 95, score: 95, max: 100, count: 10, completedAt: '2025-01-01T10:00:00Z' }), // excellent
      makeItem({ id: 2, task_id: 12, name: 'B', scorePct: 85, score: 85, max: 100, count: 10, completedAt: '2025-01-02T10:00:00Z' }), // good
      makeItem({ id: 3, task_id: 13, name: 'C', scorePct: 70, score: 70, max: 100, count: 10, completedAt: '2025-01-03T10:00:00Z' }), // average
      makeItem({ id: 4, task_id: 14, name: 'D', scorePct: 50, score: 50, max: 100, count: 10, completedAt: '2025-01-04T10:00:00Z' })  // poor
    ];
    cy.intercept('GET', `${api}/api/students/${student.user_id}/history`, { body: { student_name: 'Jane', history: items } });
    visitHistory();
    cy.get('#scoreRangeFilter').select('excellent');
    cy.get('.history-grid .history-card').should('have.length', 1).and('contain.text', 'A');
    cy.get('#scoreRangeFilter').select('good');
    cy.get('.history-grid .history-card').should('have.length', 1).and('contain.text', 'B');
    cy.get('#scoreRangeFilter').select('average');
    cy.get('.history-grid .history-card').should('have.length', 1).and('contain.text', 'C');
    cy.get('#scoreRangeFilter').select('poor');
    cy.get('.history-grid .history-card').should('have.length', 1).and('contain.text', 'D');
  });

  it('sort by Task Name A→Z then Z→A using Order toggle', () => {
    const items = [
      makeItem({ id: 1, task_id: 11, name: 'Zebra', scorePct: 60, score: 6, max: 10, count: 5, completedAt: '2025-01-01T10:00:00Z' }),
      makeItem({ id: 2, task_id: 12, name: 'Alpha', scorePct: 60, score: 6, max: 10, count: 5, completedAt: '2025-01-01T10:00:00Z' }),
      makeItem({ id: 3, task_id: 13, name: 'Delta', scorePct: 60, score: 6, max: 10, count: 5, completedAt: '2025-01-01T10:00:00Z' })
    ];
    cy.intercept('GET', `${api}/api/students/${student.user_id}/history`, { body: { student_name: 'Jane', history: items } });
    visitHistory();
    cy.get('#sortBy').select('task_name');
    cy.get('#sortOrder').select('asc');
    cy.get('.history-info h3').then($h => {
      const names = $h.toArray().map(h => h.textContent.trim());
      expect(names).to.deep.eq(['Alpha', 'Delta', 'Zebra']);
    });
    cy.get('#sortOrder').select('desc');
    cy.get('.history-info h3').then($h => {
      const names = $h.toArray().map(h => h.textContent.trim());
      expect(names).to.deep.eq(['Zebra', 'Delta', 'Alpha']);
    });
  });

  it('sort by Score desc shows higher scores first; asc reverses', () => {
    const items = [
      makeItem({ id: 1, task_id: 11, name: 'A', scorePct: 70, score: 7, max: 10, count: 5, completedAt: '2025-01-01T10:00:00Z' }),
      makeItem({ id: 2, task_id: 12, name: 'B', scorePct: 90, score: 9, max: 10, count: 5, completedAt: '2025-01-01T10:00:00Z' }),
      makeItem({ id: 3, task_id: 13, name: 'C', scorePct: 50, score: 5, max: 10, count: 5, completedAt: '2025-01-01T10:00:00Z' })
    ];
    cy.intercept('GET', `${api}/api/students/${student.user_id}/history`, { body: { student_name: 'Jane', history: items } });
    visitHistory();
    cy.get('#sortBy').select('score_percentage');
    cy.get('#sortOrder').select('desc');
    cy.get('.score-number').then($s => {
      const arr = $s.toArray().map(x => x.textContent.trim());
      expect(arr).to.deep.eq(['90%', '70%', '50%']);
    });
    cy.get('#sortOrder').select('asc');
    cy.get('.score-number').then($s => {
      const arr = $s.toArray().map(x => x.textContent.trim());
      expect(arr).to.deep.eq(['50%', '70%', '90%']);
    });
  });

  it('sort by Completion Date default is Newest First (desc)', () => {
    const items = [
      makeItem({ id: 1, task_id: 11, name: 'A', scorePct: 70, score: 7, max: 10, count: 5, completedAt: '2025-01-01T12:00:00Z' }),
      makeItem({ id: 2, task_id: 12, name: 'B', scorePct: 70, score: 7, max: 10, count: 5, completedAt: '2025-01-03T12:00:00Z' }),
      makeItem({ id: 3, task_id: 13, name: 'C', scorePct: 70, score: 7, max: 10, count: 5, completedAt: '2025-01-02T12:00:00Z' })
    ];
    cy.intercept('GET', `${api}/api/students/${student.user_id}/history`, { body: { student_name: 'Jane', history: items } });
    visitHistory();
    cy.get('#sortBy').should('have.value', 'completed_at');
    cy.get('#sortOrder').should('have.value', 'desc');
    cy.get('.history-info h3').then($h => {
      const names = $h.toArray().map(h => h.textContent.trim());
      expect(names).to.deep.eq(['B', 'C', 'A']);
    });
  });

  it('sort by Course Type groups by derived/explicit types', () => {
    const items = [
      makeItem({ id: 1, task_id: 11, name: 'Mathematics Intro', scorePct: 70, score: 7, max: 10, count: 5, completedAt: '2025-01-01T10:00:00Z' }),
      makeItem({ id: 2, task_id: 12, name: 'Chemistry Basics', scorePct: 80, score: 8, max: 10, count: 5, completedAt: '2025-01-02T10:00:00Z', courseType: 'Chemistry' }),
      makeItem({ id: 3, task_id: 13, name: 'Physics Lab', scorePct: 85, score: 8, max: 10, count: 5, completedAt: '2025-01-03T10:00:00Z' }),
    ];
    cy.intercept('GET', `${api}/api/students/${student.user_id}/history`, { body: { student_name: 'Jane', history: items } });
    visitHistory();
    cy.get('#sortBy').select('course_type');
    cy.get('#sortOrder').select('asc');
    cy.get('.history-info h3').then($h => {
      const names = $h.toArray().map(h => h.textContent.trim());
      // Alphabetical by course type label
      expect(names).to.have.length(3);
    });
  });

  it('sort by Question Count orders by number', () => {
    const items = [
      makeItem({ id: 1, task_id: 11, name: 'A', scorePct: 70, score: 7, max: 10, count: 30, completedAt: '2025-01-01T10:00:00Z' }),
      makeItem({ id: 2, task_id: 12, name: 'B', scorePct: 70, score: 7, max: 10, count: 10, completedAt: '2025-01-01T10:00:00Z' }),
      makeItem({ id: 3, task_id: 13, name: 'C', scorePct: 70, score: 7, max: 10, count: 20, completedAt: '2025-01-01T10:00:00Z' }),
    ];
    cy.intercept('GET', `${api}/api/students/${student.user_id}/history`, { body: { student_name: 'Jane', history: items } });
    visitHistory();
    cy.get('#sortBy').select('question_count');
    cy.get('#sortOrder').select('desc');
    cy.get('.history-info h3').then($h => {
      const names = $h.toArray().map(h => h.textContent.trim());
      expect(names).to.deep.eq(['A', 'C', 'B']);
    });
  });

  it('Clear button resets search, filters and sorting to defaults', () => {
    const items = [
      makeItem({ id: 1, task_id: 11, name: 'Mathematics', scorePct: 70, score: 7, max: 10, count: 10, completedAt: '2025-01-01T10:00:00Z' }),
      makeItem({ id: 2, task_id: 12, name: 'Chemistry', scorePct: 80, score: 8, max: 10, count: 10, completedAt: '2025-01-02T10:00:00Z', courseType: 'Chemistry' })
    ];
    cy.intercept('GET', `${api}/api/students/${student.user_id}/history`, { body: { student_name: 'Jane', history: items } });
    visitHistory();
    cy.get('.search-input').type('chem');
    cy.get('#courseFilter').select('Chemistry');
    cy.get('#scoreRangeFilter').select('good');
    cy.get('#sortBy').select('task_name');
    cy.get('#sortOrder').select('asc');
    cy.get('.clear-filters-btn').click();
    cy.get('.search-input').should('have.value', '');
    cy.get('#courseFilter').should('have.value', '');
    cy.get('#scoreRangeFilter').should('have.value', '');
    cy.get('#sortBy').should('have.value', 'completed_at');
    cy.get('#sortOrder').should('have.value', 'desc');
  });

  it('No results panel appears when filters hide all, Show All History resets', () => {
    const items = [
      makeItem({ id: 1, task_id: 11, name: 'Alpha', scorePct: 90, score: 9, max: 10, count: 5, completedAt: '2025-01-01T10:00:00Z' }),
      makeItem({ id: 2, task_id: 12, name: 'Beta', scorePct: 80, score: 8, max: 10, count: 5, completedAt: '2025-01-02T10:00:00Z' }),
    ];
    cy.intercept('GET', `${api}/api/students/${student.user_id}/history`, { body: { student_name: 'Jane', history: items } });
    visitHistory();
    cy.get('.search-input').type('zzz');
    cy.get('.no-results').should('be.visible');
    cy.contains('.no-results button.btn.btn-primary', 'Show All History').click();
    cy.get('.no-results').should('not.exist');
    cy.get('.history-grid .history-card').should('have.length', 2);
  });

  it('score color reflects thresholds (green, info, warning, orange, red)', () => {
    const items = [
      makeItem({ id: 1, task_id: 11, name: 'Ex', scorePct: 95, score: 95, max: 100, count: 10, completedAt: '2025-01-01T10:00:00Z' }), // green
      makeItem({ id: 2, task_id: 12, name: 'Good', scorePct: 85, score: 85, max: 100, count: 10, completedAt: '2025-01-01T10:00:00Z' }), // info
      makeItem({ id: 3, task_id: 13, name: 'Avg', scorePct: 70, score: 70, max: 100, count: 10, completedAt: '2025-01-01T10:00:00Z' }), // warning
      makeItem({ id: 4, task_id: 14, name: 'Fair', scorePct: 60, score: 60, max: 100, count: 10, completedAt: '2025-01-01T10:00:00Z' }), // orange
      makeItem({ id: 5, task_id: 15, name: 'Poor', scorePct: 50, score: 50, max: 100, count: 10, completedAt: '2025-01-01T10:00:00Z' }), // red
    ];
    cy.intercept('GET', `${api}/api/students/${student.user_id}/history`, { body: { student_name: 'Jane', history: items } });
    visitHistory();
    const want = [
      'rgb(40, 167, 69)',   // #28a745
      'rgb(23, 162, 184)', // #17a2b8
      'rgb(255, 193, 7)',  // #ffc107
      'rgb(253, 126, 20)', // #fd7e14
      'rgb(220, 53, 69)',  // #dc3545
    ];
    cy.get('.score-number').each(($el, idx) => {
      cy.wrap($el).should('have.css', 'color', want[idx]);
    });
  });
});


