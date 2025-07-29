/**
 * Tests for Question Create Modal Component
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// 注意：这里的导入路径需要根据实际项目结构调整
import QuestionCreateModal from '../../src/components/QuestionCreateModal';

// Mock fetch function
global.fetch = jest.fn();

// Mock props
const mockProps = {
  isOpen: true,
  onClose: jest.fn(),
  taskId: 1,
  onQuestionCreated: jest.fn()
};

describe('QuestionCreateModal', () => {
  beforeEach(() => {
    fetch.mockClear();
    mockProps.onClose.mockClear();
    mockProps.onQuestionCreated.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders modal when open', () => {
    render(<QuestionCreateModal {...mockProps} />);
    
    expect(screen.getByText(/create question/i)).toBeInTheDocument();
    expect(screen.getByText(/question type/i)).toBeInTheDocument();
  });

  test('does not render modal when closed', () => {
    render(<QuestionCreateModal {...mockProps} isOpen={false} />);
    
    expect(screen.queryByText(/create question/i)).not.toBeInTheDocument();
  });

  test('displays all question types in dropdown', () => {
    render(<QuestionCreateModal {...mockProps} />);
    
    const questionTypeSelect = screen.getByLabelText(/question type/i);
    
    expect(screen.getByText(/single choice/i)).toBeInTheDocument();
    expect(screen.getByText(/multiple choice/i)).toBeInTheDocument();
    expect(screen.getByText(/fill.*blank/i)).toBeInTheDocument();
    expect(screen.getByText(/puzzle game/i)).toBeInTheDocument();
    expect(screen.getByText(/matching task/i)).toBeInTheDocument();
    expect(screen.getByText(/error spotting/i)).toBeInTheDocument();
  });

  test('shows single choice editor when single choice is selected', () => {
    render(<QuestionCreateModal {...mockProps} />);
    
    const questionTypeSelect = screen.getByLabelText(/question type/i);
    fireEvent.change(questionTypeSelect, { target: { value: 'single_choice' } });
    
    expect(screen.getByLabelText(/option a/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/option b/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/option c/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/option d/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/correct answer/i)).toBeInTheDocument();
  });

  test('shows multiple choice editor when multiple choice is selected', () => {
    render(<QuestionCreateModal {...mockProps} />);
    
    const questionTypeSelect = screen.getByLabelText(/question type/i);
    fireEvent.change(questionTypeSelect, { target: { value: 'multiple_choice' } });
    
    // Should show options and multiple selection capability
    expect(screen.getByText(/add option/i)).toBeInTheDocument();
  });

  test('shows fill blank editor when fill blank is selected', () => {
    render(<QuestionCreateModal {...mockProps} />);
    
    const questionTypeSelect = screen.getByLabelText(/question type/i);
    fireEvent.change(questionTypeSelect, { target: { value: 'fill_blank' } });
    
    expect(screen.getByLabelText(/correct answer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/case sensitive/i)).toBeInTheDocument();
  });

  test('submits single choice question correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, question: 'Test question' })
    });

    render(<QuestionCreateModal {...mockProps} />);
    
    // Fill out the form
    const questionInput = screen.getByLabelText(/question text/i);
    const questionTypeSelect = screen.getByLabelText(/question type/i);
    
    fireEvent.change(questionInput, { target: { value: 'What is 2 + 2?' } });
    fireEvent.change(questionTypeSelect, { target: { value: 'single_choice' } });
    
    // Wait for editor to load
    await waitFor(() => {
      expect(screen.getByLabelText(/option a/i)).toBeInTheDocument();
    });
    
    const optionA = screen.getByLabelText(/option a/i);
    const optionB = screen.getByLabelText(/option b/i);
    const optionC = screen.getByLabelText(/option c/i);
    const optionD = screen.getByLabelText(/option d/i);
    const correctAnswer = screen.getByLabelText(/correct answer/i);
    
    fireEvent.change(optionA, { target: { value: '3' } });
    fireEvent.change(optionB, { target: { value: '4' } });
    fireEvent.change(optionC, { target: { value: '5' } });
    fireEvent.change(optionD, { target: { value: '6' } });
    fireEvent.change(correctAnswer, { target: { value: 'B' } });
    
    const submitButton = screen.getByRole('button', { name: /create question/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:5001/api/tasks/${mockProps.taskId}/questions`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: 'What is 2 + 2?',
            question_type: 'single_choice',
            option_a: '3',
            option_b: '4',
            option_c: '5',
            option_d: '6',
            answer: 'B'
          })
        })
      );
    });
    
    expect(mockProps.onQuestionCreated).toHaveBeenCalled();
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  test('handles form validation errors', async () => {
    render(<QuestionCreateModal {...mockProps} />);
    
    const submitButton = screen.getByRole('button', { name: /create question/i });
    fireEvent.click(submitButton);
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/question text is required/i)).toBeInTheDocument();
    });
    
    // Should not make API call
    expect(fetch).not.toHaveBeenCalled();
  });

  test('handles API error responses', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Question creation failed' })
    });

    render(<QuestionCreateModal {...mockProps} />);
    
    // Fill minimum required fields
    const questionInput = screen.getByLabelText(/question text/i);
    fireEvent.change(questionInput, { target: { value: 'Test question' } });
    
    const submitButton = screen.getByRole('button', { name: /create question/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/question creation failed/i)).toBeInTheDocument();
    });
    
    expect(mockProps.onQuestionCreated).not.toHaveBeenCalled();
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  test('closes modal when close button is clicked', () => {
    render(<QuestionCreateModal {...mockProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  test('closes modal when ESC key is pressed', () => {
    render(<QuestionCreateModal {...mockProps} />);
    
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  test('prevents form submission during loading', async () => {
    // Mock a slow response
    fetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ id: 1 })
      }), 100))
    );

    render(<QuestionCreateModal {...mockProps} />);
    
    const questionInput = screen.getByLabelText(/question text/i);
    fireEvent.change(questionInput, { target: { value: 'Test question' } });
    
    const submitButton = screen.getByRole('button', { name: /create question/i });
    fireEvent.click(submitButton);
    
    // Button should be disabled during loading
    expect(submitButton).toBeDisabled();
    
    // Click again - should not make another API call
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    }, { timeout: 200 });
  });

  test('resets form when modal reopens', () => {
    const { rerender } = render(<QuestionCreateModal {...mockProps} isOpen={false} />);
    
    // Open modal and fill form
    rerender(<QuestionCreateModal {...mockProps} isOpen={true} />);
    
    const questionInput = screen.getByLabelText(/question text/i);
    fireEvent.change(questionInput, { target: { value: 'Test question' } });
    
    // Close and reopen modal
    rerender(<QuestionCreateModal {...mockProps} isOpen={false} />);
    rerender(<QuestionCreateModal {...mockProps} isOpen={true} />);
    
    // Form should be reset
    expect(screen.getByLabelText(/question text/i).value).toBe('');
  });

  test('validates single choice question options', async () => {
    render(<QuestionCreateModal {...mockProps} />);
    
    const questionInput = screen.getByLabelText(/question text/i);
    const questionTypeSelect = screen.getByLabelText(/question type/i);
    
    fireEvent.change(questionInput, { target: { value: 'Test question' } });
    fireEvent.change(questionTypeSelect, { target: { value: 'single_choice' } });
    
    await waitFor(() => {
      expect(screen.getByLabelText(/option a/i)).toBeInTheDocument();
    });
    
    // Leave some options empty
    const optionA = screen.getByLabelText(/option a/i);
    fireEvent.change(optionA, { target: { value: 'Option A' } });
    
    const submitButton = screen.getByRole('button', { name: /create question/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/all options are required/i)).toBeInTheDocument();
    });
  });
}); 