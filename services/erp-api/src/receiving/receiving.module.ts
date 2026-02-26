import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ReceivingEntity, AuditLogEntity } from '@itadx/database';
import { NotificationGateway } from '@itadx/websocket';
import { ReceivingController } from './receiving.controller';
import { ReceivingService } from './receiving.service';
import { CreditScoreProcessor } from '../queue/credit-score.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReceivingEntity, AuditLogEntity]),
    BullModule.registerQueue({ name: 'credit-score' }),
  ],
  controllers: [ReceivingController],
  providers: [ReceivingService, CreditScoreProcessor, NotificationGateway],
  exports: [ReceivingService],
})
export class ReceivingModule {}
