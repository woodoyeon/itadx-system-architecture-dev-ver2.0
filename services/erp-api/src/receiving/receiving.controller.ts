import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@itadx/auth';
import { Auditable } from '@itadx/audit';
import { createResponse, createPaginatedResponse } from '@itadx/common';
import type { UserPayload } from '@itadx/auth';
import { ReceivingService } from './receiving.service';
import { CreateReceivingDto } from './dto/create-receiving.dto';

@ApiTags('Receivings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('receivings')
export class ReceivingController {
  constructor(private receivingService: ReceivingService) {}

  @Get()
  @Roles('bank', 'mart', 'admin')
  @ApiOperation({ summary: '입고 목록 조회' })
  // ← admin-web useReceivings() → api.get('/receivings', { params: filters }) (apps/admin-web/src/hooks/use-receivings.ts)
  async findAll(
    @Query('martId') martId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.receivingService.findAll({ martId, status, page, limit });
    return createPaginatedResponse(result.items, result.total, result.page, result.limit);
  }

  @Get(':id')
  @Roles('bank', 'mart', 'admin')
  @ApiOperation({ summary: '입고 상세 조회' })
  async findOne(@Param('id') id: string) {
    return createResponse(await this.receivingService.findOne(id));
  }

  @Post()
  @Roles('mart')
  @Auditable('RECEIVING_CREATE')
  @ApiOperation({ summary: '입고 등록' })
  async create(@Body() dto: CreateReceivingDto) {
    return createResponse(await this.receivingService.create(dto));
  }

  @Patch(':id/confirm')
  @Roles('bank', 'mart')
  @Auditable('RECEIVING_CONFIRM')
  @ApiOperation({ summary: '★ 입고확인 — 핵심 트리거' })
  async confirm(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return createResponse(await this.receivingService.confirmReceiving(id, user));
  }
}
