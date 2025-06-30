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

import './App.css';

function AppWrapper() {
  // useNavigate 只能在 Router 内部使用
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loginWithMoodle = async (role) => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(res => setTimeout(res, 500));
      const fakeToken = 'fake-oauth2-token-xyz';
      const fakeUser = {
        fullname: role === 'Teacher'
          ? 'Professor Alice Wang'
          : 'Student Bob Lee',
        email: role === 'Teacher'
          ? 'alice.wang@unsw.edu.au'
          : 'bob.lee@unsw.edu.au',
        username: role === 'Teacher' ? 't12345' : 's67890',
        role,
        userid: role === 'Teacher' ? 'T-FAKE-001' : 'S-FAKE-002'
      };
      localStorage.setItem('moodle_token', fakeToken);
      localStorage.setItem('moodle_user', JSON.stringify(fakeUser));
      setUser(fakeUser);

      // **登录后立即跳转**
      if (role === 'Teacher') {
        navigate('/teacher', { replace: true });
      } else {
        navigate('/student/home', { replace: true });
      }
    } catch (err) {
      console.error(err);
      setError(`Login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('moodle_user');
    localStorage.removeItem('moodle_token');
    navigate('/', { replace: true });
  };

  useEffect(() => {
    const saved = localStorage.getItem('moodle_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); }
      catch { localStorage.removeItem('moodle_user'); }
    }
  }, []);

  // 登录中
  if (loading) {
    return (
      <div className="App">
        <h2>Authenticating with Moodle…</h2>
        <div className="spinner" />
      </div>
    );
  }

  // 未登录：先给登录界面
  if (!user) {
    return (
      <div className="App">
        <header>
          <img src="/assets/logo.png" alt="UNSW Logo" />
          <h1>Escape Room Editor</h1>
        </header>
        <main>
          <div className="card-group">
            <div
              className="login-card"
              onClick={() => loginWithMoodle('Teacher')}
            >
              <img src="/assets/teacher.png" alt="Teacher Login" />
              <h2>Teacher Login</h2>
              {error && <div className="error-message">{error}</div>}
            </div>
            <div
              className="login-card"
              onClick={() => loginWithMoodle('Student')}
            >
              <img src="/assets/graduation.png" alt="Student Login" />
              <h2>Student Login</h2>
              {error && <div className="error-message">{error}</div>}
            </div>
          </div>
        </main>
        <footer>
          &copy; 2025 UNSW Sydney •{' '}
          <a href="https://moodle.telt.unsw.edu.au">Moodle Home</a>
        </footer>
      </div>
    );
  }

  // 已登录：渲染带路由的主界面
  return (
    <div className="App">
      <header>
        <img src="/assets/logo.png" alt="UNSW Logo" />
        <h1>Escape Room Editor</h1>
        <div className="user-info">
          <span>Welcome, {user.fullname} ({user.role})</span>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <main>
        <Routes>
          {user.role === 'Teacher' ? (
            <>
              <Route path="/teacher" element={<TeacherLayout />}>
                <Route index element={<TeacherDashboard />} />
                <Route path="reports" element={<TeacherReports />} />
                <Route path="students" element={<TeacherStudents />} />
                <Route path="gamegrade" element={<EachgameGrade />} />
              </Route>
            </>
          ) : (
            <Route path="/student" element={<StudentLayout />}>
              <Route index element={<Navigate to="home" replace />} />
              <Route path="home" element={<StudentDashboard />} />
              <Route path="achievements" element={<StudentAchievements />} />
              <Route path="history" element={<StudentHistory />} />
              <Route path="accessibility" element={<StudentAccessibility />} />
              <Route path="help" element={<StudentHelp />} />
              <Route path="*" element={<Navigate to="home" replace />} />
            </Route>
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

// 最外层包一个 BrowserRouter
export default function App() {
  return (
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  );
}
