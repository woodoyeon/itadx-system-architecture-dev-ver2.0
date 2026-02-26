import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { DataSource } from 'typeorm';
import { AUDIT_KEY } from '../decorators/auditable.decorator';
import { generateTraceId } from '@itadx/common';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private dataSource: DataSource,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const action = this.reflector.get<string>(AUDIT_KEY, context.getHandler());
    if (!action) return next.handle();

    const request = context.switchToHttp().getRequest();
    const traceId = generateTraceId();
    request.headers['x-trace-id'] = traceId;

    return next.handle().pipe(
      tap(async (response) => {
        try {
          await this.dataSource.query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes, trace_id, ip, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              request.user?.sub || null,
              action,
              request.params?.id ? request.route?.path?.split('/')[1] || 'unknown' : 'unknown',
              request.params?.id || null,
              JSON.stringify({ body: request.body, response }),
              traceId,
              request.ip,
              request.headers['user-agent'] || null,
            ],
          );
        } catch (err) {
          console.error('Audit log failed:', err);
        }
      }),
    );
  }
}
