"""
Student Profile and Achievement Routes for the Escape Room Application
"""
from flask import Blueprint, jsonify
from models import db, Student, Task, Question, StudentTaskResult, Achievement, StudentAchievement, StudentTaskProcess

students_bp = Blueprint('students', __name__, url_prefix='/api/students')

@students_bp.route('/<student_id>/task-progress', methods=['GET'])
def get_student_task_progress(student_id):
    """Get the progress status of all tasks for a student"""
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
    # Get student basic information
    student = Student.query.filter_by(student_id=student_id).first()
    if not student:
        return jsonify({'error': 'student not found'}), 404
    
    # Get all task results for the student
    task_results = StudentTaskResult.query.filter_by(student_id=student_id).all()
    
    # Calculate statistics
    total_tasks_completed = len(task_results)
    total_questions = 0
    total_correct = 0
    total_score = 0
    total_possible_score = 0
    
    for result in task_results:
        total_score += result.total_score
        
        # Get all questions for the task to calculate accuracy
        task_questions = Question.query.filter_by(task_id=result.task_id).all()
        task_total_score = sum(q.score for q in task_questions)
        total_possible_score += task_total_score
        
        if task_total_score > 0:
            # Calculate the number of correct questions for this task
            task_correct_ratio = result.total_score / task_total_score
            task_question_count = len(task_questions)
            
            total_questions += task_question_count
            total_correct += int(task_correct_ratio * task_question_count)
    
    # Calculate accuracy and average score
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
    # Verify student exists
    student = Student.query.filter_by(student_id=student_id).first()
    if not student:
        return jsonify({'error': 'student not found'}), 404
    
    # Get all achievements
    all_achievements = Achievement.query.all()
    
    # Get student's unlocked achievements
    unlocked_achievements = StudentAchievement.query.filter_by(student_id=student_id).all()
    unlocked_ids = [ua.achievement_id for ua in unlocked_achievements]
    
    # Build achievement list
    achievements_data = []
    for achievement in all_achievements:
        achievement_info = {
            'id': achievement.id,
            'name': achievement.name,
            'condition': achievement.condition,
            'unlocked': achievement.id in unlocked_ids,
            'unlocked_at': None
        }
        
        # If unlocked, add unlock time
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
    # Verify student exists
    student = Student.query.filter_by(student_id=student_id).first()
    if not student:
        return jsonify({'error': 'student not found'}), 404
    
    # Get all task results for the student, sorted by completion time
    task_results = StudentTaskResult.query.filter_by(student_id=student_id).order_by(StudentTaskResult.completed_at.desc()).all()
    
    # Build history list
    history_data = []
    for result in task_results:
        # Get task information
        task = db.session.get(Task, result.task_id)
        if task:
            # Get all questions for the task to calculate total score
            task_questions = Question.query.filter_by(task_id=result.task_id).all()
            total_possible_score = sum(q.score for q in task_questions)
            
            # Calculate percentage score
            score_percentage = round((result.total_score / total_possible_score * 100), 1) if total_possible_score > 0 else 0
            
            # Determine course type (based on task name)
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

@students_bp.route('/dashboard-summary', methods=['GET'])
def get_dashboard_summary():
    try:
        # 1. Total number of students (count directly from students table)
        total_students = db.session.query(db.func.count(Student.id)).scalar()
        print(f"Student table count: {total_students}")

        # 2. Completion rate (proportion of students who have completed at least one task)
        completed_students = db.session.query(db.func.count(db.distinct(StudentTaskResult.student_id))).scalar()
        completion_rate = round((completed_students / total_students * 100), 2) if total_students > 0 else 0
        
        return jsonify({
            "total_students": total_students,
            "completion_rate": completion_rate
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Statistics failed: {str(e)}"}), 500


# Get all students list
@students_bp.route('/list', methods=['GET'])
def get_students_list():
    try:
        students = Student.query.all()
        result = []
        for s in students:
            result.append({
                "student_id": s.student_id,
                "name": s.real_name,
                "class": "Class A"  # Hardcoded for now, can be associated with class table later
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# Get student details
@students_bp.route('/<student_id>/details', methods=['GET'])
def get_student_details(student_id):
    try:
        student = Student.query.filter_by(student_id=student_id).first_or_404()
        
        # Get student task completion status
        task_results = StudentTaskResult.query.filter_by(student_id=student_id).all()
        
        return jsonify({
            "student_info": {
                "id": student.student_id,
                "name": student.real_name,
                "class": "Class A",
                "username": student.username
            },
            "task_history": [
                {
                    "task_id": r.task_id,
                    "task_name": r.task_name,
                    "score": r.total_score,
                    "completed_at": r.completed_at.isoformat()
                } for r in task_results
            ]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 404
    
@students_bp.route('/dashboard-report', methods=['GET'])
def get_dashboard_report():
    try:
        # Total number of students
        total_students = db.session.query(db.func.count(Student.id)).scalar()

        # Total number of tasks
        total_tasks = db.session.query(db.func.count(Task.id)).scalar()

        # Completion rate
        completed_students = db.session.query(db.func.count(db.distinct(StudentTaskResult.student_id))).scalar()
        completion_rate = round((completed_students / total_students * 100), 1) if total_students > 0 else 0.0

        # Average score
        task_results = StudentTaskResult.query.all()
        total_score = 0
        total_possible = 0
        for r in task_results:
            questions = Question.query.filter_by(task_id=r.task_id).all()
            max_score = sum(q.score for q in questions)
            if max_score > 0:
                total_score += r.total_score
                total_possible += max_score
        average_score = round((total_score / total_possible * 100), 1) if total_possible > 0 else 0.0

        # Completion status for each task
        all_tasks = Task.query.all()
        task_performance = []

        for task in all_tasks:
            task_results = StudentTaskResult.query.filter_by(task_id=task.id).all()
            submitted_count = len(task_results)
            task_questions = Question.query.filter_by(task_id=task.id).all()
            max_score = sum(q.score for q in task_questions)

            avg_score = 0.0
            if submitted_count > 0 and max_score > 0:
                avg_score = round(sum(r.total_score for r in task_results) / (submitted_count * max_score) * 100, 1)

            completion = round((submitted_count / total_students * 100), 1) if total_students > 0 else 0.0

            task_performance.append({
                "name": task.name,
                "completion": completion,
                "avgScore": avg_score,
                "attempts": submitted_count
            })

        # Active students (students who have submitted at least one task)
        active_students = completed_students
        
        # Total submissions count
        total_submissions = len(task_results)

        return jsonify({
            "total_students": total_students,
            "total_tasks": total_tasks,
            "completion_rate": completion_rate,
            "average_score": average_score,
            "active_students": active_students,
            "total_submissions": total_submissions,
            "task_performance": task_performance
        }), 200

    except Exception as e:
        return jsonify({"error": f"Statistics failed: {str(e)}"}), 500