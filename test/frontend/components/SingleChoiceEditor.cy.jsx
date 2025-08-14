import React, { useState } from 'react';
import { mount } from 'cypress/react18';
import SingleChoiceEditor from '../../../src/components/SingleChoiceEditor';

const SCWrapper = ({ initial }) => {
  const [formData, setFormData] = useState(initial);
  return (
    <div>
      <SingleChoiceEditor formData={formData} setFormData={setFormData} />
      <pre data-testid="state-json">{JSON.stringify(formData)}</pre>
    </div>
  );
};

describe('SingleChoiceEditor (Component)', () => {
  const baseForm = {
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: ''
  };

  it('renders four options inputs', () => {
    mount(<SCWrapper initial={baseForm} />);
    cy.get('[data-cy^="sc-option-"]').should('have.length', 4);
  });

  it('updates option input text', () => {
    mount(<SCWrapper initial={baseForm} />);
    cy.get('[data-cy="sc-option-A"]').type('Alpha');
    cy.get('[data-cy="sc-option-A"]').should('have.value', 'Alpha');
  });

  it('sets correct answer when clicking toggle', () => {
    mount(<SCWrapper initial={baseForm} />);
    cy.get('[data-cy="sc-correct-B"]').click();
    cy.get('[data-cy="sc-correct-B"]').should('have.class', 'active');
    // Only one correct at a time
    cy.get('[data-cy="sc-correct-C"]').click();
    cy.get('[data-cy="sc-correct-C"]').should('have.class', 'active');
    cy.get('[data-cy="sc-correct-B"]').should('not.have.class', 'active');
  });
});

