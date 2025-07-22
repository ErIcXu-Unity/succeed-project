import React, { useState } from 'react';
import InteractiveQuestionRenderer from './InteractiveQuestionRenderer';
import './QuestionRendererTest.css';

const QuestionRendererTest = () => {
  const [answers, setAnswers] = useState({});

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Test data for different question types
  const testQuestions = [
    {
      id: 1,
      question_type: 'single_choice',
      question_text: 'What is the chemical formula for water?',
      options: {
        'A': 'H2O',
        'B': 'CO2',
        'C': 'NaCl',
        'D': 'CH4'
      },
      correct_answer: 'A'
    },
    {
      id: 2,
      question_type: 'multiple_choice',
      question_text: 'Which of the following are noble gases?',
      question_data: {
        options: [
          'Helium (He)',
          'Oxygen (O2)',
          'Neon (Ne)',
          'Nitrogen (N2)',
          'Argon (Ar)'
        ]
      },
      correct_answer: [0, 2, 4] // Helium, Neon, Argon
    },
    {
      id: 3,
      question_type: 'fill_blank',
      question_text: 'Fill in the blanks about the periodic table.',
      question_data: {
        enhanced: true,
        template: 'The periodic table has {{element_count}} elements, organized by {{organization_method}}, and was created by {{scientist}}.',
        blanks: [
          {
            id: 0,
            placeholder: 'number of elements',
            options: {
              hints: ['It\'s more than 100', 'Current count is 118']
            }
          },
          {
            id: 1,
            placeholder: 'organization method',
            options: {
              hints: ['Based on a fundamental property', 'Increases across periods']
            }
          },
          {
            id: 2,
            placeholder: 'scientist name',
            options: {
              hints: ['Russian chemist', 'Last name starts with M']
            }
          }
        ]
      },
      correct_answer: ['118', 'atomic number', 'Mendeleev']
    },
    {
      id: 4,
      question_type: 'fill_blank',
      question_text: 'Complete the equation: H2 + Cl2 → _____ (Legacy format)',
      question_data: {
        blank_answers: ['2HCl']
      },
      correct_answer: ['2HCl']
    }
  ];

  return (
    <div className="question-renderer-test">
      <h1>Interactive Question Renderer Test</h1>
      <p>Test all question types to verify functionality:</p>
      
      {testQuestions.map((question) => (
        <div key={question.id} className="test-question-card">
          <div className="question-header">
            <h3>Question {question.id} - {question.question_type.replace('_', ' ').toUpperCase()}</h3>
            <span className="question-type-badge">{question.question_type}</span>
          </div>
          
          <div className="question-text">
            {question.question_text}
          </div>
          
          <div className="question-renderer">
            <InteractiveQuestionRenderer
              question={question}
              currentAnswer={answers[question.id]}
              onAnswerChange={(answer) => handleAnswerChange(question.id, answer)}
            />
          </div>
          
          <div className="answer-display">
            <strong>Current Answer:</strong> {JSON.stringify(answers[question.id] || 'No answer selected')}
          </div>
          
          <div className="correct-answer">
            <strong>Expected Answer:</strong> {JSON.stringify(question.correct_answer)}
          </div>
          
          <div className={`answer-status ${JSON.stringify(answers[question.id]) === JSON.stringify(question.correct_answer) ? 'correct' : 'incorrect'}`}>
            {JSON.stringify(answers[question.id]) === JSON.stringify(question.correct_answer) ? '✅ Correct!' : '❌ Try again'}
          </div>
        </div>
      ))}
      
      <div className="test-summary">
        <h3>Test Summary</h3>
        <p>Answered: {Object.keys(answers).length} / {testQuestions.length}</p>
        <p>Correct: {testQuestions.filter(q => JSON.stringify(answers[q.id]) === JSON.stringify(q.correct_answer)).length}</p>
        
        <details>
          <summary>All Answers (Debug)</summary>
          <pre>{JSON.stringify(answers, null, 2)}</pre>
        </details>
      </div>
    </div>
  );
};

export default QuestionRendererTest;