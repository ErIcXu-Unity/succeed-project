// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import TeacherDashboard from './components/TeacherDashboard.jsx';
import EachgameGrade from './components/EachgameGrade.jsx';
import TeacherLayout from './components/TeacherLayout.jsx';
import TeacherReports from './components/TeacherReports.jsx';
import TeacherStudents from './components/TeacherStudents.jsx';
import StudentLayout from './components/StudentLayout.jsx';
import StudentDashboard from './components/StudentDashboard.jsx';
import StudentAchievements from './components/StudentAchievements.jsx';
import StudentHistory from './components/StudentHistory.jsx';
import StudentAccessibility from './components/StudentAccessibility.jsx';
import StudentHelp from './components/StudentHelp.jsx';
import TaskIntro from './components/TaskIntro.jsx';
import TaskQuiz from './components/TaskQuiz.jsx';
import TaskEditor from './components/TaskEditor.jsx';
import Login from './components/Login.jsx';

import './App.css';

function AppWrapper() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    
    // Navigate based on role
    if (userData.role === 'tea') {
      navigate('/teacher', { replace: true });
    } else {
      navigate('/student/home', { replace: true });
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user_data');
    navigate('/', { replace: true });
  };

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('user_data');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user_data');
      }
    }
    setLoading(false);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="App">
        <h2>Loading...</h2>
      </div>
    );
  }

  // Not logged in: show login page
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Logged in: show main app with routes
  return (
    <div className="App">
      <header>
        <img src="/assets/logo.png" alt="UNSW Logo" />
        <h1>Escape Room Editor</h1>
        <div className="user-info">
          <span>Welcome, {user.real_name ? user.real_name : user.username} ({user.role === 'tea' ? 'Teacher' : 'Student'})</span>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <main>
        <Routes>
          {user.role === 'tea' ? (
            <>
              <Route path="/teacher" element={<TeacherLayout />}>
                <Route index element={<TeacherDashboard />} />
                <Route path="reports" element={<TeacherReports />} />
                <Route path="students" element={<TeacherStudents />} />
                <Route path="gamegrade" element={<EachgameGrade />} />
              </Route>
              {/* 任务编辑路由 - 在TeacherLayout外部 */}
              <Route path="/teacher/tasks/:taskId/edit" element={<TaskEditor />} />
              <Route path="*" element={<Navigate to="/teacher" replace />} />
            </>
          ) : (
            <>
              <Route path="/student" element={<StudentLayout />}>
                <Route index element={<Navigate to="home" replace />} />
                <Route path="home" element={<StudentDashboard />} />
                <Route path="achievements" element={<StudentAchievements />} />
                <Route path="history" element={<StudentHistory />} />
                <Route path="accessibility" element={<StudentAccessibility />} />
                <Route path="help" element={<StudentHelp />} />
              </Route>
              {/* 任务相关路由 - 在StudentLayout外部 */}
              <Route path="/student/tasks/:taskId/intro" element={<TaskIntro />} />
              <Route path="/student/tasks/:taskId/quiz" element={<TaskQuiz />} />
              <Route path="*" element={<Navigate to="/student/home" replace />} />
            </>
          )}
        </Routes>
      </main>

      <footer>
        &copy; 2025 UNSW Sydney •{' '}
        <a href="https://moodle.telt.unsw.edu.au">Moodle Home</a>
      </footer>
    </div>
  );
}

// Main App component with Router
export default function App() {
  return (
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  );
}
