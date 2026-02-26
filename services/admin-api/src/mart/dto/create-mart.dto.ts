import { IsString, IsOptional, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMartDto {
  @ApiProperty({ example: '이타마트 본점' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: '123-45-67890' })
  @IsString()
  @Matches(/^\d{3}-\d{2}-\d{5}$/, { message: '사업자번호 형식: 123-45-67890' })
  businessNumber: string;

  @ApiPropertyOptional() @IsOptional() @IsString() representative?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
}
