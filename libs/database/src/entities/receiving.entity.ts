import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MerchantEntity } from './merchant.entity';
import { MartEntity } from './mart.entity';

/**
 * ★ 입고 엔티티 — 시스템의 핵심 트리거
 *
 * WHY: receivings 테이블은 시스템 전체의 데이터 흐름 시작점입니다.
 * 입고확인(status: pending → confirmed)이 발생하면:
 * 1. 감사 로그 기록
 * 2. Bull Queue → v10 신용점수 재산출
 * 3. WebSocket → 은행 사용자 알림
 */
@Entity('receivings')
export class ReceivingEntity extends BaseEntity {
  @Column({ name: 'merchant_id', type: 'uuid' })
  merchantId: string;

  @Column({ name: 'mart_id', type: 'uuid' })
  martId: string;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string | null;

  @Column({ name: 'receiving_date', type: 'date' })
  receivingDate: string;

  @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2 })
  totalAmount: number;

  @Column({ type: 'jsonb' })
  items: Record<string, unknown>[];

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'confirmed' | 'cancelled';

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt: Date | null;

  @Column({ name: 'confirmed_by', type: 'uuid', nullable: true })
  confirmedBy: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => MerchantEntity)
  @JoinColumn({ name: 'merchant_id' })
  merchant: MerchantEntity;

  @ManyToOne(() => MartEntity)
  @JoinColumn({ name: 'mart_id' })
  mart: MartEntity;
}
