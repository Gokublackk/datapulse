// Wires Tailwind CSS v4 into Vite's CSS pipeline.
// Without this file the `@import "tailwindcss"` in src/index.css is passed
// through untouched and no utility classes are ever generated.
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
