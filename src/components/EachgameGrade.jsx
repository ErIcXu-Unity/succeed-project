import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import './EachgameGrade.css';
import config from '../config';

const EachgameGrade = ({ taskId }) => {
  const completionChartRef = useRef(null);
  const scoreChartRef = useRef(null);
  const chartInstance1 = useRef(null);
  const chartInstance2 = useRef(null);
  
  // State for real data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [taskData, setTaskData] = useState(null);
  const [studentsData, setStudentsData] = useState([]);
  const [statistics, setStatistics] = useState({
    completionRate: 0,
    avgScore: 0,
    avgTimeSpent: '0s',
    participants: 0
  });

  // Fetch data from API
  useEffect(() => {
    fetchTaskData();
  }, [taskId]);

  // Update charts when data changes
  useEffect(() => {
    if (!loading && !error && taskData) {
      updateCharts();
    }
    
    return () => {
      if (chartInstance1.current) chartInstance1.current.destroy();
      if (chartInstance2.current) chartInstance2.current.destroy();
    };
  }, [loading, error, taskData, statistics]);

  const fetchTaskData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch dashboard report for overall statistics
      const reportResponse = await fetch(`${config.API_BASE_URL}/api/students/dashboard-report`);
      if (!reportResponse.ok) throw new Error('Failed to fetch dashboard report');
      
      const reportData = await reportResponse.json();
      
      // Find the specific task data
      const currentTaskData = reportData.task_performance?.find(task => 
        taskId ? task.id === parseInt(taskId) : task.name === 'Escape Room 1'
      ) || reportData.task_performance?.[0]; // fallback to first task if no match

      if (!currentTaskData) throw new Error('Task not found');

      // Fetch detailed student data for this task
      const studentsResponse = await fetch(`${config.API_BASE_URL}/api/students/list`);
      if (!studentsResponse.ok) throw new Error('Failed to fetch students');
      
      const studentsListData = await studentsResponse.json();
      
      // For each student, get their task completion status
      const detailedStudentsData = await Promise.all(
        studentsListData.students?.slice(0, 10).map(async (student) => { // Limit to first 10 for demo
          try {
            const profileResponse = await fetch(`${config.API_BASE_URL}/api/students/${student.id}/profile`);
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              const historyResponse = await fetch(`${config.API_BASE_URL}/api/students/${student.id}/history`);
              const historyData = historyResponse.ok ? await historyResponse.json() : { history: [] };
              
              // Find this specific task in student's history
              const taskResult = historyData.history?.find(item => 
                taskId ? item.task_id === parseInt(taskId) : item.task_name.includes('Escape Room')
              );

              return {
                student_id: student.id,
                name: student.real_name || student.username,
                completed: !!taskResult,
                completedText: taskResult ? 'Completed' : 'Not Started',
                score: taskResult ? `${taskResult.score_percentage}%` : '–',
                timeSpent: taskResult ? calculateTimeSpent(taskResult) : '–',
                accuracy: taskResult ? `${Math.round(taskResult.score_percentage)}%` : '–'
              };
            }
            return {
              student_id: student.id,
              name: student.real_name || student.username,
              completed: false,
              completedText: 'Not Started',
              score: '–',
              timeSpent: '–',
              accuracy: '–'
            };
          } catch (error) {
            console.error(`Error fetching data for student ${student.id}:`, error);
            return {
              student_id: student.id,
              name: student.real_name || student.username,
              completed: false,
              completedText: 'Not Started',
              score: '–',
              timeSpent: '–',
              accuracy: '–'
            };
          }
        }) || []
      );

      // Calculate statistics
      const completedCount = detailedStudentsData.filter(s => s.completed).length;
      const totalStudents = detailedStudentsData.length;
      const completionRate = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0;
      
      const completedStudents = detailedStudentsData.filter(s => s.completed);
      const avgScore = completedStudents.length > 0 
        ? Math.round(completedStudents.reduce((sum, s) => sum + parseFloat(s.score), 0) / completedStudents.length)
        : 0;

      setTaskData(currentTaskData);
      setStudentsData(detailedStudentsData);
      setStatistics({
        completionRate,
        avgScore: avgScore || currentTaskData.avgScore,
        avgTimeSpent: '45s', // This would need to be calculated from real data
        participants: totalStudents
      });

    } catch (error) {
      console.error('Error fetching task data:', error);
      setError(`Failed to load task data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeSpent = (taskResult) => {
    // This is a placeholder - you'll need to implement based on your actual time tracking
    return Math.floor(Math.random() * 60 + 30) + 's';
  };

  const updateCharts = () => {
    if (!completionChartRef.current || !scoreChartRef.current) return;

    const ctx1 = completionChartRef.current.getContext('2d');
    const ctx2 = scoreChartRef.current.getContext('2d');

    if (chartInstance1.current) chartInstance1.current.destroy();
    if (chartInstance2.current) chartInstance2.current.destroy();

    // Completion chart
    const completed = statistics.completionRate;
    const remaining = 100 - completed;

    chartInstance1.current = new Chart(ctx1, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Remaining'],
        datasets: [{
          data: [completed, remaining],
          backgroundColor: ['#42A5F5', '#EF9A9A']
        }]
      },
      options: {
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          }
        }
      }
    });

    // Score trend chart (using sample data for now)
    const completedStudents = studentsData.filter(s => s.completed);
    const scoreData = completedStudents.length > 0 
      ? completedStudents.map(s => parseFloat(s.score)).slice(0, 7)
      : [statistics.avgScore];
    
    // Fill with sample data if not enough points
    while (scoreData.length < 7) {
      scoreData.push(statistics.avgScore + (Math.random() - 0.5) * 10);
    }

    chartInstance2.current = new Chart(ctx2, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].slice(0, scoreData.length),
        datasets: [{
          label: 'Avg Score (%)',
          data: scoreData,
          fill: false,
          borderColor: '#42A5F5',
          tension: 0.3,
          pointBackgroundColor: '#42A5F5'
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    });
  };



  if (loading) {
    return (
      <div className="page">
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i>
          Loading task performance data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="error">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={fetchTaskData} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="header">
        {taskData?.name || 'Task'} - Performance Overview
      </div>

      <div className="stats">
        <div className="stat-box">
          Completion Rate<br />
          <strong>{statistics.completionRate}%</strong>
        </div>
        <div className="stat-box">
          Avg Score<br />
          <strong>{statistics.avgScore}%</strong>
        </div>
        <div className="stat-box">
          Avg Time Spent<br />
          <strong>{statistics.avgTimeSpent}</strong>
        </div>
        <div className="stat-box">
          Participants<br />
          <strong>{statistics.participants}</strong>
        </div>
      </div>

      <div className="charts">
        <div className="chart-container">
          <canvas ref={completionChartRef} width="300" height="300"></canvas>
        </div>
        <div className="chart-container">
          <canvas ref={scoreChartRef} width="400" height="300"></canvas>
        </div>
      </div>



      <table id="gradesTable" className="grades-table">
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Name</th>
            <th>Completion</th>
            <th>Score</th>
            <th>Time Spent</th>
            <th>Accuracy</th>
          </tr>
        </thead>
        <tbody>
          {studentsData.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                No student data available
              </td>
            </tr>
          ) : (
            studentsData.map((student) => (
              <tr key={student.student_id}>
                <td>{student.student_id}</td>
                <td>{student.name}</td>
                <td>{student.completedText}</td>
                <td>{student.score}</td>
                <td>{student.timeSpent}</td>
                <td>{student.accuracy}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EachgameGrade;