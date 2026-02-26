import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '@itadx/database';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectRepository(UserEntity) private userRepo: Repository<UserEntity>) {}

  async findAll(): Promise<Omit<UserEntity, 'passwordHash'>[]> {
    const users = await this.userRepo.find({ order: { createdAt: 'DESC' } });
    return users.map(({ passwordHash, ...rest }) => rest) as Omit<UserEntity, 'passwordHash'>[];
  }

  async create(dto: CreateUserDto): Promise<Omit<UserEntity, 'passwordHash'>> {
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const { password: _p, ...rest } = dto;
    const user = this.userRepo.create({
      ...rest,
      passwordHash,
      role: rest.role as 'bank' | 'mart' | 'admin',
    });
    const saved = await this.userRepo.save(user);
    const { passwordHash: _h, ...result } = saved;
    return result as Omit<UserEntity, 'passwordHash'>;
  }

  async deactivate(id: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException();
    await this.userRepo.update(id, { isActive: false });
  }
}
