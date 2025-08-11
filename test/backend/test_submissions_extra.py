"""
Additional coverage for backend/submissions.py::submit_task
Coverage focus:
- Validation errors (400/404)
- Each question type scoring branches
- Achievement unlock paths (Perfect Score, Fast Solver, Accuracy Master, Quiz Warrior)
- Progress deletion after submit
"""

import json
from datetime import datetime, timezone, timedelta

from models import (
    db,
    Task,
    Question,
    StudentTaskProcess,
    Achievement,
    StudentTaskResult,
)


def _iso_minutes_ago(minutes: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(minutes=minutes)).isoformat()


def _ensure_achievements(app):
    names = [
        "Perfect Score",
        "Accuracy Master",
        "Fast Solver",
        "Quiz Warrior",
    ]
    with app.app_context():
        for nm in names:
            if not Achievement.query.filter_by(name=nm).first():
                # Link to any task later; task_id is required by the model
                t = Task(name=f"Achv-{nm}")
                db.session.add(t)
                db.session.commit()
                db.session.add(Achievement(task_id=t.id, name=nm, condition=nm))
                db.session.commit()


def _create_task_with_question(app, name: str, qtype: str, **kwargs) -> tuple[int, int]:
    """Create a task and a single question. Return (task_id, question_id)."""
    with app.app_context():
        task = Task(name=name)
        db.session.add(task)
        db.session.commit()
        q_kwargs = dict(
            task_id=task.id,
            question=f"{qtype} question?",
            question_type=qtype,
            difficulty="easy",
            score=3,
        )
        q_kwargs.update(kwargs)
        q = Question(**q_kwargs)
        db.session.add(q)
        db.session.commit()
        return task.id, q.id


def test_submit_validation_and_not_found(client):
    # Not a dict / missing student_id -> 400
    r1 = client.post("/api/tasks/1/submit", json={"answers": "not-a-dict"})
    assert r1.status_code == 400

    # Student not found -> 404
    r2 = client.post("/api/tasks/1/submit", json={"answers": {}, "student_id": "NO_SUCH"})
    assert r2.status_code == 404

    # Task not found -> 404
    r3 = client.post("/api/tasks/999999/submit", json={"answers": {}, "student_id": "1234567"})
    assert r3.status_code == 404


def test_submit_single_choice_perfect_and_fast_solver(client, app, test_student):
    _ensure_achievements(app)
    # Create task + single_choice
    t_id, q_id = _create_task_with_question(
        app,
        name="SC Task",
        qtype="single_choice",
        option_a="A",
        option_b="B",
        option_c="C",
        option_d="D",
        correct_answer="A",
    )

    # Create a progress record to exercise deletion after submit
    with app.app_context():
        proc = StudentTaskProcess(
            student_id=test_student.student_id,
            student_name=test_student.real_name,
            task_id=t_id,
            task_name="SC Task",
            current_question_index=0,
        )
        db.session.add(proc)
        db.session.commit()

    payload = {
        "student_id": test_student.student_id,
        "answers": {str(q_id): "A"},
        "started_at": _iso_minutes_ago(5),  # within 10 minutes => Fast Solver
    }
    res = client.post(f"/api/tasks/{t_id}/submit", json=payload)
    assert res.status_code == 200
    body = json.loads(res.data)
    assert body["total_score"] == 3
    # May or may not unlock depending on DB state; ensure response shape
    assert isinstance(body.get("new_achievements"), list)


def test_submit_fill_blank_and_multiple_choice(client, app, test_student):
    # Fill blank
    t1_id, q1_id = _create_task_with_question(
        app,
        name="FB Task",
        qtype="fill_blank",
        question_data=json.dumps({"blank_answers": ["Paris"]}),
    )
    # Correct answer
    p1 = {"student_id": test_student.student_id, "answers": {str(q1_id): ["Paris"]}}
    r1 = client.post(f"/api/tasks/{t1_id}/submit", json=p1)
    assert r1.status_code == 200

    # Multiple choice
    t2_id, q2_id = _create_task_with_question(
        app,
        name="MC Task",
        qtype="multiple_choice",
        question_data=json.dumps({"options": ["A", "B", "C"], "correct_answers": [0, 2]}),
    )
    # Correct (order agnostic)
    p2 = {"student_id": test_student.student_id, "answers": {str(q2_id): [2, 0]}}
    r2 = client.post(f"/api/tasks/{t2_id}/submit", json=p2)
    assert r2.status_code == 200

    # Wrong type for MC (not a list) -> stays incorrect path
    p3 = {"student_id": test_student.student_id, "answers": {str(q2_id): "0"}}
    r3 = client.post(f"/api/tasks/{t2_id}/submit", json=p3)
    assert r3.status_code == 200


def test_submit_puzzle_and_matching(client, app, test_student):
    # Puzzle
    t1_id, q1_id = _create_task_with_question(
        app,
        name="Puzzle Task",
        qtype="puzzle_game",
        question_data=json.dumps({"puzzle_solution": "A B C"}),
    )
    # Exact solution
    pz = {"student_id": test_student.student_id, "answers": {str(q1_id): ["A", "B", "C"]}}
    r1 = client.post(f"/api/tasks/{t1_id}/submit", json=pz)
    assert r1.status_code == 200

    # Matching
    t2_id, q2_id = _create_task_with_question(
        app,
        name="Match Task",
        qtype="matching_task",
        question_data=json.dumps({
            "left_items": ["A", "B"],
            "right_items": ["1", "2"],
            "correct_matches": [{"left": 0, "right": 1}],
        }),
    )
    # Correct mapping with string key
    mt = {"student_id": test_student.student_id, "answers": {str(q2_id): {"0": 1}}}
    r2 = client.post(f"/api/tasks/{t2_id}/submit", json=mt)
    assert r2.status_code == 200


def test_submit_accuracy_master_and_quiz_warrior(client, app, test_student):
    _ensure_achievements(app)
    # Create 4 tasks with single-choice questions and perfect submissions
    task_ids = []
    for i in range(4):
        t_id, q_id = _create_task_with_question(
            app,
            name=f"Task-{i}",
            qtype="single_choice",
            option_a="A",
            option_b="B",
            correct_answer="A",
        )
        task_ids.append((t_id, q_id))

    # Submit perfect answers for all 4 tasks
    for t_id, q_id in task_ids:
        payload = {"student_id": test_student.student_id, "answers": {str(q_id): "A"}}
        res = client.post(f"/api/tasks/{t_id}/submit", json=payload)
        assert res.status_code == 200

    # After multiple results, accuracy should be >= 90 and total completed >= total_task_count
    # Which triggers Accuracy Master and Quiz Warrior when those achievements exist
    # We can't guarantee unlock here without introspecting DB, but the branch is executed.
    # Trigger one more submit to traverse post-commit achievement calculations
    extra_t, extra_q = task_ids[0]
    res2 = client.post(
        f"/api/tasks/{extra_t}/submit",
        json={"student_id": test_student.student_id, "answers": {str(extra_q): "A"}},
    )
    assert res2.status_code == 200


def test_submit_fill_blank_wrong_length_and_not_list(client, app, test_student):
    """Cover fill_blank length mismatch and non-list answer types."""
    # Expect 2 blanks
    t_id, q_id = _create_task_with_question(
        app,
        name="FB Wrong Length",
        qtype="fill_blank",
        question_data=json.dumps({"blank_answers": ["A", "B"]}),
    )
    # Provide only one answer -> length mismatch branch
    p1 = {"student_id": test_student.student_id, "answers": {str(q_id): ["A"]}}
    r1 = client.post(f"/api/tasks/{t_id}/submit", json=p1)
    assert r1.status_code == 200

    # Provide non-list -> not list branch
    p2 = {"student_id": test_student.student_id, "answers": {str(q_id): "A"}}
    r2 = client.post(f"/api/tasks/{t_id}/submit", json=p2)
    assert r2.status_code == 200


def test_submit_matching_with_extra_pairs(client, app, test_student):
    """Matching task: provide correct match plus an extra pair to traverse extras check branch."""
    t_id, q_id = _create_task_with_question(
        app,
        name="Match Extras",
        qtype="matching_task",
        question_data=json.dumps({
            "left_items": ["A", "B"],
            "right_items": ["1", "2"],
            "correct_matches": [{"left": 0, "right": 1}],
        }),
    )
    # Provide correct mapping for left 0 and an extra mapping for left 1
    payload = {"student_id": test_student.student_id, "answers": {str(q_id): {"0": 1, "1": 2}}}
    r = client.post(f"/api/tasks/{t_id}/submit", json=payload)
    assert r.status_code == 200


def test_submit_multiple_questions_total_score_and_no_fast(client, app, test_student):
    """Create task with two single-choice questions; submit mixed answers and a slow started_at."""
    with app.app_context():
        t = Task(name="Two Qs")
        db.session.add(t)
        db.session.commit()
        q1 = Question(task_id=t.id, question="Q1?", question_type="single_choice", option_a="A", option_b="B", correct_answer="A", difficulty="easy", score=3)
        q2 = Question(task_id=t.id, question="Q2?", question_type="single_choice", option_a="A", option_b="B", correct_answer="B", difficulty="easy", score=4)
        db.session.add_all([q1, q2])
        db.session.commit()
        q1_id, q2_id, t_id = q1.id, q2.id, t.id

    # One correct, one wrong; started_at long ago so no Fast Solver
    payload = {
        "student_id": test_student.student_id,
        "answers": {str(q1_id): "A", str(q2_id): "A"},
        "started_at": _iso_minutes_ago(30),
    }
    res = client.post(f"/api/tasks/{t_id}/submit", json=payload)
    assert res.status_code == 200
    data = json.loads(res.data)
    # Only q1 correct (3 points)
    assert data["total_score"] == 3


def test_submit_started_at_invalid_and_unknown_type(client, app, test_student):
    """Cover invalid started_at parsing and unknown question type generic compare."""
    # Unknown type question, correct answer 'X'
    t_id, q_id = _create_task_with_question(
        app,
        name="Unknown Type Task",
        qtype="unknown_type",
        option_a=None,
        option_b=None,
        correct_answer="X",
    )
    payload = {
        "student_id": test_student.student_id,
        "answers": {str(q_id): "x"},  # case-insensitive match
        "started_at": "invalid-timestamp",  # exercise except branch
    }
    r = client.post(f"/api/tasks/{t_id}/submit", json=payload)
    assert r.status_code == 200


def test_submit_with_missing_question_entries_and_update_existing(client, app, test_student):
    """Include a non-existent question id (continue) and then update existing result on second submit."""
    t_id, q_id = _create_task_with_question(
        app,
        name="Update Result Task",
        qtype="single_choice",
        option_a="A",
        option_b="B",
        correct_answer="A",
    )

    # First submit wrong to get 0 score; include bogus question id -> continue path
    p1 = {
        "student_id": test_student.student_id,
        "answers": {"99999999": "Z", str(q_id): "B"},
    }
    r1 = client.post(f"/api/tasks/{t_id}/submit", json=p1)
    assert r1.status_code == 200

    # Then submit correct to trigger existing update path
    p2 = {"student_id": test_student.student_id, "answers": {str(q_id): "A"}}
    r2 = client.post(f"/api/tasks/{t_id}/submit", json=p2)
    assert r2.status_code == 200

    # Verify DB shows updated score = 3
    with app.app_context():
        rec = StudentTaskResult.query.filter_by(student_id=test_student.student_id, task_id=t_id).first()
        assert rec is not None and rec.total_score == 3


def test_submit_mc_parse_error_and_wrong_types(client, app, test_student):
    """Cover MC JSON parse error, puzzle non-list, matching non-dict selected types."""
    # MC parse error
    mc_tid, mc_qid = _create_task_with_question(
        app,
        name="MC Parse Error",
        qtype="multiple_choice",
        question_data="not-json",
    )
    p_mc = {"student_id": test_student.student_id, "answers": {str(mc_qid): [0]}}
    r_mc = client.post(f"/api/tasks/{mc_tid}/submit", json=p_mc)
    assert r_mc.status_code == 200

    # Puzzle wrong type (string instead of list)
    pz_tid, pz_qid = _create_task_with_question(
        app,
        name="Puzzle Wrong Type",
        qtype="puzzle_game",
        question_data=json.dumps({"puzzle_solution": "A B"}),
    )
    p_pz = {"student_id": test_student.student_id, "answers": {str(pz_qid): "A B"}}
    r_pz = client.post(f"/api/tasks/{pz_tid}/submit", json=p_pz)
    assert r_pz.status_code == 200

    # Matching wrong type (list instead of dict)
    mt_tid, mt_qid = _create_task_with_question(
        app,
        name="Match Wrong Type",
        qtype="matching_task",
        question_data=json.dumps({
            "left_items": ["A", "B"],
            "right_items": ["1", "2"],
            "correct_matches": [{"left": 0, "right": 1}],
        }),
    )
    p_mt = {"student_id": test_student.student_id, "answers": {str(mt_qid): [1]}}
    r_mt = client.post(f"/api/tasks/{mt_tid}/submit", json=p_mt)
    assert r_mt.status_code == 200


def test_submit_progress_delete_exception_is_ignored(client, app, test_student, monkeypatch):
    """Force deletion of progress to raise but still return 200."""
    t_id, q_id = _create_task_with_question(
        app,
        name="Delete Progress Err",
        qtype="single_choice",
        option_a="A",
        option_b="B",
        correct_answer="A",
    )

    # Patch STP.query to break filter_by
    from models import StudentTaskProcess as STP

    class BrokenQuery:
        def filter_by(self, **kwargs):
            raise Exception("boom")

    monkeypatch.setattr(STP, "query", BrokenQuery())

    payload = {"student_id": test_student.student_id, "answers": {str(q_id): "A"}}
    r = client.post(f"/api/tasks/{t_id}/submit", json=payload)
    assert r.status_code == 200

