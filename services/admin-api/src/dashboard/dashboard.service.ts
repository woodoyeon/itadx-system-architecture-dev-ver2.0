import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MartEntity, MerchantEntity, ReceivingEntity } from '@itadx/database';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(MartEntity) private martRepo: Repository<MartEntity>,
    @InjectRepository(MerchantEntity) private merchantRepo: Repository<MerchantEntity>,
    @InjectRepository(ReceivingEntity) private receivingRepo: Repository<ReceivingEntity>,
  ) {}

  async getBankKPI() {
    const [totalMarts, totalMerchants, pendingReceivings] = await Promise.all([
      this.martRepo.count(),
      this.merchantRepo.count(),
      this.receivingRepo.count({ where: { status: 'pending' as const } }),
    ]);

    const totalAmount = await this.receivingRepo
      .createQueryBuilder('r')
      .select('SUM(r.total_amount)', 'sum')
      .where('r.status = :status', { status: 'confirmed' })
      .getRawOne();

    return {
      totalMarts,
      totalMerchants,
      pendingReceivings,
      confirmedAmount: Number(totalAmount?.sum) || 0,
    };
  }

  async getMartKPI(martId: string) {
    const [totalMerchants, pendingReceivings, confirmedReceivings] = await Promise.all([
      this.merchantRepo.count({ where: { martId } }),
      this.receivingRepo.count({ where: { martId, status: 'pending' as const } }),
      this.receivingRepo.count({ where: { martId, status: 'confirmed' as const } }),
    ]);
    return { totalMerchants, pendingReceivings, confirmedReceivings };
  }
}
