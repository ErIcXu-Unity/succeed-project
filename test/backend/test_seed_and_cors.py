"""
Tests to improve coverage for seed_data helpers and CORS configuration.
"""
import os

from models import db, Teacher, Task, Achievement
from seed_data import (
    seed_default_teachers,
    seed_default_tasks,
    seed_default_achievements,
    seed_all_data,
)


def test_seed_helpers_and_idempotency(app):
    """Exercise individual seed helpers and verify idempotency with manual commits."""
    with app.app_context():
        # Baseline counts
        t0 = Teacher.query.count()
        task0 = Task.query.count()
        ach0 = Achievement.query.count()

        # Seed using individual helpers, then commit
        seed_default_teachers()
        seed_default_tasks()
        seed_default_achievements()
        db.session.commit()

        # Counts should be >= baseline
        assert Teacher.query.count() >= t0
        assert Task.query.count() >= task0
        assert Achievement.query.count() >= ach0

        # Run the aggregate seeder which commits internally
        seed_all_data()

        # Running again should not create duplicates (idempotency)
        t1 = Teacher.query.count()
        task1 = Task.query.count()
        ach1 = Achievement.query.count()

        seed_all_data()
        assert Teacher.query.count() == t1
        assert Task.query.count() == task1
        assert Achievement.query.count() == ach1


def test_cors_headers_present(client):
    """Verify CORS headers are present for allowed origins on a simple GET."""
    origin = "http://localhost:3000"
    response = client.get("/api/tasks", headers={"Origin": origin})

    # Flask-CORS should echo back the origin
    assert response.status_code in (200, 204)
    assert response.headers.get("Access-Control-Allow-Origin") == origin


