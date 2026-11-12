import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));
  // Lets a front end on another origin (e.g. Vite on :5173) call the API.
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();
