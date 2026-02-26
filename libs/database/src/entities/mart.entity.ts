import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('marts')
export class MartEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ name: 'business_number', type: 'varchar', length: 20, unique: true })
  businessNumber: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  representative: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ name: 'contract_date', type: 'date', nullable: true })
  contractDate: string | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: 'active' | 'inactive' | 'suspended';

  @Column({ type: 'jsonb', nullable: true })
  stability: Record<string, unknown> | null;

  @Column({ name: 'screening_result', type: 'varchar', length: 20, nullable: true })
  screeningResult: string | null;

  @Column({ name: 'screening_date', type: 'date', nullable: true })
  screeningDate: string | null;
}
