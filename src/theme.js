import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4DB8AC',      // メインのティール(ロゴの明るいティール)
      light: '#7BCFC5',     // より明るいティール
      dark: '#2D9B8F',      // 濃いティール
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2C4A6E',      // ロゴのネイビー
      light: '#5BA3D0',     // ロゴのライトブルー
      dark: '#1A2F4A',      // より濃いネイビー
      contrastText: '#ffffff',
    },
    success: {
      main: '#2D9B8F',      // ティールを成功色に
      light: '#4DB8AC',
      dark: '#1F7A71',
    },
    warning: {
      main: '#F5A623',      // アクセントとして暖色
      light: '#FFB84D',
      dark: '#E09200',
    },
    error: {
      main: '#E85D75',      // 柔らかいピンクレッド
      light: '#FF8FA3',
      dark: '#C94157',
    },
    info: {
      main: '#5BA3D0',      // ロゴのライトブルー
      light: '#89C2E8',
      dark: '#3D7FA8',
    },
    background: {
      default: '#F5F9F8',   // 非常に薄いティール
      paper: '#ffffff',
    },
    text: {
      primary: '#1A2F4A',   // 濃いネイビー
      secondary: '#5E7A8C', // ミディアムブルーグレー
    },
    divider: '#D4E8E5',     // 薄いティールグレー
    
    // カスタムカラー追加
    accent: {
      tealLight: '#E8F6F4',     // 非常に薄いティール（背景用）
      tealMedium: '#B8E6E0',    // 薄いティール
      navyLight: '#3A5A7E',     // ライトネイビー
    },
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans JP", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: '#1A2F4A',
    },
    h4: {
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      color: '#1A2F4A',
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      color: '#2C4A6E',
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      color: '#2C4A6E',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#1A2F4A',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#5E7A8C',
    },
  },
  shape: {
    borderRadius: 6,  // 12から6に変更（より四角く）
  },
  shadows: [
    'none',
    '0 1px 3px 0 rgb(45 155 143 / 0.1), 0 1px 2px -1px rgb(45 155 143 / 0.1)',
    '0 4px 6px -1px rgb(45 155 143 / 0.1), 0 2px 4px -2px rgb(45 155 143 / 0.1)',
    '0 10px 15px -3px rgb(45 155 143 / 0.1), 0 4px 6px -4px rgb(45 155 143 / 0.1)',
    '0 20px 25px -5px rgb(45 155 143 / 0.1), 0 8px 10px -6px rgb(45 155 143 / 0.1)',
    '0 25px 50px -12px rgb(45 155 143 / 0.25)',
    '0 25px 50px -12px rgb(45 155 143 / 0.25)',
    '0 25px 50px -12px rgb(45 155 143 / 0.25)',
    '0 25px 50px -12px rgb(45 155 143 / 0.25)',
    '0 25px 50px -12px rgb(45 155 143 / 0.25)',
    '0 25px 50px -12px rgb(45 155 143 / 0.25)',
    '0 25px 50px -12px rgb(45 155 143 / 0.25)',
    '0 25px 50px -12px rgb(45 155 143 / 0.25)',
    '0 25px 50px -12px rgb(45 155 143 / 0.25)',
    '0 25px 50px -12px rgb(45 155 143 / 0.25)',
    '0 25px 50px -12px rgb(45 155 143 / 0.25)',
    '0 25px 50px -12px rgb(45 155 143 / 0.25)',
    '0 25px 50px -12px rgb(45 155 143 / 0.25)',
    '0 25px 50px -12px rgb(45 155 143 / 0.25)',
    '0 25px 50px -12px rgb(45 155 143 / 0.25)',
    '0 25px 50px -12px rgb(45 155 143 / 0.25)',
    '0 25px 50px -12px rgb(45 155 143 / 0.25)',
    '0 25px 50px -12px rgb(45 155 143 / 0.25)',
    '0 25px 50px -12px rgb(45 155 143 / 0.25)',
    '0 25px 50px -12px rgb(45 155 143 / 0.25)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 6,  // 10から6に変更
          padding: '10px 20px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px 0 rgba(45, 155, 143, 0.2)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #4DB8AC 0%, #2D9B8F 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #3DA69C 0%, #1F8A7F 100%)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #5BA3D0 0%, #2C4A6E 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4A92BF 0%, #1A3A5E 100%)',
          },
        },
        outlined: {
          borderColor: '#4DB8AC',
          color: '#2D9B8F',
          '&:hover': {
            borderColor: '#2D9B8F',
            backgroundColor: '#E8F6F4',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,  // 16から8に変更
          border: '1px solid #D4E8E5',
          boxShadow: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
        colorPrimary: {
          background: 'linear-gradient(135deg, #4DB8AC 0%, #2D9B8F 100%)',
          color: '#ffffff',
          fontWeight: 600,
        },
        colorSecondary: {
          background: 'linear-gradient(135deg, #5BA3D0 0%, #2C4A6E 100%)',
          color: '#ffffff',
          fontWeight: 600,
        },
        outlined: {
          borderColor: '#4DB8AC',
          color: '#2D9B8F',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: '#D4E8E5',
          borderRadius: 4,
          height: 6,
        },
        bar: {
          background: 'linear-gradient(90deg, #4DB8AC 0%, #2D9B8F 100%)',
          borderRadius: 4,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: {
          borderColor: '#D4E8E5',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(45, 155, 143, 0.1)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#E8F6F4',
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          borderColor: '#D4E8E5',
          '&.Mui-selected': {
            backgroundColor: '#4DB8AC',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#2D9B8F',
            },
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:before': {
            display: 'none',
          },
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          backgroundColor: '#E85D75',
        },
        colorPrimary: {
          backgroundColor: '#4DB8AC',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        standardInfo: {
          backgroundColor: '#E8F6F4',
          color: '#2C4A6E',
        },
        standardSuccess: {
          backgroundColor: '#E8F6F4',
          color: '#2D9B8F',
        },
      },
    },
  },
});