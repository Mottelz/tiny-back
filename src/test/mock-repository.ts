import { Provider } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { Mock, vi } from 'vitest';

export type MockRepository<T extends ObjectLiteral = ObjectLiteral> = {
  [K in keyof Repository<T>]?: Mock;
};

export const createMockRepository = <
  T extends ObjectLiteral = ObjectLiteral,
>(): MockRepository<T> => ({
  create: vi.fn(),
  save: vi.fn(),
  find: vi.fn(),
  findOne: vi.fn(),
  findOneBy: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

export const mockRepositoryProvider = (
  entity: Parameters<typeof getRepositoryToken>[0],
): Provider => ({
  provide: getRepositoryToken(entity),
  useFactory: createMockRepository,
});
