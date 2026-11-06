import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { User } from './entities/user.entity.js';
import {
  MockRepository,
  mockRepositoryProvider,
} from '../test/mock-repository.js';
import { NotFoundException } from '@nestjs/common';

describe('UserController', () => {
  let controller: UserController;
  let repo: MockRepository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService, mockRepositoryProvider(User)],
    }).compile();

    controller = module.get<UserController>(UserController);
    repo = module.get<MockRepository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create saves and returns the new user', async () => {
    const dto = { name: 'Ann', email: 'ann@example.com', password: 'secret123' };
    const user = { id: 1, ...dto } as User;
    repo.create!.mockReturnValue(user);
    repo.save!.mockResolvedValue(user);

    await expect(controller.create(dto)).resolves.toBe(user);
    expect(repo.create).toHaveBeenCalledWith(dto);
  });

  it('findAll returns users from the repository', async () => {
    const users = [{ id: 1 }] as User[];
    repo.find!.mockResolvedValue(users);

    await expect(controller.findAll()).resolves.toBe(users);
  });

  it('findOne converts the id to a number', async () => {
    const user = { id: 2 } as User;
    repo.findOneBy!.mockResolvedValue(user);

    await expect(controller.findOne('2')).resolves.toBe(user);
    expect(repo.findOneBy).toHaveBeenCalledWith({ id: 2 });
  });

  it('findOne should throw error if does not exist', async () => {
    repo.findOneBy!.mockResolvedValue(null);

    await expect(controller.findOne('2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update updates and returns the user', async () => {
    const user = { id: 3, name: 'Bob' } as User;
    repo.update!.mockResolvedValue({ affected: 1 });
    repo.findOneBy!.mockResolvedValue(user);

    await expect(controller.update('3', { name: 'Bob' })).resolves.toBe(user);
    expect(repo.update).toHaveBeenCalledWith(3, { name: 'Bob' });
  });

  it('remove deletes the user by numeric id', async () => {
    repo.delete!.mockResolvedValue({ affected: 1 });

    await controller.remove('4');
    expect(repo.delete).toHaveBeenCalledWith(4);
  });
});
