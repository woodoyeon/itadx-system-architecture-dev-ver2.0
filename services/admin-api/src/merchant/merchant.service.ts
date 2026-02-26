import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { MerchantEntity } from '@itadx/database';
import { ErrorCodes, BusinessException, PaginationDto } from '@itadx/common';

@Injectable()
export class MerchantService {
  constructor(@InjectRepository(MerchantEntity) private repo: Repository<MerchantEntity>) {}

  async findAll(martId: string, query: PaginationDto & { search?: string }) {
    const { page, limit, sortBy, sortOrder, search } = query;
    const where: Record<string, unknown> = { martId };
    if (search) where.name = Like(`%${search}%`);

    const [items, total] = await this.repo.findAndCount({
      where, order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit, take: limit,
    });
    return { items, total, page, limit };
  }

  async findOne(id: string): Promise<MerchantEntity> {
    const m = await this.repo.findOne({ where: { id }, relations: ['mart'] });
    if (!m) throw new NotFoundException(ErrorCodes.MERCHANT_NOT_FOUND);
    return m;
  }

  async create(dto: Partial<MerchantEntity>): Promise<MerchantEntity> {
    const exists = await this.repo.findOne({ where: { businessNumber: dto.businessNumber } });
    if (exists) throw new BusinessException(ErrorCodes.DUPLICATE_BUSINESS_NUMBER, '중복된 사업자번호');
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: Partial<MerchantEntity>): Promise<MerchantEntity> {
    const m = await this.findOne(id);
    Object.assign(m, dto);
    return this.repo.save(m);
  }
}
