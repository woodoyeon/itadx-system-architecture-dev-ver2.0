import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.CORS_ORIGIN || '*' });

  const expressApp = app.getHttpAdapter().getInstance();

  // Rate Limiting (Redis IP 기반)
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    lazyConnect: true,
  });
  let redisConnected = false;
  try {
    await redis.connect();
    redisConnected = true;
  } catch {
    console.warn('Redis not available, rate limiting disabled');
  }

  const RATE_LIMIT = 100;
  const RATE_WINDOW = 60;
  expressApp.use(async (req: Request, res: Response, next: NextFunction) => {
    if (!redisConnected) return next();
    const key = `rl:${req.ip}`;
    try {
      const current = await redis.incr(key);
      if (current === 1) await redis.expire(key, RATE_WINDOW);
      res.setHeader('X-RateLimit-Limit', RATE_LIMIT);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT - current));
      if (current > RATE_LIMIT) {
        res.status(429).json({ success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: '요청 한도 초과' } });
        return;
      }
    } catch {
      // Redis 장애 시 요청 통과 (가용성 우선)
    }
    next();
  });

  // 프록시 라우트 설정
  const routes: Record<string, string> = {
    '/api/auth': `http://localhost:${process.env.AUTH_API_PORT || 4001}`,
    '/api/marts': `http://localhost:${process.env.ADMIN_API_PORT || 4000}`,
    '/api/branches': `http://localhost:${process.env.ADMIN_API_PORT || 4000}`,
    '/api/merchants': `http://localhost:${process.env.ADMIN_API_PORT || 4000}`,
    '/api/dashboard': `http://localhost:${process.env.ADMIN_API_PORT || 4000}`,
    '/api/users': `http://localhost:${process.env.ADMIN_API_PORT || 4000}`,
    '/api/receivings': `http://localhost:${process.env.ERP_API_PORT || 4002}`,
    '/api/settlements': `http://localhost:${process.env.ERP_API_PORT || 4002}`,
    '/api/v41': `http://localhost:${process.env.ENGINE_API_PORT || 8000}`,
    '/api/v10': `http://localhost:${process.env.ENGINE_API_PORT || 8000}`,
    '/api/dual-track': `http://localhost:${process.env.ENGINE_API_PORT || 8000}`,
    '/api/branch-risk': `http://localhost:${process.env.ENGINE_API_PORT || 8000}`,
  };

  // 각 라우트에 대해 프록시 미들웨어 등록
  for (const [pathPrefix, target] of Object.entries(routes)) {
    expressApp.use(
      pathPrefix,
      createProxyMiddleware({ target, changeOrigin: true }),
    );
  }

  const port = process.env.GATEWAY_API_PORT || 4003;
  await app.listen(port);
  console.log(`Gateway API running on :${port}`);
}
bootstrap();
