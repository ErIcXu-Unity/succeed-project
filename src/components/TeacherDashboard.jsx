import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // 搜索筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [questionFilter, setQuestionFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user_data'));
      const role = user?.role === 'tea' ? 'tea' : 'stu';
      const response = await fetch(`http://localhost:5001/api/tasks?role=${role}`);
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        console.error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = () => {
    navigate('/teacher/tasks/new');
  };

  const handleEditTask = (taskId) => {
    navigate(`/teacher/tasks/${taskId}/edit`);
  };

  const handleDeleteTask = async (taskId) => {
    setDeleting(true);
    try {
      const response = await fetch(`http://localhost:5001/api/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // 删除成功，重新获取任务列表
        await fetchTasks();
        setDeleteConfirm(null);
        alert('Task deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to delete task: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error deleting task. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleGradeTask = (taskId) => {
    // 这里可以导航到成绩页面
    alert(`Grading feature for task ${taskId} - Coming soon!`);
  };

  // 获取任务状态
  const getTaskStatus = (task) => {
    const now = new Date();
    const publishAt = task.publish_at ? new Date(task.publish_at) : null;
    
    if (!publishAt) return 'Published';
    if (publishAt > now) return 'Scheduled';
    return 'Published';
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

  // 获取课程类型对应的图片
  const getCourseImage = (courseType) => {
    const imageMap = {
      'Chemistry': '/assets/course-chem.jpg',
      'Mathematics': '/assets/course-math.jpg',
      'Physics': '/assets/course-physics.jpg',
      'Statistics': '/assets/course-stat.jpg',
      'Biology': '/assets/course-bio.jpg',
      'General': '/assets/task1.jpg'
    };
    return imageMap[courseType] || '/assets/task1.jpg';
  };

  // 获取课程类型图标
  const getCourseIcon = (courseType) => {
    const iconMap = {
      'Chemistry': '🧪',
      'Mathematics': '📐',
      'Physics': '⚡',
      'Statistics': '📊',
      'Biology': '🧬',
      'General': '📚'
    };
    return iconMap[courseType] || '📚';
  };

  // 清理描述文字，移除过多的emoji和格式化
  const getCleanDescription = (introduction) => {
    if (!introduction) return 'No description available';
    
    // 移除连续的emoji和特殊字符，只保留第一句话
    let cleaned = introduction
      .replace(/[🎯🧪⚗️🔬📝📊⚡🧬📚🎮🏃‍♂️🎊🎉]/g, '') // 移除emoji
      .replace(/\n+/g, ' ') // 将换行替换为空格
      .replace(/\s+/g, ' ') // 合并多个空格
      .trim();
    
    // 取第一句话或前100个字符
    const sentences = cleaned.split(/[.!?]/);
    if (sentences[0] && sentences[0].length > 20) {
      return sentences[0].trim() + (sentences.length > 1 ? '...' : '');
    }
    
    return cleaned.length > 100 ? cleaned.substring(0, 100) + '...' : cleaned;
  };

  // 筛选和排序逻辑
  const getFilteredAndSortedTasks = () => {
    let filteredTasks = tasks.filter(task => {
      // 关键词搜索
      const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (task.introduction && task.introduction.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // 状态筛选
      const taskStatus = getTaskStatus(task);
      const matchesStatus = !statusFilter || taskStatus.toLowerCase() === statusFilter.toLowerCase();
      
      // 问题数量筛选
      let matchesQuestions = true;
      if (questionFilter === 'empty') {
        matchesQuestions = task.question_count === 0;
      } else if (questionFilter === 'few') {
        matchesQuestions = task.question_count > 0 && task.question_count <= 2;
      } else if (questionFilter === 'complete') {
        matchesQuestions = task.question_count >= 3;
      }
      
      return matchesSearch && matchesStatus && matchesQuestions;
    });

    // 排序
    filteredTasks.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'questions':
          aValue = a.question_count;
          bValue = b.question_count;
          break;
        case 'course':
          aValue = getCourseType(a.name);
          bValue = getCourseType(b.name);
          break;
        case 'status':
          aValue = getTaskStatus(a);
          bValue = getTaskStatus(b);
          break;
        case 'publish_date':
          aValue = a.publish_at ? new Date(a.publish_at) : new Date(0);
          bValue = b.publish_at ? new Date(b.publish_at) : new Date(0);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filteredTasks;
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setQuestionFilter('');
    setSortBy('name');
    setSortOrder('asc');
  };

  const filteredTasks = getFilteredAndSortedTasks();

  if (loading) {
    return (
      <div className="main-content">
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i>
          Loading tasks...
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            <i className="fas fa-chalkboard-teacher"></i>
            Teacher Dashboard
          </h1>
          <button className="create-task-btn" onClick={handleCreateTask}>
            <i className="fas fa-plus"></i>
            Create New Task
          </button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {/* Statistics Cards */}
        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon tasks">
                <i className="fas fa-tasks"></i>
              </div>
              <div className="stat-info">
                <h3>{filteredTasks.length}</h3>
                <p>Filtered Tasks</p>
                <span className="stat-detail">of {tasks.length} total</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon students">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-info">
                <h3>24</h3>
                <p>Active Students</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon completion">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="stat-info">
                <h3>78%</h3>
                <p>Completion Rate</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon published">
                <i className="fas fa-eye"></i>
              </div>
              <div className="stat-info">
                <h3>{tasks.filter(task => getTaskStatus(task) === 'Published').length}</h3>
                <p>Published Tasks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="search-filter-section">
          <div className="search-bar">
            <div className="search-input-group">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search tasks by name or description..."
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
              <label htmlFor="statusFilter">Status:</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="questionFilter">Questions:</label>
              <select
                id="questionFilter"
                value={questionFilter}
                onChange={(e) => setQuestionFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Tasks</option>
                <option value="empty">No Questions (0)</option>
                <option value="few">Few Questions (1-2)</option>
                <option value="complete">Complete (3+)</option>
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
                <option value="name">Name</option>
                <option value="questions">Question Count</option>
                <option value="course">Course Type</option>
                <option value="status">Status</option>
                <option value="publish_date">Publish Date</option>
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
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
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

        {/* Tasks Section */}
        <div className="tasks-section">
          <div className="section-header">
            <h2>Task Management</h2>
            <div className="section-actions">
              <span className="task-count">{filteredTasks.length} tasks</span>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="no-results">
              <i className="fas fa-search"></i>
              <h3>No tasks found</h3>
              <p>Try adjusting your search criteria or filters.</p>
              <div className="no-results-actions">
                <button onClick={handleClearFilters} className="btn btn-secondary">
                  <i className="fas fa-refresh"></i>
                  Show All Tasks
                </button>
                <button onClick={handleCreateTask} className="btn btn-primary">
                  <i className="fas fa-plus"></i>
                  Create New Task
                </button>
              </div>
            </div>
          ) : (
            <div className="tasks-grid">
              {filteredTasks.map(task => {
                const taskStatus = getTaskStatus(task);
                const courseType = getCourseType(task.name);
                const courseImage = task.image_url || getCourseImage(courseType);
                const courseIcon = getCourseIcon(courseType);
                const cleanDescription = getCleanDescription(task.introduction);

                return (
                  <div key={task.id} className="task-card">
                    <div className="task-card-image">
                      <img 
                        src={courseImage} 
                        alt={task.name}
                        onError={(e) => { 
                          e.target.src = '/assets/task1.jpg'; 
                        }}
                      />
                      <div className="task-card-overlay">
                        <div className="task-badges">
                          <span className="course-badge">
                            <div className="course-info">
                              <span className="course-icon">{courseIcon}</span>
                              {courseType}
                            </div>
                            <span className={`internal-status ${taskStatus.toLowerCase()}`}>
                              <i className={`fas ${taskStatus === 'Published' ? 'fa-eye' : 'fa-clock'}`}></i>
                              {taskStatus}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="task-card-content">
                      <div className="task-header">
                        <h3 className="task-title">{task.name}</h3>
                        <div className="task-meta">
                          <span className="question-indicator">
                            <i className="fas fa-question-circle"></i>
                            <span className="question-count">{task.question_count}</span>
                            <span className="question-label">questions</span>
                          </span>
                        </div>
                      </div>
                      
                      <p className="task-description">{cleanDescription}</p>
                      
                      <div className="task-stats">
                        {task.publish_at && (
                          <div className="stat-item">
                            <i className="fas fa-calendar-alt"></i>
                            <span>{new Date(task.publish_at).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="stat-item">
                          <i className="fas fa-clock"></i>
                          <span>Created recently</span>
                        </div>
                      </div>

                      <div className="task-actions">
                        <button 
                          className="btn btn-edit"
                          onClick={() => handleEditTask(task.id)}
                          title="Edit task"
                        >
                          <i className="fas fa-edit"></i>
                          Edit
                        </button>
                        <button 
                          className="btn btn-grade"
                          onClick={() => handleGradeTask(task.id)}
                          title="View grades"
                        >
                          <i className="fas fa-chart-bar"></i>
                          Grades
                        </button>
                        <button 
                          className="btn btn-delete"
                          onClick={() => setDeleteConfirm(task.id)}
                          title="Delete task"
                        >
                          <i className="fas fa-trash-alt"></i>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this task? This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => handleDeleteTask(deleteConfirm)}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash"></i>
                    Delete Task
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard; 