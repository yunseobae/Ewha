import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase'; // Firebase 설정 파일 경로에 맞게 수정
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';

function ApplicationForm() {
  const { id } = useParams(); // 이벤트 ID를 URL 파라미터에서 가져옴
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    phone: '',
    schoolType: '',
    // 이화여고가 아닌 경우 dormitoryStatus와 dormitoryPhone은 '해당없음' 또는 빈 값으로 초기화될 것입니다.
    dormitoryStatus: '해당없음', // 기본값 설정
    dormitoryPhone: '',
    password: '', // 신청 취소/수정 시 사용할 비밀번호
  });

  const [isClosed, setIsClosed] = useState(false);
  const [maxCapacity, setMaxCapacity] = useState(50); // Firestore에서 가져올 최대 인원
  const [waitingNumber, setWaitingNumber] = useState(null); // 대기 번호 (Firebase 연동 후 실시간으로 받기 어려움, 신청 완료 후 알림용)

  useEffect(() => {
    // 1. 신청 마감 여부 및 최대 인원 설정 불러오기
    const fetchSettings = async () => {
      try {
        const settingsRef = doc(db, 'settings', 'appSettings');
        const docSnap = await getDoc(settingsRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsClosed(data.isClosed !== undefined ? data.isClosed : false);
          setMaxCapacity(data.maxCapacity || 50);
        } else {
          // 설정 문서가 없으면 기본값 사용 (어드민 페이지에서 자동 생성될 것입니다)
          console.log("No appSettings document found. Using default values.");
          setIsClosed(false);
          setMaxCapacity(50);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        alert("설정 정보를 불러오는 중 오류가 발생했습니다.");
      }
    };

    fetchSettings();
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 폼 유효성 검사
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
      alert('이름, 학번, 전화번호, 학교 구분, 비밀번호는 필수 입력 항목입니다.');
      return;
    }

    // 이화여고이면서 기숙사 또는 야자 선택 시 기숙사/야자 번호 필수 검사
    if (
      formData.schoolType === '이화여고' &&
      (formData.dormitoryStatus === '기숙사' || formData.dormitoryStatus === '야자') &&
      !formData.dormitoryPhone
    ) {
      alert('기숙사 또는 야자 번호를 입력해주세요.');
      return;
    }

    // 폼 데이터 준비 (불필요한 필드는 제거하거나 기본값 설정)
    const applicationData = {
      name: formData.name,
      studentId: formData.studentId,
      phone: formData.phone,
      schoolType: formData.schoolType,
      // 이화여고가 아니면 dormitoryStatus와 dormitoryPhone을 '해당없음' 또는 빈 값으로 처리
      dormitoryStatus: formData.schoolType === '이화여고' ? formData.dormitoryStatus : '해당없음',
      dormitoryPhone: formData.schoolType === '이화여고' ? formData.dormitoryPhone : '',
      password: formData.password, // 비밀번호는 Firestore에 저장 (보안 상 해싱 권장)
      eventId: id || '', // URL 파라미터에서 가져온 이벤트 ID
      timestamp: Date.now(), // 신청 시간 기록
    };

    try {
      // 1. 이미 신청했는지, 대기자로 등록되어 있는지 확인
      // 학번으로 중복 신청 확인 (applications 컬렉션)
      const applicationsQuery = query(collection(db, 'applications'), where('studentId', '==', formData.studentId));
      const existingApplications = await getDocs(applicationsQuery);

      if (!existingApplications.empty) {
        alert('이미 신청하셨습니다. 신청 내역을 확인해주세요.');
        return;
      }

      // 학번으로 중복 대기자 등록 확인 (waitingList 컬렉션)
      const waitingListQuery = query(collection(db, 'waitingList'), where('studentId', '==', formData.studentId));
      const existingWaitingList = await getDocs(waitingListQuery);

      if (!existingWaitingList.empty) {
        alert('이미 대기자로 등록되어 있습니다. 대기 내역을 확인해주세요.');
        return;
      }

      // 2. 현재 신청 인원 확인 (applications 컬렉션의 문서 수)
      const currentApplicationsSnapshot = await getDocs(collection(db, 'applications'));
      const currentApplicationsCount = currentApplicationsSnapshot.docs.length;

      if (currentApplicationsCount < maxCapacity) {
        // 정원 내 신청 가능: applications 컬렉션에 추가
        await addDoc(collection(db, 'applications'), applicationData);
        alert('신청이 완료되었습니다. 감사합니다!');
        navigate('/'); // 신청 완료 후 이동할 페이지
      } else {
        // 정원 초과: waitingList 컬렉션에 추가
        const addedDocRef = await addDoc(collection(db, 'waitingList'), applicationData);

        // 대기 번호 계산 (Firestore의 대기자 목록을 실시간으로 가져와서 계산)
        const currentWaitingListSnapshot = await getDocs(query(collection(db, 'waitingList'), orderBy('timestamp', 'asc')));
        const currentWaitingList = currentWaitingListSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // 현재 추가된 문서가 대기 목록에서 몇 번째인지 찾기
        const addedIndex = currentWaitingList.findIndex(item => item.id === addedDocRef.id);
        setWaitingNumber(addedIndex + 1); // 0부터 시작하므로 +1

        alert(`정원이 초과되어 대기자로 등록되었습니다.`);
        // 대기 번호를 표시하기 위해 페이지를 유지하거나 다른 페이지로 이동
      }

      // 폼 초기화
      setFormData({
        name: '',
        studentId: '',
        phone: '',
        schoolType: '',
        dormitoryStatus: '해당없음',
        dormitoryPhone: '',
        password: '',
      });

    } catch (error) {
      console.error('신청 처리 중 오류 발생:', error);
      alert('신청 중 오류가 발생했습니다: ' + error.message);
    }
  };

  return (
    <div>
      <h2>신청서 작성</h2>
      {isClosed ? (
        <p style={{ color: 'red', fontWeight: 'bold' }}>현재 신청이 마감되었습니다.</p>
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
          {/* '이화여고' 선택 시에만 기숙사/야자 구분 필드 표시 */}
          {formData.schoolType === '이화여고' && (
            <>
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
                      type="text" // 전화번호 형식이므로 text 또는 tel
                      name="dormitoryPhone"
                      value={formData.dormitoryPhone}
                      onChange={handleChange}
                      required // 필수 필드
                    />
                  </label>
                </div>
              )}
            </>
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
        <p style={{ marginTop: '20px', color: 'red', fontWeight: 'bold' }}>
          현재 정원이 초과되어 대기자로 등록되었습니다. 대기 번호는 {waitingNumber}번입니다.
        </p>
      )}
    </div>
  );
}

export default ApplicationForm;