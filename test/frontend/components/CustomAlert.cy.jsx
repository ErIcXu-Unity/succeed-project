/// <reference types="cypress" />

import React, { useState, useRef } from 'react';
import { AlertProvider, useAlert, ALERT_TYPES } from '../../../src/components/CustomAlert.jsx';

const Harness = () => {
  const alert = useAlert();
  const [confirmResult, setConfirmResult] = useState(null);
  const lastId = useRef(null);

  const showInfo = () => {
    lastId.current = alert.info('Info body', { title: 'Info Title' });
  };

  const showErrorNoTitle = () => {
    lastId.current = alert.error('Error body');
  };

  const showConfirm = () => {
    alert.confirm('Are you sure?', { confirmText: 'OK', cancelText: 'Cancel' }).then((res) => {
      setConfirmResult(res);
    });
  };

  const showConfirmCustom = () => {
    lastId.current = alert.showAlert({
      message: 'Custom Confirm',
      type: ALERT_TYPES.CONFIRM,
      showCancel: true,
      confirmText: 'Yes',
      cancelText: 'No',
    });
  };

  const twoAlerts = () => {
    alert.showAlert({ message: 'First', type: ALERT_TYPES.INFO });
    lastId.current = alert.showAlert({ message: 'Second', type: ALERT_TYPES.WARNING });
  };

  const debounceTwin = () => {
    // two calls in the same tick -> second should be ignored
    const id1 = alert.showAlert({ message: 'Debounce A', type: ALERT_TYPES.INFO });
    const id2 = alert.showAlert({ message: 'Debounce B', type: ALERT_TYPES.INFO });
    lastId.current = id2 || id1; // expect id2 === null
  };

  const autoCloseWarn = () => {
    lastId.current = alert.warning('Auto close body', { autoClose: true, duration: 500 });
  };

  const removeLast = () => {
    if (lastId.current) {
      alert.removeAlert(lastId.current);
      lastId.current = null;
    }
  };

  return (
    <div>
      <button data-cy="btn-info" onClick={showInfo}>Info</button>
      <button data-cy="btn-error" onClick={showErrorNoTitle}>Error</button>
      <button data-cy="btn-confirm" onClick={showConfirm}>Confirm</button>
      <button data-cy="btn-confirm-custom" onClick={showConfirmCustom}>ConfirmCustom</button>
      <button data-cy="btn-two" onClick={twoAlerts}>TwoAlerts</button>
      <button data-cy="btn-debounce" onClick={debounceTwin}>DebounceTwin</button>
      <button data-cy="btn-autoclose" onClick={autoCloseWarn}>AutoCloseWarn</button>
      <button data-cy="btn-remove" onClick={removeLast}>RemoveLast</button>
      {confirmResult !== null && <div data-cy="confirm-result">{String(confirmResult)}</div>}
    </div>
  );
};

describe('CustomAlert (Component)', () => {
  const mountWithProvider = () => {
    cy.mount(
      <AlertProvider>
        <Harness />
      </AlertProvider>
    );
  };

  it('renders info with title and closes on overlay click', () => {
    mountWithProvider();
    cy.get('[data-cy="btn-info"]').click();
    cy.get('.alert-modal.info .alert-title').should('contain.text', 'Info Title');
    cy.get('.alert-modal.info .alert-message').should('contain.text', 'Info body');
    cy.get('.alert-modal.info .alert-icon.info-icon').should('exist');
    cy.get('.alert-overlay').click('center');
    cy.get('.alert-modal').should('not.exist');
  });

  it('renders error without title and keeps icon in body', () => {
    mountWithProvider();
    cy.get('[data-cy="btn-error"]').click();
    cy.get('.alert-modal.error .alert-title').should('not.exist');
    cy.get('.alert-modal.error .alert-body .alert-icon.error-icon').should('exist');
    cy.get('.alert-modal.error .alert-message').should('contain.text', 'Error body');
  });

  it('confirm flow resolves true/false depending on button click; overlay does not close', () => {
    mountWithProvider();
    cy.get('[data-cy="btn-confirm"]').click();
    cy.get('.alert-modal.confirm').should('exist');
    // overlay should not close confirm dialogs
    cy.get('.alert-overlay').click('center');
    cy.get('.alert-modal.confirm').should('exist');
    // cancel -> false
    cy.get('.alert-btn-cancel').click();
    cy.get('[data-cy="confirm-result"]').should('contain.text', 'false');

    // open again and confirm -> true
    cy.get('[data-cy="btn-confirm"]').click();
    cy.get('.alert-btn-confirm').click();
    cy.get('[data-cy="confirm-result"]').should('contain.text', 'true');
  });

  it('custom confirm shows custom button texts', () => {
    mountWithProvider();
    cy.get('[data-cy="btn-confirm-custom"]').click();
    cy.get('.alert-modal.confirm .alert-btn-confirm').should('contain.text', 'Yes');
    cy.get('.alert-modal.confirm .alert-btn-cancel').should('contain.text', 'No');
  });

  it('only latest alert is displayed when multiple are pushed', () => {
    mountWithProvider();
    cy.get('[data-cy="btn-two"]').click();
    cy.get('.alert-modal .alert-message').should('contain.text', 'Second');
    cy.get('.alert-modal .alert-message').should('not.contain.text', 'First');
  });

  it('debounce prevents second alert within 50ms', () => {
    mountWithProvider();
    cy.clock();
    cy.get('[data-cy="btn-debounce"]').click();
    // Only one alert should appear (Debounce A)
    cy.get('.alert-modal .alert-message').should('contain.text', 'Debounce A');
  });

  it('warning with autoClose removes itself after duration', () => {
    mountWithProvider();
    cy.clock();
    cy.get('[data-cy="btn-autoclose"]').click();
    cy.get('.alert-modal.warning').should('exist');
    cy.tick(500);
    cy.get('.alert-modal').should('not.exist');
  });

  it('removeLast hides current alert when programmatically removed', () => {
    mountWithProvider();
    cy.get('[data-cy="btn-info"]').click();
    cy.get('.alert-modal').should('exist');
    cy.get('[data-cy="btn-remove"]').click();
    cy.get('.alert-modal').should('not.exist');
  });
});
