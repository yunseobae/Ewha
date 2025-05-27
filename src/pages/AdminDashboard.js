import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom'; // useNavigate 임포트
import { db } from '../firebase'; // Firebase 설정 파일 경로에 맞게 수정
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth'; // auth 모듈 임포트

function AdminDashboard() {
  const [applications, setApplications] = useState([]);
  const [maxCapacity, setMaxCapacity] = useState(300); // 기본값, Firestore에서 불러올 예정
  const navigate = useNavigate(); // useNavigate 훅 사용

  useEffect(() => {
    // 1. 'applications' 컬렉션 리스너: 신청자 목록을 실시간으로 가져와 업데이트합니다.
    const unsubscribeApplications = onSnapshot(query(collection(db, 'applications'), orderBy('timestamp', 'asc')), (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApplications(apps);
    });

    // 2. 'settings' 문서 리스너: 최대 인원 설정을 실시간으로 가져와 업데이트합니다.
    const settingsRef = doc(db, 'settings', 'appSettings');
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMaxCapacity(data.maxCapacity || 300); // 문서에 값이 없으면 기본값 300
      } else {
        console.log("No appSettings document found. Using default maxCapacity.");
        setMaxCapacity(300); // 문서가 없으면 기본값 사용
      }
    });

    // 컴포넌트 언마운트 시 모든 Firestore 리스너의 구독을 해제하여 메모리 누수를 방지합니다.
    return () => {
      unsubscribeApplications();
      unsubscribeSettings();
    };
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // --- 로그아웃 처리 함수 추가 ---
  const handleLogout = async () => {
    if (window.confirm('관리자 계정에서 로그아웃 하시겠습니까?')) {
      try {
        const auth = getAuth(); // auth 인스턴스를 가져옴
        await signOut(auth);
        alert('성공적으로 로그아웃 되었습니다.');
        navigate('/admin/login'); // 로그인 페이지로 리다이렉트
      } catch (error) {
        console.error("로그아웃 실패:", error);
        alert("로그아웃 중 오류가 발생했습니다: " + error.message);
      }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>관리자 대시보드</h2>
        <button
          onClick={handleLogout} // 로그아웃 버튼
          style={{ float: 'right', padding: '10px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          로그아웃
        </button>
      </div>

      <p>총 신청 수: **{applications.length}** / 최대 **{maxCapacity}**명</p>

      {applications.length === 0 ? (
        <p>아직 신청한 사람이 없습니다.</p>
      ) : (
        <table
          border="1"
          cellPadding="5"
          cellSpacing="0"
          style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}
        >
          <thead>
            <tr>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>이름</th>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>학번</th>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>전화번호</th>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>학교 구분</th>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>기숙사/야자</th>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>신청 시간</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id}>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{app.name}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{app.studentId}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{app.phone}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{app.schoolType || 'N/A'}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{app.dormitoryStatus || '-'}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{new Date(app.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* AdminPage와 같은 하위 라우트 컴포넌트가 렌더링될 위치 */}
      <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <Outlet />
      </div>
    </div>
  );
}

export default AdminDashboard;