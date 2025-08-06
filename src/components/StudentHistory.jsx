// src/components/StudentHistory.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './StudentHistory.css';

function StudentHistory() {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentName, setStudentName] = useState('');

  // 搜索筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [scoreRangeFilter, setScoreRangeFilter] = useState('');
  const [sortBy, setSortBy] = useState('completed_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchStudentHistory();
  }, []);

  const fetchStudentHistory = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user_data'));
      console.log('User data from localStorage:', user);
      
      if (!user?.user_id) {
        setError('User not logged in');
        setLoading(false);
        return;
      }

      console.log('Fetching history for user:', user.user_id);

      const response = await fetch(`http://localhost:5001/api/students/${user.user_id}/history`);
      console.log('History response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('History data received:', data);
        setHistoryData(data.history);
        setStudentName(data.student_name);
      } else {
        const errorText = await response.text();
        console.error('History fetch error:', errorText);
        throw new Error(`Failed to fetch history: ${response.status}`);
      }

    } catch (error) {
      console.error('Error fetching student history:', error);
      setError(`Unable to load history: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 格式化日期显示
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // 格式化时间显示
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 根据得分百分比获取颜色
  const getScoreColor = (percentage) => {
    if (percentage >= 90) return '#28a745';
    if (percentage >= 80) return '#17a2b8';
    if (percentage >= 70) return '#ffc107';
    if (percentage >= 60) return '#fd7e14';
    return '#dc3545';
  };

  // 根据课程类型获取图标
  const getCourseIcon = (courseType) => {
    switch (courseType) {
      case 'Chemistry':
        return '🧪';
      case 'Mathematics':
        return '🔢';
      case 'Physics':
        return '⚡';
      case 'Statistics':
        return '📊';
      default:
        return '📚';
    }
  };

  // 根据课程类型获取背景图片
  const getCourseImage = (courseType) => {
    switch (courseType) {
      case 'Chemistry':
        return '/assets/course-chem.jpg';
      case 'Mathematics':
        return '/assets/course-math.jpg';
      case 'Physics':
        return '/assets/course-physics.jpg';
      case 'Statistics':
        return '/assets/course-stat.jpg';
      default:
        return '/assets/course-general.jpg';
    }
  };

  // 从任务名称推导课程类型
  const getCourseType = (taskName) => {
    const name = taskName.toLowerCase();
    if (name.includes('chemistry') || name.includes('chem')) return 'Chemistry';
    if (name.includes('mathematics') || name.includes('math')) return 'Mathematics';
    if (name.includes('physics')) return 'Physics';
    if (name.includes('statistics') || name.includes('stat')) return 'Statistics';
    if (name.includes('biology') || name.includes('bio')) return 'Biology';
    return 'General';
  };

  // 获取可用的课程类型
  const getAvailableCourseTypes = () => {
    const types = new Set();
    historyData.forEach(item => {
      const courseType = item.course_type || getCourseType(item.task_name);
      types.add(courseType);
    });
    return Array.from(types).sort();
  };

  // 筛选和排序逻辑
  const getFilteredAndSortedHistory = () => {
    let filteredHistory = historyData.filter(item => {
      // 关键词搜索
      const matchesSearch = item.task_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 课程类型筛选
      const courseType = item.course_type || getCourseType(item.task_name);
      const matchesCourse = !courseFilter || courseType === courseFilter;
      
      // 分数范围筛选
      let matchesScoreRange = true;
      if (scoreRangeFilter === 'excellent') {
        matchesScoreRange = item.score_percentage >= 90;
      } else if (scoreRangeFilter === 'good') {
        matchesScoreRange = item.score_percentage >= 80 && item.score_percentage < 90;
      } else if (scoreRangeFilter === 'average') {
        matchesScoreRange = item.score_percentage >= 60 && item.score_percentage < 80;
      } else if (scoreRangeFilter === 'poor') {
        matchesScoreRange = item.score_percentage < 60;
      }
      
      return matchesSearch && matchesCourse && matchesScoreRange;
    });

    // 排序
    filteredHistory.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'task_name':
          aValue = a.task_name.toLowerCase();
          bValue = b.task_name.toLowerCase();
          break;
        case 'score_percentage':
          aValue = a.score_percentage;
          bValue = b.score_percentage;
          break;
        case 'completed_at':
          aValue = new Date(a.completed_at);
          bValue = new Date(b.completed_at);
          break;
        case 'course_type':
          aValue = a.course_type || getCourseType(a.task_name);
          bValue = b.course_type || getCourseType(b.task_name);
          break;
        case 'question_count':
          aValue = a.question_count;
          bValue = b.question_count;
          break;
        default:
          aValue = new Date(a.completed_at);
          bValue = new Date(b.completed_at);
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filteredHistory;
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setCourseFilter('');
    setScoreRangeFilter('');
    setSortBy('completed_at');
    setSortOrder('desc');
  };



  const filteredHistory = getFilteredAndSortedHistory();
  const availableCourseTypes = getAvailableCourseTypes();

  if (loading) {
    return (
      <div className="student-history-content">
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i>
          Loading your learning history...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-history-content">
        <div className="error">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={fetchStudentHistory} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-history-content">
      <div className="history-header">
        <h2>🎓 Learning History</h2>
        <p>View all completed escape room tasks</p>
        {studentName && (
          <div className="student-info">
            <span>Student: {studentName}</span>
            <span>Completed Tasks: {filteredHistory.length} of {historyData.length}</span>
          </div>
        )}
      </div>

      {historyData.length === 0 ? (
        <div className="empty-history">
          <i className="fas fa-clipboard-list"></i>
          <h3>No tasks completed yet</h3>
          <p>Complete your first escape room task to start your learning journey!</p>
          <Link to="/student/home" className="btn btn-primary">
            Start Tasks
          </Link>
        </div>
      ) : (
        <>
          {/* 搜索筛选区域 */}
          <div className="search-filter-section">
            <div className="search-bar">
              <div className="search-input-group">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search completed tasks by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button 
                    className="clear-search"
                    onClick={() => setSearchTerm('')}
                    title="Clear search"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="filter-controls">
              <div className="filter-group">
                <label htmlFor="courseFilter">Course Type:</label>
                <select
                  id="courseFilter"
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Courses</option>
                  {availableCourseTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="scoreRangeFilter">Performance:</label>
                <select
                  id="scoreRangeFilter"
                  value={scoreRangeFilter}
                  onChange={(e) => setScoreRangeFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Scores</option>
                  <option value="excellent">Excellent (90%+)</option>
                  <option value="good">Good (80-89%)</option>
                  <option value="average">Average (60-79%)</option>
                  <option value="poor">Needs Improvement (&lt;60%)</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="sortBy">Sort by:</label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-select"
                >
                  <option value="completed_at">Completion Date</option>
                  <option value="task_name">Task Name</option>
                  <option value="score_percentage">Score</option>
                  <option value="course_type">Course Type</option>
                  <option value="question_count">Question Count</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="sortOrder">Order:</label>
                <select
                  id="sortOrder"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="filter-select"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>

              <button 
                className="clear-filters-btn"
                onClick={handleClearFilters}
                title="Clear all filters"
              >
                <i className="fas fa-eraser"></i>
                Clear
              </button>
            </div>
          </div>

          {/* 历史记录网格 */}
          {filteredHistory.length === 0 ? (
            <div className="no-results">
              <i className="fas fa-search"></i>
              <h3>No results found</h3>
              <p>Try adjusting your search criteria or filters.</p>
              <button onClick={handleClearFilters} className="btn btn-primary">
                <i className="fas fa-refresh"></i>
                Show All History
              </button>
            </div>
          ) : (
            <div className="history-grid">
              {filteredHistory.map((item, index) => {
                const scoreColor = getScoreColor(item.score_percentage);
                const courseType = item.course_type || getCourseType(item.task_name);
                
                return (
                  <div key={item.id} className="history-card">
                    <div className="history-card-header">
                      <img 
                        src={getCourseImage(courseType)} 
                        alt={item.task_name}
                        onError={(e) => { e.target.src = '/assets/course-general.jpg'; }}
                      />
                      <div className="course-badge">
                        {getCourseIcon(courseType)} {courseType}
                      </div>
                      <div className="rank-badge">
                        #{filteredHistory.length - index}
                      </div>
                    </div>
                    
                    <div className="history-info">
                      <h3>{item.task_name}</h3>
                      
                      <div className="score-section">
                        <div className="score-display">
                          <span className="score-number" style={{ color: scoreColor }}>
                            {item.score_percentage}%
                          </span>
                        </div>
                        <div className="score-details">
                          Score: {item.score}/{item.max_score} points
                        </div>
                      </div>

                      <div className="task-stats">
                        <div className="stat-item">
                          <i className="fas fa-question-circle"></i>
                          <span>{item.question_count} Questions</span>
                        </div>
                        <div className="stat-item">
                          <i className="fas fa-calendar"></i>
                          <span>{formatDate(item.completed_at)}</span>
                        </div>
                        <div className="stat-item">
                          <i className="fas fa-clock"></i>
                          <span>{formatTime(item.completed_at)}</span>
                        </div>
                      </div>

                      <div className="history-actions">
                        <Link 
                          to={`/student/tasks/${item.task_id}/intro`} 
                          className="btn btn-secondary"
                        >
                          <i className="fas fa-redo"></i>
                          Retry Task
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default StudentHistory;
