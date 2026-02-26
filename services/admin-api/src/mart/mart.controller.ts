import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles } from '@itadx/auth';
import { createResponse, createPaginatedResponse, PaginationDto } from '@itadx/common';
import { MartService } from './mart.service';
import { CreateMartDto } from './dto/create-mart.dto';
import { UpdateMartDto } from './dto/update-mart.dto';

@ApiTags('Marts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marts')
export class MartController {
  constructor(private martService: MartService) {}

  @Get()
  @Roles('bank', 'admin')
  @ApiOperation({ summary: '마트 목록 조회' })
  async findAll(@Query() query: PaginationDto & { search?: string }) {
    const { items, total, page, limit } = await this.martService.findAll(query);
    return createPaginatedResponse(items, total, page, limit);
  }

  @Get(':id')
  @Roles('bank', 'mart', 'admin')
  @ApiOperation({ summary: '마트 상세 조회' })
  async findOne(@Param('id') id: string) {
    return createResponse(await this.martService.findOne(id));
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: '마트 등록' })
  async create(@Body() dto: CreateMartDto) {
    return createResponse(await this.martService.create(dto));
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: '마트 수정' })
  async update(@Param('id') id: string, @Body() dto: UpdateMartDto) {
    return createResponse(await this.martService.update(id, dto));
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: '마트 삭제' })
  async remove(@Param('id') id: string) {
    await this.martService.remove(id);
    return createResponse({ message: '삭제 완료' });
  }
}
