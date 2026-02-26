import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MartEntity } from './mart.entity';

@Entity('branches')
export class BranchEntity extends BaseEntity {
  @Column({ name: 'mart_id', type: 'uuid' })
  martId: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  code: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ name: 'risk_index', type: 'decimal', precision: 5, scale: 2, nullable: true })
  riskIndex: number | null;

  @Column({ name: 'risk_change', type: 'decimal', precision: 5, scale: 2, nullable: true })
  riskChange: number | null;

  @Column({ type: 'jsonb', nullable: true })
  trends: Record<string, unknown> | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => MartEntity)
  @JoinColumn({ name: 'mart_id' })
  mart: MartEntity;
}
