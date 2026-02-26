import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * WHY: Redis 세션 관리로 JWT 블랙리스트 및 동시 접속 제한 구현
 * MVP에서는 기본 구현, V2에서 sliding window 확장
 */
@Injectable()
export class SessionService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    });
  }

  /** JWT 블랙리스트에 추가 (로그아웃 시) */
  async blacklistToken(jti: string, ttlSec: number): Promise<void> {
    await this.redis.set(`bl:${jti}`, '1', 'EX', ttlSec);
  }

  /** 토큰이 블랙리스트에 있는지 확인 */
  async isBlacklisted(jti: string): Promise<boolean> {
    return (await this.redis.exists(`bl:${jti}`)) === 1;
  }
}
