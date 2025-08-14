import React, { useState } from 'react';
import { mount } from 'cypress/react18';
import InteractiveQuestionRenderer from '../../../src/components/InteractiveQuestionRenderer';

const Harness = ({ initialQuestion, initialAnswer = undefined }) => {
  const [answer, setAnswer] = useState(initialAnswer);
  return (
    <div>
      <InteractiveQuestionRenderer
        question={initialQuestion}
        currentAnswer={answer}
        onAnswerChange={setAnswer}
      />
      <pre data-testid="answer-json">{JSON.stringify(answer)}</pre>
    </div>
  );
};

describe('InteractiveQuestionRenderer (Component)', () => {
  it('handles single_choice selection', () => {
    const question = {
      id: 1,
      question_type: 'single_choice',
      options: { A: 'H2O', B: 'CO2', C: 'NaCl' }
    };

    mount(<Harness initialQuestion={question} />);
    cy.contains('.option-button', 'H2O').click();
    cy.get('[data-testid="answer-json"]').should('contain', '"A"');
    cy.contains('.option-button', 'H2O').should('have.class', 'selected');
  });

  it('handles multiple_choice checkboxes', () => {
    const question = {
      id: 2,
      question_type: 'multiple_choice',
      question_data: { options: ['Alpha', 'Beta', 'Gamma'] }
    };

    mount(<Harness initialQuestion={question} initialAnswer={[]} />);
    cy.get('input[type="checkbox"]').eq(0).check({ force: true });
    cy.get('input[type="checkbox"]').eq(2).check({ force: true });
    cy.get('[data-testid="answer-json"]').should('contain', '[0,2]');
  });

  it('handles legacy fill_blank input updates', () => {
    const question = {
      id: 3,
      question_type: 'fill_blank',
      question_data: { blank_answers: ['', ''] }
    };

    mount(<Harness initialQuestion={question} />);
    cy.get('.legacy-fill-blank-question .blank-inputs input').eq(0).type('first');
    cy.get('.legacy-fill-blank-question .blank-inputs input').eq(1).type('second');
    cy.get('[data-testid="answer-json"]').should('contain', '["first","second"]');
  });

  it('handles enhanced fill_blank hints and input', () => {
    const question = {
      id: 4,
      question_type: 'fill_blank',
      question_data: {
        enhanced: true,
        template: 'The value is {{x}} and unit is {{u}}.',
        blanks: [
          { id: 0, placeholder: 'x', options: { hints: ['Number hint'] } },
          { id: 1, placeholder: 'u', options: { hints: ['Unit hint'] } }
        ]
      }
    };

    mount(<Harness initialQuestion={question} />);
    cy.get('.enhanced-fill-blank-question .fill-blank-input').eq(0).type('42');
    cy.get('.hint-button').first().click();
    cy.get('.hint-tooltip').should('contain', 'Number hint');
    cy.get('[data-testid="answer-json"]').should('contain', '["42"');
  });

  it('handles matching_task via click pairing and clear', () => {
    const question = {
      id: 5,
      question_type: 'matching_task',
      question_data: {
        left_items: ['L1', 'L2'],
        right_items: ['R1', 'R2'],
        correct_matches: [{ left: 0, right: 1 }]
      }
    };

    mount(<Harness initialQuestion={question} initialAnswer={{}} />);
    cy.get('.matching-task-question .left-item').eq(0).click();
    cy.get('.matching-task-question .right-item').eq(1).click();
    cy.get('[data-testid="answer-json"]').should('contain', '{"0":1}');

    cy.get('.matching-controls .clear-btn').click();
    cy.get('[data-testid="answer-json"]').should('contain', '{}');
  });

  it('handles puzzle_game clear using initial answer', () => {
    const question = {
      id: 6,
      question_type: 'puzzle_game',
      question_data: {
        puzzle_fragments: ['x', '+', '1', '=', '0'],
        puzzle_solution: 'x + 1 = 0'
      },
      puzzle_solution: 'x + 1 = 0'
    };

    // Provide an initial assembled answer so Clear All is enabled
    mount(<Harness initialQuestion={question} initialAnswer={['x']} />);

    cy.get('.puzzle-controls .clear-btn').should('not.be.disabled');
    cy.get('.puzzle-controls .clear-btn').click();
    cy.get('[data-testid="answer-json"]').should('contain', '[]');
  });
});


