import React, { useEffect, useRef } from 'react';
import './TeacherReports.css';
import Chart from 'chart.js/auto';

const TeacherReports = () => {
  const completionRef = useRef(null);
  const accuracyRef = useRef(null);
  const classRef = useRef(null);
  const timeRef = useRef(null);

  const completionChart = useRef(null);
  const accuracyChart = useRef(null);
  const classChart = useRef(null);
  const timeChart = useRef(null);

  useEffect(() => {
    if (completionChart.current) completionChart.current.destroy();
    if (accuracyChart.current) accuracyChart.current.destroy();
    if (classChart.current) classChart.current.destroy();
    if (timeChart.current) timeChart.current.destroy();

    completionChart.current = new Chart(completionRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Incomplete'],
        datasets: [{
          data: [88, 24],
          backgroundColor: ['#42A5F5', '#EF9A9A']
        }]
      },
      options: {
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });

    accuracyChart.current = new Chart(accuracyRef.current, {
      type: 'line',
      data: {
        labels: ['Game 1', 'Game 2', 'Game 3', 'Game 4'],
        datasets: [{
          label: 'Average Score (%)',
          data: [81, 78, 84, 79],
          borderColor: '#42A5F5',
          fill: false,
          tension: 0.3
        }]
      },
      options: { scales: { y: { beginAtZero: true } } }
    });

    classChart.current = new Chart(classRef.current, {
      type: 'bar',
      data: {
        labels: ['Class A', 'Class B', 'Class C'],
        datasets: [{
          label: 'Completion Rate (%)',
          data: [82, 75, 88],
          backgroundColor: ['#FFA726', '#66BB6A', '#29B6F6']
        }]
      },
      options: { indexAxis: 'y', scales: { x: { beginAtZero: true } } }
    });

    timeChart.current = new Chart(timeRef.current, {
      type: 'bar',
      data: {
        labels: ['Game 1', 'Game 2', 'Game 3'],
        datasets: [{
          label: 'Avg Time (s)',
          data: [45, 52, 49],
          backgroundColor: '#AB47BC'
        }]
      },
      options: { scales: { y: { beginAtZero: true } } }
    });

    return () => {
      completionChart.current?.destroy();
      accuracyChart.current?.destroy();
      classChart.current?.destroy();
      timeChart.current?.destroy();
    };
  }, []);

  const exportCSV = () => {
    const rows = [
      ["Metric", "Value"],
      ["Completed", "88"],
      ["Incomplete", "24"],
      ["Completion Rate", "78.6%"],
      ["Avg Scores", "81%,78%,84%,79%"],
      ["Overall Avg Score", "80.5%"],
      ["Class A Completion", "82%"],
      ["Class B Completion", "75%"],
      ["Class C Completion", "88%"],
      ["Game 1 Time", "45s"],
      ["Game 2 Time", "52s"],
      ["Game 3 Time", "49s"]
    ];
    let csv = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = encodeURI(csv);
    a.download = "escape_room_report.csv";
    a.click();
  };

  return (
    <div className="reports-page">
      <div className="content">
        <button className="export-btn" onClick={exportCSV}>Export Report CSV</button>

        <div className="chart-section">
          <div className="chart-container">
            <h3>Game Completion Rate</h3>
            <canvas ref={completionRef}></canvas>
            <div className="chart-data">
              ✅ Completed: <strong>88</strong><br />
              ❌ Incomplete: <strong>24</strong><br />
              Completion Rate: <strong>78.6%</strong>
            </div>
          </div>

          <div className="chart-container">
            <h3>Accuracy / Average Score</h3>
            <canvas ref={accuracyRef}></canvas>
            <div className="chart-data">
              <ul>
                <li>Game 1: 81%</li>
                <li>Game 2: 78%</li>
                <li>Game 3: 84%</li>
                <li>Game 4: 79%</li>
              </ul>
              Overall Average: <strong>80.5%</strong>
            </div>
          </div>
        </div>

        <div className="chart-section">
          <div className="chart-container">
            <h3>Class Completion Comparison</h3>
            <canvas ref={classRef}></canvas>
            <div className="chart-data">
              <table>
                <thead>
                  <tr><th>Class</th><th>Completion Rate</th></tr>
                </thead>
                <tbody>
                  <tr><td>Class A</td><td>82%</td></tr>
                  <tr><td>Class B</td><td>75%</td></tr>
                  <tr><td>Class C</td><td>88%</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="chart-container">
            <h3>Average Time Spent (per game)</h3>
            <canvas ref={timeRef}></canvas>
            <div className="chart-data">
              <table>
                <thead>
                  <tr><th>Game</th><th>Time (s)</th></tr>
                </thead>
                <tbody>
                  <tr><td>Game 1</td><td>45s</td></tr>
                  <tr><td>Game 2</td><td>52s</td></tr>
                  <tr><td>Game 3</td><td>49s</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherReports;