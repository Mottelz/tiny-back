import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { QueryFailedError, Repository } from 'typeorm';
import { hashPassword } from './password.js';

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async create(dto: CreateUserDto) {
    const password = await hashPassword(dto.password);
    const user = this.users.create({ ...dto, password: password });
    const saved = await this.withUniqueEmail(() => this.users.save(user));
    return this.findOne(saved.id);
  }

  findAll() {
    return this.users.find();
  }

  findByEmailWithPassword(email: string) {
    return this.users.findOne({
      where: { email },
      select: { id: true, email: true, password: true }
    });
  }

  async findOne(id: number) {
    const user = await this.users.findOneBy({ id });
    if (!user) throw new NotFoundException();
    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    const changes = dto.password ? { ...dto, password: await hashPassword(dto.password) } : dto;
    await this.withUniqueEmail(() => this.users.update(id, changes));
    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.users.delete(id);
    if (!result.affected) throw new NotFoundException();
  }

  // `email` is the only unique column, so a unique violation means it is taken.
  private async withUniqueEmail<T>(op: () => Promise<T>) {
    try {
      return await op();
    } catch (err) {
      if (err instanceof QueryFailedError && (err.driverError as { code?: string }).code === UNIQUE_VIOLATION) {
        throw new ConflictException('Email already in use');
      }
      throw err;
    }
  }
}
