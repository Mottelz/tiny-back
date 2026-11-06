import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { User } from '../src/user/entities/user.entity.js';
import {
  createTestApp,
  resetDatabase,
  seedPost,
  seedUser,
} from './setup/app.js';

describe('PostController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let author: User;

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDatabase(dataSource);
    author = await seedUser(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /post', () => {
    const dto = () => ({ title: 'Hi', content: 'Hello', authorId: author.id });

    it('creates a post', async () => {
      const res = await request(app.getHttpServer())
        .post('/post')
        .send(dto())
        .expect(201);

      expect(res.body).toMatchObject({ id: expect.any(Number), ...dto() });
    });

    it('returns 400 when the author does not exist', async () => {
      const res = await request(app.getHttpServer())
        .post('/post')
        .send({ ...dto(), authorId: 999 })
        .expect(400);

      expect(res.body.message).toBe('User 999 does not exist');
    });

    it.each([
      ['a missing title', { title: undefined }],
      ['an empty content', { content: '' }],
      ['a missing authorId', { authorId: undefined }],
      ['a string authorId', { authorId: '1' }],
      ['a negative authorId', { authorId: -1 }],
      ['an unknown field', { likes: 5 }],
    ])('rejects %s with 400', async (_, override) => {
      await request(app.getHttpServer())
        .post('/post')
        .send({ ...dto(), ...override })
        .expect(400);
    });
  });

  describe('GET /post', () => {
    it('returns an empty list when there are no posts', async () => {
      await request(app.getHttpServer()).get('/post').expect(200).expect([]);
    });

    it('returns all posts', async () => {
      await seedPost(dataSource, author.id, { title: 'First' });
      await seedPost(dataSource, author.id, { title: 'Second' });

      const res = await request(app.getHttpServer()).get('/post').expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body.map((p: { title: string }) => p.title).sort()).toEqual([
        'First',
        'Second',
      ]);
    });
  });

  describe('GET /post/:id', () => {
    it('returns the post', async () => {
      const post = await seedPost(dataSource, author.id);

      await request(app.getHttpServer())
        .get(`/post/${post.id}`)
        .expect(200)
        .expect({
          id: post.id,
          title: post.title,
          content: post.content,
          authorId: author.id,
        });
    });

    it('returns 404 for an unknown id', async () => {
      await request(app.getHttpServer()).get('/post/999').expect(404);
    });
  });

  describe('PATCH /post/:id', () => {
    it('updates the given fields and returns the post', async () => {
      const post = await seedPost(dataSource, author.id);

      const res = await request(app.getHttpServer())
        .patch(`/post/${post.id}`)
        .send({ title: 'Updated' })
        .expect(200);

      expect(res.body).toMatchObject({
        id: post.id,
        title: 'Updated',
        content: post.content,
      });
    });

    it('can move the post to another author', async () => {
      const other = await seedUser(dataSource);
      const post = await seedPost(dataSource, author.id);

      const res = await request(app.getHttpServer())
        .patch(`/post/${post.id}`)
        .send({ authorId: other.id })
        .expect(200);

      expect(res.body.authorId).toBe(other.id);
    });

    it('returns 400 when the new author does not exist', async () => {
      const post = await seedPost(dataSource, author.id);

      const res = await request(app.getHttpServer())
        .patch(`/post/${post.id}`)
        .send({ authorId: 999 })
        .expect(400);

      expect(res.body.message).toBe('User 999 does not exist');
    });

    it('returns 404 for an unknown id', async () => {
      await request(app.getHttpServer())
        .patch('/post/999')
        .send({ title: 'Ghost' })
        .expect(404);
    });
  });

  describe('DELETE /post/:id', () => {
    it('deletes the post but keeps the author', async () => {
      const post = await seedPost(dataSource, author.id);

      await request(app.getHttpServer())
        .delete(`/post/${post.id}`)
        .expect(200);
      await request(app.getHttpServer()).get(`/post/${post.id}`).expect(404);
      await request(app.getHttpServer()).get(`/user/${author.id}`).expect(200);
    });
  });
});
