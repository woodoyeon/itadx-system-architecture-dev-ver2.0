import { HttpException } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(
    code: string,
    message: string,
    status: number = 400,
    details?: Record<string, unknown>,
  ) {
    super({ code, message, details }, status);
  }
}
