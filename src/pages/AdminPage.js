import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom'; // 더 이상 AdminPage에서 직접 사용하지 않음
import { db } from '../firebase'; // Firebase 설정 파일 경로에 맞게 수정
import {
  collection,
  doc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  addDoc,
  setDoc,
  query,
  orderBy
} from 'firebase/firestore';

function AdminPage() {
  // const navigate = useNavigate(); // 삭제: PrivateRoute가 인증 관리

  const [applications, setApplications] = useState([]);
  const [waitingList, setWaitingList] = useState([]);
  const [maxCapacity, setMaxCapacity] = useState(50);
  const [selectedSchool, setSelectedSchool] = useState('all');
  const [selectedDormType, setSelectedDormType] = useState('all');
  const [searchName, setSearchName] = useState('');
  const [isClosed, setIsClosed] = useState(false);

  const [settingsDocRef, setSettingsDocRef] = useState(null);

  useEffect(() => {
    const unsubscribeApps = onSnapshot(query(collection(db, 'applications'), orderBy('timestamp', 'asc')), (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApplications(apps);
    });

    const unsubscribeWaiting = onSnapshot(query(collection(db, 'waitingList'), orderBy('timestamp', 'asc')), (snapshot) => {
      const waiting = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWaitingList(waiting);
    });

    const settingsRef = doc(db, 'settings', 'appSettings');
    setSettingsDocRef(settingsRef);

    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMaxCapacity(data.maxCapacity || 50);
        setIsClosed(data.isClosed !== undefined ? data.isClosed : false);
      } else {
        console.log("No appSettings document found, creating with default values.");
        setDoc(settingsRef, { maxCapacity: 50, isClosed: false, timestamp: Date.now() })
          .then(() => {
            setMaxCapacity(50);
            setIsClosed(false);
          })
          .catch(error => console.error("Error creating appSettings document:", error));
      }
    });

    return () => {
      unsubscribeApps();
      unsubscribeWaiting();
      unsubscribeSettings();
    };
  }, []);

  const handleCancel = async (appToCancel, fromWaiting = false) => {
    if (window.confirm('이 신청을 정말 취소하시겠습니까?')) {
      try {
        if (fromWaiting) {
          await deleteDoc(doc(db, 'waitingList', appToCancel.id));
          alert('대기 신청이 취소되었습니다.');
        } else {
          await deleteDoc(doc(db, 'applications', appToCancel.id));
          alert('신청이 취소되었습니다.');

          if (waitingList.length > 0) {
            const nextApplicant = waitingList[0];
            await deleteDoc(doc(db, 'waitingList', nextApplicant.id));

            const { id, ...dataToMove } = nextApplicant;

            await addDoc(collection(db, 'applications'), {
              ...dataToMove,
              movedFromWaiting: true,
              timestamp: Date.now()
            });
            alert(`${nextApplicant.name}님을 대기 목록에서 신청 목록으로 이동했습니다.`);
          }
        }
      } catch (error) {
        console.error('취소 처리 중 오류 발생:', error);
        alert('취소 중 오류가 발생했습니다: ' + error.message);
      }
    }
  };

  const toggleClose = async () => {
    if (settingsDocRef) {
      try {
        await updateDoc(settingsDocRef, { isClosed: !isClosed });
      } catch (error) {
        console.error('신청 마감/오픈 상태 업데이트 중 오류 발생:', error);
        alert('상태 업데이트 중 오류가 발생했습니다: ' + error.message);
      }
    }
  };

  const handleMaxCapacityChange = async (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0 && settingsDocRef) {
      try {
        await updateDoc(settingsDocRef, { maxCapacity: val });
      } catch (error) {
        console.error('최대 인원 업데이트 중 오류 발생:', error);
        alert('최대 인원 업데이트 중 오류가 발생했습니다: ' + error.message);
      }
    }
  };

  const schools = ['all', '이화여고', '이화외고', '졸업생', '기타'];
  const dormTypes = ['all', '기숙사', '야자', '해당없음'];

  const filteredApplications = applications.filter((app) => {
    if (selectedSchool !== 'all' && app.schoolType !== selectedSchool) return false;
    if (selectedSchool === '이화여고' && selectedDormType !== 'all' && app.dormitoryStatus !== selectedDormType) return false;
    if (searchName && !app.name.includes(searchName)) return false;
    return true;
  });

  const filteredWaiting = waitingList.filter((app) => {
    if (selectedSchool !== 'all' && app.schoolType !== selectedSchool) return false;
    if (selectedSchool === '이화여고' && selectedDormType !== 'all' && app.dormitoryStatus !== selectedDormType) return false;
    if (searchName && !app.name.includes(searchName)) return false;
    return true;
  });

  // --- 엑셀 다운로드 함수 추가 ---
  const downloadAsExcel = (data, filename = '신청자_목록') => {
    // CSV 헤더 설정 (필요한 컬럼명)
    const headers = [
      "이름", "학번", "전화번호", "학교 구분", "기숙사/야자",
      "기숙사/야자 번호", "이벤트 ID", "신청 시간"
    ];

    // 데이터를 CSV 형식으로 변환 (헤더 + 각 행의 데이터)
    const csvContent = [
      headers.join(','), // 헤더 행
      ...data.map(row =>
        [
          `"${row.name}"`, // 이름 (쉼표 등 포함될 수 있으므로 따옴표 처리)
          `"${row.studentId}"`, // 학번
          `"${row.phone}"`, // 전화번호
          `"${row.schoolType || '기타'}"`, // 학교 구분
          `"${row.dormitoryStatus || '-'}"`, // 기숙사/야자
          `"${row.dormitoryPhone || '-'}"`, // 기숙사/야자 번호
          `"${row.eventId || '-'}"`, // 이벤트 ID
          `"${new Date(row.timestamp).toLocaleString()}"` // 신청 시간
        ].join(',')
      )
    ].join('\n');

    // Blob 객체 생성 및 다운로드 링크 생성
    const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM 추가하여 한글 깨짐 방지
    const link = document.createElement('a');
    if (link.download !== undefined) { // HTML5 download 속성 지원 확인
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toLocaleDateString('ko-KR')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div>
      {/* <h2>관리자 페이지</h2> */}
      {/* 로그아웃 버튼은 AdminDashboard로 이동 */}

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
          최대 신청 인원 수:{' '}
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
      {/* 엑셀 다운로드 버튼 추가: 신청자 목록 */}
      <button
        onClick={() => downloadAsExcel(filteredApplications, '신청자_목록')}
        style={{ marginBottom: '10px', padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        신청자 목록 엑셀 다운로드
      </button>

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
            {filteredApplications.map((app) => (
              <tr key={app.id}>
                <td>{app.name}</td>
                <td>{app.studentId}</td>
                <td>{app.phone}</td>
                <td>{app.schoolType || '기타'}</td>
                <td>{app.dormitoryStatus || '-'}</td>
                <td>{app.dormitoryPhone || '-'}</td>
                <td>{app.eventId}</td>
                <td>{new Date(app.timestamp).toLocaleString()}</td>
                <td>
                  <button onClick={() => handleCancel(app, false)}>취소</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 style={{ marginTop: '40px' }}>대기자 목록 ({filteredWaiting.length}명)</h3>
      {/* 엑셀 다운로드 버튼 추가: 대기자 목록 */}
      <button
        onClick={() => downloadAsExcel(filteredWaiting, '대기자_목록')}
        style={{ marginBottom: '10px', padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        대기자 목록 엑셀 다운로드
      </button>

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
              <tr key={app.id}>
                <td>{idx + 1}</td>
                <td>{app.name}</td>
                <td>{app.studentId}</td>
                <td>{app.phone}</td>
                <td>{app.schoolType || '기타'}</td>
                <td>{app.dormitoryStatus || '-'}</td>
                <td>{app.dormitoryPhone || '-'}</td>
                <td>{new Date(app.timestamp).toLocaleString()}</td>
                <td>
                  <button onClick={() => handleCancel(app, true)}>취소</button>
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