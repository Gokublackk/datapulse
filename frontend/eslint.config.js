import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),

  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Context files intentionally export a provider component next to its
      // consumer hook, and modules like ChartRenderer export a component plus
      // the chart-type constants that describe it. Both cost a full reload
      // instead of a hot update while editing, which is worth a warning, not a
      // build-blocking error.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  {
    // These two modules own request lifecycles: the effect that starts a fetch
    // also marks it as in flight. Without a data-fetching library or a Suspense
    // resource there is no way to express that without one synchronous setState,
    // and it runs once per request rather than once per render. Anywhere else,
    // state written from an effect is still a hard error.
    files: ['src/hooks/useAsyncData.js', 'src/context/WorkspaceProvider.jsx'],
    rules: { 'react-hooks/set-state-in-effect': 'warn' },
  },

  {
    // Vite/PostCSS/ESLint configs run in Node, not the browser.
    files: ['*.config.js', 'vite.config.js', 'postcss.config.js', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
])
