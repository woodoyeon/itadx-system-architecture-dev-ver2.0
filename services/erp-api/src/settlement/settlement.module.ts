import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettlementEntity } from '@itadx/database';
import { SettlementController } from './settlement.controller';
import { SettlementService } from './settlement.service';

@Module({
  imports: [TypeOrmModule.forFeature([SettlementEntity])],
  controllers: [SettlementController],
  providers: [SettlementService],
})
export class SettlementModule {}
