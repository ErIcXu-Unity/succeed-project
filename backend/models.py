"""
Database Models for the Escape Room Application
"""
from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

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