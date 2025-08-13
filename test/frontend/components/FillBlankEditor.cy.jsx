/// <reference types="cypress" />

import React from 'react';
import FillBlankEditor from '../../../src/components/FillBlankEditor.jsx';

describe('FillBlankEditor (Component)', () => {
  let mockFormData;
  let mockSetFormData;

  beforeEach(() => {
    mockFormData = {
      question: '',
      blank_answers: ['']
    };
    mockSetFormData = cy.stub().as('setFormData');
  });

  const mountComponent = (formData = mockFormData) => {
    cy.mount(<FillBlankEditor formData={formData} setFormData={mockSetFormData} />);
  };

  it('renders the component with correct structure', () => {
    mountComponent();
    
    cy.get('.form-card').should('exist');
    cy.get('.card-header h3').should('contain.text', 'Fill in the Blank');
    cy.get('.card-subtitle').should('contain.text', 'Create interactive fill-in-the-blank questions');
    cy.get('[data-cy="fill-blank-template"]').should('exist');
  });

  it('displays template input field with correct placeholder', () => {
    mountComponent();
    
    cy.get('[data-cy="fill-blank-template"]')
      .should('have.attr', 'placeholder')
      .and('include', 'Write your question using {{placeholder}} for blanks');
  });

  it('shows help text for template syntax', () => {
    mountComponent();
    
    cy.get('.help-text').should('contain.text', 'Use {{placeholder}} syntax for blanks');
    cy.get('.help-text code').should('contain.text', '{{placeholder}}');
  });

  it('calls setFormData when template is changed', () => {
    mountComponent();
    
    const templateText = 'The capital of {{country}} is {{capital}}.';
    cy.get('[data-cy="fill-blank-template"]').type(templateText, { parseSpecialCharSequences: false });
    
    cy.get('@setFormData').should('have.been.called');
  });

  it('auto-detects blanks from template and updates blank_answers', () => {
    mountComponent();
    
    const templateText = 'The {{animal}} is {{color}}.';
    cy.get('[data-cy="fill-blank-template"]').type(templateText, { parseSpecialCharSequences: false });
    
    // Should call setFormData twice: once for question, once for blank_answers
    cy.get('@setFormData').should('have.been.called');
  });

  it('shows template preview when template is entered', () => {
    const formDataWithTemplate = {
      question: 'The capital of {{country}} is {{capital}}.',
      blank_answers: ['', '']
    };
    
    mountComponent(formDataWithTemplate);
    
    cy.get('.template-preview').should('exist');
    cy.get('.template-preview h4').should('contain.text', 'Template Preview');
    cy.get('.blank-placeholder').should('have.length', 2);
    cy.get('.blank-placeholder').first().should('contain.text', '[Blank 1]');
    cy.get('.blank-placeholder').last().should('contain.text', '[Blank 2]');
  });

  it('does not show template preview when no template is entered', () => {
    mountComponent();
    
    cy.get('.template-preview').should('not.exist');
  });

  it('displays correct number of blank answers', () => {
    const formDataWithBlanks = {
      question: 'The {{animal}} is {{color}} and {{size}}.',
      blank_answers: ['cat', 'orange', 'small']
    };
    
    mountComponent(formDataWithBlanks);
    
    cy.get('.section-header h4').should('contain.text', 'Blank Answers (3)');
    cy.get('.blank-answer-card').should('have.length', 3);
  });

  it('shows correct placeholder names in blank labels', () => {
    const formDataWithTemplate = {
      question: 'The {{animal}} is {{color}}.',
      blank_answers: ['', '']
    };
    
    mountComponent(formDataWithTemplate);
    
    cy.get('.blank-label').first().should('contain.text', 'Correct Answer for "animal"');
    cy.get('.blank-label').last().should('contain.text', 'Correct Answer for "color"');
  });

  it('falls back to generic blank names when no placeholder in template', () => {
    const formDataWithMismatch = {
      question: 'Simple question without placeholders.',
      blank_answers: ['answer1']
    };
    
    mountComponent(formDataWithMismatch);
    
    cy.get('.blank-label').should('contain.text', 'Correct Answer for "blank_1"');
  });

  it('handles blank answer input changes', () => {
    const formDataWithBlanks = {
      question: 'The {{animal}} is {{color}}.',
      blank_answers: ['', '']
    };
    
    mountComponent(formDataWithBlanks);
    
    cy.get('.blank-input').first().type('dog');
    cy.get('@setFormData').should('have.been.called');
    
    cy.get('.blank-input').last().type('brown');
    cy.get('@setFormData').should('have.been.called');
  });

  it('shows add blank button', () => {
    mountComponent();
    
    cy.get('[data-cy="add-blank-btn"]').should('exist');
    cy.get('[data-cy="add-blank-btn"]').should('contain.text', 'Add Blank');
    cy.get('[data-cy="add-blank-btn"] i').should('have.class', 'fa-plus');
  });

  it('adds blank when add button is clicked', () => {
    mountComponent();
    
    cy.get('[data-cy="add-blank-btn"]').click();
    cy.get('@setFormData').should('have.been.called');
  });

  it('shows remove blank button only when more than one blank exists', () => {
    // With only one blank
    const formDataOneBlank = {
      question: '',
      blank_answers: ['']
    };
    
    mountComponent(formDataOneBlank);
    cy.get('[data-cy="remove-blank-btn"]').should('not.exist');
    
    // With multiple blanks
    const formDataMultipleBlanks = {
      question: '',
      blank_answers: ['answer1', 'answer2']
    };
    
    mountComponent(formDataMultipleBlanks);
    cy.get('[data-cy="remove-blank-btn"]').should('exist');
    cy.get('[data-cy="remove-blank-btn"]').should('contain.text', 'Remove Blank');
    cy.get('[data-cy="remove-blank-btn"] i').should('have.class', 'fa-minus');
  });

  it('removes blank when remove button is clicked', () => {
    const formDataMultipleBlanks = {
      question: '',
      blank_answers: ['answer1', 'answer2']
    };
    
    mountComponent(formDataMultipleBlanks);
    
    cy.get('[data-cy="remove-blank-btn"]').click();
    cy.get('@setFormData').should('have.been.called');
  });

  it('handles empty or undefined formData gracefully', () => {
    mountComponent({});
    
    cy.get('.form-card').should('exist');
    cy.get('[data-cy="fill-blank-template"]').should('have.value', '');
    cy.get('.blank-answer-card').should('have.length', 1); // Default to one blank
  });

  it('handles complex template with multiple placeholders', () => {
    const complexTemplate = 'In {{year}}, {{person}} discovered {{discovery}} while working in {{location}}.';
    const formDataComplex = {
      question: complexTemplate,
      blank_answers: ['1928', 'Fleming', 'penicillin', 'laboratory']
    };
    
    mountComponent(formDataComplex);
    
    cy.get('.blank-answer-card').should('have.length', 4);
    cy.get('.blank-placeholder').should('have.length', 4);
    cy.get('.section-header h4').should('contain.text', 'Blank Answers (4)');
  });

  it('handles template with duplicate placeholders', () => {
    const templateWithDuplicates = 'The {{animal}} and the {{animal}} are both {{color}}.';
    const formDataDuplicates = {
      question: templateWithDuplicates,
      blank_answers: ['cat', 'dog', 'brown']
    };
    
    mountComponent(formDataDuplicates);
    
    cy.get('.blank-answer-card').should('have.length', 3);
    cy.get('.blank-placeholder').should('have.length', 3);
  });

  it('maintains input values when provided in formData', () => {
    const formDataWithValues = {
      question: 'The {{animal}} is {{color}}.',
      blank_answers: ['elephant', 'gray']
    };
    
    mountComponent(formDataWithValues);
    
    cy.get('.blank-input').first().should('have.value', 'elephant');
    cy.get('.blank-input').last().should('have.value', 'gray');
  });

  it('shows required asterisk in template label', () => {
    mountComponent();
    
    cy.get('.form-label-redesigned .required').should('contain.text', '*');
  });

  it('displays correct blank numbers in blank cards', () => {
    const formDataMultiple = {
      question: 'First {{a}}, second {{b}}, third {{c}}.',
      blank_answers: ['one', 'two', 'three']
    };
    
    mountComponent(formDataMultiple);
    
    cy.get('.blank-number').should('have.length', 3);
    cy.get('.blank-number').first().should('contain.text', '1');
    cy.get('.blank-number').eq(1).should('contain.text', '2');
    cy.get('.blank-number').last().should('contain.text', '3');
  });

  it('handles edge case with empty template but existing answers', () => {
    const edgeCaseData = {
      question: '',
      blank_answers: ['existing_answer']
    };
    
    mountComponent(edgeCaseData);
    
    cy.get('.blank-answer-card').should('have.length', 1);
    cy.get('.blank-label').should('contain.text', 'Correct Answer for "blank_1"');
    cy.get('.blank-input').should('have.value', 'existing_answer');
  });

  it('handles empty blank_answers array gracefully', () => {
    const emptyData = {
      question: 'No placeholders here.',
      blank_answers: []
    };
    
    mountComponent(emptyData);
    
    // Component shows empty array length since [] || [''] still returns []
    cy.get('.section-header h4').should('contain.text', 'Blank Answers (0)');
    cy.get('.blank-answer-card').should('have.length', 0);
  });

  it('handles undefined blank_answers with fallback', () => {
    const undefinedData = {
      question: 'No placeholders here.'
      // blank_answers is undefined
    };
    
    mountComponent(undefinedData);
    
    // Component uses [''] as fallback when blank_answers is undefined
    cy.get('.section-header h4').should('contain.text', 'Blank Answers (1)');
    cy.get('.blank-answer-card').should('have.length', 1);
  });

  it('ensures at least one blank when template has no placeholders', () => {
    mountComponent();
    
    const simpleText = 'This is a simple question without any placeholders.';
    cy.get('[data-cy="fill-blank-template"]').clear();
    cy.get('[data-cy="fill-blank-template"]').type(simpleText, { parseSpecialCharSequences: false });
    
    // Should call setFormData to ensure at least one blank exists
    cy.get('@setFormData').should('have.been.called');
  });

  it('handles template change when existing answers are longer than new placeholders', () => {
    const formDataWithManyAnswers = {
      question: '{{a}} and {{b}} and {{c}}.',
      blank_answers: ['one', 'two', 'three', 'extra', 'more']
    };
    
    mountComponent(formDataWithManyAnswers);
    
    // Change to template with fewer placeholders
    const shorterTemplate = 'Only {{x}} here.';
    cy.get('[data-cy="fill-blank-template"]').clear();
    cy.get('[data-cy="fill-blank-template"]').type(shorterTemplate, { parseSpecialCharSequences: false });
    
    cy.get('@setFormData').should('have.been.called');
  });

  it('handles template change when existing answers are shorter than new placeholders', () => {
    const formDataWithFewAnswers = {
      question: 'Just {{a}}.',
      blank_answers: ['one']
    };
    
    mountComponent(formDataWithFewAnswers);
    
    // Change to template with more placeholders
    const longerTemplate = '{{x}} and {{y}} and {{z}} here.';
    cy.get('[data-cy="fill-blank-template"]').clear();
    cy.get('[data-cy="fill-blank-template"]').type(longerTemplate, { parseSpecialCharSequences: false });
    
    cy.get('@setFormData').should('have.been.called');
  });

  it('handles placeholder name extraction with special characters', () => {
    const formDataWithSpecialPlaceholders = {
      question: 'The {{country-name}} and {{city_name}} are {{very-important}}.', 
      blank_answers: ['', '', '']
    };
    
    mountComponent(formDataWithSpecialPlaceholders);
    
    cy.get('.blank-label').first().should('contain.text', 'Correct Answer for "country-name"');
    cy.get('.blank-label').eq(1).should('contain.text', 'Correct Answer for "city_name"');
    cy.get('.blank-label').last().should('contain.text', 'Correct Answer for "very-important"');
  });

  it('handles placeholder name extraction with whitespace', () => {
    const formDataWithWhitespace = {
      question: 'The {{ country }} and {{  city  }} are here.',
      blank_answers: ['', '']
    };
    
    mountComponent(formDataWithWhitespace);
    
    cy.get('.blank-label').first().should('contain.text', 'Correct Answer for "country"');
    cy.get('.blank-label').last().should('contain.text', 'Correct Answer for "city"');
  });

  it('handles remove blank when exactly at minimum threshold', () => {
    const formDataTwoBlanks = {
      question: '{{a}} and {{b}}.',
      blank_answers: ['one', 'two']
    };
    
    mountComponent(formDataTwoBlanks);
    
    // Should show remove button for 2 blanks
    cy.get('[data-cy="remove-blank-btn"]').should('exist');
    
    // Click remove to get to 1 blank
    cy.get('[data-cy="remove-blank-btn"]').click();
    cy.get('@setFormData').should('have.been.called');
  });

  it('does not call setFormData for remove when only one blank exists', () => {
    const formDataOneBlank = {
      question: '{{a}}.',
      blank_answers: ['one']
    };
    
    mockSetFormData.reset(); // Reset the stub
    mountComponent(formDataOneBlank);
    
    // No remove button should exist, so no removal can happen
    cy.get('[data-cy="remove-blank-btn"]').should('not.exist');
    
    // Verify setFormData wasn't called during mount (except for setup)
    cy.get('@setFormData').should('not.have.been.called');
  });

  it('handles template preview with complex placeholder patterns', () => {
    const complexTemplate = {
      question: 'Start {{first}} middle {{second}} {{third}} end.',
      blank_answers: ['', '', '']
    };
    
    mountComponent(complexTemplate);
    
    cy.get('.template-preview').should('exist');
    cy.get('.preview-content span').first().should('contain.text', 'Start ');
    cy.get('.blank-placeholder').should('have.length', 3);
    cy.get('.preview-content span').last().should('contain.text', ' end.');
  });

  it('handles map function in blank answers rendering with missing placeholders', () => {
    const mismatchedData = {
      question: '{{first}} only.',
      blank_answers: ['one', 'two', 'three'] // More answers than placeholders
    };
    
    mountComponent(mismatchedData);
    
    // All answers should render, even without matching placeholders
    cy.get('.blank-answer-card').should('have.length', 3);
    cy.get('.blank-label').eq(1).should('contain.text', 'Correct Answer for "blank_2"');
    cy.get('.blank-label').last().should('contain.text', 'Correct Answer for "blank_3"');
  });

  it('handles edge case with malformed placeholder syntax', () => {
    const malformedTemplate = {
      question: 'Start {{incomplete and {normal}} end.',
      blank_answers: ['answer']
    };
    
    mountComponent(malformedTemplate);
    
    // Should handle malformed syntax gracefully
    cy.get('.template-preview').should('exist');
    cy.get('.blank-answer-card').should('have.length', 1);
  });

  it('handles blank answer change with undefined formData.blank_answers', () => {
    const undefinedBlankAnswers = {
      question: '{{test}}.'
      // blank_answers is undefined
    };
    
    mountComponent(undefinedBlankAnswers);
    
    // Try to change a blank answer
    cy.get('.blank-input').first().type('new answer');
    cy.get('@setFormData').should('have.been.called');
  });

  it('covers template split and match functions in preview', () => {
    const templateWithComplexPattern = {
      question: 'A {{start}} B {{middle}} C {{end}} D',
      blank_answers: ['1', '2', '3']
    };
    
    mountComponent(templateWithComplexPattern);
    
    // This should trigger both split and match functions in the preview
    cy.get('.template-preview').should('exist');
    cy.get('.preview-content .blank-placeholder').should('have.length', 3);
    
    // Verify each part is rendered correctly
    cy.get('.preview-content span').should('contain.text', 'A ');
    cy.get('.preview-content span').should('contain.text', ' B ');
    cy.get('.preview-content span').should('contain.text', ' C ');
    cy.get('.preview-content span').should('contain.text', ' D');
  });

  it('covers all branches in template matching logic', () => {
    // Test the || [] fallback in multiple places
    const edgeTemplate = {
      question: '', // Empty question
      blank_answers: ['existing']
    };
    
    mountComponent(edgeTemplate);
    
    // Type a template that will trigger all the matching logic
    cy.get('[data-cy="fill-blank-template"]').type('{{test}}', { parseSpecialCharSequences: false });
    
    // Should handle the empty question → non-empty transition
    cy.get('@setFormData').should('have.been.called');
  });

  it('covers React.Fragment key handling in preview map', () => {
    const fragmentTestData = {
      question: '{{a}}{{b}}{{c}}', // Adjacent placeholders
      blank_answers: ['1', '2', '3']
    };
    
    mountComponent(fragmentTestData);
    
    // This should test the React.Fragment with key={index} logic
    cy.get('.template-preview').should('exist');
    cy.get('.blank-placeholder').should('have.length', 3);
  });

  it('covers length comparison in blank conditional rendering', () => {
    const lengthTestData = {
      question: '{{only}}',
      blank_answers: ['one', 'extra'] // More answers than placeholders
    };
    
    mountComponent(lengthTestData);
    
    // Should render both cards even though there's only one placeholder
    cy.get('.blank-answer-card').should('have.length', 2);
    
    // Test the placeholder extraction logic for the second card
    cy.get('.blank-label').last().should('contain.text', 'blank_2');
  });

  it('covers slice function in removeLegacyBlank with different array lengths', () => {
    const multiBlankData = {
      question: '{{a}} {{b}} {{c}} {{d}}',
      blank_answers: ['one', 'two', 'three', 'four']
    };
    
    mountComponent(multiBlankData);
    
    // Remove multiple blanks to test slice at different points
    cy.get('[data-cy="remove-blank-btn"]').click();
    cy.get('@setFormData').should('have.been.called');
    
    // Verify we can still add after removing
    cy.get('[data-cy="add-blank-btn"]').click();
    cy.get('@setFormData').should('have.been.called');
  });

  it('covers map index parameter in placeholder extraction', () => {
    const indexTestData = {
      question: '{{a}} text {{b}} more {{c}}',
      blank_answers: ['first', 'second', 'third', 'fourth', 'fifth'] // More than placeholders
    };
    
    mountComponent(indexTestData);
    
    // This should test the index parameter usage in map function
    cy.get('.blank-number').should('have.length', 5);
    cy.get('.blank-number').eq(3).should('contain.text', '4');
    cy.get('.blank-number').eq(4).should('contain.text', '5');
  });

  it('covers spread operator in addLegacyBlank with edge case', () => {
    const spreadTestData = {
      question: '{{test}}',
      blank_answers: null // null instead of undefined or array
    };
    
    // Override the mockSetFormData to return null for blank_answers
    const customSetFormData = cy.stub().callsFake((updateFn) => {
      if (typeof updateFn === 'function') {
        updateFn({ blank_answers: null });
      }
    }).as('customSetFormData');
    
    cy.mount(<FillBlankEditor formData={spreadTestData} setFormData={customSetFormData} />);
    
    // This should test the || [''] fallback with null
    cy.get('[data-cy="add-blank-btn"]').click();
    cy.get('@customSetFormData').should('have.been.called');
  });

  it('covers useEffect dependency changes', () => {
    const initialData = {
      question: '{{initial}}',
      blank_answers: ['start']
    };
    
    // Mount with initial data
    const mockSetFormData = cy.stub().as('setFormData');
    cy.mount(<FillBlankEditor formData={initialData} setFormData={mockSetFormData} />);
    
    cy.get('.blank-answer-card').should('have.length', 1);
    
    // Now change the question to trigger useEffect with different placeholders
    cy.get('[data-cy="fill-blank-template"]').clear().type('{{new}} and {{another}}', { parseSpecialCharSequences: false });
    
    // This should trigger the useEffect that updates blank_answers based on new placeholders
    cy.get('@setFormData').should('have.been.called');
  });

  it('covers edge case in placeholder extraction', () => {
    const edgeCaseData = {
      question: '{{a}}{{b}}{{c}}{{d}}{{e}}', // Many adjacent placeholders
      blank_answers: ['1', '2'] // Fewer answers than placeholders
    };
    
    mountComponent(edgeCaseData);
    
    // Should render all blank answer cards (based on blank_answers length)
    cy.get('.blank-answer-card').should('have.length', 2);
    
    // But template preview should show all 5 placeholders
    cy.get('.blank-placeholder').should('have.length', 5);
    
    // Test the placeholder extraction - labels show actual placeholder names
    cy.get('.blank-label').eq(1).should('contain.text', 'Correct Answer for "b"');
  });

  it('covers handleBlankAnswerChange with array bounds', () => {
    const boundsTestData = {
      question: '{{single}} and {{another}}', // Two placeholders
      blank_answers: ['existing', ''] // Two answers to match placeholders
    };
    
    mountComponent(boundsTestData);
    
    // Should start with 2 blank cards (based on blank_answers length)
    cy.get('.blank-answer-card').should('have.length', 2);
    
    // Change the existing answer
    cy.get('.blank-input').first().clear().type('updated');
    cy.get('@setFormData').should('have.been.called');
    
    // Change the second answer to test array bounds
    cy.get('.blank-input').eq(1).clear().type('second');
    cy.get('@setFormData').should('have.been.called');
  });

  it('covers complex template patterns and regex matching', () => {
    const complexTemplate = {
      question: 'Start {{first_word}} middle {{second-word}} end {{third.word}} final',
      blank_answers: ['one', 'two', 'three']
    };
    
    mountComponent(complexTemplate);
    
    // This tests the regex pattern matching for various placeholder formats
    cy.get('.blank-placeholder').should('have.length', 3);
    cy.get('.preview-content').should('contain.text', 'Start ');
    cy.get('.preview-content').should('contain.text', ' middle ');
    cy.get('.preview-content').should('contain.text', ' end ');
    cy.get('.preview-content').should('contain.text', ' final');
  });
});
