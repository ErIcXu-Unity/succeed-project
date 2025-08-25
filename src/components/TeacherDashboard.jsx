import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchFilter from './SearchFilter';
import { useSearchFilter } from './useSearchFilter';
import { useAlert } from './CustomAlert';
import './TeacherDashboard.css';
import config from '../config';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const alert = useAlert();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [studentCount, setStudentCount] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);

  // Get task status
  const getTaskStatus = (task) => {
    const now = new Date();
    const publishAt = task.publish_at ? new Date(task.publish_at) : null;

    if (!publishAt) return 'Published';
    if (publishAt > now) return 'Scheduled';
    return 'Published';
  };

  // Get course type from task name
  const getCourseType = (taskName) => {
    const name = taskName.toLowerCase();
    if (name.includes('chemistry') || name.includes('chem')) return 'Chemistry';
    if (name.includes('mathematics') || name.includes('math')) return 'Mathematics';
    if (name.includes('physics')) return 'Physics';
    if (name.includes('statistics') || name.includes('stat')) return 'Statistics';
    if (name.includes('biology') || name.includes('bio')) return 'Biology';
    return 'General';
  };

  // Get available course types for filter options
  const getAvailableCourseTypes = () => {
    const types = new Set();
    tasks.forEach(task => {
      types.add(getCourseType(task.name));
    });
    return Array.from(types).sort();
  };

  // Search filter configuration
  const searchFilterConfig = {
    searchFields: (task) => [task.name, task.introduction],
    filterConfig: {
      status: {
        label: 'Status',
        filterFn: (task, value) => {
          const taskStatus = getTaskStatus(task);
          return taskStatus.toLowerCase() === value.toLowerCase();
        },
        options: [
          { label: 'Published', value: 'published' },
          { label: 'Scheduled', value: 'scheduled' }
        ],
        allOption: 'All Status'
      },
      questions: {
        label: 'Questions',
        filterFn: (task, value) => {
          if (value === 'empty') return task.question_count === 0;
          if (value === 'few') return task.question_count > 0 && task.question_count <= 2;
          if (value === 'complete') return task.question_count >= 3;
          return true;
        },
        options: [
          { label: 'No Questions (0)', value: 'empty' },
          { label: 'Few Questions (1-2)', value: 'few' },
          { label: 'Complete (3+)', value: 'complete' }
        ],
        allOption: 'All Tasks'
      }
    },
    sortConfig: [
      {
        label: 'Name',
        value: 'name',
        sortFn: (a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      },
      {
        label: 'Question Count',
        value: 'questions',
        sortFn: (a, b) => a.question_count - b.question_count
      },
      {
        label: 'Course Type',
        value: 'course',
        sortFn: (a, b) => getCourseType(a.name).localeCompare(getCourseType(b.name))
      },
      {
        label: 'Status',
        value: 'status',
        sortFn: (a, b) => getTaskStatus(a).localeCompare(getTaskStatus(b))
      },
      {
        label: 'Publish Date',
        value: 'publish_date',
        sortFn: (a, b) => {
          const aDate = a.publish_at ? new Date(a.publish_at) : new Date(0);
          const bDate = b.publish_at ? new Date(b.publish_at) : new Date(0);
          return aDate - bDate;
        }
      }
    ],
    defaultValues: {
      sortBy: 'name',
      sortOrder: 'asc'
    }
  };

  // Use search filter hook
  const {
    searchTerm,
    setSearchTerm,
    sortBy,
    sortOrder,
    setSortBy,
    setSortOrder,
    clearFilters,
    filteredData: filteredTasks,
    filterOptions,
    sortOptions,
    totalCount,
    filteredCount
  } = useSearchFilter(tasks, searchFilterConfig);

  useEffect(() => {
    fetchTasks();
    fetchDashboardStats();
  }, []);

  // Watch for navigation state changes to refresh data
  useEffect(() => {
    if (location.state?.refresh) {
      fetchTasks();
    }
  }, [location.state]);

  // Add effect to refetch tasks when page becomes visible or focused
  // This ensures fresh data when returning from TaskEditor
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchTasks();
      }
    };

    const handleFocus = () => {
      fetchTasks();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchTasks = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user_data'));
      const role = user?.role === 'tea' ? 'tea' : 'stu';
      // Add timestamp to prevent caching issues with task status updates
      const timestamp = new Date().getTime();
      const response = await fetch(`${config.API_BASE_URL}/tasks?role=${role}&_t=${timestamp}`);

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

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/students/dashboard-summary`);
      if (response.ok) {
        const data = await response.json();
        setStudentCount(data.total_students);
        setCompletionRate(data.completion_rate);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
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
      const response = await fetch(`${config.API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Delete successful, refresh task list
        await fetchTasks();
        setDeleteConfirm(null);
        alert.success('Task deleted successfully!');
      } else {
        const errorData = await response.json();
        alert.error(`Failed to delete task: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert.error('Error deleting task. Please try again.');
    } finally {
      setDeleting(false);
    }
  };





  // Get course type corresponding image
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

  // Get course type icon
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

  // Clean description text, remove excessive emojis and formatting
  const getCleanDescription = (introduction) => {
    if (!introduction) return 'No description available';

    // Remove consecutive emojis and special characters, keep only first sentence
    let cleaned = introduction
      .replace(/[🎯🧪⚗️🔬📝📊⚡🧬📚🎮🏃‍♂️🎊🎉]/g, '') // Remove emojis
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Merge multiple spaces
      .trim();

    // Take first sentence or first 100 characters
    const sentences = cleaned.split(/[.!?]/);
    if (sentences[0] && sentences[0].length > 20) {
      return sentences[0].trim() + (sentences.length > 1 ? '...' : '');
    }

    return cleaned.length > 100 ? cleaned.substring(0, 100) + '...' : cleaned;
  };





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
        <div className="summary-cards">
            <div className="stat-card">
              <div className="stat-icon tasks">
                <i className="fas fa-tasks"></i>
              </div>
              <div className="stat-info">
                <h3>{filteredCount}</h3>
                <p>Filtered Tasks</p>
                <span className="stat-detail">of {totalCount} total</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon students">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-info">
                <h3>{studentCount}</h3>  {/* Dynamic display */}
                <p>Active Students</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon completion">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="stat-info">
                <h3>{completionRate}%</h3>  {/* Dynamic display */}
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

        {/* Search and Filter Section */}
        <SearchFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filterOptions}
          sortOptions={sortOptions}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortByChange={setSortBy}
          onSortOrderChange={setSortOrder}
          onClearFilters={clearFilters}
          placeholder="Search tasks by name or description..."
        />

        {/* Tasks Section */}
        <div className="tasks-section">
          <div className="section-header">
            <h2>Task Management</h2>
            <div className="section-actions">
              <span className="task-count">{filteredCount} tasks</span>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="no-results">
              <i className="fas fa-search"></i>
              <h3>No tasks found</h3>
              <p>Try adjusting your search criteria or filters.</p>
              <div className="no-results-actions">
                <button onClick={clearFilters} className="btn btn-secondary">
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