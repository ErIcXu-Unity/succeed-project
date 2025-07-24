// src/components/StudentAccessibility.jsx
import React, { useState, useEffect } from 'react';
import PasswordInput from './PasswordInput.jsx';
import './StudentAccessibility.css';

function StudentAccessibility() {
  const [highContrast, setHighContrast] = useState(false);
  const [largeFont, setLargeFont]       = useState(false);
  const [colorBlind, setColorBlind]     = useState(false);
  
  // 密码修改相关状态
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const body = document.body;
    body.classList.toggle('high-contrast', highContrast);
    body.classList.toggle('font-large', largeFont);
    body.classList.toggle('colorblind', colorBlind);
  }, [highContrast, largeFont, colorBlind]);

  const speak = () => {
    const synth = window.speechSynthesis;
    if (!synth) return alert('Speech Synthesis not supported');
    const text = document.getElementById('access-content').innerText;
    const utt  = new SpeechSynthesisUtterance(text);
    synth.cancel();
    synth.speak(utt);
  };

  // 密码修改相关函数
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 实时清除错误消息
    if (passwordError) {
      setPasswordError('');
    }
    if (passwordSuccess) {
      setPasswordSuccess('');
    }
  };

  const validatePasswordForm = () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required');
      return false;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return false;
    }
    
    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from current password');
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return false;
    }
    
    return true;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;
    
    setIsSubmitting(true);
    setPasswordError('');
    
    try {
      const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      
      const response = await fetch('http://localhost:5001/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: userData.username || `${userData.user_id}@stu.com`,
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // 自动关闭表单
        setTimeout(() => {
          setShowPasswordForm(false);
          setPasswordSuccess('');
        }, 2000);
      } else {
        setPasswordError(data.error || 'Failed to change password');
      }
    } catch (err) {
      setPasswordError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordForm = () => {
    setShowPasswordForm(!showPasswordForm);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordError('');
    setPasswordSuccess('');
  };

  return (
    <div className="student-accessibility-content">
      <div className="controls">
        <div className="control-card">
          <h2>High Contrast Mode</h2>
          <button onClick={() => setHighContrast(v => !v)}>
            Toggle Contrast
          </button>
        </div>
        <div className="control-card">
          <h2>Large Font</h2>
          <button onClick={() => setLargeFont(v => !v)}>
            Toggle Font Size
          </button>
        </div>
        <div className="control-card">
          <h2>Colorblind Mode</h2>
          <button onClick={() => setColorBlind(v => !v)}>
            Toggle Colorblind
          </button>
        </div>
        <div className="control-card">
          <h2>Text-to-Speech</h2>
          <button onClick={speak}>🔊 Read Page Aloud</button>
        </div>
        
        <div className="control-card">
          <h2>Password Settings</h2>
          <button onClick={togglePasswordForm}>
            {showPasswordForm ? 'Cancel Password Change' : 'Change Password'}
          </button>
        </div>
      </div>

      {showPasswordForm && (
        <div className="password-change-form">
          <h3>Change Password</h3>
          
          {passwordError && <div className="error-message">{passwordError}</div>}
          {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}
          
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <PasswordInput
                name="currentPassword"
                placeholder="Enter current password"
                value={passwordData.currentPassword}
                onChange={handlePasswordInputChange}
                required
                autoComplete="current-password"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <PasswordInput
                name="newPassword"
                placeholder="Enter new password (min 6 characters)"
                value={passwordData.newPassword}
                onChange={handlePasswordInputChange}
                minLength="6"
                required
                autoComplete="new-password"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <PasswordInput
                name="confirmPassword"
                placeholder="Confirm new password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordInputChange}
                required
                autoComplete="new-password"
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="submit-btn"
              >
                {isSubmitting ? 'Changing...' : 'Change Password'}
              </button>
              <button 
                type="button" 
                onClick={togglePasswordForm}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <section className="sample" aria-live="polite">
        <h2>Sample Content</h2>
        <p id="access-content">
          Welcome to the Escape Room platform! Here you can solve puzzles to learn Chemistry and Statistics.
        </p>
      </section>
    </div>
  );
}

export default StudentAccessibility;
