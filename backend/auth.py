"""
Authentication Routes for the Escape Room Application
"""
import re
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, Student, Teacher

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
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

@auth_bp.route('/login', methods=['POST'])
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

@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    """修改用户密码"""
    data = request.get_json()
    
    # 验证必需字段
    required_fields = ['username', 'current_password', 'new_password']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    username = data.get('username')
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    # 验证新密码长度
    if len(new_password) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400
    
    # 查找用户（学生或教师）
    user = Student.query.filter_by(username=username).first()
    user_type = 'student'
    
    if not user:
        user = Teacher.query.filter_by(username=username).first()
        user_type = 'teacher'
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # 验证当前密码
    if not check_password_hash(user.password, current_password):
        return jsonify({'error': 'Current password is incorrect'}), 401
    
    # 检查新密码是否与当前密码相同
    if check_password_hash(user.password, new_password):
        return jsonify({'error': 'New password must be different from current password'}), 400
    
    try:
        # 更新密码
        user.password = generate_password_hash(new_password)
        db.session.commit()
        
        return jsonify({
            'message': 'Password changed successfully',
            'user_type': user_type
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to change password: {str(e)}'}), 500