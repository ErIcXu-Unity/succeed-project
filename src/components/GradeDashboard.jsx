import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import './GradeDashboard.css';

const GradeDashboard = () => {
  const completionChartRef = useRef(null);
  const scoreChartRef = useRef(null);

  useEffect(() => {
    const completionCtx = completionChartRef.current.getContext('2d');
    const scoreCtx = scoreChartRef.current.getContext('2d');

    // Completion Rate Doughnut Chart
    new Chart(completionCtx, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Remaining'],
        datasets: [{
          data: [88, 12],
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

    // Score Trend Line Chart
    new Chart(scoreCtx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Avg Score (%)',
          data: [81, 78, 84, 79],
          borderColor: '#42A5F5',
          fill: false,
          tension: 0.3
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }, []);

  return (
    <div className="grade-dashboard">
      <div className="header">Escape Room Performance Overview</div>

      <div className="charts">
        <div className="chart-container">
          <h3>Game Completion Rate</h3>
          <canvas ref={completionChartRef}></canvas>
        </div>
        <div className="chart-container">
          <h3>Accuracy / Average Score</h3>
          <canvas ref={scoreChartRef}></canvas>
        </div>
      </div>
    </div>
  );
};

export default GradeDashboard;