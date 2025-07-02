import React, { useState, useRef } from 'react';
import './ImageUpload.css';

const ImageUpload = ({ onImageSelect, maxSize = 5 * 1024 * 1024, acceptedFormats = ['jpg', 'jpeg', 'png', 'gif'] }) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    // 检查文件大小
    if (file.size > maxSize) {
      return `The file size cannot exceed ${Math.round(maxSize / 1024 / 1024)}MB`;
    }

    // 检查文件格式
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      return `Only the following formats are supported: ${acceptedFormats.join(', ')}`;
    }

    // 检查MIME类型
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedMimeTypes.includes(file.type)) {
      return 'Please select a valid image file';
    }

    return null;
  };

  const handleFile = (file) => {
    const errorMsg = validateFile(file);
    if (errorMsg) {
      setError(errorMsg);
      return;
    }

    setError('');
    
    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // 通知父组件
    onImageSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setPreview(null);
    setError('');
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="image-upload-container">
      {!preview && (
        <div
          className={`upload-area ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <div className="upload-content">
            <i className="fas fa-cloud-upload-alt upload-icon"></i>
            <p>Drag an image here or click to select a file</p>
            <p className="upload-hint">
            Supported formats:{acceptedFormats.join(', ')} | Maximum {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        </div>
      )}

      {preview && (
        <div className="image-preview">
          <img src={preview} alt="Upload Preview" />
          <button type="button" className="remove-btn" onClick={removeImage}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {error && (
        <div className="upload-error">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.map(format => `.${format}`).join(',')}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ImageUpload; 