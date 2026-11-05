import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DataSource, type EntityManager } from 'typeorm';
import { AppModule } from '../app.module.js';
import { User } from '../user/entities/user.entity.js';
import { Post } from '../post/entities/post.entity.js';

const logger = new Logger('Seed');

async function seed(manager: EntityManager) {
  // TODO: insert seed data, e.g.
  // const users = await manager.save(User, [{ ... }]);
  // await manager.save(Post, [{ ..., author: users[0] }]);

  const users = await manager.save(User, [
    {name: 'some guy', email: 'someguy@madeup.com', password: 'password'},
    {name: 'another guy', email: 'another@madeup.com', password: 'password'},
    {name: 'some lady', email: 'third@madeup.com', password: 'password'},
    {name: 'another lady', email: 'last@madeup.com', password: 'password'},
  ])

  await manager.save(Post, [
    { title: 'A Thing', content: 'This is some interesting content.', author: users[0] },
    { title: 'More on my mind', content: 'This is some interesting content.', author: users[0] },
    { title: 'My thing', content: 'This is some interesting content.', author: users[1] },
    { title: 'Different Stuff', content: 'This is some interesting content.', author: users[3] },
])
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  try {
    const dataSource = app.get(DataSource);
    await dataSource.transaction(seed);
    logger.log('Seeding complete');
  } catch (err) {
    logger.error('Seeding failed', err instanceof Error ? err.stack : err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

await bootstrap();
