import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('settlements')
export class SettlementEntity extends BaseEntity {
  @Column({ name: 'merchant_id', type: 'uuid' }) merchantId: string;
  @Column({ name: 'mart_id', type: 'uuid' }) martId: string;
  @Column({ type: 'varchar', length: 20 }) period: string;
  @Column({ type: 'decimal', precision: 15, scale: 2 }) amount: number;
  @Column({ type: 'varchar', length: 20, default: 'pending' }) status: 'pending' | 'completed' | 'overdue';
  @Column({ name: 'settled_at', type: 'timestamptz', nullable: true }) settledAt: Date | null;
}
