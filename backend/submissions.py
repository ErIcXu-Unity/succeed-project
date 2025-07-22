"""
Task Submission and Progress Routes for the Escape Room Application
"""
import json
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from models import db, Student, Task, Question, StudentTaskResult, StudentTaskProcess, Achievement, StudentAchievement

submissions_bp = Blueprint('submissions', __name__)

@submissions_bp.route('/api/tasks/<int:task_id>/submit', methods=['POST'])
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

