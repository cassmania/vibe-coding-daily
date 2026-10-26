/** @type {import('tailwindcss').Config} */
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: v("bg"),
        card: v("card"),
        sunken: v("sunken"),
        line: v("line"),
        ink: v("ink"),
        muted: v("muted"),
        clay: v("clay"),
        "clay-soft": v("clay-soft"),
      },
      fontFamily: {
        sans: ["Pretendard", "system-ui", "sans-serif"],
        serif: ['"Noto Serif KR"', "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
