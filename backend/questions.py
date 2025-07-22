"""
Question Management Routes for the Escape Room Application
"""
import os
import json
import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from models import db, Task, Question

questions_bp = Blueprint('questions', __name__)

@questions_bp.route('/api/tasks/<int:task_id>/questions', methods=['GET'])
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

@questions_bp.route('/api/questions/<int:question_id>/check', methods=['POST'])
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

@questions_bp.route('/api/tasks/<int:task_id>/questions', methods=['POST'])
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
                unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
                
                # 确保上传目录存在
                task_upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], f'task_{task_id}')
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
                unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
                
                # 确保上传目录存在
                video_upload_dir = os.path.join(current_app.config['VIDEO_UPLOAD_FOLDER'])
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

@questions_bp.route('/api/tasks/<int:task_id>/questions/batch', methods=['POST'])
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

@questions_bp.route('/api/questions/<int:question_id>', methods=['DELETE'])
def delete_question(question_id):
    """删除单个问题"""
    try:
        question = Question.query.get_or_404(question_id)
        
        # 删除相关的文件
        if question.image_path:
            try:
                image_file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], question.image_path)
                if os.path.exists(image_file_path):
                    os.remove(image_file_path)
            except Exception as e:
                print(f"Warning: Failed to delete image file: {str(e)}")
        
        if question.video_path:
            try:
                video_file_path = os.path.join(current_app.config['VIDEO_UPLOAD_FOLDER'], question.video_path)
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