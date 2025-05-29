import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase'; // Firebase 설정 파일 경로에 맞게 수정
import {
  collection,
  addDoc,
  getDoc,
  doc, // settings를 가져오기 위해 필요
  getDocs, // 중복 체크를 위해 필요
  query,
  where,
  orderBy,
} from 'firebase/firestore';

// Material-UI Imports
import {
  Container,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';

function ApplicationForm() {
  const { id } = useParams(); // 이벤트 ID를 URL 파라미터에서 가져옴 (필요시 사용)
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    phone: '',
    schoolType: '',
    dormitoryStatus: '해당없음', // 기본값 설정
    dormitoryPhone: '',
    password: '',
  });

  const [isClosed, setIsClosed] = useState(false);
  const [maxCapacity, setMaxCapacity] = useState(50);
  const [waitingNumber, setWaitingNumber] = useState(null);
  const [loading, setLoading] = useState(true); // 초기 설정 로딩 상태
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. 초기 설정 (isClosed, maxCapacity) 로딩 로직 유지
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRef = doc(db, 'settings', 'appSettings');
        const docSnap = await getDoc(settingsRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsClosed(data.isClosed !== undefined ? data.isClosed : false);
          setMaxCapacity(data.maxCapacity || 50);
        } else {
          console.log('No appSettings document found. Using default values.');
          setIsClosed(false);
          setMaxCapacity(50);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('설정 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(''); // Clear errors on change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 신청 마감 여부 확인
    if (isClosed) {
      setError('현재 신청이 마감되었습니다. 관리자에게 문의해주세요.');
      return;
    }

    // 필수 필드 유효성 검사 (기존 로직 유지)
    if (
      !formData.name ||
      !formData.studentId ||
      !formData.phone ||
      !formData.schoolType ||
      !formData.password
    ) {
      setError('이름, 학번, 전화번호, 학교 구분, 비밀번호는 필수 입력 항목입니다.');
      return;
    }

    // 이화여고 특정 필드 유효성 검사 (기존 로직 유지)
    if (
      formData.schoolType === '이화여고' &&
      (formData.dormitoryStatus === '기숙사' || formData.dormitoryStatus === '야자') &&
      !formData.dormitoryPhone
    ) {
      setError('기숙사 또는 야자 번호를 입력해주세요.');
      return;
    }

    // Firebase에 저장할 데이터 구성 (기존 로직 유지)
    const applicationData = {
      name: formData.name,
      studentId: formData.studentId,
      phone: formData.phone,
      schoolType: formData.schoolType,
      dormitoryStatus: formData.schoolType === '이화여고' ? formData.dormitoryStatus : '해당없음',
      dormitoryPhone: formData.schoolType === '이화여고' ? formData.dormitoryPhone : '',
      password: formData.password, // Consider hashing this for security
      eventId: id || '', // URL 파라미터에서 가져온 이벤트 ID 사용
      timestamp: Date.now(),
    };

    try {
      // 2. 중복 신청/대기자 체크 로직 유지
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('studentId', '==', formData.studentId)
      );
      const existingApplications = await getDocs(applicationsQuery);

      if (!existingApplications.empty) {
        setError('이미 신청하셨습니다. 신청 내역을 확인해주세요.');
        return;
      }

      const waitingListQuery = query(
        collection(db, 'waitingList'),
        where('studentId', '==', formData.studentId)
      );
      const existingWaitingList = await getDocs(waitingListQuery);

      if (!existingWaitingList.empty) {
        setError('이미 대기자로 등록되어 있습니다. 대기 내역을 확인해주세요.');
        return;
      }

      // 3. 정원 확인 및 신청/대기자 등록 로직 유지
      const currentApplicationsSnapshot = await getDocs(collection(db, 'applications'));
      const currentApplicationsCount = currentApplicationsSnapshot.docs.length;

      if (currentApplicationsCount < maxCapacity) {
        await addDoc(collection(db, 'applications'), applicationData);
        setSuccess('신청이 완료되었습니다. 감사합니다!');
        setFormData({ // 폼 초기화
          name: '', studentId: '', phone: '', schoolType: '',
          dormitoryStatus: '해당없음', dormitoryPhone: '', password: '',
        });
        setTimeout(() => navigate('/'), 2000); // Navigate after a short delay
      } else {
        const addedDocRef = await addDoc(collection(db, 'waitingList'), applicationData);

        const currentWaitingListSnapshot = await getDocs(
          query(collection(db, 'waitingList'), orderBy('timestamp', 'asc'))
        );
        const currentWaitingList = currentWaitingListSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const addedIndex = currentWaitingList.findIndex((item) => item.id === addedDocRef.id);
        setWaitingNumber(addedIndex + 1);
        setSuccess('정원이 초과되어 대기자로 등록되었습니다.');
        setFormData({ // 폼 초기화
          name: '', studentId: '', phone: '', schoolType: '',
          dormitoryStatus: '해당없음', dormitoryPhone: '', password: '',
        });
        // 대기 등록 후 홈으로 이동하거나, 대기 번호 보여주는 페이지로 이동 고려
      }
    } catch (err) {
      console.error('신청 처리 중 오류 발생:', err);
      setError(`신청 중 오류가 발생했습니다: ${err.message}`);
    }
  };

  // 4. 로딩 스피너 UI 유지
  if (loading) {
    return (
      <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            설정 정보를 불러오는 중...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          이화의 밤 신청서 작성 {/* 제목 유지 */}
        </Typography>

        {/* 5. 오류/성공 메시지 UI 유지 */}
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
            {success}
            {waitingNumber !== null && ` 대기 번호는 ${waitingNumber}번입니다.`}
          </Alert>
        )}

        {/* 6. 신청 마감 여부에 따른 UI 분기 유지 */}
        {isClosed ? (
          <Typography variant="h6" color="error" align="center">
            현재 신청기간이 아닙니다다.
          </Typography>
        ) : (
          // 7. 신청 폼 UI만 남기고, 조회/수정 관련 UI 제거
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            {/* 기존의 모든 TextField, Select 등의 폼 요소는 그대로 유지 */}
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="이름"
              name="name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="studentId"
              label="학번"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              autoComplete="studentId"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="phone"
              label="전화번호"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              autoComplete="tel"
            />

            <FormControl fullWidth margin="normal" required>
              <InputLabel id="schoolType-label">소속</InputLabel>
              <Select
                labelId="schoolType-label"
                id="schoolType"
                name="schoolType"
                value={formData.schoolType}
                label="학교 구분"
                onChange={handleChange}
              >
                <MenuItem value="">선택하세요</MenuItem>
                <MenuItem value="이화여고">이화여고</MenuItem>
                <MenuItem value="이화외고">이화외고</MenuItem>
                <MenuItem value="졸업생">졸업생</MenuItem>
                <MenuItem value="기타">기타</MenuItem>
              </Select>
            </FormControl>

            {formData.schoolType === '이화여고' && (
              <>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="dormitoryStatus-label">기숙사/야자</InputLabel>
                  <Select
                    labelId="dormitoryStatus-label"
                    id="dormitoryStatus"
                    name="dormitoryStatus"
                    value={formData.dormitoryStatus}
                    label="기숙사/야자 구분"
                    onChange={handleChange}
                  >
                    <MenuItem value="">선택하세요</MenuItem>
                    <MenuItem value="기숙사">기숙사</MenuItem>
                    <MenuItem value="야자">야자</MenuItem>
                    <MenuItem value="해당없음">해당없음</MenuItem>
                  </Select>
                </FormControl>

                {(formData.dormitoryStatus === '기숙사' || formData.dormitoryStatus === '야자') && (
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="dormitoryPhone"
                    label="기숙사/야자 번호"
                    name="dormitoryPhone"
                    value={formData.dormitoryPhone}
                    onChange={handleChange}
                    type="tel"
                  />
                )}
              </>
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="비밀번호 (취소/수정 시 필요)"
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
            />

            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
              신청하기
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default ApplicationForm;