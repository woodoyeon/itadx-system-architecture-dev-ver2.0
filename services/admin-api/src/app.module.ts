import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MartEntity, BranchEntity, MerchantEntity, UserEntity, ReceivingEntity } from '@itadx/database';
import { JwtStrategy } from '@itadx/auth';
import { MartModule } from './mart/mart.module';
import { BranchModule } from './branch/branch.module';
import { MerchantModule } from './merchant/merchant.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UserModule } from './user/user.module';
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
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASS'),
        database: config.get('DB_NAME'),
        entities: [MartEntity, BranchEntity, MerchantEntity, UserEntity, ReceivingEntity],
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
    MartModule, BranchModule, MerchantModule, DashboardModule, UserModule,
  ],
  providers: [JwtStrategy],
})
export class AppModule {}
