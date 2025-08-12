/// <reference types="cypress" />

describe('Question Create Pages (stubbed)', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    const teacher = { role: 'tea', user_id: 1000, username: 'st1000@tea.com', real_name: 'Teacher Admin' };
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('user_data', JSON.stringify(teacher));
      }
    });
    cy.wait(30);
  });

  const stubTask = () => {
    cy.intercept('GET', `${Cypress.env('apiBaseUrl')}/api/tasks/1`, {
      statusCode: 200,
      body: { id: 1, name: 'Stubbed Task' }
    }).as('task');
  };

  it('single choice create page loads and validates', () => {
    stubTask();
    cy.visit('/teacher/tasks/1/create/single-choice');
    cy.wait('@task');
    cy.contains(/Create|Edit/);
    cy.get('textarea[name="question"]').type('Single choice question?');
    cy.get('input[name="option_a"]').type('Option A');
    cy.get('input[name="option_b"]').type('Option B');
    cy.get('input[name="option_c"]').type('Option C');
    cy.get('input[name="option_d"]').type('Option D');
    cy.get('select[name="difficulty"]').select('Medium');
    cy.contains(/Create Question|Update Question|Create/).click();
  });

  it('multiple choice create page loads', () => {
    stubTask();
    cy.visit('/teacher/tasks/1/create/multiple-choice');
    cy.wait('@task');
    cy.contains(/Create|Edit/);
  });

  it('fill blank create page loads', () => {
    stubTask();
    cy.visit('/teacher/tasks/1/create/fill-blank');
    cy.wait('@task');
    cy.contains(/Create|Edit/);
  });

  it('puzzle game create page loads', () => {
    stubTask();
    cy.visit('/teacher/tasks/1/create/puzzle-game');
    cy.wait('@task');
    cy.contains(/Create|Edit/);
  });

  it('matching task create page loads', () => {
    stubTask();
    cy.visit('/teacher/tasks/1/create/matching-task');
    cy.wait('@task');
    cy.contains(/Create|Edit/);
  });

  // 替换：单题型创建 -> 返回任务编辑页 -> 删除刚创建的题目
  it('single choice: create then navigate task editor and delete this question (stubbed)', () => {
    stubTask();
    cy.visit('/teacher/tasks/1/create/single-choice');
    cy.wait('@task');
    cy.get('[data-cy="question-text"]').type('What is 2 + 2?');
    cy.get('input[name="option_a"]').type('3');
    cy.get('input[name="option_b"]').type('4');
    cy.get('input[name="option_c"]').type('5');
    cy.get('input[name="option_d"]').type('22');
    cy.intercept('POST', '**/api/tasks/1/questions', { statusCode: 201, body: { id: 501 } }).as('createQ');
    cy.get('[data-cy="create-question-btn"]').click();
    cy.wait('@createQ');

    // 进入任务编辑页并加载题目列表（包含刚创建的501）
    cy.intercept('GET', '**/api/tasks/1/questions', { statusCode: 200, body: [
      { id: 501, question: 'What is 2 + 2?', question_type: 'single_choice', option_a: '3', option_b: '4', option_c: '5', option_d: '22', correct_answer: 'B', score: 3, difficulty: 'Easy' }
    ] }).as('list1');
    cy.visit('/teacher/tasks/1/edit');
    cy.wait('@list1');
    // 等待问题列表渲染
    cy.get('.questions-list .question-card', { timeout: 10000 }).should('have.length.at.least', 1);

    // 点击删除，确认弹窗，并拦截 DELETE 与刷新GET
    cy.intercept('DELETE', '**/api/questions/501', { statusCode: 200 }).as('delQ');
    cy.intercept('GET', '**/api/tasks/1/questions', { statusCode: 200, body: [] }).as('list2');
    cy.get('.questions-list .question-card').first().find('.remove-btn').click();
    cy.get('.alert-btn-confirm').click();
    cy.wait('@delQ');
    cy.wait('@list2');
    cy.get('.questions-list .question-card').should('have.length', 0);
  });

  // 替换：单题型编辑（加载已有题目并更新）
  it('edit existing single choice question (stubbed)', () => {
    stubTask();
    cy.intercept('GET', '**/api/questions/777', { statusCode: 200, body: {
      id: 777,
      question: 'Old question?',
      difficulty: 'Medium',
      score: 5,
      option_a: 'A1', option_b: 'B1', option_c: 'C1', option_d: 'D1',
      correct_answer: 'A',
      question_data: null
    }}).as('getQ');
    cy.visit('/teacher/tasks/1/create/single-choice?questionId=777');
    cy.wait('@task');
    cy.wait('@getQ');
    cy.get('input[name="option_b"]').clear().type('B2');
    cy.intercept('PUT', '**/api/questions/777', { statusCode: 200, body: { ok: true } }).as('putQ');
    cy.get('[data-cy="create-question-btn"]').click();
    cy.wait('@putQ');
  });

  // 多选题：动态添加/删除选项与切换正确答案
  it('multiple choice: add/remove options and toggle correct answers', () => {
    stubTask();
    cy.visit('/teacher/tasks/1/create/multiple-choice');
    cy.wait('@task');
    cy.get('[data-cy="question-text"]').type('Pick the prime numbers');
    // 默认4个，继续添加到6个
    cy.contains('button', 'Add Option').click();
    cy.contains('button', 'Add Option').click();
    cy.get('.option-item-vertical').should('have.length.at.least', 6);
    // 填充前四个
    cy.get('input[placeholder^="Option"]').eq(0).type('2');
    cy.get('input[placeholder^="Option"]').eq(1).type('3');
    cy.get('input[placeholder^="Option"]').eq(2).type('4');
    cy.get('input[placeholder^="Option"]').eq(3).type('5');
    // 选择正确 2、3、5
    cy.get('.option-item-vertical').eq(0).contains('button', 'Set as Correct').click();
    cy.get('.option-item-vertical').eq(1).contains('button', 'Set as Correct').click();
    cy.get('.option-item-vertical').eq(3).contains('button', 'Set as Correct').click();
    // 删除一个选项，长度减少
    cy.contains('button', 'Remove Option').click();
    cy.get('.option-item-vertical').its('length').should('be.gte', 5);
  });

  // 拼图题：简单文本碎片 + 自动添加碎片 + 创建
  it('puzzle game: add fragments manually and create (stubbed)', () => {
    stubTask();
    cy.visit('/teacher/tasks/1/create/puzzle-game');
    cy.wait('@task');
    cy.get('[data-cy="question-text"]').type('Assemble a short sentence');
    // 默认一条，手动添加2条
    cy.contains('button', 'Add Fragment').click();
    cy.contains('button', 'Add Fragment').click();
    cy.get('[data-cy="puzzle-fragment"]').eq(0).clear().type('Cypress');
    cy.get('[data-cy="puzzle-fragment"]').eq(1).clear().type('is');
    cy.get('[data-cy="puzzle-fragment"]').eq(2).clear().type('great');
    cy.get('[data-cy="puzzle-solution"]').type('Cypress is great');
    cy.intercept('POST', '**/api/tasks/1/questions', { statusCode: 201, body: { id: 888 } }).as('pzCreate');
    cy.get('[data-cy="create-question-btn"]').click();
    cy.wait('@pzCreate');
  });

  it('question settings validation: difficulty/score/description and required question text', () => {
    stubTask();
    cy.visit('/teacher/tasks/1/create/single-choice');
    cy.wait('@task');

    // Required question text
    cy.get('[data-cy="create-question-btn"]').click();
    cy.contains(/Question content cannot be empty|Question Text|Question Template/i);

    // Fill minimal valid and adjust settings
    cy.get('[data-cy="question-text"]').type('Which is a vowel?');
    cy.get('input[name="option_a"]').type('A');
    cy.get('input[name="option_b"]').type('B');
    cy.get('input[name="option_c"]').type('C');
    cy.get('input[name="option_d"]').type('D');

    // Sidebar settings
    cy.get('[data-cy="question-difficulty"]').select('Hard');
    cy.get('[data-cy="question-score"]').clear().type('10');
    cy.get('[data-cy="question-description"]').type('Choose the correct vowel');
    cy.intercept('POST', '**/api/tasks/1/questions').as('qs');
    cy.get('[data-cy="create-question-btn"]').click();
    cy.wait('@qs');
  });
});


