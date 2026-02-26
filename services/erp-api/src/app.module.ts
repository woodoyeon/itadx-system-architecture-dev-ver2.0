import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ReceivingEntity, SettlementEntity, AuditLogEntity, CreditScoreEntity, MerchantEntity, MartEntity } from '@itadx/database';
import { JwtStrategy } from '@itadx/auth';
import { NotificationGateway } from '@itadx/websocket';
import { ReceivingModule } from './receiving/receiving.module';
import { SettlementModule } from './settlement/settlement.module';
import * as path from 'path';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(process.cwd(), '../../envs/.env.' + (process.env.NODE_ENV || 'dev')),
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USER: Joi.string().required(),
        DB_PASS: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        JWT_SECRET: Joi.string().required().min(32),
        JWT_ACCESS_EXPIRES: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRES: Joi.string().default('7d'),
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASS'),
        database: config.get('DB_NAME'),
        entities: [ReceivingEntity, SettlementEntity, AuditLogEntity, CreditScoreEntity, MerchantEntity, MartEntity],
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: { host: config.get('REDIS_HOST'), port: config.get<number>('REDIS_PORT') },
      }),
    }),
    ReceivingModule,
    SettlementModule,
  ],
  providers: [JwtStrategy, NotificationGateway],
})
export class AppModule {}
