import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(process.cwd(), '../../envs/.env.' + (process.env.NODE_ENV || 'dev')),
    }),
  ],
})
export class AppModule {}
