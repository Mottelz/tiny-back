import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { createTestApp, resetDatabase } from './setup/app.js';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  const creds = { email: 'ann@example.com', password: 'secret123' };

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDatabase(dataSource);
    await request(app.getHttpServer())
      .post('/user')
      .send({ name: 'Ann', ...creds })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  const login = () =>
    request(app.getHttpServer()).post('/auth/login').send(creds).expect(200);

  it('logs in with the right password', async () => {
    const res = await login();
    expect(res.body).toEqual({ access_token: expect.any(String) });
  });

  it.each([
    ['a wrong password', { ...creds, password: 'wrong-password' }],
    ['an unknown email', { ...creds, email: 'nobody@example.com' }],
    ['a missing password', { email: creds.email }],
  ])('rejects %s with 401', async (_, body) => {
    await request(app.getHttpServer()).post('/auth/login').send(body).expect(401);
  });

  it('returns the profile for a valid token', async () => {
    const { body } = await login();
    const res = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${body.access_token}`)
      .expect(200);
    expect(res.body).toEqual({ id: expect.any(Number), name: 'Ann', email: creds.email });
  });

  it('rejects a request with no token', async () => {
    await request(app.getHttpServer()).get('/auth/profile').expect(401);
  });

  it('rejects a tampered token', async () => {
    const { body } = await login();
    await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${body.access_token}x`)
      .expect(401);
  });
});
