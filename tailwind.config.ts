import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink:      '#0f172a',
        steel:    '#64748b',
        workshop: '#f97316',
        ok:       '#10b981',
        danger:   '#ef4444',
        warning:  '#f59e0b',
        info:     '#3b82f6',
      },
    },
  },
  plugins: [],
}

export default config
