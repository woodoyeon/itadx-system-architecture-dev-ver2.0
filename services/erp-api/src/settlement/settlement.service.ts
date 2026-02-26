import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettlementEntity } from '@itadx/database';

@Injectable()
export class SettlementService {
  constructor(@InjectRepository(SettlementEntity) private repo: Repository<SettlementEntity>) {}

  async findAll(filters: { martId?: string; status?: string }) {
    const where: Record<string, unknown> = {};
    if (filters.martId) where.martId = filters.martId;
    if (filters.status) where.status = filters.status;
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<SettlementEntity> {
    const s = await this.repo.findOne({ where: { id } });
    if (!s) throw new NotFoundException();
    return s;
  }

  async complete(id: string): Promise<SettlementEntity> {
    const s = await this.findOne(id);
    s.status = 'completed';
    s.settledAt = new Date();
    return this.repo.save(s);
  }
}
