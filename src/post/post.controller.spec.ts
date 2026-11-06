import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PostController } from './post.controller.js';
import { PostService } from './post.service.js';
import { Post } from './entities/post.entity.js';
import {
  MockRepository,
  mockRepositoryProvider,
} from '../test/mock-repository.js';

describe('PostController', () => {
  let controller: PostController;
  let repo: MockRepository<Post>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [PostService, mockRepositoryProvider(Post)],
    }).compile();

    controller = module.get<PostController>(PostController);
    repo = module.get<MockRepository<Post>>(getRepositoryToken(Post));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create saves and returns the new post', async () => {
    const dto = { title: 'Hi', content: 'Hello', authorId: 1 };
    const post = { id: 1, ...dto } as Post;
    repo.create!.mockReturnValue(post);
    repo.save!.mockResolvedValue(post);

    await expect(controller.create(dto)).resolves.toBe(post);
    expect(repo.create).toHaveBeenCalledWith(dto);
  });

  it('findAll returns posts from the repository', async () => {
    const posts = [{ id: 1 }] as Post[];
    repo.find!.mockResolvedValue(posts);

    await expect(controller.findAll()).resolves.toBe(posts);
  });

  it('findOne converts the id to a number', async () => {
    const post = { id: 2 } as Post;
    repo.findOneBy!.mockResolvedValue(post);

    await expect(controller.findOne('2')).resolves.toBe(post);
    expect(repo.findOneBy).toHaveBeenCalledWith({ id: 2 });
  });

  it('findOne throws NotFoundException when missing', async () => {
    repo.findOneBy!.mockResolvedValue(null);

    await expect(controller.findOne('2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update updates and returns the post', async () => {
    const post = { id: 3, title: 'New' } as Post;
    repo.update!.mockResolvedValue({ affected: 1 });
    repo.findOneBy!.mockResolvedValue(post);

    await expect(controller.update('3', { title: 'New' })).resolves.toBe(post);
    expect(repo.update).toHaveBeenCalledWith(3, { title: 'New' });
  });

  it('remove deletes the post by numeric id', async () => {
    repo.delete!.mockResolvedValue({ affected: 1 });

    await controller.remove('4');
    expect(repo.delete).toHaveBeenCalledWith(4);
  });
});
