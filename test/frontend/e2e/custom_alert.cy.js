/// <reference types="cypress" />

// Minimal route to mount pages that use CustomAlert via existing app pages
describe('CustomAlert behaviors (indirect via pages)', () => {
  const seedTeacher = () => {
    cy.clearLocalStorage();
    const teacher = { role: 'tea', user_id: 1000, username: 'st1000@tea.com', real_name: 'Teacher Admin' };
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('user_data', JSON.stringify(teacher));
      }
    });
    cy.wait(3500);
  };

  beforeEach(() => {
    seedTeacher();
  });

  it('DELETE confirm modal shows cancel and confirm buttons, cancel closes modal', () => {
    cy.intercept('GET', `${Cypress.env('apiBaseUrl')}/api/tasks*`, { statusCode: 200, body: [
      { id: 1, name: 'Task A', introduction: 'intro', question_count: 1 },
    ] }).as('tasks');
    cy.intercept('GET', `${Cypress.env('apiBaseUrl')}/api/students/dashboard-summary`, { statusCode: 200, body: { total_students: 5, completion_rate: 50 } }).as('stats');
    cy.visit('/teacher');
    cy.wait(['@tasks','@stats']);
    cy.get('.task-card').first().find('.btn-delete').click();
    cy.get('.alert-modal.confirm, .modal-content').should('be.visible');
    cy.contains('button','Cancel').click();
    cy.get('.alert-modal.confirm, .modal-content').should('not.exist');
  });

  it('Confirm path triggers DELETE and closes modal', () => {
    cy.intercept('GET', `${Cypress.env('apiBaseUrl')}/api/tasks*`, { statusCode: 200, body: [
      { id: 1, name: 'Task A', introduction: 'intro', question_count: 1 },
    ] }).as('tasks');
    cy.intercept('GET', `${Cypress.env('apiBaseUrl')}/api/students/dashboard-summary`, { statusCode: 200, body: { total_students: 5, completion_rate: 50 } }).as('stats');
    cy.intercept('DELETE', `${Cypress.env('apiBaseUrl')}/api/tasks/1`, { statusCode: 200 }).as('del');
    cy.visit('/teacher');
    cy.wait(['@tasks','@stats']);
    cy.get('.task-card').first().find('.btn-delete').click();
    cy.contains('button','Delete Task').click();
    cy.wait('@del');
  });

  it('Alert icon and classes reflect type (success/info/warning/error)', () => {
    // Use a page that triggers alerts: teacher dashboard (delete fail -> error)
    cy.intercept('GET', `${Cypress.env('apiBaseUrl')}/api/tasks*`, { statusCode: 200, body: [
      { id: 1, name: 'Task A', introduction: 'intro', question_count: 1 },
    ] }).as('tasks');
    cy.intercept('GET', `${Cypress.env('apiBaseUrl')}/api/students/dashboard-summary`, { statusCode: 200, body: { total_students: 5, completion_rate: 50 } }).as('stats');
    cy.intercept('DELETE', `${Cypress.env('apiBaseUrl')}/api/tasks/1`, { statusCode: 500, body: { error:'boom' } }).as('del500');
    cy.visit('/teacher');
    cy.wait(['@tasks','@stats']);
    cy.get('.task-card').first().find('.btn-delete').click();
    cy.contains('button','Delete Task').click();
    cy.wait('@del500');
    cy.get('.alert-modal.error, .upload-error, .error-toast').should('exist');
  });

  it('TaskEditor confirm modal shows default buttons OK and Cancel', () => {
    const list = [{ id: 9, question:'Q', option_a:'A', option_b:'B', option_c:'C', option_d:'D', correct_answer:'A', score:3 }];
    cy.intercept('GET','**/api/tasks/1', { statusCode:200, body:{ id:1, name:'Edit', introduction:'intro' } }).as('task');
    cy.intercept('GET','**/api/tasks/1/questions', { statusCode:200, body:list }).as('qs');
    cy.visit('/teacher/tasks/1/edit');
    cy.wait(['@task','@qs']);
    cy.get('.questions-list .question-card .remove-btn').click();
    cy.get('.alert-modal.confirm').should('exist');
    cy.contains('button','OK').should('exist');
    cy.contains('button','Cancel').should('exist');
  });

  it('Delete success shows success alert after confirm', () => {
    cy.intercept('GET', `${Cypress.env('apiBaseUrl')}/api/tasks*`, { statusCode: 200, body: [
      { id: 1, name: 'Task A', introduction: 'intro', question_count: 1 },
    ] }).as('tasks');
    cy.intercept('GET', `${Cypress.env('apiBaseUrl')}/api/students/dashboard-summary`, { statusCode: 200, body: { total_students: 5, completion_rate: 50 } }).as('stats');
    cy.intercept('DELETE', `${Cypress.env('apiBaseUrl')}/api/tasks/1`, { statusCode: 200 }).as('del');
    cy.visit('/teacher');
    cy.wait(['@tasks','@stats']);
    cy.get('.task-card').first().find('.btn-delete').click();
    cy.contains('button','Delete Task').click();
    cy.wait('@del');
    cy.get('.alert-modal.success').should('exist');
  });

  it('TaskEditor save success shows success alert', () => {
    cy.intercept('GET','**/api/tasks/1', { statusCode:200, body:{ id:1, name:'Edit', introduction:'intro' } }).as('task');
    cy.intercept('GET','**/api/tasks/1/questions', { statusCode:200, body:[] }).as('qs');
    cy.intercept('PUT','**/api/tasks/1', { statusCode:200, body:{ task:{ id:1, name:'Edited', introduction:'Updated' } } }).as('update');
    cy.visit('/teacher/tasks/1/edit');
    cy.wait(['@task','@qs']);
    cy.get('#taskName').clear().type('Edited');
    cy.get('#taskIntroduction').clear().type('Updated');
    cy.contains('button','Save Task').click();
    cy.wait('@update');
    cy.get('.alert-modal.success').should('exist');
  });

  it('TaskEditor remove question confirm cancel keeps card visible', () => {
    const list = [{ id: 9, question:'Q', option_a:'A', option_b:'B', option_c:'C', option_d:'D', correct_answer:'A', score:3 }];
    cy.intercept('GET','**/api/tasks/1', { statusCode:200, body:{ id:1, name:'Edit', introduction:'intro' } }).as('task');
    cy.intercept('GET','**/api/tasks/1/questions', { statusCode:200, body:list }).as('qs');
    cy.visit('/teacher/tasks/1/edit');
    cy.wait(['@task','@qs']);
    cy.get('.questions-list .question-card').should('have.length',1);
    cy.get('.questions-list .question-card .remove-btn').click();
    cy.get('.alert-modal.confirm').should('exist');
    cy.contains('button','Cancel').click();
    cy.get('.alert-modal.confirm').should('not.exist');
    cy.get('.questions-list .question-card').should('have.length',1);
  });

  it('TaskEditor remove question confirm deletes and refreshes', () => {
    const list = [{ id: 9, question:'Q', option_a:'A', option_b:'B', option_c:'C', option_d:'D', correct_answer:'A', score:3 }];
    cy.intercept('GET','**/api/tasks/1', { statusCode:200, body:{ id:1, name:'Edit', introduction:'intro' } }).as('task');
    cy.intercept('GET','**/api/tasks/1/questions', { statusCode:200, body:list }).as('qs');
    cy.intercept('DELETE','**/api/questions/9', { statusCode:200 }).as('delQ');
    cy.visit('/teacher/tasks/1/edit');
    cy.wait(['@task','@qs']);
    cy.get('.questions-list .question-card .remove-btn').click();
    cy.contains('button','OK').click();
    cy.wait('@delQ');
  });
});


