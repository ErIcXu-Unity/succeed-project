import csv
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from app import Task, Question

load_dotenv()

engine = create_engine(os.getenv('DATABASE_URL'))
Session = sessionmaker(bind=engine)
session = Session()

CSV_PATH = 'sample_questions.csv'

SCORE_MAP = {
    'Easy': 3,
    'Medium': 5,
    'Hard': 10
}

# create or get tasks
task_ids = {}
with open(CSV_PATH, encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        task_name = row['Key Equation'].strip()
        if task_name not in task_ids:
            task = session.query(Task).filter_by(name=task_name).first()
            if not task:
                task = Task(name=task_name)
                session.add(task)
                session.commit()
            task_ids[task_name] = task.id

# import questions with options and correct answer
with open(CSV_PATH, encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        question = Question(
            task_id        = task_ids[row['Key Equation'].strip()],
            question       = row['Question'].strip(),
            option_a       = row['OptionA'].strip(),
            option_b       = row['OptionB'].strip(),
            option_c       = row['OptionC'].strip(),
            option_d       = row['OptionD'].strip(),
            correct_answer = row['CorrectAnswer'].strip(),
            difficulty     = row['Difficulty'].strip(),
            score          = SCORE_MAP.get(row['Difficulty'].strip(), 0)
        )
        session.add(question)

session.commit()
session.close()
print('Imported questions with options successfully.')
