import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import './TeacherLayout.css';

const TeacherLayout = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path) => currentPath === path;

  return (
    <div className="teacher-dashboard">
      <div className="sidebar">
        <div className="header">Teacher Dashboard</div>
        
        <div className="nav">
          <Link to="/teacher" className={`nav-item ${isActive('/teacher') ? 'active' : ''}`}>
            <i className="fas fa-home"></i> Dashboard
          </Link>
          <Link to="/teacher/students" className={`nav-item ${isActive('/teacher/students') ? 'active' : ''}`}>
            <i className="fas fa-users"></i> Students
          </Link>
          <Link to="/teacher/reports" className={`nav-item ${isActive('/teacher/reports') ? 'active' : ''}`}>
            <i className="fas fa-chart-bar"></i> Reports
          </Link>
          <Link to="/teacher/settings" className={`nav-item ${isActive('/teacher/settings') ? 'active' : ''}`}>
            <i className="fas fa-cog"></i> Settings
          </Link>
        </div>
      </div>

      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default TeacherLayout;