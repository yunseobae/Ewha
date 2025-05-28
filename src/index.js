// src/index.js (확인 및 수정)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import CssBaseline from '@mui/material/CssBaseline'; // CSS 초기화
import { ThemeProvider } from '@mui/material/styles'; // 테마 적용
import theme from './theme'; // 사용자 정의 테마 (src/theme.js 파일이 있어야 함)

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}> {/* 모든 MUI 컴포넌트에 정의된 테마 적용 */}
      <CssBaseline /> {/* 브라우저 기본 스타일을 제거하여 모든 컴포넌트가 동일한 시작점을 가짐 */}
      <App />
    </ThemeProvider>
  </React.StrictMode>
);