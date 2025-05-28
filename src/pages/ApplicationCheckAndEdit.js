// src/components/ApplicationCheckAndEdit.js
import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore'; // deleteDoc, orderBy 추가
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Paper,
  FormControl, // 추가: 학교 구분 드롭다운용
  InputLabel, // 추가: 학교 구분 드롭다운용
  Select, // 추가: 학교 구분 드롭다운용
  MenuItem, // 추가: 학교 구분 드롭다운용
  Dialog, // 추가: 비밀번호 확인 팝업용
  DialogActions, DialogContent, DialogContentText, DialogTitle // 추가: 비밀번호 확인 팝업용
} from '@mui/material';
import { useNavigate } from 'react-router-dom'; // useParams도 필요하다면 추가 (현재 이 컴포넌트에서는 사용하지 않음)

function ApplicationCheckAndEdit() {
  const navigate = useNavigate(); // 라우팅을 위해 useNavigate 훅 사용
  // const { id } = useParams(); // 만약 특정 이벤트의 신청만 조회한다면 필요. 현재는 전체 신청 조회이므로 주석 처리.

  // 검색 폼 상태: 이름과 학번 입력 받음
  const [queryData, setQueryData] = useState({ name: '', studentId: '' });

  // 조회된 신청/대기 내역 저장
  const [result, setResult] = useState(null); // application 대신 result로 이름 변경 (더 포괄적)

  // 수정 폼 상태: 조회된 정보를 기반으로 사용자 수정 입력을 받음
  const [editFormData, setEditFormData] = useState({
    name: '',
    studentId: '', // 학번은 보통 수정 불가능하게 하지만, 여기서는 폼에 포함
    phone: '',
    schoolType: '', // 학교 구분 추가
    dormitoryStatus: '해당없음', // 기숙사/야자 구분 추가
    dormitoryPhone: '', // 기숙사/야자 번호 추가
    password: '', // 수정 시 본인 인증용으로 다시 입력받을 비밀번호 필드
  });

  // 비밀번호 재확인 팝업용 상태
  const [passwordInput, setPasswordInput] = useState('');
  const [isVerifyingCancel, setIsVerifyingCancel] = useState(false); // 취소 시 비밀번호 확인 팝업

  // UI 상태 관리
  const [loading, setLoading] = useState(false); // 데이터 로딩/처리 중 상태
  const [error, setError] = useState('');       // 오류 메시지
  const [success, setSuccess] = useState('');   // 성공 메시지
  const [isEditing, setIsEditing] = useState(false); // 현재 수정 모드인지 여부


  // --- 검색 폼 핸들러 ---
  const handleQueryInputChange = (e) => {
    const { name, value } = e.target;
    setQueryData((prev) => ({ ...prev, [name]: value }));
    setError(''); // 입력 변경 시 에러 메시지 초기화
    setSuccess(''); // 입력 변경 시 성공 메시지 초기화
  };

  // --- 조회 함수 (이전 EventDetail에서 이리로 이동) ---
  const handleQuery = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setResult(null); // 이전 결과 초기화

    if (!queryData.name || !queryData.studentId) {
      setError('이름과 학번을 모두 입력해주세요.');
      setLoading(false);
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
        // where('eventId', '==', id) // 특정 이벤트만 조회한다면 이 주석 해제. 현재는 전체 조회.
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
          // where('eventId', '==', id) // 특정 이벤트만 조회한다면 이 주석 해제. 현재는 전체 조회.
        );
        const waitingListSnapshot = await getDocs(waitingListQuery);

        if (!waitingListSnapshot.empty) {
          foundApp = { id: waitingListSnapshot.docs[0].id, ...waitingListSnapshot.docs[0].data() };
          isWaiting = true;

          // 대기 번호 계산 (Cloud Functions로 하는 것이 더 정확하지만, 클라이언트에서 임시 구현)
          const allWaitingSnapshot = await getDocs(
            query(collection(db, 'waitingList'), orderBy('timestamp', 'asc'))
          );
          const allWaiting = allWaitingSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          const foundIndex = allWaiting.findIndex((app) => app.id === foundApp.id);
          waitingNumber = foundIndex !== -1 ? foundIndex + 1 : null;
        }
      }

      if (foundApp) {
        setResult({ ...foundApp, isWaiting, waitingNumber });
        // 수정 폼에 데이터 채우기 (비밀번호는 보안상 비워둠)
        setEditFormData({
          name: foundApp.name,
          studentId: foundApp.studentId,
          phone: foundApp.phone,
          schoolType: foundApp.schoolType || '', // 불러온 데이터가 없으면 빈 문자열
          dormitoryStatus: foundApp.dormitoryStatus || '해당없음',
          dormitoryPhone: foundApp.dormitoryPhone || '',
          password: foundApp.password || '', // 비밀번호는 초기 데이터로 채워서 재확인용으로 쓸 수 있도록
        });
        setIsEditing(false); // 조회 후에는 수정 모드 아님
        setIsVerifyingCancel(false); // 취소 팝업 닫기
        setPasswordInput(''); // 비밀번호 입력 초기화
        setSuccess('신청 내역을 성공적으로 조회했습니다.');
      } else {
        setError('신청 내역을 찾을 수 없습니다. 이름과 학번을 다시 확인해주세요.');
        setResult(null); // 결과 초기화
        setIsEditing(false); // 수정 모드 해제
        setIsVerifyingCancel(false); // 취소 팝업 닫기
        setPasswordInput(''); // 비밀번호 입력 초기화
      }
    } catch (err) {
      console.error('조회 중 오류 발생:', err);
      setError('신청 내역을 조회하는 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 새로운 신청 페이지로 이동 ---
  const handleApplyClick = () => {
    // EventDetail에서 전달받은 eventId가 있다면 사용. 없다면 일반 신청 페이지로.
    // 현재 ApplicationCheckAndEdit에서는 useParams로 id를 받지 않으므로, 이 버튼은 일반 신청 페이지로 이동.
    navigate(`/apply`); // 또는 `/apply/${result?.eventId}` 처럼 특정 이벤트에 연결
  };


  // --- 취소 기능 ---
  const handleCancelClick = () => {
    if (!result) return;
    setIsVerifyingCancel(true); // 비밀번호 확인 팝업 열기
    setPasswordInput(''); // 비밀번호 입력 필드 초기화
    setError(''); // 에러 메시지 초기화
  };

  const handlePasswordInputChange = (e) => {
    setPasswordInput(e.target.value);
    setError(''); // 입력 변경 시 에러 초기화
  };

  const handleConfirmCancel = async () => {
    if (!passwordInput) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    // 클라이언트 측 비밀번호 검증 (보안 규칙에서 다시 검증되지만, 사용자 편의를 위해)
    if (passwordInput !== result.password) {
      setError('비밀번호가 올바르지 않습니다.');
      return;
    }

    if (window.confirm('신청/대기 내역을 정말 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        const collectionName = result.isWaiting ? 'waitingList' : 'applications';
        await deleteDoc(doc(db, collectionName, result.id));

        setSuccess('신청/대기 내역이 성공적으로 취소되었습니다.');
        setResult(null); // 결과 초기화
        setIsEditing(false); // 수정 모드 해제
        setIsVerifyingCancel(false); // 팝업 닫기
        setPasswordInput(''); // 비밀번호 입력 초기화
        // 폼 초기화 (선택 사항)
        setQueryData({ name: '', studentId: '' });
        setEditFormData({
          name: '', studentId: '', phone: '', schoolType: '',
          dormitoryStatus: '해당없음', dormitoryPhone: '', password: '',
        });
      } catch (err) {
        console.error('취소 처리 중 오류 발생:', err);
        setError('취소 중 오류가 발생했습니다: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };


  // --- 수정 기능 ---
  const handleEditClick = () => {
    setIsEditing(true); // 수정 모드 진입
    setIsVerifyingCancel(false); // 혹시 열려있을 수도 있는 취소 팝업 닫기
    // 수정 폼에 현재 조회된 데이터를 채움
    setEditFormData({
      name: result.name,
      studentId: result.studentId,
      phone: result.phone,
      schoolType: result.schoolType || '',
      dormitoryStatus: result.dormitoryStatus || '해당없음',
      dormitoryPhone: result.dormitoryPhone || '',
      password: result.password || '', // 비밀번호를 폼에 채워서 재확인용으로 사용
    });
    setError(''); // 에러 초기화
    setSuccess(''); // 성공 메시지 초기화
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
    setError(''); // 입력 변경 시 에러 초기화
    setSuccess(''); // 성공 메시지 초기화
  };

  const handleSaveEdit = async () => {
    setError('');
    setSuccess('');

    // 필수 필드 유효성 검사 (학번은 disabled이므로 여기서 검사할 필요 없음)
    if (!editFormData.name || !editFormData.phone || !editFormData.schoolType || !editFormData.password) {
      setError('이름, 전화번호, 학교 구분, 비밀번호는 필수 입력 항목입니다.');
      return;
    }

    // 이화여고 특정 필드 유효성 검사
    if (
      editFormData.schoolType === '이화여고' &&
      (editFormData.dormitoryStatus === '기숙사' || editFormData.dormitoryStatus === '야자') &&
      !editFormData.dormitoryPhone
    ) {
      setError('기숙사 또는 야자 번호를 입력해주세요.');
      return;
    }

    // 비밀번호가 기존 비밀번호와 일치하는지 클라이언트에서 검증
    if (editFormData.password !== result.password) {
      setError('현재 비밀번호가 올바르지 않습니다. 다시 확인해주세요.');
      return;
    }

    if (window.confirm('수정된 정보를 저장하시겠습니까?')) {
      setLoading(true);
      try {
        const collectionName = result.isWaiting ? 'waitingList' : 'applications';
        const docRef = doc(db, collectionName, result.id);

        // 업데이트할 데이터 (보안 규칙에 따라 변경 가능한 필드만 포함)
        const updatedData = {
          name: editFormData.name,
          phone: editFormData.phone,
          schoolType: editFormData.schoolType,
          dormitoryStatus: editFormData.schoolType === '이화여고' ? editFormData.dormitoryStatus : '해당없음',
          dormitoryPhone: editFormData.schoolType === '이화여고' ? editFormData.dormitoryPhone : '',
          password: editFormData.password, // 보안 규칙이 이 비밀번호를 기존 DB 비밀번호와 비교함
          // 학번, 이벤트ID, 타임스탬프는 변경되지 않도록 포함 (필수)
          studentId: result.studentId,
          eventId: result.eventId,
          timestamp: result.timestamp,
        };

        await updateDoc(docRef, updatedData);

        setSuccess('정보가 성공적으로 수정되었습니다.');
        // 수정된 정보를 화면에 바로 반영
        setResult((prevResult) => ({
          ...prevResult,
          ...updatedData, // 모든 변경된 필드 반영 (비밀번호도 포함)
        }));
        setIsEditing(false); // 수정 모드 해제
      } catch (err) {
        console.error('수정 처리 중 오류 발생:', err);
        setError('정보를 수정하는 중 오류가 발생했습니다: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false); // 수정 모드 취소
    // 폼 데이터를 원래 조회된 데이터로 되돌림
    setEditFormData({
      name: result.name,
      studentId: result.studentId,
      phone: result.phone,
      schoolType: result.schoolType || '',
      dormitoryStatus: result.dormitoryStatus || '해당없음',
      dormitoryPhone: result.dormitoryPhone || '',
      password: result.password || '',
    });
    setError(''); // 에러 초기화
    setSuccess(''); // 성공 메시지 초기화
  };


  // --- UI 렌더링 ---
  return (
    <Container component="main" maxWidth="md" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          신청 조회 및 관리
        </Typography>

        {/* 오류 및 성공 메시지 알림 */}
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* 새로운 신청하기 버튼 */}
        <Box sx={{ mb: 3, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Button variant="contained" onClick={handleApplyClick} size="large">
            새로 신청하기
          </Button>
        </Box>

        <Typography component="h2" variant="h6" sx={{ mt: 2, mb: 2 }}>
          내 신청 정보 조회
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, width: '100%', justifyContent: 'center' }}>
          <TextField
            name="name"
            label="이름"
            placeholder="이름"
            value={queryData.name}
            onChange={handleQueryInputChange}
            variant="outlined"
            size="small"
            sx={{ flexGrow: 1 }}
          />
          <TextField
            name="studentId"
            label="학번"
            placeholder="학번"
            value={queryData.studentId}
            onChange={handleQueryInputChange}
            variant="outlined"
            size="small"
            sx={{ flexGrow: 1 }}
          />
          <Button variant="contained" onClick={handleQuery} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : '조회'}
          </Button>
        </Box>

        {/* 조회 결과 표시 영역 */}
        {result && (
          <Paper
            elevation={2}
            sx={{
              mt: 3,
              p: 3,
              width: '100%',
              backgroundColor: result.isWaiting ? '#fff3e0' : '#e8f5e9', // Light orange for waiting, light green for applied
            }}
          >
            <Typography variant="h6" gutterBottom>
              조회된 신청 정보
            </Typography>
            {isEditing ? (
              // 수정 폼
              <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="이름"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditChange}
                  required
                />
                <TextField
                  fullWidth
                  label="학번"
                  name="studentId"
                  value={editFormData.studentId}
                  disabled // 학번은 수정 불가능하도록 비활성화
                  sx={{ '.MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)' } }} // 비활성화된 텍스트 색상 유지
                />
                <TextField
                  fullWidth
                  label="전화번호"
                  name="phone"
                  value={editFormData.phone}
                  onChange={handleEditChange}
                  required
                />
                {/* 학교 구분 드롭다운 */}
                <FormControl fullWidth>
                  <InputLabel id="edit-schoolType-label">학교 구분</InputLabel>
                  <Select
                    labelId="edit-schoolType-label"
                    id="edit-schoolType"
                    name="schoolType"
                    value={editFormData.schoolType}
                    label="학교 구분"
                    onChange={handleEditChange}
                    required
                  >
                    <MenuItem value="">선택하세요</MenuItem>
                    <MenuItem value="이화여고">이화여고</MenuItem>
                    <MenuItem value="이화외고">이화외고</MenuItem>
                    <MenuItem value="졸업생">졸업생</MenuItem>
                    <MenuItem value="기타">기타</MenuItem>
                  </Select>
                </FormControl>

                {/* 이화여고일 때 기숙사/야자 필드 */}
                {editFormData.schoolType === '이화여고' && (
                  <>
                    <FormControl fullWidth>
                      <InputLabel id="edit-dormitoryStatus-label">기숙사/야자 구분</InputLabel>
                      <Select
                        labelId="edit-dormitoryStatus-label"
                        id="edit-dormitoryStatus"
                        name="dormitoryStatus"
                        value={editFormData.dormitoryStatus}
                        label="기숙사/야자 구분"
                        onChange={handleEditChange}
                      >
                        <MenuItem value="">선택하세요</MenuItem>
                        <MenuItem value="기숙사">기숙사</MenuItem>
                        <MenuItem value="야자">야자</MenuItem>
                        <MenuItem value="해당없음">해당없음</MenuItem>
                      </Select>
                    </FormControl>

                    {(editFormData.dormitoryStatus === '기숙사' || editFormData.dormitoryStatus === '야자') && (
                      <TextField
                        fullWidth
                        label="기숙사/야자 번호"
                        name="dormitoryPhone"
                        value={editFormData.dormitoryPhone}
                        onChange={handleEditChange}
                        type="tel"
                        required
                      />
                    )}
                  </>
                )}

                <TextField
                  fullWidth
                  label="비밀번호"
                  type="password"
                  name="password"
                  value={editFormData.password}
                  onChange={handleEditChange}
                  required
                  helperText="수정을 위해 현재 비밀번호를 다시 입력해주세요."
                />
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button variant="contained" onClick={handleSaveEdit} disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : '저장'}
                  </Button>
                  <Button variant="outlined" onClick={handleCancelEdit} disabled={loading}>
                    수정 취소
                  </Button>
                </Box>
              </Box>
            ) : (
              // 조회된 정보 표시
              <Box>
                <Typography variant="body1">
                  <strong>이름:</strong> {result.name}
                </Typography>
                <Typography variant="body1">
                  <strong>학번:</strong> {result.studentId}
                </Typography>
                <Typography variant="body1">
                  <strong>전화번호:</strong> {result.phone}
                </Typography>
                <Typography variant="body1">
                  <strong>상태:</strong>{' '}
                  {result.isWaiting
                    ? `대기자 (대기 번호: ${result.waitingNumber}번)`
                    : '신청 완료'}
                </Typography>
                {result.schoolType && (
                  <Typography variant="body1">
                    <strong>학교 구분:</strong> {result.schoolType}
                  </Typography>
                )}
                {result.dormitoryStatus && result.dormitoryStatus !== '해당없음' && (
                  <Typography variant="body1">
                    <strong>기숙사/야자:</strong> {result.dormitoryStatus}
                  </Typography>
                )}
                {result.dormitoryPhone && (
                  <Typography variant="body1">
                    <strong>기숙사/야자 번호:</strong> {result.dormitoryPhone}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  <strong>신청 시간:</strong> {new Date(result.timestamp).toLocaleString()}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <Button variant="outlined" onClick={handleEditClick}>
                    수정
                  </Button>
                  <Button variant="contained" color="error" onClick={handleCancelClick}>
                    취소
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        )}

        {/* 비밀번호 확인 다이얼로그 (취소 시 사용) */}
        <Dialog
          open={isVerifyingCancel}
          onClose={() => setIsVerifyingCancel(false)}
          aria-labelledby="cancel-dialog-title"
          aria-describedby="cancel-dialog-description"
        >
          <DialogTitle id="cancel-dialog-title">{'신청/대기 내역 취소'}</DialogTitle>
          <DialogContent>
            <DialogContentText id="cancel-dialog-description">
              취소하려면 비밀번호를 다시 입력해주세요.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="cancel-password-input"
              label="비밀번호"
              type="password"
              fullWidth
              variant="standard"
              value={passwordInput}
              onChange={handlePasswordInputChange}
              error={!!error && passwordInput !== result?.password} // 에러 상태 표시
            />
            {error && (
              <Typography color="error" variant="caption" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsVerifyingCancel(false)}>취소</Button>
            <Button onClick={handleConfirmCancel} color="error" autoFocus disabled={loading}>
              {loading ? <CircularProgress size={24} /> : '취소 확정'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
}

export default ApplicationCheckAndEdit;