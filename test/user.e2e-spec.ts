import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import {
  createTestApp,
  resetDatabase,
  seedPost,
  seedUser,
} from './setup/app.js';

describe('UserController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDatabase(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /user', () => {
    const dto = { name: 'Ann', email: 'ann@example.com', password: 'secret123' };

    it('creates a user', async () => {
      const res = await request(app.getHttpServer())
        .post('/user')
        .send(dto)
        .expect(201);

      expect(res.body).toMatchObject({
        id: expect.any(Number),
        name: dto.name,
        email: dto.email,
      });
    });

    it.each([
      ['a missing name', { ...dto, name: undefined }],
      ['an empty name', { ...dto, name: '' }],
      ['an invalid email', { ...dto, email: 'not-an-email' }],
      ['a short password', { ...dto, password: 'short' }],
      ['an unknown field', { ...dto, isAdmin: true }],
    ])('rejects %s with 400', async (_, body) => {
      await request(app.getHttpServer()).post('/user').send(body).expect(400);
    });
  });

  describe('GET /user', () => {
    it('returns an empty list when there are no users', async () => {
      await request(app.getHttpServer()).get('/user').expect(200).expect([]);
    });

    it('returns all users without passwords', async () => {
      await seedUser(dataSource, { name: 'Ann' });
      await seedUser(dataSource, { name: 'Bob' });

      const res = await request(app.getHttpServer()).get('/user').expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body.map((u: { name: string }) => u.name).sort()).toEqual([
        'Ann',
        'Bob',
      ]);
      for (const user of res.body) {
        expect(user).not.toHaveProperty('password');
      }
    });
  });

  describe('GET /user/:id', () => {
    it('returns the user without the password', async () => {
      const user = await seedUser(dataSource);

      const res = await request(app.getHttpServer())
        .get(`/user/${user.id}`)
        .expect(200);

      expect(res.body).toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
      });
    });

    it('returns 404 for an unknown id', async () => {
      await request(app.getHttpServer()).get('/user/999').expect(404);
    });
  });

  describe('PATCH /user/:id', () => {
    it('updates the given fields and returns the user', async () => {
      const user = await seedUser(dataSource, { name: 'Ann' });

      const res = await request(app.getHttpServer())
        .patch(`/user/${user.id}`)
        .send({ name: 'Annie' })
        .expect(200);

      expect(res.body).toMatchObject({
        id: user.id,
        name: 'Annie',
        email: user.email,
      });
    });

    it('rejects an invalid email with 400', async () => {
      const user = await seedUser(dataSource);

      await request(app.getHttpServer())
        .patch(`/user/${user.id}`)
        .send({ email: 'not-an-email' })
        .expect(400);
    });

    it('returns 404 for an unknown id', async () => {
      await request(app.getHttpServer())
        .patch('/user/999')
        .send({ name: 'Ghost' })
        .expect(404);
    });
  });

  describe('DELETE /user/:id', () => {
    it('deletes the user', async () => {
      const user = await seedUser(dataSource);

      await request(app.getHttpServer())
        .delete(`/user/${user.id}`)
        .expect(200);
      await request(app.getHttpServer()).get(`/user/${user.id}`).expect(404);
    });

    it("cascades to the user's posts", async () => {
      const user = await seedUser(dataSource);
      const post = await seedPost(dataSource, user.id);

      await request(app.getHttpServer())
        .delete(`/user/${user.id}`)
        .expect(200);
      await request(app.getHttpServer()).get(`/post/${post.id}`).expect(404);
    });
  });
});
