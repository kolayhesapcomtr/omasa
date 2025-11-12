import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateTableDto, UpdateTableDto } from './dto/table.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class TableService {
  constructor(private prisma: PrismaService) {}

  private generateQRCode(): string {
    // Generate unique 12-character hash for QR code
    return randomBytes(6).toString('hex');
  }

  async createTable(createTableDto: CreateTableDto, tenantId: string) {
    // Verify branch belongs to tenant
    const branch = await this.prisma.branch.findFirst({
      where: {
        id: createTableDto.branchId,
        tenantId,
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Check if table number already exists in this branch
    const existingTable = await this.prisma.table.findFirst({
      where: {
        branchId: createTableDto.branchId,
        number: createTableDto.number,
      },
    });

    if (existingTable) {
      throw new ConflictException('Table number already exists in this branch');
    }

    // Generate unique QR code
    let qrCode = this.generateQRCode();
    let qrExists = await this.prisma.table.findUnique({ where: { qrCode } });

    // Ensure QR code is unique
    while (qrExists) {
      qrCode = this.generateQRCode();
      qrExists = await this.prisma.table.findUnique({ where: { qrCode } });
    }

    return this.prisma.table.create({
      data: {
        ...createTableDto,
        qrCode,
      },
    });
  }

  async getTables(tenantId: string, branchId?: string) {
    return this.prisma.table.findMany({
      where: {
        branch: {
          tenantId,
          ...(branchId && { id: branchId }),
        },
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: [{ area: 'asc' }, { number: 'asc' }],
    });
  }

  async getTable(id: string, tenantId: string) {
    const table = await this.prisma.table.findFirst({
      where: {
        id,
        branch: { tenantId },
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        orders: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'],
            },
          },
          include: {
            items: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    return table;
  }

  async getTableByQRCode(qrCode: string) {
    const table = await this.prisma.table.findUnique({
      where: { qrCode },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true,
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
              },
            },
          },
        },
      },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (!table.isActive) {
      throw new NotFoundException('Table is not active');
    }

    return table;
  }

  async updateTable(id: string, updateTableDto: UpdateTableDto, tenantId: string) {
    // Verify table belongs to tenant
    await this.getTable(id, tenantId);

    // If updating number, check for conflicts
    if (updateTableDto.number) {
      const table = await this.prisma.table.findUnique({ where: { id } });
      const existingTable = await this.prisma.table.findFirst({
        where: {
          branchId: table.branchId,
          number: updateTableDto.number,
          NOT: { id },
        },
      });

      if (existingTable) {
        throw new ConflictException('Table number already exists in this branch');
      }
    }

    return this.prisma.table.update({
      where: { id },
      data: updateTableDto,
    });
  }

  async deleteTable(id: string, tenantId: string) {
    // Verify table belongs to tenant
    await this.getTable(id, tenantId);

    // Check if table has active orders
    const activeOrders = await this.prisma.order.count({
      where: {
        tableId: id,
        status: {
          in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'],
        },
      },
    });

    if (activeOrders > 0) {
      throw new ConflictException('Cannot delete table with active orders');
    }

    return this.prisma.table.delete({
      where: { id },
    });
  }

  async regenerateQRCode(id: string, tenantId: string) {
    // Verify table belongs to tenant
    await this.getTable(id, tenantId);

    // Generate new unique QR code
    let qrCode = this.generateQRCode();
    let qrExists = await this.prisma.table.findUnique({ where: { qrCode } });

    while (qrExists) {
      qrCode = this.generateQRCode();
      qrExists = await this.prisma.table.findUnique({ where: { qrCode } });
    }

    return this.prisma.table.update({
      where: { id },
      data: { qrCode },
    });
  }

  async getTablesByArea(branchId: string, tenantId: string) {
    // Verify branch belongs to tenant
    const branch = await this.prisma.branch.findFirst({
      where: {
        id: branchId,
        tenantId,
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const tables = await this.prisma.table.findMany({
      where: { branchId },
      orderBy: [{ area: 'asc' }, { number: 'asc' }],
    });

    // Group by area
    const groupedByArea: Record<string, any[]> = {};
    tables.forEach((table) => {
      const area = table.area || 'Diğer';
      if (!groupedByArea[area]) {
        groupedByArea[area] = [];
      }
      groupedByArea[area].push(table);
    });

    return groupedByArea;
  }
}
