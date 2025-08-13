import React from 'react';
import { mount } from 'cypress/react18';
import { MemoryRouter } from 'react-router-dom';
import TeacherLayout from '../../../src/components/TeacherLayout';

describe('TeacherLayout (Component)', () => {
  const mountWithRouter = (component, initialEntries = ['/teacher']) => {
    return mount(
      <MemoryRouter initialEntries={initialEntries}>
        {component}
      </MemoryRouter>
    );
  };

  it('renders the teacher dashboard layout', () => {
    mountWithRouter(<TeacherLayout />);
    cy.get('.teacher-dashboard').should('exist');
    cy.get('.sidebar').should('exist');
    cy.get('.main-content').should('exist');
  });

  it('displays the sidebar header', () => {
    mountWithRouter(<TeacherLayout />);
    cy.get('.sidebar .header').should('contain', 'Teacher Dashboard');
  });

  it('renders all navigation links', () => {
    mountWithRouter(<TeacherLayout />);
    cy.get('.nav .nav-item').should('have.length', 4);
    
    cy.get('.nav-item').eq(0).should('contain', 'Dashboard');
    cy.get('.nav-item').eq(1).should('contain', 'Students');
    cy.get('.nav-item').eq(2).should('contain', 'Reports');
    cy.get('.nav-item').eq(3).should('contain', 'Settings');
  });

  it('has correct navigation icons', () => {
    mountWithRouter(<TeacherLayout />);
    
    cy.get('.nav-item').eq(0).find('i').should('have.class', 'fas fa-home');
    cy.get('.nav-item').eq(1).find('i').should('have.class', 'fas fa-users');
    cy.get('.nav-item').eq(2).find('i').should('have.class', 'fas fa-chart-bar');
    cy.get('.nav-item').eq(3).find('i').should('have.class', 'fas fa-cog');
  });

  it('has correct navigation links with href attributes', () => {
    mountWithRouter(<TeacherLayout />);
    
    cy.get('.nav-item').eq(0).should('have.attr', 'href', '/teacher');
    cy.get('.nav-item').eq(1).should('have.attr', 'href', '/teacher/students');
    cy.get('.nav-item').eq(2).should('have.attr', 'href', '/teacher/reports');
    cy.get('.nav-item').eq(3).should('have.attr', 'href', '/teacher/settings');
  });

  describe('Active Navigation States', () => {
    it('marks dashboard as active when on /teacher route', () => {
      mountWithRouter(<TeacherLayout />, ['/teacher']);
      cy.get('.nav-item').eq(0).should('have.class', 'active');
      cy.get('.nav-item').eq(1).should('not.have.class', 'active');
      cy.get('.nav-item').eq(2).should('not.have.class', 'active');
      cy.get('.nav-item').eq(3).should('not.have.class', 'active');
    });

    it('marks students as active when on /teacher/students route', () => {
      mountWithRouter(<TeacherLayout />, ['/teacher/students']);
      cy.get('.nav-item').eq(0).should('not.have.class', 'active');
      cy.get('.nav-item').eq(1).should('have.class', 'active');
      cy.get('.nav-item').eq(2).should('not.have.class', 'active');
      cy.get('.nav-item').eq(3).should('not.have.class', 'active');
    });

    it('marks reports as active when on /teacher/reports route', () => {
      mountWithRouter(<TeacherLayout />, ['/teacher/reports']);
      cy.get('.nav-item').eq(0).should('not.have.class', 'active');
      cy.get('.nav-item').eq(1).should('not.have.class', 'active');
      cy.get('.nav-item').eq(2).should('have.class', 'active');
      cy.get('.nav-item').eq(3).should('not.have.class', 'active');
    });

    it('marks settings as active when on /teacher/settings route', () => {
      mountWithRouter(<TeacherLayout />, ['/teacher/settings']);
      cy.get('.nav-item').eq(0).should('not.have.class', 'active');
      cy.get('.nav-item').eq(1).should('not.have.class', 'active');
      cy.get('.nav-item').eq(2).should('not.have.class', 'active');
      cy.get('.nav-item').eq(3).should('have.class', 'active');
    });

    it('has no active navigation when on other routes', () => {
      mountWithRouter(<TeacherLayout />, ['/teacher/tasks/123']);
      cy.get('.nav-item.active').should('not.exist');
    });
  });

  describe('Layout Structure', () => {
    it('has proper CSS classes for layout components', () => {
      mountWithRouter(<TeacherLayout />);
      cy.get('.teacher-dashboard').should('exist');
      cy.get('.teacher-dashboard .sidebar').should('exist');
      cy.get('.teacher-dashboard .main-content').should('exist');
      cy.get('.sidebar .header').should('exist');
      cy.get('.sidebar .nav').should('exist');
    });

    it('sidebar contains navigation elements', () => {
      mountWithRouter(<TeacherLayout />);
      cy.get('.sidebar').within(() => {
        cy.get('.header').should('exist');
        cy.get('.nav').should('exist');
        cy.get('.nav-item').should('have.length', 4);
      });
    });

    it('main content area exists for child routes', () => {
      mountWithRouter(<TeacherLayout />);
      cy.get('.main-content').should('exist');
    });
  });

  describe('Navigation Accessibility', () => {
    it('navigation items are clickable', () => {
      mountWithRouter(<TeacherLayout />);
      cy.get('.nav-item').each(($link) => {
        cy.wrap($link).should('be.visible');
        cy.wrap($link).should('not.be.disabled');
      });
    });

    it('has semantic navigation structure', () => {
      mountWithRouter(<TeacherLayout />);
      cy.get('.nav').should('exist');
      cy.get('.nav .nav-item').should('have.length', 4);
    });

    it('navigation links have proper text content', () => {
      mountWithRouter(<TeacherLayout />);
      
      const expectedTexts = ['Dashboard', 'Students', 'Reports', 'Settings'];
      cy.get('.nav-item').each(($link, index) => {
        cy.wrap($link).should('contain.text', expectedTexts[index]);
      });
    });
  });

  describe('Responsive Design Elements', () => {
    it('maintains layout structure across different viewport sizes', () => {
      mountWithRouter(<TeacherLayout />);
      
      // Test desktop view
      cy.viewport(1200, 800);
      cy.get('.teacher-dashboard').should('exist');
      cy.get('.sidebar').should('exist');
      cy.get('.main-content').should('exist');
      
      // Test tablet view
      cy.viewport(768, 1024);
      cy.get('.teacher-dashboard').should('exist');
      cy.get('.sidebar').should('exist');
      cy.get('.main-content').should('exist');
      
      // Test mobile view
      cy.viewport(375, 667);
      cy.get('.teacher-dashboard').should('exist');
      cy.get('.sidebar').should('exist');
      cy.get('.main-content').should('exist');
    });
  });

  describe('Router Integration', () => {
    it('uses React Router Link components', () => {
      mountWithRouter(<TeacherLayout />);
      
      // Verify that the navigation items are Link components
      cy.get('.nav-item').should('have.length', 4);
      cy.get('.nav-item').each(($link) => {
        cy.wrap($link).should('have.attr', 'href');
      });
    });

    it('renders Outlet for nested routes', () => {
      mountWithRouter(<TeacherLayout />);
      cy.get('.main-content').should('exist');
    });
  });
});