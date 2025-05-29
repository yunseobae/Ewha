import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // URL에서 ID를 가져오기 위해 필요
import { db } from '../firebase'; // Firebase 인스턴스 import
import { collection, query, orderBy, getDocs } from 'firebase/firestore'; // Firestore에서 데이터 조회 관련 함수 import

// Material-UI 컴포넌트 임포트
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider, // 공지사항 항목 간 구분선
} from '@mui/material';

// --- 날짜 포맷팅 유틸리티 함수 (공통 사용을 위해 별도 파일로 분리하는 것을 추천) ---
// Firebase Timestamp 객체를 JavaScript Date 객체로 변환하여 보기 좋게 포맷합니다.
const formatDate = (timestamp) => {
  if (timestamp && typeof timestamp.toDate === 'function') {
    const date = timestamp.toDate();
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true // 오전/오후 표시
    });
  }
  return '날짜 미정'; // 유효하지 않은 timestamp일 경우
};

function NoticePage() {
  // URL 파라미터에서 'id' (이벤트 ID)를 가져옵니다.
  // 이 'id'를 사용하여 특정 이벤트에 대한 공지만 필터링할 수 있습니다.
  const { id } = useParams();

  const [notices, setNotices] = useState([]); // 공지사항 목록 상태
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState(''); // 에러 메시지 상태

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true); // 데이터 불러오기 시작 시 로딩 상태 설정
        setError(''); // 에러 상태 초기화

        let q;
        // 만약 URL에 이벤트 ID가 있다면 해당 이벤트에 대한 공지만 필터링
        if (id) {
          // Firestore 공지사항 문서에 'eventId' 필드가 있다고 가정
          // 특정 이벤트 ID에 해당하는 공지사항만 가져옵니다.
          q = query(
            collection(db, 'notices'),
            // where('eventId', '==', id), // 이 라인을 사용하려면 Firestore에 'eventId' 필드가 있어야 합니다.
            orderBy('createdAt', 'desc') // 최신 공지사항이 위로 오도록 정렬
          );
          // 주석 처리된 where 절을 사용하려면 `import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';` 로 `where`도 임포트해야 합니다.
          console.log(`이벤트 ID '${id}'에 대한 공지사항을 불러오는 중...`);
        } else {
          // 이벤트 ID가 없다면 모든 공지사항을 가져옵니다.
          q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'));
          console.log('모든 공지사항을 불러오는 중...');
        }


        const querySnapshot = await getDocs(q); // 쿼리 실행하여 문서 스냅샷 가져오기

        // 가져온 문서들을 배열로 변환하여 상태에 저장
        const fetchedNotices = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setNotices(fetchedNotices); // 공지사항 목록 업데이트

      } catch (err) {
        console.error('공지사항 불러오기 오류:', err); // 개발자 콘솔에 에러 기록
        setError('공지사항을 불러오는 중 오류가 발생했습니다.'); // 사용자에게 표시할 에러 메시지 설정
      } finally {
        setLoading(false); // 데이터 불러오기 완료 시 로딩 상태 해제
      }
    };

    fetchNotices(); // 함수 호출하여 공지사항 불러오기
  }, [id]); // `id`가 변경될 때마다 useEffect가 다시 실행되어 데이터를 다시 불러옵니다.

  // --- UI 렌더링 ---

  // 로딩 중일 때 표시할 UI
  if (loading) {
    return (
      <Container component="main" maxWidth="md" sx={{ mt: 8 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            공지사항을 불러오는 중...
          </Typography>
        </Box>
      </Container>
    );
  }

  // 에러 발생 시 표시할 UI
  if (error) {
    return (
      <Container component="main" maxWidth="md" sx={{ mt: 8 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          공지 및 송리스트
        </Typography>

        {/* 공지사항이 없을 경우 표시할 메시지 */}
        {notices.length === 0 ? (
          <Alert severity="info">등록된 공지사항이 없습니다.</Alert>
        ) : (
          // 공지사항 목록을 표시
          <List>
            {notices.map((notice, index) => (
              <React.Fragment key={notice.id}>
                <ListItem alignItems="flex-start" sx={{ py: 1.5 }}>
                  <ListItemText
                    primary={
                      <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
                        {notice.title}
                      </Typography>
                    }
                    secondary={
                      <React.Fragment>
                        {/*<Typography
                          sx={{ display: 'block', mt: 0.5 }} // 날짜를 한 줄에 표시
                          component="span"
                          variant="body2"
                          color="text.secondary"
                        >
                          {formatDate(notice.createdAt)}
                        </Typography>*/}
                        <Typography
                          sx={{ display: 'block', mt: 1 }} // 내용을 다른 줄에 표시
                          component="span"
                          variant="body1"
                          color="text.primary"
                        >
                          {notice.content} {/* 공지 내용 표시 */}
                        </Typography>
                        {/* 만약 송리스트 이미지가 있다면 여기에 표시 */}
                        {notice.songlistImageUrl && (
                            <Box sx={{ mt: 2 }}>
                                <img
                                    src={notice.songlistImageUrl}
                                    alt="송리스트 이미지"
                                    style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
                                />
                            </Box>
                        )}
                      </React.Fragment>
                    }
                  />
                  {/* 상세 보기 아이콘 등 추가적인 액션 버튼을 여기에 넣을 수 있습니다. */}
                  {/* <IconButton edge="end" aria-label="detail">
                    <InfoIcon />
                  </IconButton> */}
                </ListItem>
                {/* 마지막 공지사항 다음에는 구분선을 추가하지 않습니다. */}
                {index < notices.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
}

export default NoticePage;