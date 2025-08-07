import React, { useState, useEffect, useRef } from 'react';
import './TeacherReports.css';
import Chart from 'chart.js/auto';
import config from '../config';

const TeacherReports = () => {
  // 状态管理
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState({
    summary: {
      totalStudents: 0,
      totalTasks: 0,
      completionRate: 0,
      averageScore: 0,
      activeStudents: 0,
      totalSubmissions: 0
    },
    taskPerformance: [],
    classPerformance: [],
    weeklyProgress: [],
    difficultyAnalysis: []
  });
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
  const chartInstances = useRef({});

  // 数据获取
  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('${config.API_BASE_URL}/api/students/dashboard-report');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      setReportData({
        summary: {
          totalStudents: data.total_students || 0,
          totalTasks: data.total_tasks || 0,
          completionRate: data.completion_rate || 0,
          averageScore: data.average_score || 0,
          activeStudents: data.active_students || 0,
          totalSubmissions: data.total_submissions || 0
        },
        taskPerformance: data.task_performance || [],
        classPerformance: data.class_performance || [],
        weeklyProgress: data.weekly_progress || [],
        difficultyAnalysis: data.difficulty_analysis || []
      });
    } catch (err) {
      setError(err.message);
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchReportData();
  }, [filters]);

  // 图表渲染与清理
  useEffect(() => {
    if (!reportData) return;

    const renderCharts = () => {
      // 清理旧图表
      Object.values(chartInstances.current).forEach(chart => chart && chart.destroy());

      // 概览图表
      if (activeTab === 'overview' && overviewChartRef.current) {
        chartInstances.current.overview = new Chart(overviewChartRef.current, {
          type: 'doughnut',
          data: {
            labels: ['Completed', 'In Progress', 'Not Started'],
            datasets: [{
              data: [
                reportData.summary.completionRate,
                15.2,
                Math.max(0, 100 - reportData.summary.completionRate - 15.2)
              ],
              backgroundColor: ['#4CAF50', '#FF9800', '#F44336']
            }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        });
      }

      // 性能图表
      if (activeTab === 'performance' && performanceChartRef.current && reportData.taskPerformance.length > 0) {
        chartInstances.current.performance = new Chart(performanceChartRef.current, {
          type: 'bar',
          data: {
            labels: reportData.taskPerformance.map(t => t.name),
            datasets: [
              {
                label: 'Completion Rate (%)',
                data: reportData.taskPerformance.map(t => t.completion),
                backgroundColor: '#2196F3'
              }
            ]
          },
          options: { responsive: true, scales: { y: { beginAtZero: true, max: 100 } } }
        });
      }
    };

    renderCharts();
    return () => Object.values(chartInstances.current).forEach(chart => chart && chart.destroy());
  }, [reportData, activeTab]);

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

  if (error) {
    return (
      <div className="reports-container">
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <p>Error loading reports: {error}</p>
          <button onClick={fetchReportData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-container">
      {/* 头部筛选器 */}
      <div className="reports-header">
        <h1><i className="fas fa-chart-line"></i> Performance Reports</h1>
        <div className="filters">

        </div>
      </div>

      {/* 统计卡片 */}
      <div className="summary-cards">
        <div className="stat-card">
          <div className="stat-icon students">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <h3>{reportData.summary.totalStudents}</h3>
            <p>Total Students</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon tasks">
            <i className="fas fa-tasks"></i>
          </div>
          <div className="stat-content">
            <h3>{reportData.summary.totalTasks}</h3>
            <p>Active Tasks</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon completion">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>{reportData.summary.completionRate}%</h3>
            <p>Completion Rate</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon score">
            <i className="fas fa-trophy"></i>
          </div>
          <div className="stat-content">
            <h3>{reportData.summary.averageScore}%</h3>
            <p>Average Score</p>
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
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
      </div>

      {/* 图表内容 */}
      <div className="chart-content">
        {activeTab === 'overview' && (
          <div className="chart-container">
            <h3>Completion Status</h3>
            <div className="chart-wrapper">
              <canvas ref={overviewChartRef}></canvas>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="chart-container">
            <h3>Task Performance</h3>
            <div className="chart-wrapper">
              <canvas ref={performanceChartRef}></canvas>
            </div>
          </div>
        )}
      </div>

      {/* 表格显示每个任务的完成情况 */}
      <div className="task-completion-table">
        <h3>Task Completion Overview</h3>
        <table className="performance-table">
          <thead>
            <tr>
              <th>Task Name</th>
              <th>Completion Rate</th>
              <th>Average Score</th>
              <th>Attempts</th>
            </tr>
          </thead>
          <tbody>
            {reportData.taskPerformance.map((task, index) => (
              <tr key={index}>
                <td>{task.name}</td>
                <td>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${task.completion}%` }}
                    ></div>
                    <span>{task.completion}%</span>
                  </div>
                </td>
                <td>{task.avgScore}%</td>
                <td>{task.attempts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherReports;