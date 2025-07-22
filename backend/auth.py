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