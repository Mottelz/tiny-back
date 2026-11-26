import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { Repository } from 'typeorm';
import { hashPassword } from './password.js';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async create(dto: CreateUserDto) {
    const password = await hashPassword(dto.password);
    const user = this.users.create({ ...dto, password: password });
    const saved = await this.users.save(user);
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
    await this.users.update(id, changes);
    return this.findOne(id);
  }

  remove(id: number) {
    return this.users.delete(id);
  }
}
