import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

/**
 * Vitest config
 *
 * Kept separate from `vite.config.js` on purpose: the Vite build config pulls
 * in eslint + tailwind plugins and a full bundle/minify pipeline that would
 * slow every test run. This config is test-only — it just mirrors the `@/`
 * alias so imports resolve the same way they do in production, and picks a
 * happy-dom environment for fast DOM unit tests.
 *
 * Run:  bun run test         # one-shot (CI)
 *       bun run test:watch   # local watch mode
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, '_scripts'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['_scripts/**/*.{test,spec}.ts'],
  },
})
