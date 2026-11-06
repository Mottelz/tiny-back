import { INestApplication, ValidationPipe } from '@nestjs/common';

// Shared by main.ts and the e2e tests so both run the same request pipeline.
export function configureApp<T extends INestApplication>(app: T): T {
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  return app;
}
