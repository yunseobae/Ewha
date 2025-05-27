import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

function AdminDashboard() {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const storedApplications = JSON.parse(localStorage.getItem('applications')) || [];
    setApplications(storedApplications);
  }, []);

  return (
    <div>
      <h2>관리자 페이지 - 신청 현황</h2>
      <p>총 신청 수: {applications.length} / 300</p>

      {applications.length === 0 ? (
        <p>아직 신청한 사람이 없습니다.</p>
      ) : (
        <table border="1">
          <thead>
            <tr>
              <th>이름</th>
              <th>학번</th>
              <th>전화번호</th>
              <th>신청 시간</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app, index) => (
              <tr key={index}>
                <td>{app.name}</td>
                <td>{app.studentId}</td>
                <td>{app.phone}</td>
                <td>{new Date(app.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 하위 라우트 컴포넌트 렌더링 위치 */}
      <Outlet />
    </div>
  );
}

export default AdminDashboard;
