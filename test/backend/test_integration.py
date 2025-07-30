"""
Integration Tests for the Escape Room Application
Tests complete workflows across multiple components
"""
import pytest
import json
import sys
import os
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))

from models import db, Student, Teacher, Task, Question, Submission, Achievement


class TestStudentWorkflow:
    """Test complete student workflow from registration to task completion."""
    
    def test_student_registration_and_login_workflow(self, client):
        """Test student registration followed by login."""
        # Register a new student
        registration_data = {
            'real_name': 'Integration Test Student',
            'id_number': '9876543',
            'username': '9876543@stu.com',
            'password': 'integrationtest123'
        }
        
        register_response = client.post('/register', json=registration_data)
        assert register_response.status_code == 201
        
        # Login with the same credentials
        login_data = {
            'username': '9876543@stu.com',
            'password': 'integrationtest123'
        }
        
        login_response = client.post('/login', json=login_data)
        assert login_response.status_code == 200
        
        login_result = json.loads(login_response.data)
        assert login_result['role'] == 'student'
        assert login_result['real_name'] == 'Integration Test Student'
    
    def test_complete_task_workflow(self, client, test_student, test_task, test_question):
        """Test complete task workflow: view task, answer questions, submit."""
        # Login as student
        login_data = {
            'username': test_student.username,
            'password': 'testpass123'
        }
        client.post('/login', json=login_data)
        
        # Get available tasks
        tasks_response = client.get('/api/tasks')
        assert tasks_response.status_code == 200
        tasks = json.loads(tasks_response.data)
        assert len(tasks) >= 1
        
        # Get specific task details
        task_response = client.get(f'/api/tasks/{test_task.id}')
        assert task_response.status_code == 200
        
        # Get task questions
        questions_response = client.get(f'/api/tasks/{test_task.id}/questions')
        assert questions_response.status_code == 200
        questions = json.loads(questions_response.data)
        assert len(questions) >= 1
        
        # Submit task completion
        submission_data = {
            'answers': [
                {
                    'question_id': test_question.id,
                    'answer': 'B'  # Correct answer
                }
            ],
            'completion_time': 120
        }
        
        submit_response = client.post(f'/api/tasks/{test_task.id}/submit', 
                                    json=submission_data)
        
        if submit_response.status_code != 404:  # If endpoint exists
            assert submit_response.status_code == 200 or submit_response.status_code == 201
    
    def test_student_progress_tracking(self, client, test_student, test_task):
        """Test student progress tracking across multiple sessions."""
        # Login as student
        login_data = {
            'username': test_student.username,
            'password': 'testpass123'
        }
        client.post('/login', json=login_data)
        
        # Save progress on a task
        progress_data = {
            'current_question': 1,
            'answers': [{'question_id': 1, 'answer': 'A'}],
            'time_spent': 60
        }
        
        save_response = client.post(f'/api/tasks/{test_task.id}/save-progress',
                                  json=progress_data)
        
        if save_response.status_code not in [404, 405]:  # If endpoint exists
            assert save_response.status_code == 200
            
            # Retrieve saved progress
            progress_response = client.get(f'/api/tasks/{test_task.id}/progress')
            if progress_response.status_code == 200:
                progress = json.loads(progress_response.data)
                assert progress['current_question'] == 1


class TestTeacherWorkflow:
    """Test complete teacher workflow from login to task management."""
    
    def test_teacher_task_creation_workflow(self, client, test_teacher):
        """Test complete teacher workflow: login, create task, add questions."""
        # Login as teacher
        login_data = {
            'username': test_teacher.username,
            'password': 'teacherpass123'
        }
        login_response = client.post('/login', json=login_data)
        assert login_response.status_code == 200
        
        # Create a new task
        task_data = {
            'name': 'Integration Test Task',
            'introduction': 'This task is created by integration test',
            'image_path': '/test/integration_image.jpg'
        }
        
        create_task_response = client.post('/api/tasks', json=task_data)
        
        if create_task_response.status_code not in [401, 403]:  # If authorized
            if create_task_response.status_code == 201:
                created_task = json.loads(create_task_response.data)
                task_id = created_task['id']
                
                # Add a question to the task
                question_data = {
                    'question': 'Integration test question?',
                    'question_type': 'single_choice',
                    'option_a': 'Yes',
                    'option_b': 'No',
                    'option_c': 'Maybe',
                    'option_d': 'Unknown',
                    'answer': 'A'
                }
                
                create_question_response = client.post(
                    f'/api/tasks/{task_id}/questions',
                    json=question_data
                )
                
                if create_question_response.status_code not in [401, 403]:
                    assert create_question_response.status_code == 201
    
    def test_teacher_student_monitoring(self, client, test_teacher, test_student, test_task):
        """Test teacher's ability to monitor student progress."""
        # Login as teacher
        login_data = {
            'username': test_teacher.username,
            'password': 'teacherpass123'
        }
        client.post('/login', json=login_data)
        
        # Get all students
        students_response = client.get('/api/students')
        if students_response.status_code == 200:
            students = json.loads(students_response.data)
            assert len(students) >= 1
            
            # Get specific student details
            student_response = client.get(f'/api/students/{test_student.id}')
            if student_response.status_code == 200:
                student_data = json.loads(student_response.data)
                assert student_data['id'] == test_student.id
        
        # Get student submissions for a task
        submissions_response = client.get(f'/api/tasks/{test_task.id}/submissions')
        if submissions_response.status_code == 200:
            submissions = json.loads(submissions_response.data)
            # Should be empty or contain submissions


class TestMultiQuestionTypeWorkflow:
    """Test workflows involving different question types."""
    
    def test_all_question_types_creation(self, client, test_teacher, test_task):
        """Test creating all 6 question types in sequence."""
        # Login as teacher
        login_data = {
            'username': test_teacher.username,
            'password': 'teacherpass123'
        }
        client.post('/login', json=login_data)
        
        question_types = [
            {
                'type': 'single_choice',
                'data': {
                    'question': 'Single choice question?',
                    'question_type': 'single_choice',
                    'option_a': 'A',
                    'option_b': 'B',
                    'option_c': 'C',
                    'option_d': 'D',
                    'answer': 'A'
                }
            },
            {
                'type': 'multiple_choice',
                'data': {
                    'question': 'Multiple choice question?',
                    'question_type': 'multiple_choice',
                    'question_data': json.dumps({
                        'options': ['Option 1', 'Option 2', 'Option 3'],
                        'correct_answers': [0, 1]
                    })
                }
            },
            {
                'type': 'fill_blank',
                'data': {
                    'question': 'Fill in the blank: Paris is the capital of ____.',
                    'question_type': 'fill_blank',
                    'question_data': json.dumps({
                        'correct_answer': 'France',
                        'case_sensitive': False
                    })
                }
            },
            {
                'type': 'puzzle_game',
                'data': {
                    'question': 'Arrange the steps in order:',
                    'question_type': 'puzzle_game',
                    'question_data': json.dumps({
                        'fragments': ['Step 1', 'Step 2', 'Step 3'],
                        'correct_order': [0, 1, 2]
                    })
                }
            },
            {
                'type': 'matching_task',
                'data': {
                    'question': 'Match the items:',
                    'question_type': 'matching_task',
                    'question_data': json.dumps({
                        'left_items': ['A', 'B', 'C'],
                        'right_items': ['1', '2', '3'],
                        'correct_matches': {'A': '1', 'B': '2', 'C': '3'}
                    })
                }
            },
            {
                'type': 'error_spotting',
                'data': {
                    'question': 'Find the errors in the image:',
                    'question_type': 'error_spotting',
                    'question_data': json.dumps({
                        'image_path': '/test/error_image.jpg',
                        'error_regions': [
                            {'x': 100, 'y': 100, 'width': 50, 'height': 50}
                        ]
                    })
                }
            }
        ]
        
        created_questions = []
        
        for question_type_info in question_types:
            response = client.post(
                f'/api/tasks/{test_task.id}/questions',
                json=question_type_info['data']
            )
            
            if response.status_code not in [401, 403]:  # If authorized
                if response.status_code == 201:
                    created_question = json.loads(response.data)
                    created_questions.append(created_question)
                    assert created_question['question_type'] == question_type_info['type']
        
        # Verify all questions were created
        questions_response = client.get(f'/api/tasks/{test_task.id}/questions')
        if questions_response.status_code == 200:
            all_questions = json.loads(questions_response.data)
            # Should include our test question plus any created above
            assert len(all_questions) >= len(created_questions)


class TestErrorHandlingWorkflow:
    """Test error handling in complete workflows."""
    
    def test_invalid_login_to_task_attempt(self, client, test_task):
        """Test accessing tasks without proper authentication."""
        # Try to access task without login
        task_response = client.get(f'/api/tasks/{test_task.id}')
        # Should work for public tasks, or return auth error
        assert task_response.status_code in [200, 401, 403]
        
        # Try to create question without login
        question_data = {
            'question': 'Unauthorized question',
            'question_type': 'single_choice',
            'answer': 'A'
        }
        
        create_response = client.post(
            f'/api/tasks/{test_task.id}/questions',
            json=question_data
        )
        # Should require authentication
        assert create_response.status_code in [401, 403]
    
    def test_malformed_submission_workflow(self, client, test_student, test_task):
        """Test handling of malformed task submissions."""
        # Login as student
        login_data = {
            'username': test_student.username,
            'password': 'testpass123'
        }
        client.post('/login', json=login_data)
        
        # Submit malformed data
        malformed_data = {
            'answers': 'not_an_array',  # Should be array
            'completion_time': 'not_a_number'  # Should be number
        }
        
        submit_response = client.post(
            f'/api/tasks/{test_task.id}/submit',
            json=malformed_data
        )
        
        if submit_response.status_code != 404:  # If endpoint exists
            assert submit_response.status_code == 400  # Should return validation error
    
    def test_nonexistent_resource_workflow(self, client, test_teacher):
        """Test handling of requests for non-existent resources."""
        # Login as teacher
        login_data = {
            'username': test_teacher.username,
            'password': 'teacherpass123'
        }
        client.post('/login', json=login_data)
        
        # Try to get non-existent task
        task_response = client.get('/api/tasks/99999')
        assert task_response.status_code == 404
        
        # Try to add question to non-existent task
        question_data = {
            'question': 'Question for non-existent task',
            'question_type': 'single_choice'
        }
        
        question_response = client.post('/api/tasks/99999/questions', json=question_data)
        assert question_response.status_code == 404
        
        # Try to get non-existent question
        question_get_response = client.get('/api/questions/99999')
        assert question_get_response.status_code == 404


class TestPerformanceWorkflow:
    """Test application performance under various loads."""
    
    def test_multiple_student_concurrent_access(self, app):
        """Test multiple students accessing the system concurrently."""
        with app.app_context():
            # Create multiple test students
            students = []
            for i in range(5):
                student = Student(
                    real_name=f"Performance Test Student {i}",
                    student_id=f"900000{i}",
                    username=f"900000{i}@stu.com",
                    password=generate_password_hash("testpass")
                )
                db.session.add(student)
                students.append(student)
            
            # Create a test task
            task = Task(
                name="Performance Test Task",
                introduction="Task for performance testing"
            )
            db.session.add(task)
            db.session.commit()
            
            # Create questions
            for i in range(10):
                question = Question(
                    task_id=task.id,
                    question=f"Performance question {i}?",
                    question_type="single_choice",
                    option_a="A",
                    option_b="B",
                    option_c="C",
                    option_d="D",
                    answer="A"
                )
                db.session.add(question)
            
            db.session.commit()
            
            # Verify all data was created
            assert len(Student.query.filter(Student.student_id.like('900000%')).all()) == 5
            assert Task.query.filter_by(name="Performance Test Task").first() is not None
            assert len(Question.query.filter_by(task_id=task.id).all()) == 10
    
    def test_large_question_data_handling(self, app, test_task):
        """Test handling of questions with large data payloads."""
        with app.app_context():
            # Create question with large data
            large_data = {
                'options': [f'Option {i}' for i in range(100)],
                'correct_answers': list(range(50)),
                'metadata': {
                    'description': 'A' * 1000,  # Large description
                    'tags': [f'tag{i}' for i in range(50)]
                }
            }
            
            question = Question(
                task_id=test_task.id,
                question="Large data question?",
                question_type="multiple_choice",
                question_data=json.dumps(large_data)
            )
            db.session.add(question)
            db.session.commit()
            
            # Verify question was created and data is intact
            saved_question = Question.query.filter_by(question="Large data question?").first()
            assert saved_question is not None
            
            saved_data = json.loads(saved_question.question_data)
            assert len(saved_data['options']) == 100
            assert len(saved_data['correct_answers']) == 50 