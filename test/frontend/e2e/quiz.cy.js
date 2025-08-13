/// <reference types="cypress" />

const goToFirstTaskQuiz = () => {
  // Navigate to first task intro then to quiz
  cy.get('.card-grid .task-card').then((cards) => {
    if (cards.length > 0) {
      cy.wrap(cards[0]).find('a').click();
      cy.location('pathname').should('match', /\/student\/tasks\/\d+\/intro/);
      // Navigate to quiz page if intro page provides link/button, else navigate directly by replacing "intro" with "quiz"
      cy.location('pathname').then((p) => {
        const quizPath = p.replace('/intro', '/quiz');
        cy.visit(quizPath);
      });
    }
  });
};

describe('Task Quiz - All Question Types', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('answers different question types and submits', () => {
    cy.visit('/');
    cy.wait(30);
    cy.loginAs('stu').then((res) => {
      if (res.status !== 200) {
        cy.log('Backend not available; skipping quiz E2E');
        return;
      }
      cy.reload();
      cy.location('pathname', { timeout: 6000 }).should('include', '/student/home');

      // Load tasks and progress
      cy.intercept('GET', `${Cypress.env('apiBaseUrl')}/api/tasks*`).as('tasks');
      cy.intercept('GET', `${Cypress.env('apiBaseUrl')}/api/students/*/task-progress`).as('progress');
      cy.wait(['@tasks', '@progress']);

      // Go to a quiz page
      goToFirstTaskQuiz();

      // Wait questions load
      cy.intercept('GET', `${Cypress.env('apiBaseUrl')}/api/tasks/*/questions`).as('questions');
      cy.wait('@questions');
      cy.contains('Loading quiz...', { timeout: 10000 }).should('not.exist');

      // Iterate nav buttons to try answering
      cy.get('.question-navigation .nav-button').then(($btns) => {
        const count = $btns.length;
        if (count === 0) return;

        for (let i = 0; i < count; i++) {
          cy.get('.question-navigation .nav-button').eq(i).click();

          // Try single choice options
          cy.get('.options-grid .option-button').then(($opts) => {
            if ($opts.length > 0) {
              cy.wrap($opts[0]).click();
              return;
            }
          });

          // Try multiple choice checkboxes
          cy.get('.multiple-choice-options input[type="checkbox"]').then(($checks) => {
            if ($checks.length > 0) {
              cy.wrap($checks).first().check({ force: true });
              return;
            }
          });

          // Try fill-blank inputs
          cy.get('input.fill-blank-input').then(($inputs) => {
            if ($inputs.length > 0) {
              cy.wrap($inputs[0]).clear().type('test');
              return;
            }
          });

          // Puzzle game: drag first fragment into assembly if present
          cy.get('.fragment-bank .puzzle-fragment').then(($frags) => {
            if ($frags.length > 0) {
              const dataTransfer = new DataTransfer();
              cy.wrap($frags[0])
                .trigger('dragstart', { dataTransfer })
                .wait(50);
              cy.get('.assembly-workspace')
                .trigger('dragover', { dataTransfer })
                .trigger('drop', { dataTransfer })
                .wait(50);
            }
          });

          // Matching task: click-based fallback (select first left then first right)
          cy.get('.matching-task-question .left-item').then(($left) => {
            if ($left.length > 0) {
              cy.wrap($left[0]).click();
              cy.get('.matching-task-question .right-item').first().click();
            }
          });
        }
      });

      // Save & Exit should work when any answers exist
      cy.get('.save-exit-btn').then(($btn) => {
        if (!$btn.prop('disabled')) {
          cy.intercept('POST', `${Cypress.env('apiBaseUrl')}/api/tasks/*/save-progress`).as('save');
          cy.wrap($btn).click();
          cy.wait('@save').its('response.statusCode').should('be.oneOf', [200, 400]);
        }
      });
    });
  });

  // Helper to seed a logged-in student and visit quiz directly
  const visitQuizAsStudent = (taskId = 1, fixedSeed = 12345) => {
    const student = { role: 'stu', user_id: 2001, username: 'st2001@stu.com', real_name: 'Student 2001' };
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('user_data', JSON.stringify(student));
        // Seed a deterministic quiz session to avoid random order flakiness
        const sessionKey = `quiz_session_${student.user_id}_${taskId}`;
        win.localStorage.setItem(sessionKey, JSON.stringify({ seed: fixedSeed, completed: false, startTime: new Date().toISOString() }));
      }
    });
    cy.wait(30);
    cy.visit(`/student/tasks/${taskId}/quiz`);
  };

  const stubQuizApis = (taskId = 1, questions = []) => {
    cy.intercept('GET', '**/api/tasks/' + taskId, { statusCode: 200, body: { id: taskId, name: 'Stubbed Task ' + taskId } }).as('task');
    cy.intercept('GET', '**/api/tasks/' + taskId + '/questions', { statusCode: 200, body: questions }).as('questions');
  };

  const baseQuestions = [
    // Use the structure expected by InteractiveQuestionRenderer (single_choice needs `options` map)
    { id: 11, question_type: 'single_choice', question: '1+1=?', options: { A: '1', B: '2', C: '3', D: '4' }, correct_answer: 'B', score: 3, difficulty: 'Easy' },
    { id: 12, question_type: 'multiple_choice', question: 'Primes?', score: 3, difficulty: 'Easy', question_data: { options: ['2', '3', '4', '5'], correct_answers: [0,1,3] } },
    { id: 13, question_type: 'fill_blank', question: 'The capital of {{country}} is {{capital}}.', score: 4, difficulty: 'Medium', question_data: { blank_answers: ['France', 'Paris'] } }
  ];

  // Generic helper to answer whatever is on screen (single/multiple/fill)
  const answerAnyCurrentQuestion = () => {
    cy.get('body').then(($body) => {
      if ($body.find('.question-interaction .options-grid .option-button').length) {
        cy.get('.question-interaction .options-grid .option-button').first().click();
        return;
      }
      if ($body.find('.multiple-choice-options input[type="checkbox"]').length) {
        cy.get('.multiple-choice-options input[type="checkbox"]').first().check({ force: true });
        return;
      }
      const blanks = $body.find('input.fill-blank-input');
      if (blanks.length) {
        // fill all blanks to satisfy validation
        cy.get('input.fill-blank-input').each(($inp) => {
          cy.wrap($inp).clear().type('test');
        });
        return;
      }
    });
  };

  it('loads quiz with stubbed questions and renders navigation', () => {
    stubQuizApis(1, baseQuestions);
    visitQuizAsStudent(1);
    cy.wait(['@task', '@questions']);
    cy.get('.question-navigation .nav-button').should('have.length', 3);
    cy.contains('Question 1 of 3');
  });

  it('navigates via Next and Previous and updates progress text', () => {
    stubQuizApis(1, baseQuestions);
    cy.intercept('GET', '**/api/tasks/1/progress*', { statusCode: 200, body: { has_progress: false } }).as('progress');
    visitQuizAsStudent(1);
    cy.wait(['@task', '@questions', '@progress']);
    cy.contains('Question 1 of 3');
    cy.contains('button', 'Next').click();
    cy.contains('Question 2 of 3');
    cy.contains('button', 'Next').click();
    cy.contains('Question 3 of 3');
    cy.contains('button', 'Previous').click();
    cy.contains('Question 2 of 3');
  });

  it('Save & Exit enables after any answer and posts save-progress', () => {
    stubQuizApis(1, baseQuestions);
    cy.intercept('GET', '**/api/tasks/1/progress*', { statusCode: 200, body: { has_progress: false } }).as('progress');
    // Match any task id just in case
    cy.intercept('POST', '**/api/tasks/*/save-progress', { statusCode: 200, body: { ok: true } }).as('save');
    visitQuizAsStudent(1);
    cy.wait(['@task', '@questions', '@progress']);
    cy.get('.question-interaction', { timeout: 10000 }).should('exist');
    answerAnyCurrentQuestion();
    // Prefer robust header text over CSS class which can be delayed by React batching
    cy.contains(/Answered:\s*[1-9]\s*\/\s*\d+/, { timeout: 10000 });
    // Still check nav indicator when available
    cy.get('.question-navigation .nav-button.answered', { timeout: 10000 }).should('have.length.at.least', 1);
    cy.get('.save-exit-btn').should('not.be.disabled').click();
    cy.wait('@save');
  });

  it('restores saved progress after re-entering quiz (shows answered counter > 0)', () => {
    // First entry: no prior progress → Save immediately per product rule
    stubQuizApis(1, baseQuestions);
    cy.intercept('GET', '**/api/tasks/1/progress*', { statusCode: 200, body: { has_progress: false } }).as('progressEmpty');
    cy.intercept('POST', '**/api/tasks/1/save-progress', { statusCode: 200 }).as('save');
    visitQuizAsStudent(1);
    cy.wait(['@task', '@questions', '@progressEmpty']);
    cy.get('.question-interaction', { timeout: 10000 }).should('exist');
    answerAnyCurrentQuestion();
    cy.contains(/Answered:\s*[1-9]\s*\/\s*\d+/, { timeout: 10000 });
    cy.get('.question-navigation .nav-button.answered', { timeout: 10000 }).should('have.length.at.least', 1);
    cy.get('.save-exit-btn').should('not.be.disabled').click();
    cy.wait('@save');
    cy.location('pathname').should('include', '/student/home');

    // Re-enter: backend reports saved progress (original answers & original index)
    stubQuizApis(1, baseQuestions);
    cy.intercept('GET', '**/api/tasks/1/progress*', {
      statusCode: 200,
      body: {
        has_progress: true,
        current_question_index: 0,
        // Use multiple_choice answer which restores reliably via index mapping
        answers: { '12': [0] }
      }
    }).as('progressRestored');
    cy.visit('/student/tasks/1/quiz');
    cy.wait(['@task', '@questions', '@progressRestored']);
    cy.contains(/Answered:\s*[1-3]\s*\/\s*3/);
  });

  it('Previous is disabled on first and enabled after going Next', () => {
    stubQuizApis(1, baseQuestions);
    cy.intercept('GET', '**/api/tasks/1/progress*', { statusCode: 200, body: { has_progress: false } }).as('progress');
    visitQuizAsStudent(1);
    cy.wait(['@task', '@questions', '@progress']);
    cy.contains('button', 'Previous').should('be.disabled');
    cy.contains('button', 'Next').click();
    cy.contains('button', 'Previous').should('not.be.disabled');
  });

  it('progress bar width increases as you move forward', () => {
    stubQuizApis(1, baseQuestions);
    cy.intercept('GET', '**/api/tasks/1/progress*', { statusCode: 200, body: { has_progress: false } }).as('progress');
    visitQuizAsStudent(1);
    cy.wait(['@task', '@questions', '@progress']);
    // capture initial width style
    cy.get('.progress-fill').invoke('attr', 'style').then((style1) => {
      cy.contains('button', 'Next').click();
      cy.get('.progress-fill').invoke('attr', 'style').then((style2) => {
        expect(style1).to.not.equal(style2);
        cy.contains('button', 'Next').click();
        cy.get('.progress-fill').invoke('attr', 'style').then((style3) => {
          expect(style3).to.not.equal(style2);
        });
      });
    });
  });

  it('shows Offline indicator when network goes offline and back to Online when restored', () => {
    stubQuizApis(1, baseQuestions);
    cy.intercept('GET', '**/api/tasks/1/progress*', { statusCode: 200, body: { has_progress: false } }).as('progress');
    visitQuizAsStudent(1);
    cy.wait(['@task', '@questions', '@progress']);
    
    // Wait for network status to be initialized
    cy.get('.network-status').should('exist');
    
    // simulate offline/online
    cy.window().then((win) => win.dispatchEvent(new Event('offline')));
    cy.get('.network-status.offline').should('exist');
    cy.get('.network-status').should('contain.text', 'Offline');
    
    cy.window().then((win) => win.dispatchEvent(new Event('online')));
    cy.get('.network-status.online').should('exist');
    cy.get('.network-status').should('contain.text', 'Connected');
  });

  it('handles questions API error with friendly error UI', () => {
    cy.intercept('GET', '**/api/tasks/1', { statusCode: 200, body: { id: 1, name: 'Stubbed Task 1' } }).as('task');
    cy.intercept('GET', '**/api/tasks/1/questions', { statusCode: 500, body: { error: 'Server error' } }).as('questions');
    visitQuizAsStudent(1);
    cy.wait(['@task', '@questions']);
    cy.contains(/No questions available|Error loading quiz data|Failed to load/);
    cy.contains('Back to Task Intro');
  });

  it('renders image error fallback when image fails to load', () => {
    const questions = [
      { id: 21, question_type: 'single_choice', question: 'With image', option_a: 'a', option_b: 'b', option_c: 'c', option_d: 'd', correct_answer: 'A', score: 3, difficulty: 'Easy', image_url: '/non-existent.png' }
    ];
    stubQuizApis(1, questions);
    visitQuizAsStudent(1);
    cy.wait(['@task', '@questions']);
    cy.get('.question-image .media-error', { timeout: 10000 }).should('exist');
  });

  it('renders YouTube embed for video questions', () => {
    const questions = [
      { id: 31, question_type: 'single_choice', question: 'Video?', option_a: 'a', option_b: 'b', option_c: 'c', option_d: 'd', correct_answer: 'A', score: 3, difficulty: 'Easy', video_type: 'youtube', video_url: 'https://youtu.be/dQw4w9WgXcQ' }
    ];
    stubQuizApis(1, questions);
    visitQuizAsStudent(1);
    cy.wait(['@task', '@questions']);
    cy.get('.youtube-embed iframe').should('have.attr', 'src').and('include', 'youtube.com/embed');
  });

  it('Retry Quiz clears state and reloads questions', () => {
    stubQuizApis(1, baseQuestions);
    cy.intercept('GET', '**/api/tasks/1/progress*', { statusCode: 200, body: { has_progress: false } }).as('progress');
    cy.intercept('POST', '**/api/tasks/1/submit', { statusCode: 200, body: { total_score: 7, results: [] } }).as('submit');
    // Avoid autosave hitting real backend during navigation and retry
    cy.intercept('POST', '**/api/tasks/*/save-progress', { statusCode: 200, body: { ok: true } }).as('save');
    cy.intercept('DELETE', '**/api/tasks/*/progress*', { statusCode: 200, body: { ok: true } }).as('clearProgress');
    // Answer quickly all and submit to enter results page
    visitQuizAsStudent(1);
    cy.wait(['@task', '@questions', '@progress']);
    cy.get('.question-navigation .nav-button').its('length').then((len) => {
      for (let i = 0; i < len; i++) {
        cy.get('.question-navigation .nav-button').eq(i).click();
        answerAnyCurrentQuestion();
      }
    });
    cy.contains('Submit All Answers').click();
    cy.wait('@submit');
    cy.contains('Results');
    // Click Retry
    cy.contains('button', 'Retry Quiz').click();
    // Confirm retry in custom alert modal
    cy.get('.alert-modal.confirm', { timeout: 10000 }).should('be.visible');
    cy.contains('.alert-modal.confirm .alert-actions button', 'OK').click();
    // Should return to answering mode (presence of Next button)
    cy.contains('button', 'Next', { timeout: 10000 }).should('exist');
  });

  it('shows difficulty and points badges for current question', () => {
    stubQuizApis(1, baseQuestions);
    cy.intercept('GET', '**/api/tasks/1/progress*', { statusCode: 200, body: { has_progress: false } }).as('progress');
    visitQuizAsStudent(1);
    cy.wait(['@task', '@questions', '@progress']);
    // The first question after randomization may not be Easy; assert presence and valid value
    cy.get('.difficulty-badge').invoke('text').then((txt) => {
      expect(txt.trim()).to.match(/Easy|Medium|Hard/i);
    });
    cy.get('.points-badge').should('contain.text', 'points');
  });

  it('Back to Intro link navigates to intro page', () => {
    stubQuizApis(1, baseQuestions);
    cy.intercept('GET', '**/api/tasks/1/progress*', { statusCode: 200, body: { has_progress: false } }).as('progress');
    visitQuizAsStudent(1);
    cy.wait(['@task', '@questions', '@progress']);
    cy.get('a.back-link').click();
    cy.location('pathname').should('include', '/student/tasks/1/intro');
  });
});


