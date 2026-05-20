/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        mata: '#1A3A2E',
        'mata-soft': '#234737',
        broto: '#4A7C59',
        'broto-soft': '#6B9476',
        manga: '#E8A04C',
        'manga-deep': '#D4842B',
        'manga-soft': '#F2BA75',
        casca: '#7BA05B',
        papel: '#F5F0E6',
        'papel-warm': '#EFE7D6',
        noite: '#0E1B14',
        'noite-card': '#1A2A21',
        neblina: '#FAFAF7',
        'ink-1': '#1A1814',
        'ink-2': '#4A4640',
        'ink-3': '#8A8580',
        'ink-4': '#C9C3B8',
      },
      fontFamily: {
        display: ['Fraunces_500Medium'],
        'display-bold': ['Fraunces_600SemiBold'],
        'display-italic': ['Fraunces_500Medium_Italic'],
        ui: ['Inter_400Regular'],
        'ui-medium': ['Inter_500Medium'],
        'ui-semibold': ['Inter_600SemiBold'],
        'ui-bold': ['Inter_700Bold'],
      },
      borderRadius: {
        '2xl': 24,
        '3xl': 28,
        '4xl': 32,
      },
    },
  },
  plugins: [],
};
