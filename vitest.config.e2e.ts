import { defineConfig } from 'vitest/config';
import { e2eEnv } from './test/setup/env.js';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    env: e2eEnv(),
    globalSetup: ['./test/setup/global-setup.ts'],
    // All suites share one database, so run files one at a time.
    fileParallelism: false,
  },
});
