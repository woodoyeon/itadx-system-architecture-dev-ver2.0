import { PartialType } from '@nestjs/swagger';
import { CreateMartDto } from './create-mart.dto';

export class UpdateMartDto extends PartialType(CreateMartDto) {}
