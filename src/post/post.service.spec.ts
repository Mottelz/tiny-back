import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { PostService } from './post.service.js';
import { Post } from './entities/post.entity.js';
import {
  MockRepository,
  mockRepositoryProvider,
} from '../test/mock-repository.js';

const queryError = (code: string) =>
  new QueryFailedError('query', [], Object.assign(new Error(code), { code }));

describe('PostService', () => {
  let service: PostService;
  let repo: MockRepository<Post>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostService, mockRepositoryProvider(Post)],
    }).compile();

    service = module.get<PostService>(PostService);
    repo = module.get<MockRepository<Post>>(getRepositoryToken(Post));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = { title: 'Hi', content: 'Hello', authorId: 7 };

    it('builds the entity from the dto and saves it', async () => {
      const post = { id: 1, ...dto } as Post;
      repo.create!.mockReturnValue(post);
      repo.save!.mockResolvedValue(post);

      await expect(service.create(dto)).resolves.toBe(post);
      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(post);
    });

    it('throws BadRequestException when the author does not exist', async () => {
      repo.save!.mockRejectedValue(queryError('23503'));

      await expect(service.create(dto)).rejects.toThrow(
        new BadRequestException('User 7 does not exist'),
      );
    });

    it('rethrows other query errors', async () => {
      const err = queryError('23505');
      repo.save!.mockRejectedValue(err);

      await expect(service.create(dto)).rejects.toBe(err);
    });
  });

  describe('findAll', () => {
    it('returns all posts', async () => {
      const posts = [{ id: 1 }, { id: 2 }] as Post[];
      repo.find!.mockResolvedValue(posts);

      await expect(service.findAll()).resolves.toBe(posts);
    });
  });

  describe('findOne', () => {
    it('returns the post when found', async () => {
      const post = { id: 1 } as Post;
      repo.findOneBy!.mockResolvedValue(post);

      await expect(service.findOne(1)).resolves.toBe(post);
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('throws NotFoundException when missing', async () => {
      repo.findOneBy!.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates then returns the fresh post', async () => {
      const post = { id: 1, title: 'New' } as Post;
      repo.update!.mockResolvedValue({ affected: 1 });
      repo.findOneBy!.mockResolvedValue(post);

      await expect(service.update(1, { title: 'New' })).resolves.toBe(post);
      expect(repo.update).toHaveBeenCalledWith(1, { title: 'New' });
    });

    it('throws BadRequestException when the new author does not exist', async () => {
      repo.update!.mockRejectedValue(queryError('23503'));

      await expect(service.update(1, { authorId: 9 })).rejects.toThrow(
        new BadRequestException('User 9 does not exist'),
      );
      expect(repo.findOneBy).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the post does not exist', async () => {
      repo.update!.mockResolvedValue({ affected: 0 });
      repo.findOneBy!.mockResolvedValue(null);

      await expect(service.update(1, { title: 'New' })).rejects.toBeInstanceOf(
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
