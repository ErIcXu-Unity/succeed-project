"""
Tests for Authentication Routes
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

from models import db, Student, Teacher


class TestStudentRegistration:
    """Test student registration functionality."""
    
    def test_successful_registration(self, client):
        """Test successful student registration."""
        data = {
            'real_name': 'Test Student',
            'id_number': '1234567',
            'username': '1234567@stu.com',
            'password': 'testpass123'
        }
        response = client.post('/register', json=data)
        assert response.status_code == 201
        assert json.loads(response.data)['message'] == 'student registered'
        
        # Verify student was created in database
        student = Student.query.filter_by(student_id='1234567').first()
        assert student is not None
        assert student.real_name == 'Test Student'
        assert student.username == '1234567@stu.com'
    
    def test_registration_missing_fields(self, client):
        """Test registration with missing required fields."""
        incomplete_data = {
            'real_name': 'Test Student',
            'id_number': '1234567'
            # Missing username and password
        }
        response = client.post('/register', json=incomplete_data)
        assert response.status_code == 400
        error_msg = json.loads(response.data)['error']
        assert 'is required' in error_msg
    
    def test_registration_invalid_student_id(self, client):
        """Test registration with invalid student ID format."""
        data = {
            'real_name': 'Test Student',
            'id_number': '123',  # Too short
            'username': '123@stu.com',
            'password': 'testpass123'
        }
        response = client.post('/register', json=data)
        assert response.status_code == 400
        assert 'id_number must be 7 digits' in json.loads(response.data)['error']
    
    def test_registration_username_mismatch(self, client):
        """Test registration with username not matching student ID."""
        data = {
            'real_name': 'Test Student',
            'id_number': '1234567',
            'username': '7654321@stu.com',  # Doesn't match id_number
            'password': 'testpass123'
        }
        response = client.post('/register', json=data)
        assert response.status_code == 400
        assert 'username must be <7 digits>@stu.com and match id_number' in json.loads(response.data)['error']
    
    def test_registration_duplicate_student(self, client, test_student):
        """Test registration with existing student ID."""
        data = {
            'real_name': 'Another Student',
            'id_number': test_student.student_id,
            'username': test_student.username,
            'password': 'testpass123'
        }
        response = client.post('/register', json=data)
        assert response.status_code == 409
        assert 'student already exists' in json.loads(response.data)['error']


class TestLogin:
    """Test login functionality."""
    
    def test_successful_student_login(self, client, test_student):
        """Test successful student login."""
        data = {
            'username': test_student.username,
            'password': 'testpass123'
        }
        response = client.post('/login', json=data)
        assert response.status_code == 200
        response_data = json.loads(response.data)
        assert response_data['role'] == 'stu'
        assert response_data['user_id'] == test_student.student_id
        assert response_data['real_name'] == test_student.real_name
    
    def test_successful_teacher_login(self, client, test_teacher):
        """Test successful teacher login."""
        data = {
            'username': test_teacher.username,
            'password': 'teacherpass123'
        }
        response = client.post('/login', json=data)
        assert response.status_code == 200
        response_data = json.loads(response.data)
        assert response_data['role'] == 'tea'
        assert response_data['user_id'] == test_teacher.teacher_id
        assert response_data['real_name'] == test_teacher.real_name
    
    def test_login_invalid_credentials(self, client, test_student):
        """Test login with invalid password."""
        data = {
            'username': test_student.username,
            'password': 'wrongpassword'
        }
        response = client.post('/login', json=data)
        assert response.status_code == 401
        assert 'invalid credentials' in json.loads(response.data)['error']
    
    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user."""
        data = {
            'username': 'nonexistent@stu.com',
            'password': 'somepassword'
        }
        response = client.post('/login', json=data)
        assert response.status_code == 401
        assert 'invalid credentials' in json.loads(response.data)['error']
    
    def test_login_missing_credentials(self, client):
        """Test login with missing username or password."""
        # Missing password
        response = client.post('/login', json={'username': 'test@stu.com'})
        assert response.status_code == 401
        
        # Missing username
        response = client.post('/login', json={'password': 'password'})
        assert response.status_code == 401
        
        # Empty request
        response = client.post('/login', json={})
        assert response.status_code == 401


class TestChangePassword:
    """Test password change functionality."""
    
    def test_successful_password_change(self, client, test_student):
        """Test successful password change."""
        # Change password using the correct API format
        change_data = {
            'username': test_student.username,
            'current_password': 'testpass123',
            'new_password': 'newpassword123'
        }
        response = client.post('/change-password', json=change_data)
        
        assert response.status_code == 200
        response_data = json.loads(response.data)
        assert 'Password changed successfully' in response_data['message']
        
        # Try logging in with new password
        login_data = {
            'username': test_student.username,
            'password': 'newpassword123'
        }
        login_response = client.post('/login', json=login_data)
        assert login_response.status_code == 200
    
    def test_password_change_wrong_old_password(self, client, test_student):
        """Test password change with incorrect old password."""
        # Try to change password with wrong current password
        change_data = {
            'username': test_student.username,
            'current_password': 'wrongoldpassword',
            'new_password': 'newpassword123'
        }
        response = client.post('/change-password', json=change_data)
        
        assert response.status_code == 401
        response_data = json.loads(response.data)
        assert 'Current password is incorrect' in response_data['error'] 