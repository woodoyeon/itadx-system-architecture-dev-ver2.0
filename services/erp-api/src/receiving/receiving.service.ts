import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Repository, DataSource } from 'typeorm';
import { Queue } from 'bull';
import { ReceivingEntity } from '@itadx/database';
import { ErrorCodes, BusinessException } from '@itadx/common';
import { NotificationGateway, WsEvents } from '@itadx/websocket';
import { UserPayload } from '@itadx/auth';
import { CreateReceivingDto } from './dto/create-receiving.dto';

/**
 * ★★★ 입고확인 서비스 — 시스템 핵심 비즈니스 로직
 *
 * WHY: 입고확인은 시스템 전체의 데이터 흐름 트리거입니다.
 * confirmReceiving() 호출 시:
 * 1. 비관적 락(SELECT FOR UPDATE) + 트랜잭션으로 동시성 보장
 * 2. status: pending → confirmed 전환
 * 3. 감사로그 INSERT
 * 4. Bull Queue → v10 신용점수 재산출 비동기 호출
 * 5. WebSocket → 은행 사용자 실시간 알림
 */
@Injectable()
export class ReceivingService {
  private readonly logger = new Logger(ReceivingService.name);

  constructor(
    @InjectRepository(ReceivingEntity) private receivingRepo: Repository<ReceivingEntity>,
    @InjectQueue('credit-score') private creditQueue: Queue,
    private dataSource: DataSource,
    private wsGateway: NotificationGateway,
  ) {}

  /** 입고 목록 조회 */
  async findAll(filters: { martId?: string; status?: string; page?: number; limit?: number }) {
    const { martId, status, page = 1, limit = 20 } = filters;
    const where: Record<string, unknown> = {};
    if (martId) where.martId = martId;
    if (status) where.status = status;

    const [items, total] = await this.receivingRepo.findAndCount({
      where,
      relations: ['merchant', 'mart'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  /** 입고 단건 조회 */
  async findOne(id: string): Promise<ReceivingEntity> {
    const receiving = await this.receivingRepo.findOne({
      where: { id },
      relations: ['merchant', 'mart'],
    });
    if (!receiving) throw new NotFoundException(ErrorCodes.RECEIVING_NOT_FOUND);
    return receiving;
  }

  /** 입고 등록 */
  async create(dto: CreateReceivingDto): Promise<ReceivingEntity> {
    return this.receivingRepo.save(this.receivingRepo.create(dto));
  }

  /**
   * ★★★ 입고확인 — 핵심 트랜잭션
   *
   * 처리 흐름:
   * 1. BEGIN TRANSACTION (SERIALIZABLE)
   * 2. SELECT ... FOR UPDATE (비관적 락으로 동시 확인 방지)
   * 3. 상태 검증 (pending만 확인 가능)
   * 4. UPDATE receivings SET status='confirmed'
   * 5. INSERT audit_logs (감사 로그)
   * 6. COMMIT
   * 7. Bull Queue에 신용점수 재산출 Job 추가 (비동기)
   * 8. WebSocket으로 은행 사용자에게 실시간 알림
   */
  async confirmReceiving(id: string, user: UserPayload): Promise<ReceivingEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      // Step 1: 비관적 락으로 입고 데이터 조회
      const receiving = await queryRunner.manager.findOne(ReceivingEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!receiving) {
        throw new NotFoundException(ErrorCodes.RECEIVING_NOT_FOUND);
      }

      // Step 2: 상태 검증
      if (receiving.status === 'confirmed') {
        throw new BusinessException(ErrorCodes.ALREADY_CONFIRMED, '이미 확인된 입고입니다.', 409);
      }
      if (receiving.status === 'cancelled') {
        throw new BusinessException(ErrorCodes.RECEIVING_CANCELLED, '취소된 입고는 확인할 수 없습니다.', 400);
      }

      // Step 3: 마트 소속 검증 (mart 사용자는 자기 마트만)
      if (user.role === 'mart' && receiving.martId !== user.martId) {
        throw new BusinessException(ErrorCodes.MART_MISMATCH, '다른 마트의 입고를 확인할 수 없습니다.', 403);
      }

      // Step 4: 상태 전환
      receiving.status = 'confirmed';
      receiving.confirmedAt = new Date();
      receiving.confirmedBy = user.sub;
      await queryRunner.manager.save(receiving);

      // Step 5: 감사 로그 기록
      await queryRunner.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.sub, 'RECEIVING_CONFIRM', 'receivings', id, JSON.stringify({
          previousStatus: 'pending',
          newStatus: 'confirmed',
          merchantId: receiving.merchantId,
          amount: receiving.totalAmount,
        })],
      );

      await queryRunner.commitTransaction();

      // Step 6: 비동기 작업 (트랜잭션 외부)
      // WHY: 신용점수 재산출은 무거운 작업이므로 Bull Queue로 비동기 처리
      await this.creditQueue.add('rescore', {
        merchantId: receiving.merchantId,
        receivingId: id,
        triggeredBy: 'receiving_confirm',
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });

      // Step 7: WebSocket 실시간 알림
      this.wsGateway.notifyBank(WsEvents.RECEIVING_CONFIRMED, {
        receivingId: id,
        merchantId: receiving.merchantId,
        martId: receiving.martId,
        amount: receiving.totalAmount,
        confirmedBy: user.email,
        confirmedAt: receiving.confirmedAt,
      });

      this.logger.log(`입고확인 완료: ${id} by ${user.email}`);
      return receiving;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
