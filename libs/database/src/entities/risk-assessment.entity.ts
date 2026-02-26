import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('risk_assessments')
export class RiskAssessmentEntity extends BaseEntity {
  @Column({ name: 'mart_id', type: 'uuid' }) martId: string;
  @Column({ name: 'track_a_level', type: 'integer' }) trackALevel: number;
  @Column({ name: 'track_b_level', type: 'integer' }) trackBLevel: number;
  @Column({ name: 'final_level', type: 'integer' }) finalLevel: number;
  @Column({ type: 'jsonb', nullable: true }) details: Record<string, unknown> | null;
  @Column({ name: 'assessed_at', type: 'timestamptz' }) assessedAt: Date;
}
