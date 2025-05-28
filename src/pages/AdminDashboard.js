// src/pages/AdminDashboard.js

import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';

// Material-UI 컴포넌트 임포트
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container, // 콘텐츠를 중앙에 정렬하고 최대 너비를 제한
  LinearProgress, // 로딩 인디케이터
  Alert, // 알림 메시지
  Chip, // 신청 수 현황에 사용
  Divider // 구분선
} from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp'; // 로그아웃 아이콘
import PeopleIcon from '@mui/icons-material/People'; // 신청 인원 아이콘

function AdminDashboard() {
  const [applications, setApplications] = useState([]);
  const [maxCapacity, setMaxCapacity] = useState(300);
  const [loading, setLoading] = useState(true); // 로딩 상태 추가
  const [error, setError] = useState(null); // 에러 상태 추가
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribeApplications = onSnapshot(query(collection(db, 'applications'), orderBy('timestamp', 'asc')), (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApplications(apps);
      setLoading(false); // 데이터 로드 완료
    }, (err) => {
      console.error("Error fetching applications:", err);
      setError("신청자 목록을 불러오는 데 실패했습니다.");
      setLoading(false);
    });

    const settingsRef = doc(db, 'settings', 'appSettings');
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMaxCapacity(data.maxCapacity || 300);
      } else {
        console.log("No appSettings document found. Using default maxCapacity.");
        setMaxCapacity(300);
      }
    }, (err) => {
      console.error("Error fetching settings:", err);
      setError("설정 정보를 불러오는 데 실패했습니다.");
    });

    return () => {
      unsubscribeApplications();
      unsubscribeSettings();
    };
  }, []);

  const handleLogout = async () => {
    if (window.confirm('관리자 계정에서 로그아웃 하시겠습니까?')) {
      try {
        const auth = getAuth();
        await signOut(auth);
        alert('성공적으로 로그아웃 되었습니다.');
        navigate('/admin/login');
      } catch (logoutError) {
        console.error("로그아웃 실패:", logoutError);
        alert("로그아웃 중 오류가 발생했습니다: " + logoutError.message);
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* 관리자 대시보드 앱 바 */}
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            관리자 대시보드
          </Typography>
          <Button
            color="inherit"
            startIcon={<ExitToAppIcon />}
            onClick={handleLogout}
            sx={{
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)', // 호버 시 배경색 변경
              }
            }}
          >
            로그아웃
          </Button>
        </Toolbar>
      </AppBar>

      {/* 메인 콘텐츠 영역 */}
      <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {/* 로딩 및 에러 메시지 */}
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            신청 현황
          </Typography>
          <Chip
            icon={<PeopleIcon />}
            label={`총 신청 수: ${applications.length} / 최대 ${maxCapacity}명`}
            color={applications.length >= maxCapacity ? "error" : "primary"}
            variant="outlined"
            sx={{ fontSize: '1rem', p: 1 }}
          />
        </Box>
        <Divider sx={{ mb: 3 }} />

        {/* AdminPage와 같은 하위 라우트 컴포넌트가 렌더링될 위치 */}
        {/* AdminPage는 AdminDashboard 내에서만 렌더링되므로, 여기에 Outlet이 필요합니다. */}
        <Outlet />
      </Container>

      {/* 푸터 (선택 사항, MainLayout과 중복될 수 있으므로 필요에 따라 제거) */}
      <Box component="footer" sx={{ p: 2, mt: 'auto', bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary" align="center">
          {'관리자 페이지 © '}
          <span style={{ color: 'inherit', textDecoration: 'none' }}>
            Your Ticket App
          </span>{' '}
          {new Date().getFullYear()}
          {'.'}
        </Typography>
      </Box>
    </Box>
  );
}

export default AdminDashboard;