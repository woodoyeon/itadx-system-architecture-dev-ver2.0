import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@itadx/auth';
import { createResponse } from '@itadx/common';
import type { UserPayload } from '@itadx/auth';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('bank')
  @Roles('bank', 'admin')
  @ApiOperation({ summary: '은행 대시보드 KPI' })
  async bankKPI() {
    return createResponse(await this.dashboardService.getBankKPI());
  }

  @Get('mart')
  @Roles('mart')
  @ApiOperation({ summary: '마트 대시보드 KPI' })
  async martKPI(@CurrentUser() user: UserPayload) {
    return createResponse(await this.dashboardService.getMartKPI(user.martId!));
  }
}
