import os
import re
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI']    = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Models

class Student(db.Model):
    __tablename__ = 'students'
    id         = db.Column(db.Integer, primary_key=True)
    real_name  = db.Column(db.String(80), nullable=False)
    student_id = db.Column(db.String(20), unique=True, nullable=False)
    username   = db.Column(db.String(120), unique=True, nullable=False)
    password   = db.Column(db.String(255), nullable=False)

class Teacher(db.Model):
    __tablename__ = 'teachers'
    id         = db.Column(db.Integer, primary_key=True)
    real_name  = db.Column(db.String(80), nullable=False)
    teacher_id = db.Column(db.String(20), unique=True, nullable=False)
    username   = db.Column(db.String(120), unique=True, nullable=False)
    password   = db.Column(db.String(255), nullable=False)

class Task(db.Model):
    __tablename__ = 'tasks'
    id   = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)

class Question(db.Model):
    __tablename__ = 'questions'
    id              = db.Column(db.Integer, primary_key=True)
    task_id         = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    question        = db.Column(db.Text, nullable=False)
    option_a        = db.Column(db.String(255), nullable=False)
    option_b        = db.Column(db.String(255), nullable=False)
    option_c        = db.Column(db.String(255), nullable=False)
    option_d        = db.Column(db.String(255), nullable=False)
    correct_answer  = db.Column(db.String(1), nullable=False)
    difficulty      = db.Column(db.String(20), nullable=False)
    score           = db.Column(db.Integer, nullable=False)

    task = db.relationship('Task', backref=db.backref('questions', lazy=True))

class Achievement(db.Model):
    __tablename__ = 'achievements'
    id        = db.Column(db.Integer, primary_key=True)
    task_id   = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    name      = db.Column(db.String(80), unique=True, nullable=False)
    condition = db.Column(db.String(255), nullable=False)

    task = db.relationship('Task', backref=db.backref('achievements', lazy=True))

class StudentAchievement(db.Model):
    __tablename__ = 'student_achievements'
    id             = db.Column(db.Integer, primary_key=True)
    student_id     = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    achievement_id = db.Column(db.Integer, db.ForeignKey('achievements.id'), nullable=False)
    unlocked_at    = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    student     = db.relationship('Student', backref='student_achievements')
    achievement = db.relationship('Achievement', backref='student_achievements')

class StudentTaskResult(db.Model):
    __tablename__ = 'student_task_results'
    id           = db.Column(db.Integer, primary_key=True)
    student_id   = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    task_id      = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    total_score  = db.Column(db.Integer, nullable=False)
    completed_at = db.Column(db.DateTime, default=datetime.now(timezone.utc), nullable=False)

    student = db.relationship('Student', backref='task_results')
    task    = db.relationship('Task', backref='task_results')


# Authentication Routes

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    for field in ('real_name', 'id_number', 'username', 'password'):
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    match = re.match(r'^([A-Za-z]+)(\d{7})@(stu|tea)\.com$', data['username'])
    if not match:
        return jsonify({'error': 'invalid username format'}), 400

    suffix    = match.group(3)
    id_number = data['id_number']
    hashed_pw = generate_password_hash(data['password'])

    if suffix == 'stu':
        exists = Student.query.filter(
            (Student.student_id == id_number) | (Student.username == data['username'])
        ).first()
        if exists:
            return jsonify({'error': 'student already exists'}), 409
        student = Student(
            real_name  = data['real_name'],
            student_id = id_number,
            username   = data['username'],
            password   = hashed_pw
        )
        db.session.add(student)
        db.session.commit()
        return jsonify({'message': 'student registered'}), 201

    else:
        exists = Teacher.query.filter(
            (Teacher.teacher_id == id_number) | (Teacher.username == data['username'])
        ).first()
        if exists:
            return jsonify({'error': 'teacher already exists'}), 409
        teacher = Teacher(
            real_name  = data['real_name'],
            teacher_id = id_number,
            username   = data['username'],
            password   = hashed_pw
        )
        db.session.add(teacher)
        db.session.commit()
        return jsonify({'message': 'teacher registered'}), 201

@app.route('/login', methods=['POST'])
def login():
    data     = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = Student.query.filter_by(username=username).first()
    role = 'stu'
    if not user:
        user = Teacher.query.filter_by(username=username).first()
        role = 'tea'

    if user and check_password_hash(user.password, password):
        # return the user’s ID along with role
        return jsonify({
            'message': 'login success',
            'role':    role,
            'user_id': user.id
        }), 200

    return jsonify({'error': 'invalid credentials'}), 401


# Task & Question Routes

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    tasks = Task.query.all()
    return jsonify([{'id': t.id, 'name': t.name} for t in tasks]), 200

@app.route('/api/tasks/<int:task_id>/questions', methods=['GET'])
def get_questions(task_id):
    task = Task.query.get_or_404(task_id)
    result = []
    for q in task.questions:
        result.append({
            'id': q.id,
            'question': q.question,
            'options': {
                'A': q.option_a,
                'B': q.option_b,
                'C': q.option_c,
                'D': q.option_d
            },
            'difficulty': q.difficulty,
            'score': q.score
        })
    return jsonify(result), 200

@app.route('/api/tasks/<int:task_id>/submit', methods=['POST'])
def submit_task(task_id):
    data       = request.get_json()
    answers    = data.get('answers')
    student_id = data.get('student_id')
    if not isinstance(answers, dict) or not student_id:
        return jsonify({'error': 'student_id and answers required'}), 400

    total_score     = 0
    correct_count   = 0
    questions_count = 0

    # to collect correct answers for frontend
    correct_answers = {}

    # grade each question
    for q_id_str, selected in answers.items():
        q_id      = int(q_id_str)
        question  = Question.query.get(q_id)
        if not question:
            continue
        questions_count += 1
        correct_answers[q_id_str] = question.correct_answer
        if selected.upper() == question.correct_answer:
            total_score   += question.score
            correct_count += 1

    # insert or update the student's task result
    existing = StudentTaskResult.query.filter_by(
        student_id=student_id, task_id=task_id
    ).first()

    if existing:
        existing.total_score   = total_score
        existing.completed_at  = datetime.now(timezone.utc)
    else:
        new_result = StudentTaskResult(
            student_id  = student_id,
            task_id     = task_id,
            total_score = total_score,
            completed_at= datetime.now(timezone.utc)
        )
        db.session.add(new_result)

    # check full-correct achievement
    new_achievements = []
    if correct_count == questions_count:
        ach = Achievement.query.filter_by(task_id=task_id).first()
        if ach:
            unlocked = StudentAchievement.query.filter_by(
                student_id     = student_id,
                achievement_id = ach.id
            ).first()
            if not unlocked:
                sa = StudentAchievement(
                    student_id     = student_id,
                    achievement_id = ach.id,
                    unlocked_at    = datetime.now(timezone.utc)
                )
                db.session.add(sa)
                new_achievements.append({'id': ach.id, 'name': ach.name})

    db.session.commit()

    # return score, new achievements, and the map of correct answers
    return jsonify({
        'total_score':     total_score,
        'new_achievements': new_achievements,
        'correct_answers':  correct_answers
    }), 200


# Reporting Routes

@app.route('/api/students/<int:student_id>/achievements', methods=['GET'])
def get_student_achievements(student_id):
    records = StudentAchievement.query.filter_by(student_id=student_id).all()
    return jsonify([
        {
            'id': r.achievement.id,
            'name': r.achievement.name,
            'unlocked_at': r.unlocked_at.isoformat()
        }
        for r in records
    ]), 200

@app.route('/api/students/<int:student_id>/results', methods=['GET'])
def get_student_results(student_id):
    records = StudentTaskResult.query.filter_by(student_id=student_id).all()
    return jsonify([
        {
            'task_id':     r.task.id,
            'task_name':   r.task.name,
            'score':       r.total_score,
            'completed_at': r.completed_at.isoformat()
        }
        for r in records
    ]), 200


# Main entry: rebuild and seed

if __name__ == '__main__':
    with app.app_context():
        # db.dropall()
        db.create_all()
        # Seed one achievement per task
        for task in Task.query.all():
            ach_name  = f"{task.name} Master"
            condition = "all_correct"
            if not Achievement.query.filter_by(name=ach_name).first():
                ach = Achievement(task_id=task.id, name=ach_name, condition=condition)
                db.session.add(ach)
        db.session.commit()

    app.run(debug=True)
