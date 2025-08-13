import React from 'react';
import { mount } from 'cypress/react18';
import TeacherSettings from '../../../src/components/TeacherSettings';

describe('TeacherSettings (Component)', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.window().then((win) => {
      win.localStorage.clear();
    });

    // Mock user data in localStorage
    cy.window().then((win) => {
      const userData = {
        username: 'teacher123',
        real_name: 'John Teacher',
        role: 'teacher'
      };
      win.localStorage.setItem('user_data', JSON.stringify(userData));
    });
  });

  describe('Basic Rendering', () => {
    it('renders the settings container', () => {
      mount(<TeacherSettings />);
      
      cy.get('.teacher-settings-container').should('exist');
      cy.get('.settings-header').should('exist');
      cy.get('.settings-content').should('exist');
    });

    it('displays correct header information', () => {
      mount(<TeacherSettings />);
      
      cy.get('.settings-header h1').should('contain', 'Teacher Settings');
      cy.get('.settings-header p').should('contain', 'Manage your account preferences and system settings');
      cy.get('.settings-header i.fas.fa-cog').should('exist');
    });

    it('renders all settings cards', () => {
      mount(<TeacherSettings />);
      
      cy.get('.settings-card').should('have.length', 4);
    });
  });

  describe('Account Information Section', () => {
    it('displays account information correctly', () => {
      mount(<TeacherSettings />);
      
      cy.get('.settings-card').first().within(() => {
        cy.get('h2').should('contain', 'Account Information');
        cy.get('i.fas.fa-user').should('exist');
        
        cy.get('.info-item').should('have.length', 3);
        cy.get('.info-item').first().should('contain', 'Username:');
        cy.get('.info-item').first().should('contain', 'teacher123');
        
        cy.get('.info-item').eq(1).should('contain', 'Real Name:');
        cy.get('.info-item').eq(1).should('contain', 'John Teacher');
        
        cy.get('.info-item').eq(2).should('contain', 'Role:');
        cy.get('.info-item').eq(2).should('contain', 'Teacher');
      });
    });

    it('handles missing real name gracefully', () => {
      cy.window().then((win) => {
        const userData = {
          username: 'teacher123',
          role: 'teacher'
        };
        win.localStorage.setItem('user_data', JSON.stringify(userData));
      });

      mount(<TeacherSettings />);
      
      cy.get('.info-item').eq(1).should('contain', 'Not set');
    });
  });

  describe('Notification Settings', () => {
    it('renders notification settings with correct defaults', () => {
      mount(<TeacherSettings />);
      
      cy.get('.settings-card').eq(1).within(() => {
        cy.get('h2').should('contain', 'Notification Settings');
        cy.get('i.fas.fa-bell').should('exist');
        
        // Check default states
        cy.get('input[type="checkbox"]').eq(0).should('be.checked'); // emailNotifications
        cy.get('input[type="checkbox"]').eq(1).should('be.checked'); // taskReminders
        cy.get('input[type="checkbox"]').eq(2).should('not.be.checked'); // gradingNotifications
      });
    });

    it('toggles notification settings', () => {
      mount(<TeacherSettings />);
      
      cy.get('.settings-card').eq(1).within(() => {
        // Toggle email notifications - use force: true for hidden checkboxes
        cy.get('input[type="checkbox"]').first().uncheck({ force: true });
        cy.get('input[type="checkbox"]').first().should('not.be.checked');
        
        // Toggle grading notifications
        cy.get('input[type="checkbox"]').eq(2).check({ force: true });
        cy.get('input[type="checkbox"]').eq(2).should('be.checked');
      });
    });

    it('displays correct labels and descriptions', () => {
      mount(<TeacherSettings />);
      
      cy.get('.settings-card').eq(1).within(() => {
        cy.get('label').should('contain', 'Email Notifications');
        cy.get('label').should('contain', 'Task Reminders');
        cy.get('label').should('contain', 'Grading Notifications');
        
        cy.get('.setting-description').should('contain', 'Receive important system notification emails');
        cy.get('.setting-description').should('contain', 'Send reminders before task deadlines');
        cy.get('.setting-description').should('contain', 'Notify me when new student submissions arrive');
      });
    });
  });

  describe('Interface Settings', () => {
    it('renders interface settings with correct defaults', () => {
      mount(<TeacherSettings />);
      
      cy.get('.settings-card').eq(2).within(() => {
        cy.get('h2').should('contain', 'Interface Settings');
        cy.get('i.fas.fa-paint-brush').should('exist');
        
        // Check theme selector
        cy.get('select').first().should('have.value', 'light');
        cy.get('select').first().find('option').should('have.length', 3);
        
        // Check language selector
        cy.get('select').eq(1).should('have.value', 'en');
        cy.get('select').eq(1).find('option').should('have.length', 2);
      });
    });

    it('changes theme settings', () => {
      mount(<TeacherSettings />);
      
      cy.get('.settings-card').eq(2).within(() => {
        cy.get('select').first().select('dark');
        cy.get('select').first().should('have.value', 'dark');
      });
    });

    it('changes language settings', () => {
      mount(<TeacherSettings />);
      
      cy.get('.settings-card').eq(2).within(() => {
        cy.get('select').eq(1).select('zh');
        cy.get('select').eq(1).should('have.value', 'zh');
      });
    });

    it('has correct theme options', () => {
      mount(<TeacherSettings />);
      
      cy.get('.settings-card').eq(2).within(() => {
        cy.get('select').first().within(() => {
          cy.get('option[value="light"]').should('contain', 'Light Theme');
          cy.get('option[value="dark"]').should('contain', 'Dark Theme');
          cy.get('option[value="auto"]').should('contain', 'Follow System');
        });
      });
    });

    it('has correct language options', () => {
      mount(<TeacherSettings />);
      
      cy.get('.settings-card').eq(2).within(() => {
        cy.get('select').eq(1).within(() => {
          cy.get('option[value="zh"]').should('contain', 'Chinese');
          cy.get('option[value="en"]').should('contain', 'English');
        });
      });
    });
  });

  describe('Work Preferences', () => {
    it('renders work preferences with correct defaults', () => {
      mount(<TeacherSettings />);
      
      cy.get('.settings-card').eq(3).within(() => {
        cy.get('h2').should('contain', 'Work Preferences');
        cy.get('i.fas.fa-tasks').should('exist');
        
        // Check default task type
        cy.get('select').should('have.value', 'quiz');
        
        // Check checkboxes
        cy.get('input[type="checkbox"]').eq(0).should('be.checked'); // autoSave
        cy.get('input[type="checkbox"]').eq(1).should('be.checked'); // showPreview
      });
    });

    it('changes default task type', () => {
      mount(<TeacherSettings />);
      
      cy.get('.settings-card').eq(3).within(() => {
        cy.get('select').select('puzzle');
        cy.get('select').should('have.value', 'puzzle');
      });
    });

    it('toggles work preference checkboxes', () => {
      mount(<TeacherSettings />);
      
      cy.get('.settings-card').eq(3).within(() => {
        // Toggle auto save - use force: true for potentially hidden checkboxes
        cy.get('input[type="checkbox"]').first().uncheck({ force: true });
        cy.get('input[type="checkbox"]').first().should('not.be.checked');
        
        // Toggle show preview
        cy.get('input[type="checkbox"]').eq(1).uncheck({ force: true });
        cy.get('input[type="checkbox"]').eq(1).should('not.be.checked');
      });
    });

    it('has correct task type options', () => {
      mount(<TeacherSettings />);
      
      cy.get('.settings-card').eq(3).within(() => {
        cy.get('select option').should('have.length', 4);
        cy.get('select option[value="quiz"]').should('contain', 'Quiz');
        cy.get('select option[value="puzzle"]').should('contain', 'Puzzle Game');
        cy.get('select option[value="matching"]').should('contain', 'Matching Task');
        cy.get('select option[value="fill-blank"]').should('contain', 'Fill in the Blank');
      });
    });
  });

  describe('Save Functionality', () => {
    it('saves settings to localStorage successfully', () => {
      mount(<TeacherSettings />);
      
      // Make some changes
      cy.get('.settings-card').eq(1).within(() => {
        cy.get('input[type="checkbox"]').first().uncheck();
      });
      
      // Save settings
      cy.get('.save-btn').click();
      
      // Check success message
      cy.get('.settings-message').should('contain', 'Settings saved successfully!');
      
      // Verify settings are saved to localStorage
      cy.window().then((win) => {
        const savedSettings = win.localStorage.getItem('teacher-settings');
        expect(savedSettings).to.exist;
        const settings = JSON.parse(savedSettings);
        expect(settings.emailNotifications).to.be.false;
      });
    });

    it('shows loading state when saving', () => {
      mount(<TeacherSettings />);
      
      cy.get('.save-btn').click();
      
      // Button should be disabled during saving
      cy.get('.save-btn').should('be.disabled');
      cy.get('.save-btn').should('contain', 'Saving...');
      
      // After saving completes
      cy.get('.save-btn').should('not.be.disabled');
      cy.get('.save-btn').should('contain', 'Save Settings');
    });

    it('clears success message after timeout', () => {
      mount(<TeacherSettings />);
      
      cy.get('.save-btn').click();
      cy.get('.settings-message').should('contain', 'Settings saved successfully!');
      
      // Message should disappear after 3 seconds
      cy.get('.settings-message', { timeout: 3500 }).should('not.exist');
    });

    it('handles save error and shows error message', () => {
      mount(<TeacherSettings />);
      
      // Mock localStorage.setItem to throw error
      cy.window().then((win) => {
        cy.stub(win.Storage.prototype, 'setItem').throws(new Error('Storage error'));
      });
      
      cy.get('.save-btn').click();
      
      // Should show error message
      cy.get('.settings-message').should('contain', 'Error saving settings, please try again.');
      
      // Error message should disappear after 3 seconds
      cy.get('.settings-message', { timeout: 3500 }).should('not.exist');
    });

    it('tests all setting change handlers', () => {
      mount(<TeacherSettings />);
      
      // Test all checkbox changes with force: true
      cy.get('input[type="checkbox"]').each(($checkbox, index) => {
        if (!$checkbox.prop('checked')) {
          cy.wrap($checkbox).check({ force: true });
          cy.wrap($checkbox).should('be.checked');
        } else {
          cy.wrap($checkbox).uncheck({ force: true });
          cy.wrap($checkbox).should('not.be.checked');
        }
      });
      
      // Test all select changes
      cy.get('select').each(($select) => {
        cy.wrap($select).find('option').then(($options) => {
          if ($options.length > 1) {
            // Select the second option
            cy.wrap($select).select($options.eq(1).val());
          }
        });
      });
    });
  });

  describe('Reset to Defaults', () => {
    it('resets all settings to default values', () => {
      mount(<TeacherSettings />);
      
      // Make some changes
      cy.get('.settings-card').eq(1).within(() => {
        cy.get('input[type="checkbox"]').first().uncheck();
      });
      cy.get('.settings-card').eq(2).within(() => {
        cy.get('select').first().select('dark');
      });
      
      // Reset to defaults
      cy.get('.reset-btn').click();
      
      // Check that settings are reset
      cy.get('.settings-card').eq(1).within(() => {
        cy.get('input[type="checkbox"]').first().should('be.checked');
      });
      cy.get('.settings-card').eq(2).within(() => {
        cy.get('select').first().should('have.value', 'light');
      });
      
      cy.get('.settings-message').should('contain', 'Settings reset to default values');
    });
  });

  describe('Settings Persistence', () => {
    it('loads saved settings from localStorage on mount', () => {
      // Pre-populate localStorage with custom settings
      cy.window().then((win) => {
        const customSettings = {
          emailNotifications: false,
          theme: 'dark',
          language: 'zh',
          defaultTaskType: 'puzzle'
        };
        win.localStorage.setItem('teacher-settings', JSON.stringify(customSettings));
      });
      
      mount(<TeacherSettings />);
      
      // Verify settings are loaded correctly
      cy.get('.settings-card').eq(1).within(() => {
        cy.get('input[type="checkbox"]').first().should('not.be.checked');
      });
      cy.get('.settings-card').eq(2).within(() => {
        cy.get('select').first().should('have.value', 'dark');
        cy.get('select').eq(1).should('have.value', 'zh');
      });
      cy.get('.settings-card').eq(3).within(() => {
        cy.get('select').should('have.value', 'puzzle');
      });
    });
  });

  describe('Action Buttons', () => {
    it('renders save and reset buttons', () => {
      mount(<TeacherSettings />);
      
      cy.get('.settings-actions').should('exist');
      cy.get('.save-btn').should('exist');
      cy.get('.save-btn').should('contain', 'Save Settings');
      cy.get('.reset-btn').should('exist');
      cy.get('.reset-btn').should('contain', 'Reset to Default');
    });

    it('save button is not disabled by default', () => {
      mount(<TeacherSettings />);
      
      cy.get('.save-btn').should('not.be.disabled');
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and structure', () => {
      mount(<TeacherSettings />);
      
      cy.get('h1').should('exist');
      cy.get('h2').should('have.length', 4);
      cy.get('label').should('have.length.at.least', 8);
    });

    it('has semantic HTML structure', () => {
      mount(<TeacherSettings />);
      
      cy.get('.settings-card').each(($card) => {
        cy.wrap($card).find('h2').should('exist');
      });
    });
  });

  describe('Error Handling', () => {
    it('handles missing user data gracefully', () => {
      cy.window().then((win) => {
        win.localStorage.removeItem('user_data');
      });
      
      mount(<TeacherSettings />);
      
      // Should still render without crashing
      cy.get('.teacher-settings-container').should('exist');
    });

    it('handles invalid localStorage data gracefully', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('teacher-settings', 'invalid-json');
      });
      
      mount(<TeacherSettings />);
      
      // Should render with default settings
      cy.get('.teacher-settings-container').should('exist');
    });
  });
});