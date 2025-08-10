/// <reference types="cypress" />

// Student Accessibility page E2E tests
// Route: /student/accessibility (requires user.role === 'stu')

describe('StudentAccessibility settings', () => {
  const seedStudent = () => {
    const student = { role: 'stu', user_id: 2001, username: 'st2001@stu.com', real_name: 'Student One' };
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('user_data', JSON.stringify(student));
      }
    });
  };

  const goToAccessibility = () => {
    seedStudent();
    // Ensure speechSynthesis exists to avoid browser differences
    cy.window().then((win) => {
      if (!win.speechSynthesis) {
        win.speechSynthesis = {
          cancel: cy.stub().as('ttsCancel'),
          speak: cy.stub().as('ttsSpeak'),
          getVoices: () => [{ lang: 'en-US', name: 'Samantha' }],
          addEventListener: () => {},
          removeEventListener: () => {}
        };
      }
    });
    cy.visit('/student/accessibility');
    cy.contains('h1', 'Accessibility Settings Center', { timeout: 10000 }).should('be.visible');
  };

  const getBody = () => cy.get('body');

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('renders header and basic controls', () => {
    goToAccessibility();
    cy.get('.accessibility-header').should('be.visible');
    cy.contains('.control-card h3', 'Font Size').should('exist');
    cy.contains('.control-card h3', 'Color Theme').should('exist');
    cy.contains('.control-card h3', 'High Contrast Mode').should('exist');
  });

  it('changes font size via select and applies to body style', () => {
    goToAccessibility();
    cy.contains('.control-card h3', 'Font Size').parent().find('select').select('150');
    getBody().should('have.attr', 'style').and('match', /font-size:\s*150%/i);
    cy.contains('.control-card h3', 'Font Size').parent().find('select').select('200');
    getBody().should('have.attr', 'style').and('match', /font-size:\s*200%/i);
  });

  // Replaced: switches color theme ... -> Accessibility attributes behavior
  it('toggle buttons update aria-pressed correctly (High Contrast, Color Blind)', () => {
    goToAccessibility();
    // High Contrast
    cy.contains('.control-card h3', 'High Contrast Mode').parent().find('button').as('hc');
    cy.get('@hc').should('have.attr', 'aria-pressed', 'false');
    cy.get('@hc').click().should('have.attr', 'aria-pressed', 'true');
    // Color Blind
    cy.contains('.control-card h3', 'Color Blind Assistance').parent().find('button').as('cb');
    cy.get('@cb').should('have.attr', 'aria-pressed', 'false');
    cy.get('@cb').click().should('have.attr', 'aria-pressed', 'true');
  });

  it('toggles High Contrast Mode (body.high-contrast)', () => {
    goToAccessibility();
    cy.contains('.control-card h3', 'High Contrast Mode').parent().find('button').as('btn');
    cy.get('@btn').click();
    getBody().should('have.class', 'high-contrast');
    cy.get('@btn').click();
    getBody().should('not.have.class', 'high-contrast');
  });

  it('toggles Color Blind Assistance (body.colorblind)', () => {
    goToAccessibility();
    cy.contains('.control-card h3', 'Color Blind Assistance').parent().find('button').as('btn');
    cy.get('@btn').click();
    getBody().should('have.class', 'colorblind');
    cy.get('@btn').click();
    getBody().should('not.have.class', 'colorblind');
  });

  it('toggles Reduce Motion (body.reduce-motion)', () => {
    goToAccessibility();
    cy.contains('.control-card h3', 'Reduce Motion').parent().find('button').as('btn');
    cy.get('@btn').click();
    getBody().should('have.class', 'reduce-motion');
    cy.get('@btn').click();
    getBody().should('not.have.class', 'reduce-motion');
  });

  it('toggles Enhanced Keyboard Navigation and Reading Guide', () => {
    goToAccessibility();
    cy.contains('.control-section h2', 'Navigation Settings').parent().within(() => {
      cy.contains('.control-card h3', 'Enhanced Keyboard Navigation').parent().find('button').as('kbdBtn');
      cy.contains('.control-card h3', 'Reading Guide').parent().find('button').as('readBtn');
    });
    cy.get('@kbdBtn').click();
    getBody().should('have.class', 'keyboard-nav-enhanced');
    cy.get('@readBtn').click();
    getBody().should('have.class', 'reading-guide');
  });

  it('toggles Focus Mode (body.focus-mode)', () => {
    goToAccessibility();
    cy.contains('.control-card h3', 'Focus Mode').parent().find('button').as('btn');
    cy.get('@btn').click();
    getBody().should('have.class', 'focus-mode');
    cy.get('@btn').click();
    getBody().should('not.have.class', 'focus-mode');
  });

  // Replaced: enables Global TTS ... -> Visual effect of Focus Mode
  it('Focus Mode dims header and keyboard shortcuts (opacity 0.3) and restores on toggle off', () => {
    goToAccessibility();
    cy.contains('.control-card h3', 'Focus Mode').parent().find('button').as('focusBtn');
    cy.get('@focusBtn').click();
    cy.get('.accessibility-header').should('have.css', 'opacity', '0.3');
    cy.get('.keyboard-shortcuts').should('have.css', 'opacity', '0.3');
    // Toggle off -> back to full opacity (computed 1)
    cy.get('@focusBtn').click();
    cy.get('.accessibility-header').should('have.css', 'opacity', '1');
    cy.get('.keyboard-shortcuts').should('have.css', 'opacity', '1');
  });

  it('Reset All Settings clears classes, font size and TTS settings', () => {
    goToAccessibility();
    // Turn on a few settings first
    cy.contains('.control-card h3', 'High Contrast Mode').parent().find('button').click();
    cy.contains('.control-card h3', 'Color Theme').parent().find('select').select('darkMode');
    cy.contains('.control-card h3', 'Font Size').parent().find('select').select('150');
    cy.contains('.control-card h3', 'Text-to-Speech').parent().find('.tts-enable-setting input[type="checkbox"]').check({ force: true });
    // Reset
    cy.get('.reset-btn').click();
    // Classes cleared and font size back to 100%
    getBody().should('not.have.class', 'high-contrast')
      .and('not.have.class', 'theme-darkMode')
      .and('not.have.class', 'theme-yellowBlack')
      .and(($b) => {
        expect($b.attr('style') || '').to.match(/font-size:\s*100%/i);
      });
    // TTS disabled in storage
    cy.window().then((win) => {
      const saved = JSON.parse(win.localStorage.getItem('student-tts-settings'));
      expect(saved).to.include({ enabled: false, rate: 1, pitch: 1 });
    });
  });
});


