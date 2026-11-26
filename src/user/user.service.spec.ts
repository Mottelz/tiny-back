import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { UserService } from './user.service.js';
import { User } from './entities/user.entity.js';
import {
  MockRepository,
  mockRepositoryProvider,
} from '../test/mock-repository.js';
import { verifyPassword } from './password.js';

describe('UserService', () => {
  let service: UserService;
  let repo: MockRepository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, mockRepositoryProvider(User)],
    }).compile();

    service = module.get<UserService>(UserService);
    repo = module.get<MockRepository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('hashes the password and returns the user without it', async () => {
      const dto = { name: 'Ann', email: 'ann@example.com', password: 'secret123' };
      const user = { id: 1, name: dto.name, email: dto.email } as User;
      repo.create!.mockImplementation((data) => data);
      repo.save!.mockResolvedValue(user);
      repo.findOneBy!.mockResolvedValue(user)

      await expect(service.create(dto)).resolves.toBe(user);
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 1 })

      const created = repo.create!.mock.calls[0][0];
      expect(created.password).not.toBe(dto.password);
      expect(await verifyPassword(created.password, dto.password)).toBe(true);
    });
  });

  describe('findAll', () => {
    it('returns all users', async () => {
      const users = [{ id: 1 }, { id: 2 }] as User[];
      repo.find!.mockResolvedValue(users);

      await expect(service.findAll()).resolves.toBe(users);
    });
  });

  describe('findOne', () => {
    it('returns the user when found', async () => {
      const user = { id: 1 } as User;
      repo.findOneBy!.mockResolvedValue(user);

      await expect(service.findOne(1)).resolves.toBe(user);
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('throws NotFoundException when missing', async () => {
      repo.findOneBy!.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates then returns the fresh user', async () => {
      const user = { id: 1, name: 'New' } as User;
      repo.update!.mockResolvedValue({ affected: 1 });
      repo.findOneBy!.mockResolvedValue(user);

      await expect(service.update(1, { name: 'New' })).resolves.toBe(user);
      expect(repo.update).toHaveBeenCalledWith(1, { name: 'New' });
    });

    it('throws NotFoundException when the user does not exist', async () => {
      repo.update!.mockResolvedValue({ affected: 0 });
      repo.findOneBy!.mockResolvedValue(null);

      await expect(service.update(1, { name: 'New' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deletes by id', async () => {
      const result = { affected: 1, raw: [] };
      repo.delete!.mockResolvedValue(result);

      await expect(service.remove(1)).resolves.toBe(result);
      expect(repo.delete).toHaveBeenCalledWith(1);
    });
  });
});
