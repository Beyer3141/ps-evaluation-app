/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: 'rgb(60 109 238)', // #3c6dee
            light: 'rgb(122 156 236)',
            dark: 'rgb(44 52 140)',
            50: 'rgb(239 246 255)',
            100: 'rgb(219 234 254)',
            600: 'rgb(60 109 238)',
            700: 'rgb(44 52 140)',
          },
          secondary: {
            DEFAULT: 'rgb(94 95 163)',
            dark: 'rgb(62 50 98)',
          },
          accent: {
            DEFAULT: 'rgb(59 130 246)',
            light: 'rgb(96 165 250)',
          },
        },
        spacing: {
          // 8ポイントグリッドシステム準拠
          '4.5': '1.125rem', // 18px
          '18': '4.5rem', // 72px
          '88': '22rem', // 352px
        },
        fontSize: {
          // 16px基準のタイポグラフィスケール
          'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
          'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
          'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px - 標準
          'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
          'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
          '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
          '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
          '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
          '5xl': ['3rem', { lineHeight: '1' }],           // 48px
        },
        borderRadius: {
          'xl': '0.75rem',  // 12px
          '2xl': '1rem',    // 16px
          '3xl': '1.5rem',  // 24px
        },
        boxShadow: {
          'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          'elevation-1': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          'elevation-2': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          'elevation-3': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          'elevation-4': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
        transitionDuration: {
          '250': '250ms',
          '350': '350ms',
        },
        animation: {
          'fade-in-up': 'fade-in-up 0.4s ease-out',
          'slide-in': 'slide-in 0.3s ease-out',
          'slide-in-right': 'slide-in-right 0.3s ease-out',
        },
        keyframes: {
          'fade-in-up': {
            '0%': {
              opacity: '0',
              transform: 'translateY(10px)'
            },
            '100%': {
              opacity: '1',
              transform: 'translateY(0)'
            }
          },
          'slide-in': {
            '0%': { transform: 'translateY(-100%)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' }
          },
          'slide-in-right': {
            '0%': { transform: 'translateX(100%)' },
            '100%': { transform: 'translateX(0)' }
          }
        }
      },
    },
    plugins: [],
  }