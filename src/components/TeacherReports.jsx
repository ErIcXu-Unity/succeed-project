import React, { useState, useEffect, useRef } from 'react';
import './TeacherReports.css';
import Chart from 'chart.js/auto';

const TeacherReports = () => {
  // 状态管理
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: '30days',
    taskType: 'all',
    class: 'all'
  });
  const [activeTab, setActiveTab] = useState('overview');

  // Chart refs
  const overviewChartRef = useRef(null);
  const performanceChartRef = useRef(null);
  const engagementChartRef = useRef(null);
  const progressChartRef = useRef(null);

  // Chart instances
  const chartInstances = useRef({});

  useEffect(() => {
    fetchReportData();
  }, [filters]);

  useEffect(() => {
    if (reportData) {
      renderCharts();
    }
    return () => {
      // Cleanup charts
      Object.values(chartInstances.current).forEach(chart => {
        if (chart) chart.destroy();
      });
    };
  }, [reportData, activeTab]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual backend endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with real API data
      const mockData = {
        summary: {
          totalStudents: 156,
          totalTasks: 24,
          completionRate: 87.5,
          averageScore: 82.3,
          activeStudents: 142,
          totalSubmissions: 1247
        },
        taskPerformance: [
          { name: 'Chemistry Quiz 1', completion: 92, avgScore: 88.5, attempts: 1234 },
          { name: 'Physics Puzzle', completion: 78, avgScore: 75.2, attempts: 987 },
          { name: 'Math Challenge', completion: 84, avgScore: 81.7, attempts: 1098 },
          { name: 'Biology Lab', completion: 89, avgScore: 86.1, attempts: 1156 }
        ],
        classPerformance: [
          { name: 'Class A (Chemistry)', students: 52, completion: 89.2, avgScore: 84.6 },
          { name: 'Class B (Physics)', students: 48, completion: 85.4, avgScore: 79.8 },
          { name: 'Class C (Biology)', students: 56, completion: 87.9, avgScore: 83.2 }
        ],
        weeklyProgress: [
          { week: 'Week 1', completed: 23, submitted: 31 },
          { week: 'Week 2', completed: 45, submitted: 52 },
          { week: 'Week 3', completed: 67, submitted: 78 },
          { week: 'Week 4', completed: 89, submitted: 95 }
        ],
        difficultyAnalysis: [
          { difficulty: 'Easy', completion: 94.2, avgScore: 91.5 },
          { difficulty: 'Medium', completion: 82.7, avgScore: 78.9 },
          { difficulty: 'Hard', completion: 68.3, avgScore: 65.4 }
        ]
      };
      
      setReportData(mockData);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCharts = () => {
    // Destroy existing charts
    Object.values(chartInstances.current).forEach(chart => {
      if (chart) chart.destroy();
    });

    if (activeTab === 'overview' && overviewChartRef.current) {
      chartInstances.current.overview = new Chart(overviewChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'In Progress', 'Not Started'],
          datasets: [{
            data: [reportData.summary.completionRate, 15.2, 100 - reportData.summary.completionRate - 15.2],
            backgroundColor: ['#4CAF50', '#FF9800', '#F44336'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true
              }
            }
          }
        }
      });
    }

    if (activeTab === 'performance' && performanceChartRef.current) {
      chartInstances.current.performance = new Chart(performanceChartRef.current, {
        type: 'bar',
        data: {
          labels: reportData.taskPerformance.map(task => task.name),
          datasets: [
            {
              label: 'Completion Rate (%)',
              data: reportData.taskPerformance.map(task => task.completion),
              backgroundColor: '#2196F3',
              borderRadius: 4
            },
            {
              label: 'Average Score (%)',
              data: reportData.taskPerformance.map(task => task.avgScore),
              backgroundColor: '#4CAF50',
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100
            }
          },
          plugins: {
            legend: {
              position: 'top'
            }
          }
        }
      });
    }

    if (activeTab === 'engagement' && engagementChartRef.current) {
      chartInstances.current.engagement = new Chart(engagementChartRef.current, {
        type: 'line',
        data: {
          labels: reportData.weeklyProgress.map(week => week.week),
          datasets: [
            {
              label: 'Tasks Completed',
              data: reportData.weeklyProgress.map(week => week.completed),
              borderColor: '#4CAF50',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              fill: true,
              tension: 0.4
            },
            {
              label: 'Tasks Submitted',
              data: reportData.weeklyProgress.map(week => week.submitted),
              borderColor: '#2196F3',
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              fill: true,
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          },
          plugins: {
            legend: {
              position: 'top'
            }
          }
        }
      });
    }

    if (activeTab === 'progress' && progressChartRef.current) {
      chartInstances.current.progress = new Chart(progressChartRef.current, {
        type: 'radar',
        data: {
          labels: reportData.difficultyAnalysis.map(item => item.difficulty),
          datasets: [
            {
              label: 'Completion Rate (%)',
              data: reportData.difficultyAnalysis.map(item => item.completion),
              borderColor: '#FF9800',
              backgroundColor: 'rgba(255, 152, 0, 0.2)',
              pointBackgroundColor: '#FF9800'
            },
            {
              label: 'Average Score (%)',
              data: reportData.difficultyAnalysis.map(item => item.avgScore),
              borderColor: '#9C27B0',
              backgroundColor: 'rgba(156, 39, 176, 0.2)',
              pointBackgroundColor: '#9C27B0'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              beginAtZero: true,
              max: 100
            }
          }
        }
      });
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const exportData = (format) => {
    if (format === 'csv') {
      exportCSV();
    } else if (format === 'pdf') {
      exportPDF();
    }
  };

  const exportCSV = () => {
    if (!reportData) return;
    
    const rows = [
      ['Metric', 'Value'],
      ['Total Students', reportData.summary.totalStudents],
      ['Total Tasks', reportData.summary.totalTasks],
      ['Completion Rate (%)', reportData.summary.completionRate],
      ['Average Score (%)', reportData.summary.averageScore],
      ['Active Students', reportData.summary.activeStudents],
      ['Total Submissions', reportData.summary.totalSubmissions],
      [''],
      ['Task Performance', ''],
      ['Task Name', 'Completion (%)', 'Avg Score (%)', 'Attempts'],
      ...reportData.taskPerformance.map(task => [task.name, task.completion, task.avgScore, task.attempts])
    ];
    
    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `teacher_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    // Implement PDF export using jsPDF or similar library
    alert('PDF export feature coming soon!');
  };

  if (loading) {
    return (
      <div className="reports-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-container">
      {/* Header with filters */}
      <div className="reports-header">
        <div className="header-content">
          <h1><i className="fas fa-chart-line"></i> Performance Reports</h1>
          <div className="header-actions">
            <div className="filters">
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="filter-select"
              >
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="3months">Last 3 months</option>
                <option value="semester">This semester</option>
              </select>
              
              <select
                value={filters.taskType}
                onChange={(e) => handleFilterChange('taskType', e.target.value)}
                className="filter-select"
              >
                <option value="all">All Tasks</option>
                <option value="quiz">Quizzes</option>
                <option value="puzzle">Puzzles</option>
                <option value="matching">Matching</option>
              </select>
              
              <select
                value={filters.class}
                onChange={(e) => handleFilterChange('class', e.target.value)}
                className="filter-select"
              >
                <option value="all">All Classes</option>
                <option value="classA">Class A</option>
                <option value="classB">Class B</option>
                <option value="classC">Class C</option>
              </select>
            </div>
            
            <div className="export-buttons">
              <button onClick={() => exportData('csv')} className="export-btn csv">
                <i className="fas fa-file-csv"></i> Export CSV
              </button>
              <button onClick={() => exportData('pdf')} className="export-btn pdf">
                <i className="fas fa-file-pdf"></i> Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="summary-cards">
        <div className="stat-card">
          <div className="stat-icon students">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <h3>{reportData.summary.totalStudents}</h3>
            <p>Total Students</p>
            <span className="stat-change positive">+12 this month</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon tasks">
            <i className="fas fa-tasks"></i>
          </div>
          <div className="stat-content">
            <h3>{reportData.summary.totalTasks}</h3>
            <p>Active Tasks</p>
            <span className="stat-change positive">+3 this week</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon completion">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>{reportData.summary.completionRate}%</h3>
            <p>Completion Rate</p>
            <span className="stat-change positive">+5.2% vs last month</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon score">
            <i className="fas fa-trophy"></i>
          </div>
          <div className="stat-content">
            <h3>{reportData.summary.averageScore}%</h3>
            <p>Average Score</p>
            <span className="stat-change positive">+2.1% vs last month</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="report-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-chart-pie"></i> Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          <i className="fas fa-chart-bar"></i> Task Performance
        </button>
        <button
          className={`tab-btn ${activeTab === 'engagement' ? 'active' : ''}`}
          onClick={() => setActiveTab('engagement')}
        >
          <i className="fas fa-chart-line"></i> Engagement
        </button>
        <button
          className={`tab-btn ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          <i className="fas fa-chart-area"></i> Progress Analysis
        </button>
      </div>

      {/* Chart Content */}
      <div className="chart-content">
        {activeTab === 'overview' && (
          <div className="chart-section">
            <div className="overview-layout">
              <div className="chart-container overview-chart">
                <h3>Overall Completion Status</h3>
                <div className="chart-with-status">
                  <div className="chart-wrapper">
                    <canvas ref={overviewChartRef}></canvas>
                  </div>
                  <div className="status-summary">
                    <h4>Class Performance Status</h4>
                    <div className="status-badges-list">
                      {reportData.classPerformance.map((classData, index) => (
                        <div key={index} className="class-status-item">
                          <span className="class-name">{classData.name}</span>
                          <span className={`status-badge ${classData.completion > 85 ? 'excellent' : classData.completion > 70 ? 'good' : 'needs-improvement'}`}>
                            {classData.completion > 85 ? 'Excellent' : classData.completion > 70 ? 'Good' : 'Needs Improvement'}
                          </span>
                          <span className="completion-rate">{classData.completion}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="class-performance-table">
                <h3>Detailed Performance Metrics</h3>
                <table className="performance-table">
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Students</th>
                      <th>Completion Rate</th>
                      <th>Average Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.classPerformance.map((classData, index) => (
                      <tr key={index}>
                        <td>{classData.name}</td>
                        <td>{classData.students}</td>
                        <td>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${classData.completion}%` }}
                            ></div>
                            <span>{classData.completion}%</span>
                          </div>
                        </td>
                        <td>{classData.avgScore}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="chart-section">
            <div className="chart-container">
              <h3>Task Performance Comparison</h3>
              <div className="chart-wrapper">
                <canvas ref={performanceChartRef}></canvas>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'engagement' && (
          <div className="chart-section">
            <div className="chart-container">
              <h3>Student Engagement Over Time</h3>
              <div className="chart-wrapper">
                <canvas ref={engagementChartRef}></canvas>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="chart-section">
            <div className="chart-container">
              <h3>Performance by Difficulty Level</h3>
              <div className="chart-wrapper">
                <canvas ref={progressChartRef}></canvas>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherReports;