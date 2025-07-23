# pylint: disable=unexpected-keyword-arg,no-value-for-parameter
# type: ignore[call-arg]
"""
Main Flask Application - Escape Room Educational Platform
Modular architecture with organized blueprints
"""
import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash
from datetime import datetime, timezone

# Load environment variables
load_dotenv('.env')

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads', 'questions')
    app.config['VIDEO_UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads', 'videos')
    
    # CORS configuration
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:3000", "http://127.0.0.1:3000", 
                       "http://localhost:3001", "http://127.0.0.1:3001"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Initialize database with app
    from models import db
    db.init_app(app)
    
    # Register blueprints
    from auth import auth_bp
    from tasks import tasks_bp
    from questions import questions_bp
    from submissions import submissions_bp
    from students import students_bp
    from uploads import uploads_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(questions_bp)
    app.register_blueprint(submissions_bp)
    app.register_blueprint(students_bp)
    app.register_blueprint(uploads_bp)
    
    return app

def initialize_database(app):
    """Initialize database and seed default data"""
    from models import db, Student, Teacher, Task, Achievement
    """Initialize database and seed default data"""
    from models import db, Student, Teacher, Task, Achievement
    from seed_data import seed_all_data
    
    with app.app_context():
        # Recreate schema from scratch each run (development only)
        # try:
        #     # Try to drop tables with CASCADE for PostgreSQL
        #     from sqlalchemy import text
        #     with db.engine.connect() as conn:
        #         conn.execute(text('DROP SCHEMA IF EXISTS public CASCADE'))
        #         conn.execute(text('CREATE SCHEMA public'))
        #         conn.commit()
        # except Exception as e:
        #     print(f"Schema reset failed, trying alternative method: {e}")
        #     # Fallback to simple drop_all (may fail with constraints)
        #     try:
        #         db.drop_all()
        #     except:
        #         print("Warning: Could not drop existing tables. Proceeding with create_all...")
        
        db.create_all()
        
        # Seed default data from seed_data.py
        seed_all_data()
        
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
                    password=generate_password_hash(t['password_plain'], method='pbkdf2:sha256')
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
                'condition': '总体答题准确率达到 90% 以上',
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

if __name__ == '__main__':
    app = create_app()
    initialize_database(app)
    
    print('✅ Database initialized and seeded successfully')
    print('🚀 Starting Flask application on port 5001')
    
    app.run(debug=True, port=5001)