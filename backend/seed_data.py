"""
Database Seeding Functions for the Escape Room Application
"""
from werkzeug.security import generate_password_hash
from models import db, Teacher, Task, Achievement

def seed_default_teachers():
    """Seed default teacher accounts"""
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
                password=generate_password_hash(t['password_plain'])
            ))
            print(f"Created teacher: {t['real_name']}")

def seed_default_tasks():
    """Seed default escape room tasks"""
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

def seed_default_achievements():
    """Seed default achievements"""
    default_achievements = [
        {
            'name': 'Perfect Score',
            'condition': '单个任务全部答对',
            'task_id': None  # General achievement, not tied to specific task
        },
        {
            'name': 'Accuracy Master',
            'condition': '总体答题准确率达到90%以上',
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

def seed_all_data():
    """Seed all default data"""
    seed_default_teachers()
    seed_default_tasks()
    seed_default_achievements()
    db.session.commit()
    print('All default data seeded successfully.')