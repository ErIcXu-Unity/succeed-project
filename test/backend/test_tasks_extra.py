"""
Additional tests to increase coverage for backend/tasks.py.
Covered endpoints:
- get_tasks (student vs teacher visibility)
- create_task (success and error cases)
- get_task_detail (200 and 404)
- update_task (publish_at parse, video fields set/clear)
- delete_task (cascade delete paths)
- save_task_progress/get_task_progress/delete_task_progress
- upload_task_video/save_youtube_url/delete_task_video
"""

import io
import os
import json
from datetime import datetime, timezone, timedelta

from models import (
    db,
    Student,
    Task,
    Question,
    StudentTaskProcess,
    StudentTaskResult,
    Achievement,
    StudentAchievement,
)


def test_get_tasks_student_vs_teacher_visibility(client, app, test_task):
    """Future publish_at should be hidden from student but visible to teacher role."""
    with app.app_context():
        future_task = Task(name="Future Task", introduction="f")
        future_task.publish_at = datetime.now(timezone.utc) + timedelta(days=1)
        db.session.add(future_task)
        db.session.commit()

    # Student (default)
    r_stu = client.get("/api/tasks")
    assert r_stu.status_code == 200
    stu_list = json.loads(r_stu.data)
    assert all(t.get("name") != "Future Task" for t in stu_list)

    # Teacher role sees all
    r_tea = client.get("/api/tasks?role=tea")
    assert r_tea.status_code == 200
    tea_list = json.loads(r_tea.data)
    assert any(t.get("name") == "Future Task" for t in tea_list)

    # Image/video fields presence
    with app.app_context():
        test_task.image_path = "img.png"
        test_task.video_type = "youtube"
        test_task.video_url = "https://youtu.be/xyz"
        db.session.commit()
    r_extra = client.get("/api/tasks?role=tea")
    data = json.loads(r_extra.data)
    this = next(t for t in data if t.get("id") == test_task.id)
    assert this.get("image_url") and this.get("video_type") == "youtube"


def test_create_task_success_and_errors(client):
    # Missing name
    r1 = client.post("/api/tasks", json={"introduction": "x"})
    assert r1.status_code == 400
    # Missing introduction
    r2 = client.post("/api/tasks", json={"name": "New1"})
    assert r2.status_code == 400
    # Invalid publish_at
    r3 = client.post("/api/tasks", json={"name": "New2", "introduction": "x", "publish_at": "bad"})
    assert r3.status_code == 400

    # Success
    ok = client.post("/api/tasks", json={"name": "NewTaskOK", "introduction": "intro"})
    assert ok.status_code == 201
    # Duplicate name -> 409
    dup = client.post("/api/tasks", json={"name": "NewTaskOK", "introduction": "intro2"})
    assert dup.status_code == 409


def test_get_task_detail_and_404(client, app, test_task):
    res = client.get(f"/api/tasks/{test_task.id}")
    assert res.status_code == 200
    bad = client.get("/api/tasks/999999")
    assert bad.status_code == 404


def test_update_task_publish_and_videos(client, app, test_task):
    # Set valid ISO publish_at
    iso = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
    r1 = client.put(
        f"/api/tasks/{test_task.id}",
        json={"publish_at": iso, "name": "Updated Name"},
    )
    assert r1.status_code == 200

    # Invalid publish_at
    r2 = client.put(f"/api/tasks/{test_task.id}", json={"publish_at": "invalid"})
    assert r2.status_code == 400

    # Set video_type=local and path
    r3 = client.put(
        f"/api/tasks/{test_task.id}",
        json={"video_type": "local", "video_path": "vid.mp4"},
    )
    assert r3.status_code == 200

    # Switch to youtube
    r4 = client.put(
        f"/api/tasks/{test_task.id}",
        json={"video_type": "youtube", "video_url": "https://youtu.be/abc"},
    )
    assert r4.status_code == 200

    # Clear video info
    r5 = client.put(f"/api/tasks/{test_task.id}", json={"video_type": None})
    assert r5.status_code == 200

    # 404 on update
    nf = client.put("/api/tasks/999999", json={"name": "x"})
    assert nf.status_code == 404


def test_save_get_delete_task_progress(client, app, test_student, test_task):
    # Missing student_id -> 400
    r0 = client.post(f"/api/tasks/{test_task.id}/save-progress", json={})
    assert r0.status_code == 400

    # Student not found -> 404
    r1 = client.post(
        f"/api/tasks/{test_task.id}/save-progress",
        json={"student_id": "NO_SUCH", "current_question_index": 1, "answers": {}},
    )
    assert r1.status_code == 404

    # Task not found -> 404
    r2 = client.post(
        "/api/tasks/999999/save-progress",
        json={"student_id": test_student.student_id, "current_question_index": 1, "answers": {}},
    )
    assert r2.status_code == 404

    # Success create
    payload = {
        "student_id": test_student.student_id,
        "current_question_index": 2,
        "answers": {"1": "A"},
    }
    ok = client.post(f"/api/tasks/{test_task.id}/save-progress", json=payload)
    assert ok.status_code == 200

    # Update existing
    payload["current_question_index"] = 3
    ok2 = client.post(f"/api/tasks/{test_task.id}/save-progress", json=payload)
    assert ok2.status_code == 200

    # Get progress - present
    get_ok = client.get(
        f"/api/tasks/{test_task.id}/progress", query_string={"student_id": test_student.student_id}
    )
    assert get_ok.status_code == 200 and json.loads(get_ok.data)["has_progress"] is True

    # Get progress - missing student_id
    miss = client.get(f"/api/tasks/{test_task.id}/progress")
    assert miss.status_code == 400

    # Delete progress - present
    del_ok = client.delete(
        f"/api/tasks/{test_task.id}/progress", query_string={"student_id": test_student.student_id}
    )
    assert del_ok.status_code == 200
    # Delete again -> No progress found
    del_no = client.delete(
        f"/api/tasks/{test_task.id}/progress", query_string={"student_id": test_student.student_id}
    )
    assert del_no.status_code == 200

    # Delete without student_id -> 400
    del_bad = client.delete(f"/api/tasks/{test_task.id}/progress")
    assert del_bad.status_code == 400


def test_upload_video_good_and_errors(client, app, test_task):
    # Missing file
    nofile = client.post(f"/api/tasks/{test_task.id}/video", data={}, content_type="multipart/form-data")
    assert nofile.status_code == 400

    # Empty filename
    empty = client.post(
        f"/api/tasks/{test_task.id}/video",
        data={"video": (io.BytesIO(b""), "")},
        content_type="multipart/form-data",
    )
    assert empty.status_code == 400

    # Invalid extension
    badext = client.post(
        f"/api/tasks/{test_task.id}/video",
        data={"video": (io.BytesIO(b"data"), "bad.txt")},
        content_type="multipart/form-data",
    )
    assert badext.status_code == 400

    # Valid mp4
    ok = client.post(
        f"/api/tasks/{test_task.id}/video",
        data={"video": (io.BytesIO(b"mp4data"), "ok.mp4")},
        content_type="multipart/form-data",
    )
    assert ok.status_code == 200
    resp = json.loads(ok.data)
    assert resp.get("video_type") == "local"

    # 404 upload
    nf = client.post(
        "/api/tasks/999999/video",
        data={"video": (io.BytesIO(b"x"), "ok.mp4")},
        content_type="multipart/form-data",
    )
    assert nf.status_code == 404


def test_save_youtube_url_and_errors(client, test_task):
    # Missing url
    miss = client.post(f"/api/tasks/{test_task.id}/youtube", json={})
    assert miss.status_code == 400
    # Invalid url
    bad = client.post(
        f"/api/tasks/{test_task.id}/youtube", json={"youtube_url": "http://example.com"}
    )
    assert bad.status_code == 400
    # Good url
    ok = client.post(
        f"/api/tasks/{test_task.id}/youtube", json={"youtube_url": "https://youtu.be/abc"}
    )
    assert ok.status_code == 200
    # 404 task
    nf = client.post("/api/tasks/999999/youtube", json={"youtube_url": "https://youtu.be/abc"})
    assert nf.status_code == 404


def test_delete_task_video_and_delete_task_cascade(client, app, test_task, test_student):
    # Prepare a local video file to be deleted
    video_dir = os.path.join(os.path.dirname(__file__), "..", "..", "backend", "uploads", "videos")
    os.makedirs(video_dir, exist_ok=True)
    video_file = os.path.join(video_dir, "todel.mp4")
    with open(video_file, "wb") as f:
        f.write(b"data")

    # Set task's video info via update
    client.put(
        f"/api/tasks/{test_task.id}", json={"video_type": "local", "video_path": "todel.mp4"}
    )

    # Delete task video
    r1 = client.delete(f"/api/tasks/{test_task.id}/video")
    assert r1.status_code == 200

    # 404 delete video
    nf_video = client.delete("/api/tasks/999999/video")
    assert nf_video.status_code == 404

    # Build cascade data then delete task
    with app.app_context():
        # process
        proc = StudentTaskProcess(
            student_id=test_student.student_id,
            student_name=test_student.real_name,
            task_id=test_task.id,
            task_name=test_task.name,
            current_question_index=0,
        )
        db.session.add(proc)

        # result
        res = StudentTaskResult(
            student_id=test_student.student_id,
            student_name=test_student.real_name,
            task_id=test_task.id,
            task_name=test_task.name,
            total_score=0,
            completed_at=datetime.now(timezone.utc),
        )
        db.session.add(res)

        # achievement + student achievement
        ach = Achievement(task_id=test_task.id, name="TaskAch", condition="c")
        db.session.add(ach)
        db.session.commit()
        sa = StudentAchievement(
            student_id=test_student.student_id,
            student_name=test_student.real_name,
            achievement_id=ach.id,
            achievement_name=ach.name,
            unlocked_at=datetime.now(timezone.utc),
        )
        db.session.add(sa)
        # one question
        q = Question(
            task_id=test_task.id,
            question="Q?",
            question_type="single_choice",
            option_a="A",
            option_b="B",
            correct_answer="A",
            difficulty="easy",
            score=1,
        )
        db.session.add(q)
        db.session.commit()

    del_task = client.delete(f"/api/tasks/{test_task.id}")
    assert del_task.status_code == 200
    # Ensure detail 404 afterwards
    assert client.get(f"/api/tasks/{test_task.id}").status_code == 404

