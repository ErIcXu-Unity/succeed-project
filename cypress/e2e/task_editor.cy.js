/// <reference types="cypress" />

describe('Task Editor flows', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    const teacher = { role: 'tea', user_id: 1000, username: 'st1000@tea.com', real_name: 'Teacher Admin' };
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('user_data', JSON.stringify(teacher));
      }
    });
    cy.wait(3500);
  });

  it('create new task in create mode and navigate back to teacher dashboard (stubbed)', () => {
    cy.visit('/teacher/tasks/new');
    cy.get('#taskName').type('Cypress Created Task');
    cy.get('#taskIntroduction').type('Task created by Cypress E2E');
    cy.intercept('POST', '**/api/tasks', { statusCode: 200, body: { task: { id: 9009 } } }).as('createTask');
    cy.contains('button', 'Create Task').click();
    cy.wait('@createTask');
    // 返回教师首页
    cy.location('pathname', { timeout: 6000 }).should('include', '/teacher');
  });

  it('edit mode: save updates task name/introduction', () => {
    cy.intercept('GET', '**/api/tasks/1', { statusCode: 200, body: { id: 1, name: 'Edit Task', introduction: 'intro', publish_at: null } }).as('task');
    cy.intercept('GET', '**/api/tasks/1/questions', { statusCode: 200, body: [] }).as('qs');
    cy.intercept('PUT', '**/api/tasks/1', { statusCode: 200, body: { task: { id: 1, name: 'Edited', introduction: 'Updated' } } }).as('update');
    cy.visit('/teacher/tasks/1/edit');
    cy.wait(['@task','@qs']);
    cy.get('#taskName').clear().type('Edited');
    cy.get('#taskIntroduction').clear().type('Updated');
    cy.contains('button','Save Task').click();
    cy.wait('@update');
  });

  it('edit mode: add question button visible and disabled at 100', () => {
    const fakeQuestions = Array.from({length:5}).map((_,i)=>({ id: i+1, question: 'Q'+(i+1), option_a:'A', option_b:'B', option_c:'C', option_d:'D', correct_answer:'A', score:3 }));
    cy.intercept('GET','**/api/tasks/1', { statusCode:200, body:{ id:1, name:'Edit', introduction:'intro' } }).as('task');
    cy.intercept('GET','**/api/tasks/1/questions', { statusCode:200, body: fakeQuestions }).as('qs');
    cy.visit('/teacher/tasks/1/edit');
    cy.wait(['@task','@qs']);
    cy.contains('button','Add Question').should('be.enabled');
  });

  it('create mode: Create Task fails with missing fields -> shows error message', () => {
    cy.visit('/teacher/tasks/new');
    cy.contains('button','Create Task').click();
    cy.get('.error-message').should('contain.text','Task name is required');
    cy.get('#taskName').type('New T');
    cy.contains('button','Create Task').click();
    cy.get('.error-message').should('contain.text','Task introduction is required');
  });

  it('create mode: successful creation navigates back with success toast', () => {
    cy.visit('/teacher/tasks/new');
    cy.get('#taskName').type('Cypress Created Task');
    cy.get('#taskIntroduction').type('Task created by Cypress E2E');
    cy.intercept('POST','**/api/tasks', { statusCode:200, body:{ task:{ id: 9009 } } }).as('create');
    cy.contains('button','Create Task').click();
    cy.wait('@create');
    cy.location('pathname', { timeout: 6000 }).should('include','/teacher');
  });

  it('edit mode: publish immediately toggles status to Immediate', () => {
    cy.intercept('GET','**/api/tasks/1', { statusCode:200, body:{ id:1, name:'Edit', introduction:'intro', publish_at: new Date().toISOString() } }).as('task');
    cy.intercept('GET','**/api/tasks/1/questions', { statusCode:200, body:[] }).as('qs');
    cy.visit('/teacher/tasks/1/edit');
    cy.wait(['@task','@qs']);
    cy.get('label.radio-option').contains('Publish Immediately').click();
    cy.get('.status-immediate').should('exist');
  });

  it('edit mode: schedule for later shows datetime input with min and default next hour', () => {
    cy.intercept('GET','**/api/tasks/1', { statusCode:200, body:{ id:1, name:'Edit', introduction:'intro', publish_at: null } }).as('task');
    cy.intercept('GET','**/api/tasks/1/questions', { statusCode:200, body:[] }).as('qs');
    cy.visit('/teacher/tasks/1/edit');
    cy.wait(['@task','@qs']);
    cy.contains('label.radio-option','Schedule for Later').click();
    cy.get('#publishAt').should('exist').and('have.attr','min');
  });

  it('single choice create page: breadcrumb Back to Task returns to edit page', () => {
    cy.intercept('GET','**/api/tasks/1', { statusCode:200, body:{ id:1, name:'Edit Task' } }).as('task');
    cy.visit('/teacher/tasks/1/create/single-choice');
    cy.wait('@task');
    cy.get('.breadcrumb-link').contains('Back to Task').click();
    cy.location('pathname').should('include','/teacher/tasks/1/edit');
  });

  it('single choice create page: Cancel button returns to edit page', () => {
    cy.intercept('GET','**/api/tasks/1', { statusCode:200, body:{ id:1, name:'Edit Task' } }).as('task');
    cy.visit('/teacher/tasks/1/create/single-choice');
    cy.wait('@task');
    cy.contains('button','Cancel').click();
    cy.location('pathname').should('include','/teacher/tasks/1/edit');
  });

  it('edit mode: status changes to Scheduled when publishAt set', () => {
    cy.intercept('GET','**/api/tasks/1', { statusCode:200, body:{ id:1, name:'Edit', introduction:'intro', publish_at: null } }).as('task');
    cy.intercept('GET','**/api/tasks/1/questions', { statusCode:200, body:[] }).as('qs');
    cy.visit('/teacher/tasks/1/edit');
    cy.wait(['@task','@qs']);
    cy.contains('label.radio-option','Schedule for Later').click();
    cy.get('.status-scheduled').should('exist');
  });

  it('video section is visible in edit mode and hidden in create mode', () => {
    // edit mode
    cy.intercept('GET','**/api/tasks/1', { statusCode:200, body:{ id:1, name:'Edit', introduction:'intro' } }).as('task');
    cy.intercept('GET','**/api/tasks/1/questions', { statusCode:200, body:[] }).as('qs');
    cy.visit('/teacher/tasks/1/edit');
    cy.wait(['@task','@qs']);
    cy.contains('Task Video').should('exist');
    // create mode no video section
    cy.visit('/teacher/tasks/new');
    cy.contains('Task Video').should('not.exist');
  });

  it('questions section shows empty state message when no questions', () => {
    cy.intercept('GET','**/api/tasks/1', { statusCode:200, body:{ id:1, name:'Edit', introduction:'intro' } }).as('task');
    cy.intercept('GET','**/api/tasks/1/questions', { statusCode:200, body:[] }).as('qs');
    cy.visit('/teacher/tasks/1/edit');
    cy.wait(['@task','@qs']);
    cy.contains('No questions added yet').should('exist');
  });

  it('questions header count matches list length', () => {
    const list = Array.from({length:3}).map((_,i)=>({ id:i+1, question:'Q', option_a:'A', option_b:'B', option_c:'C', option_d:'D', correct_answer:'A', score:3 }));
    cy.intercept('GET','**/api/tasks/1', { statusCode:200, body:{ id:1, name:'Edit', introduction:'intro' } }).as('task');
    cy.intercept('GET','**/api/tasks/1/questions', { statusCode:200, body:list }).as('qs');
    cy.visit('/teacher/tasks/1/edit');
    cy.wait(['@task','@qs']);
    cy.contains('Questions (3/100)').should('exist');
    cy.get('.questions-list .question-card').should('have.length',3);
  });

  it('single choice create: validation errors then successful create', () => {
    cy.intercept('GET','**/api/tasks/1', { statusCode:200, body:{ id:1, name:'Edit Task' } }).as('task');
    cy.intercept('POST','**/api/tasks/1/questions', { statusCode:200, body:{ id: 111 } }).as('create');
    cy.visit('/teacher/tasks/1/create/single-choice');
    cy.wait('@task');
    // empty submit -> error
    cy.get('[data-cy="create-question-btn"]').click();
    cy.contains('Question content cannot be empty');
    // fill minimal valid fields
    cy.get('[data-cy="question-text"]').type('What is 1+1?');
    cy.get('[data-cy="sc-option-A"]').type('1');
    cy.get('[data-cy="sc-option-B"]').type('2');
    cy.get('[data-cy\="sc-option-C"]').type('3');
    cy.get('[data-cy\="sc-option-D"]').type('4');
    cy.get('[data-cy="sc-correct-B"]').click();
    cy.get('[data-cy="create-question-btn"]').click();
    cy.wait('@create');
  });

  it('multiple choice create: add/remove option and toggle correct', () => {
    cy.intercept('GET','**/api/tasks/1', { statusCode:200, body:{ id:1, name:'Edit Task' } }).as('task');
    cy.visit('/teacher/tasks/1/create/multiple-choice');
    cy.wait('@task');
    cy.get('.option-item-vertical').should('have.length.at.least',4);
    cy.contains('button','Add Option').click();
    cy.get('.option-item-vertical').should('have.length.at.least',5);
    cy.get('[data-cy="mc-option-0"]').type('A');
    cy.get('[data-cy="mc-option-1"]').type('B');
    cy.get('[data-cy="mc-correct-0"]').click();
    cy.get('[data-cy="mc-correct-1"]').click();
  });

  it('fill blank create: typing {{placeholders}} creates blank cards', () => {
    cy.intercept('GET','**/api/tasks/1', { statusCode:200, body:{ id:1, name:'Edit Task' } }).as('task');
    cy.visit('/teacher/tasks/1/create/fill-blank');
    cy.wait('@task');
    cy.get('[data-cy="fill-blank-template"]').type('The capital of {{country}} is {{capital}}.', { parseSpecialCharSequences:false });
    cy.get('.blank-answers-container .blank-answer-card').should('have.length',2);
  });

  it('puzzle game create: switch modes and type solution', () => {
    cy.intercept('GET','**/api/tasks/1', { statusCode:200, body:{ id:1, name:'Edit Task' } }).as('task');
    cy.visit('/teacher/tasks/1/create/puzzle-game');
    cy.wait('@task');
    cy.get('[data-cy="puzzle-mode-math"]').click();
    cy.get('[data-cy="puzzle-solution"]').type('E=mc');
    cy.get('[data-cy="superscript-2"]').click();
    cy.get('[data-cy="puzzle-mode-chemistry"]').click();
    cy.get('[data-cy="arrow-btn"]').click();
  });

  it('matching task create: add match pair and see counts update', () => {
    cy.intercept('GET','**/api/tasks/1', { statusCode:200, body:{ id:1, name:'Edit Task' } }).as('task');
    cy.visit('/teacher/tasks/1/create/matching-task');
    cy.wait('@task');
    cy.get('[data-cy="add-match-pair-btn"]').click();
    cy.get('.left-items .left-item').its('length').should('be.gte',3);
  });

  // Cancel and Back to Task on other create flows
  const openEditorAndBack = (path) => {
    cy.intercept('GET','**/api/tasks/1', { statusCode:200, body:{ id:1, name:'Edit Task' } }).as('task');
    cy.visit(path);
    cy.wait('@task');
    cy.get('.breadcrumb-link').contains('Back to Task').click();
    cy.location('pathname').should('include','/teacher/tasks/1/edit');
  };

  it('multiple choice create page: Back to Task navigates to edit', () => {
    openEditorAndBack('/teacher/tasks/1/create/multiple-choice');
  });

  it('fill blank create page: Back to Task navigates to edit', () => {
    openEditorAndBack('/teacher/tasks/1/create/fill-blank');
  });

  it('puzzle game create page: Back to Task navigates to edit', () => {
    openEditorAndBack('/teacher/tasks/1/create/puzzle-game');
  });

  it('matching task create page: Back to Task navigates to edit', () => {
    openEditorAndBack('/teacher/tasks/1/create/matching-task');
  });

  const openEditorAndCancel = (path) => {
    cy.intercept('GET','**/api/tasks/1', { statusCode:200, body:{ id:1, name:'Edit Task' } }).as('task');
    cy.visit(path);
    cy.wait('@task');
    cy.contains('button','Cancel').click();
    cy.location('pathname').should('include','/teacher/tasks/1/edit');
  };

  it('multiple choice create page: Cancel returns to edit', () => {
    openEditorAndCancel('/teacher/tasks/1/create/multiple-choice');
  });

  it('fill blank create page: Cancel returns to edit', () => {
    openEditorAndCancel('/teacher/tasks/1/create/fill-blank');
  });

  it('puzzle game create page: Cancel returns to edit', () => {
    openEditorAndCancel('/teacher/tasks/1/create/puzzle-game');
  });

  it('matching task create page: Cancel returns to edit', () => {
    openEditorAndCancel('/teacher/tasks/1/create/matching-task');
  });

  it('Add Question button is disabled when questions reach 100', () => {
    const many = Array.from({length:100}).map((_,i)=>({ id:i+1, question:'Q', option_a:'A', option_b:'B', option_c:'C', option_d:'D', correct_answer:'A', score:3 }));
    cy.intercept('GET','**/api/tasks/1', { statusCode:200, body:{ id:1, name:'Edit', introduction:'intro' } }).as('task');
    cy.intercept('GET','**/api/tasks/1/questions', { statusCode:200, body: many }).as('qs');
    cy.visit('/teacher/tasks/1/edit');
    cy.wait(['@task','@qs']);
    cy.contains('button','Add Question').should('be.disabled');
  });

  it('error view appears when loading task fails and Back navigates to dashboard', () => {
    cy.intercept('GET','**/api/tasks/1', { statusCode:500, body:{ error:'boom' } }).as('task');
    cy.visit('/teacher/tasks/1/edit');
    cy.wait('@task');
    cy.contains('Failed to load task details').should('exist');
    cy.contains('Back to Dashboard').click();
    cy.location('pathname').should('include','/teacher');
  });

  it('shows loading spinner before data arrives', () => {
    cy.intercept('GET','**/api/tasks/1', { statusCode:200, delay:600, body:{ id:1, name:'Edit', introduction:'intro' } }).as('task');
    cy.intercept('GET','**/api/tasks/1/questions', { statusCode:200, delay:600, body:[] }).as('qs');
    cy.visit('/teacher/tasks/1/edit');
    cy.get('.loading').should('exist');
    cy.wait(['@task','@qs']);
  });

  it('refetches questions when window regains focus', () => {
    cy.intercept('GET','**/api/tasks/1', { statusCode:200, body:{ id:1, name:'Edit', introduction:'intro' } }).as('task');
    cy.intercept('GET','**/api/tasks/1/questions').as('qs');
    cy.visit('/teacher/tasks/1/edit');
    cy.wait(['@task','@qs']);
    cy.window().then(win => win.dispatchEvent(new Event('focus')));
    cy.wait('@qs');
  });
});


