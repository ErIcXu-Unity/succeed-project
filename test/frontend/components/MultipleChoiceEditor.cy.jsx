import React, { useState } from 'react';
import { mount } from 'cypress/react18';
import MultipleChoiceEditor from '../../../src/components/MultipleChoiceEditor';

const MCWrapper = ({ initial }) => {
  const [formData, setFormData] = useState(initial);
  return (
    <div>
      <MultipleChoiceEditor formData={formData} setFormData={setFormData} />
      <pre data-testid="state-json">{JSON.stringify(formData)}</pre>
    </div>
  );
};

describe('MultipleChoiceEditor (Component)', () => {
  const baseForm = {
    options: ['Opt 1', 'Opt 2', 'Opt 3'],
    correct_answers: []
  };

  it('renders header and initial options', () => {
    mount(<MCWrapper initial={baseForm} />);
    cy.contains('h3', 'Multiple Choice Options').should('exist');
    cy.get('[data-cy^="mc-option-"]').should('have.length', 3);
    cy.get('[data-cy="mc-option-0"]').should('have.value', 'Opt 1');
  });

  it('updates option text on input change', () => {
    mount(<MCWrapper initial={baseForm} />);
    cy.get('[data-cy="mc-option-1"]').clear().type('Banana');
    cy.get('[data-cy="mc-option-1"]').should('have.value', 'Banana');
  });

  it('toggles correct answers on button click', () => {
    mount(<MCWrapper initial={baseForm} />);
    cy.get('[data-cy="mc-correct-0"]').click();
    cy.get('[data-cy="mc-correct-0"]').should('have.class', 'active');
    cy.get('.option-item-vertical').first().find('.correct-indicator').should('exist');

    // Toggle off
    cy.get('[data-cy="mc-correct-0"]').click();
    cy.get('[data-cy="mc-correct-0"]').should('not.have.class', 'active');
  });

  it('adds options up to the maximum and disables add button', () => {
    mount(<MCWrapper initial={baseForm} />);
    for (let i = 0; i < 5; i += 1) {
      cy.get('.add-option-btn').click();
    }
    cy.get('[data-cy^="mc-option-"]').should('have.length', 8);
    cy.get('.add-option-btn').should('be.disabled');
  });

  it('removes the last option and trims correct_answers if needed', () => {
    const start = { options: ['A', 'B', 'C', 'D'], correct_answers: [3] };
    mount(<MCWrapper initial={start} />);
    cy.get('[data-cy^="mc-option-"]').should('have.length', 4);
    cy.get('.remove-option-btn').click();
    cy.get('[data-cy^="mc-option-"]').should('have.length', 3);
    // Previously-correct index 3 removed; ensure no active buttons remain
    cy.get('[data-cy^="mc-correct-"]').filter('.active').should('have.length', 0);
  });
});

