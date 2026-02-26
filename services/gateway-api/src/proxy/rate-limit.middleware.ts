import { Injectable, NestMiddleware, HttpException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

/**
 * WHY: Rate Limiting으로 API 남용 방지
 * MVP: IP 기반 100 req/min (단순 구현)
 * V2: 사용자별 + 엔드포인트별 세분화
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private redis: Redis;
  private readonly LIMIT = 100; // req per window
  private readonly WINDOW = 60; // seconds

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    });
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const key = `rl:${req.ip}`;

    try {
      const current = await this.redis.incr(key);
      if (current === 1) await this.redis.expire(key, this.WINDOW);

      res.setHeader('X-RateLimit-Limit', this.LIMIT);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.LIMIT - current));

      if (current > this.LIMIT) {
        throw new HttpException({ code: 'RATE_LIMIT_EXCEEDED', message: '요청 한도 초과' }, 429);
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      // Redis 장애 시 요청은 통과시킴 (가용성 우선)
    }

    next();
  }
}
