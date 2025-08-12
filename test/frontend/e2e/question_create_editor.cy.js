/// <reference types="cypress" />

describe('Question Editors - rich interactions', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    const teacher = { role: 'tea', user_id: 1000, username: 'st1000@tea.com', real_name: 'Teacher Admin' };
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('user_data', JSON.stringify(teacher));
      }
    });
    cy.wait(30);
    cy.intercept('GET', '**/api/tasks/1', { statusCode: 200, body: { id: 1, name: 'Stubbed Task' } }).as('task');
  });

  it('SingleChoiceEditor: set options and mark correct answer by button', () => {
    cy.visit('/teacher/tasks/1/create/single-choice');
    cy.wait('@task');
    // Wait for the question layout to appear
    cy.get('[data-cy="question-text"]', { timeout: 10000 }).should('be.visible');
    // Wait for option inputs to be available
    cy.get('[data-cy="sc-option-A"]', { timeout: 5000 }).should('be.visible').type('Alpha');
    cy.get('[data-cy="sc-option-B"]').should('be.visible').type('Beta');
    cy.get('[data-cy="sc-option-C"]').should('be.visible').type('Gamma');
    cy.get('[data-cy="sc-option-D"]').should('be.visible').type('Delta');
    cy.get('[data-cy="sc-correct-A"]').should('be.visible').click();
    cy.get('[data-cy="sc-correct-A"]').contains('Correct Answer');
  });

  it('MultipleChoiceEditor: add/remove option and toggle correct answers', () => {
    cy.visit('/teacher/tasks/1/create/multiple-choice');
    cy.wait('@task');
    // Wait for component to load and check initial state
    cy.get('.option-item-vertical', { timeout: 5000 }).should('have.length.at.least', 4);
   
    cy.contains('button', 'Add Option').click();
    cy.contains('button', 'Add Option').click();
    cy.get('.option-item-vertical').should('have.length.at.least', 6);
    // Set the content and mark it correctly
    cy.get('[data-cy="mc-option-0"]').type('A1');
    cy.get('[data-cy="mc-option-1"]').type('A2');
    cy.get('[data-cy="mc-option-2"]').type('A3');
    cy.get('[data-cy="mc-option-3"]').type('A4');
    cy.get('[data-cy="mc-correct-0"]').click();
    cy.get('[data-cy="mc-correct-2"]').click();
    cy.get('[data-cy="mc-correct-0"]').contains('Correct Answer');
    cy.get('[data-cy="mc-correct-2"]').contains('Correct Answer');
    // Remove an item and confirm the selection remains valid
    cy.contains('button', 'Remove Option').click();
    cy.get('.option-item-vertical').should('have.length.at.least', 5);
  });

  it('FillBlankEditor: template preview updates placeholder count and labels', () => {
    cy.visit('/teacher/tasks/1/create/fill-blank');
    cy.wait('@task');
    cy.get('[data-cy="fill-blank-template"]', { timeout: 5000 })
      .type('The capital of {{country}} is {{capital}}.', { parseSpecialCharSequences: false });
    cy.get('.template-preview .blank-placeholder').should('have.length', 2);
    cy.get('.template-preview').contains('Blank 1');
    cy.get('.template-preview').contains('Blank 2');
    // Append one more placeholder
    cy.get('[data-cy="fill-blank-template"]').type(' and located in {{continent}}', { parseSpecialCharSequences: false });
    cy.get('.template-preview .blank-placeholder').should('have.length', 3);
    // Reduce to one placeholder and verify
    cy.get('[data-cy="fill-blank-template"]').clear().type('Only one {{one}}.', { parseSpecialCharSequences: false });
    cy.get('.template-preview .blank-placeholder').should('have.length', 1);
  });

  it('PuzzleGameEditor: switch input modes, use helpers and auto fragments', () => {
    cy.visit('/teacher/tasks/1/create/puzzle-game');
    cy.wait('@task');
    // text -> math -> chemistry 
    cy.get('[data-cy="puzzle-mode-math"]', { timeout: 5000 }).click();
    cy.get('[data-cy="puzzle-solution"]').type('E=mc');
    cy.get('[data-cy="superscript-2"]').click(); // superscript helper
    cy.get('[data-cy="puzzle-mode-chemistry"]').click();
    cy.get('[data-cy="arrow-btn"]').click(); // arrow helper
    cy.get('[data-cy="puzzle-solution"]').type(' H2O');
    // auto fragment suggestion
    cy.get('[data-cy="use-auto-fragments"]').click({ force: true });
    cy.get('.fragments-list .fragment-editor-item').should('have.length.at.least', 1);
  });

  it('MatchingTaskEditor: add pair, create matches via click, remove match', () => {
    cy.visit('/teacher/tasks/1/create/matching-task');
    cy.wait('@task');
    // Initial two pairs, add one pair
    cy.get('[data-cy="add-match-pair-btn"]', { timeout: 5000 }).click();
    cy.get('.left-items .left-item').should('have.length.at.least', 3);
    // fill and match (1→A, 2→B, 3→C)
    cy.get('.left-items .left-item').eq(0).find('input').type('France');
    cy.get('.right-items .right-item').eq(0).find('input').type('Paris');
    cy.get('.left-items .left-item').eq(1).find('input').type('Japan');
    cy.get('.right-items .right-item').eq(1).find('input').type('Tokyo');
    cy.get('.left-items .left-item').eq(2).find('input').type('China');
    cy.get('.right-items .right-item').eq(2).find('input').type('Beijing');
    // click match
    cy.get('.left-items .left-item').eq(0).find('.drag-handle').click();
    cy.get('.right-items .right-item').eq(0).find('.drop-zone').click();
    cy.get('.left-items .left-item').eq(1).find('.drag-handle').click();
    cy.get('.right-items .right-item').eq(1).find('.drop-zone').click();
    cy.get('.left-items .left-item').eq(2).find('.drag-handle').click();
    cy.get('.right-items .right-item').eq(2).find('.drop-zone').click();
    cy.get('.match-progress .matches-count').contains('3/3');
    // remove a match
    cy.get('.left-items .left-item').eq(2).find('.btn-remove-match').click();
    cy.get('.match-progress .matches-count').contains('2/3');
  });

  // New tests to reach ~15 total (editor-focused, based on component logic)

  it('SingleChoiceEditor: switching correct answer is exclusive', () => {
    cy.visit('/teacher/tasks/1/create/single-choice');
    cy.wait('@task');
    cy.get('[data-cy="sc-option-A"]').type('Alpha');
    cy.get('[data-cy="sc-option-B"]').type('Beta');
    cy.get('[data-cy="sc-correct-A"]').click();
    cy.get('[data-cy="sc-correct-A"]').contains('Correct Answer');
    cy.get('[data-cy="sc-correct-B"]').click();
    cy.get('[data-cy="sc-correct-B"]').contains('Correct Answer');
    cy.get('[data-cy="sc-correct-A"]').should('not.contain.text', 'Correct Answer');
  });

  it('SingleChoiceEditor: option inputs are required', () => {
    cy.visit('/teacher/tasks/1/create/single-choice');
    cy.wait('@task');
    cy.get('[data-cy="sc-option-A"]').should('have.attr', 'required');
    cy.get('[data-cy="sc-option-B"]').should('have.attr', 'required');
    cy.get('[data-cy="sc-option-C"]').should('have.attr', 'required');
    cy.get('[data-cy="sc-option-D"]').should('have.attr', 'required');
  });

  it('MultipleChoiceEditor: initial has 4 options and remove is visible', () => {
    cy.visit('/teacher/tasks/1/create/multiple-choice');
    cy.wait('@task');
    cy.get('.option-item-vertical').should('have.length.at.least', 4);
    cy.contains('button', 'Remove Option').should('exist');
    cy.contains('button', 'Add Option').should('not.be.disabled');
  });

  it('MultipleChoiceEditor: Add Option capped at 8 and disables add button', () => {
    cy.visit('/teacher/tasks/1/create/multiple-choice');
    cy.wait('@task');
    cy.get('.option-item-vertical').its('length').then((count) => {
      const toAdd = Math.max(0, 8 - count);
      Cypress._.times(toAdd, () => {
        cy.contains('button', 'Add Option').should('not.be.disabled').click();
      });
    });
    cy.get('.option-item-vertical').should('have.length', 8);
    cy.contains('button', 'Add Option').should('be.disabled');
  });

  it('MultipleChoiceEditor: removing options prunes out-of-range correct answers', () => {
    cy.visit('/teacher/tasks/1/create/multiple-choice');
    cy.wait('@task');
    // Grow to 8
    for (let i = 0; i < 4; i++) {
      cy.contains('button', 'Add Option').click();
    }
    cy.get('.option-item-vertical').should('have.length', 8);
    // Mark index 0 and 7 as correct
    cy.get('[data-cy="mc-correct-0"]').click();
    cy.get('[data-cy="mc-correct-7"]').click();
    cy.get('[data-cy="mc-correct-0"]').contains('Correct Answer');
    cy.get('[data-cy="mc-correct-7"]').contains('Correct Answer');
    // Remove two to shrink to 6
    cy.contains('button', 'Remove Option').click();
    cy.contains('button', 'Remove Option').click();
    cy.get('.option-item-vertical').should('have.length', 6);
    // Index 7 no longer exists, index 0 remains correct
    cy.get('[data-cy="mc-correct-0"]').contains('Correct Answer');
    cy.get('[data-cy="mc-correct-7"]').should('not.exist');
  });

  it('FillBlankEditor: Add/Remove buttons toggle visibility with count', () => {
    cy.visit('/teacher/tasks/1/create/fill-blank');
    cy.wait('@task');
    cy.get('.blank-answers-container .blank-answer-card').should('have.length', 1);
    cy.get('[data-cy="remove-blank-btn"]').should('not.exist');
    cy.get('[data-cy="add-blank-btn"]').click();
    cy.get('.blank-answers-container .blank-answer-card').should('have.length', 2);
    cy.get('[data-cy="remove-blank-btn"]').should('exist').click();
    cy.get('.blank-answers-container .blank-answer-card').should('have.length', 1);
    cy.get('[data-cy="remove-blank-btn"]').should('not.exist');
  });

  it('FillBlankEditor: typing {{placeholders}} auto-creates inputs without special sequence parsing', () => {
    cy.visit('/teacher/tasks/1/create/fill-blank');
    cy.wait('@task');
    cy.get('[data-cy="fill-blank-template"]').type('A {{one}} B {{two}} C', { parseSpecialCharSequences: false });
    cy.get('.blank-answers-container .blank-answer-card').should('have.length', 2);
  });

  it('PuzzleGameEditor: validation shows required when empty, then valid when filled', () => {
    cy.visit('/teacher/tasks/1/create/puzzle-game');
    cy.wait('@task');
    cy.get('.validation-message.invalid').should('contain.text', 'Solution is required');
    cy.get('[data-cy="puzzle-solution"]').type('H2 + O2 -> H2O');
    cy.get('.validation-message.valid').should('contain.text', 'Solution is valid');
  });

  it('PuzzleGameEditor: add/remove fragments and clear all resets to one', () => {
    cy.visit('/teacher/tasks/1/create/puzzle-game');
    cy.wait('@task');
    cy.get('[data-cy="add-fragment-btn"]').click().click();
    cy.get('.fragments-list .fragment-editor-item').should('have.length.at.least', 3);
    // Remove last fragment
    cy.get('.fragments-list .fragment-editor-item').last().find('.remove-fragment-btn').click();
    cy.get('.fragments-list .fragment-editor-item').its('length').then((len) => {
      expect(len).to.be.greaterThan(1);
    });
    // Clear all
    cy.contains('button', 'Clear All').click();
    cy.get('.fragments-list .fragment-editor-item').should('have.length', 1);
  });

  it('PuzzleGameEditor: math helper inserts superscript ²', () => {
    cy.visit('/teacher/tasks/1/create/puzzle-game');
    cy.wait('@task');
    cy.get('[data-cy="puzzle-mode-math"]').click();
    cy.get('[data-cy="puzzle-solution"]').type('E=mc');
    cy.get('[data-cy="superscript-2"]').click();
    cy.get('[data-cy="puzzle-solution"]').should('have.value', 'E=mc²');
  });

  it('MatchingTaskEditor: remove pair when >2 and prune out-of-range matches', () => {
    cy.visit('/teacher/tasks/1/create/matching-task');
    cy.wait('@task');
    // Add one pair to make 3
    cy.get('[data-cy="add-match-pair-btn"]').click();
    cy.contains('button', 'Remove Match Pair').should('exist');
    // Create a match for the last pair (index 2 -> C)
    cy.get('.left-items .left-item').eq(2).find('input').type('X');
    cy.get('.right-items .right-item').eq(2).find('input').type('Y');
    cy.get('.left-items .left-item').eq(2).find('.drag-handle').click();
    cy.get('.right-items .right-item').eq(2).find('.drop-zone').click();
    cy.get('.match-progress .matches-count').contains('1/3');
    // Remove pair -> count becomes 2, and the match must be pruned
    cy.contains('button', 'Remove Match Pair').click();
    cy.get('.left-items .left-item').should('have.length', 2);
    cy.get('.match-progress .matches-count').contains('0/2');
  });

  it('QuestionCreateLayout: changing difficulty auto-updates score mapping', () => {
    cy.visit('/teacher/tasks/1/create/single-choice');
    cy.wait('@task');
    cy.get('[data-cy="question-difficulty"]').select('Hard');
    cy.get('[data-cy="question-score"]').should('have.value', '10');
    cy.get('[data-cy="question-difficulty"]').select('Medium');
    cy.get('[data-cy="question-score"]').should('have.value', '5');
  });
});


