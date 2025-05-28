import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Button
} from '@mui/material';

function EventDetail() {
  const { id } = useParams(); // URL에서 이벤트 ID 가져오기
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) {
        setError('이벤트 ID가 제공되지 않았습니다.');
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'events', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('해당 이벤트를 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('이벤트 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <Container component="main" maxWidth="md" sx={{ mt: 8 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            이벤트 정보를 불러오는 중...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container component="main" maxWidth="md" sx={{ mt: 8 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!event) {
    return (
      <Container component="main" maxWidth="md" sx={{ mt: 8 }}>
        <Alert severity="info">이벤트 정보를 찾을 수 없습니다.</Alert>
      </Container>
    );
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {event.title}
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {event.organizer}
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          {event.description}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          날짜: {formatDate(event.date)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          장소: {event.location}
        </Typography>

        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => {
              console.log('신청하기 버튼 클릭! 이동할경로:', '/event/&{id}/apply');
              navigate(`/event/${id}/apply`)
            }} // 신청 페이지로 이동 (이벤트 ID 포함)
          >
            이화의 밤밤 신청하기
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            size="large"
            onClick={() => navigate(`/check`)} // 신청 조회 및 수정 페이지로 이동. EventDetail에서 바로 학번/비번으로 조회하므로 eventId는 필요 없음.
          >
            신청 조회 및 수정
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default EventDetail;