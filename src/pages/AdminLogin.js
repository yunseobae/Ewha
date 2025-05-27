// src/pages/AdminLogin.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'; // <-- 이 줄에서 getAuth만 제거
import { signInWithEmailAndPassword } from 'firebase/auth'; // <-- 이렇게 변경
import { db, auth } from '../firebase'; // Firebase 초기화 인스턴스 임포트 (auth도 함께)
import { doc, getDoc } from 'firebase/firestore'; // Firestore에서 사용자 권한 확인용

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
    <div style={{ maxWidth: '300px', margin: 'auto', paddingTop: '100px' }}>
      <h2>관리자 로그인</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="email">이메일 (아이디):</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="password">비밀번호:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
}

export default AdminLogin;