/** @type {import('tailwindcss').Config} */
// Tokens copied from the original @theme block in globals.css (Tailwind 4 -> 3).
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FBF7F1",
        gold: { DEFAULT: "#B98A4A", dark: "#9b7138" },
        ink: "#1A1A1F",
        muted: "#77766f",
        sage: "#6F7F6A",
      },
      boxShadow: { card: "0 12px 30px rgba(36,28,18,.11)" },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "Arial", "sans-serif"],
      },
      // Tailwind 4 defaults borders to currentColor; keep that so existing "border" classes look the same.
      borderColor: { DEFAULT: "currentColor" },
    },
  },
  plugins: [],
};
