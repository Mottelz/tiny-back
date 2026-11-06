import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';
import { User } from '../../src/user/entities/user.entity.js';
import { Post } from '../../src/post/entities/post.entity.js';

export async function createTestApp() {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = configureApp(
    moduleFixture.createNestApplication<INestApplication<App>>(),
  );
  await app.init();

  return { app, dataSource: app.get(DataSource) };
}

export async function resetDatabase(dataSource: DataSource) {
  const { database } = dataSource.options;
  if (typeof database !== 'string' || !database.endsWith('_test')) {
    throw new Error(
      `Refusing to truncate non-test database ${JSON.stringify(database)}`,
    );
  }

  const tables = dataSource.entityMetadatas
    .map((meta) => `"${meta.tableName}"`)
    .join(', ');
  await dataSource.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);
}

export async function seedUser(
  dataSource: DataSource,
  overrides: Partial<User> = {},
) {
  return dataSource.getRepository(User).save({
    name: 'Ann',
    email: `ann-${crypto.randomUUID()}@example.com`,
    password: 'password123',
    ...overrides,
  });
}

export async function seedPost(
  dataSource: DataSource,
  authorId: number,
  overrides: Partial<Post> = {},
) {
  return dataSource.getRepository(Post).save({
    title: 'A Thing',
    content: 'Some interesting content.',
    authorId,
    ...overrides,
  });
}
