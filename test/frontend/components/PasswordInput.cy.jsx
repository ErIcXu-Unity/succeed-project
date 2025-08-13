/// <reference types="cypress" />

import React from 'react';
import PasswordInput from '../../../src/components/PasswordInput.jsx';

describe('PasswordInput (Component)', () => {
  it('renders with basic props and handles input changes', () => {
    const onChange = cy.stub().as('onChange');
    cy.mount(
      <PasswordInput
        name="password"
        placeholder="Enter password"
        value=""
        onChange={onChange}
      />
    );

    cy.get('.password-input-container').should('exist');
    cy.get('input.password-input')
      .should('have.attr', 'type', 'password')
      .should('have.attr', 'name', 'password')
      .should('have.attr', 'placeholder', 'Enter password');

    // Test input change
    cy.get('input.password-input').type('test123');
    cy.get('@onChange').should('have.been.called');
  });

  it('toggles password visibility when button is clicked', () => {
    cy.mount(
      <PasswordInput
        name="password"
        placeholder="Password"
        value="secret123"
        onChange={cy.stub()}
      />
    );

    // Initially hidden (password type)
    cy.get('input.password-input').should('have.attr', 'type', 'password');
    cy.get('.password-toggle').should('have.class', 'hidden');
    cy.get('.password-toggle').should('have.attr', 'aria-label', 'Show password');

    // Click to show
    cy.get('.password-toggle').click();
    cy.get('input.password-input').should('have.attr', 'type', 'text');
    cy.get('.password-toggle').should('have.class', 'visible');
    cy.get('.password-toggle').should('have.attr', 'aria-label', 'Hide password');

    // Click to hide again
    cy.get('.password-toggle').click();
    cy.get('input.password-input').should('have.attr', 'type', 'password');
    cy.get('.password-toggle').should('have.class', 'hidden');
  });

  it('renders with all optional props', () => {
    const onFocus = cy.stub().as('onFocus');
    const onBlur = cy.stub().as('onBlur');
    
    cy.mount(
      <PasswordInput
        name="confirmPassword"
        placeholder="Confirm Password"
        value="test"
        onChange={cy.stub()}
        required={true}
        minLength="6"
        style={{ border: '2px solid red' }}
        className="custom-class"
        autoComplete="new-password"
        onFocus={onFocus}
        onBlur={onBlur}
      />
    );

    cy.get('.password-input-container').should('have.class', 'custom-class');
    cy.get('input.password-input').should('have.attr', 'required');
    cy.get('input.password-input').should('have.attr', 'minlength', '6');
    cy.get('input.password-input').should('have.attr', 'autocomplete', 'new-password');
      
    // Check border style exists (exact color may vary by browser)
    cy.get('input.password-input').should('have.attr', 'style').and('contain', 'border');

    // Test focus and blur events
    cy.get('input.password-input').focus();
    cy.get('@onFocus').should('have.been.called');
    
    cy.get('input.password-input').blur();
    cy.get('@onBlur').should('have.been.called');
  });

  it('displays correct SVG icons for show/hide states', () => {
    cy.mount(
      <PasswordInput
        name="password"
        value="test"
        onChange={cy.stub()}
      />
    );

    // Check hidden state icon (eye icon)
    cy.get('.password-toggle svg').should('exist');
    cy.get('.password-toggle svg path').should('contain.attr', 'd');
    cy.get('.password-toggle svg circle').should('exist');

    // Click to show password
    cy.get('.password-toggle').click();

    // Check visible state icon (eye-off icon with line)
    cy.get('.password-toggle svg').should('exist');
    cy.get('.password-toggle svg line').should('exist');
    cy.get('.password-toggle svg').find('path').should('have.length.greaterThan', 1);
  });

  it('handles empty value prop correctly', () => {
    cy.mount(
      <PasswordInput
        name="password"
        value=""
        onChange={cy.stub()}
      />
    );

    cy.get('input.password-input').should('have.value', '');
    cy.get('.password-toggle').click();
    cy.get('input.password-input').should('have.attr', 'type', 'text');
  });

  it('button prevents form submission (type="button")', () => {
    const onSubmit = cy.stub().as('onSubmit');
    
    cy.mount(
      <form onSubmit={onSubmit}>
        <PasswordInput
          name="password"
          value="test"
          onChange={cy.stub()}
        />
        <button type="submit">Submit</button>
      </form>
    );

    // Click toggle button should not submit form
    cy.get('.password-toggle').click();
    cy.get('@onSubmit').should('not.have.been.called');
    
    // But submit button should
    cy.get('button[type="submit"]').click();
    cy.get('@onSubmit').should('have.been.called');
  });
});
