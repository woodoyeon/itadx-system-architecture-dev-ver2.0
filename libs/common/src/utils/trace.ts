import { randomUUID } from 'crypto';

/** Trace ID 생성 (요청 추적용) */
export function generateTraceId(): string {
  return `trace-${randomUUID().slice(0, 8)}-${Date.now()}`;
}
