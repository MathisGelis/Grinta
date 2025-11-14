import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async registerUser(userData: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { email: userData.email },
    });
    if (existing) throw new BadRequestException('Email already in use');

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newUser = this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });
    return await this.userRepository.save(newUser);
  }

  async findUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async updateUser(id: string, updateData: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    if (updateData.email && updateData.email !== user.email) {
      const existing = await this.userRepository.findOne({
        where: { email: updateData.email },
      });
      if (existing) throw new BadRequestException('Email already in use');
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    Object.assign(user, updateData);
    return await this.userRepository.save(user);
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`User with ID ${id} not found`);
    return { message: 'User deleted successfully' };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }
}
