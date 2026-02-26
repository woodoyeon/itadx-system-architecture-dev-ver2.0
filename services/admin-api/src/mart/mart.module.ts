import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MartEntity } from '@itadx/database';
import { MartController } from './mart.controller';
import { MartService } from './mart.service';

@Module({
  imports: [TypeOrmModule.forFeature([MartEntity])],
  controllers: [MartController],
  providers: [MartService],
  exports: [MartService],
})
export class MartModule {}
