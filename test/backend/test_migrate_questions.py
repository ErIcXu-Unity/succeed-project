"""
Tests for backend/migrate_questions.py to raise its coverage.
"""
import os
import sys
import sqlite3
import importlib
import runpy

# Ensure project root and backend are importable
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
backend_dir = os.path.join(project_root, 'backend')
sys.path.insert(0, project_root)
sys.path.insert(0, backend_dir)

def _import_migrator():
    """Import backend.migrate_questions fresh so coverage hooks instrument it."""
    # Remove possible cached modules to force a fresh, instrumented import
    sys.modules.pop('migrate_questions', None)
    sys.modules.pop('backend.migrate_questions', None)
    return importlib.import_module('backend.migrate_questions')


def _create_legacy_questions_table(db_file: str) -> None:
    conn = sqlite3.connect(db_file)
    cur = conn.cursor()
    # Legacy schema without the new columns
    cur.execute(
        "CREATE TABLE questions (id INTEGER PRIMARY KEY, question TEXT)"
    )
    cur.execute("INSERT INTO questions (question) VALUES ('legacy q1')")
    conn.commit()
    conn.close()


def _get_table_columns(db_file: str):
    conn = sqlite3.connect(db_file)
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(questions)")
    cols = [row[1] for row in cur.fetchall()]
    conn.close()
    return cols


def test_migrate_adds_columns_and_sets_defaults(tmp_path, monkeypatch):
    # Arrange: create instance DB in an isolated temp cwd
    instance_dir = tmp_path / 'instance'
    instance_dir.mkdir(parents=True, exist_ok=True)
    db_path = instance_dir / 'escape_room.db'
    _create_legacy_questions_table(str(db_path))

    # Act: run migration from this cwd so relative path resolves
    monkeypatch.chdir(tmp_path)
    _import_migrator().migrate_database()

    # Assert: columns added
    cols = _get_table_columns(str(db_path))
    assert 'question_type' in cols
    assert 'question_data' in cols

    # Assert: existing rows have a type value (DEFAULT or the UPDATE in script)
    conn = sqlite3.connect(str(db_path))
    cur = conn.cursor()
    cur.execute("SELECT question_type FROM questions LIMIT 1")
    val = cur.fetchone()[0]
    conn.close()
    assert val is not None and val == 'single_choice'


def test_migrate_is_idempotent(tmp_path, monkeypatch):
    # Arrange: DB exists and already migrated once
    instance_dir = tmp_path / 'instance'
    instance_dir.mkdir(parents=True, exist_ok=True)
    db_path = instance_dir / 'escape_room.db'
    _create_legacy_questions_table(str(db_path))
    monkeypatch.chdir(tmp_path)
    _import_migrator().migrate_database()

    # Act: run again via normal import; should not raise and schema unchanged
    _import_migrator().migrate_database()

    # Execute module as a script to cover the __main__ guard path without warnings
    sys.modules.pop('backend.migrate_questions', None)
    sys.modules.pop('migrate_questions', None)
    runpy.run_module('backend.migrate_questions', run_name='__main__')
    cols = _get_table_columns(str(db_path))
    assert 'question_type' in cols and 'question_data' in cols


def test_migrate_handles_missing_database_gracefully(tmp_path, monkeypatch):
    # No instance directory nor DB
    monkeypatch.chdir(tmp_path)
    # Should simply print and return without exception
    _import_migrator().migrate_database()


def test_migrate_via_run_path_executes_same_file_for_coverage(tmp_path, monkeypatch):
    """Execute using absolute path to ensure coverage maps to the file on Windows."""
    instance_dir = tmp_path / 'instance'
    instance_dir.mkdir(parents=True, exist_ok=True)
    db_path = instance_dir / 'escape_room.db'
    _create_legacy_questions_table(str(db_path))

    monkeypatch.chdir(tmp_path)
    script_path = os.path.realpath(os.path.join(project_root, 'backend', 'migrate_questions.py'))
    runpy.run_path(script_path, run_name='__main__')

    cols = _get_table_columns(str(db_path))
    assert 'question_type' in cols and 'question_data' in cols


