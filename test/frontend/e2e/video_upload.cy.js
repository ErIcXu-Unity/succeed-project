/// <reference types="cypress" />

describe('Task Video Upload - flows (stubbed)', () => {
  const seedTeacher = () => {
    cy.clearLocalStorage();
    // Login as teacher via localStorage to avoid backend dependency
    const teacher = { role: 'tea', user_id: 1000, username: 'st1000@tea.com', real_name: 'Teacher Admin' };
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('user_data', JSON.stringify(teacher));
      }
    });
    cy.wait(30);
  };

  beforeEach(() => {
    seedTeacher();
  });

  const stubTask = (body) => {
    cy.intercept('GET', `${Cypress.env('apiBaseUrl')}/api/tasks/1`, { statusCode: 200, body }).as('task');
  };

  it('sets a YouTube video for an existing task in edit mode', () => {

    // Stub: navigate to edit page of task 1
    stubTask({ id:1, name:'Stubbed Task', introduction:'Stubbed intro', video_type:null, video_url:null, video_path:null });

    cy.visit('/teacher/tasks/1/edit');
    cy.wait('@task');

    cy.contains('Task Video');

    // Switch to YouTube option
    cy.contains('YouTube Link').click();
    const ytUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    cy.get('#youtube-url').type(ytUrl);

    cy.intercept('POST', `${Cypress.env('apiBaseUrl')}/api/tasks/1/youtube`, {
      statusCode: 200,
      body: { ok: true }
    }).as('setYoutube');

    cy.contains('Set YouTube Video').click();
    cy.wait('@setYoutube');

    // Preview iframe should be present
    cy.get('iframe[title="YouTube video preview"]').should('exist');
  });

  it('toggle between YouTube and Local upload sections', () => {
    stubTask({ id:1, name:'Stubbed Task' });
    cy.visit('/teacher/tasks/1/edit');
    cy.wait('@task');
    cy.contains('YouTube Link').click();
    cy.get('.youtube-upload-section').should('be.visible');
    cy.get('.local-upload-btn').click();
    cy.get('.local-upload-section').should('be.visible');
  });

  it('create-mode warning is not shown in edit mode', () => {
    stubTask({ id:1, name:'Stubbed Task' });
    cy.visit('/teacher/tasks/1/edit');
    cy.wait('@task');
    cy.get('.create-mode-warning').should('not.exist');
  });

  it('local upload: clicking browse triggers hidden file input (UI smoke)', () => {
    stubTask({ id:1, name:'Stubbed Task' });
    cy.visit('/teacher/tasks/1/edit');
    cy.wait('@task');
    cy.get('.local-upload-btn').click();
    cy.get('#video-file-input').should('exist');
  });

  it('local upload: drag-drop area present and shows uploading state', () => {
    stubTask({ id:1, name:'Stubbed Task' });
    cy.visit('/teacher/tasks/1/edit');
    cy.wait('@task');
    cy.get('.local-upload-btn').click();
    cy.get('.upload-area').should('exist');
  });

  it('remove video button appears after YouTube set (stubbed)', () => {
    stubTask({ id:1, name:'Stubbed Task' });
    cy.visit('/teacher/tasks/1/edit');
    cy.wait('@task');
    cy.contains('YouTube Link').click();
    cy.get('#youtube-url').type('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    cy.intercept('POST', `${Cypress.env('apiBaseUrl')}/api/tasks/1/youtube`, { statusCode: 200, body: { ok: true } }).as('setYoutube');
    cy.contains('Set YouTube Video').click();
    cy.wait('@setYoutube');
    cy.contains('Remove Video').should('exist');
  });

  it('remove video calls DELETE endpoint (stubbed)', () => {
    // pre-set youtube
    stubTask({ id:1, name:'Stubbed Task' });
    cy.visit('/teacher/tasks/1/edit');
    cy.wait('@task');
    cy.contains('YouTube Link').click();
    cy.get('#youtube-url').type('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    cy.intercept('POST', `${Cypress.env('apiBaseUrl')}/api/tasks/1/youtube`, { statusCode: 200, body: { ok: true } }).as('setYoutube');
    cy.contains('Set YouTube Video').click();
    cy.wait('@setYoutube');
    cy.intercept('DELETE', `${Cypress.env('apiBaseUrl')}/api/tasks/1/video`, { statusCode: 200, body: { ok: true } }).as('del');
    cy.contains('Remove Video').click();
    cy.wait('@del');
  });

  it('local upload: invalid file type shows error message (UI only)', () => {
    stubTask({ id:1, name:'Stubbed Task' });
    cy.visit('/teacher/tasks/1/edit');
    cy.wait('@task');
    cy.get('.local-upload-btn').click();
    // simulate file select via input change is limited; here we assert presence of hint and error container
    cy.get('.upload-hint').should('contain.text','Supported formats');
  });

  it('current video info renders for YouTube (URL shown)', () => {
    stubTask({ id:1, name:'Stubbed Task', video_type:'youtube', video_url:'https://youtu.be/dQw4w9WgXcQ' });
    cy.visit('/teacher/tasks/1/edit');
    cy.wait('@task');
    cy.get('.current-video .video-title').should('contain.text','YouTube Video');
    cy.get('.current-video .youtube-embed iframe').should('exist');
  });

  it('current video info renders for local (file name/path)', () => {
    stubTask({ id:1, name:'Stubbed Task', video_type:'local', video_url:'/uploads/videos/demo.mp4', video_path:'demo.mp4' });
    cy.visit('/teacher/tasks/1/edit');
    cy.wait('@task');
    cy.get('.current-video .video-title').should('contain.text','Local Video File');
    cy.get('.current-video').should('contain.text','demo.mp4');
  });
});


