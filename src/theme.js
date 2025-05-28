// src/theme.js

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  // 1. 팔레트 (Palette): 앱의 색상 정의
  palette: {
    primary: {
      // 주 색상: 앱의 주요 요소(버튼, 앱 바 등)에 사용됩니다.
      // Material Design Blue 계열의 색상으로, 신뢰감 있고 시원한 느낌을 줍니다.
      main: '#00664F', // 다크 블루 (MUI 기본 primary.main과 유사)
      light: '#00CC66', // 더 밝은 블루
      dark: '#003300',  // 더 어두운 블루
      contrastText: '#fff', // 주 색상 위에 잘 보이는 텍스트 색상 (흰색)
    },
    secondary: {
      // 보조 색상: 액센트 또는 보조적인 요소에 사용됩니다.
      // Material Design Pink 계열의 색상으로, 경쾌하고 생동감 있는 느낌을 줍니다.
      main: '#9c27b0', // 자주색 계열
      light: '#ce93d8', // 더 밝은 자주색
      dark: '#7b1fa2',  // 더 어두운 자주색
      contrastText: '#fff', // 보조 색상 위에 잘 보이는 텍스트 색상 (흰색)
    },
    error: {
      // 오류 메시지나 위험 알림에 사용되는 색상
      main: '#d32f2f', // Material Design Red
    },
    warning: {
      // 경고 메시지에 사용되는 색상
      main: '#ff9800', // Material Design Orange
    },
    info: {
      // 정보성 메시지에 사용되는 색상
      main: '#2196f3', // Material Design Light Blue
    },
    success: {
      // 성공 메시지에 사용되는 색상
      main: '#4caf50', // Material Design Green
    },
    background: {
      // 배경 색상
      default: '#f4f6f8', // 페이지 전체의 기본 배경 색상 (약간 회색조)
      paper: '#fff',      // 카드, 다이얼로그 등 종이처럼 올라온 컴포넌트의 배경 색상 (흰색)
    },
    text: {
      // 텍스트 색상
      primary: 'rgba(0, 0, 0, 0.87)', // 주 텍스트 색상 (거의 검정)
      secondary: 'rgba(0, 0, 0, 0.6)', // 보조 텍스트 색상 (옅은 회색)
      disabled: 'rgba(0, 0, 0, 0.38)', // 비활성화된 텍스트 색상
    },
    divider: 'rgba(0, 0, 0, 0.12)', // 구분선 색상
  },

  // 2. 타이포그래피 (Typography): 글꼴 스타일 정의
  typography: {
    fontFamily: [
      'Spoqa Han Sans Neo', // 한국어 지원을 위한 추천 폰트 (설치 필요, 또는 system-ui로 대체)
      'Roboto',             // Material Design 기본 폰트 (영문)
      'Arial',
      'sans-serif',
      // 시스템 폰트 추가 (예: Apple System, BlinkMacSystemFont for macOS/iOS)
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      '"Helvetica Neue"',
    ].join(','), // 여러 폰트를 지정하여 브라우저가 지원하는 폰트를 사용하도록 함

    // 각 글꼴 변형에 대한 스타일 설정
    h1: { fontSize: '3.5rem', fontWeight: 700 },
    h2: { fontSize: '2.5rem', fontWeight: 700 },
    h3: { fontSize: '2rem', fontWeight: 600 },
    h4: { fontSize: '1.75rem', fontWeight: 600 },
    h5: { fontSize: '1.5rem', fontWeight: 500 },
    h6: { fontSize: '1.25rem', fontWeight: 500 },
    subtitle1: { fontSize: '1rem', fontWeight: 400 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 500 },
    body1: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.5 },
    body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.43 },
    button: { textTransform: 'none', fontWeight: 500 }, // 버튼 텍스트를 대문자로 자동 변환하지 않음
    caption: { fontSize: '0.75rem', fontWeight: 400 },
    overline: { fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase' },
  },

  // 3. 스페이싱 (Spacing): 간격 단위 정의 (기본값은 8px)
  // `theme.spacing(1)`은 8px, `theme.spacing(2)`는 16px 등으로 사용됩니다.
  spacing: 8,

  // 4. 컴포넌트 (Components): 특정 MUI 컴포넌트의 기본 스타일 재정의
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // 모든 버튼의 모서리를 둥글게
          padding: '8px 20px', // 버튼 패딩 조정
        },
        // variant에 따라 추가 스타일 적용 가능
        contained: {
          boxShadow: '0 3px 5px 2px rgba(25, 118, 210, .3)', // primary contained 버튼에 그림자 추가
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none', // 앱 바의 기본 그림자 제거 (더 깔끔한 디자인)
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)', // 하단에 얇은 선 추가
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12, // 카드의 모서리를 둥글게
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)', // 카드에 부드러운 그림자 추가
        },
      },
    },
    // 다른 컴포넌트에도 원하는 기본 스타일을 적용할 수 있습니다.
    // MuiTextField: { ... },
    // MuiPaper: { ... },
  },

  // 5. 브레이크포인트 (Breakpoints): 반응형 디자인을 위한 화면 크기 기준
  // 기본값은 대부분의 경우 충분합니다.
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },

  // 6. Z-Index: 요소들이 겹칠 때의 순서 (기본값은 대부분 충분)
  // zIndex: {
  //   mobileStepper: 1000,
  //   fab: 1050,
  //   speedDial: 1050,
  //   appBar: 1100,
  //   drawer: 1200,
  //   modal: 1300,
  //   snackbar: 1400,
  //   tooltip: 1500,
  // },
});

export default theme;