import React from 'react';
import { Navigate } from 'react-router-dom';

// 로그인 상태 체크해서 로그인 안하면 로그인 페이지로 리다이렉트
function PrivateRoute({ children }) {
  const isLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';

  if (!isLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default PrivateRoute;
