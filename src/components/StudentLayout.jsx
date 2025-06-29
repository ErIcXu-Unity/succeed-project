// src/components/StudentLayout.jsx
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './StudentLayout.css';

export default function StudentLayout() {
  return (
    <div className="student-layout">
      {/* 二级头部 */}
      <div className="sub-header">
        <h2>Escape Room • Student Dashboard</h2>
        <NavLink to="/" className="back-to-main">
          Back to Main
        </NavLink>
      </div>

      {/* 学生端二级导航 */}
      <nav className="student-nav">
        <ul>
          <li><NavLink to="home">Home</NavLink></li>
          <li><NavLink to="achievements">Achievements</NavLink></li>
          <li><NavLink to="history">History</NavLink></li>
          <li><NavLink to="accessibility">Accessibility</NavLink></li>
          <li><NavLink to="help">Help</NavLink></li>
        </ul>
      </nav>

      {/* 子路由挂载点 */}
      <div className="student-content">
        <Outlet />
      </div>
    </div>
  );
}
