import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchEntity } from '@itadx/database';
import { ErrorCodes } from '@itadx/common';
import { CreateBranchDto } from './dto/create-branch.dto';

@Injectable()
export class BranchService {
  constructor(@InjectRepository(BranchEntity) private branchRepo: Repository<BranchEntity>) {}

  async findByMart(martId: string): Promise<BranchEntity[]> {
    return this.branchRepo.find({ where: { martId }, order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<BranchEntity> {
    const branch = await this.branchRepo.findOne({ where: { id }, relations: ['mart'] });
    if (!branch) throw new NotFoundException(ErrorCodes.BRANCH_NOT_FOUND);
    return branch;
  }

  async create(dto: CreateBranchDto): Promise<BranchEntity> {
    return this.branchRepo.save(this.branchRepo.create(dto));
  }

  async update(id: string, dto: Partial<CreateBranchDto>): Promise<BranchEntity> {
    const branch = await this.findOne(id);
    Object.assign(branch, dto);
    return this.branchRepo.save(branch);
  }
}
