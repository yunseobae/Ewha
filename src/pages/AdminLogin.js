// src/pages/AdminLogin.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'; // <-- 이 줄에서 getAuth만 제거
import { signInWithEmailAndPassword } from 'firebase/auth'; // <-- 이렇게 변경
import { db, auth } from '../firebase'; // Firebase 초기화 인스턴스 임포트 (auth도 함께)
import { doc, getDoc } from 'firebase/firestore'; // Firestore에서 사용자 권한 확인용
import {
  Box,        // 레이아웃을 위한 기본 컨테이너 (div 역할)
  TextField,  // 텍스트 입력 필드
  Button,     // 버튼
  Typography, // 텍스트 (h1, p 등)
  Container,  // 고정 너비 컨테이너
  Alert,      // 경고 메시지
  CircularProgress, // 로딩 스피너 // 요소들을 가로 또는 세로로 쌓을 때 사용
} from '@mui/material';

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Firebase 로그인 성공:", user);

      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists() && userDocSnap.data().isAdmin === true) {
        setError('');
        alert('관리자 로그인 성공!');
        navigate('/admin');
      } else {
        await auth.signOut();
        setError('관리자 권한이 없는 계정입니다.');
        console.error("관리자 권한 없음:", user.uid);
      }
    } catch (firebaseError) {
      console.error("Firebase 로그인 실패:", firebaseError.code, firebaseError.message);
      let errorMessage = '로그인에 실패했습니다. 다시 시도해주세요.';
      if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = '유효하지 않은 이메일 형식입니다.';
      } else if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
        errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
      } else if (firebaseError.code === 'auth/too-many-requests') {
        errorMessage = '로그인 시도 횟수가 너무 많습니다. 잠시 후 다시 시도해주세요.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

 return (
    <Container component="main" maxWidth="xs" sx={{ mt: 8 }}> {/* maxWidth로 너비 제한, mt는 margin-top */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}> {/* mb는 margin-bottom */}
          관리자 로그인
        </Typography>
        <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="이메일 주소"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="비밀번호"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 1 }}> {/* Alert 컴포넌트 사용 */}
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : '로그인'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default AdminLogin;