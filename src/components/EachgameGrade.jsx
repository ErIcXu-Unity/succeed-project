import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import './EachgameGrade.css';

// Note: This component currently uses mock data, should connect to backend API in actual project
const EachgameGrade = () => {
  const completionChartRef = useRef(null);
  const scoreChartRef = useRef(null);
  const chartInstance1 = useRef(null);
  const chartInstance2 = useRef(null);

  useEffect(() => {
    const ctx1 = completionChartRef.current.getContext('2d');
    const ctx2 = scoreChartRef.current.getContext('2d');

    if (chartInstance1.current) chartInstance1.current.destroy();
    if (chartInstance2.current) chartInstance2.current.destroy();

    chartInstance1.current = new Chart(ctx1, {
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

    chartInstance2.current = new Chart(ctx2, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Avg Score (%)',
          data: [80, 82, 79, 83, 85, 78, 81],
          fill: false,
          borderColor: '#42A5F5',
          tension: 0.3,
          pointBackgroundColor: '#42A5F5'
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true }
        }
      }
    });

    return () => {
      if (chartInstance1.current) chartInstance1.current.destroy();
      if (chartInstance2.current) chartInstance2.current.destroy();
    };
  }, []);

  const exportCSV = () => {
    let csv = "Student ID,Name,Completion,Score,Time Spent,Accuracy\n";
    const rows = document.querySelectorAll("#gradesTable tbody tr");
    rows.forEach(row => {
      const cells = row.querySelectorAll("td");
      const rowData = Array.from(cells).map(td => td.textContent).join(",");
      csv += rowData + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "escape_room_1_grades.csv";
    a.click();
  };

  return (
    <div className="page">
      <div className="header">Escape Room 1 - Performance Overview</div>

      <div className="stats">
        <div className="stat-box">Completion Rate<br /><strong>88%</strong></div>
        <div className="stat-box">Avg Score<br /><strong>81%</strong></div>
        <div className="stat-box">Avg Time Spent<br /><strong>47s</strong></div>
        <div className="stat-box">Participants<br /><strong>112</strong></div>
      </div>

      <div className="charts">
        <div className="chart-container">
          <canvas ref={completionChartRef} width="300" height="300"></canvas>
        </div>
        <div className="chart-container">
          <canvas ref={scoreChartRef} width="400" height="300"></canvas>
        </div>
      </div>

      <button className="export-btn" onClick={exportCSV}>Export CSV</button>

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
          <tr>
            <td>1001</td><td>Alice Wang</td><td>✅</td><td>85%</td><td>42s</td><td>88%</td>
          </tr>
          <tr>
            <td>1002</td><td>Bob Lin</td><td>✅</td><td>77%</td><td>50s</td><td>80%</td>
          </tr>
          <tr>
            <td>1003</td><td>Claire Ho</td><td>❌</td><td>–</td><td>–</td><td>–</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default EachgameGrade;