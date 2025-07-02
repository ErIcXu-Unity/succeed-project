#!/usr/bin/env python3
from app import app, db, Task

def add_default_tasks():
    """添加默认任务数据"""
    with app.app_context():
        try:
            # 检查是否已有任务
            existing_tasks = Task.query.count()
            if existing_tasks > 0:
                print(f"已存在 {existing_tasks} 个任务")
                return True
            
            print("正在添加默认任务...")
            
            # 添加带有介绍的任务
            tasks_data = [
                {
                    'name': 'Mean Calculation',
                    'introduction': '''Welcome to the Statistical Analysis Escape Room! 

You are a data analyst trapped in a research facility. To escape, you must solve statistical problems and calculate means, medians, and modes correctly. 

The facility's security system will only unlock when you demonstrate mastery of basic statistical concepts. Each correct answer brings you closer to freedom!

Are you ready to put your mathematical skills to the test?'''
                },
                {
                    'name': 'Chemistry Calculation',
                    'introduction': '''Welcome to the Chemistry Laboratory Escape Room!

You are a chemistry student who has been locked in the laboratory after hours. The only way to escape is by solving chemical equations, balancing formulas, and demonstrating your understanding of chemical reactions.

The lab's automated system requires you to answer questions about:
- Chemical bonding and molecular structures
- Stoichiometry and molar calculations  
- Acid-base reactions and pH calculations
- Periodic table properties

Use your chemistry knowledge to unlock each door and escape the lab safely!'''
                },
                {
                    'name': 'Physics Challenge',
                    'introduction': '''Welcome to the Physics Laboratory Escape Room!

You've been locked in an advanced physics research facility. To escape, you must solve problems involving mechanics, thermodynamics, and electromagnetism.

The security system tests your knowledge of:
- Newton's laws and motion equations
- Energy conservation and momentum
- Electric circuits and magnetic fields
- Wave properties and optics

Apply physics principles to unlock the exit and complete your escape!'''
                },
                {
                    'name': 'Math Problem Solving',
                    'introduction': '''Welcome to the Mathematical Puzzle Escape Room!

You are trapped in a mathematics research center. The only way out is to solve increasingly complex mathematical puzzles and demonstrate problem-solving skills.

Challenge yourself with:
- Algebraic equations and inequalities
- Geometry and trigonometry problems  
- Calculus derivatives and integrals
- Logic puzzles and number theory

Use your mathematical reasoning to unlock each chamber and find your way to freedom!'''
                }
            ]
            
            for task_data in tasks_data:
                task = Task(
                    name=task_data['name'],
                    introduction=task_data['introduction']
                )
                db.session.add(task)
                print(f"  添加任务: {task_data['name']}")
            
            db.session.commit()
            
            # 验证结果
            task_count = Task.query.count()
            print(f"\n✓ 任务添加完成")
            print(f"✓ 总任务数: {task_count}")
            
            print("\n任务列表:")
            tasks = Task.query.all()
            for task in tasks:
                intro_preview = (task.introduction[:50] + "...") if task.introduction and len(task.introduction) > 50 else (task.introduction or "暂无描述")
                print(f"  - {task.id}: {task.name}")
                print(f"    描述: {intro_preview}")
            
        except Exception as e:
            print(f"✗ 添加任务时出错: {e}")
            db.session.rollback()
            return False
            
    return True

if __name__ == "__main__":
    success = add_default_tasks()
    if success:
        print("\n任务添加成功！")
    else:
        print("\n添加失败，请检查数据库配置") 