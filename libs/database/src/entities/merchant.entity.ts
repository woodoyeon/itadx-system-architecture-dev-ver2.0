import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MartEntity } from './mart.entity';

@Entity('merchants')
export class MerchantEntity extends BaseEntity {
  @Column({ name: 'mart_id', type: 'uuid' })
  martId: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ name: 'business_number', type: 'varchar', length: 20, unique: true })
  businessNumber: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'integer', nullable: true })
  score: number | null;

  @Column({ type: 'varchar', length: 1, nullable: true })
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | null;

  @Column({ name: 'risk_factors', type: 'jsonb', nullable: true })
  riskFactors: Record<string, unknown> | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => MartEntity)
  @JoinColumn({ name: 'mart_id' })
  mart: MartEntity;
}
