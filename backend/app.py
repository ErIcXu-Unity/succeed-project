import os
import re
import json
from datetime import datetime, timezone
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash

load_dotenv('.env')  # 明确指定.env 文件路径

app = Flask(__name__)

# 配置 CORS 允许跨域访问
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads', 'questions')
app.config['VIDEO_UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads', 'videos')

db = SQLAlchemy(app)

# 图片上传功能已移除，因为前端不使用

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
    id           = db.Column(db.Integer, primary_key=True)
    name         = db.Column(db.String(80), unique=True, nullable=False)
    introduction = db.Column(db.Text, nullable=True)  # 任务介绍描述
    image_path   = db.Column(db.String(255), nullable=True)  # 任务背景图片
    video_path   = db.Column(db.String(255), nullable=True)  # 本地视频文件路径
    video_url    = db.Column(db.String(500), nullable=True)  # YouTube 链接
    video_type   = db.Column(db.String(20), nullable=True)   # 'local' 或 'youtube'
    publish_at   = db.Column(db.DateTime, nullable=True) # 发布时间

class Question(db.Model):
    __tablename__ = 'questions'
    id              = db.Column(db.Integer, primary_key=True)
    task_id         = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    question        = db.Column(db.Text, nullable=False)
    
    # Question type and data
    question_type   = db.Column(db.String(50), nullable=False, default='single_choice')  # 问题类型
    question_data   = db.Column(db.Text, nullable=True)  # JSON格式存储问题特定数据
    
    # Legacy single choice fields (kept for backward compatibility)
    option_a        = db.Column(db.String(255), nullable=True)
    option_b        = db.Column(db.String(255), nullable=True)
    option_c        = db.Column(db.String(255), nullable=True)
    option_d        = db.Column(db.String(255), nullable=True)
    correct_answer  = db.Column(db.String(1), nullable=True)
    
    difficulty      = db.Column(db.String(20), nullable=False)
    score           = db.Column(db.Integer, nullable=False)
    image_path      = db.Column(db.String(255), nullable=True)  # 图片文件路径
    image_filename  = db.Column(db.String(255), nullable=True)  # 原始文件名
    video_path      = db.Column(db.String(255), nullable=True)  # 视频文件路径
    video_filename  = db.Column(db.String(255), nullable=True)  # 原始视频文件名
    video_url       = db.Column(db.String(500), nullable=True)  # YouTube 视频链接
    video_type      = db.Column(db.String(20), nullable=True)   # 'local' 或 'youtube'
    description     = db.Column(db.Text, nullable=True)         # 文字描述/解释
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
    started_at   = db.Column(db.DateTime, nullable=True)  # 任务开始时间
    completed_at = db.Column(db.DateTime, default=datetime.now(timezone.utc), nullable=False)

    student = db.relationship('Student', foreign_keys=[student_id], backref='task_results')
    task    = db.relationship('Task', backref='task_results')

class StudentTaskProcess(db.Model):
    __tablename__ = 'student_task_processes'
    id                   = db.Column(db.Integer, primary_key=True)
    student_id           = db.Column(db.String(20), db.ForeignKey('students.student_id'), nullable=False)
    student_name         = db.Column(db.String(80), nullable=False)  # redundant field for easy access
    task_id              = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    task_name            = db.Column(db.String(80), nullable=False)  # redundant field for easy access
    current_question_index = db.Column(db.Integer, nullable=False, default=0)  # 当前题目索引
    answers_json         = db.Column(db.Text, nullable=True)  # JSON 格式存储已选择的答案
    saved_at             = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at           = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    student = db.relationship('Student', foreign_keys=[student_id], backref='task_processes')
    task    = db.relationship('Task', backref='task_processes')


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

    hashed_pw = generate_password_hash(data['password'], method='pbkdf2:sha256')
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
    # tasks = Task.query.all()

    role = request.args.get('role', 'stu')  # 默认为 student
    now = datetime.now(timezone.utc)

    if role == 'tea':
        tasks = Task.query.all()  # 老师看到所有任务
    else:
        tasks = Task.query.filter(
            (Task.publish_at == None) | (Task.publish_at <= now)
        ).all()

    result = []
    for t in tasks:
        task_data = {
            'id': t.id, 
            'name': t.name,
            'introduction': t.introduction,
            'question_count': len(t.questions),
            'publish_at': t.publish_at.isoformat() if t.publish_at else None
        }
        if t.image_path:
            task_data['image_url'] = f"/uploads/tasks/{t.image_path}"
        
        # 添加视频信息
        if t.video_type:
            task_data['video_type'] = t.video_type
            if t.video_type == 'local' and t.video_path:
                task_data['video_url'] = f"/uploads/videos/{t.video_path}"
            elif t.video_type == 'youtube' and t.video_url:
                task_data['video_url'] = t.video_url
        
        result.append(task_data)
    return jsonify(result), 200

@app.route('/api/tasks', methods=['POST'])
def create_task():
    """创建新任务"""
    data = request.get_json()
    
    # 验证必填字段
    if not data.get('name'):
        return jsonify({'error': 'Task name is required'}), 400
    
    if not data.get('introduction'):
        return jsonify({'error': 'Task introduction is required'}), 400
    
    # 检查任务名称唯一性
    existing_task = Task.query.filter_by(name=data['name']).first()
    if existing_task:
        return jsonify({'error': 'Task name already exists'}), 409
    
    try:
        # 解析发布时间（可选字段）
        publish_at = None
        if data.get('publish_at'):
            try:
                publish_at = datetime.fromisoformat(data['publish_at'].replace('Z', '+00:00'))
            except Exception:
                return jsonify({'error': 'Invalid publish_at datetime format'}), 400
        
        # 创建新任务
        new_task = Task(
            name=data['name'],
            introduction=data['introduction'],
            publish_at=publish_at
        )
        db.session.add(new_task)
        db.session.commit()
        
        # 返回新创建的任务信息
        return jsonify({
            'message': 'Task created successfully',
            'task': {
                'id': new_task.id,
                'name': new_task.name,
                'introduction': new_task.introduction,
                'publish_at': new_task.publish_at.isoformat() if new_task.publish_at else None,
                'question_count': 0
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create task: {str(e)}'}), 500

@app.route('/api/tasks/<int:task_id>', methods=['GET'])
def get_task_detail(task_id):
    """获取任务详情"""
    task = Task.query.get_or_404(task_id)
    result = {
        'id': task.id,
        'name': task.name,
        'introduction': task.introduction,
        'question_count': len(task.questions),
        'publish_at': task.publish_at.isoformat() if task.publish_at else None
    }
    if task.image_path:
        result['image_url'] = f"/uploads/tasks/{task.image_path}"
    
    # 添加视频信息
    if task.video_type:
        result['video_type'] = task.video_type
        if task.video_type == 'local' and task.video_path:
            result['video_path'] = task.video_path
            result['video_url'] = f"/uploads/videos/{task.video_path}"
        elif task.video_type == 'youtube' and task.video_url:
            result['video_url'] = task.video_url
    
    return jsonify(result), 200

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """更新任务信息"""
    task = Task.query.get_or_404(task_id)
    data = request.get_json()
    
    if 'name' in data:
        task.name = data['name']
    if 'introduction' in data:
        task.introduction = data['introduction']
    if 'publish_at' in data:
        if data['publish_at']:
            try:
                # 兼容 ISO 格式和带 Z 的时间
                task.publish_at = datetime.fromisoformat(data['publish_at'].replace('Z', '+00:00'))
            except Exception:
                return jsonify({'error': 'Invalid publish_at format'}), 400
        else:
            task.publish_at = None
    
    # 处理视频相关字段 - 确保不会丢失现有的视频信息
    # 只有在明确提供视频信息时才更新
    if 'video_type' in data:
        task.video_type = data['video_type']
        if data['video_type'] == 'local' and 'video_path' in data:
            task.video_path = data['video_path']
            task.video_url = None  # 清除 YouTube 链接
        elif data['video_type'] == 'youtube' and 'video_url' in data:
            task.video_url = data['video_url']
            task.video_path = None  # 清除本地视频路径
        elif data['video_type'] is None:
            # 清除所有视频信息
            task.video_type = None
            task.video_path = None
            task.video_url = None
    
    try:
        db.session.commit()
        
        # 构建返回的 task 信息，包含视频信息
        task_response = {
            'id': task.id,
            'name': task.name,
            'introduction': task.introduction,
            'publish_at': task.publish_at.isoformat() if task.publish_at else None
        }
        
        # 添加视频信息到响应中
        if task.video_type:
            task_response['video_type'] = task.video_type
            if task.video_type == 'local' and task.video_path:
                task_response['video_url'] = f"/uploads/videos/{task.video_path}"
            elif task.video_type == 'youtube' and task.video_url:
                task_response['video_url'] = task.video_url
        
        return jsonify({
            'message': 'Task updated successfully',
            'task': task_response
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """删除任务及其相关数据"""
    # 验证任务存在
    task = Task.query.get_or_404(task_id)
    
    try:
        # 开始事务 - 级联删除相关数据
        
        # 1. 删除学生任务进度
        StudentTaskProcess.query.filter_by(task_id=task_id).delete()
        
        # 2. 删除学生任务结果
        StudentTaskResult.query.filter_by(task_id=task_id).delete()
        
        # 3. 删除相关成就记录（如果成就是任务特定的）
        task_achievements = Achievement.query.filter_by(task_id=task_id).all()
        for achievement in task_achievements:
            # 删除学生获得的这些成就
            StudentAchievement.query.filter_by(achievement_id=achievement.id).delete()
            # 删除成就本身
            db.session.delete(achievement)
        
        # 4. 删除任务的所有问题
        Question.query.filter_by(task_id=task_id).delete()
        
        # 5. 最后删除任务本身
        db.session.delete(task)
        
        # 提交事务
        db.session.commit()
        
        return jsonify({
            'message': 'Task deleted successfully',
            'deleted_task_id': task_id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete task: {str(e)}'}), 500

@app.route('/api/tasks/<int:task_id>/questions', methods=['GET'])
def get_questions(task_id):
    task = Task.query.get_or_404(task_id)
    result = []
    for q in task.questions:
        question_data = {
            'id': q.id,
            'question': q.question,
            'question_type': q.question_type or 'single_choice',
            'question_data': q.question_data,
            'correct_answer': q.correct_answer,
            'options': {
                'A': q.option_a,
                'B': q.option_b,
                'C': q.option_c,
                'D': q.option_d
            },
            'option_a': q.option_a,
            'option_b': q.option_b,
            'option_c': q.option_c,
            'option_d': q.option_d,
            'difficulty': q.difficulty,
            'score': q.score,
            'description': q.description
        }
        # 添加图片路径（如果存在）
        if q.image_path:
            question_data['image_url'] = f"/uploads/questions/{q.image_path}"
        
        # 添加视频信息（如果存在）
        if q.video_type == 'local' and q.video_path:
            question_data['video_url'] = f"/uploads/videos/{q.video_path}"
            question_data['video_type'] = 'local'
        elif q.video_type == 'youtube' and q.video_url:
            question_data['video_url'] = q.video_url
            question_data['video_type'] = 'youtube'
        result.append(question_data)
    return jsonify(result), 200

@app.route('/api/questions/<int:question_id>/check', methods=['POST'])
def check_answer(question_id):
    """检查单个问题的答案"""
    data = request.get_json()
    selected_answer = data.get('answer')
    
    if not selected_answer:
        return jsonify({'error': 'answer required'}), 400
    
    question = Question.query.get_or_404(question_id)
    
    is_correct = selected_answer.upper() == question.correct_answer
    
    result = {
        'correct': is_correct,
        'correct_answer': question.correct_answer,
        'explanation': f"The correct answer is {question.correct_answer}",
        'score': question.score if is_correct else 0
    }
    
    return jsonify(result), 200

@app.route('/api/tasks/<int:task_id>/submit', methods=['POST'])
def submit_task(task_id):
    data       = request.get_json()
    answers    = data.get('answers')
    student_id = data.get('student_id')  # now expects actual student_id (7-digit string)
    started_at = data.get('started_at')  # 任务开始时间
    
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

    # 解析开始时间
    task_started_at = None
    if started_at:
        try:
            task_started_at = datetime.fromisoformat(started_at.replace('Z', '+00:00'))
        except:
            task_started_at = None

    # insert or update the student's task result
    existing = StudentTaskResult.query.filter_by(
        student_id=student_id, task_id=task_id
    ).first()

    current_time = datetime.now(timezone.utc)
    if existing:
        existing.total_score   = total_score
        existing.completed_at  = current_time
        existing.student_name  = student.real_name  # update redundant field
        existing.task_name     = task.name          # update redundant field
        if task_started_at:
            existing.started_at = task_started_at
    else:
        new_result = StudentTaskResult(
            student_id   = student_id,
            student_name = student.real_name,  # redundant field
            task_id      = task_id,
            task_name    = task.name,          # redundant field
            total_score  = total_score,
            started_at   = task_started_at,
            completed_at = current_time
        )
        db.session.add(new_result)

    # 检查所有成就
    new_achievements = []
    
    # 1. Perfect Score - 单个任务全部答对
    if correct_count == questions_count and questions_count > 0:
        perfect_score_achievement = Achievement.query.filter_by(name='Perfect Score').first()
        if perfect_score_achievement:
            existing_achievement = StudentAchievement.query.filter_by(
                student_id=student_id, achievement_id=perfect_score_achievement.id
            ).first()
            if not existing_achievement:
                sa = StudentAchievement(
                    student_id=student_id,
                    student_name=student.real_name,
                    achievement_id=perfect_score_achievement.id,
                    achievement_name=perfect_score_achievement.name,
                    unlocked_at=current_time
                )
                db.session.add(sa)
                new_achievements.append({'id': perfect_score_achievement.id, 'name': perfect_score_achievement.name})

    # 2. Fast Solver - 快速完成任务（设定 10 分钟内完成）
    if task_started_at and current_time:
        time_taken = (current_time - task_started_at).total_seconds() / 60  # 转换为分钟
        if time_taken <= 10:  # 10 分钟内完成
            fast_solver_achievement = Achievement.query.filter_by(name='Fast Solver').first()
            if fast_solver_achievement:
                existing_achievement = StudentAchievement.query.filter_by(
                    student_id=student_id, achievement_id=fast_solver_achievement.id
                ).first()
                if not existing_achievement:
                    sa = StudentAchievement(
                        student_id=student_id,
                        student_name=student.real_name,
                        achievement_id=fast_solver_achievement.id,
                        achievement_name=fast_solver_achievement.name,
                        unlocked_at=current_time
                    )
                    db.session.add(sa)
                    new_achievements.append({'id': fast_solver_achievement.id, 'name': fast_solver_achievement.name})

    db.session.commit()

    # 3. Accuracy Master - 总体准确率达到 90% 以上（需要在 commit 后计算）
    all_results = StudentTaskResult.query.filter_by(student_id=student_id).all()
    total_questions = 0
    total_correct = 0
    
    for result in all_results:
        task_questions = Question.query.filter_by(task_id=result.task_id).all()
        task_total_score = sum(q.score for q in task_questions)
        
        if task_total_score > 0:
            # 计算这个任务的正确题目数
            task_correct_ratio = result.total_score / task_total_score
            task_question_count = len(task_questions)
            
            total_questions += task_question_count
            total_correct += int(task_correct_ratio * task_question_count)
    
    if total_questions > 0:
        accuracy_rate = (total_correct / total_questions) * 100
        if accuracy_rate >= 90:
            accuracy_master_achievement = Achievement.query.filter_by(name='Accuracy Master').first()
            if accuracy_master_achievement:
                existing_achievement = StudentAchievement.query.filter_by(
                    student_id=student_id, achievement_id=accuracy_master_achievement.id
                ).first()
                if not existing_achievement:
                    sa = StudentAchievement(
                        student_id=student_id,
                        student_name=student.real_name,
                        achievement_id=accuracy_master_achievement.id,
                        achievement_name=accuracy_master_achievement.name,
                        unlocked_at=current_time
                    )
                    db.session.add(sa)
                    new_achievements.append({'id': accuracy_master_achievement.id, 'name': accuracy_master_achievement.name})

    # 4. Quiz Warrior - 完成所有四个任务
    completed_task_count = len(all_results)
    total_task_count = Task.query.count()
    
    if completed_task_count >= total_task_count and total_task_count >= 4:
        quiz_warrior_achievement = Achievement.query.filter_by(name='Quiz Warrior').first()
        if quiz_warrior_achievement:
            existing_achievement = StudentAchievement.query.filter_by(
                student_id=student_id, achievement_id=quiz_warrior_achievement.id
            ).first()
            if not existing_achievement:
                sa = StudentAchievement(
                    student_id=student_id,
                    student_name=student.real_name,
                    achievement_id=quiz_warrior_achievement.id,
                    achievement_name=quiz_warrior_achievement.name,
                    unlocked_at=current_time
                )
                db.session.add(sa)
                new_achievements.append({'id': quiz_warrior_achievement.id, 'name': quiz_warrior_achievement.name})

    db.session.commit()

    # 任务完成后删除进度记录
    try:
        progress_record = StudentTaskProcess.query.filter_by(
            student_id=student_id, task_id=task_id
        ).first()
        if progress_record:
            db.session.delete(progress_record)
            db.session.commit()
    except Exception as e:
        # 进度删除失败不影响主流程
        print(f"Warning: Failed to delete progress record: {str(e)}")

    # return score, new achievements, and the map of correct answers
    return jsonify({
        'total_score':     total_score,
        'new_achievements': new_achievements,
        'correct_answers':  correct_answers
    }), 200

# Task Progress Routes

@app.route('/api/tasks/<int:task_id>/save-progress', methods=['POST'])
def save_task_progress(task_id):
    """保存答题进度"""
    data = request.get_json()
    student_id = data.get('student_id')
    current_question_index = data.get('current_question_index', 0)
    answers = data.get('answers', {})
    
    if not student_id:
        return jsonify({'error': 'student_id required'}), 400
    
    # 获取学生和任务信息
    student = Student.query.filter_by(student_id=student_id).first()
    if not student:
        return jsonify({'error': 'student not found'}), 404
    
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'task not found'}), 404
    
    # 查找现有进度记录
    existing_process = StudentTaskProcess.query.filter_by(
        student_id=student_id, task_id=task_id
    ).first()
    
    try:
        if existing_process:
            # 更新现有记录
            existing_process.current_question_index = current_question_index
            existing_process.answers_json = json.dumps(answers)
            existing_process.updated_at = datetime.now(timezone.utc)
        else:
            # 创建新记录
            new_process = StudentTaskProcess(
                student_id=student_id,
                student_name=student.real_name,
                task_id=task_id,
                task_name=task.name,
                current_question_index=current_question_index,
                answers_json=json.dumps(answers),
                saved_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            db.session.add(new_process)
        
        db.session.commit()
        return jsonify({'message': 'Progress saved successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to save progress: {str(e)}'}), 500

@app.route('/api/tasks/<int:task_id>/progress', methods=['GET'])
def get_task_progress(task_id):
    """获取答题进度"""
    student_id = request.args.get('student_id')
    
    if not student_id:
        return jsonify({'error': 'student_id required'}), 400
    
    # 查找进度记录
    process = StudentTaskProcess.query.filter_by(
        student_id=student_id, task_id=task_id
    ).first()
    
    if not process:
        return jsonify({'has_progress': False}), 200
    
    try:
        answers = json.loads(process.answers_json) if process.answers_json else {}
        return jsonify({
            'has_progress': True,
            'current_question_index': process.current_question_index,
            'answers': answers,
            'saved_at': process.saved_at.isoformat(),
            'updated_at': process.updated_at.isoformat()
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to load progress: {str(e)}'}), 500

@app.route('/api/tasks/<int:task_id>/progress', methods=['DELETE'])
def delete_task_progress(task_id):
    """删除答题进度（完成任务后清理）"""
    student_id = request.args.get('student_id')
    
    if not student_id:
        return jsonify({'error': 'student_id required'}), 400
    
    try:
        # 查找并删除进度记录
        process = StudentTaskProcess.query.filter_by(
            student_id=student_id, task_id=task_id
        ).first()
        
        if process:
            db.session.delete(process)
            db.session.commit()
            return jsonify({'message': 'Progress deleted successfully'}), 200
        else:
            return jsonify({'message': 'No progress found'}), 200
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete progress: {str(e)}'}), 500

@app.route('/api/students/<student_id>/task-progress', methods=['GET'])
def get_student_task_progress(student_id):
    """获取学生所有任务的进度状态"""
    try:
        processes = StudentTaskProcess.query.filter_by(student_id=student_id).all()
        
        progress_map = {}
        for process in processes:
            progress_map[process.task_id] = {
                'has_progress': True,
                'current_question_index': process.current_question_index,
                'saved_at': process.saved_at.isoformat(),
                'updated_at': process.updated_at.isoformat()
            }
        
        return jsonify(progress_map), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get progress: {str(e)}'}), 500

# Question Management Routes

@app.route('/api/tasks/<int:task_id>/questions', methods=['POST'])
def create_single_question(task_id):
    """创建单个问题（支持多种问题类型）"""
    # 验证任务存在
    task = Task.query.get_or_404(task_id)
    
    # 检查当前任务的问题数量
    current_question_count = Question.query.filter_by(task_id=task_id).count()
    if current_question_count >= 5:
        return jsonify({'error': 'Maximum 5 questions allowed per task'}), 400
    
    try:
        # 从表单数据获取基本字段
        question_text = request.form.get('question')
        question_type = request.form.get('question_type', 'single_choice')
        difficulty = request.form.get('difficulty', 'Easy')
        score = request.form.get('score', '3')
        description = request.form.get('description', '')  # 文字描述
        created_by = request.form.get('created_by')
        
        # 验证必填字段
        if not question_text:
            return jsonify({'error': 'Question text is required'}), 400
        
        # 验证分数
        try:
            score = int(score)
        except ValueError:
            return jsonify({'error': 'Score must be a number'}), 400
        
        # 根据问题类型验证和处理数据
        question_data = {}
        option_a = option_b = option_c = option_d = correct_answer = None
        
        if question_type == 'single_choice':
            option_a = request.form.get('option_a')
            option_b = request.form.get('option_b')
            option_c = request.form.get('option_c')
            option_d = request.form.get('option_d')
            correct_answer = request.form.get('correct_answer', 'A')
            
            if not option_a or not option_b or not option_c or not option_d:
                return jsonify({'error': 'All options are required for single choice questions'}), 400
            if correct_answer.upper() not in ['A', 'B', 'C', 'D']:
                return jsonify({'error': 'Correct answer must be A, B, C, or D'}), 400
                
        elif question_type == 'multiple_choice':
            options = []
            correct_answers = []
            i = 0
            while request.form.get(f'options[{i}]') is not None:
                options.append(request.form.get(f'options[{i}]'))
                i += 1
            
            # Parse correct_answers array
            i = 0
            while request.form.get(f'correct_answers[{i}]') is not None:
                correct_answers.append(int(request.form.get(f'correct_answers[{i}]')))
                i += 1
            
            if len(options) < 2:
                return jsonify({'error': 'At least 2 options required for multiple choice questions'}), 400
            if len(correct_answers) == 0:
                return jsonify({'error': 'At least one correct answer required for multiple choice questions'}), 400
                
            question_data = {'options': options, 'correct_answers': correct_answers}
            
        elif question_type == 'fill_blank':
            blank_answers = []
            i = 0
            while request.form.get(f'blank_answers[{i}]') is not None:
                blank_answers.append(request.form.get(f'blank_answers[{i}]'))
                i += 1
            
            if len(blank_answers) == 0:
                return jsonify({'error': 'At least one blank answer required'}), 400
                
            question_data = {'blank_answers': blank_answers}
            
        elif question_type == 'puzzle_game':
            puzzle_solution = request.form.get('puzzle_solution')
            puzzle_fragments = []
            i = 0
            while request.form.get(f'puzzle_fragments[{i}]') is not None:
                puzzle_fragments.append(request.form.get(f'puzzle_fragments[{i}]'))
                i += 1
            
            if not puzzle_solution:
                return jsonify({'error': 'Puzzle solution is required'}), 400
            if len(puzzle_fragments) == 0:
                return jsonify({'error': 'At least one puzzle fragment required'}), 400
                
            question_data = {'puzzle_solution': puzzle_solution, 'puzzle_fragments': puzzle_fragments}
            
        elif question_type == 'matching_task':
            left_items = []
            right_items = []
            correct_matches = []
            
            i = 0
            while request.form.get(f'left_items[{i}]') is not None:
                left_items.append(request.form.get(f'left_items[{i}]'))
                i += 1
                
            i = 0
            while request.form.get(f'right_items[{i}]') is not None:
                right_items.append(request.form.get(f'right_items[{i}]'))
                i += 1
            
            # Parse correct_matches array of objects
            i = 0
            while request.form.get(f'correct_matches[{i}][left]') is not None:
                left_idx = int(request.form.get(f'correct_matches[{i}][left]'))
                right_idx = int(request.form.get(f'correct_matches[{i}][right]'))
                correct_matches.append({'left': left_idx, 'right': right_idx})
                i += 1
            
            if len(left_items) < 2 or len(right_items) < 2:
                return jsonify({'error': 'At least 2 items required on each side for matching tasks'}), 400
            if len(correct_matches) == 0:
                return jsonify({'error': 'At least one correct match required'}), 400
                
            question_data = {'left_items': left_items, 'right_items': right_items, 'correct_matches': correct_matches}
            
        elif question_type == 'error_spotting':
            error_spots = []
            i = 0
            while request.form.get(f'error_spots[{i}][x]') is not None:
                x = int(request.form.get(f'error_spots[{i}][x]'))
                y = int(request.form.get(f'error_spots[{i}][y]'))
                desc = request.form.get(f'error_spots[{i}][description]')
                error_spots.append({'x': x, 'y': y, 'description': desc})
                i += 1
            
            if len(error_spots) == 0:
                return jsonify({'error': 'At least one error spot required'}), 400
                
            question_data = {'error_spots': error_spots}
            
        else:
            return jsonify({'error': 'Invalid question type'}), 400
        
        # 检查是否至少有一种描述（图片、视频或文字描述）
        has_image = 'image' in request.files and request.files['image'].filename != ''
        has_video = 'video' in request.files and request.files['video'].filename != ''
        has_youtube = request.form.get('youtube_url', '').strip() != ''
        has_description = description.strip() != ''
        
        # Error spotting requires an image
        if question_type == 'error_spotting' and not has_image:
            return jsonify({'error': 'Error spotting questions require an image'}), 400
        
        # 创建问题对象
        new_question = Question(
            task_id=task_id,
            question=question_text,
            question_type=question_type,
            question_data=json.dumps(question_data) if question_data else None,
            option_a=option_a,
            option_b=option_b,
            option_c=option_c,
            option_d=option_d,
            correct_answer=correct_answer.upper() if correct_answer else None,
            difficulty=difficulty,
            score=score,
            description=description if has_description else None,
            created_by=created_by,
            created_at=datetime.now(timezone.utc)
        )
        
        # 处理图片上传
        if has_image:
            image_file = request.files['image']
            if image_file and image_file.filename:
                # 验证图片格式
                allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
                file_extension = image_file.filename.rsplit('.', 1)[1].lower()
                if file_extension not in allowed_extensions:
                    return jsonify({'error': 'Invalid image format. Allowed: png, jpg, jpeg, gif, webp'}), 400
                
                # 生成唯一文件名
                import uuid
                unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
                
                # 确保上传目录存在
                task_upload_dir = os.path.join(app.config['UPLOAD_FOLDER'], f'task_{task_id}')
                os.makedirs(task_upload_dir, exist_ok=True)
                
                # 保存图片
                image_path = os.path.join(task_upload_dir, unique_filename)
                image_file.save(image_path)
                
                # 设置相对路径用于数据库存储和 URL 生成
                new_question.image_path = f"task_{task_id}/{unique_filename}"
                new_question.image_filename = image_file.filename
        
        # 处理视频上传
        if has_video:
            video_file = request.files['video']
            if video_file and video_file.filename:
                # 验证视频格式
                allowed_video_extensions = {'mp4', 'avi', 'mov', 'wmv', 'webm'}
                file_extension = video_file.filename.rsplit('.', 1)[1].lower()
                if file_extension not in allowed_video_extensions:
                    return jsonify({'error': 'Invalid video format. Allowed: mp4, avi, mov, wmv, webm'}), 400
                
                # 验证文件大小 (最大 50MB)
                max_size = 50 * 1024 * 1024  # 50MB
                if request.content_length and request.content_length > max_size:
                    return jsonify({'error': 'Video file too large. Maximum size: 50MB'}), 400
                
                # 生成唯一文件名
                import uuid
                unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
                
                # 确保上传目录存在
                video_upload_dir = os.path.join(app.config['VIDEO_UPLOAD_FOLDER'])
                os.makedirs(video_upload_dir, exist_ok=True)
                
                # 保存视频
                video_path = os.path.join(video_upload_dir, unique_filename)
                video_file.save(video_path)
                
                # 设置视频信息
                new_question.video_path = unique_filename
                new_question.video_filename = video_file.filename
                new_question.video_type = 'local'
        
        # 处理 YouTube 链接
        elif has_youtube:
            youtube_url = request.form.get('youtube_url').strip()
            # 简单的 YouTube URL 验证
            if 'youtube.com/watch' in youtube_url or 'youtu.be/' in youtube_url:
                new_question.video_url = youtube_url
                new_question.video_type = 'youtube'
            else:
                return jsonify({'error': 'Invalid YouTube URL'}), 400
        
        # 保存到数据库
        db.session.add(new_question)
        db.session.commit()
        
        # 构建返回数据
        result = {
            'id': new_question.id,
            'question': new_question.question,
            'options': {
                'A': new_question.option_a,
                'B': new_question.option_b,
                'C': new_question.option_c,
                'D': new_question.option_d
            },
            'correct_answer': new_question.correct_answer,
            'difficulty': new_question.difficulty,
            'score': new_question.score,
            'description': new_question.description,
            'created_by': new_question.created_by,
            'created_at': new_question.created_at.isoformat()
        }
        
        # 添加媒体文件 URL
        if new_question.image_path:
            result['image_url'] = f"/uploads/questions/{new_question.image_path}"
        
        if new_question.video_type == 'local' and new_question.video_path:
            result['video_url'] = f"/uploads/videos/{new_question.video_path}"
            result['video_type'] = 'local'
        elif new_question.video_type == 'youtube' and new_question.video_url:
            result['video_url'] = new_question.video_url
            result['video_type'] = 'youtube'
        
        return jsonify({
            'message': 'Question created successfully',
            'question': result
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create question: {str(e)}'}), 500

@app.route('/api/tasks/<int:task_id>/questions/batch', methods=['POST'])
def create_questions_batch(task_id):
    """批量创建问题"""
    # 验证任务存在
    task = Task.query.get_or_404(task_id)
    
    data = request.get_json()
    questions_data = data.get('questions', [])
    
    if not questions_data:
        return jsonify({'error': 'No questions provided'}), 400
    
    if len(questions_data) > 5:
        return jsonify({'error': 'Maximum 5 questions allowed per batch'}), 400
    
    created_questions = []
    errors = []
    
    try:
        for i, q_data in enumerate(questions_data):
            # 验证每个问题的必填字段
            required_fields = ['question', 'option_a', 'option_b', 'option_c', 'option_d', 
                             'correct_answer', 'difficulty', 'score']
            
            missing_fields = [field for field in required_fields if not q_data.get(field)]
            if missing_fields:
                errors.append(f"Question {i+1}: Missing fields: {', '.join(missing_fields)}")
                continue
            
            # 验证分数
            try:
                score = int(q_data['score'])
            except ValueError:
                errors.append(f"Question {i+1}: Score must be a number")
                continue
            
            # 验证正确答案
            if q_data['correct_answer'].upper() not in ['A', 'B', 'C', 'D']:
                errors.append(f"Question {i+1}: Correct answer must be A, B, C, or D")
                continue
            
            # 创建问题
            question = Question(
                task_id=task_id,
                question=q_data['question'],
                option_a=q_data['option_a'],
                option_b=q_data['option_b'],
                option_c=q_data['option_c'],
                option_d=q_data['option_d'],
                correct_answer=q_data['correct_answer'].upper(),
                difficulty=q_data['difficulty'],
                score=score,
                created_by=data.get('created_by'),
                created_at=datetime.now(timezone.utc)
            )
            
            db.session.add(question)
            created_questions.append(question)
        
        if errors:
            db.session.rollback()
            return jsonify({'errors': errors}), 400
        
        db.session.commit()
        
        # 构建返回数据
        result = []
        for question in created_questions:
            q_data = {
                'id': question.id,
                'question': question.question,
                'options': {
                    'A': question.option_a,
                    'B': question.option_b,
                    'C': question.option_c,
                    'D': question.option_d
                },
                'correct_answer': question.correct_answer,
                'difficulty': question.difficulty,
                'score': question.score,
                'created_by': question.created_by,
                'created_at': question.created_at.isoformat()
            }
            result.append(q_data)
        
        return jsonify({
            'message': f'{len(created_questions)} questions created successfully',
            'questions': result
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@app.route('/api/questions/<int:question_id>', methods=['DELETE'])
def delete_question(question_id):
    """删除单个问题"""
    try:
        question = Question.query.get_or_404(question_id)
        
        # 删除相关的文件
        if question.image_path:
            try:
                image_file_path = os.path.join(app.config['UPLOAD_FOLDER'], question.image_path)
                if os.path.exists(image_file_path):
                    os.remove(image_file_path)
            except Exception as e:
                print(f"Warning: Failed to delete image file: {str(e)}")
        
        if question.video_path:
            try:
                video_file_path = os.path.join(app.config['VIDEO_UPLOAD_FOLDER'], question.video_path)
                if os.path.exists(video_file_path):
                    os.remove(video_file_path)
            except Exception as e:
                print(f"Warning: Failed to delete video file: {str(e)}")
        
        # 从数据库中删除问题
        db.session.delete(question)
        db.session.commit()
        
        return jsonify({'message': 'Question deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete question: {str(e)}'}), 500

@app.route('/uploads/questions/<path:filename>')
def uploaded_file(filename):
    """提供问题图片访问服务"""
    uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads')
    return send_from_directory(uploads_dir, f'questions/{filename}')

@app.route('/uploads/videos/<path:filename>')
def uploaded_video_file(filename):
    """提供问题视频访问服务"""
    return send_from_directory(app.config['VIDEO_UPLOAD_FOLDER'], filename)

# Video Upload Routes

@app.route('/api/tasks/<int:task_id>/video', methods=['POST'])
def upload_task_video(task_id):
    """上传任务视频文件"""
    task = Task.query.get_or_404(task_id)
    
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400
    
    file = request.files['video']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # 验证文件类型
    allowed_extensions = {'mp4', 'avi', 'mov', 'wmv', 'webm'}
    if not ('.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
        return jsonify({'error': 'Invalid video format. Allowed: mp4, avi, mov, wmv, webm'}), 400
    
    # 验证文件大小 (最大 100MB)
    max_size = 100 * 1024 * 1024  # 100MB
    if request.content_length and request.content_length > max_size:
        return jsonify({'error': 'Video file too large. Maximum size: 100MB'}), 400
    
    try:
        # 创建安全的文件名
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        filename = f"task_{task_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{file_extension}"
        video_path = os.path.join(app.config['VIDEO_UPLOAD_FOLDER'], filename)
        
        # 确保目录存在
        os.makedirs(app.config['VIDEO_UPLOAD_FOLDER'], exist_ok=True)
        
        # 保存文件
        file.save(video_path)
        
        # 更新数据库
        task.video_path = filename
        task.video_type = 'local'
        task.video_url = f'/uploads/videos/{filename}'  # 设置本地视频访问路径
        db.session.commit()
        
        return jsonify({
            'message': 'Video uploaded successfully',
            'video_url': f'/uploads/videos/{filename}',
            'video_type': 'local'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to upload video: {str(e)}'}), 500

@app.route('/api/tasks/<int:task_id>/youtube', methods=['POST'])
def save_youtube_url(task_id):
    """保存 YouTube 视频链接"""
    task = Task.query.get_or_404(task_id)
    data = request.get_json()
    
    youtube_url = data.get('youtube_url')
    if not youtube_url:
        return jsonify({'error': 'YouTube URL is required'}), 400
    
    # 简单的 YouTube URL 验证
    if 'youtube.com/watch' not in youtube_url and 'youtu.be/' not in youtube_url:
        return jsonify({'error': 'Invalid YouTube URL'}), 400
    
    try:
        # 更新数据库
        task.video_url = youtube_url
        task.video_type = 'youtube'
        task.video_path = None  # 清除本地视频路径
        db.session.commit()
        
        return jsonify({
            'message': 'YouTube URL saved successfully',
            'video_url': youtube_url,
            'video_type': 'youtube'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to save YouTube URL: {str(e)}'}), 500

@app.route('/uploads/videos/<path:filename>')
def uploaded_video(filename):
    """提供视频文件访问服务"""
    return send_from_directory(app.config['VIDEO_UPLOAD_FOLDER'], filename)

@app.route('/api/tasks/<int:task_id>/video', methods=['DELETE'])
def delete_task_video(task_id):
    """删除任务的视频"""
    task = Task.query.get_or_404(task_id)
    
    try:
        # 如果是本地视频，删除文件
        if task.video_type == 'local' and task.video_path:
            video_file_path = os.path.join(app.config['VIDEO_UPLOAD_FOLDER'], os.path.basename(task.video_path))
            if os.path.exists(video_file_path):
                os.remove(video_file_path)
                print(f"Deleted video file: {video_file_path}")
        
        # 清除数据库中的视频信息
        task.video_path = None
        task.video_url = None
        task.video_type = None
        
        db.session.commit()
        
        return jsonify({
            'message': 'Video deleted successfully',
            'task': {
                'id': task.id,
                'name': task.name,
                'video_path': task.video_path,
                'video_url': task.video_url,
                'video_type': task.video_type
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting video: {e}")
        return jsonify({'error': 'Failed to delete video'}), 500


# Student Profile and Achievement Routes

@app.route('/api/students/<student_id>/profile', methods=['GET'])
def get_student_profile(student_id):
    """获取学生完整档案信息"""
    # 获取学生基本信息
    student = Student.query.filter_by(student_id=student_id).first()
    if not student:
        return jsonify({'error': 'student not found'}), 404
    
    # 获取学生所有任务结果
    task_results = StudentTaskResult.query.filter_by(student_id=student_id).all()
    
    # 计算统计数据
    total_tasks_completed = len(task_results)
    total_questions = 0
    total_correct = 0
    total_score = 0
    total_possible_score = 0
    
    for result in task_results:
        total_score += result.total_score
        
        # 获取任务的所有问题来计算准确率
        task_questions = Question.query.filter_by(task_id=result.task_id).all()
        task_total_score = sum(q.score for q in task_questions)
        total_possible_score += task_total_score
        
        if task_total_score > 0:
            # 计算这个任务的正确题目数
            task_correct_ratio = result.total_score / task_total_score
            task_question_count = len(task_questions)
            
            total_questions += task_question_count
            total_correct += int(task_correct_ratio * task_question_count)
    
    # 计算准确率和平均分
    accuracy_rate = round((total_correct / total_questions * 100), 1) if total_questions > 0 else 0.0
    average_score = round((total_score / total_possible_score * 100), 1) if total_possible_score > 0 else 0.0
    
    return jsonify({
        'student_info': {
            'real_name': student.real_name,
            'student_id': student.student_id,
            'username': student.username
        },
        'statistics': {
            'accuracy_rate': accuracy_rate,
            'average_score': average_score,
            'completed_tasks': total_tasks_completed,
            'total_questions_answered': total_questions
        }
    }), 200

@app.route('/api/students/<student_id>/achievements', methods=['GET'])
def get_student_achievements(student_id):
    """获取学生成就列表"""
    # 验证学生存在
    student = Student.query.filter_by(student_id=student_id).first()
    if not student:
        return jsonify({'error': 'student not found'}), 404
    
    # 获取所有成就
    all_achievements = Achievement.query.all()
    
    # 获取学生已解锁的成就
    unlocked_achievements = StudentAchievement.query.filter_by(student_id=student_id).all()
    unlocked_ids = [ua.achievement_id for ua in unlocked_achievements]
    
    # 构建成就列表
    achievements_data = []
    for achievement in all_achievements:
        achievement_info = {
            'id': achievement.id,
            'name': achievement.name,
            'condition': achievement.condition,
            'unlocked': achievement.id in unlocked_ids,
            'unlocked_at': None
        }
        
        # 如果已解锁，添加解锁时间
        if achievement.id in unlocked_ids:
            unlocked_record = next(ua for ua in unlocked_achievements if ua.achievement_id == achievement.id)
            achievement_info['unlocked_at'] = unlocked_record.unlocked_at.isoformat()
        
        achievements_data.append(achievement_info)
    
    return jsonify({
        'achievements': achievements_data,
        'total_achievements': len(all_achievements),
        'unlocked_count': len(unlocked_achievements)
    }), 200

@app.route('/api/students/<student_id>/history', methods=['GET'])
def get_student_history(student_id):
    """获取学生任务历史记录"""
    # 验证学生存在
    student = Student.query.filter_by(student_id=student_id).first()
    if not student:
        return jsonify({'error': 'student not found'}), 404
    
    # 获取学生所有任务结果，按完成时间倒序排列
    task_results = StudentTaskResult.query.filter_by(student_id=student_id).order_by(StudentTaskResult.completed_at.desc()).all()
    
    # 构建历史记录列表
    history_data = []
    for result in task_results:
        # 获取任务信息
        task = Task.query.get(result.task_id)
        if task:
            # 获取任务的所有问题来计算总分
            task_questions = Question.query.filter_by(task_id=result.task_id).all()
            total_possible_score = sum(q.score for q in task_questions)
            
            # 计算百分比得分
            score_percentage = round((result.total_score / total_possible_score * 100), 1) if total_possible_score > 0 else 0
            
            # 确定课程类型（基于任务名称）
            course_type = "General"
            if "Chemistry" in task.name or "Lab" in task.name:
                course_type = "Chemistry"
            elif "Math" in task.name or "Puzzle" in task.name:
                course_type = "Mathematics"
            elif "Physics" in task.name:
                course_type = "Physics"
            elif "Statistics" in task.name:
                course_type = "Statistics"
            
            history_item = {
                'id': result.id,
                'task_id': result.task_id,
                'task_name': task.name,
                'course_type': course_type,
                'score': result.total_score,
                'max_score': total_possible_score,
                'score_percentage': score_percentage,
                'completed_at': result.completed_at.isoformat(),
                'started_at': result.started_at.isoformat() if result.started_at else None,
                'question_count': len(task_questions)
            }
            history_data.append(history_item)
    
    return jsonify({
        'history': history_data,
        'total_completed': len(history_data),
        'student_name': student.real_name
    }), 200

# Reporting Routes (removed unused student APIs)


# Main entry

if __name__ == '__main__':
    with app.app_context():
        # Recreate schema from scratch each run (development only)
        db.drop_all()
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
                    password=generate_password_hash(t['password_plain'], method='pbkdf2:sha256')
                ))

        # Seed default escape room tasks
        default_tasks = [
            {
                'name': 'Chemistry Lab Escape',
                'introduction': '''🧪 Welcome to the Chemistry Lab Escape Room! 🧪

You wake up locked in Professor Smith's chemistry laboratory after falling asleep during a late-night study session. The automatic security system has been activated and won't unlock until 6 AM - that's 4 hours from now!

But wait... you notice the emergency override panel is glowing. The system will unlock if you can prove your chemistry knowledge by solving a series of chemical calculations correctly.

Your mission: Answer all chemistry questions correctly to prove you belong in this lab and earn your freedom!

🔬 The lab equipment around you holds clues
⚗️ Each correct answer brings you closer to escape
🎯 Time is running out - use your chemistry knowledge wisely!

Ready to put your chemistry skills to the test? Let the escape begin!'''
            },
            {
                'name': 'Math Puzzle Room',
                'introduction': '''🔢 Welcome to the Math Puzzle Room! 🔢

You've been transported to a mysterious dimension where mathematical concepts come to life. The only way back to reality is through the Portal of Numbers, but it's sealed by an ancient mathematical curse!

Legend says that only those who can solve the sacred mathematical puzzles can break the curse and activate the portal. Each correct answer weakens the magical barriers, bringing you one step closer to home.

Your quest: Master the mathematical challenges that guard the portal!

📐 Geometric patterns hold ancient secrets
🧮 Algebraic formulas are your keys to freedom
∞ Calculus concepts will unlock the final seal
📊 Statistical wisdom guides your path

The fate of your return lies in your mathematical prowess. Can you solve your way back to reality?'''
            },
            {
                'name': 'Physics Challenge',
                'introduction': '''⚡ Welcome to the Physics Challenge Arena! ⚡

You're trapped in Dr. Newton's experimental physics laboratory where the laws of physics themselves have been scrambled! The lab's quantum stabilizer has malfunctioned, creating anomalies throughout the facility.

To restore order and escape, you must solve physics problems that will recalibrate the fundamental forces and restore the natural laws. Each correct answer helps stabilize one aspect of reality in the lab.

Your mission: Solve physics problems to restore the natural order and find your way out!

🚀 Mechanics equations control the door locks
⚡ Electromagnetic fields power the emergency systems
🌊 Wave properties control the communication devices
🔬 Quantum mechanics holds the key to the final exit

Use your understanding of physics to navigate this reality-bending challenge. The laws of nature are counting on you!'''
            },
            {
                'name': 'Statistics Mystery',
                'introduction': '''📊 Welcome to the Statistics Mystery Case! 📊

You're a detective who has been locked in the Data Analysis Bureau while investigating a complex case. The building's security system requires you to prove your investigative skills by solving statistical problems related to the ongoing case.

The evidence is scattered throughout the room in the form of data sets, probability charts, and statistical reports. Each statistical problem you solve correctly unlocks a piece of crucial evidence and brings you closer to both solving the case AND escaping the building.

Your investigation: Use statistical analysis to uncover the truth and earn your freedom!

🔍 Descriptive statistics reveal hidden patterns
📈 Probability calculations predict suspect behavior  
📋 Hypothesis testing validates your theories
🎯 Confidence intervals confirm your conclusions

Put on your detective hat and let your statistical reasoning guide you through this data-driven mystery!'''
            }
        ]

        for task_data in default_tasks:
            if not Task.query.filter_by(name=task_data['name']).first():
                task = Task(
                    name=task_data['name'],
                    introduction=task_data['introduction']
                )
                db.session.add(task)
                print(f"Created task: {task_data['name']}")

        # Seed default achievements
        default_achievements = [
            {
                'name': 'Perfect Score',
                'condition': '单个任务全部答对',
                'task_id': None  # General achievement, not tied to specific task
            },
            {
                'name': 'Accuracy Master',
                'condition': '总体答题准确率达到 90% 以上',
                'task_id': None  # General achievement
            },
            {
                'name': 'Fast Solver',
                'condition': '快速完成任务（添加时间限制）',
                'task_id': None  # General achievement
            },
            {
                'name': 'Quiz Warrior',
                'condition': '完成所有四个任务',
                'task_id': None  # General achievement
            }
        ]

        for ach_data in default_achievements:
            if not Achievement.query.filter_by(name=ach_data['name']).first():
                # For general achievements, use the first task's ID as a placeholder
                placeholder_task = Task.query.first()
                if placeholder_task:
                    achievement = Achievement(
                        name=ach_data['name'],
                        condition=ach_data['condition'],
                        task_id=placeholder_task.id  # Using first task as placeholder
                    )
                    db.session.add(achievement)
                    print(f"Created achievement: {ach_data['name']}")

        db.session.commit()
        print('All tables recreated, default teacher accounts and escape room tasks ensured.')

    app.run(debug=True, port=5001)
