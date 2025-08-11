"""
Pytest configuration and fixtures for the Escape Room Application
"""
import os
import sys
import tempfile
import pytest
from werkzeug.security import generate_password_hash

# Ensure project root is on sys.path so that `backend` package can be imported
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
backend_dir = os.path.join(project_root, 'backend')
sys.path.insert(0, project_root)
sys.path.insert(0, backend_dir)

from app import create_app
from models import db, Student, Teacher, Task, Question

import webbrowser

def pytest_terminal_summary(terminalreporter, exitstatus, config):
    htmlcov_path = os.path.abspath(
        os.path.join(config.rootpath, "backend", "htmlcov", "index.html")
    )
    if os.path.exists(htmlcov_path):
        file_url = f"file:///{htmlcov_path.replace(os.sep, '/')}"
        terminalreporter.write_sep("-", f"HTML coverage report: {file_url}")
        try:
            webbrowser.open(file_url)
        except Exception:
            pass
    else:
        terminalreporter.write_sep("-", "No HTML coverage report found.")
@pytest.fixture(scope='function')
def app():
    """Create and configure a new app instance for each test."""
    # Create a temporary file to isolate the database for each test
    db_fd, db_path = tempfile.mkstemp()
    
    # Store original DATABASE_URL if it exists
    original_db_url = os.environ.get('DATABASE_URL')
    
    try:
        # Set environment variable for database URI before creating app
        test_db_uri = f"sqlite:///{db_path}"
        os.environ['DATABASE_URL'] = test_db_uri
        
        # Import and create app after setting environment
        # Use the same import path as the backend uses internally
        from app import create_app
        from models import db
        
        app = create_app()
        app.config.update({
            "TESTING": True,
            "WTF_CSRF_ENABLED": False,
            "SECRET_KEY": "test-secret-key"
        })

        # Create database tables in app context
        with app.app_context():
            db.create_all()
            
        yield app
            
    finally:
        # Clean up - restore original environment
        if original_db_url is not None:
            os.environ['DATABASE_URL'] = original_db_url
        elif 'DATABASE_URL' in os.environ:
            del os.environ['DATABASE_URL']
            
        # Clean up temp file
        try:
            os.close(db_fd)
            os.unlink(db_path)
        except (OSError, FileNotFoundError):
            pass  # File might already be closed/deleted


@pytest.fixture(autouse=True)
def app_context(app):
    """Automatically push an application context for each test."""
    with app.app_context():
        yield


@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()


@pytest.fixture
def test_student(app):
    """Create a test student."""
    from models import db, Student
    
    student = Student(
        real_name="Test Student",
        student_id="1234567",
        username="1234567@stu.com",
        password=generate_password_hash("testpass123")
    )
    db.session.add(student)
    db.session.commit()
    yield student


@pytest.fixture
def test_teacher(app):
    """Create a test teacher."""
    from models import db, Teacher
    
    teacher = Teacher(
        real_name="Test Teacher",
        teacher_id="T001234",
        username="teacher@test.com",
        password=generate_password_hash("teacherpass123")
    )
    db.session.add(teacher)
    db.session.commit()
    yield teacher


@pytest.fixture
def test_task(app, test_teacher):
    """Create a test task."""
    from models import db, Task
    
    task = Task(
        name="Test Task",
        introduction="This is a test task for unit testing",
        image_path="/test/image.jpg"
    )
    db.session.add(task)
    db.session.commit()
    yield task


@pytest.fixture
def test_question(app, test_task):
    """Create a test question."""
    from models import db, Question
    
    question = Question(
        task_id=test_task.id,
        question="What is 2 + 2?",
        question_type="single_choice",
        option_a="3",
        option_b="4",
        option_c="5",
        option_d="6",
        correct_answer="B",
        difficulty="easy",
        score=3
    )
    db.session.add(question)
    db.session.commit()
    yield question


@pytest.fixture
def auth_headers_student(client, test_student):
    """Get authentication headers for student."""
    response = client.post('/login', json={
        'username': test_student.username,
        'password': 'testpass123'
    })
    # In a real implementation, you would extract the session or token
    # For now, we'll simulate logged-in state
    return {'Content-Type': 'application/json'}


@pytest.fixture
def auth_headers_teacher(client, test_teacher):
    """Get authentication headers for teacher."""
    response = client.post('/login', json={
        'username': test_teacher.username,
        'password': 'teacherpass123'
    })
    # In a real implementation, you would extract the session or token
    return {'Content-Type': 'application/json'}