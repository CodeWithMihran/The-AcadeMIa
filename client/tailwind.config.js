/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        app: "rgb(var(--app-bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-raised": "rgb(var(--surface-raised) / <alpha-value>)",
        "surface-muted": "rgb(var(--surface-muted) / <alpha-value>)",
        "surface-subtle": "rgb(var(--surface-subtle) / <alpha-value>)",
        "surface-hover": "rgb(var(--surface-hover) / <alpha-value>)",
        "surface-inverse": "rgb(var(--surface-inverse) / <alpha-value>)",
        content: "rgb(var(--content) / <alpha-value>)",
        "content-strong": "rgb(var(--content-strong) / <alpha-value>)",
        "content-secondary": "rgb(var(--content-secondary) / <alpha-value>)",
        "content-muted": "rgb(var(--content-muted) / <alpha-value>)",
        "content-faint": "rgb(var(--content-faint) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        "line-strong": "rgb(var(--line-strong) / <alpha-value>)",
        blue: semanticPalette("blue"),
        indigo: semanticPalette("indigo"),
        emerald: semanticPalette("emerald"),
        amber: semanticPalette("amber"),
        red: semanticPalette("red"),
        purple: semanticPalette("purple"),
        violet: semanticPalette("violet"),
        orange: semanticPalette("orange"),
        notion: {
          bg: '#fbfbfa',
          dark: '#1a1a1a',
          card: '#ffffff',
          border: '#e5e7eb',
          subtle: '#9ca3af'
        }
      }
    },
  },
  plugins: [],
}

function semanticPalette(name) {
  return Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => [
    shade,
    `rgb(var(--${name}-${shade}) / <alpha-value>)`,
  ]));
}
