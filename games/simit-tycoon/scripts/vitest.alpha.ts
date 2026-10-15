import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['scripts/alpha.test.ts'], environment: 'node' } });
