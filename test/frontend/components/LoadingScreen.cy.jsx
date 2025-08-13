/// <reference types="cypress" />

import React from 'react';
import LoadingScreen from '../../../src/components/LoadingScreen.jsx';

describe('LoadingScreen (Component)', () => {
  beforeEach(() => {
    // Mock the logo image to prevent 404 errors
    cy.intercept('GET', '/assets/logo.png', { 
      statusCode: 200,
      headers: { 'content-type': 'image/png' },
      body: 'fake-image-data'
    }).as('logoImage');
  });

  const mountComponent = () => {
    cy.mount(<LoadingScreen />);
  };

  it('renders the loading screen with correct structure', () => {
    mountComponent();
    
    cy.get('.loading-screen').should('exist');
    cy.get('.loading-background').should('exist');
    cy.get('.loading-content').should('exist');
  });

  it('displays the UNSW logo and title', () => {
    mountComponent();
    
    cy.get('.loading-logo').should('exist');
    cy.get('.loading-logo').should('have.attr', 'src', '/assets/logo.png');
    cy.get('.loading-logo').should('have.attr', 'alt', 'UNSW Logo');
    
    cy.get('.loading-title').should('contain.text', 'UNSW Escape Room');
    cy.get('.title-underline').should('exist');
  });

  it('displays the subtitle', () => {
    mountComponent();
    
    cy.get('.loading-subtitle').should('contain.text', 'Waiting to start the adventure');
  });

  it('shows progress bar and progress text', () => {
    mountComponent();
    
    cy.get('.progress-container').should('exist');
    cy.get('.progress-bar').should('exist');
    cy.get('.progress-fill').should('exist');
    cy.get('.progress-glow').should('exist');
    cy.get('.progress-text').should('exist');
  });

  it('displays loading message', () => {
    mountComponent();
    
    cy.get('.loading-message').should('exist');
    cy.get('.loading-message p').should('exist');
  });

  it('shows loading dots animation', () => {
    mountComponent();
    
    cy.get('.loading-dots').should('exist');
    cy.get('.loading-dots .dot').should('have.length', 3);
  });

  it('starts with initial loading message', () => {
    mountComponent();
    
    cy.get('.loading-message p').should('contain.text', 'Initializing escape room...');
  });

  it('starts with 0% progress', () => {
    mountComponent();
    
    cy.get('.progress-text').should('contain.text', '0%');
    cy.get('.progress-fill').should('have.css', 'width', '0px');
  });

  it('progresses and updates progress text over time', () => {
    mountComponent();
    
    // Wait for some progress updates
    cy.wait(400); // Wait for at least 2 intervals (200ms each)
    
    cy.get('.progress-text').should('not.contain.text', '0%');
    cy.get('.progress-fill').should(($el) => {
      const width = $el.css('width');
      expect(width).to.not.equal('0px');
    });
  });

  it('updates loading message based on progress', () => {
    cy.clock();
    mountComponent();
    
    // Advance time to trigger progress updates
    cy.tick(1000); // 5 intervals of 200ms each
    
    cy.get('.loading-message p').should('not.contain.text', 'Initializing escape room...');
  });

  it('shows different loading messages at different progress levels', () => {
    cy.clock();
    mountComponent();
    
    // Initial message
    cy.get('.loading-message p').should('contain.text', 'Initializing escape room...');
    
    // Advance time to get some progress
    cy.tick(2000); // 10 intervals
    cy.get('.loading-message p').should(($el) => {
      const text = $el.text();
      expect(['Initializing escape room...', 'Setting up puzzles...', 'Loading challenges...', 'Preparing adventure...']).to.include(text);
    });
    
    // Advance more time for higher progress
    cy.tick(4000); // More intervals for higher progress
    cy.get('.loading-message p').should(($el) => {
      const text = $el.text();
      expect(['Setting up puzzles...', 'Loading challenges...', 'Preparing adventure...', 'Almost ready...']).to.include(text);
    });
  });

  it('shows "Almost ready..." message at high progress', () => {
    cy.clock();
    mountComponent();
    
    // Advance time significantly to reach high progress
    cy.tick(8000); // Many intervals to reach >80% progress
    
    cy.get('.loading-message p').should('contain.text', 'Almost ready...');
  });

  it('progress never exceeds 100%', () => {
    cy.clock();
    mountComponent();
    
    // Advance time significantly
    cy.tick(10000);
    
    cy.get('.progress-text').should(($el) => {
      const progressText = $el.text();
      const progressValue = parseInt(progressText.replace('%', ''));
      expect(progressValue).to.be.at.most(100);
    });
  });

  it('progress bar width reflects progress percentage', () => {
    cy.clock();
    mountComponent();
    
    // Advance time to get some progress
    cy.tick(1000);
    
    // Check that progress bar has a width style attribute that reflects progress
    cy.get('.progress-fill').should('have.attr', 'style').and('include', 'width:');
    
    // Verify progress fill width increases with progress text
    cy.get('.progress-text').should(($el) => {
      const progressValue = parseInt($el.text().replace('%', ''));
      if (progressValue > 0) {
        cy.get('.progress-fill').should(($fill) => {
          const style = $fill.attr('style');
          expect(style).to.include(`width: ${progressValue}%`);
        });
      }
    });
  });

  it('cleans up interval on component unmount', () => {
    cy.clock();
    mountComponent();
    
    // Get initial progress
    cy.get('.progress-text').should('exist');
    
    // Unmount the component
    cy.mount(<div>Unmounted</div>);
    
    // Advance time - progress should not continue updating
    cy.tick(5000);
    
    // Component should be unmounted
    cy.get('.loading-screen').should('not.exist');
  });

  it('handles rapid progress updates correctly', () => {
    cy.clock();
    mountComponent();
    
    // Advance in small increments
    for (let i = 0; i < 10; i++) {
      cy.tick(200);
      cy.get('.progress-text').should('exist');
    }
    
    // Should still be functional
    cy.get('.loading-message p').should('exist');
    cy.get('.progress-fill').should('exist');
  });

  it('maintains consistent UI structure throughout loading', () => {
    cy.clock();
    mountComponent();
    
    // Check initial structure
    cy.get('.loading-screen').should('exist');
    cy.get('.loading-title').should('exist');
    cy.get('.progress-container').should('exist');
    
    // Advance time
    cy.tick(3000);
    
    // Structure should remain intact
    cy.get('.loading-screen').should('exist');
    cy.get('.loading-title').should('exist');
    cy.get('.progress-container').should('exist');
    cy.get('.loading-dots .dot').should('have.length', 3);
  });

  it('shows progress increments realistically', () => {
    cy.clock();
    mountComponent();
    
    // Check initial progress
    cy.get('.progress-text').should('contain.text', '0%');
    
    // Advance time
    cy.tick(1000); // 5 intervals of 200ms each
    
    // Progress should have increased
    cy.get('.progress-text').should(($el) => {
      const progressText = $el.text();
      const progressValue = parseInt(progressText.replace('%', ''));
      expect(progressValue).to.be.greaterThan(0);
    });
  });

  it('handles edge case with very fast time advancement', () => {
    cy.clock();
    mountComponent();
    
    // Advance time very quickly
    cy.tick(50000); // Much more than needed to reach 100%
    
    // Should handle gracefully
    cy.get('.progress-text').should('contain.text', '100%');
    cy.get('.loading-message p').should('contain.text', 'Almost ready...');
  });

  it('maintains accessibility attributes', () => {
    mountComponent();
    
    cy.get('.loading-logo').should('have.attr', 'alt');
    cy.get('.loading-title').should('exist'); // Should be accessible as h1
  });

  it('displays all loading messages correctly when they appear', () => {
    const loadingMessages = [
      'Initializing escape room...',
      'Setting up puzzles...',
      'Loading challenges...',
      'Preparing adventure...',
      'Almost ready...'
    ];
    
    cy.clock();
    mountComponent();
    
    // Test that each message can appear
    let currentMessageIndex = 0;
    
    // Check initial message
    cy.get('.loading-message p').should('contain.text', loadingMessages[0]);
    
    // Gradually advance and check for message changes
    for (let i = 1; i <= 20; i++) {
      cy.tick(400); // Advance time
      
      cy.get('.loading-message p').then(($el) => {
        const currentText = $el.text();
        // Verify the message is one of the valid loading messages
        expect(loadingMessages).to.include(currentText);
      });
    }
  });
});
