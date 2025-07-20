#!/usr/bin/env python3
"""
Database migration script to add new question type support
"""
import sqlite3
import os

def migrate_database():
    db_path = 'instance/escape_room.db'
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Add question_type column if it doesn't exist
        try:
            cursor.execute("ALTER TABLE questions ADD COLUMN question_type VARCHAR(50) DEFAULT 'single_choice'")
            print("Added question_type column")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("question_type column already exists")
            else:
                raise
        
        # Add question_data column if it doesn't exist
        try:
            cursor.execute("ALTER TABLE questions ADD COLUMN question_data TEXT")
            print("Added question_data column")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("question_data column already exists")
            else:
                raise
        
        # Make single choice fields nullable (can't modify existing columns in SQLite easily)
        # So we'll update existing data to have question_type = 'single_choice'
        cursor.execute("UPDATE questions SET question_type = 'single_choice' WHERE question_type IS NULL")
        print("Updated existing questions to single_choice type")
        
        conn.commit()
        print("Database migration completed successfully!")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()