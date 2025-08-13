/// <reference types="cypress" />

import React from 'react';
import VideoUpload from '../../../src/components/VideoUpload.jsx';

// Helper to stub window.fetch with a handler
const stubFetch = (handler) => {
  cy.window().then((win) => {
    cy.stub(win, 'fetch').callsFake((url, options = {}) => handler(url, options));
  });
};

describe('VideoUpload (Component)', () => {
  it('shows error for invalid file type before any network call', () => {
    // isCreateMode=true avoids initial GET; invalid type check runs before upload
    cy.mount(<VideoUpload taskId={null} isCreateMode={true} />);

    cy.get('#video-file-input').selectFile({
      contents: Cypress.Buffer.from('not a video'),
      fileName: 'image.png',
      mimeType: 'image/png',
    }, { force: true });

    cy.get('.upload-error').should('contain.text', 'valid video format');
  });

  it('shows network error when upload POST fails', () => {
    // Stub GET task details ok, then POST upload rejects (network error)
    stubFetch((url, options = {}) => {
      if (/\/api\/tasks\/123$/.test(url) && !options.method) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      if (/\/api\/tasks\/123\/video$/.test(url) && options.method === 'POST') {
        return Promise.reject(new Error('fail'));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    cy.mount(<VideoUpload taskId={123} isCreateMode={false} />);

    // Provide a valid MP4 file
    cy.get('#video-file-input').selectFile({
      contents: Cypress.Buffer.from('fake mp4 content'),
      fileName: 'sample.mp4',
      mimeType: 'video/mp4',
    }, { force: true });

    cy.get('.upload-error').should('contain.text', 'Network error');
  });

  it('successful local upload renders current video and can be removed', () => {
    // First GET ok, then POST ok returns file info, then DELETE ok
    stubFetch((url, options = {}) => {
      if (/\/api\/tasks\/123$/.test(url) && !options.method) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      if (/\/api\/tasks\/123\/video$/.test(url) && options.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ filename: 'sample.mp4', video_url: '/uploads/videos/sample.mp4' }),
        });
      }
      if (/\/api\/tasks\/123\/video$/.test(url) && options.method === 'DELETE') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    cy.mount(<VideoUpload taskId={123} isCreateMode={false} />);

    cy.get('#video-file-input').selectFile({
      contents: Cypress.Buffer.from('fake mp4 content'),
      fileName: 'sample.mp4',
      mimeType: 'video/mp4',
    }, { force: true });

    cy.get('.current-video .video-title').should('contain.text', 'Local Video File');
    cy.get('.current-video .video-details').should('contain.text', 'sample.mp4');

    // Remove video
    cy.get('.remove-video-btn').click();
    cy.get('.current-video').should('not.exist');
  });

  it('sets YouTube video successfully and clears input', () => {
    const yt = 'https://www.youtube.com/watch?v=abc123';
    stubFetch((url, options = {}) => {
      if (/\/api\/tasks\/555$/.test(url) && !options.method) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      if (/\/api\/tasks\/555\/youtube$/.test(url) && options.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    cy.mount(<VideoUpload taskId={555} isCreateMode={false} />);
    // wait for loading to finish and options to render
    cy.get('.upload-options', { timeout: 8000 }).should('be.visible');
    cy.get('.youtube-option-btn').click();
    cy.get('.youtube-upload-section', { timeout: 8000 }).should('be.visible');
    cy.get('.youtube-upload-section', { timeout: 8000 }).find('input#youtube-url').type(yt);
    cy.get('.youtube-save-btn').click();
    cy.get('.current-video .video-title').should('contain.text', 'YouTube Video');
    cy.get('.youtube-upload-section').should('not.exist');
    cy.get('.upload-error').should('not.exist');
  });

  it('shows server error when YouTube POST returns non-ok', () => {
    const yt = 'https://www.youtube.com/watch?v=bad001';
    stubFetch((url, options = {}) => {
      if (/\/api\/tasks\/777$/.test(url) && !options.method) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      if (/\/api\/tasks\/777\/youtube$/.test(url) && options.method === 'POST') {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Invalid URL' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    cy.mount(<VideoUpload taskId={777} isCreateMode={false} />);
    cy.get('.upload-options', { timeout: 8000 }).should('be.visible');
    cy.get('.youtube-option-btn').click();
    cy.get('.youtube-upload-section', { timeout: 8000 }).should('be.visible').find('input#youtube-url').type(yt);
    cy.get('.youtube-save-btn').click();
    cy.get('.upload-error').should(($el) => {
      const t = $el.text();
      expect(t).to.match(/Failed to set YouTube video|Invalid URL/);
    });
  });

  it('shows network error when YouTube POST fails', () => {
    const yt = 'https://youtu.be/err123';
    stubFetch((url, options = {}) => {
      if (/\/api\/tasks\/778$/.test(url) && !options.method) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      if (/\/api\/tasks\/778\/youtube$/.test(url) && options.method === 'POST') {
        return Promise.reject(new Error('net'));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    cy.mount(<VideoUpload taskId={778} isCreateMode={false} />);
    cy.get('.youtube-option-btn').click();
    cy.get('.youtube-upload-section', { timeout: 8000 }).should('be.visible').find('input#youtube-url').type(yt);
    cy.get('.youtube-save-btn').click();
    cy.get('.upload-error').should('contain.text', 'Network error');
  });

  it('drag-drop invalid file type shows type error', () => {
    cy.mount(<VideoUpload taskId={123} isCreateMode={false} />);
    // Ensure local upload is active
    cy.get('.local-upload-btn').click();
    // Drag-drop an image file
    cy.get('.upload-area').selectFile({
      contents: Cypress.Buffer.from('not a video'),
      fileName: 'image.png',
      mimeType: 'image/png',
    }, { action: 'drag-drop', force: true });
    cy.get('.upload-error').should('contain.text', 'valid video format');
  });

  it('create mode hides upload options and blocks local upload with message', () => {
    cy.mount(<VideoUpload taskId={null} isCreateMode={true} />);
    cy.get('.create-mode-warning').should('be.visible');
    cy.get('.upload-options').should('not.exist');
    // Local blocked after file select (hidden input is still present)
    cy.get('#video-file-input').selectFile({
      contents: Cypress.Buffer.from('fake mp4 content'),
      fileName: 'sample.mp4',
      mimeType: 'video/mp4',
    }, { force: true });
    cy.get('.upload-error').should('contain.text', 'Please save the task first before uploading videos');
  });

  it('remove video shows network error when DELETE fails', () => {
    // Upload succeeds to create currentVideo, then DELETE fails
    stubFetch((url, options = {}) => {
      if (/\/api\/tasks\/901$/.test(url) && !options.method) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      if (/\/api\/tasks\/901\/video$/.test(url) && options.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ filename: 'z.mp4', video_url: '/uploads/videos/z.mp4' }),
        });
      }
      if (/\/api\/tasks\/901\/video$/.test(url) && options.method === 'DELETE') {
        return Promise.reject(new Error('delete failed'));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    cy.mount(<VideoUpload taskId={901} isCreateMode={false} />);
    cy.get('#video-file-input').selectFile({
      contents: Cypress.Buffer.from('fake mp4 content'),
      fileName: 'z.mp4',
      mimeType: 'video/mp4',
    }, { force: true });
    cy.get('.remove-video-btn').click();
    cy.get('.upload-error').should('contain.text', 'Network error occurred while removing video');
  });

  it('fetches existing YouTube video on mount (task details success)', () => {
    stubFetch((url, options = {}) => {
      if (/\/api\/tasks\/42$/.test(url) && !options.method) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ video_type: 'youtube', video_url: 'https://www.youtube.com/watch?v=abc123' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    cy.mount(<VideoUpload taskId={42} isCreateMode={false} />);
    cy.get('.current-video .video-title', { timeout: 8000 }).should('contain.text', 'YouTube Video');
    cy.get('.youtube-embed iframe').should('exist');
  });

  it('shows error when fetching task details fails', () => {
    stubFetch((url, options = {}) => {
      if (/\/api\/tasks\/43$/.test(url) && !options.method) {
        return Promise.reject(new Error('get failed'));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    cy.mount(<VideoUpload taskId={43} isCreateMode={false} />);
    cy.get('.upload-error', { timeout: 8000 }).should('contain.text', 'Failed to load video information');
  });

  it('shows uploading spinner and disables input during local upload (delayed POST)', () => {
    stubFetch((url, options = {}) => {
      if (/\/api\/tasks\/44$/.test(url) && !options.method) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      if (/\/api\/tasks\/44\/video$/.test(url) && options.method === 'POST') {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ ok: true, json: () => Promise.resolve({ filename: 't.mp4', video_url: '/uploads/videos/t.mp4' }) });
          }, 1000);
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    cy.mount(<VideoUpload taskId={44} isCreateMode={false} />);
    cy.get('.local-upload-section', { timeout: 8000 }).should('be.visible');
    cy.get('#video-file-input').selectFile({
      contents: Cypress.Buffer.from('fake mp4 content'),
      fileName: 't.mp4',
      mimeType: 'video/mp4',
    }, { force: true });
    cy.get('.upload-content .fa-spinner', { timeout: 5000 }).should('exist');
    cy.get('#video-file-input').should('be.disabled');
    cy.get('.current-video .video-title', { timeout: 8000 }).should('contain.text', 'Local Video File');
  });

  it('video preview fallback shows when video element errors', () => {
    // Upload a local video first
    stubFetch((url, options = {}) => {
      if (/\/api\/tasks\/45$/.test(url) && !options.method) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      if (/\/api\/tasks\/45\/video$/.test(url) && options.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ filename: 'f.mp4', video_url: '/uploads/videos/f.mp4' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    cy.mount(<VideoUpload taskId={45} isCreateMode={false} />);
    cy.get('#video-file-input').selectFile({
      contents: Cypress.Buffer.from('fake mp4 content'),
      fileName: 'f.mp4',
      mimeType: 'video/mp4',
    }, { force: true });

    cy.get('.local-video-container video').then(($v) => {
      const el = $v.get(0);
      el.dispatchEvent(new Event('error'));
    });
    cy.get('.video-error-fallback').should('have.css', 'display', 'block');
  });

  it('local upload non-ok without error uses default message', () => {
    stubFetch((url, options = {}) => {
      if (/\/api\/tasks\/46$/.test(url) && !options.method) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      if (/\/api\/tasks\/46\/video$/.test(url) && options.method === 'POST') {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    cy.mount(<VideoUpload taskId={46} isCreateMode={false} />);
    cy.get('#video-file-input').selectFile({
      contents: Cypress.Buffer.from('fake mp4 content'),
      fileName: 'bad.mp4',
      mimeType: 'video/mp4',
    }, { force: true });
    cy.get('.upload-error').should('contain.text', 'Failed to upload video');
  });

  it('local upload with missing filename falls back to video_url parsing', () => {
    stubFetch((url, options = {}) => {
      if (/\/api\/tasks\/47$/.test(url) && !options.method) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      if (/\/api\/tasks\/47\/video$/.test(url) && options.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ video_url: '/uploads/videos/fallback.mp4' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    cy.mount(<VideoUpload taskId={47} isCreateMode={false} />);
    cy.get('#video-file-input').selectFile({
      contents: Cypress.Buffer.from('fake mp4 content'),
      fileName: 'x.mp4',
      mimeType: 'video/mp4',
    }, { force: true });
    cy.get('.current-video .video-details').should('contain.text', 'fallback.mp4');
  });

  it('without taskId and not create mode, local upload blocked with proper message', () => {
    cy.mount(<VideoUpload taskId={null} isCreateMode={false} />);
    cy.get('.upload-options', { timeout: 8000 }).should('be.visible');
    cy.get('#video-file-input').selectFile({
      contents: Cypress.Buffer.from('fake mp4 content'),
      fileName: 'n.mp4',
      mimeType: 'video/mp4',
    }, { force: true });
    cy.get('.upload-error').should('contain.text', 'Please select a file and ensure task ID is available');
  });

  it('YouTube uploading disables input and save button during request', () => {
    const yt = 'https://www.youtube.com/watch?v=delay123';
    stubFetch((url, options = {}) => {
      if (/\/api\/tasks\/48$/.test(url) && !options.method) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      if (/\/api\/tasks\/48\/youtube$/.test(url) && options.method === 'POST') {
        return new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({ ok: true }) }), 1000));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    cy.mount(<VideoUpload taskId={48} isCreateMode={false} />);
    cy.get('.upload-options').should('be.visible');
    cy.get('.youtube-option-btn').click();
    cy.get('.youtube-upload-section').find('input#youtube-url').type(yt);
    cy.get('.youtube-save-btn').click();
    cy.get('.youtube-save-btn').should('be.disabled');
    cy.get('input#youtube-url').should('be.disabled');
    cy.get('.current-video .video-title', { timeout: 8000 }).should('contain.text', 'YouTube Video');
  });

  it('YouTube with missing taskId shows save-first error', () => {
    const yt = 'https://www.youtube.com/watch?v=needtask';
    stubFetch(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
    cy.mount(<VideoUpload taskId={null} isCreateMode={false} />);
    cy.get('.upload-options').should('be.visible');
    cy.get('.youtube-option-btn').click();
    cy.get('.youtube-upload-section').find('input#youtube-url').type(yt);
    cy.get('.youtube-save-btn').click();
    cy.get('.upload-error').should('contain.text', 'Please save the task first before adding YouTube videos');
  });

  it('disables YouTube save when URL is empty (guarded by UI state)', () => {
    stubFetch((url, options = {}) => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
    cy.mount(<VideoUpload taskId={60} isCreateMode={false} />);
    cy.get('.upload-options').should('be.visible');
    cy.get('.youtube-option-btn').click();
    cy.get('.youtube-upload-section').find('input#youtube-url').should('have.value', '');
    cy.get('.youtube-save-btn').should('be.disabled');
    // even with spaces, still disabled due to trim()
    cy.get('input#youtube-url').type('   ');
    cy.get('.youtube-save-btn').should('be.disabled');
  });

  it('DELETE non-ok surfaces server error message', () => {
    stubFetch((url, options = {}) => {
      if (/\/api\/tasks\/61$/.test(url) && !options.method) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      if (/\/api\/tasks\/61\/video$/.test(url) && options.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ filename: 'r.mp4', video_url: '/uploads/videos/r.mp4' }) });
      }
      if (/\/api\/tasks\/61\/video$/.test(url) && options.method === 'DELETE') {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Cannot remove' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    cy.mount(<VideoUpload taskId={61} isCreateMode={false} />);
    cy.get('#video-file-input').selectFile({ contents: Cypress.Buffer.from('x'), fileName: 'r.mp4', mimeType: 'video/mp4' }, { force: true });
    cy.get('.remove-video-btn').click();
    cy.get('.upload-error').should('contain.text', 'Cannot remove');
  });

  it('fetch task details with local video uses video_path when url is null string', () => {
    stubFetch((url, options = {}) => {
      if (/\/api\/tasks\/62$/.test(url) && !options.method) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ video_type: 'local', video_url: 'null', video_path: 'abc.mp4' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    cy.mount(<VideoUpload taskId={62} isCreateMode={false} />);
    cy.get('.current-video .video-title', { timeout: 8000 }).should('contain.text', 'Local Video File');
    cy.get('.current-video .video-details').should('contain.text', 'abc.mp4');
  });

  it('successful local upload works with webm type too', () => {
    stubFetch((url, options = {}) => {
      if (/\/api\/tasks\/63$/.test(url) && !options.method) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      if (/\/api\/tasks\/63\/video$/.test(url) && options.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ filename: 'w.webm', video_url: '/uploads/videos/w.webm' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    cy.mount(<VideoUpload taskId={63} isCreateMode={false} />);
    cy.get('#video-file-input').selectFile({ contents: Cypress.Buffer.from('webm'), fileName: 'w.webm', mimeType: 'video/webm' }, { force: true });
    cy.get('.current-video .video-title').should('contain.text', 'Local Video File');
    cy.get('.current-video .video-details').should('contain.text', 'w.webm');
  });

  it('local upload non-ok shows server error message if provided', () => {
    stubFetch((url, options = {}) => {
      if (/\/api\/tasks\/64$/.test(url) && !options.method) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      if (/\/api\/tasks\/64\/video$/.test(url) && options.method === 'POST') {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Upload failed' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    cy.mount(<VideoUpload taskId={64} isCreateMode={false} />);
    cy.get('#video-file-input').selectFile({ contents: Cypress.Buffer.from('x'), fileName: 'err.mp4', mimeType: 'video/mp4' }, { force: true });
    cy.get('.upload-error').should('contain.text', 'Upload failed');
  });

  it('local upload with absolute http video_url sets video src to that URL', () => {
    stubFetch((url, options = {}) => {
      if (/\/api\/tasks\/65$/.test(url) && !options.method) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      if (/\/api\/tasks\/65\/video$/.test(url) && options.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ video_url: 'http://example.com/x.mp4' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    cy.mount(<VideoUpload taskId={65} isCreateMode={false} />);
    cy.get('#video-file-input').selectFile({ contents: Cypress.Buffer.from('x'), fileName: 'x.mp4', mimeType: 'video/mp4' }, { force: true });
    cy.get('.local-video-container video').should('have.attr', 'src', 'http://example.com/x.mp4');
  });

  it('drag-drop valid mp4 triggers upload success path', () => {
    stubFetch((url, options = {}) => {
      if (/\/api\/tasks\/66$/.test(url) && !options.method) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      if (/\/api\/tasks\/66\/video$/.test(url) && options.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ filename: 'd.mp4', video_url: '/uploads/videos/d.mp4' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    cy.mount(<VideoUpload taskId={66} isCreateMode={false} />);
    cy.get('.local-upload-section').should('be.visible');
    cy.get('.upload-area').selectFile({ contents: Cypress.Buffer.from('x'), fileName: 'd.mp4', mimeType: 'video/mp4' }, { action: 'drag-drop', force: true });
    cy.get('.current-video .video-details').should('contain.text', 'd.mp4');
  });

  it('drag-drop oversized video shows size error (100MB limit)', () => {
    stubFetch((url, options = {}) => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
    cy.mount(<VideoUpload taskId={67} isCreateMode={false} />);
    cy.get('.local-upload-section').should('be.visible');
    const bigFake = { name: 'big.mp4', type: 'video/mp4', size: 101 * 1024 * 1024 };
    cy.get('.upload-area').trigger('drop', { dataTransfer: { files: [bigFake] } });
    cy.get('.upload-error').should('contain.text', 'Maximum size: 100MB');
  });

  it('YouTube accepts youtu.be short link and embeds correctly', () => {
    const yt = 'https://youtu.be/xyz789';
    stubFetch((url, options = {}) => {
      if (/\/api\/tasks\/68$/.test(url) && !options.method) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      if (/\/api\/tasks\/68\/youtube$/.test(url) && options.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    cy.mount(<VideoUpload taskId={68} isCreateMode={false} />);
    cy.get('.upload-options').should('be.visible');
    cy.get('.youtube-option-btn').click();
    cy.get('.youtube-upload-section').find('input#youtube-url').type(yt);
    cy.get('.youtube-save-btn').click();
    cy.get('.youtube-embed iframe', { timeout: 8000 }).should('have.attr', 'src').and('match', /embed\/xyz789/);
  });


  it('triggers file input click when upload area is clicked (lines 414-416)', () => {
    // Mock fetch for normal mode
    stubFetch((url, options = {}) => {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    
    // Create a spy for the file input click
    cy.mount(<VideoUpload taskId={70} isCreateMode={false} />);
    cy.get('.upload-options', { timeout: 8000 }).should('be.visible');
    cy.get('.local-upload-btn').click();
    cy.get('.local-upload-section').should('be.visible');
    
    // Mock the file input element and its click method
    cy.get('input#video-file-input').then($input => {
      const clickSpy = cy.spy($input[0], 'click').as('fileInputClick');
      
      // Click on the upload area (should trigger fileInput.click())
      cy.get('.upload-area').click();
      cy.get('@fileInputClick').should('have.been.called');
    });
  });

  it('handles file input change with invalid file type', () => {
    // Mock fetch for normal mode
    stubFetch((url, options = {}) => {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    
    cy.mount(<VideoUpload taskId={71} isCreateMode={false} />);
    cy.get('.upload-options', { timeout: 8000 }).should('be.visible');
    cy.get('.local-upload-btn').click();
    
    // Try uploading an invalid file type
    const invalidFile = { name: 'test.txt', type: 'text/plain', size: 1024 };
    cy.get('input[type="file"]').then($input => {
      const dataTransfer = new DataTransfer();
      const file = new File(['fake text'], 'test.txt', { type: 'text/plain' });
      dataTransfer.items.add(file);
      $input[0].files = dataTransfer.files;
      $input[0].dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    cy.get('.upload-error').should('contain.text', 'valid video format');
  });

  it('handles oversized file upload via input (lines 188-189)', () => {
    // Mock fetch for normal mode
    stubFetch((url, options = {}) => {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    
    cy.mount(<VideoUpload taskId={72} isCreateMode={false} />);
    cy.get('.upload-options', { timeout: 8000 }).should('be.visible');
    cy.get('.local-upload-btn').click();
    
    // Create a file that's too large (>100MB)
    cy.get('input[type="file"]').then($input => {
      // Mock a large file
      const largeFile = new File(['x'.repeat(101 * 1024 * 1024)], 'large.mp4', { type: 'video/mp4' });
      Object.defineProperty(largeFile, 'size', { value: 101 * 1024 * 1024, writable: false });
      
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(largeFile);
      $input[0].files = dataTransfer.files;
      $input[0].dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    // Should show file size error (lines 188-189)
    cy.get('.upload-error').should('contain.text', 'Maximum size: 100MB');
  });
});
