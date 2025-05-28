// src/pages/AdminPage.js

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
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

// Material-UI 컴포넌트 임포트
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper, // 카드나 섹션을 위한 배경
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton, // 아이콘 버튼
  Alert, // 알림 메시지
  CircularProgress // 로딩 스피너
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete'; // 삭제 아이콘
import DownloadIcon from '@mui/icons-material/Download'; // 다운로드 아이콘
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // 상태 아이콘
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'; // 상태 아이콘

function AdminPage() {
  const [applications, setApplications] = useState([]);
  const [waitingList, setWaitingList] = useState([]);
  const [maxCapacity, setMaxCapacity] = useState(50);
  const [selectedSchool, setSelectedSchool] = useState('all');
  const [selectedDormType, setSelectedDormType] = useState('all');
  const [searchName, setSearchName] = useState('');
  const [isClosed, setIsClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(''); // 작업 성공/실패 메시지

  const [settingsDocRef, setSettingsDocRef] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribeApps = onSnapshot(query(collection(db, 'applications'), orderBy('timestamp', 'asc')), (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApplications(apps);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching applications:", err);
      setError("신청자 목록을 불러오는 데 실패했습니다.");
      setLoading(false);
    });

    const unsubscribeWaiting = onSnapshot(query(collection(db, 'waitingList'), orderBy('timestamp', 'asc')), (snapshot) => {
      const waiting = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWaitingList(waiting);
    }, (err) => {
      console.error("Error fetching waiting list:", err);
      setError("대기자 목록을 불러오는 데 실패했습니다.");
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
    }, (err) => {
      console.error("Error fetching settings:", err);
      setError("설정 정보를 불러오는 데 실패했습니다.");
    });

    return () => {
      unsubscribeApps();
      unsubscribeWaiting();
      unsubscribeSettings();
    };
  }, []);

  // 메시지 초기화 useEffect
  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => {
        setActionMessage('');
      }, 3000); // 3초 후 메시지 사라짐
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);


  const handleCancel = async (appToCancel, fromWaiting = false) => {
    if (window.confirm('이 신청을 정말 취소하시겠습니까?')) {
      try {
        if (fromWaiting) {
          await deleteDoc(doc(db, 'waitingList', appToCancel.id));
          setActionMessage('success: 대기 신청이 성공적으로 취소되었습니다.');
        } else {
          await deleteDoc(doc(db, 'applications', appToCancel.id));
          setActionMessage('success: 신청이 성공적으로 취소되었습니다.');

          if (waitingList.length > 0) {
            const nextApplicant = waitingList[0];
            await deleteDoc(doc(db, 'waitingList', nextApplicant.id));

            const { id, ...dataToMove } = nextApplicant;

            await addDoc(collection(db, 'applications'), {
              ...dataToMove,
              movedFromWaiting: true,
              timestamp: Date.now()
            });
            setActionMessage(`success: ${nextApplicant.name}님을 대기 목록에서 신청 목록으로 이동했습니다.`);
          }
        }
      } catch (cancelError) {
        console.error('취소 처리 중 오류 발생:', cancelError);
        setActionMessage('error: 취소 중 오류가 발생했습니다: ' + cancelError.message);
      }
    }
  };

  const toggleClose = async () => {
    if (settingsDocRef) {
      try {
        await updateDoc(settingsDocRef, { isClosed: !isClosed });
        setActionMessage(`success: 신청 상태가 ${isClosed ? '오픈' : '마감'}되었습니다.`);
      } catch (toggleError) {
        console.error('신청 마감/오픈 상태 업데이트 중 오류 발생:', toggleError);
        setActionMessage('error: 상태 업데이트 중 오류가 발생했습니다: ' + toggleError.message);
      }
    }
  };

  const handleMaxCapacityChange = async (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0 && settingsDocRef) {
      try {
        await updateDoc(settingsDocRef, { maxCapacity: val });
        setActionMessage('success: 최대 인원 수가 성공적으로 업데이트되었습니다.');
      } catch (capacityError) {
        console.error('최대 인원 업데이트 중 오류 발생:', capacityError);
        setActionMessage('error: 최대 인원 업데이트 중 오류가 발생했습니다: ' + capacityError.message);
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

  const downloadAsExcel = (data, filename = '신청자_목록') => {
    const headers = [
      "이름", "학번", "전화번호", "학교 구분", "기숙사/야자",
      "기숙사/야자 번호", "이벤트 ID", "신청 시간"
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        [
          `"${row.name}"`,
          `"${row.studentId}"`,
          `"${row.phone}"`,
          `"${row.schoolType || '기타'}"`,
          `"${row.dormitoryStatus || '-'}"`,
          `"${row.dormitoryPhone || '-'}"`,
          `"${row.eventId || '-'}"`,
          `"${new Date(row.timestamp).toLocaleString()}"`
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
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
    <Box>
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
      {actionMessage && (
        <Alert
          severity={actionMessage.startsWith('success') ? 'success' : 'error'}
          sx={{ my: 2 }}
          icon={actionMessage.startsWith('success') ? <CheckCircleOutlineIcon /> : <ErrorOutlineIcon />}
        >
          {actionMessage.split(': ')[1]}
        </Alert>
      )}

      {/* 설정 섹션 */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          사이트 설정
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Button
              variant="contained"
              color={isClosed ? 'error' : 'primary'}
              onClick={toggleClose}
              sx={{ mr: 2 }}
            >
              {isClosed ? '신청 오픈하기' : '신청 마감하기'}
            </Button>
            <Typography variant="body1" component="span" sx={{ fontWeight: 'bold' }}>
              현재 상태: {isClosed ? '신청 마감됨' : '신청 중'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="최대 신청 인원 수"
              type="number"
              value={maxCapacity}
              onChange={handleMaxCapacityChange}
              inputProps={{ min: 1 }}
              sx={{ width: '180px', mr: 2 }}
              size="small"
            />
            <Typography variant="body1" component="span">
              현재 신청 인원: {applications.length}명 / 최대 {maxCapacity}명
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* 필터링 및 검색 섹션 */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          검색
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="이름으로 검색"
              variant="outlined"
              size="small"
              fullWidth
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>학교 구분</InputLabel>
              <Select
                value={selectedSchool}
                label="학교 구분"
                onChange={(e) => {
                  setSelectedSchool(e.target.value);
                  setSelectedDormType('all'); // 학교 변경 시 기숙사/야자 필터 초기화
                }}
              >
                {schools.map((school) => (
                  <MenuItem key={school} value={school}>
                    {school === 'all' ? '전체' : school}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {selectedSchool === '이화여고' && (
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>기숙사/야자 구분</InputLabel>
                <Select
                  value={selectedDormType}
                  label="기숙사/야자 구분"
                  onChange={(e) => setSelectedDormType(e.target.value)}
                >
                  {dormTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type === 'all' ? '전체' : type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* 신청자 목록 섹션 */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" gutterBottom component="h3" sx={{ mb: 0 }}>
            신청자 목록 ({filteredApplications.length}명)
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={() => downloadAsExcel(filteredApplications, '신청자_목록')}
          >
            엑셀 다운로드
          </Button>
        </Box>
        {filteredApplications.length === 0 ? (
          <Typography variant="body1" color="text.secondary">신청자가 없습니다.</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}> {/* 헤더 배경색 */}
                  <TableCell>이름</TableCell>
                  <TableCell>학번</TableCell>
                  <TableCell>전화번호</TableCell>
                  <TableCell>학교 구분</TableCell>
                  <TableCell>기숙사/야자</TableCell>
                  <TableCell>기숙사/야자 번호</TableCell>
                  <TableCell>신청 시간</TableCell>
                  <TableCell>취소</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>{app.name}</TableCell>
                    <TableCell>{app.studentId}</TableCell>
                    <TableCell>{app.phone}</TableCell>
                    <TableCell>{app.schoolType || '기타'}</TableCell>
                    <TableCell>{app.dormitoryStatus || '-'}</TableCell>
                    <TableCell>{app.dormitoryPhone || '-'}</TableCell>
                    <TableCell>{new Date(app.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <IconButton
                        aria-label="cancel"
                        color="error"
                        onClick={() => handleCancel(app, false)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* 대기자 목록 섹션 */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" gutterBottom component="h3" sx={{ mb: 0 }}>
            대기자 목록 ({filteredWaiting.length}명)
          </Typography>
          <Button
            variant="contained"
            color="success"
            startIcon={<DownloadIcon />}
            onClick={() => downloadAsExcel(filteredWaiting, '대기자_목록')}
          >
            엑셀 다운로드
          </Button>
        </Box>
        {filteredWaiting.length === 0 ? (
          <Typography variant="body1" color="text.secondary">대기자가 없습니다.</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>대기 번호</TableCell>
                  <TableCell>이름</TableCell>
                  <TableCell>학번</TableCell>
                  <TableCell>전화번호</TableCell>
                  <TableCell>학교 구분</TableCell>
                  <TableCell>기숙사/야자</TableCell>
                  <TableCell>기숙사/야자 번호</TableCell>
                  <TableCell>신청 시간</TableCell>
                  <TableCell>취소</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredWaiting.map((app, idx) => (
                  <TableRow key={app.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{app.name}</TableCell>
                    <TableCell>{app.studentId}</TableCell>
                    <TableCell>{app.phone}</TableCell>
                    <TableCell>{app.schoolType || '기타'}</TableCell>
                    <TableCell>{app.dormitoryStatus || '-'}</TableCell>
                    <TableCell>{app.dormitoryPhone || '-'}</TableCell>
                    <TableCell>{new Date(app.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <IconButton
                        aria-label="cancel"
                        color="error"
                        onClick={() => handleCancel(app, true)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}

export default AdminPage;