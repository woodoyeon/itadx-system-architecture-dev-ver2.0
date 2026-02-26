import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import axios from 'axios';

/**
 * WHY: 입고확인 후 v10 신용점수 재산출을 비동기로 처리
 * - 입고확인 API 응답시간에 영향을 주지 않도록 분리
 * - 실패 시 3회 재시도 (exponential backoff)
 */
@Processor('credit-score')
export class CreditScoreProcessor {
  private readonly logger = new Logger(CreditScoreProcessor.name);

  @Process('rescore')
  async handleRescore(job: Job<{ merchantId: string; receivingId: string; triggeredBy: string }>) {
    this.logger.log(`신용점수 재산출 시작: merchant=${job.data.merchantId}`);

    try {
      const engineUrl = process.env.ENGINE_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${engineUrl}/api/v10/score`, {
        merchant_id: job.data.merchantId,
        triggered_by: job.data.triggeredBy,
      });

      this.logger.log(`신용점수 재산출 완료: score=${response.data.score}, grade=${response.data.grade}`);
      return response.data;
    } catch (error) {
      this.logger.error(`신용점수 재산출 실패: ${error}`);
      throw error; // 재시도 트리거
    }
  }
}
