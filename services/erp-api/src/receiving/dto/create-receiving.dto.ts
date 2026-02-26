import { IsUUID, IsString, IsNumber, IsArray, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReceivingDto {
  @ApiProperty() @IsUUID() merchantId: string;
  @ApiProperty() @IsUUID() martId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() branchId?: string;
  @ApiProperty() @IsString() receivingDate: string;
  @ApiProperty() @IsNumber() @Min(0) totalAmount: number;
  @ApiProperty({ type: [Object] }) @IsArray() items: Record<string, unknown>[];
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
