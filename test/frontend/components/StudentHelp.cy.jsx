/// <reference types="cypress" />

import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import StudentHelp from '../../../src/components/StudentHelp.jsx';

// Consolidated CTs for StudentHelp: quick actions + FAQ + contact form

describe('StudentHelp (Component)', () => {
  const mountHelp = () => {
    cy.mount(
      <MemoryRouter>
        <StudentHelp />
      </MemoryRouter>
    );
  };

  it('quick actions render with correct hrefs', () => {
    mountHelp();
    cy.contains('.action-card', 'Start New Task')
      .should('have.attr', 'href', '/student/home');
    cy.contains('.action-card', 'View Achievements')
      .should('have.attr', 'href', '/student/achievements');
    cy.contains('.action-card', 'Accessibility Settings')
      .should('have.attr', 'href', '/student/accessibility');
    cy.contains('.action-card', 'Check History')
      .should('have.attr', 'href', '/student/history');
  });

  it('filters FAQ by search keyword (e.g., "achieve")', () => {
    mountHelp();
    cy.get('input[placeholder="Search for help topics, keywords..."]').type('achieve');
    cy.get('.results-count').should('contain.text', 'result');
    cy.get('.faq-item').should('have.length.greaterThan', 0);
    cy.get('.faq-item .faq-question').first().invoke('text').then((txt) => {
      expect(txt.toLowerCase()).to.include('achievement');
    });
  });

  it('filters FAQ by Accessibility category', () => {
    mountHelp();
    cy.get('.category-tabs button').contains('Accessibility').click();
    cy.get('.faq-item').should('have.length.at.least', 1);
    cy.get('.faq-item .category-badge').each(($el) => {
      expect($el.text().trim()).to.eq('Accessibility');
    });
  });

  it('opens and closes the contact form', () => {
    mountHelp();
    cy.contains('button', 'Open Form').click();
    cy.get('form.support-form').should('be.visible');
    cy.contains('button', 'Cancel').click();
    cy.get('form.support-form').should('not.exist');
  });

  it('required fields prevent submit (browser native validity)', () => {
    mountHelp();
    cy.contains('button', 'Open Form').click();
    cy.get('form.support-form').within(() => {
      cy.get('button[type="submit"]').click();
      cy.get('#name').should('have.attr', 'required');
      cy.get('#email').should('have.attr', 'required');
      cy.get('#message').should('have.attr', 'required');
      cy.root().should('be.visible');
    });
  });

  it('toggles FAQ open/close via keyboard (Enter and Space) and updates aria-expanded', () => {
    mountHelp();
    // Target first FAQ question element
    cy.get('.faq-item').first().as('firstItem');
    cy.get('@firstItem').find('.faq-question').as('q');
    // Initially collapsed
    cy.get('@q').should('have.attr', 'aria-expanded', 'false');
    // Open with Enter
    cy.get('@q').trigger('keydown', { key: 'Enter' });
    cy.get('@q').should('have.attr', 'aria-expanded', 'true');
    // Close with Space
    cy.get('@q').trigger('keydown', { key: ' ' });
    cy.get('@q').should('have.attr', 'aria-expanded', 'false');
  });

  it('feedback buttons toggle active state between Yes and No', () => {
    mountHelp();
    // Expand first item to reveal feedback buttons
    cy.get('.faq-item').first().as('firstItem');
    cy.get('@firstItem').find('.faq-question').click();
    cy.get('@firstItem').find('.faq-feedback').as('fb');
    // Click Yes → Yes active, No inactive
    cy.get('@fb').contains('button.feedback-btn', 'Yes').click().should('have.class', 'active');
    cy.get('@fb').contains('button.feedback-btn', 'No').should('not.have.class', 'active');
    // Click No → No active, Yes inactive
    cy.get('@fb').contains('button.feedback-btn', 'No').click().should('have.class', 'active');
    cy.get('@fb').contains('button.feedback-btn', 'Yes').should('not.have.class', 'active');
  });
});
