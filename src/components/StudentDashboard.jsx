// src/components/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SearchFilter from './SearchFilter';
import { useSearchFilter } from './useSearchFilter';
import './StudentDashboard.css';

function StudentDashboard() {
  const [tasks, setTasks] = useState([]);
  const [taskProgress, setTaskProgress] = useState({});
  const [loading, setLoading] = useState(true);

  // 从API获取真实任务数据
  useEffect(() => {
    fetchTasks();
    fetchTaskProgress();
  }, []);

  const fetchTasks = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user_data'));
      const role = user?.role === 'tea' ? 'tea' : 'stu';
      // Add timestamp to prevent caching issues with task status updates
      const timestamp = new Date().getTime();
      const response = await fetch(`http://localhost:5001/api/tasks?role=${role}&_t=${timestamp}`);
      
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

  const fetchTaskProgress = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user_data'));
      if (user?.user_id) {
        const response = await fetch(`http://localhost:5001/api/students/${user.user_id}/task-progress`);
        if (response.ok) {
          const data = await response.json();
          setTaskProgress(data);
        } else {
          console.error('Failed to fetch task progress');
        }
      }
    } catch (error) {
      console.error('Error fetching task progress:', error);
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
    tasks.forEach(task => {
      types.add(getCourseType(task.name));
    });
    return Array.from(types).sort();
  };

  // 配置搜索筛选
  const searchFilterConfig = {
    searchFields: (task) => [task.name, task.introduction],
    filterConfig: {
      courseType: {
        label: 'Course Type',
        filterFn: (task, value) => getCourseType(task.name) === value,
        options: getAvailableCourseTypes().map(type => ({ label: type, value: type })),
        allOption: 'All Courses'
      },
      status: {
        label: 'Status',
        filterFn: (task, value) => {
          const hasProgress = taskProgress[task.id]?.has_progress;
          if (value === 'completed') return hasProgress;
          if (value === 'not_started') return !hasProgress;
          return true;
        },
        options: [
          { label: 'Not Started', value: 'not_started' },
          { label: 'In Progress', value: 'completed' }
        ],
        allOption: 'All Status'
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
      }
    ],
    defaultValues: {
      sortBy: 'name',
      sortOrder: 'asc'
    }
  };

  // 使用通用搜索筛选Hook
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
    <div className="student-dashboard-content">
      {/* Header Section */}
      <div className="section-header">
        <div className="header-info">
          <h2>
            <i className="fas fa-tasks"></i>
            Available Tasks
          </h2>
          <div className="task-stats">
            <div className="stat-item">
              <span className="stat-number">{filteredCount}</span>
              <span className="stat-label">of {totalCount} tasks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
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

      {/* Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <div className="no-results">
          <i className="fas fa-search"></i>
          <h3>No tasks found</h3>
          <p>Try adjusting your search criteria or filters to find tasks.</p>
          <button onClick={clearFilters} className="btn btn-primary">
            <i className="fas fa-refresh"></i>
            Show All Tasks
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {filteredTasks.map(task => {
            const courseType = getCourseType(task.name);
            const hasProgress = taskProgress[task.id]?.has_progress;

            return (
              <div key={task.id} className="task-card">
                <div className="task-card-header">
                  <img 
                    src={`/assets/task${((task.id - 1) % 4) + 1}.jpg`} 
                    alt={task.name}
                    onError={(e) => { 
                      e.target.src = '/assets/task1.jpg'; 
                    }}
                  />
                  <div className="course-badge">
                    {courseType}
                  </div>
                </div>
                
                <div className="info">
                  <h3>{task.name}</h3>
                  <p>
                    {task.introduction ? 
                      (task.introduction.length > 80 ? 
                        `${task.introduction.substring(0, 80)}...` : 
                        task.introduction
                      ) : 
                      'No description available'
                    }
                  </p>
                  
                  <div className="task-meta">
                    <span className="question-count">
                      <i className="fas fa-question-circle"></i>
                      {task.question_count} questions
                    </span>
                    {hasProgress && (
                      <span className="progress-indicator">
                        <i className="fas fa-play-circle"></i>
                        In Progress
                      </span>
                    )}
                  </div>
                  
                  <Link to={`/student/tasks/${task.id}/intro`} className="btn btn-primary">
                    {hasProgress ? (
                      <>
                        <i className="fas fa-play"></i>
                        Continue Task
                      </>
                    ) : (
                      <>
                        <i className="fas fa-rocket"></i>
                        Start Task
                      </>
                    )}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;
