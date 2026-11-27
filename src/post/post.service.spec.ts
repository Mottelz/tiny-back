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

    it('saves the post, then returns it with its author', async () => {
      const post = { id: 1, ...dto } as Post;
      const withAuthor = { id: 1, ...dto, author: { id: 7, name: 'Ann' } } as Post;
      repo.create!.mockReturnValue(post);
      repo.save!.mockResolvedValue(post);
      repo.findOne!.mockResolvedValue(withAuthor);

      await expect(service.create(dto)).resolves.toBe(withAuthor);
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
    it('returns all posts with their authors, newest first', async () => {
      const posts = [{ id: 2 }, { id: 1 }] as Post[];
      repo.find!.mockResolvedValue(posts);

      await expect(service.findAll()).resolves.toBe(posts);
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: { author: true },
          order: { id: 'DESC' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the post when found', async () => {
      const post = { id: 1 } as Post;
      repo.findOne!.mockResolvedValue(post);

      await expect(service.findOne(1)).resolves.toBe(post);
      expect(repo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
    });

    it('throws NotFoundException when missing', async () => {
      repo.findOne!.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates then returns the fresh post', async () => {
      const post = { id: 1, title: 'New' } as Post;
      repo.update!.mockResolvedValue({ affected: 1 });
      repo.findOne!.mockResolvedValue(post);

      await expect(service.update(1, { title: 'New' })).resolves.toBe(post);
      expect(repo.update).toHaveBeenCalledWith(1, { title: 'New' });
    });

    it('throws BadRequestException when the new author does not exist', async () => {
      repo.update!.mockRejectedValue(queryError('23503'));

      await expect(service.update(1, { authorId: 9 })).rejects.toThrow(
        new BadRequestException('User 9 does not exist'),
      );
      expect(repo.findOne).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the post does not exist', async () => {
      repo.update!.mockResolvedValue({ affected: 0 });
      repo.findOne!.mockResolvedValue(null);

      await expect(service.update(1, { title: 'New' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deletes by id', async () => {
      repo.delete!.mockResolvedValue({ affected: 1, raw: [] });

      await expect(service.remove(1)).resolves.toBeUndefined();
      expect(repo.delete).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException when nothing was deleted', async () => {
      repo.delete!.mockResolvedValue({ affected: 0, raw: [] });

      await expect(service.remove(1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
