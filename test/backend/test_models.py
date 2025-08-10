"""
Tests for Database Models
"""
import pytest
import sys
import os
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash

# Add project root directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))

from models import db, Student, Teacher, Task, Question, Achievement, StudentTaskResult, StudentTaskProcess


class TestStudentModel:
    """Test Student model functionality."""
    
    def test_create_student(self, app):
        """Test creating a student record."""
        with app.app_context():
            student = Student(
                real_name="Test Student",
                student_id="1234567",
                username="1234567@stu.com",
                password=generate_password_hash("testpass")
            )
            db.session.add(student)
            db.session.commit()
            
            # Verify student was created
            saved_student = Student.query.filter_by(student_id="1234567").first()
            assert saved_student is not None
            assert saved_student.real_name == "Test Student"
            assert saved_student.username == "1234567@stu.com"
            assert check_password_hash(saved_student.password, "testpass")
    
    def test_student_unique_constraints(self, app):
        """Test student unique constraints."""
        with app.app_context():
            # Create first student
            student1 = Student(
                real_name="Student One",
                student_id="1234567",
                username="1234567@stu.com",
                password=generate_password_hash("pass1")
            )
            db.session.add(student1)
            db.session.commit()
            
            # Try to create student with same student_id
            student2 = Student(
                real_name="Student Two",
                student_id="1234567",  # Same ID
                username="7654321@stu.com",
                password=generate_password_hash("pass2")
            )
            db.session.add(student2)
            
            with pytest.raises(Exception):  # Should raise integrity error
                db.session.commit()
    
    def test_student_string_representation(self, app):
        """Test student string representation."""
        with app.app_context():
            student = Student(
                real_name="Test Student",
                student_id="1234567",
                username="1234567@stu.com",
                password="hashed_password"
            )
            # Test that the student object can be converted to string without error
            assert isinstance(str(student), str)


class TestTeacherModel:
    """Test Teacher model functionality."""
    
    def test_create_teacher(self, app):
        """Test creating a teacher record."""
        with app.app_context():
            teacher = Teacher(
                real_name="Test Teacher",
                teacher_id="T001234",
                username="teacher@test.com",
                password=generate_password_hash("teacherpass")
            )
            db.session.add(teacher)
            db.session.commit()
            
            # Verify teacher was created
            saved_teacher = Teacher.query.filter_by(teacher_id="T001234").first()
            assert saved_teacher is not None
            assert saved_teacher.real_name == "Test Teacher"
            assert saved_teacher.username == "teacher@test.com"
            assert check_password_hash(saved_teacher.password, "teacherpass")
    
    def test_teacher_unique_constraints(self, app):
        """Test teacher unique constraints."""
        with app.app_context():
            # Create first teacher
            teacher1 = Teacher(
                real_name="Teacher One",
                teacher_id="T001234",
                username="teacher1@test.com",
                password=generate_password_hash("pass1")
            )
            db.session.add(teacher1)
            db.session.commit()
            
            # Try to create teacher with same username
            teacher2 = Teacher(
                real_name="Teacher Two",
                teacher_id="T005678",
                username="teacher1@test.com",  # Same username
                password=generate_password_hash("pass2")
            )
            db.session.add(teacher2)
            
            with pytest.raises(Exception):  # Should raise integrity error
                db.session.commit()


class TestTaskModel:
    """Test Task model functionality."""
    
    def test_create_task(self, app):
        """Test creating a task record."""
        with app.app_context():
            task = Task(
                name="Test Task",
                introduction="This is a test task",
                image_path="/test/image.jpg",
                video_path="/test/video.mp4",
                video_url="https://youtube.com/watch?v=test",
                video_type="local",
                publish_at=datetime.now(timezone.utc)
            )
            db.session.add(task)
            db.session.commit()
            
            # Verify task was created
            saved_task = Task.query.filter_by(name="Test Task").first()
            assert saved_task is not None
            assert saved_task.introduction == "This is a test task"
            assert saved_task.image_path == "/test/image.jpg"
            assert saved_task.video_type == "local"
    
    def test_task_unique_name_constraint(self, app):
        """Test task unique name constraint."""
        with app.app_context():
            # Create first task
            task1 = Task(name="Unique Task", introduction="First task")
            db.session.add(task1)
            db.session.commit()
            
            # Try to create task with same name
            task2 = Task(name="Unique Task", introduction="Second task")
            db.session.add(task2)
            
            with pytest.raises(Exception):  # Should raise integrity error
                db.session.commit()
    
    def test_task_optional_fields(self, app):
        """Test task with optional fields."""
        with app.app_context():
            # Create task with minimal required fields
            task = Task(name="Minimal Task")
            db.session.add(task)
            db.session.commit()
            
            saved_task = Task.query.filter_by(name="Minimal Task").first()
            assert saved_task is not None
            assert saved_task.introduction is None
            assert saved_task.image_path is None
            assert saved_task.video_path is None
            assert saved_task.video_url is None
            assert saved_task.video_type is None
            assert saved_task.publish_at is None


class TestQuestionModel:
    """Test Question model functionality."""
    
    def test_create_single_choice_question(self, app, test_task):
        """Test creating a single choice question."""
        with app.app_context():
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
                score=10,
                question_data=None
            )
            db.session.add(question)
            db.session.commit()
            
            saved_question = Question.query.filter_by(question="What is 2 + 2?").first()
            assert saved_question is not None
            assert saved_question.task_id == test_task.id
            assert saved_question.question_type == "single_choice"
            assert saved_question.option_b == "4"
            assert saved_question.correct_answer == "B"
    
    def test_create_question_with_data(self, app, test_task):
        """Test creating a question with JSON data."""
        with app.app_context():
            question_data = '{"options": ["A", "B", "C"], "correct_answers": [0, 1]}'
            question = Question(
                task_id=test_task.id,
                question="Multiple choice question",
                question_type="multiple_choice",
                question_data=question_data,
                difficulty="medium",
                score=15
            )
            db.session.add(question)
            db.session.commit()
            
            saved_question = Question.query.filter_by(question="Multiple choice question").first()
            assert saved_question is not None
            assert saved_question.question_type == "multiple_choice"
            assert saved_question.question_data == question_data
    
    def test_question_task_relationship(self, app, test_task):
        """Test question-task relationship."""
        with app.app_context():
            question = Question(
                task_id=test_task.id,
                question="Test relationship",
                question_type="single_choice",
                correct_answer="A",
                difficulty="easy",
                score=5
            )
            db.session.add(question)
            db.session.commit()
            
            # Test foreign key relationship
            saved_question = Question.query.filter_by(question="Test relationship").first()
            assert saved_question.task_id == test_task.id
    
    def test_question_default_values(self, app, test_task):
        """Test question default values."""
        with app.app_context():
            question = Question(
                task_id=test_task.id,
                question="Test defaults",
                difficulty="easy",
                score=5
                # Not setting question_type to test default
            )
            db.session.add(question)
            db.session.commit()
            
            saved_question = Question.query.filter_by(question="Test defaults").first()
            assert saved_question.question_type == "single_choice"  # Default value


class TestStudentTaskResultModel:
    """Test StudentTaskResult model functionality."""
    
    def test_create_task_result(self, app, test_student, test_task):
        """Test creating a task result record."""
        with app.app_context():
            task_result = StudentTaskResult(
                student_id=test_student.student_id,
                student_name=test_student.real_name,
                task_id=test_task.id,
                task_name=test_task.name,
                total_score=85,
                started_at=datetime.now(timezone.utc),
                completed_at=datetime.now(timezone.utc)
            )
            db.session.add(task_result)
            db.session.commit()
            
            saved_result = StudentTaskResult.query.filter_by(
                student_id=test_student.student_id,
                task_id=test_task.id
            ).first()
            assert saved_result is not None
            assert saved_result.total_score == 85
            assert saved_result.student_name == test_student.real_name
            assert saved_result.task_name == test_task.name
    
    def test_task_result_relationships(self, app, test_student, test_task):
        """Test task result relationships with student and task."""
        with app.app_context():
            task_result = StudentTaskResult(
                student_id=test_student.student_id,
                student_name=test_student.real_name,
                task_id=test_task.id,
                task_name=test_task.name,
                total_score=90
            )
            db.session.add(task_result)
            db.session.commit()
            
            saved_result = StudentTaskResult.query.filter_by(
                student_id=test_student.student_id,
                task_id=test_task.id
            ).first()
            assert saved_result.student_id == test_student.student_id
            assert saved_result.task_id == test_task.id


class TestAchievementModel:
    """Test Achievement model functionality."""
    
    def test_create_achievement(self, app, test_task):
        """Test creating an achievement record."""
        with app.app_context():
            achievement = Achievement(
                task_id=test_task.id,
                name="First Task Completed",
                condition="Complete your first escape room task"
            )
            db.session.add(achievement)
            db.session.commit()
            
            saved_achievement = Achievement.query.filter_by(
                task_id=test_task.id,
                name="First Task Completed"
            ).first()
            assert saved_achievement is not None
            assert saved_achievement.name == "First Task Completed"
            assert saved_achievement.condition == "Complete your first escape room task"
    
    def test_achievement_task_relationship(self, app, test_task):
        """Test achievement-task relationship."""
        with app.app_context():
            achievement = Achievement(
                task_id=test_task.id,
                name="Speed Demon",
                condition="Complete a task in under 60 seconds"
            )
            db.session.add(achievement)
            db.session.commit()
            
            saved_achievement = Achievement.query.filter_by(
                name="Speed Demon"
            ).first()
            assert saved_achievement.task_id == test_task.id


class TestModelIntegration:
    """Test integration between different models."""
    
    def test_complete_workflow(self, app):
        """Test a complete workflow involving all models."""
        with app.app_context():
            # Create student
            student = Student(
                real_name="Integration Test Student",
                student_id="9999999",
                username="9999999@stu.com",
                password=generate_password_hash("testpass")
            )
            db.session.add(student)
            
            # Create task
            task = Task(
                name="Integration Test Task",
                introduction="Test task for integration"
            )
            db.session.add(task)
            
            db.session.commit()
            
            # Create question
            question = Question(
                task_id=task.id,
                question="Integration test question?",
                question_type="single_choice",
                option_a="Yes",
                option_b="No",
                correct_answer="A",
                difficulty="easy",
                score=10
            )
            db.session.add(question)
            
            # Create task result
            task_result = StudentTaskResult(
                student_id=student.student_id,
                student_name=student.real_name,
                task_id=task.id,
                task_name=task.name,
                total_score=100
            )
            db.session.add(task_result)
            
            # Create achievement
            achievement = Achievement(
                task_id=task.id,
                name="Perfect Score",
                condition="Score 100% on any task"
            )
            db.session.add(achievement)
            
            db.session.commit()
            
            # Verify all records were created and relationships work
            saved_student = Student.query.filter_by(student_id="9999999").first()
            saved_task = Task.query.filter_by(name="Integration Test Task").first()
            saved_question = Question.query.filter_by(task_id=saved_task.id).first()
            saved_task_result = StudentTaskResult.query.filter_by(
                student_id=saved_student.student_id,
                task_id=saved_task.id
            ).first()
            saved_achievement = Achievement.query.filter_by(
                task_id=saved_task.id
            ).first()
            
            assert saved_student is not None
            assert saved_task is not None
            assert saved_question is not None
            assert saved_task_result is not None
            assert saved_achievement is not None
            
            # Test relationships
            assert saved_question.task_id == saved_task.id
            assert saved_task_result.student_id == saved_student.student_id
            assert saved_task_result.task_id == saved_task.id
            assert saved_achievement.task_id == saved_task.id 