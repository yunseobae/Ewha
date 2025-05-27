import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function ApplicationForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    phone: '',
    schoolType: '',
    dormitoryStatus: '',
    dormitoryPhone: '',
    password: '',
  });

  const [isClosed, setIsClosed] = useState(false);
  const [waitingNumber, setWaitingNumber] = useState(null);

  useEffect(() => {
    const closed = localStorage.getItem('applicationsClosed') === 'true';
    setIsClosed(closed);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isClosed) {
      alert('현재 신청이 마감되었습니다. 관리자에게 문의해주세요.');
      return;
    }

    if (
      !formData.name ||
      !formData.studentId ||
      !formData.phone ||
      !formData.schoolType ||
      !formData.password
    ) {
      alert('모든 정보를 입력해주세요. (비밀번호 포함)');
      return;
    }

    if (
      (formData.dormitoryStatus === '기숙사' || formData.dormitoryStatus === '야자') &&
      !formData.dormitoryPhone
    ) {
      alert('기숙사 또는 야자 번호를 입력해주세요.');
      return;
    }

    const applications = JSON.parse(localStorage.getItem('applications')) || [];
    const waitingList = JSON.parse(localStorage.getItem('waitingList')) || [];
    const maxCapacity = parseInt(localStorage.getItem('maxCapacity'), 10) || 50;

    if (applications.find((app) => app.studentId === formData.studentId)) {
      alert('이미 신청하셨습니다.');
      return;
    }

    if (waitingList.find((app) => app.studentId === formData.studentId)) {
      alert('이미 대기자로 등록되어 있습니다.');
      return;
    }

    const newApplicant = {
      ...formData,
      eventId: id || '',
      timestamp: Date.now(),
    };

    if (applications.length < maxCapacity) {
      // 정원 내 신청 가능
      const updatedApps = [...applications, newApplicant];
      localStorage.setItem('applications', JSON.stringify(updatedApps));
      alert('신청이 완료되었습니다. 감사합니다!');
      navigate('/'); // 혹은 다른 페이지로 이동
    } else {
      // 정원 초과, 대기자 명단에 추가
      const updatedWaiting = [...waitingList, newApplicant];
      localStorage.setItem('waitingList', JSON.stringify(updatedWaiting));
      const waitNum = updatedWaiting.length;
      setWaitingNumber(waitNum);
      alert(`정원이 초과되어 대기자로 등록되었습니다. 대기 번호: ${waitNum}`);
    }
  };

  return (
    <div>
      <h2>신청서 작성</h2>
      {isClosed ? (
        <p>현재 신청이 마감되었습니다.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div>
            <label>
              이름:
              <input name="name" value={formData.name} onChange={handleChange} required />
            </label>
          </div>
          <div>
            <label>
              학번:
              <input name="studentId" value={formData.studentId} onChange={handleChange} required />
            </label>
          </div>
          <div>
            <label>
              전화번호:
              <input name="phone" value={formData.phone} onChange={handleChange} required />
            </label>
          </div>
          <div>
            <label>
              학교 구분:
              <select name="schoolType" value={formData.schoolType} onChange={handleChange} required>
                <option value="">선택하세요</option>
                <option value="이화여고">이화여고</option>
                <option value="이화외고">이화외고</option>
                <option value="졸업생">졸업생</option>
                <option value="기타">기타</option>
              </select>
            </label>
          </div>
          <div>
            <label>
              기숙사/야자 구분:
              <select name="dormitoryStatus" value={formData.dormitoryStatus} onChange={handleChange}>
                <option value="">선택하세요</option>
                <option value="기숙사">기숙사</option>
                <option value="야자">야자</option>
                <option value="해당없음">해당없음</option>
              </select>
            </label>
          </div>
          {(formData.dormitoryStatus === '기숙사' || formData.dormitoryStatus === '야자') && (
            <div>
              <label>
                기숙사/야자 번호:
                <input
                  name="dormitoryPhone"
                  value={formData.dormitoryPhone}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>
          )}
          <div>
            <label>
              비밀번호 (취소/수정 시 필요):
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </label>
          </div>
          <button type="submit">신청하기</button>
        </form>
      )}
      {waitingNumber !== null && (
        <p style={{ marginTop: '20px', color: 'red' }}>
          현재 정원이 초과되어 대기자로 등록되었습니다. 대기 번호는 {waitingNumber}번입니다.
        </p>
      )}
    </div>
  );
}

export default ApplicationForm;

