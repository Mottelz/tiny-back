import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity.js';
import { QueryFailedError, Repository } from 'typeorm';

const FK_VIOLATION = '23503';

@Injectable()
export class PostService {
  constructor(@InjectRepository(Post) private readonly posts: Repository<Post>) {}

  async create(dto: CreatePostDto) {
    const post = this.posts.create(dto);
    return this.withAuthorCheck(dto.authorId, () => this.posts.save(post));
  }

  findAll() {
    return this.posts.find();
  }

  async findOne(id: number) {
    const post = await this.posts.findOneBy({ id });
    if (!post) throw new NotFoundException();
    return post;
  }

  async update(id: number, dto: UpdatePostDto) {
    await this.withAuthorCheck(dto.authorId, () => this.posts.update(id, dto));
    return this.findOne(id);
  }

  remove(id: number) {
    return this.posts.delete(id);
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
