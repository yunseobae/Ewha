// src/layouts/MainLayout.js

import React from 'react';
import { Link as RouterLink } from 'react-router-dom'; // React Router Link와 MUI 컴포넌트 조합을 위함

// Material-UI 컴포넌트 임포트
import {
  AppBar,     // 상단 바 (헤더)
  Toolbar,    // AppBar 내부의 내용 정렬을 위함
  Typography, // 텍스트 (제목, 문구 등)
  Button,     // 버튼
  Box,        // 유연한 레이아웃을 위한 기본 컨테이너
  Container,  // 콘텐츠의 최대 너비를 제한하고 중앙 정렬
} from '@mui/material';

// Material-UI Icons (선택 사항, 필요하다면)
// import MenuIcon from '@mui/icons-material/Menu';
// import IconButton from '@mui/material/IconButton';


// MainLayout 컴포넌트 정의
const MainLayout = ({ children }) => {
  return (
    // Box 컴포넌트는 flexbox 컨테이너로 사용하여 전체 페이지 레이아웃을 잡습니다.
    // minHeight: '100vh'는 뷰포트 높이의 100%를 차지하게 하여 푸터가 항상 하단에 위치하도록 합니다.
    // flexDirection: 'column'은 자식 요소들을 수직으로 정렬합니다.
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* CssBaseline: 브라우저 기본 스타일을 재설정하여 일관된 렌더링을 제공합니다.
          보통 App.js를 감싸는 index.js에서 한 번만 적용하는 것이 좋습니다.
          여기서는 예시를 위해 포함했지만, index.js에 이미 있다면 제거해도 됩니다. */}
      {/* <CssBaseline /> */}

      {/* 1. AppBar (헤더 / 상단 내비게이션 바) */}
      <AppBar position="static"> {/* position="static"은 스크롤 시 앱 바가 고정되지 않고 같이 스크롤됩니다. "fixed"로 하면 상단에 고정됩니다. */}
        <Toolbar> {/* Toolbar는 AppBar 내부의 요소들을 수평으로 정렬하고 패딩을 제공합니다. */}
          {/* 앱 제목 또는 로고 */}
          <Typography
            variant="h6" // h6 스타일 (글꼴 크기) 적용
            component="div" // HTML div 태그로 렌더링
            sx={{ flexGrow: 1 }} // 남은 공간을 모두 차지하여 다른 요소들을 오른쪽으로 밀어냅니다.
          >
            {/* React Router Link와 MUI Button을 함께 사용하여 스타일을 유지하며 라우팅 */}
            <Button color="inherit" component={RouterLink} to="/">
              홈으로
            </Button>
          </Typography>

          {/* 내비게이션 버튼들 */}
          <Button color="inherit" component={RouterLink} to="/events"> {/* 예시: 이벤트 목록 페이지 */}
            이벤트 목록
          </Button>
          <Button color="inherit" component={RouterLink} to="/admin/login">
            관리자 로그인
          </Button>
          {/* 여기에 더 많은 내비게이션 링크를 추가할 수 있습니다. */}
        </Toolbar>
      </AppBar>

      {/* 2. Main Content (주요 콘텐츠 영역) */}
      {/* Container: 콘텐츠의 최대 너비를 제한하고 중앙에 정렬하는 데 사용됩니다.
          component="main"은 HTML의 <main> 태그로 렌더링되도록 합니다.
          maxWidth="md"는 중간(medium) 너비로 제한합니다. (xs, sm, md, lg, xl)
          sx={{ mt: 4, mb: 4, flexGrow: 1 }}:
            - mt: 4 (margin-top: theme.spacing(4) = 32px)
            - mb: 4 (margin-bottom: theme.spacing(4) = 32px)
            - flexGrow: 1 (남은 수직 공간을 모두 차지하여 푸터를 하단으로 밀어냅니다.)
      */}
      <Container component="main" maxWidth="md" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {children} {/* 여기에 이 레이아웃으로 감싸진 실제 페이지 컴포넌트가 렌더링됩니다. */}
      </Container>

      {/* 3. Footer (푸터) */}
      {/* Box: 푸터를 위한 컨테이너입니다.
          sx={{ p: 2, mt: 'auto', bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}:
            - p: 2 (padding: theme.spacing(2) = 16px)
            - mt: 'auto' (남은 수직 공간을 flex-grow: 1과 함께 사용하여 푸터를 바닥으로 밀어냅니다.)
            - bgcolor: 'background.paper' (테마에 정의된 배경 색상 사용)
            - borderTop: 1 (상단 테두리 1px)
            - borderColor: 'divider' (테마에 정의된 구분선 색상 사용)
      */}
      <Box component="footer" sx={{ p: 2, mt: 'auto', bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary" align="center">
          {'Copyright © '}
          <RouterLink to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            Your Ticket App
          </RouterLink>{' '}
          {new Date().getFullYear()}
          {'.'}
        </Typography>
      </Box>
    </Box>
  );
};

export default MainLayout;