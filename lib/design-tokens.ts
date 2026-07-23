/**
 * Design Tokens - 设计规范常量
 * 主色: #4A6CF7, 背景: #F8FAFC, 卡片: #FFFFFF
 * 主文字: #1A2332, 次要文字: #64748B
 * 间距: 4px基准, 圆角: 8px/12px/16px
 */

export const colors = {
  primary: {
    DEFAULT: '#4A6CF7',
    50: '#EEF1FE',
    100: '#DCE3FD',
    200: '#B9C7FB',
    300: '#96ABF9',
    400: '#738FF8',
    500: '#4A6CF7',
    600: '#1A3FF2',
    700: '#0B2BCB',
    800: '#08209A',
    900: '#061668',
  },
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: {
    primary: '#1A2332',
    secondary: '#64748B',
  },
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
} as const

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  12: '48px',
  16: '64px',
} as const

export const borderRadius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
} as const

export const fontFamily = {
  sans: "'Inter', 'PingFang SC', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
} as const

export const fontSize = {
  xs: '12px',
  sm: '14px',
  base: '16px',
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '30px',
} as const

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
} as const

export const QUESTION_TIME = 45 // seconds per question
export const WARNING_TIME = 10 // seconds before warning
