// Cypress Component Testing support (React 18)
import '@cypress/code-coverage/support';
import { mount } from 'cypress/react18';

Cypress.Commands.add('mount', mount);

// Optionally, place common CT setup here (e.g., global styles)
// import '../../../src/index.css';
