// src/App.js
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import EventList from './pages/EventList';
import EventDetail from './pages/EventDetail';
import ApplicationForm from './pages/ApplicationForm';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminPage from './pages/AdminPage';
import SuccessPage from './pages/SuccessPage';
import PrivateRoute from './pages/PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<EventList />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/event/:id/apply" element={<ApplicationForm />} />
        
        {/* 로그인 페이지 */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* 로그인 필요, PrivateRoute로 보호된 관리자 영역 */}
        <Route
          path="/admin/*"
          element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          }
        >
          {/* AdminDashboard 내에서 서브 라우트로 AdminPage 렌더링 */}
          <Route path="" element={<AdminPage />} />
          {/* 필요시 추가 하위 라우트 작성 가능 */}
        </Route>

        <Route path="/success" element={<SuccessPage />} />
      </Routes>
    </Router>
  );
}

export default App;