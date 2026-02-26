import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles } from '@itadx/auth';
import { createResponse } from '@itadx/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get() @ApiOperation({ summary: '사용자 목록' })
  async findAll() { return createResponse(await this.userService.findAll()); }

  @Post() @ApiOperation({ summary: '사용자 생성' })
  async create(@Body() dto: CreateUserDto) { return createResponse(await this.userService.create(dto)); }

  @Patch(':id/deactivate') @ApiOperation({ summary: '사용자 비활성화' })
  async deactivate(@Param('id') id: string) { await this.userService.deactivate(id); return createResponse({ message: '비활성화 완료' }); }
}
