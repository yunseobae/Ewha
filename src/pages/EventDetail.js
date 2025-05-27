import { useNavigate, useParams } from 'react-router-dom';
import React, { useState } from 'react';
import { db } from '../firebase'; // Firebase 설정 파일 경로에 맞게 수정
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  orderBy
} from 'firebase/firestore';

function EventDetail() {
  const { id } = useParams(); // URL 파라미터에서 이벤트 ID를 가져옴
  const navigate = useNavigate();

  const [queryData, setQueryData] = useState({ name: '', studentId: '' }); // 'query' -> 'queryData'로 이름 변경 (state와 함수의 query 충돌 방지)
  const [result, setResult] = useState(null); // 조회 결과
  const [isEditing, setIsEditing] = useState(false); // 수정 모드 여부
  const [editFormData, setEditFormData] = useState({ name: '', studentId: '', phone: '', password: '' }); // 수정 시 사용할 폼 데이터
  const [passwordInput, setPasswordInput] = useState(''); // 취소/수정 시 비밀번호 확인용
  const [isVerifyingCancel, setIsVerifyingCancel] = useState(false); // 취소 비밀번호 입력 폼 표시

  // 조회 입력 필드 변경 핸들러
  const handleQueryInputChange = (e) => {
    const { name, value } = e.target;
    setQueryData(prev => ({ ...prev, [name]: value }));
  };

  // --- 조회 함수 ---
  const handleQuery = async () => {
    // 필수 입력 필드 확인
    if (!queryData.name || !queryData.studentId) {
      alert('이름과 학번을 모두 입력해주세요.');
      return;
    }

    try {
      let foundApp = null;
      let isWaiting = false;
      let waitingNumber = null;

      // 1. 'applications' 컬렉션에서 조회
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('name', '==', queryData.name),
        where('studentId', '==', queryData.studentId),
        where('eventId', '==', id)
      );
      const applicationsSnapshot = await getDocs(applicationsQuery);

      if (!applicationsSnapshot.empty) {
        foundApp = { id: applicationsSnapshot.docs[0].id, ...applicationsSnapshot.docs[0].data() };
        isWaiting = false;
      } else {
        // 2. 'waitingList' 컬렉션에서 조회
        const waitingListQuery = query(
          collection(db, 'waitingList'),
          where('name', '==', queryData.name),
          where('studentId', '==', queryData.studentId),
          where('eventId', '==', id)
        );
        const waitingListSnapshot = await getDocs(waitingListQuery);

        if (!waitingListSnapshot.empty) {
          foundApp = { id: waitingListSnapshot.docs[0].id, ...waitingListSnapshot.docs[0].data() };
          isWaiting = true;

          // 대기 번호 계산: 전체 대기자 목록을 가져와 timestamp로 정렬 후 현재 신청자의 인덱스 찾기
          const allWaitingSnapshot = await getDocs(query(collection(db, 'waitingList'), orderBy('timestamp', 'asc')));
          const allWaiting = allWaitingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const foundIndex = allWaiting.findIndex(app => app.id === foundApp.id);
          waitingNumber = foundIndex !== -1 ? foundIndex + 1 : null;
        }
      }

      if (foundApp) {
        setResult({ ...foundApp, isWaiting, waitingNumber });
        setEditFormData({
          name: foundApp.name,
          studentId: foundApp.studentId,
          phone: foundApp.phone,
          password: foundApp.password || '',
        });
        setIsEditing(false); // 조회 후에는 수정 모드 해제
        setIsVerifyingCancel(false); // 취소 비밀번호 입력 폼 숨기기
        setPasswordInput(''); // 비밀번호 입력 초기화
      } else {
        alert('신청 내역을 찾을 수 없습니다. 이름과 학번을 다시 확인해주세요.');
        setResult(null);
        setIsEditing(false);
        setIsVerifyingCancel(false);
        setPasswordInput('');
      }
    } catch (error) {
      console.error('조회 중 오류 발생:', error);
      alert('신청 내역을 조회하는 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 신청 페이지로 이동
  const handleApplyClick = () => {
    navigate(`/event/${id}/apply`);
  };

  // --- 취소 기능 ---
  // 취소 버튼 클릭 시 비밀번호 입력 폼 보여주기
  const handleCancelClick = () => {
    if (!result) return;
    setIsVerifyingCancel(true); // 비밀번호 입력 폼 표시
    setPasswordInput(''); // 입력 필드 초기화
  };

  // 취소 비밀번호 입력 변화 핸들러
  const handlePasswordInputChange = (e) => {
    setPasswordInput(e.target.value);
  };

  // 실제 취소 처리 (비밀번호 확인 후 실행)
  const handleConfirmCancel = async () => {
    if (!passwordInput) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    if (passwordInput !== result.password) {
      alert('비밀번호가 올바르지 않습니다.');
      return;
    }

    if (window.confirm('신청/대기 내역을 정말 취소하시겠습니까?')) {
      try {
        const collectionName = result.isWaiting ? 'waitingList' : 'applications';
        await deleteDoc(doc(db, collectionName, result.id)); // Firestore에서 문서 삭제

        alert('신청/대기 내역이 성공적으로 취소되었습니다.');
        setResult(null); // 결과 초기화
        setIsEditing(false);
        setIsVerifyingCancel(false);
        setPasswordInput('');
      } catch (error) {
        console.error('취소 처리 중 오류 발생:', error);
        alert('취소 중 오류가 발생했습니다: ' + error.message);
      }
    }
  };

  // --- 수정 기능 ---
  // 수정 버튼 클릭 시 수정 모드로 전환
  const handleEditClick = () => {
    setIsEditing(true);
    setIsVerifyingCancel(false); // 혹시 열려있을 취소 비밀번호 폼 닫기
    // 수정 폼에 현재 조회된 데이터 로드
    setEditFormData({
      name: result.name,
      studentId: result.studentId,
      phone: result.phone,
      password: result.password || '',
    });
  };

  // 수정 입력값 변경 핸들러
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // 수정 저장
  const handleSaveEdit = async () => {
    // 필수 필드 및 비밀번호 확인
    if (!editFormData.name || !editFormData.phone || !editFormData.password) {
      alert('이름, 전화번호, 비밀번호는 필수입니다.');
      return;
    }

    if (editFormData.password !== result.password) {
      alert('현재 비밀번호가 올바르지 않습니다. 다시 확인해주세요.');
      return;
    }

    if (window.confirm('수정된 정보를 저장하시겠습니까?')) {
      try {
        const collectionName = result.isWaiting ? 'waitingList' : 'applications';
        const docRef = doc(db, collectionName, result.id); // 수정할 문서 참조

        // 업데이트할 데이터 (학번과 eventId는 수정 불가)
        const updatedData = {
          name: editFormData.name,
          phone: editFormData.phone,
          // 비밀번호는 변경되지 않았으면 그대로, 변경되었으면 새로운 값으로 (원래 평문 저장 가정)
          password: editFormData.password,
        };

        await updateDoc(docRef, updatedData); // Firestore 문서 업데이트

        alert('정보가 성공적으로 수정되었습니다.');
        // UI에 반영하기 위해 result 상태 업데이트
        setResult(prevResult => ({
          ...prevResult,
          name: editFormData.name,
          phone: editFormData.phone,
          password: editFormData.password,
        }));
        setIsEditing(false); // 수정 모드 종료
      } catch (error) {
        console.error('수정 처리 중 오류 발생:', error);
        alert('정보를 수정하는 중 오류가 발생했습니다: ' + error.message);
      }
    }
  };

  // 수정 취소 (수정 모드 종료 및 데이터 원상 복구)
  const handleCancelEdit = () => {
    setIsEditing(false);
    // 수정 폼 데이터를 원본 result 데이터로 되돌림
    setEditFormData({
      name: result.name,
      studentId: result.studentId,
      phone: result.phone,
      password: result.password || '',
    });
  };

  return (
    <div>
      <h2>신청/조회</h2>
      <div>
        <button onClick={handleApplyClick}>신청하기</button>
      </div>
      <div style={{ marginTop: '20px' }}>
        <h3>내 신청 정보 조회</h3>
        <input
          name="name"
          placeholder="이름"
          value={queryData.name}
          onChange={handleQueryInputChange}
          style={{ marginRight: '10px' }}
        />
        <input
          name="studentId"
          placeholder="학번"
          value={queryData.studentId}
          onChange={handleQueryInputChange}
          style={{ marginRight: '10px' }}
        />
        <button onClick={handleQuery}>조회</button>
      </div>

      {result && (
        <div style={{ marginTop: 20, border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
          <h3>조회된 신청 정보</h3>
          {isEditing ? (
            <div>
              <div>
                <label>
                  이름:
                  <input
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditChange}
                    required
                  />
                </label>
              </div>
              <div>
                <label>
                  학번:
                  <input name="studentId" value={editFormData.studentId} disabled style={{ backgroundColor: '#f0f0f0' }} />
                </label>
              </div>
              <div>
                <label>
                  전화번호:
                  <input
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditChange}
                    required
                  />
                </label>
              </div>
              <div>
                <label>
                  비밀번호:
                  <input
                    type="password"
                    name="password"
                    value={editFormData.password}
                    onChange={handleEditChange}
                    required
                  />
                </label>
              </div>
              <button onClick={handleSaveEdit} style={{ marginRight: '10px' }}>저장</button>
              <button onClick={handleCancelEdit}>수정 취소</button>
            </div>
          ) : (
            <div>
              <p><strong>이름:</strong> {result.name}</p>
              <p><strong>학번:</strong> {result.studentId}</p>
              <p><strong>전화번호:</strong> {result.phone}</p>
              <p>
                <strong>상태:</strong>{' '}
                {result.isWaiting ? `대기자 (대기 번호: ${result.waitingNumber})` : '신청 완료'}
              </p>
              {result.schoolType && <p><strong>학교 구분:</strong> {result.schoolType}</p>}
              {result.dormitoryStatus && result.dormitoryStatus !== '해당없음' && (
                <p><strong>기숙사/야자:</strong> {result.dormitoryStatus}</p>
              )}
              {result.dormitoryPhone && (
                <p><strong>기숙사/야자 번호:</strong> {result.dormitoryPhone}</p>
              )}
              <p><strong>신청 시간:</strong> {new Date(result.timestamp).toLocaleString()}</p>

              <div style={{ marginTop: '15px' }}>
                <button onClick={handleEditClick} style={{ marginRight: '10px' }}>수정</button>
                <button onClick={handleCancelClick}>취소</button>
              </div>
            </div>
          )}

          {isVerifyingCancel && (
            <div style={{ marginTop: '15px', padding: '10px', borderTop: '1px solid #eee' }}>
              <p>취소하려면 비밀번호를 다시 입력해주세요.</p>
              <input
                type="password"
                placeholder="비밀번호 입력"
                value={passwordInput}
                onChange={handlePasswordInputChange}
                style={{ marginRight: '10px' }}
              />
              <button onClick={handleConfirmCancel} style={{ marginRight: '10px', backgroundColor: 'red', color: 'white' }}>취소 확정</button>
              <button onClick={() => setIsVerifyingCancel(false)}>취소</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EventDetail;
