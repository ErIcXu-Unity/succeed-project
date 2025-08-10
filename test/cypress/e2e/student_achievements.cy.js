/// <reference types="cypress" />

// StudentAchievements E2E tests (~15 cases)

describe('StudentAchievements page', () => {
  const api = Cypress.env('apiBaseUrl');

  const student = { role: 'stu', user_id: 2002, username: 'st2002@stu.com', real_name: 'Student Two' };

  const seedStudent = () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('user_data', JSON.stringify(student));
      }
    });
  };

  const stubProfile = (overrides = {}) => ({
    student_info: { real_name: 'Alice Zhang', student_id: 's1234567', ...overrides.student_info },
    statistics: { accuracy_rate: 88, average_score: 76, completed_tasks: 9, ...overrides.statistics },
  });

  const stubAchievements = (list = []) => ({ achievements: list });

  const unlocked = (id, name, condition, dateIso) => ({ id, name, condition, unlocked: true, unlocked_at: dateIso });
  const locked = (id, name, condition) => ({ id, name, condition, unlocked: false });

  const visitAchievements = () => {
    seedStudent();
    cy.visit(`/student/achievements`);
  };

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('shows loading spinner while fetching', () => {
    seedStudent();
    cy.intercept('GET', `${api}/api/students/${student.user_id}/profile`, {
      delay: 700,
      body: stubProfile(),
    }).as('profile');
    cy.intercept('GET', `${api}/api/students/${student.user_id}/achievements`, {
      delay: 700,
      body: stubAchievements([unlocked(1, 'Perfect Score', 'Score 100%', '2025-01-02T00:00:00Z')]),
    }).as('achv');
    cy.visit('/student/achievements');
    cy.get('.student-achievements-content .loading', { timeout: 5000 }).should('be.visible');
    cy.wait(['@profile', '@achv']);
    cy.get('.student-achievements-content .loading').should('not.exist');
  });

  // Replaced: not-logged-in error -> profile labels render
  it('profile info shows Name and ID labels with correct values', () => {
    const prof = stubProfile({ student_info: { real_name: 'Bob Lee', student_id: 'z7654321' } });
    cy.intercept('GET', `${api}/api/students/${student.user_id}/profile`, { body: prof });
    cy.intercept('GET', `${api}/api/students/${student.user_id}/achievements`, { body: stubAchievements([]) });
    visitAchievements();
    cy.get('.profile-card .profile-info').within(() => {
      cy.contains('strong', 'Name:').should('exist');
      cy.contains('strong', 'ID:').should('exist');
      cy.contains(/Bob Lee/).should('exist');
      cy.contains(/z7654321/).should('exist');
    });
  });

  it('renders profile info and statistics on success', () => {
    cy.intercept('GET', `${api}/api/students/${student.user_id}/profile`, { body: stubProfile() }).as('profile');
    cy.intercept('GET', `${api}/api/students/${student.user_id}/achievements`, { body: stubAchievements([]) }).as('achv');
    visitAchievements();
    cy.wait(['@profile', '@achv']);
    cy.get('.profile-card .profile-info').should('contain.text', 'Alice Zhang').and('contain.text', 's1234567');
    cy.get('.stats-card .stat-box').should('have.length', 3);
    cy.contains('.stat-box', 'Accuracy Rate').find('span').should('contain.text', '88%');
    cy.contains('.stat-box', 'Average Score').find('span').should('contain.text', '76%');
    cy.contains('.stat-box', 'Completed Tasks').find('span').should('contain.text', '9');
  });

  it('lists unlocked and locked badges with titles and classes', () => {
    const list = [
      unlocked(1, 'Perfect Score', 'Score 100% on any quiz', '2025-02-03T00:00:00Z'),
      locked(2, 'Accuracy Master', 'Reach 90% accuracy overall'),
    ];
    cy.intercept('GET', `${api}/api/students/${student.user_id}/profile`, { body: stubProfile() }).as('profile');
    cy.intercept('GET', `${api}/api/students/${student.user_id}/achievements`, { body: stubAchievements(list) }).as('achv');
    visitAchievements();
    cy.wait(['@profile', '@achv']);
    cy.get('.badge-container .badge').should('have.length', 2);
    cy.contains('.badge-title', 'Perfect Score').parents('.badge').should('have.class', 'unlocked').and('have.attr', 'title', 'Score 100% on any quiz');
    cy.contains('.badge-title', 'Accuracy Master').parents('.badge').should('have.class', 'locked').and('have.attr', 'title', 'Reach 90% accuracy overall');
  });

  it('unlocked badge shows a non-empty date string', () => {
    const list = [unlocked(1, 'Quiz Warrior', 'Complete 10 quizzes', '2025-03-01T12:00:00Z')];
    cy.intercept('GET', `${api}/api/students/${student.user_id}/profile`, { body: stubProfile() });
    cy.intercept('GET', `${api}/api/students/${student.user_id}/achievements`, { body: stubAchievements(list) });
    visitAchievements();
    cy.get('.badge-unlock-date').should('be.visible').invoke('text').should('match', /\d{1,2}\/|\d{4}|\d{1,2}-/);
  });

  it('achievement summary shows unlocked/total count', () => {
    const list = [
      unlocked(1, 'Perfect Score', 'Score 100%', '2025-01-01T00:00:00Z'),
      locked(2, 'Fast Solver', 'Finish in under 60s'),
      locked(3, 'Accuracy Master', 'Reach 90% accuracy overall'),
    ];
    cy.intercept('GET', `${api}/api/students/${student.user_id}/profile`, { body: stubProfile() });
    cy.intercept('GET', `${api}/api/students/${student.user_id}/achievements`, { body: stubAchievements(list) });
    visitAchievements();
    cy.contains('.achievement-summary p', 'Unlocked: 1 / 3').should('exist');
  });

  it('empty achievements shows dedicated empty state and summary 0/0', () => {
    cy.intercept('GET', `${api}/api/students/${student.user_id}/profile`, { body: stubProfile() });
    cy.intercept('GET', `${api}/api/students/${student.user_id}/achievements`, { body: stubAchievements([]) });
    visitAchievements();
    cy.get('.no-achievements').should('contain.text', 'No achievements available yet');
    cy.contains('.achievement-summary p', 'Unlocked: 0 / 0').should('exist');
  });

  it('profile 500 surfaces error and hides profile layout', () => {
    cy.intercept('GET', `${api}/api/students/${student.user_id}/profile`, { statusCode: 500, body: 'server error' }).as('profile');
    cy.intercept('GET', `${api}/api/students/${student.user_id}/achievements`, { body: stubAchievements([]) }).as('achv');
    visitAchievements();
    cy.wait('@profile');
    cy.get('.student-achievements-content .error').should('contain.text', 'Failed to load student data');
    cy.get('.profile-stats').should('not.exist');
  });

  it('achievements 500 surfaces error and hides lists', () => {
    cy.intercept('GET', `${api}/api/students/${student.user_id}/profile`, { body: stubProfile() }).as('profile');
    cy.intercept('GET', `${api}/api/students/${student.user_id}/achievements`, { statusCode: 500, body: 'server error' }).as('achv');
    visitAchievements();
    cy.wait('@achv');
    cy.get('.student-achievements-content .error').should('contain.text', 'Failed to load student data');
    cy.get('.badge-container .badge').should('not.exist');
  });

  it('profile image renders with avatar src', () => {
    cy.intercept('GET', `${api}/api/students/${student.user_id}/profile`, { body: stubProfile() });
    cy.intercept('GET', `${api}/api/students/${student.user_id}/achievements`, { body: stubAchievements([]) });
    visitAchievements();
    cy.get('.profile-card img').should('have.attr', 'src', '/assets/avatar.jpg');
  });

  // Replaced: tabIndex focusable -> badge icon mapping asserts
  it('badge icons match achievement names mapping', () => {
    const list = [
      unlocked(1, 'Perfect Score', 'Score 100%', '2025-01-01T00:00:00Z'),
      unlocked(2, 'Accuracy Master', 'Reach 90% accuracy', '2025-01-02T00:00:00Z'),
      unlocked(3, 'Fast Solver', 'Finish under 60s', '2025-01-03T00:00:00Z'),
      unlocked(4, 'Quiz Warrior', 'Complete many quizzes', '2025-01-04T00:00:00Z'),
    ];
    cy.intercept('GET', `${api}/api/students/${student.user_id}/profile`, { body: stubProfile() });
    cy.intercept('GET', `${api}/api/students/${student.user_id}/achievements`, { body: stubAchievements(list) });
    visitAchievements();
    const expectIcon = (title, emoji) => {
      cy.contains('.badge', title).within(() => {
        cy.get('.badge-icon').invoke('text').then(t => expect(t.trim()).to.eq(emoji));
      });
    };
    expectIcon('Perfect Score', '🏆');
    expectIcon('Accuracy Master', '🎯');
    expectIcon('Fast Solver', '⏱️');
    expectIcon('Quiz Warrior', '📚');
  });

  it('achievement titles render correctly inside each badge', () => {
    const list = [
      unlocked(1, 'Perfect Score', 'Score 100%', '2025-01-01T00:00:00Z'),
      locked(2, 'Fast Solver', 'Finish under 60s'),
    ];
    cy.intercept('GET', `${api}/api/students/${student.user_id}/profile`, { body: stubProfile() });
    cy.intercept('GET', `${api}/api/students/${student.user_id}/achievements`, { body: stubAchievements(list) });
    visitAchievements();
    cy.contains('.badge-title', 'Perfect Score').should('exist');
    cy.contains('.badge-title', 'Fast Solver').should('exist');
  });

  it('student nav highlights Achievements as active', () => {
    cy.intercept('GET', `${api}/api/students/${student.user_id}/profile`, { body: stubProfile() });
    cy.intercept('GET', `${api}/api/students/${student.user_id}/achievements`, { body: stubAchievements([]) });
    visitAchievements();
    cy.get('.student-nav a').contains('Achievements').should('have.class', 'active');
  });

  it('loading disappears and content shows after both requests finish', () => {
    seedStudent();
    cy.intercept('GET', `${api}/api/students/${student.user_id}/profile`, { delay: 400, body: stubProfile() }).as('profile');
    cy.intercept('GET', `${api}/api/students/${student.user_id}/achievements`, { delay: 600, body: stubAchievements([]) }).as('achv');
    cy.visit('/student/achievements');
    cy.get('.loading').should('be.visible');
    cy.wait(['@profile', '@achv']);
    cy.get('.loading').should('not.exist');
    cy.get('.profile-stats').should('be.visible');
  });

  it('error state hides achievement summary and lists', () => {
    cy.intercept('GET', `${api}/api/students/${student.user_id}/profile`, { statusCode: 500, body: 'server error' });
    cy.intercept('GET', `${api}/api/students/${student.user_id}/achievements`, { body: stubAchievements([]) });
    visitAchievements();
    cy.get('.achievement-summary').should('not.exist');
    cy.get('.badge-container .badge').should('not.exist');
  });
});


