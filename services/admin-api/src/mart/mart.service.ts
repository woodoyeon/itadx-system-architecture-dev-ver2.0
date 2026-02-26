import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { MartEntity } from '@itadx/database';
import { ErrorCodes, BusinessException, PaginationDto } from '@itadx/common';
import { CreateMartDto } from './dto/create-mart.dto';
import { UpdateMartDto } from './dto/update-mart.dto';

@Injectable()
export class MartService {
  constructor(@InjectRepository(MartEntity) private martRepo: Repository<MartEntity>) {}

  async findAll(query: PaginationDto & { search?: string }) {
    const { page, limit, sortBy, sortOrder, search } = query;
    const where = search ? { name: Like(`%${search}%`) } : {};

    const [items, total] = await this.martRepo.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit };
  }

  async findOne(id: string): Promise<MartEntity> {
    const mart = await this.martRepo.findOne({ where: { id } });
    if (!mart) throw new NotFoundException(ErrorCodes.MART_NOT_FOUND);
    return mart;
  }

  async create(dto: CreateMartDto): Promise<MartEntity> {
    const exists = await this.martRepo.findOne({ where: { businessNumber: dto.businessNumber } });
    if (exists) throw new BusinessException(ErrorCodes.DUPLICATE_BUSINESS_NUMBER, '중복된 사업자번호입니다.');
    return this.martRepo.save(this.martRepo.create(dto));
  }

  async update(id: string, dto: UpdateMartDto): Promise<MartEntity> {
    const mart = await this.findOne(id);
    Object.assign(mart, dto);
    return this.martRepo.save(mart);
  }

  async remove(id: string): Promise<void> {
    const mart = await this.findOne(id);
    await this.martRepo.remove(mart);
  }
}
