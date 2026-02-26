import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

/**
 * WHY: Gateway가 URL 경로 기반으로 백엔드 서비스를 라우팅
 * /api/auth/* → auth-api:4001
 * /api/marts/*, /api/branches/*, /api/merchants/*, /api/dashboard/*, /api/users/* → admin-api:4000
 * /api/receivings/*, /api/settlements/* → erp-api:4002
 * /api/v41/*, /api/v10/*, /api/dual-track/*, /api/branch-risk/* → engine-api:8000
 */
@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ProxyMiddleware.name);

  private readonly routes: Record<string, string> = {
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

  use(req: Request, res: Response, next: NextFunction): void {
    const path = req.path;
    const target = Object.entries(this.routes).find(([prefix]) => path.startsWith(prefix));

    if (!target) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
      return;
    }

    this.logger.debug(`Proxy: ${path} → ${target[1]}`);
    const proxy = createProxyMiddleware({ target: target[1], changeOrigin: true }) as (req: Request, res: Response, next: NextFunction) => void;
    proxy(req, res, next);
  }
}
