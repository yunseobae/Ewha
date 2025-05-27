import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminPage() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [waitingList, setWaitingList] = useState([]);
  const [maxCapacity, setMaxCapacity] = useState(50); // 기본 최대 인원 수
  const [selectedSchool, setSelectedSchool] = useState('all');
  const [selectedDormType, setSelectedDormType] = useState('all');
  const [searchName, setSearchName] = useState('');
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('isAdminLoggedIn')) {
      navigate('/admin/login');
    }
    const storedApps = JSON.parse(localStorage.getItem('applications')) || [];
    setApplications(storedApps);

    const storedWaiting = JSON.parse(localStorage.getItem('waitingList')) || [];
    setWaitingList(storedWaiting);

    const storedMax = parseInt(localStorage.getItem('maxCapacity'), 10);
    if (!isNaN(storedMax)) setMaxCapacity(storedMax);

    const closedState = localStorage.getItem('applicationsClosed') === 'true';
    setIsClosed(closedState);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    navigate('/admin/login');
  };

  const handleCancel = (index, fromWaiting = false) => {
    if (window.confirm('이 신청을 정말 취소하시겠습니까?')) {
      if (fromWaiting) {
        const updatedWaiting = [...waitingList];
        updatedWaiting.splice(index, 1);
        setWaitingList(updatedWaiting);
        localStorage.setItem('waitingList', JSON.stringify(updatedWaiting));
      } else {
        const updatedApps = [...applications];
        updatedApps.splice(index, 1);
        setApplications(updatedApps);
        localStorage.setItem('applications', JSON.stringify(updatedApps));

        // 신청자 중 한 명 취소 시 대기자 중 첫 번째를 신청자 목록으로 이동시키기
        if (waitingList.length > 0) {
          const nextApplicant = waitingList[0];
          const newWaiting = waitingList.slice(1);
          setWaitingList(newWaiting);
          localStorage.setItem('waitingList', JSON.stringify(newWaiting));

          const newApplications = [...updatedApps, nextApplicant];
          setApplications(newApplications);
          localStorage.setItem('applications', JSON.stringify(newApplications));
        }
      }
    }
  };

  const toggleClose = () => {
    setIsClosed((prev) => {
      localStorage.setItem('applicationsClosed', !prev);
      return !prev;
    });
  };

  const handleMaxCapacityChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      setMaxCapacity(val);
      localStorage.setItem('maxCapacity', val);
    }
  };

  const schools = ['all', '이화여고', '이화외고', '졸업생', '기타'];
  const dormTypes = ['all', '기숙사', '야자', '해당없음'];

  // 신청자 필터링
  const filteredApplications = applications.filter((app) => {
    if (selectedSchool !== 'all' && app.schoolType !== selectedSchool) return false;
    if (selectedSchool === '이화여고' && selectedDormType !== 'all' && app.dormitoryStatus !== selectedDormType) return false;
    if (searchName && !app.name.includes(searchName)) return false;
    return true;
  });

  // 대기자 필터링 (같은 조건 적용)
  const filteredWaiting = waitingList.filter((app) => {
    if (selectedSchool !== 'all' && app.schoolType !== selectedSchool) return false;
    if (selectedSchool === '이화여고' && selectedDormType !== 'all' && app.dormitoryStatus !== selectedDormType) return false;
    if (searchName && !app.name.includes(searchName)) return false;
    return true;
  });

  return (
    <div>
      <h2>관리자 페이지</h2>
      <button onClick={handleLogout}>로그아웃</button>

      <div style={{ margin: '20px 0' }}>
        <button
          onClick={toggleClose}
          style={{
            backgroundColor: isClosed ? 'red' : 'green',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {isClosed ? '신청 오픈하기' : '신청 마감하기'}
        </button>
        <span style={{ marginLeft: '15px', fontWeight: 'bold' }}>
          현재 상태: {isClosed ? '신청 마감됨' : '신청 중'}
        </span>
      </div>

      <div style={{ margin: '20px 0' }}>
        <label>
          최대 신청 인원 수:{''}
          <input
            type="number"
            value={maxCapacity}
            onChange={handleMaxCapacityChange}
            min={1}
            style={{ width: '80px' }}
          />
        </label>
        <span style={{ marginLeft: '20px' }}>
          현재 신청 인원: {applications.length}명 / 최대 {maxCapacity}명
        </span>
      </div>

      <div style={{ margin: '10px 0' }}>
        <input
          type="text"
          placeholder="이름으로 검색"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          style={{ padding: '6px', width: '200px' }}
        />
      </div>

      <div style={{ margin: '20px 0' }}>
        <span>학교 구분: </span>
        {schools.map((school) => (
          <button
            key={school}
            onClick={() => {
              setSelectedSchool(school);
              setSelectedDormType('all');
            }}
            style={{ marginRight: '10px', fontWeight: selectedSchool === school ? 'bold' : 'normal' }}
          >
            {school === 'all' ? '전체' : school}
          </button>
        ))}
      </div>

      {selectedSchool === '이화여고' && (
        <div style={{ margin: '10px 0' }}>
          <span>기숙사/야자 구분: </span>
          {dormTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedDormType(type)}
              style={{ marginRight: '10px', fontWeight: selectedDormType === type ? 'bold' : 'normal' }}
            >
              {type === 'all' ? '전체' : type}
            </button>
          ))}
        </div>
      )}

      <h3>신청자 목록 ({filteredApplications.length}명)</h3>
      {filteredApplications.length === 0 ? (
        <p>신청자가 없습니다.</p>
      ) : (
        <table
          border="1"
          cellPadding="5"
          cellSpacing="0"
          style={{ width: '100%', borderCollapse: 'collapse' }}
        >
          <thead>
            <tr>
              <th>이름</th>
              <th>학번</th>
              <th>전화번호</th>
              <th>학교 구분</th>
              <th>기숙사/야자</th>
              <th>기숙사/야자 번호</th>
              <th>이벤트 ID</th>
              <th>신청 시간</th>
              <th>취소</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.map((app, idx) => (
              <tr key={idx}>
                <td>{app.name}</td>
                <td>{app.studentId}</td>
                <td>{app.phone}</td>
                <td>{app.schoolType || '기타'}</td>
                <td>{app.dormitoryStatus || '-'}</td>
                <td>{app.dormitoryPhone || '-'}</td>
                <td>{app.eventId}</td>
                <td>{new Date(app.timestamp).toLocaleString()}</td>
                <td>
                  <button onClick={() => handleCancel(idx, false)}>취소</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 style={{ marginTop: '40px' }}>대기자 목록 ({filteredWaiting.length}명)</h3>
      {filteredWaiting.length === 0 ? (
        <p>대기자가 없습니다.</p>
      ) : (
        <table
          border="1"
          cellPadding="5"
          cellSpacing="0"
          style={{ width: '100%', borderCollapse: 'collapse' }}
        >
          <thead>
            <tr>
              <th>대기 번호</th>
              <th>이름</th>
              <th>학번</th>
              <th>전화번호</th>
              <th>학교 구분</th>
              <th>기숙사/야자</th>
              <th>기숙사/야자 번호</th>
              <th>신청 시간</th>
              <th>취소</th>
            </tr>
          </thead>
          <tbody>
            {filteredWaiting.map((app, idx) => (
              <tr key={idx}>
                <td>{idx}</td>
                <td>{app.name}</td>
                <td>{app.studentId}</td>
                <td>{app.phone}</td>
                <td>{app.schoolType || '기타'}</td>
                <td>{app.dormitoryStatus || '-'}</td>
                <td>{app.dormitoryPhone || '-'}</td>
                <td>{new Date(app.timestamp).toLocaleString()}</td>
                <td>
                  <button onClick={() => handleCancel(idx, true)}>취소</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminPage;
