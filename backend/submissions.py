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
    task = db.session.get(Task, task_id)
    if not task:
        return jsonify({'error': 'task not found'}), 404

    total_score     = 0
    correct_count   = 0
    questions_count = 0

    # to collect correct answers for frontend
    correct_answers = {}
    
    # to collect per-question results for frontend
    question_results = []

    # grade each question
    for q_id_str, selected in answers.items():
        q_id      = int(q_id_str)
        question  = db.session.get(Question, q_id)
        if not question:
            continue
        questions_count += 1
        correct_answers[q_id_str] = question.correct_answer
        
        # Handle different question types
        is_correct = False
        if question.question_type == 'fill_blank':
            # Debug logging for fill blank questions
            question_data = json.loads(question.question_data) if isinstance(question.question_data, str) else question.question_data
            correct_blank_answers = question_data.get('blank_answers', [])
            
            print(f"=== FILL BLANK SCORING DEBUG ===")
            print(f"Question ID: {question.id}")
            print(f"User answer type: {type(selected)}")
            print(f"User answer: {selected}")
            print(f"Correct answers: {correct_blank_answers}")
            
            # Handle fill blank questions - selected should be an array of answers
            if isinstance(selected, list):
                print(f"Processing as list with {len(selected)} items vs {len(correct_blank_answers)} expected")
                # Check if all blanks are correct (case-insensitive comparison)
                if len(selected) == len(correct_blank_answers):
                    comparisons = []
                    for i, (user_answer, correct_answer) in enumerate(zip(selected, correct_blank_answers)):
                        user_clean = (user_answer or '').strip().lower()
                        correct_clean = (correct_answer or '').strip().lower()
                        matches = user_clean == correct_clean
                        comparisons.append(f"Blank {i+1}: '{user_clean}' == '{correct_clean}' ? {matches}")
                    
                    print(f"Comparisons: {comparisons}")
                    is_correct = all(
                        (user_answer or '').strip().lower() == (correct_answer or '').strip().lower()
                        for user_answer, correct_answer in zip(selected, correct_blank_answers)
                    )
                else:
                    print(f"Length mismatch: got {len(selected)} answers, expected {len(correct_blank_answers)}")
            else:
                print(f"ERROR: Expected list but got {type(selected)}: {selected}")
            
            print(f"Final result: is_correct = {is_correct}")
            print("=== END FILL BLANK DEBUG ===")
        elif question.question_type == 'multiple_choice':
            # Handle Multiple Choice questions - selected should be an array of indices
            try:
                question_data = json.loads(question.question_data) if isinstance(question.question_data, str) else question.question_data
                correct_indices = question_data.get('correct_answers', [])
                
                print(f"=== MULTIPLE CHOICE SCORING DEBUG ===")
                print(f"Question ID: {question.id}")
                print(f"User answer type: {type(selected)}")
                print(f"User answer: {selected}")
                print(f"Correct indices: {correct_indices}")
                
                # Check if user answer is a list and matches correct answers
                if isinstance(selected, list):
                    # Sort both arrays for comparison (order doesn't matter)
                    user_sorted = sorted(selected) if selected else []
                    correct_sorted = sorted(correct_indices) if correct_indices else []
                    is_correct = user_sorted == correct_sorted
                    print(f"Sorted user: {user_sorted}, Sorted correct: {correct_sorted}")
                    print(f"Is correct: {is_correct}")
                else:
                    print(f"ERROR: Expected list but got {type(selected)}")
                
                print("=== END MULTIPLE CHOICE DEBUG ===")
            except (json.JSONDecodeError, TypeError, KeyError) as e:
                print(f"Error parsing multiple choice question data: {e}")
                is_correct = False
        elif question.question_type == 'puzzle_game':
            # Handle Puzzle Game questions - selected should be an array of fragments
            try:
                question_data = json.loads(question.question_data) if isinstance(question.question_data, str) else question.question_data
                correct_solution = question_data.get('puzzle_solution', '') or question.puzzle_solution or ''
                
                print(f"=== PUZZLE GAME SCORING DEBUG ===")
                print(f"Question ID: {question.id}")
                print(f"User answer type: {type(selected)}")
                print(f"User answer: {selected}")
                print(f"Correct solution: {correct_solution}")
                
                if isinstance(selected, list):
                    # Join the fragments to form the solution
                    user_solution = ' '.join(selected).strip()
                    print(f"User solution (joined): '{user_solution}'")
                    
                    # Multiple validation approaches for puzzle games
                    # 1. Exact match
                    is_correct = user_solution == correct_solution.strip()
                    print(f"Exact match: {is_correct}")
                    
                    # 2. If exact match fails, try without spaces (for math/chemistry)
                    if not is_correct:
                        user_no_spaces = user_solution.replace(' ', '')
                        correct_no_spaces = correct_solution.replace(' ', '')
                        is_correct = user_no_spaces == correct_no_spaces
                        print(f"No spaces match: '{user_no_spaces}' == '{correct_no_spaces}' ? {is_correct}")
                    
                    # 3. For chemistry reactions, normalize arrow formats
                    if not is_correct and ('→' in correct_solution or '->' in correct_solution or '=>' in correct_solution):
                        user_normalized = user_solution.replace('->', '→').replace('=>', '→').replace('=', '→').strip()
                        correct_normalized = correct_solution.replace('->', '→').replace('=>', '→').replace('=', '→').strip()
                        is_correct = user_normalized == correct_normalized
                        print(f"Chemistry normalized: '{user_normalized}' == '{correct_normalized}' ? {is_correct}")
                    
                    # 4. Case-insensitive comparison as fallback
                    if not is_correct:
                        is_correct = user_solution.lower() == correct_solution.lower()
                        print(f"Case insensitive: {is_correct}")
                        
                else:
                    print(f"ERROR: Expected list but got {type(selected)}")
                
                print(f"Final result: is_correct = {is_correct}")
                print("=== END PUZZLE GAME DEBUG ===")
                
            except (json.JSONDecodeError, TypeError, KeyError) as e:
                print(f"Error parsing puzzle game question data: {e}")
                is_correct = False
                
        elif question.question_type == 'matching_task':
            # Handle Matching Task questions - selected should be an object with matches
            try:
                question_data = json.loads(question.question_data) if isinstance(question.question_data, str) else question.question_data
                correct_matches = question_data.get('correct_matches', [])
                
                print(f"=== MATCHING TASK SCORING DEBUG ===")
                print(f"Question ID: {question.id}")
                print(f"User answer type: {type(selected)}")
                print(f"User answer: {selected}")
                print(f"Correct matches: {correct_matches}")
                
                if isinstance(selected, dict) and isinstance(correct_matches, list):
                    # Check if all correct matches are present in user's answer
                    all_correct = True
                    for correct_match in correct_matches:
                        left_idx = correct_match.get('left')
                        right_idx = correct_match.get('right')
                        
                        # Convert indices to strings for comparison (frontend sends string keys)
                        user_match = selected.get(str(left_idx))
                        if user_match != right_idx:
                            print(f"Mismatch: left {left_idx} should match right {right_idx}, but user matched {user_match}")
                            all_correct = False
                            break
                    
                    # Also check that user didn't make extra incorrect matches
                    if all_correct and len(selected) == len(correct_matches):
                        is_correct = True
                    elif all_correct:
                        # User made all correct matches but may have extra ones - check if extras are wrong
                        for user_left, user_right in selected.items():
                            expected_match = next((cm for cm in correct_matches if cm['left'] == int(user_left)), None)
                            if expected_match and expected_match['right'] != user_right:
                                all_correct = False
                                break
                        is_correct = all_correct
                    
                    print(f"All matches correct: {is_correct}")
                    
                else:
                    print(f"ERROR: Expected dict for user answer and list for correct matches")
                    print(f"Got user type: {type(selected)}, correct type: {type(correct_matches)}")
                
                print(f"Final result: is_correct = {is_correct}")
                print("=== END MATCHING TASK DEBUG ===")
                
            except (json.JSONDecodeError, TypeError, KeyError) as e:
                print(f"Error parsing matching task question data: {e}")
                is_correct = False
                
        elif question.question_type == 'single_choice':
            # Handle Single Choice questions - selected is a string
            if isinstance(selected, str) and selected.upper() == question.correct_answer:
                is_correct = True
        else:
            # Handle other question types with generic string comparison
            if isinstance(selected, str) and selected.upper() == question.correct_answer:
                is_correct = True
        
        if is_correct:
            total_score   += question.score
            correct_count += 1
        
        # Add per-question result
        question_results.append({
            'question_id': question.id,
            'is_correct': is_correct,
            'score': question.score if is_correct else 0,
            'user_answer': selected
        })

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

    # return score, new achievements, correct answers, and per-question results
    return jsonify({
        'total_score':     total_score,
        'new_achievements': new_achievements,
        'correct_answers':  correct_answers,
        'results':         question_results
    }), 200

