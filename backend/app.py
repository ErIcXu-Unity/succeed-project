import os
import re
import json
from datetime import datetime, timezone
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash

load_dotenv('.env')  # 明确指定.env文件路径

app = Flask(__name__)

# 配置CORS允许跨域访问
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
    publish_at   = db.Column(db.DateTime, nullable=True) # 发布时间

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
    answers_json         = db.Column(db.Text, nullable=True)  # JSON格式存储已选择的答案
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
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Task updated successfully',
            'task': {
                'id': task.id,
                'name': task.name,
                'introduction': task.introduction,
                'publish_at': task.publish_at.isoformat() if task.publish_at else None
            }
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

    # 2. Fast Solver - 快速完成任务（设定10分钟内完成）
    if task_started_at and current_time:
        time_taken = (current_time - task_started_at).total_seconds() / 60  # 转换为分钟
        if time_taken <= 10:  # 10分钟内完成
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

    # 3. Accuracy Master - 总体准确率达到90%以上（需要在commit后计算）
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

@app.route('/uploads/questions/<path:filename>')
def uploaded_file(filename):
    """提供问题图片访问服务"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


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
                    password=generate_password_hash(t['password_plain'])
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
                'condition': '总体答题准确率达到90%以上',
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
