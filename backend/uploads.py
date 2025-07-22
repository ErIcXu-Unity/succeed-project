"""
File Upload Handlers for the Escape Room Application
"""
import os
from flask import Blueprint, send_from_directory, current_app

uploads_bp = Blueprint('uploads', __name__)

@uploads_bp.route('/uploads/questions/<path:filename>')
def uploaded_file(filename):
    """提供问题图片访问服务"""
    uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads')
    return send_from_directory(uploads_dir, f'questions/{filename}')

@uploads_bp.route('/uploads/videos/<path:filename>')
def uploaded_video_file(filename):
    """提供问题视频访问服务"""
    return send_from_directory(current_app.config['VIDEO_UPLOAD_FOLDER'], filename)

@uploads_bp.route('/uploads/videos/<path:filename>')
def uploaded_video(filename):
    """提供视频文件访问服务"""
    return send_from_directory(current_app.config['VIDEO_UPLOAD_FOLDER'], filename)