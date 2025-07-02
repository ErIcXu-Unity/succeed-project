import os
import re
import uuid
from datetime import datetime, timezone
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI']    = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads', 'questions')
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB 文件大小限制

db = SQLAlchemy(app)

# 配置允许的图片格式
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    """检查文件扩展名是否允许"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_question_image(file, task_id):
    """保存问题图片文件并返回存储路径"""
    if file and allowed_file(file.filename):
        # 创建任务特定的目录
        task_dir = os.path.join(app.config['UPLOAD_FOLDER'], f'task_{task_id}')
        os.makedirs(task_dir, exist_ok=True)
        
        # 生成唯一文件名
        filename = secure_filename(file.filename)
        file_ext = filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
        
        # 保存文件
        file_path = os.path.join(task_dir, unique_filename)
        file.save(file_path)
        
        # 返回相对路径用于数据库存储
        return f"task_{task_id}/{unique_filename}", filename
    return None, None

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
    image_path      = db.Column(db.String(255), nullable=True)  # 图片文件路径
    image_filename  = db.Column(db.String(255), nullable=True)  # 原始文件名
    created_by      = db.Column(db.String(20), db.ForeignKey('teachers.teacher_id'), nullable=True)  # 创建教师
    created_at      = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)  # 创建时间

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
    id               = db.Column(db.Integer, primary_key=True)
    student_id       = db.Column(db.String(20), db.ForeignKey('students.student_id'), nullable=False)
    student_name     = db.Column(db.String(80), nullable=False)  # redundant field for easy access
    achievement_id   = db.Column(db.Integer, db.ForeignKey('achievements.id'), nullable=False)
    achievement_name = db.Column(db.String(80), nullable=False)  # redundant field for easy access
    unlocked_at      = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    student     = db.relationship('Student', foreign_keys=[student_id], backref='student_achievements')
    achievement = db.relationship('Achievement', backref='student_achievements')

class StudentTaskResult(db.Model):
    __tablename__ = 'student_task_results'
    id           = db.Column(db.Integer, primary_key=True)
    student_id   = db.Column(db.String(20), db.ForeignKey('students.student_id'), nullable=False)
    student_name = db.Column(db.String(80), nullable=False)  # redundant field for easy access
    task_id      = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    task_name    = db.Column(db.String(80), nullable=False)  # redundant field for easy access
    total_score  = db.Column(db.Integer, nullable=False)
    completed_at = db.Column(db.DateTime, default=datetime.now(timezone.utc), nullable=False)

    student = db.relationship('Student', foreign_keys=[student_id], backref='task_results')
    task    = db.relationship('Task', backref='task_results')


# Authentication Routes

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    for field in ('real_name', 'id_number', 'username', 'password'):
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    # Validate student ID must be exactly 7 digits
    if not re.match(r'^\d{7}$', data['id_number']):
        return jsonify({'error': 'id_number must be 7 digits'}), 400

    # Validate username must be <7digits>@stu.com and match id_number
    expected_username = f"{data['id_number']}@stu.com"
    if data['username'] != expected_username:
        return jsonify({'error': 'username must be <7 digits>@stu.com and match id_number'}), 400

    # Check if student already exists (by student_id or username)
    exists = Student.query.filter(
        (Student.student_id == data['id_number']) | (Student.username == data['username'])
    ).first()
    if exists:
        return jsonify({'error': 'student already exists'}), 409

    hashed_pw = generate_password_hash(data['password'])
    student = Student(
        real_name  = data['real_name'],
        student_id = data['id_number'],
        username   = data['username'],
        password   = hashed_pw
    )
    db.session.add(student)
    db.session.commit()
    return jsonify({'message': 'student registered'}), 201

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
        # return the user's student_id/teacher_id along with role
        user_identifier = user.student_id if role == 'stu' else user.teacher_id
        return jsonify({
            'message': 'login success',
            'role':    role,
            'user_id': user_identifier,  # now returns actual student_id/teacher_id
            'real_name': user.real_name
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
        question_data = {
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
        }
        # 添加图片路径（如果存在）
        if q.image_path:
            question_data['image_url'] = f"/uploads/questions/{q.image_path}"
        result.append(question_data)
    return jsonify(result), 200

@app.route('/api/tasks/<int:task_id>/submit', methods=['POST'])
def submit_task(task_id):
    data       = request.get_json()
    answers    = data.get('answers')
    student_id = data.get('student_id')  # now expects actual student_id (7-digit string)
    if not isinstance(answers, dict) or not student_id:
        return jsonify({'error': 'student_id and answers required'}), 400

    # Get student info for redundant fields
    student = Student.query.filter_by(student_id=student_id).first()
    if not student:
        return jsonify({'error': 'student not found'}), 404

    # Get task info for redundant fields
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'task not found'}), 404

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
        existing.student_name  = student.real_name  # update redundant field
        existing.task_name     = task.name          # update redundant field
    else:
        new_result = StudentTaskResult(
            student_id   = student_id,
            student_name = student.real_name,  # redundant field
            task_id      = task_id,
            task_name    = task.name,          # redundant field
            total_score  = total_score,
            completed_at = datetime.now(timezone.utc)
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
                    student_id       = student_id,
                    student_name     = student.real_name,  # redundant field
                    achievement_id   = ach.id,
                    achievement_name = ach.name,           # redundant field
                    unlocked_at      = datetime.now(timezone.utc)
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

# Question Management Routes

@app.route('/api/tasks/<int:task_id>/questions', methods=['POST'])
def create_question(task_id):
    """创建新问题（支持图片上传）"""
    # 验证任务存在
    task = Task.query.get_or_404(task_id)
    
    # 获取表单数据
    data = request.form
    required_fields = ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'difficulty', 'score']
    
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # 验证correct_answer格式
    if data['correct_answer'].upper() not in ['A', 'B', 'C', 'D']:
        return jsonify({'error': 'correct_answer must be A, B, C, or D'}), 400
    
    # 验证score为整数
    try:
        score = int(data['score'])
    except ValueError:
        return jsonify({'error': 'score must be an integer'}), 400
    
    # 处理图片上传（可选）
    image_path = None
    image_filename = None
    if 'image' in request.files:
        file = request.files['image']
        if file.filename:  # 确保文件被选择
            image_path, image_filename = save_question_image(file, task_id)
            if not image_path:
                return jsonify({'error': 'Invalid image file format or size'}), 400
    
    # 创建新问题
    question = Question(
        task_id=task_id,
        question=data['question'],
        option_a=data['option_a'],
        option_b=data['option_b'],
        option_c=data['option_c'],
        option_d=data['option_d'],
        correct_answer=data['correct_answer'].upper(),
        difficulty=data['difficulty'],
        score=score,
        image_path=image_path,
        image_filename=image_filename,
        created_by=data.get('created_by'),  # 可选：教师ID
        created_at=datetime.now(timezone.utc)
    )
    
    db.session.add(question)
    db.session.commit()
    
    # 返回新创建的问题详情
    result = {
        'id': question.id,
        'question': question.question,
        'options': {
            'A': question.option_a,
            'B': question.option_b,
            'C': question.option_c,
            'D': question.option_d
        },
        'difficulty': question.difficulty,
        'score': question.score,
        'image_path': question.image_path,
        'created_at': question.created_at.isoformat()
    }
    
    return jsonify(result), 201

@app.route('/uploads/questions/<path:filename>')
def uploaded_file(filename):
    """提供问题图片访问服务"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# Reporting Routes

@app.route('/api/students/<student_id>/achievements', methods=['GET'])
def get_student_achievements(student_id):
    # Now using actual student_id (string) instead of auto-increment ID
    records = StudentAchievement.query.filter_by(student_id=student_id).all()
    return jsonify([
        {
            'id': r.achievement.id,
            'name': r.achievement_name,  # use redundant field
            'student_name': r.student_name,  # use redundant field
            'unlocked_at': r.unlocked_at.isoformat()
        }
        for r in records
    ]), 200

@app.route('/api/students/<student_id>/results', methods=['GET'])
def get_student_results(student_id):
    # Now using actual student_id (string) instead of auto-increment ID
    records = StudentTaskResult.query.filter_by(student_id=student_id).all()
    return jsonify([
        {
            'task_id':     r.task_id,
            'task_name':   r.task_name,      # use redundant field
            'student_name': r.student_name,  # use redundant field
            'score':       r.total_score,
            'completed_at': r.completed_at.isoformat()
        }
        for r in records
    ]), 200


# Main entry

if __name__ == '__main__':
    with app.app_context():
        # Recreate schema from scratch each run (development only)
        # db.drop_all()
        db.create_all()

        # Seed default teacher accounts
        default_teachers = [
            {
                'real_name': 'Teacher Admin 1',
                'teacher_id': '1000',
                'username': 'st1000@tea.com',
                'password_plain': '123456'
            },
            {
                'real_name': 'Teacher Admin 2',
                'teacher_id': '1001',
                'username': 'st1001@tea.com',
                'password_plain': '123456'
            }
        ]
        for t in default_teachers:
            if not Teacher.query.filter_by(username=t['username']).first():
                db.session.add(Teacher(
                    real_name=t['real_name'],
                    teacher_id=t['teacher_id'],
                    username=t['username'],
                    password=generate_password_hash(t['password_plain'])
                ))
        db.session.commit()
        print('All tables recreated and default teacher accounts ensured.')

    app.run(debug=True)
