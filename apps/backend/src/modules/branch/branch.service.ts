import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

@Injectable()
export class BranchService {
  constructor(private prisma: PrismaService) {}

  async createBranch(createBranchDto: CreateBranchDto, tenantId: string) {
    return this.prisma.branch.create({
      data: {
        ...createBranchDto,
        tenantId,
      },
    });
  }

  async getBranches(tenantId: string) {
    return this.prisma.branch.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            tables: true,
            menus: true,
          },
        },
      },
    });
  }

  async getBranch(id: string, tenantId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        tables: true,
        menus: true,
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }

  async updateBranch(id: string, updateBranchDto: UpdateBranchDto, tenantId: string) {
    // Verify branch belongs to tenant
    await this.getBranch(id, tenantId);

    return this.prisma.branch.update({
      where: { id },
      data: updateBranchDto,
    });
  }

  async deleteBranch(id: string, tenantId: string) {
    // Verify branch belongs to tenant
    await this.getBranch(id, tenantId);

    return this.prisma.branch.delete({
      where: { id },
    });
  }
}
