import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

// 페이지 컴포넌트 임포트
import EventList from './pages/EventList';
import EventDetail from './pages/EventDetail';
import ApplicationForm from './pages/ApplicationForm';
import ApplicationCheckAndEdit from './pages/ApplicationCheckAndEdit'; // 새로 추가: 신청 조회 및 수정 컴포넌트
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminPage from './pages/AdminPage';
import SuccessPage from './pages/SuccessPage';
import PrivateRoute from './pages/PrivateRoute';
import NoticePage from './pages/NoticePage';
// import NotFound from './pages/NotFound'; // 404 페이지가 있다면 임포트

// MainLayout 컴포넌트 임포트
import MainLayout from './layouts/MainLayout';

function App() {
  return (
    <Router>
      <Routes>
        {/*
          MainLayout으로 감쌀 페이지들:
          이 페이지들은 공통적인 헤더, 푸터, 그리고 콘텐츠 영역의 컨테이너 스타일을 가집니다.
        */}
        <Route path="/" element={<MainLayout><EventList /></MainLayout>} />
        <Route path="/event/:id" element={<MainLayout><EventDetail /></MainLayout>} />
        <Route path="/event/:id/apply" element={<MainLayout><ApplicationForm /></MainLayout>} />
        <Route path="/success" element={<MainLayout><SuccessPage /></MainLayout>} />
        <Route path="notice/:id" element={<MainLayout><NoticePage /></MainLayout>} /> 
        {/* 새로 추가된 신청 조회 및 수정 페이지 라우트 */}
        <Route path="/check" element={<MainLayout><ApplicationCheckAndEdit /></MainLayout>} />

        {/*
          MainLayout으로 감싸지 않을 페이지들:
          AdminLogin은 로그인 전 페이지이므로, 보통 독립적인 레이아웃을 가집니다.
          AdminDashboard는 관리자 페이지 자체에 복잡한 레이아웃(사이드바 등)이 있을 수 있으므로,
          MainLayout을 적용하기보다는 AdminDashboard 컴포넌트 내부에서 자체적인 MUI 레이아웃을 구성하는 것이 일반적입니다.
        */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/*
          PrivateRoute로 보호된 관리자 영역:
          AdminDashboard 컴포넌트 내부에서 AdminPage를 렌더링할 예정입니다.
          AdminDashboard 자체는 PrivateRoute로 보호됩니다.
        */}
        <Route
          path="/admin/*" // /admin으로 시작하는 모든 경로를 AdminDashboard가 처리
          element={
            <PrivateRoute>
              {/* AdminDashboard는 자체적으로 관리자 레이아웃을 가질 수 있으므로 MainLayout으로 감싸지 않습니다. */}
              <AdminDashboard />
            </PrivateRoute>
          }
        >
          {/* AdminDashboard 내부에서 렌더링될 서브 라우트 */}
          <Route path="" element={<AdminPage />} /> {/* /admin 경로에 AdminPage 렌더링 */}
          {/* 예시: /admin/users 경로에 UserManagementPage 렌더링 */}
          {/* <Route path="users" element={<UserManagementPage />} /> */}
        </Route>

        {/* 404 Not Found 페이지 (선택 사항) */}
        {/* <Route path="*" element={<MainLayout><NotFound /></MainLayout>} /> */}
      </Routes>
    </Router>
  );
}

export default App;