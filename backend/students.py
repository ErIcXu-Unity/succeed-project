"""
Student Profile and Achievement Routes for the Escape Room Application
"""
from flask import Blueprint, jsonify
from models import db, Student, Task, Question, StudentTaskResult, Achievement, StudentAchievement, StudentTaskProcess

students_bp = Blueprint('students', __name__, url_prefix='/api/students')

@students_bp.route('/<student_id>/task-progress', methods=['GET'])
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

@students_bp.route('/<student_id>/profile', methods=['GET'])
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

@students_bp.route('/<student_id>/achievements', methods=['GET'])
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

@students_bp.route('/<student_id>/history', methods=['GET'])
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