import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles } from '@itadx/auth';
import { createResponse, createPaginatedResponse, PaginationDto } from '@itadx/common';
import { MerchantService } from './merchant.service';

@ApiTags('Merchants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('merchants')
export class MerchantController {
  constructor(private merchantService: MerchantService) {}

  @Get()
  @Roles('bank', 'mart', 'admin')
  @ApiOperation({ summary: '가맹점 목록' })
  async findAll(@Query('martId') martId: string, @Query() query: PaginationDto) {
    const { items, total, page, limit } = await this.merchantService.findAll(martId, query);
    return createPaginatedResponse(items, total, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: '가맹점 상세' })
  async findOne(@Param('id') id: string) {
    return createResponse(await this.merchantService.findOne(id));
  }

  @Post()
  @Roles('admin', 'mart')
  @ApiOperation({ summary: '가맹점 등록' })
  async create(@Body() dto: Record<string, unknown>) {
    return createResponse(await this.merchantService.create(dto));
  }

  @Patch(':id')
  @Roles('admin', 'mart')
  @ApiOperation({ summary: '가맹점 수정' })
  async update(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return createResponse(await this.merchantService.update(id, dto));
  }
}
