import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MartEntity, MerchantEntity, ReceivingEntity } from '@itadx/database';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([MartEntity, MerchantEntity, ReceivingEntity])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
