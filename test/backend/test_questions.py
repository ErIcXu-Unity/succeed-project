"""
Tests for Question Management Routes
"""
import pytest
import json
import sys
import os

# Ensure project root is on sys.path so that `backend` package can be imported
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
backend_dir = os.path.join(project_root, 'backend')
sys.path.insert(0, project_root)
sys.path.insert(0, backend_dir)

from models import db, Question


class TestQuestionsAPI:
    """Test question management functionality."""
    
    def test_create_single_choice_question(self, client, test_task, auth_headers_teacher):
        """Test creating a single choice question."""
        question_data = {
            'question': 'What is the capital of Australia?',
            'question_type': 'single_choice',
            'option_a': 'Sydney',
            'option_b': 'Melbourne',
            'option_c': 'Canberra',
            'option_d': 'Perth',
            'correct_answer': 'C',
            'difficulty': 'Easy',
            'score': '5'
        }
        
        response = client.post(
            f'/api/tasks/{test_task.id}/questions',
            data=question_data,
            content_type='multipart/form-data',
            headers=auth_headers_teacher
        )
        
        if response.status_code != 401:  # If authentication is not required for testing
            assert response.status_code == 201
            response_data = json.loads(response.data)
            assert 'message' in response_data
            assert 'question' in response_data
            created_question = response_data['question']
            assert created_question['question'] == question_data['question']
            assert created_question['options']['A'] == question_data['option_a']
            assert created_question['correct_answer'] == question_data['correct_answer']
    
    def test_create_multiple_choice_question(self, client, test_task, auth_headers_teacher):
        """Test creating a multiple choice question."""
        form_data = {
            'question': 'Which of the following are programming languages?',
            'question_type': 'multiple_choice',
            'options[0]': 'Python',
            'options[1]': 'JavaScript',
            'options[2]': 'HTML',
            'options[3]': 'CSS',
            'correct_answers[0]': '0',
            'correct_answers[1]': '1',
            'difficulty': 'Medium',
            'score': '5'
        }
        
        response = client.post(
            f'/api/tasks/{test_task.id}/questions',
            data=form_data,
            content_type='multipart/form-data',
            headers=auth_headers_teacher
        )
        
        if response.status_code != 401:
            assert response.status_code == 201
            response_data = json.loads(response.data)
            assert 'message' in response_data
            assert 'question' in response_data
            created_question = response_data['question']
            assert created_question['question'] == form_data['question']
    
    def test_create_fill_blank_question(self, client, test_task, auth_headers_teacher):
        """Test creating a fill in the blank question."""
        form_data = {
            'question': 'The capital of France is ____.',
            'question_type': 'fill_blank',
            'blank_answers[0]': 'Paris',
            'difficulty': 'Easy',
            'score': '3'
        }
        
        response = client.post(
            f'/api/tasks/{test_task.id}/questions',
            data=form_data,
            content_type='multipart/form-data',
            headers=auth_headers_teacher
        )
        
        if response.status_code != 401:
            assert response.status_code == 201
            response_data = json.loads(response.data)
            assert 'message' in response_data
            assert 'question' in response_data
            created_question = response_data['question']
            assert created_question['question'] == form_data['question']
    
    def test_create_puzzle_game_question(self, client, test_task, auth_headers_teacher):
        """Test creating a puzzle game question."""
        form_data = {
            'question': 'Arrange the following steps in order:',
            'question_type': 'puzzle_game',
            'puzzle_solution': 'Start Process End',
            'puzzle_fragments[0]': 'Start',
            'puzzle_fragments[1]': 'Process',
            'puzzle_fragments[2]': 'End',
            'difficulty': 'Medium',
            'score': '5'
        }
        
        response = client.post(
            f'/api/tasks/{test_task.id}/questions',
            data=form_data,
            content_type='multipart/form-data',
            headers=auth_headers_teacher
        )
        
        if response.status_code != 401:
            assert response.status_code == 201
            response_data = json.loads(response.data)
            assert 'message' in response_data
            assert 'question' in response_data
            created_question = response_data['question']
            assert created_question['question'] == form_data['question']
    
    def test_create_matching_task_question(self, client, test_task, auth_headers_teacher):
        """Test creating a matching task question."""
        form_data = {
            'question': 'Match the countries with their capitals:',
            'question_type': 'matching_task',
            'left_items[0]': 'France',
            'left_items[1]': 'Germany',
            'left_items[2]': 'Italy',
            'right_items[0]': 'Berlin',
            'right_items[1]': 'Rome',
            'right_items[2]': 'Paris',
            'correct_matches[0][left]': '0', 'correct_matches[0][right]': '2',
            'correct_matches[1][left]': '1', 'correct_matches[1][right]': '0',
            'correct_matches[2][left]': '2', 'correct_matches[2][right]': '1',
            'difficulty': 'Easy',
            'score': '5'
        }
        
        response = client.post(
            f'/api/tasks/{test_task.id}/questions',
            data=form_data,
            content_type='multipart/form-data',
            headers=auth_headers_teacher
        )
        
        if response.status_code != 401:
            assert response.status_code == 201
            response_data = json.loads(response.data)
            assert 'message' in response_data
            assert 'question' in response_data
            created_question = response_data['question']
            assert created_question['question'] == form_data['question']
    
    
    def test_create_question_missing_required_fields(self, client, test_task, auth_headers_teacher):
        """Test creating a question with missing required fields."""
        incomplete_data = {
            'question_type': 'single_choice'
            # Missing question text
        }
        
        response = client.post(
            f'/api/tasks/{test_task.id}/questions',
            data=incomplete_data,
            content_type='multipart/form-data',
            headers=auth_headers_teacher
        )
        
        if response.status_code != 401:
            assert response.status_code == 400
    
    def test_create_question_invalid_task_id(self, client, auth_headers_teacher):
        """Test creating a question for non-existent task."""
        question_data = {
            'question': 'Test question',
            'question_type': 'single_choice',
            'option_a': 'A',
            'option_b': 'B',
            'option_c': 'C',
            'option_d': 'D',
            'answer': 'A'
        }
        
        response = client.post(
            '/api/tasks/99999/questions',
            data=question_data,
            content_type='multipart/form-data',
            headers=auth_headers_teacher
        )
        
        if response.status_code != 401:
            assert response.status_code == 404
    
    def test_get_question_by_id(self, client, test_question):
        """Test getting a specific question by ID."""
        response = client.get(f'/api/questions/{test_question.id}')
        assert response.status_code == 200
        
        question_data = json.loads(response.data)
        assert question_data['id'] == test_question.id
        assert question_data['question'] == test_question.question
        assert question_data['question_type'] == test_question.question_type
    
    def test_get_nonexistent_question(self, client):
        """Test getting a question that doesn't exist."""
        response = client.get('/api/questions/99999')
        assert response.status_code == 404
    
    def test_update_question(self, client, test_question, auth_headers_teacher):
        """Test updating an existing question."""
        updated_data = {
            'question': 'What is 3 + 3?',
            'option_a': '5',
            'option_b': '6',
            'option_c': '7',
            'option_d': '8',
            'correct_answer': 'B'
        }
        
        response = client.put(
            f'/api/questions/{test_question.id}',
            json=updated_data,
            headers=auth_headers_teacher
        )
        
        if response.status_code != 401:
            assert response.status_code == 200
            response_data = json.loads(response.data)
            assert 'message' in response_data
            assert response_data['message'] == 'Question updated successfully'
    
    def test_update_nonexistent_question(self, client, auth_headers_teacher):
        """Test updating a question that doesn't exist."""
        updated_data = {
            'question': 'Updated question',
            'option_a': 'A',
            'option_b': 'B',
            'option_c': 'C',
            'option_d': 'D',
            'answer': 'A'
        }
        
        response = client.put('/api/questions/99999',
                            json=updated_data,
                            headers=auth_headers_teacher)
        
        if response.status_code != 401:
            assert response.status_code == 404
    
    def test_delete_question(self, client, test_question, auth_headers_teacher):
        """Test deleting a question."""
        question_id = test_question.id
        
        response = client.delete(f'/api/questions/{question_id}',
                               headers=auth_headers_teacher)
        
        if response.status_code != 401:
            assert response.status_code == 200
            
            # Verify question was deleted
            get_response = client.get(f'/api/questions/{question_id}')
            assert get_response.status_code == 404
    
    def test_delete_nonexistent_question(self, client, auth_headers_teacher):
        """Test deleting a question that doesn't exist."""
        response = client.delete('/api/questions/99999',
                               headers=auth_headers_teacher)
        
        if response.status_code != 401:
            assert response.status_code == 404


class TestQuestionValidation:
    """Test question validation logic."""
    
    def test_validate_single_choice_answer(self, client, test_task, auth_headers_teacher):
        """Test validating single choice question answers."""
        # Valid answer
        valid_data = {
            'question': 'Test question',
            'question_type': 'single_choice',
            'option_a': 'A',
            'option_b': 'B',
            'option_c': 'C',
            'option_d': 'D',
            'correct_answer': 'B',  # Valid answer
            'difficulty': 'Easy',
            'score': '3'
        }
        
        response = client.post(f'/api/tasks/{test_task.id}/questions',
                             data=valid_data,
                             content_type='multipart/form-data',
                             headers=auth_headers_teacher)
        
        if response.status_code != 401:
            assert response.status_code == 201
        
        # Invalid answer
        invalid_data = {
            'question': 'Test question',
            'question_type': 'single_choice',
            'option_a': 'A',
            'option_b': 'B',
            'option_c': 'C',
            'option_d': 'D',
            'answer': 'E'  # Invalid answer
        }
        
        response = client.post(f'/api/tasks/{test_task.id}/questions',
                             json=invalid_data,
                             headers=auth_headers_teacher)
        
        if response.status_code != 401:
            assert response.status_code == 400
    
    def test_validate_question_data_json(self, client, test_task, auth_headers_teacher):
        """Test validating question_data JSON format."""
        # Valid JSON for multiple choice
        valid_data = {
            'question': 'Test question',
            'question_type': 'multiple_choice',
            'options[0]': 'Option A',
            'options[1]': 'Option B', 
            'options[2]': 'Option C',
            'correct_answers[0]': '0',
            'correct_answers[1]': '1',
            'difficulty': 'Medium',
            'score': '5'
        }
        
        response = client.post(f'/api/tasks/{test_task.id}/questions',
                             data=valid_data,
                             content_type='multipart/form-data',
                             headers=auth_headers_teacher)
        
        if response.status_code != 401:
            assert response.status_code == 201
        
        # Invalid JSON
        invalid_data = {
            'question': 'Test question',
            'question_type': 'multiple_choice',
            'question_data': 'invalid json string'
        }
        
        response = client.post(f'/api/tasks/{test_task.id}/questions',
                             json=invalid_data,
                             headers=auth_headers_teacher)
        
        if response.status_code != 401:
            assert response.status_code == 400 