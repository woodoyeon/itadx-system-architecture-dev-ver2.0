import { IsString, IsUUID, IsOptional, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMerchantDto {
  @ApiProperty() @IsUUID() martId: string;
  @ApiProperty() @IsString() @MaxLength(200) name: string;
  @ApiProperty() @Matches(/^\d{3}-\d{2}-\d{5}$/) businessNumber: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
}
