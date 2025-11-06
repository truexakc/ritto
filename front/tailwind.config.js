/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {

    extend: {
      container: {
        center: true,
        padding: "1rem",
      },
      fontFamily: {
        sans: ["Montserrat", "sans-serif"],
        inter: ["Inter", "serif"],
      },
      colors: {
        // Основные цвета приложения
        primary: {
          DEFAULT: "#3b82f6", // Основной цвет (синий)
          light: "#60a5fa",
          dark: "#2563eb",
        },
        secondary: {
          DEFAULT: "#10b981", // Вторичный цвет (зеленый)
          light: "#34d399",
          dark: "#059669",
        },
        accent: {
          DEFAULT: "#f59e0b", // Акцентный цвет (оранжевый)
          light: "#fbbf24",
          dark: "#d97706",
        },
        background: {
          DEFAULT: "#ffffff",
          dark: "#f9fafb",
        },
        text: {
          DEFAULT: "#111827",
          light: "#6b7280",
          muted: "#9ca3af",
        },
      },
      // container: {
      //   center: true,
      // },
    },
  },
  plugins: [],
};
