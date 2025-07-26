import React, { useState, useEffect } from 'react';
import './TeacherSettings.css';

const TeacherSettings = () => {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    taskReminders: true,
    gradingNotifications: false,
    theme: 'light',
    language: 'en',
    defaultTaskType: 'quiz',
    autoSave: true,
    showPreview: true
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load user data
    const userData = JSON.parse(localStorage.getItem('user_data'));
    setUser(userData);

    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('teacher-settings');
    if (savedSettings) {
      setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
    }
  }, []);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Save to localStorage (could be extended to save to backend)
      localStorage.setItem('teacher-settings', JSON.stringify(settings));
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error saving settings, please try again.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    const defaultSettings = {
      emailNotifications: true,
      taskReminders: true,
      gradingNotifications: false,
      theme: 'light',
      language: 'en',
      defaultTaskType: 'quiz',
      autoSave: true,
      showPreview: true
    };
    setSettings(defaultSettings);
    setMessage('Settings reset to default values');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="teacher-settings-container">
      <div className="settings-header">
        <h1><i className="fas fa-cog"></i> Teacher Settings</h1>
        <p>Manage your account preferences and system settings</p>
      </div>

      <div className="settings-content">
        {/* Account Information */}
        <div className="settings-card">
          <h2><i className="fas fa-user"></i> Account Information</h2>
          <div className="setting-group">
            <div className="user-info-display">
              <div className="info-item">
                <label>Username:</label>
                <span>{user?.username}</span>
              </div>
              <div className="info-item">
                <label>Real Name:</label>
                <span>{user?.real_name || 'Not set'}</span>
              </div>
              <div className="info-item">
                <label>Role:</label>
                <span>Teacher</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="settings-card">
          <h2><i className="fas fa-bell"></i> Notification Settings</h2>
          <div className="setting-group">
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                />
                <span className="checkmark"></span>
                Email Notifications
              </label>
              <p className="setting-description">Receive important system notification emails</p>
            </div>
            
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.taskReminders}
                  onChange={(e) => handleSettingChange('taskReminders', e.target.checked)}
                />
                <span className="checkmark"></span>
                Task Reminders
              </label>
              <p className="setting-description">Send reminders before task deadlines</p>
            </div>
            
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.gradingNotifications}
                  onChange={(e) => handleSettingChange('gradingNotifications', e.target.checked)}
                />
                <span className="checkmark"></span>
                Grading Notifications
              </label>
              <p className="setting-description">Notify me when new student submissions arrive</p>
            </div>
          </div>
        </div>

        {/* Interface Settings */}
        <div className="settings-card">
          <h2><i className="fas fa-paint-brush"></i> Interface Settings</h2>
          <div className="setting-group">
            <div className="setting-item">
              <label>Theme Mode:</label>
              <select
                value={settings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
                className="setting-select"
              >
                <option value="light">Light Theme</option>
                <option value="dark">Dark Theme</option>
                <option value="auto">Follow System</option>
              </select>
            </div>
            
            <div className="setting-item">
              <label>Language:</label>
              <select
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                className="setting-select"
              >
                <option value="zh">Chinese</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* Work Preferences */}
        <div className="settings-card">
          <h2><i className="fas fa-tasks"></i> Work Preferences</h2>
          <div className="setting-group">
            <div className="setting-item">
              <label>Default Task Type:</label>
              <select
                value={settings.defaultTaskType}
                onChange={(e) => handleSettingChange('defaultTaskType', e.target.value)}
                className="setting-select"
              >
                <option value="quiz">Quiz</option>
                <option value="puzzle">Puzzle Game</option>
                <option value="matching">Matching Task</option>
                <option value="fill-blank">Fill in the Blank</option>
              </select>
            </div>
            
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                />
                <span className="checkmark"></span>
                Auto Save
              </label>
              <p className="setting-description">Automatically save changes when editing tasks</p>
            </div>
            
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.showPreview}
                  onChange={(e) => handleSettingChange('showPreview', e.target.checked)}
                />
                <span className="checkmark"></span>
                Show Preview
              </label>
              <p className="setting-description">Display real-time preview when creating tasks</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="settings-actions">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="save-btn"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          
          <button
            onClick={resetToDefaults}
            className="reset-btn"
          >
            Reset to Default
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div className="settings-message">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherSettings; 