import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('audit_logs')
export class AuditLogEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', nullable: true }) userId: string | null;
  @Column({ type: 'varchar', length: 100 }) action: string;
  @Column({ name: 'entity_type', type: 'varchar', length: 50, nullable: true }) entityType: string | null;
  @Column({ name: 'entity_id', type: 'uuid', nullable: true }) entityId: string | null;
  @Column({ type: 'jsonb', nullable: true }) changes: Record<string, unknown> | null;
  @Column({ name: 'trace_id', type: 'varchar', length: 100, nullable: true }) traceId: string | null;
  @Column({ type: 'varchar', length: 50, nullable: true }) ip: string | null;
  @Column({ name: 'user_agent', type: 'text', nullable: true }) userAgent: string | null;
}
