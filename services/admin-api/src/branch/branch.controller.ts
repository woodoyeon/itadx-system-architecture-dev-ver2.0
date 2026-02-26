import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles } from '@itadx/auth';
import { createResponse } from '@itadx/common';
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';

@ApiTags('Branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('branches')
export class BranchController {
  constructor(private branchService: BranchService) {}

  @Get()
  @Roles('bank', 'mart', 'admin')
  @ApiOperation({ summary: '지점 목록 조회' })
  async findByMart(@Query('martId') martId: string) {
    return createResponse(await this.branchService.findByMart(martId));
  }

  @Get(':id')
  @ApiOperation({ summary: '지점 상세 조회' })
  async findOne(@Param('id') id: string) {
    return createResponse(await this.branchService.findOne(id));
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: '지점 등록' })
  async create(@Body() dto: CreateBranchDto) {
    return createResponse(await this.branchService.create(dto));
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: '지점 수정' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateBranchDto>) {
    return createResponse(await this.branchService.update(id, dto));
  }
}
