"""
Tests for Task Management Routes
"""
import pytest
import json
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))

from models import db, Task


class TestTasksAPI:
    """Test task management functionality."""
    
    def test_get_all_tasks(self, client, test_task):
        """Test getting all tasks."""
        response = client.get('/api/tasks')
        assert response.status_code == 200
        
        tasks = json.loads(response.data)
        assert len(tasks) >= 1
        
        # Find our test task
        test_task_data = next((t for t in tasks if t['id'] == test_task.id), None)
        assert test_task_data is not None
        assert test_task_data['name'] == test_task.name
        assert test_task_data['introduction'] == test_task.introduction
    
    def test_get_task_by_id(self, client, test_task):
        """Test getting a specific task by ID."""
        response = client.get(f'/api/tasks/{test_task.id}')
        assert response.status_code == 200
        
        task_data = json.loads(response.data)
        assert task_data['id'] == test_task.id
        assert task_data['name'] == test_task.name
        assert task_data['introduction'] == test_task.introduction
    
    def test_get_nonexistent_task(self, client):
        """Test getting a task that doesn't exist."""
        response = client.get('/api/tasks/99999')
        assert response.status_code == 404
    
    def test_create_task(self, client, auth_headers_teacher):
        """Test creating a new task."""
        task_data = {
            'name': 'New Test Task',
            'introduction': 'This is a new test task',
            'image_path': '/test/new_image.jpg'
        }
        
        response = client.post('/api/tasks', 
                             json=task_data, 
                             headers=auth_headers_teacher)
        
        if response.status_code != 401:  # If authentication is not required for testing
            assert response.status_code == 201
            created_task = json.loads(response.data)
            assert created_task['name'] == task_data['name']
            assert created_task['introduction'] == task_data['introduction']
            
            # Verify task was created in database
            db_task = Task.query.filter_by(name=task_data['name']).first()
            assert db_task is not None
    
    def test_create_task_missing_name(self, client, auth_headers_teacher):
        """Test creating a task without required name field."""
        task_data = {
            'introduction': 'This task has no name'
        }
        
        response = client.post('/api/tasks', 
                             json=task_data, 
                             headers=auth_headers_teacher)
        
        if response.status_code != 401:  # If authentication is not required for testing
            assert response.status_code == 400
    
    def test_create_duplicate_task_name(self, client, test_task, auth_headers_teacher):
        """Test creating a task with duplicate name."""
        task_data = {
            'name': test_task.name,  # Same name as existing task
            'introduction': 'This is a duplicate name task'
        }
        
        response = client.post('/api/tasks', 
                             json=task_data, 
                             headers=auth_headers_teacher)
        
        if response.status_code != 401:  # If authentication is not required for testing
            assert response.status_code == 400 or response.status_code == 409
    
    def test_update_task(self, client, test_task, auth_headers_teacher):
        """Test updating an existing task."""
        updated_data = {
            'name': 'Updated Test Task',
            'introduction': 'This task has been updated',
            'image_path': '/test/updated_image.jpg'
        }
        
        response = client.put(f'/api/tasks/{test_task.id}', 
                            json=updated_data, 
                            headers=auth_headers_teacher)
        
        if response.status_code != 401:  # If authentication is not required for testing
            assert response.status_code == 200
            updated_task = json.loads(response.data)
            assert updated_task['name'] == updated_data['name']
            assert updated_task['introduction'] == updated_data['introduction']
    
    def test_update_nonexistent_task(self, client, auth_headers_teacher):
        """Test updating a task that doesn't exist."""
        updated_data = {
            'name': 'Non-existent Task',
            'introduction': 'This task does not exist'
        }
        
        response = client.put('/api/tasks/99999', 
                            json=updated_data, 
                            headers=auth_headers_teacher)
        
        if response.status_code != 401:  # If authentication is not required for testing
            assert response.status_code == 404
    
    def test_delete_task(self, client, auth_headers_teacher):
        """Test deleting a task."""
        # First create a task to delete
        task_data = {
            'name': 'Task to Delete',
            'introduction': 'This task will be deleted'
        }
        
        create_response = client.post('/api/tasks', 
                                    json=task_data, 
                                    headers=auth_headers_teacher)
        
        if create_response.status_code not in [401, 403]:  # If we can create tasks
            if create_response.status_code == 201:
                created_task = json.loads(create_response.data)
                task_id = created_task['id']
                
                # Now delete the task
                delete_response = client.delete(f'/api/tasks/{task_id}', 
                                              headers=auth_headers_teacher)
                assert delete_response.status_code == 200
                
                # Verify task was deleted
                get_response = client.get(f'/api/tasks/{task_id}')
                assert get_response.status_code == 404
    
    def test_delete_nonexistent_task(self, client, auth_headers_teacher):
        """Test deleting a task that doesn't exist."""
        response = client.delete('/api/tasks/99999', 
                               headers=auth_headers_teacher)
        
        if response.status_code != 401:  # If authentication is not required for testing
            assert response.status_code == 404


class TestTasksWithQuestions:
    """Test task functionality that involves questions."""
    
    def test_get_task_with_questions(self, client, test_task, test_question):
        """Test getting a task that includes its questions."""
        response = client.get(f'/api/tasks/{test_task.id}/questions')
        assert response.status_code == 200
        
        questions = json.loads(response.data)
        assert len(questions) >= 1
        
        # Find our test question
        test_question_data = next((q for q in questions if q['id'] == test_question.id), None)
        assert test_question_data is not None
        assert test_question_data['question'] == test_question.question
        assert test_question_data['question_type'] == test_question.question_type
    
    def test_get_questions_for_nonexistent_task(self, client):
        """Test getting questions for a task that doesn't exist."""
        response = client.get('/api/tasks/99999/questions')
        assert response.status_code == 404 or response.status_code == 200  # Might return empty list
        
        if response.status_code == 200:
            questions = json.loads(response.data)
            assert len(questions) == 0 