/// <reference types="cypress" />

import React from 'react';
import ChangePasswordModal from '../../../src/components/ChangePasswordModal.jsx';
import { AlertProvider } from '../../../src/components/CustomAlert.jsx';

const stubFetch = (handler) => {
  cy.window().then((win) => {
    cy.stub(win, 'fetch').callsFake((url, options = {}) => handler(url, options));
  });
};

describe('ChangePasswordModal (Component)', () => {
  const mockUser = {
    username: 'testuser',
    user_id: 123
  };

  const mountWithProvider = (isOpen = true, onClose = cy.stub()) => {
    cy.mount(
      <AlertProvider>
        <ChangePasswordModal 
          isOpen={isOpen}
          onClose={onClose}
          user={mockUser}
        />
      </AlertProvider>
    );
  };

  it('does not render when isOpen is false', () => {
    mountWithProvider(false);
    cy.get('.modal-overlay').should('not.exist');
  });

  it('renders modal when isOpen is true', () => {
    mountWithProvider();
    cy.get('.modal-overlay').should('exist');
    cy.get('.change-password-modal').should('exist');
    cy.get('.modal-header h2').should('contain.text', 'Change Password');
  });

  it('closes modal when clicking overlay', () => {
    const onClose = cy.stub().as('onClose');
    mountWithProvider(true, onClose);
    cy.get('.modal-overlay').click('topLeft', { force: true });
    cy.get('@onClose').should('have.been.called');
  });

  it('closes modal when clicking close button', () => {
    const onClose = cy.stub().as('onClose');
    mountWithProvider(true, onClose);
    cy.get('.close-button').click();
    cy.get('@onClose').should('have.been.called');
  });

  it('validates required current password', () => {
    mountWithProvider();
    // Remove HTML5 validation to trigger custom validation
    cy.get('#currentPassword').invoke('removeAttr', 'required');
    cy.get('#newPassword').invoke('removeAttr', 'required');
    cy.get('#confirmPassword').invoke('removeAttr', 'required');
    cy.get('button[type="submit"]').click();
    cy.get('.error-message').should('contain.text', 'Current password is required');
  });

  it('validates required new password', () => {
    mountWithProvider();
    // Remove HTML5 validation to trigger custom validation
    cy.get('#currentPassword').invoke('removeAttr', 'required');
    cy.get('#newPassword').invoke('removeAttr', 'required');
    cy.get('#confirmPassword').invoke('removeAttr', 'required');
    cy.get('#currentPassword').type('oldpass');
    cy.get('button[type="submit"]').click();
    cy.get('.error-message').should('contain.text', 'New password is required');
  });

  it('validates new password minimum length', () => {
    mountWithProvider();
    // Remove HTML5 validation to trigger custom validation
    cy.get('#currentPassword').invoke('removeAttr', 'required');
    cy.get('#newPassword').invoke('removeAttr', 'required');
    cy.get('#confirmPassword').invoke('removeAttr', 'required');
    cy.get('#newPassword').invoke('removeAttr', 'minLength');
    cy.get('#currentPassword').type('oldpass');
    cy.get('#newPassword').type('12345');
    cy.get('button[type="submit"]').click();
    cy.get('.error-message').should('contain.text', 'New password must be at least 6 characters');
  });

  it('validates confirm password is required', () => {
    mountWithProvider();
    // Remove HTML5 validation to trigger custom validation
    cy.get('#currentPassword').invoke('removeAttr', 'required');
    cy.get('#newPassword').invoke('removeAttr', 'required');
    cy.get('#confirmPassword').invoke('removeAttr', 'required');
    cy.get('#currentPassword').type('oldpass');
    cy.get('#newPassword').type('newpass123');
    cy.get('button[type="submit"]').click();
    cy.get('.error-message').should('contain.text', 'Please confirm your new password');
  });

  it('validates passwords match', () => {
    mountWithProvider();
    cy.get('#currentPassword').type('oldpass');
    cy.get('#newPassword').type('newpass123');
    cy.get('#confirmPassword').type('different123');
    cy.get('button[type="submit"]').click();
    cy.get('.error-message').should('contain.text', 'New passwords do not match');
  });

  it('validates new password is different from current', () => {
    mountWithProvider();
    cy.get('#currentPassword').type('samepass');
    cy.get('#newPassword').type('samepass');
    cy.get('#confirmPassword').type('samepass');
    cy.get('button[type="submit"]').click();
    cy.get('.error-message').should('contain.text', 'New password must be different from current password');
  });

  it('toggles password visibility for current password', () => {
    mountWithProvider();
    cy.get('#currentPassword').should('have.attr', 'type', 'password');
    cy.get('#currentPassword').siblings('.password-toggle').click();
    cy.get('#currentPassword').should('have.attr', 'type', 'text');
    cy.get('#currentPassword').siblings('.password-toggle').click();
    cy.get('#currentPassword').should('have.attr', 'type', 'password');
  });

  it('toggles password visibility for new password', () => {
    mountWithProvider();
    cy.get('#newPassword').should('have.attr', 'type', 'password');
    cy.get('#newPassword').siblings('.password-toggle').click();
    cy.get('#newPassword').should('have.attr', 'type', 'text');
  });

  it('toggles password visibility for confirm password', () => {
    mountWithProvider();
    cy.get('#confirmPassword').should('have.attr', 'type', 'password');
    cy.get('#confirmPassword').siblings('.password-toggle').click();
    cy.get('#confirmPassword').should('have.attr', 'type', 'text');
  });

  it('clears error when user starts typing', () => {
    mountWithProvider();
    // Remove HTML5 validation to trigger custom validation
    cy.get('#currentPassword').invoke('removeAttr', 'required');
    cy.get('#newPassword').invoke('removeAttr', 'required');
    cy.get('#confirmPassword').invoke('removeAttr', 'required');
    cy.get('button[type="submit"]').click();
    cy.get('.error-message').should('exist');
    cy.get('#currentPassword').type('a');
    cy.get('.error-message').should('not.exist');
  });

  it('successful password change shows success alert and closes modal', () => {
    const onClose = cy.stub().as('onClose');
    stubFetch((url, options = {}) => {
      if (/\/change-password$/.test(url) && options.method === 'POST') {
        const body = JSON.parse(options.body);
        expect(body).to.deep.include({
          username: 'testuser',
          current_password: 'oldpass123',
          new_password: 'newpass123'
        });
        // Return a delayed promise to check loading state
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ 
              ok: true, 
              json: () => Promise.resolve({ message: 'Password changed successfully' }) 
            });
          }, 100);
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    mountWithProvider(true, onClose);
    cy.get('#currentPassword').type('oldpass123');
    cy.get('#newPassword').type('newpass123');
    cy.get('#confirmPassword').type('newpass123');
    cy.get('button[type="submit"]').click();

    // Check loading state
    cy.get('button[type="submit"]').should('contain.text', 'Changing...');
    cy.get('button[type="submit"] .fa-spinner').should('exist');

    // Check success alert appears
    cy.get('.alert-modal.success .alert-message').should('contain.text', 'Password changed successfully!');
    cy.get('.alert-btn-confirm').click();

    // Check modal closed
    cy.get('@onClose').should('have.been.called');
  });

  it('shows server error on failed password change', () => {
    stubFetch((url, options = {}) => {
      if (/\/change-password$/.test(url) && options.method === 'POST') {
        return Promise.resolve({ 
          ok: false, 
          json: () => Promise.resolve({ error: 'Current password is incorrect' }) 
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    mountWithProvider();
    cy.get('#currentPassword').type('wrongpass');
    cy.get('#newPassword').type('newpass123');
    cy.get('#confirmPassword').type('newpass123');
    cy.get('button[type="submit"]').click();

    cy.get('.error-message').should('contain.text', 'Current password is incorrect');
  });

  it('shows network error on fetch failure', () => {
    stubFetch((url, options = {}) => {
      if (/\/change-password$/.test(url) && options.method === 'POST') {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    mountWithProvider();
    cy.get('#currentPassword').type('oldpass123');
    cy.get('#newPassword').type('newpass123');
    cy.get('#confirmPassword').type('newpass123');
    cy.get('button[type="submit"]').click();

    cy.get('.error-message').should('contain.text', 'Network error. Please try again.');
  });

  it('disables buttons when loading', () => {
    stubFetch((url, options = {}) => {
      if (/\/change-password$/.test(url) && options.method === 'POST') {
        return new Promise(resolve => {
          setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({}) }), 1000);
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    mountWithProvider();
    cy.get('#currentPassword').type('oldpass123');
    cy.get('#newPassword').type('newpass123');
    cy.get('#confirmPassword').type('newpass123');
    cy.get('button[type="submit"]').click();

    cy.get('button[type="submit"]').should('be.disabled');
    cy.get('.cancel-button').should('be.disabled');
  });

  it('resets form when closing modal', () => {
    const onClose = cy.stub().as('onClose');
    mountWithProvider(true, onClose);
    
    cy.get('#currentPassword').type('test');
    cy.get('#newPassword').type('test123');
    cy.get('#confirmPassword').type('test123');
    cy.get('button[type="submit"]').click(); // trigger error
    cy.get('.error-message').should('exist');

    cy.get('.cancel-button').click();
    cy.get('@onClose').should('have.been.called');

    // When modal reopens, form should be reset
    mountWithProvider();
    cy.get('#currentPassword').should('have.value', '');
    cy.get('#newPassword').should('have.value', '');
    cy.get('#confirmPassword').should('have.value', '');
    cy.get('.error-message').should('not.exist');
  });
});
