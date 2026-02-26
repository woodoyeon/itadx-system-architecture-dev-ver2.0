import { IsEmail, IsString, MinLength, IsIn, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @MinLength(8) password: string;
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ enum: ['bank', 'mart', 'admin'] }) @IsIn(['bank', 'mart', 'admin']) role: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() martId?: string;
}
