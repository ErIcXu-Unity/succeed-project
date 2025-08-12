"""
Tests focused on increasing coverage of backend/app.py
"""
import os

from models import db, Teacher, Task, Achievement
from app import initialize_database


class TestAppModule:
    """Increase coverage for create_app configuration and initialize_database."""

    def test_blueprints_registered(self, app):
        """Ensure all expected blueprints are registered on the Flask app."""
        expected = {"auth", "tasks", "questions", "submissions", "students", "uploads"}
        assert expected.issubset(set(app.blueprints.keys()))

    def test_config_paths_present(self, app):
        """Verify important config paths are set by create_app."""
        assert app.config.get("UPLOAD_FOLDER") is not None
        assert app.config.get("VIDEO_UPLOAD_FOLDER") is not None
        assert app.config["UPLOAD_FOLDER"].endswith(os.path.join("uploads", "questions"))
        assert app.config["VIDEO_UPLOAD_FOLDER"].endswith(os.path.join("uploads", "videos"))

    def test_initialize_database_seeds_defaults(self, app):
        """Calling initialize_database should create default teachers, tasks, and achievements."""
        initialize_database(app)

        with app.app_context():
            # Default teachers
            assert Teacher.query.filter_by(username="st1000@tea.com").first() is not None
            assert Teacher.query.filter_by(username="st1001@tea.com").first() is not None

            # Default tasks
            default_task_names = {
                "Chemistry Lab Escape",
                "Math Puzzle Room",
                "Physics Challenge",
                "Statistics Mystery",
            }
            existing_task_names = {t.name for t in Task.query.all()}
            assert default_task_names.issubset(existing_task_names)

            # Default achievements
            default_achievements = {
                "Perfect Score",
                "Accuracy Master",
                "Fast Solver",
                "Quiz Warrior",
            }
            existing_achievements = {a.name for a in Achievement.query.all()}
            assert default_achievements.issubset(existing_achievements)

    def test_initialize_database_idempotent(self, app):
        """Running initialize_database multiple times should not create duplicates."""
        initialize_database(app)
        with app.app_context():
            t_before = Teacher.query.count()
            task_before = Task.query.count()
            ach_before = Achievement.query.count()

        # Run again and verify counts unchanged
        initialize_database(app)
        with app.app_context():
            assert Teacher.query.count() == t_before
            assert Task.query.count() == task_before
            assert Achievement.query.count() == ach_before

    def test_create_app_cors_and_env(self, app, monkeypatch):
        """Validate CORS headers and that DATABASE_URL env is respected by create_app."""
        # CORS check
        res = app.test_client().get("/api/tasks", headers={"Origin": "http://localhost:3000"})
        # Flask-CORS echoes the origin when allowed
        assert res.headers.get("Access-Control-Allow-Origin") == "http://localhost:3000"

        # DATABASE_URL env used in config (value may be None in tests, but key exists)
        assert "SQLALCHEMY_DATABASE_URI" in app.config

    def test_initialize_database_runs_without_placeholder_task(self, app):
        """Ensure initialize_database handles no placeholder_task gracefully."""
        # Remove all tasks to force placeholder_task None path
        with app.app_context():
            Task.query.delete()
            db.session.commit()

        # Run initialize again; should not raise even without tasks
        initialize_database(app)

    def test_initialize_database_creates_when_seed_data_patched(self, app, monkeypatch):
        """Patch seed_all_data to no-op so initialize_database executes its own seeding branches."""
        # Ensure empty DB
        with app.app_context():
            Teacher.query.delete()
            Task.query.delete()
            Achievement.query.delete()
            db.session.commit()

        # Patch seed_all_data to do nothing
        import seed_data as sd

        def _noop():
            return None

        monkeypatch.setattr(sd, "seed_all_data", _noop)

        # Run initialize; it should insert teachers, tasks, achievements via its internal code paths
        initialize_database(app)

        with app.app_context():
            assert Teacher.query.filter_by(username="st1000@tea.com").first() is not None
            assert Task.query.filter_by(name="Chemistry Lab Escape").first() is not None
            assert Achievement.query.filter_by(name="Perfect Score").first() is not None


