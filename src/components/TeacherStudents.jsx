import React, { useState } from 'react';
import './TeacherStudents.css';

// 注意：此组件目前使用模拟数据，实际项目中应连接到后端API
const sampleData = [
  { id: '1001', name: 'Alice Wang', class: 'Class A' },
  { id: '1002', name: 'Bob Lin', class: 'Class B' },
  { id: '1003', name: 'Claire Ho', class: 'Class A' }
];

const TeacherStudents = () => {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  const filteredData = sampleData.filter(student => {
    const nameMatch = student.name.toLowerCase().includes(search.toLowerCase());
    const classMatch = !classFilter || student.class === classFilter;
    return nameMatch && classMatch;
  });

  const exportCSV = () => {
    let csv = "Student ID,Name,Class\n";
    filteredData.forEach(({ id, name, class: cls }) => {
      csv += `${id},${name},${cls}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_list.csv";
    a.click();
  };

  const viewStudent = (id) => {
    alert(`Redirect to Student ${id}'s detail page`);
    // navigate(`/student/detail/${id}`);
  };

  return (
    <div className="teacher-page">

      <div className="content-wrapper">
        <div className="top-bar">
          <div className="search-filter">
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select value={classFilter} onChange={e => setClassFilter(e.target.value)}>
              <option value="">All Classes</option>
              <option value="Class A">Class A</option>
              <option value="Class B">Class B</option>
              <option value="Class C">Class C</option>
            </select>
          </div>
          <button className="export-btn" onClick={exportCSV}>Export CSV</button>
        </div>

        <table id="studentTable">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Class</th>
              <th>View</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(student => (
              <tr key={student.id}>
                <td>{student.id}</td>
                <td>{student.name}</td>
                <td>{student.class}</td>
                <td>
                  <button className="view-btn" onClick={() => viewStudent(student.id)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherStudents;