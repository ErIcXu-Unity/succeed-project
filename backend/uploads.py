"""
File Upload Handlers for the Escape Room Application
"""
import os
from flask import Blueprint, send_from_directory, current_app

uploads_bp = Blueprint('uploads', __name__)

@uploads_bp.route('/uploads/questions/<path:filename>')
def uploaded_file(filename):
    """Provide question image access service"""
    uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads')
    return send_from_directory(uploads_dir, f'questions/{filename}')

@uploads_bp.route('/uploads/videos/<path:filename>')
def uploaded_video_file(filename):
    """Provide video file access service"""
    return send_from_directory(current_app.config['VIDEO_UPLOAD_FOLDER'], filename)