import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TeacherStudents.css';
import config from '../config';

const TeacherStudents = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [error, setError] = useState(null);

  // 获取学生列表
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('${config.API_BASE_URL}/api/students/list');
      
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // 导出CSV
  const exportCSV = () => {
    let csv = "Student ID,Name,Class\n";
    filteredStudents.forEach(({ student_id, name, class: cls }) => {
      csv += `${student_id},${name},${cls}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_list.csv";
    a.click();
  };

  // 查看学生详情
  const viewStudent = (studentId) => {
    navigate(`/teacher/students/${studentId}`);
  };

  // 过滤学生数据
  const filteredStudents = students.filter(student => {
    const nameMatch = student.name.toLowerCase().includes(search.toLowerCase());
    const classMatch = !classFilter || student.class === classFilter;
    return nameMatch && classMatch;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading students...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">Error: {error}</p>
        <button onClick={fetchStudents} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="teacher-page">
      <div className="content-wrapper">
        <div className="top-bar">
          <div className="search-filter">
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <select 
              value={classFilter} 
              onChange={(e) => setClassFilter(e.target.value)}
              className="class-select"
            >
              <option value="">All Classes</option>
              <option value="Class A">Class A</option>
              <option value="Class B">Class B</option>
              <option value="Class C">Class C</option>
            </select>
          </div>
          <button className="export-btn" onClick={exportCSV}>
            <i className="fas fa-download"></i> Export CSV
          </button>
        </div>

        <div className="table-container">
          <table className="student-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Class</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.student_id}>
                    <td>{student.student_id}</td>
                    <td>{student.name}</td>
                    <td>{student.class}</td>
                    <td>
                      <button 
                        className="view-btn"
                        onClick={() => viewStudent(student.student_id)}
                      >
                        <i className="fas fa-eye"></i> View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-results">
                    No students found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherStudents;