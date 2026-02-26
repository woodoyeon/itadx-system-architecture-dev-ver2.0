import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CreditScoreProcessor } from './credit-score.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'credit-score' })],
  providers: [CreditScoreProcessor],
})
export class QueueModule {}
