import { useNavigate, useParams } from 'react-router-dom';
import React, { useState } from 'react';

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [query, setQuery] = useState({ name: '', studentId: '' });
  const [result, setResult] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', studentId: '', phone: '', password: '' });
  const [passwordInput, setPasswordInput] = useState(''); // 취소 시 입력 비밀번호
  const [isVerifyingCancel, setIsVerifyingCancel] = useState(false); // 취소 비밀번호 입력 폼 표시

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setQuery(prev => ({ ...prev, [name]: value }));
  };

  // 조회 함수
  const handleQuery = () => {
    const allApplications = JSON.parse(localStorage.getItem('applications')) || [];
    const waitingList = JSON.parse(localStorage.getItem('waitingList')) || [];

    const foundApp = allApplications.find(app =>
      app.name === query.name &&
      app.studentId === query.studentId &&
      app.eventId === id
    );

    if (foundApp) {
      setResult({ ...foundApp, isWaiting: false });
      setEditData({
        name: foundApp.name,
        studentId: foundApp.studentId,
        phone: foundApp.phone,
        password: foundApp.password || '',
      });
      setIsEditing(false);
      setIsVerifyingCancel(false);
      setPasswordInput('');
      return;
    }

    const waitingIndex = waitingList.findIndex(app =>
      app.name === query.name &&
      app.studentId === query.studentId &&
      app.eventId === id
    );

    if (waitingIndex !== -1) {
      const foundWait = waitingList[waitingIndex];
      setResult({ ...foundWait, isWaiting: true, waitingNumber: waitingIndex + 1 });
      setEditData({
        name: foundWait.name,
        studentId: foundWait.studentId,
        phone: foundWait.phone,
        password: foundWait.password || '',
      });
      setIsEditing(false);
      setIsVerifyingCancel(false);
      setPasswordInput('');
      return;
    }

    alert('신청 내역을 찾을 수 없습니다.');
    setResult(null);
    setIsEditing(false);
    setIsVerifyingCancel(false);
    setPasswordInput('');
  };

  const handleApplyClick = () => {
    navigate(`/event/${id}/apply`);
  };

  // 취소 버튼 클릭 시 비밀번호 입력 폼 보여주기
  const handleCancelClick = () => {
    if (!result) return;
    setIsVerifyingCancel(true);
    setPasswordInput('');
  };

  // 취소 비밀번호 입력 변화
  const handlePasswordInputChange = (e) => {
    setPasswordInput(e.target.value);
  };

  // 실제 취소 처리
  const handleConfirmCancel = () => {
    if (!passwordInput) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    if (passwordInput !== result.password) {
      alert('비밀번호가 올바르지 않습니다.');
      return;
    }

    if (result.isWaiting) {
      const waitingList = JSON.parse(localStorage.getItem('waitingList')) || [];
      const filtered = waitingList.filter(app =>
        !(app.name === result.name && app.studentId === result.studentId && app.eventId === id)
      );
      localStorage.setItem('waitingList', JSON.stringify(filtered));
      alert('대기 신청이 취소되었습니다.');
    } else {
      const allApplications = JSON.parse(localStorage.getItem('applications')) || [];
      const filtered = allApplications.filter(app =>
        !(app.name === result.name && app.studentId === result.studentId && app.eventId === id)
      );
      localStorage.setItem('applications', JSON.stringify(filtered));
      alert('신청이 취소되었습니다.');
    }

    setResult(null);
    setIsEditing(false);
    setIsVerifyingCancel(false);
    setPasswordInput('');
  };

  // 수정 버튼 클릭 시 수정 모드로
  const handleEditClick = () => {
    setIsEditing(true);
  };

  // 수정 입력값 변경
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  // 수정 저장
  const handleSaveEdit = () => {
    if (!editData.password) {
      alert('비밀번호는 필수입니다.');
      return;
    }

    // 비밀번호 확인
    if (editData.password !== result.password) {
      alert('비밀번호가 올바르지 않습니다.');
      return;
    }

    // 수정 가능한 필드는 name, phone, password (studentId, eventId는 변경 불가)
    if (!editData.name || !editData.phone) {
      alert('이름과 전화번호를 모두 입력해주세요.');
      return;
    }

    if (result.isWaiting) {
      const waitingList = JSON.parse(localStorage.getItem('waitingList')) || [];
      const updatedWaitingList = waitingList.map(app => {
        if (app.name === result.name && app.studentId === result.studentId && app.eventId === id) {
          return {
            ...app,
            name: editData.name,
            phone: editData.phone,
            password: editData.password,
          };
        }
        return app;
      });
      localStorage.setItem('waitingList', JSON.stringify(updatedWaitingList));
      alert('대기자 정보가 수정되었습니다.');
      setResult({ ...result, ...editData });
    } else {
      const allApplications = JSON.parse(localStorage.getItem('applications')) || [];
      const updatedApps = allApplications.map(app => {
        if (app.name === result.name && app.studentId === result.studentId && app.eventId === id) {
          return {
            ...app,
            name: editData.name,
            phone: editData.phone,
            password: editData.password,
          };
        }
        return app;
      });
      localStorage.setItem('applications', JSON.stringify(updatedApps));
      alert('신청 정보가 수정되었습니다.');
      setResult({ ...result, ...editData });
    }
    setIsEditing(false);
  };

  // 취소 수정 모드
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
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
        <button onClick={handleApplyClick}>신청</button>
      </div>
      <div>
        <input
          name="name"
          placeholder="이름"
          value={query.name}
          onChange={handleInputChange}
        />
        <input
          name="studentId"
          placeholder="학번"
          value={query.studentId}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <button onClick={handleQuery}>조회</button>
      </div>

      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>신청 정보</h3>
          {isEditing ? (
            <div>
              <div>
                <label>
                  이름: 
                  <input
                    name="name"
                    value={editData.name}
                    onChange={handleEditChange}
                  />
                </label>
              </div>
              <div>
                <label>
                  학번: 
                  <input name="studentId" value={editData.studentId} disabled />
                </label>
              </div>
              <div>
                <label>
                  전화번호: 
                  <input
                    name="phone"
                    value={editData.phone}
                    onChange={handleEditChange}
                  />
                </label>
              </div>
              <div>
                <label>
                  비밀번호:
                  <input
                    type="password"
                    name="password"
                    value={editData.password}
                    onChange={handleEditChange}
                  />
                </label>
              </div>
              <button onClick={handleSaveEdit}>저장</button>
              <button onClick={handleCancelEdit}>취소</button>
            </div>
          ) : (
            <div>
              <p>이름: {result.name}</p>
              <p>학번: {result.studentId}</p>
              <p>전화번호: {result.phone}</p>
              <p>{result.isWaiting ? `대기자 번호: ${result.waitingNumber}` : '신청 완료'}</p>
              <button onClick={handleEditClick}>수정</button>
              <button onClick={handleCancelClick}>취소</button>
            </div>
          )}

          {isVerifyingCancel && (
            <div style={{ marginTop: '10px' }}>
              <input
                type="password"
                placeholder="비밀번호 입력"
                value={passwordInput}
                onChange={handlePasswordInputChange}
              />
              <button onClick={handleConfirmCancel}>취소 확정</button>
              <button onClick={() => setIsVerifyingCancel(false)}>취소</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EventDetail;


