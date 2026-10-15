import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['scripts/balance.test.ts'], environment: 'node' } });
