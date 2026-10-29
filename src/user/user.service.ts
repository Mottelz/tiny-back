import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>){}

  create(dto: CreateUserDto) {
    const user = this.users.create(dto);
    return this.users.save(user);
  }

  findAll() {
    return this.users.find();
  }

  async findOne(id: number) {
    const user = await this.users.findOneBy({ id });
    if (!user) throw new NotFoundException();
    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.users.update(id, dto);
    return this.findOne(id);
  }

  remove(id: number) {
    return this.users.delete(id);
  }
}
