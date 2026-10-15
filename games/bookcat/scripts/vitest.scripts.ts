import { defineConfig } from 'vitest/config';

/** Long-running tooling (calibration, balance reports) kept out of `npm test`. */
export default defineConfig({
  define: { __APP_VERSION__: '"script"' },
  test: {
    include: [process.env.SCRIPT ?? 'scripts/**/*.test.ts'],
    environment: 'node',
    testTimeout: 3_600_000,
  },
});
