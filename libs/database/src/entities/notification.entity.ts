import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('notifications')
export class NotificationEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' }) userId: string;
  @Column({ type: 'varchar', length: 50 }) type: string;
  @Column({ type: 'varchar', length: 200 }) title: string;
  @Column({ type: 'text', nullable: true }) message: string | null;
  @Column({ name: 'is_read', type: 'boolean', default: false }) isRead: boolean;
}
