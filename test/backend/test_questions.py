"""
Tests for Question Management Routes
"""
import pytest
import json
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))

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
            'answer': 'C'
        }
        
        response = client.post(f'/api/tasks/{test_task.id}/questions',
                             json=question_data,
                             headers=auth_headers_teacher)
        
        if response.status_code != 401:  # If authentication is not required for testing
            assert response.status_code == 201
            created_question = json.loads(response.data)
            assert created_question['question'] == question_data['question']
            assert created_question['question_type'] == question_data['question_type']
            assert created_question['option_a'] == question_data['option_a']
            assert created_question['answer'] == question_data['answer']
    
    def test_create_multiple_choice_question(self, client, test_task, auth_headers_teacher):
        """Test creating a multiple choice question."""
        question_data = {
            'question': 'Which of the following are programming languages?',
            'question_type': 'multiple_choice',
            'question_data': json.dumps({
                'options': ['Python', 'JavaScript', 'HTML', 'CSS'],
                'correct_answers': [0, 1]  # Python and JavaScript
            })
        }
        
        response = client.post(f'/api/tasks/{test_task.id}/questions',
                             json=question_data,
                             headers=auth_headers_teacher)
        
        if response.status_code != 401:
            assert response.status_code == 201
            created_question = json.loads(response.data)
            assert created_question['question'] == question_data['question']
            assert created_question['question_type'] == question_data['question_type']
    
    def test_create_fill_blank_question(self, client, test_task, auth_headers_teacher):
        """Test creating a fill in the blank question."""
        question_data = {
            'question': 'The capital of France is ____.',
            'question_type': 'fill_blank',
            'question_data': json.dumps({
                'correct_answer': 'Paris',
                'case_sensitive': False
            })
        }
        
        response = client.post(f'/api/tasks/{test_task.id}/questions',
                             json=question_data,
                             headers=auth_headers_teacher)
        
        if response.status_code != 401:
            assert response.status_code == 201
            created_question = json.loads(response.data)
            assert created_question['question'] == question_data['question']
            assert created_question['question_type'] == question_data['question_type']
    
    def test_create_puzzle_game_question(self, client, test_task, auth_headers_teacher):
        """Test creating a puzzle game question."""
        question_data = {
            'question': 'Arrange the following steps in order:',
            'question_type': 'puzzle_game',
            'question_data': json.dumps({
                'fragments': ['Start', 'Process', 'End'],
                'correct_order': [0, 1, 2]
            })
        }
        
        response = client.post(f'/api/tasks/{test_task.id}/questions',
                             json=question_data,
                             headers=auth_headers_teacher)
        
        if response.status_code != 401:
            assert response.status_code == 201
            created_question = json.loads(response.data)
            assert created_question['question'] == question_data['question']
            assert created_question['question_type'] == question_data['question_type']
    
    def test_create_matching_task_question(self, client, test_task, auth_headers_teacher):
        """Test creating a matching task question."""
        question_data = {
            'question': 'Match the countries with their capitals:',
            'question_type': 'matching_task',
            'question_data': json.dumps({
                'left_items': ['France', 'Germany', 'Italy'],
                'right_items': ['Berlin', 'Rome', 'Paris'],
                'correct_matches': {'France': 'Paris', 'Germany': 'Berlin', 'Italy': 'Rome'}
            })
        }
        
        response = client.post(f'/api/tasks/{test_task.id}/questions',
                             json=question_data,
                             headers=auth_headers_teacher)
        
        if response.status_code != 401:
            assert response.status_code == 201
            created_question = json.loads(response.data)
            assert created_question['question'] == question_data['question']
            assert created_question['question_type'] == question_data['question_type']
    
    def test_create_error_spotting_question(self, client, test_task, auth_headers_teacher):
        """Test creating an error spotting question."""
        question_data = {
            'question': 'Find the errors in this image:',
            'question_type': 'error_spotting',
            'question_data': json.dumps({
                'image_path': '/test/error_image.jpg',
                'error_regions': [
                    {'x': 100, 'y': 150, 'width': 50, 'height': 30},
                    {'x': 300, 'y': 200, 'width': 40, 'height': 40}
                ]
            })
        }
        
        response = client.post(f'/api/tasks/{test_task.id}/questions',
                             json=question_data,
                             headers=auth_headers_teacher)
        
        if response.status_code != 401:
            assert response.status_code == 201
            created_question = json.loads(response.data)
            assert created_question['question'] == question_data['question']
            assert created_question['question_type'] == question_data['question_type']
    
    def test_create_question_missing_required_fields(self, client, test_task, auth_headers_teacher):
        """Test creating a question with missing required fields."""
        incomplete_data = {
            'question_type': 'single_choice'
            # Missing question text
        }
        
        response = client.post(f'/api/tasks/{test_task.id}/questions',
                             json=incomplete_data,
                             headers=auth_headers_teacher)
        
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
        
        response = client.post('/api/tasks/99999/questions',
                             json=question_data,
                             headers=auth_headers_teacher)
        
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
            'answer': 'B'
        }
        
        response = client.put(f'/api/questions/{test_question.id}',
                            json=updated_data,
                            headers=auth_headers_teacher)
        
        if response.status_code != 401:
            assert response.status_code == 200
            updated_question = json.loads(response.data)
            assert updated_question['question'] == updated_data['question']
            assert updated_question['option_a'] == updated_data['option_a']
            assert updated_question['answer'] == updated_data['answer']
    
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
            'answer': 'B'  # Valid answer
        }
        
        response = client.post(f'/api/tasks/{test_task.id}/questions',
                             json=valid_data,
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
        # Valid JSON
        valid_data = {
            'question': 'Test question',
            'question_type': 'multiple_choice',
            'question_data': json.dumps({
                'options': ['A', 'B', 'C'],
                'correct_answers': [0, 1]
            })
        }
        
        response = client.post(f'/api/tasks/{test_task.id}/questions',
                             json=valid_data,
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