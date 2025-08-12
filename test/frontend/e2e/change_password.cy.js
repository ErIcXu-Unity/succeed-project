/// <reference types="cypress" />

describe('ChangePasswordModal flows (teacher header button)', () => {
  const seedTeacher = () => {
    cy.clearLocalStorage();
    const teacher = { role: 'tea', user_id: 1000, username: 'st1000@tea.com', real_name: 'Teacher Admin' };
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('user_data', JSON.stringify(teacher));
      }
    });
    cy.wait(30);
  };

  const openModal = () => {
    seedTeacher();
    cy.visit('/teacher');
    cy.get('.settings-btn').click();
    cy.get('.change-password-modal').should('exist');
  };

  const disableNativeValidation = () => {
    cy.get('.change-password-modal form').invoke('attr','novalidate','novalidate');
  };

  const closeAlertIfPresent = () => {
    cy.get('body').then(($b)=>{
      if ($b.find('.alert-overlay').length) {
        cy.get('.alert-overlay').click('topLeft');
      }
    });
  };

  it('opens modal and closes by clicking overlay and X button', () => {
    openModal();
    cy.get('.modal-overlay').click('topLeft');
    cy.get('.change-password-modal').should('not.exist');
    // Open again and close by X
    cy.get('.settings-btn').click();
    cy.get('.change-password-modal').should('exist');
    cy.get('.close-button').click();
    cy.get('.change-password-modal').should('not.exist');
  });

  it('validates required fields and mismatch errors', () => {
    openModal();
    disableNativeValidation();
    cy.get('.change-password-modal').within(() => {
      cy.contains('button','Change Password').click();
      cy.get('.error-message').should('contain.text','Current password is required');
    });
    cy.get('#currentPassword').type('old');
    cy.get('.change-password-modal').within(() => {
      cy.contains('button','Change Password').click();
      cy.get('.error-message').should('contain.text','New password is required');
    });
    cy.get('#newPassword').type('12345');
    cy.get('.change-password-modal').within(() => {
      cy.contains('button','Change Password').click();
      cy.get('.error-message').should('contain.text','New password must be at least 6 characters');
    });
    cy.get('#newPassword').clear().type('abcdef');
    cy.get('.change-password-modal').within(() => {
      cy.contains('button','Change Password').click();
      cy.get('.error-message').should('contain.text','Please confirm your new password');
    });
    cy.get('#confirmPassword').type('abcdeg');
    cy.get('.change-password-modal').within(() => {
      cy.contains('button','Change Password').click();
      cy.get('.error-message').should('contain.text','New passwords do not match');
    });
  });

  it('shows error when new equals current', () => {
    openModal();
    cy.get('#currentPassword').type('abcdef');
    cy.get('#newPassword').type('abcdef');
    cy.get('#confirmPassword').type('abcdef');
    cy.contains('button','Change Password').click();
    cy.get('.error-message').should('contain.text','New password must be different from current password');
  });

  it('password visibility toggles for three fields', () => {
    openModal();
    cy.get('#currentPassword').type('old');
    cy.get('#newPassword').type('abcdef');
    cy.get('#confirmPassword').type('abcdef');
    cy.get('#currentPassword').should('have.attr','type','password');
    cy.get('.password-toggle').eq(0).click();
    cy.get('#currentPassword').should('have.attr','type','text');
    cy.get('.password-toggle').eq(1).click();
    cy.get('#newPassword').should('have.attr','type','text');
    cy.get('.password-toggle').eq(2).click();
    cy.get('#confirmPassword').should('have.attr','type','text');
  });

  // removed by request

  it('server 400 shows error message', () => {
    openModal();
    cy.get('#currentPassword').type('oldpass');
    cy.get('#newPassword').type('newpassword');
    cy.get('#confirmPassword').type('newpassword');
    cy.intercept('POST', `${Cypress.env('apiBaseUrl')}/change-password`, { statusCode:400, body:{ error:'Invalid current password' } }).as('cp400');
    cy.contains('button','Change Password').click();
    cy.wait('@cp400');
    cy.get('.error-message').should('contain.text','Invalid current password');
  });

  it('network error shows friendly message', () => {
    openModal();
    cy.get('#currentPassword').type('oldpass');
    cy.get('#newPassword').type('newpassword');
    cy.get('#confirmPassword').type('newpassword');
    cy.intercept('POST', `${Cypress.env('apiBaseUrl')}/change-password`, { forceNetworkError:true }).as('cpNet');
    cy.contains('button','Change Password').click();
    cy.wait('@cpNet');
    cy.get('.error-message').should('contain.text','Network error');
  });

  // removed by request

  // removed by request

  it('clicking inside modal does not close it', () => {
    openModal();
    cy.get('.change-password-modal').click('center');
    cy.get('.change-password-modal').should('exist');
  });

  it('new password input has minLength=6 attribute', () => {
    openModal();
    cy.get('#newPassword').should('have.attr','minLength','6');
  });

  // removed by request

  // removed by request

  it('visibility toggles back to password type when toggled again', () => {
    openModal();
    cy.get('#newPassword').type('abcdef');
    cy.get('.password-toggle').eq(1).click();
    cy.get('#newPassword').should('have.attr','type','text');
    cy.get('.password-toggle').eq(1).click();
    cy.get('#newPassword').should('have.attr','type','password');
  });

  // removed by request

  it('reopen after overlay close resets visibility toggles', () => {
    openModal();
    cy.get('#newPassword').type('abcdef');
    cy.get('.password-toggle').eq(1).click();
    cy.get('.modal-overlay').click('topLeft');
    cy.get('.settings-btn').click();
    cy.get('#newPassword').should('have.attr','type','password');
  });

  // removed by request

  it('modal header and hints render correctly', () => {
    openModal();
    cy.contains('h2','Change Password').should('exist');
    cy.get('.password-strength small').should('contain.text','at least 6 characters');
  });

  it('modal not present before clicking settings', () => {
    seedTeacher();
    cy.visit('/teacher');
    cy.get('.change-password-modal').should('not.exist');
  });

  // New tests
  it('clicking outside modal closes and does not submit form', () => {
    openModal();
    cy.get('#currentPassword').type('something');
    cy.get('.modal-overlay').click('topLeft');
    // Reopen and ensure inputs are cleared (handleClose resets state)
    cy.get('.settings-btn').click();
    cy.get('#currentPassword').should('have.value','');
  });

  it('new password strength hint remains visible during input', () => {
    openModal();
    cy.get('#newPassword').type('abcdef');
    cy.get('.password-strength small').should('contain.text','at least 6 characters');
  });

  it('cancel after validation error also clears error state on reopen', () => {
    openModal();
    disableNativeValidation();
    cy.contains('button','Change Password').click();
    cy.get('.error-message').should('exist');
    cy.contains('button','Cancel').click();
    cy.get('.change-password-modal').should('not.exist');
    cy.get('.settings-btn').click();
    cy.get('.error-message').should('not.exist');
  });
});


