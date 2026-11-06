import { loadEnv } from 'vite';

// e2e tests run against a dedicated database so they never touch dev data.
// Defaults to `<DB_NAME>_test`; override with DB_NAME_TEST.
export function e2eEnv(): Record<string, string> {
  const env = loadEnv('test', process.cwd(), '');
  const dbName = env.DB_NAME_TEST || `${env.DB_NAME}_test`;

  return { ...env, DB_NAME: dbName, NODE_ENV: 'test' };
}
