/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        // Nordic Minimalist Palette
        'nordic': {
          'cream': '#f7f6f4',
          'white': '#ffffff',
          'warm': '#f4f3f0',
        },
        'text': {
          'primary': '#1a1a1a',
          'secondary': '#666666',
          'muted': '#999999',
        },
        'accent': {
          'primary': '#2c3e50',
          'blue': '#4a90a4',
          'green': '#7ba05b',
          'warm': '#c8956d',
        },
        'border': {
          'light': '#e8e6e3',
          'medium': '#d4d2cf',
        },
        // Semantic colors for UI states
        'success': {
          50: '#f0fdf4',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        'warning': {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        'error': {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        'info': {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      boxShadow: {
        'nordic-sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'nordic-md': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'nordic-lg': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'nordic-xl': '0 8px 32px rgba(0, 0, 0, 0.16)',
        'glow': '0 0 20px rgba(74, 144, 164, 0.15)',
      },
      borderRadius: {
        'nordic': '8px',
        'nordic-lg': '12px',
        'nordic-xl': '16px',
        'nordic-2xl': '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
};
