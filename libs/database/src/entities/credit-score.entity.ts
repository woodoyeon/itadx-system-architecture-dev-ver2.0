import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('credit_scores')
export class CreditScoreEntity extends BaseEntity {
  @Column({ name: 'merchant_id', type: 'uuid' }) merchantId: string;
  @Column({ type: 'integer' }) score: number;
  @Column({ type: 'varchar', length: 1 }) grade: string;
  @Column({ type: 'jsonb', nullable: true }) factors: Record<string, unknown> | null;
  @Column({ name: 'evaluated_at', type: 'timestamptz' }) evaluatedAt: Date;
  @Column({ name: 'triggered_by', type: 'varchar', length: 50, nullable: true }) triggeredBy: string | null;
}
