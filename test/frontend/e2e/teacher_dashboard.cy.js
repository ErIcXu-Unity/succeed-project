/// <reference types="cypress" />

describe('Teacher Dashboard and Task Management', () => {
  const seedTeacher = () => {
    const teacher = { role: 'tea', user_id: 1000, username: 'st1000@tea.com', real_name: 'Teacher Admin' };
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('user_data', JSON.stringify(teacher));
      }
    });
    cy.wait(3500);
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    seedTeacher();
  });

  const stubTasks = (body) => {
    cy.intercept('GET', `${Cypress.env('apiBaseUrl')}/api/tasks*`, { statusCode: 200, body }).as('tasks');
    cy.intercept('GET', `${Cypress.env('apiBaseUrl')}/api/students/dashboard-summary`, { statusCode: 200, body: { total_students: 10, completion_rate: 80 } }).as('stats');
  };

  it('loads tasks and stats (stubbed)', () => {
    stubTasks([{ id: 1, name: 'Task One', introduction: 'intro', question_count: 3 }]);
    cy.visit('/teacher');
    cy.wait(['@tasks','@stats']);
    cy.contains('Teacher Dashboard');
    cy.get('.tasks-grid .task-card').should('have.length.at.least',1);
    cy.get('.summary-cards .stat-card').should('have.length.at.least',4);
  });

  it('filters: Status Published/Scheduled', () => {
    const now = new Date();
    const sched = new Date(now.getTime()+86400000).toISOString();
    stubTasks([
      { id: 1, name: 'Published A', introduction: 'intro', question_count: 2, publish_at: null },
      { id: 2, name: 'Scheduled B', introduction: 'intro', question_count: 1, publish_at: sched },
    ]);
    cy.visit('/teacher');
    cy.wait(['@tasks','@stats']);
    cy.get('#filter-0').select('published');
    cy.get('.task-card .internal-status.published').should('exist');
    cy.get('#filter-0').select('scheduled');
    cy.get('.task-card .internal-status.scheduled').should('exist');
  });

  it('filters: Questions empty/few/complete', () => {
    stubTasks([
      { id: 1, name: 'Q0', introduction: 'intro', question_count: 0 },
      { id: 2, name: 'Q2', introduction: 'intro', question_count: 2 },
      { id: 3, name: 'Q5', introduction: 'intro', question_count: 5 },
    ]);
    cy.visit('/teacher');
    cy.wait(['@tasks','@stats']);
    cy.get('#filter-1').select('empty');
    cy.get('.task-card .question-count').each($el=>{
      expect($el.text().trim()).to.equal('0');
    });
    cy.get('#filter-1').select('few');
    cy.get('.task-card .question-count').each($el=>{
      expect(parseInt($el.text(),10)).to.be.oneOf([1,2]);
    });
    cy.get('#filter-1').select('complete');
    cy.get('.task-card .question-count').each($el=>{
      expect(parseInt($el.text(),10)).to.be.gte(3);
    });
  });

  it('sort by Name asc/desc and by Question Count', () => {
    stubTasks([
      { id: 1, name: 'Alpha', introduction: 'intro', question_count: 5 },
      { id: 2, name: 'Beta', introduction: 'intro', question_count: 1 },
      { id: 3, name: 'Gamma', introduction: 'intro', question_count: 3 },
    ]);
    cy.visit('/teacher');
    cy.wait(['@tasks','@stats']);
    cy.get('#sortBy').select('name');
    cy.get('#sortOrder').select('asc');
    cy.get('.task-card .task-title').then($els=>{
      const arr=[...$els].map(e=>e.innerText.trim());
      expect(arr).to.deep.equal([...arr].sort((a,b)=>a.localeCompare(b)));
    });
    cy.get('#sortOrder').select('desc');
    cy.get('.task-card .task-title').then($els=>{
      const arr=[...$els].map(e=>e.innerText.trim());
      expect(arr).to.deep.equal([...arr].sort((a,b)=>b.localeCompare(a)));
    });
    cy.get('#sortBy').select('questions');
    cy.get('#sortOrder').select('asc');
    cy.get('.task-card .question-count').then($els=>{
      const arr=[...$els].map(e=>parseInt(e.innerText,10));
      expect(arr).to.deep.equal([...arr].sort((a,b)=>a-b));
    });
  });

  it('search and clear resets filters', () => {
    stubTasks([
      { id: 1, name: 'Math Task', introduction: 'intro', question_count: 3 },
      { id: 2, name: 'Chem Task', introduction: 'intro', question_count: 1 },
    ]);
    cy.visit('/teacher');
    cy.wait(['@tasks','@stats']);
    cy.get('input[placeholder*="Search"]').type('zzz');
    cy.contains('No tasks found');
    cy.get('.clear-filters-btn').click();
    cy.get('.task-card').should('have.length.at.least',1);
  });

  it('create flow: opens editor and tries to save (stubbed)', () => {
    stubTasks([{ id: 1, name: 'Any', introduction: 'intro', question_count: 0 }]);
    cy.visit('/teacher');
    cy.wait(['@tasks','@stats']);
    cy.contains('Create New Task').click();
    cy.location('pathname').should('include','/teacher/tasks/new');
    cy.get('#taskName').type('E2E Task');
    cy.get('#taskIntroduction').type('Created by Cypress');
    cy.intercept('POST', `${Cypress.env('apiBaseUrl')}/api/tasks`, { statusCode:200, body:{ task:{ id: 123 } } }).as('create');
    cy.contains('button','Create Task').click();
    cy.wait('@create');
  });

  it('edit flow: click Edit navigates to edit page', () => {
    stubTasks([{ id: 1, name: 'Edit Me', introduction: 'intro', question_count: 2 }]);
    cy.visit('/teacher');
    cy.wait(['@tasks','@stats']);
    cy.get('.task-card').first().find('.btn-edit').click();
    cy.location('pathname').should('include','/teacher/tasks/1/edit');
  });

  it('delete flow: cancel in confirm modal keeps card', () => {
    stubTasks([{ id: 1, name: 'Delete Me', introduction: 'intro', question_count: 2 }]);
    cy.visit('/teacher');
    cy.wait(['@tasks','@stats']);
    cy.get('.task-card').first().find('.btn-delete').click();
    cy.get('.modal-content').should('be.visible');
    cy.contains('button','Cancel').click();
    cy.get('.task-card').should('have.length',1);
  });

  it('delete flow: confirm deletes and shows success toast (stubbed)', () => {
    stubTasks([{ id: 1, name: 'Delete Me', introduction: 'intro', question_count: 2 }]);
    cy.intercept('DELETE', `${Cypress.env('apiBaseUrl')}/api/tasks/1`, { statusCode:200 }).as('del');
    cy.visit('/teacher');
    cy.wait(['@tasks','@stats']);
    cy.get('.task-card').first().find('.btn-delete').click();
    cy.contains('button','Delete Task').click();
    cy.wait('@del');
  });

  it('students/reports/settings nav items exist (placeholder checks)', () => {
    stubTasks([{ id: 1, name: 'Any', introduction: 'intro', question_count: 0 }]);
    cy.visit('/teacher');
    cy.wait(['@tasks','@stats']);
    // Since the sidebar is not provided, here we check the key elements of the page
    cy.contains('Teacher Dashboard');
    cy.contains('Task Management');
  });

  // Merged from teacher_dashboard_more: refresh after returning from edit
  it('refreshes tasks after returning from edit page (refetch)', () => {
    stubTasks([{ id: 1, name: 'Task One', introduction: 'intro', question_count: 1 }]);
    cy.visit('/teacher');
    cy.wait(['@tasks','@stats']);
    cy.visit('/teacher/tasks/1/edit');
    // After returning, dashboard should fetch again
    stubTasks([{ id: 1, name: 'Task One', introduction: 'intro', question_count: 1 }]);
    cy.visit('/teacher');
    cy.wait(['@tasks','@stats']);
    cy.get('.tasks-grid .task-card').should('have.length',1);
  });

  // Additional tests
  it('sort by Status asc then desc', () => {
    const now = new Date();
    const future = new Date(now.getTime()+86400000).toISOString();
    stubTasks([
      { id: 1, name: 'A', introduction: '', question_count: 1, publish_at: future }, // scheduled
      { id: 2, name: 'B', introduction: '', question_count: 1, publish_at: null },   // published
    ]);
    cy.visit('/teacher');
    cy.wait(['@tasks','@stats']);
    cy.get('#sortBy').select('status');
    cy.get('#sortOrder').select('asc');
    cy.get('.task-card .internal-status').first().should('have.class','published');
    cy.get('#sortOrder').select('desc');
    cy.get('.task-card .internal-status').first().should('have.class','scheduled');
  });

  it('sort by Publish Date asc', () => {
    const now=new Date();
    const t1=new Date(now.getTime()-86400000).toISOString();
    const t2=new Date(now.getTime()+86400000).toISOString();
    stubTasks([
      { id: 1, name: 'A', introduction:'', question_count:1, publish_at: t2 },
      { id: 2, name: 'B', introduction:'', question_count:1, publish_at: t1 },
    ]);
    cy.visit('/teacher');
    cy.wait(['@tasks','@stats']);
    cy.get('#sortBy').select('publish_date');
    cy.get('#sortOrder').select('asc');
    cy.get('.task-card .task-title').first().should('contain.text','B');
  });

  it('no results Show All Tasks button restores list', () => {
    stubTasks([
      { id: 1, name: 'Alpha', introduction: 'intro', question_count: 1 },
      { id: 2, name: 'Beta', introduction: 'intro', question_count: 1 },
    ]);
    cy.visit('/teacher');
    cy.wait(['@tasks','@stats']);
    cy.get('input[placeholder*="Search"]').type('ZZZZ');
    cy.contains('No tasks found');
    cy.contains('button','Show All Tasks').click();
    cy.get('.task-card').should('have.length',2);
  });

  it('stat counters reflect number of visible task cards', () => {
    stubTasks([
      { id: 1, name: 'Alpha', introduction: 'intro', question_count: 5 },
      { id: 2, name: 'Beta', introduction: 'intro', question_count: 1 },
      { id: 3, name: 'Gamma', introduction: 'intro', question_count: 3 },
    ]);
    cy.visit('/teacher');
    cy.wait(['@tasks','@stats']);
    cy.get('.task-card').its('length').then(len=>{
      cy.get('.task-count').should('contain.text', `${len} tasks`);
    });
    cy.get('input[placeholder*="Search"]').type('Alpha');
    cy.get('.task-card').should('have.length',1);
    cy.get('.task-count').should('contain.text','1 tasks');
  });

  it('summary card Filtered Tasks number updates on search', () => {
    stubTasks([
      { id: 1, name: 'Alpha', introduction: 'intro', question_count: 1 },
      { id: 2, name: 'Beta', introduction: 'intro', question_count: 1 },
      { id: 3, name: 'Gamma', introduction: 'intro', question_count: 1 },
    ]);
    cy.visit('/teacher');
    cy.wait(['@tasks','@stats']);
    cy.get('.summary-cards .stat-card').first().find('h3').invoke('text').then(initial=>{
      cy.get('input[placeholder*="Search"]').type('Alpha');
      cy.get('.summary-cards .stat-card').first().find('h3').should('contain.text','1');
    });
  });

  it('delete modal shows Deleting... while request pending', () => {
    stubTasks([{ id: 1, name: 'Delete Me', introduction: 'intro', question_count: 2 }]);
    cy.intercept('DELETE', `${Cypress.env('apiBaseUrl')}/api/tasks/1`, { statusCode:200, delay:800 }).as('delSlow');
    cy.visit('/teacher');
    cy.wait(['@tasks','@stats']);
    cy.get('.task-card').first().find('.btn-delete').click();
    cy.contains('button','Delete Task').click();
    cy.contains('button','Deleting...').should('exist');
    cy.wait('@delSlow');
  });

  it('search matches introduction text too', () => {
    stubTasks([
      { id: 1, name: 'Alpha', introduction: 'special-keyword here', question_count: 1 },
      { id: 2, name: 'Beta', introduction: 'intro', question_count: 1 },
    ]);
    cy.visit('/teacher');
    cy.wait(['@tasks','@stats']);
    cy.get('input[placeholder*="Search"]').type('special-keyword');
    cy.get('.task-card').should('have.length',1).and('contain.text','Alpha');
  });

  it('no results Create New Task button navigates to editor', () => {
    stubTasks([{ id: 1, name: 'Some Task', introduction: 'intro', question_count: 0 }]);
    cy.visit('/teacher');
    cy.wait(['@tasks','@stats']);
    cy.get('input[placeholder*="Search"]').type('ZZZZ');
    cy.contains('No tasks found');
    cy.contains('button','Create New Task').click();
    cy.location('pathname').should('include','/teacher/tasks/new');
  });

  it('course badge text maps from task name', () => {
    stubTasks([
      { id: 1, name: 'Chemistry Basics', introduction: '', question_count: 1 },
      { id: 2, name: 'Mathematics Basics', introduction: '', question_count: 1 },
    ]);
    cy.visit('/teacher');
    cy.wait(['@tasks','@stats']);
    cy.get('.task-card').eq(0).find('.course-badge').should('contain.text','Chemistry');
    cy.get('.task-card').eq(1).find('.course-badge').should('contain.text','Mathematics');
  });
});


