import { DataSource } from 'typeorm';
import { e2eEnv } from './env.js';

// Creates the test database if it doesn't exist yet. Tables are created by
// TypeORM's `synchronize` when the app boots.
export default async function setup() {
  const env = e2eEnv();
  const admin = new DataSource({
    type: 'postgres',
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
    username: env.DB_USER,
    password: env.DB_PASS,
    database: 'postgres',
  });

  await admin.initialize();
  try {
    const rows: unknown[] = await admin.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [env.DB_NAME],
    );
    if (!rows.length) {
      await admin.query(`CREATE DATABASE "${env.DB_NAME}"`);
    }
  } finally {
    await admin.destroy();
  }
}
