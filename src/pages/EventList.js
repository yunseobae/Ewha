import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase'; // Firebase 'db' 인스턴스 임포트
import { collection, getDocs } from 'firebase/firestore'; // Firestore에서 컬렉션 및 문서 가져오기 함수 임포트

// Material-UI Imports
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Box,
  CircularProgress, // 데이터 로딩 중 표시
  Alert, // 에러 메시지 표시
} from '@mui/material';

function EventList() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]); // Firebase에서 불러온 이벤트 목록을 저장할 상태
  const [loading, setLoading] = useState(true); // 데이터 로딩 상태
  const [error, setError] = useState(''); // 에러 메시지 상태

  // 컴포넌트가 마운트될 때 Firebase에서 이벤트를 불러오는 useEffect 훅
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true); // 로딩 시작
        setError(''); // 이전 에러 초기화

        // 'events' 컬렉션의 모든 문서 가져오기
        const querySnapshot = await getDocs(collection(db, 'events'));
        const eventsData = querySnapshot.docs.map(doc => ({
          id: doc.id, // 문서의 고유 ID를 'id' 필드로 저장
          ...doc.data() // 문서의 다른 모든 데이터
        }));
        setEvents(eventsData); // 상태 업데이트
      } catch (err) {
        // 데이터 불러오기 중 에러 발생 시
        console.error('이벤트 목록 불러오기 오류:', err);
        setError('이벤트 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false); // 로딩 종료
      }
    };

    fetchEvents(); // 함수 실행
  }, []); // 빈 배열: 컴포넌트가 처음 마운트될 때 한 번만 실행

  // 이벤트 클릭 시 해당 이벤트의 상세 페이지로 이동
  const handleEventClick = (eventId) => {
    console.log('EventList에서 클릭된 이벤트 ID:', eventId);
    navigate(`/event/${eventId}`);
  };

  // Firebase Timestamp 객체를 사람이 읽기 쉬운 날짜 문자열로 변환하는 헬퍼 함수
  const formatDate = (timestamp) => {
    if (timestamp && typeof timestamp.toDate === 'function') {
      const date = timestamp.toDate(); // Firebase Timestamp를 JavaScript Date 객체로 변환
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return '날짜 미정'; // Timestamp가 없거나 유효하지 않으면 '날짜 미정' 반환
  };

  // 로딩 중일 때 표시할 UI
  if (loading) {
    return (
      <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            이벤트 목록을 불러오는 중...
          </Typography>
        </Box>
      </Container>
    );
  }

  // 에러 발생 시 표시할 UI
  if (error) {
    return (
      <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  // 이벤트 목록이 성공적으로 불러와졌을 때 표시할 UI
  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h4" gutterBottom>
          이화의 밤 신청
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          아래 목록에서 신청하고자 하는 이벤트를 선택해주세요.
        </Typography>

        {events.length > 0 ? ( // 이벤트가 하나라도 있을 경우 리스트 렌더링
          <List sx={{ width: '100%' }}>
            {events.map((event) => (
              <ListItem key={event.id} disablePadding divider>
                <ListItemButton onClick={() => handleEventClick(event.id)}>
                  <ListItemText
                    primary={event.title}
                    secondary={`날짜: ${formatDate(event.date)}`}
                    primaryTypographyProps={{ variant: 'h6' }}
                    secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        ) : ( // 이벤트가 없을 경우 메시지 표시
          <Box sx={{ mt: 3, p: 2, border: '1px dashed #ccc', borderRadius: '8px', width: '100%', textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              현재 진행 중인 이벤트가 없습니다.
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default EventList;