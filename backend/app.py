# pylint: disable=unexpected-keyword-arg,no-value-for-parameter
# type: ignore[call-arg]
"""
Main Flask Application - Escape Room Educational Platform
Modular architecture with organized blueprints
"""
import os
from flask import Flask, request, send_from_directory, send_file
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
    database_url = os.getenv('DATABASE_URL')
    print(f"Using DATABASE_URL: {database_url[:20]}..." if database_url else "No DATABASE_URL found")

    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads', 'questions')
    app.config['VIDEO_UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads', 'videos')
    
    # Simple CORS configuration
    CORS(app)
    
    # Initialize database with app
    from models import db
    db.init_app(app)
    
    # Serve React frontend
    @app.route('/')
    def serve_frontend():
        try:
            return send_file('/var/www/html/index.html')
        except:
            # Fallback to API info if frontend files not found
            return {
                'status': 'success',
                'message': 'Escape Room Educational Platform API',
                'version': '1.0.0',
                'note': 'Frontend files not found, showing API info',
                'demo_accounts': {
                    'teacher': 'st1000@tea.com (password: 123456)'
                }
            }
    
    # Serve static files (CSS, JS, etc.) - TRY MULTIPLE PATHS
    @app.route('/static/<path:path>')
    def serve_static_files(path):
        import os
        # Try multiple possible locations
        possible_paths = [
            f'/var/www/html/static/{path}',
            f'/var/www/html/{path}',
            f'/app/build/static/{path}',
            f'/app/static/{path}'
        ]
        
        for full_path in possible_paths:
            if os.path.exists(full_path):
                try:
                    directory = os.path.dirname(full_path)
                    filename = os.path.basename(full_path)
                    print(f"Serving static file from: {directory}/{filename}")
                    return send_from_directory(directory, filename)
                except Exception as e:
                    print(f"Error serving from {full_path}: {e}")
                    continue
        
        print(f"Static file not found in any location: {path}")
        print(f"Tried paths: {possible_paths}")
        return {'error': f'Static file not found: {path}', 'tried_paths': possible_paths}, 404
    
    # Serve other assets (images, etc.)
    @app.route('/<path:path>')
    def serve_assets(path):
        # Skip API routes
        if path.startswith('api/'):
            return {'error': 'API endpoint not found'}, 404
        
        try:
            return send_from_directory('/var/www/html', path)
        except:
            # For React router, return index.html for unknown routes
            try:
                return send_file('/var/www/html/index.html')
            except:
                return {'error': 'File not found'}, 404
    
    # API info endpoint
    @app.route('/api')
    def api_info():
        return {
            'status': 'success',
            'message': 'Escape Room Educational Platform API',
            'version': '1.0.0',
            'endpoints': {
                'auth': '/login, /register',
                'tasks': '/api/tasks',
                'students': '/api/students'
            }
        }
    
    @app.route('/health')
    def health():
        return {'status': 'healthy', 'database': 'connected'}
    
    @app.route('/favicon.ico')
    def favicon():
        return '', 204
    
    @app.route('/debug/files')
    def debug_files():
        import os
        try:
            html_files = []
            static_files = []
            
            # Check /var/www/html
            if os.path.exists('/var/www/html'):
                html_files = os.listdir('/var/www/html')
            
            # Check /var/www/html/static if it exists
            if os.path.exists('/var/www/html/static'):
                for root, dirs, files in os.walk('/var/www/html/static'):
                    for file in files:
                        rel_path = os.path.relpath(os.path.join(root, file), '/var/www/html/static')
                        static_files.append(rel_path)
            
            return {
                'html_dir_exists': os.path.exists('/var/www/html'),
                'html_files': html_files,
                'static_dir_exists': os.path.exists('/var/www/html/static'),
                'static_files': static_files[:20]  # Limit to first 20 files
            }
        except Exception as e:
            return {'error': str(e)}
    
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
    from seed_data import seed_all_data
    
    with app.app_context():
        # Create all database tables
        
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
                'condition': 'Answer all questions correctly for a single task',
                'task_id': None  # General achievement, not tied to specific task
            },
            {
                'name': 'Accuracy Master',
                'condition': 'Overall accuracy rate reaches 90% or more',
                'task_id': None  # General achievement
            },
            {
                'name': 'Fast Solver',
                'condition': 'Complete tasks quickly (with time limit)',
                'task_id': None  # General achievement
            },
            {
                'name': 'Quiz Warrior',
                'condition': 'Complete all four tasks',
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
    
    print('Database initialized and seeded successfully')
    
    # Railway ALWAYS provides PORT - use it exactly as provided
    port = int(os.environ.get('PORT'))
    print(f'Railway assigned port: {port}')
    
    # Just run the damn thing
    app.run(host='0.0.0.0', port=port)