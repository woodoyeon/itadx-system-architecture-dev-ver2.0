import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles } from '@itadx/auth';
import { createResponse } from '@itadx/common';
import { SettlementService } from './settlement.service';

@ApiTags('Settlements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settlements')
export class SettlementController {
  constructor(private service: SettlementService) {}

  @Get()
  @Roles('bank', 'mart', 'admin')
  @ApiOperation({ summary: '정산 목록' })
  async findAll(@Query('martId') martId?: string, @Query('status') status?: string) {
    return createResponse(await this.service.findAll({ martId, status }));
  }

  @Patch(':id/complete')
  @Roles('bank')
  @ApiOperation({ summary: '정산 완료 처리' })
  async complete(@Param('id') id: string) {
    return createResponse(await this.service.complete(id));
  }
}
