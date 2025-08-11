"""
Tests for backend/uploads.py static file handlers.
"""

import os


def test_uploaded_file_serves_question_asset(client, app):
    # Prepare a dummy image under backend/uploads/questions/<task_x>/file
    base_dir = os.path.join(os.path.dirname(__file__), "..", "..", "backend", "uploads", "questions", "task_1")
    os.makedirs(base_dir, exist_ok=True)
    fname = os.path.join(base_dir, "dummy.png")
    with open(fname, "wb") as f:
        f.write(b"img")

    resp = client.get("/uploads/questions/task_1/dummy.png")
    assert resp.status_code in (200, 304)  # Served by send_from_directory


def test_uploaded_video_file_serves_from_configured_folder(client, app):
    # Prepare a dummy video under VIDEO_UPLOAD_FOLDER
    video_dir = app.config["VIDEO_UPLOAD_FOLDER"]
    os.makedirs(video_dir, exist_ok=True)
    path = os.path.join(video_dir, "v.mp4")
    with open(path, "wb") as f:
        f.write(b"vid")

    resp = client.get("/uploads/videos/v.mp4")
    assert resp.status_code in (200, 304)

