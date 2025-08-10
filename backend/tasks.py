"""
Task Management Routes for the Escape Room Application
"""
import os
import json
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, current_app, send_from_directory, abort
from models import db, Task, Question, StudentTaskProcess, StudentTaskResult, Achievement, StudentAchievement, Student

tasks_bp = Blueprint('tasks', __name__, url_prefix='/api/tasks')

@tasks_bp.route('', methods=['GET'])
def get_tasks():
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

@tasks_bp.route('', methods=['POST'])
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

@tasks_bp.route('/<int:task_id>', methods=['GET'])
def get_task_detail(task_id):
    """获取任务详情"""
    task = db.session.get(Task, task_id)
    if not task:
        abort(404)
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

@tasks_bp.route('/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """更新任务信息"""
    task = db.session.get(Task, task_id)
    if not task:
        abort(404)
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

@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """删除任务及其相关数据"""
    # 验证任务存在
    task = db.session.get(Task, task_id)
    if not task:
        abort(404)
    
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

# Task Progress Routes
@tasks_bp.route('/<int:task_id>/save-progress', methods=['POST'])
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
    
    task = db.session.get(Task, task_id)
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

@tasks_bp.route('/<int:task_id>/progress', methods=['GET'])
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

@tasks_bp.route('/<int:task_id>/progress', methods=['DELETE'])
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

# Video Upload Routes
@tasks_bp.route('/<int:task_id>/video', methods=['POST'])
def upload_task_video(task_id):
    """上传任务视频文件"""
    task = db.session.get(Task, task_id)
    if not task:
        abort(404)
    
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
        video_path = os.path.join(current_app.config['VIDEO_UPLOAD_FOLDER'], filename)
        
        # 确保目录存在
        os.makedirs(current_app.config['VIDEO_UPLOAD_FOLDER'], exist_ok=True)
        
        # 保存文件
        file.save(video_path)
        
        # 更新数据库
        task.video_path = filename
        task.video_type = 'local'
        task.video_url = f'/uploads/videos/{filename}'  # 设置本地视频访问路径
        db.session.commit()
        
        return jsonify({
            'message': 'Video uploaded successfully',
            'filename': filename,
            'video_url': f'/uploads/videos/{filename}',
            'video_type': 'local'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to upload video: {str(e)}'}), 500

@tasks_bp.route('/<int:task_id>/youtube', methods=['POST'])
def save_youtube_url(task_id):
    """保存 YouTube 视频链接"""
    task = db.session.get(Task, task_id)
    if not task:
        abort(404)
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

@tasks_bp.route('/<int:task_id>/video', methods=['DELETE'])
def delete_task_video(task_id):
    """删除任务的视频"""
    task = db.session.get(Task, task_id)
    if not task:
        abort(404)
    
    try:
        # 如果是本地视频，删除文件
        if task.video_type == 'local' and task.video_path:
            video_file_path = os.path.join(current_app.config['VIDEO_UPLOAD_FOLDER'], os.path.basename(task.video_path))
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