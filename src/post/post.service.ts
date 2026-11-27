import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity.js';
import { type FindOneOptions, QueryFailedError, Repository } from 'typeorm';

const FK_VIOLATION = '23503';

// Every post goes out with its author's id and name (never the email).
const WITH_AUTHOR: FindOneOptions<Post> = {
  relations: { author: true },
  select: {
    id: true,
    title: true,
    content: true,
    authorId: true,
    author: { id: true, name: true },
  },
};

@Injectable()
export class PostService {
  constructor(@InjectRepository(Post) private readonly posts: Repository<Post>) {}

  async create(dto: CreatePostDto) {
    const post = this.posts.create(dto);
    const saved = await this.withAuthorCheck(dto.authorId, () => this.posts.save(post));
    return this.findOne(saved.id);
  }

  findAll() {
    return this.posts.find({ ...WITH_AUTHOR, order: { id: 'DESC' } });
  }

  async findOne(id: number) {
    const post = await this.posts.findOne({ ...WITH_AUTHOR, where: { id } });
    if (!post) throw new NotFoundException();
    return post;
  }

  async update(id: number, dto: UpdatePostDto) {
    await this.withAuthorCheck(dto.authorId, () => this.posts.update(id, dto));
    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.posts.delete(id);
    if (!result.affected) throw new NotFoundException();
  }

  private async withAuthorCheck<T>(authorId: number | undefined, op: () => Promise<T>) {
    try {
      return await op();
    } catch (err) {
      if (err instanceof QueryFailedError && (err.driverError as { code?: string }).code === FK_VIOLATION) {
        throw new BadRequestException(`User ${authorId} does not exist`);
      }
      throw err;
    }
  }
}
