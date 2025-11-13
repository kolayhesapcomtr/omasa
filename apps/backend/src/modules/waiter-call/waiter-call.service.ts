import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateWaiterCallDto, UpdateWaiterCallStatusDto, WaiterCallResponseDto } from './dto';
import { WaiterCallStatus } from '@prisma/client';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class WaiterCallService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * Create a new waiter call from QR menu
   * Public endpoint - no authentication required
   */
  async createCall(dto: CreateWaiterCallDto) {
    // Verify table exists and get branch info
    const table = await this.prisma.table.findUnique({
      where: { id: dto.tableId },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            tenantId: true,
          },
        },
      },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (!table.isActive) {
      throw new BadRequestException('Table is not active');
    }

    // Check if there's already a pending call for this table
    const existingCall = await this.prisma.waiterCall.findFirst({
      where: {
        tableId: dto.tableId,
        status: {
          in: [WaiterCallStatus.PENDING, WaiterCallStatus.ACKNOWLEDGED],
        },
      },
    });

    if (existingCall) {
      // Return existing call instead of creating duplicate
      return this.mapToResponse(existingCall, table);
    }

    // Create waiter call
    const waiterCall = await this.prisma.waiterCall.create({
      data: {
        tableId: dto.tableId,
        type: dto.type || 'GENERAL',
        message: dto.message,
        status: WaiterCallStatus.PENDING,
      },
    });

    // Send real-time notification to waiters
    this.notificationsGateway.notifyWaiterCall(table.branch.tenantId, table.branch.id, {
      id: waiterCall.id,
      tableId: table.id,
      tableNumber: table.number,
      tableName: table.name,
      tableArea: table.area,
      type: waiterCall.type,
      message: waiterCall.message,
      createdAt: waiterCall.createdAt,
    });

    return this.mapToResponse(waiterCall, table);
  }

  /**
   * Get all waiter calls for a branch
   */
  async getCalls(tenantId: string, branchId?: string, status?: WaiterCallStatus) {
    const calls = await this.prisma.waiterCall.findMany({
      where: {
        table: {
          branch: {
            tenantId,
            ...(branchId && { id: branchId }),
          },
        },
        ...(status && { status }),
      },
      include: {
        table: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        respondedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    return calls.map((call) => ({
      id: call.id,
      tableId: call.tableId,
      tableNumber: call.table.number,
      tableName: call.table.name,
      tableArea: call.table.area,
      branchId: call.table.branchId,
      branchName: call.table.branch.name,
      type: call.type,
      status: call.status,
      message: call.message,
      respondedById: call.respondedById,
      respondedByName: call.respondedBy
        ? `${call.respondedBy.firstName} ${call.respondedBy.lastName}`
        : undefined,
      acknowledgedAt: call.acknowledgedAt,
      respondedAt: call.respondedAt,
      completedAt: call.completedAt,
      createdAt: call.createdAt,
    }));
  }

  /**
   * Get pending (active) calls only
   */
  async getPendingCalls(tenantId: string, branchId?: string) {
    return this.getCalls(tenantId, branchId, WaiterCallStatus.PENDING);
  }

  /**
   * Get single waiter call
   */
  async getCall(id: string, tenantId: string) {
    const call = await this.prisma.waiterCall.findFirst({
      where: {
        id,
        table: {
          branch: {
            tenantId,
          },
        },
      },
      include: {
        table: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        respondedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!call) {
      throw new NotFoundException('Waiter call not found');
    }

    return {
      id: call.id,
      tableId: call.tableId,
      tableNumber: call.table.number,
      tableName: call.table.name,
      tableArea: call.table.area,
      branchId: call.table.branchId,
      branchName: call.table.branch.name,
      type: call.type,
      status: call.status,
      message: call.message,
      respondedById: call.respondedById,
      respondedByName: call.respondedBy
        ? `${call.respondedBy.firstName} ${call.respondedBy.lastName}`
        : undefined,
      acknowledgedAt: call.acknowledgedAt,
      respondedAt: call.respondedAt,
      completedAt: call.completedAt,
      createdAt: call.createdAt,
    };
  }

  /**
   * Update waiter call status (acknowledge, respond, complete)
   */
  async updateCallStatus(id: string, dto: UpdateWaiterCallStatusDto, tenantId: string, userId?: string) {
    const call = await this.prisma.waiterCall.findFirst({
      where: {
        id,
        table: {
          branch: {
            tenantId,
          },
        },
      },
      include: {
        table: {
          include: {
            branch: true,
          },
        },
      },
    });

    if (!call) {
      throw new NotFoundException('Waiter call not found');
    }

    const updateData: any = {
      status: dto.status,
    };

    // Set timestamps based on status
    const now = new Date();
    switch (dto.status) {
      case WaiterCallStatus.ACKNOWLEDGED:
        updateData.acknowledgedAt = now;
        updateData.respondedById = userId;
        break;
      case WaiterCallStatus.RESPONDED:
        updateData.respondedAt = now;
        if (!call.acknowledgedAt) {
          updateData.acknowledgedAt = now;
        }
        updateData.respondedById = userId;
        break;
      case WaiterCallStatus.COMPLETED:
        updateData.completedAt = now;
        if (!call.respondedAt) {
          updateData.respondedAt = now;
        }
        if (!call.acknowledgedAt) {
          updateData.acknowledgedAt = now;
        }
        if (!call.respondedById && userId) {
          updateData.respondedById = userId;
        }
        break;
      case WaiterCallStatus.CANCELLED:
        updateData.cancelledAt = now;
        break;
    }

    const updatedCall = await this.prisma.waiterCall.update({
      where: { id },
      data: updateData,
      include: {
        table: {
          include: {
            branch: true,
          },
        },
        respondedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Notify about status change
    this.notificationsGateway.notifyWaiterCallStatusChange(
      call.table.branch.tenantId,
      call.table.branchId,
      {
        id: updatedCall.id,
        tableId: updatedCall.tableId,
        tableNumber: updatedCall.table.number,
        status: updatedCall.status,
        respondedBy: updatedCall.respondedBy
          ? `${updatedCall.respondedBy.firstName} ${updatedCall.respondedBy.lastName}`
          : undefined,
      },
    );

    return {
      id: updatedCall.id,
      tableId: updatedCall.tableId,
      tableNumber: updatedCall.table.number,
      tableName: updatedCall.table.name,
      tableArea: updatedCall.table.area,
      branchId: updatedCall.table.branchId,
      branchName: updatedCall.table.branch.name,
      type: updatedCall.type,
      status: updatedCall.status,
      message: updatedCall.message,
      respondedById: updatedCall.respondedById,
      respondedByName: updatedCall.respondedBy
        ? `${updatedCall.respondedBy.firstName} ${updatedCall.respondedBy.lastName}`
        : undefined,
      acknowledgedAt: updatedCall.acknowledgedAt,
      respondedAt: updatedCall.respondedAt,
      completedAt: updatedCall.completedAt,
      createdAt: updatedCall.createdAt,
    };
  }

  /**
   * Acknowledge call (waiter saw the notification)
   */
  async acknowledgeCall(id: string, tenantId: string, userId: string) {
    return this.updateCallStatus(
      id,
      { status: WaiterCallStatus.ACKNOWLEDGED },
      tenantId,
      userId,
    );
  }

  /**
   * Mark as responded (waiter went to the table)
   */
  async respondToCall(id: string, tenantId: string, userId: string) {
    return this.updateCallStatus(
      id,
      { status: WaiterCallStatus.RESPONDED },
      tenantId,
      userId,
    );
  }

  /**
   * Complete call (issue resolved)
   */
  async completeCall(id: string, tenantId: string, userId?: string) {
    return this.updateCallStatus(
      id,
      { status: WaiterCallStatus.COMPLETED },
      tenantId,
      userId,
    );
  }

  /**
   * Cancel call
   */
  async cancelCall(id: string, tenantId: string) {
    return this.updateCallStatus(id, { status: WaiterCallStatus.CANCELLED }, tenantId);
  }

  /**
   * Get call statistics for dashboard
   */
  async getCallStats(tenantId: string, branchId?: string) {
    const where: any = {
      table: {
        branch: {
          tenantId,
          ...(branchId && { id: branchId }),
        },
      },
    };

    const [total, pending, acknowledged, responded, completed, cancelled] = await Promise.all([
      this.prisma.waiterCall.count({ where }),
      this.prisma.waiterCall.count({ where: { ...where, status: WaiterCallStatus.PENDING } }),
      this.prisma.waiterCall.count({
        where: { ...where, status: WaiterCallStatus.ACKNOWLEDGED },
      }),
      this.prisma.waiterCall.count({ where: { ...where, status: WaiterCallStatus.RESPONDED } }),
      this.prisma.waiterCall.count({ where: { ...where, status: WaiterCallStatus.COMPLETED } }),
      this.prisma.waiterCall.count({ where: { ...where, status: WaiterCallStatus.CANCELLED } }),
    ]);

    // Calculate average response time for completed calls (in minutes)
    const completedCalls = await this.prisma.waiterCall.findMany({
      where: {
        ...where,
        status: WaiterCallStatus.COMPLETED,
        respondedAt: { not: null },
      },
      select: {
        createdAt: true,
        respondedAt: true,
      },
      take: 100,
    });

    let avgResponseTime = 0;
    if (completedCalls.length > 0) {
      const totalResponseTime = completedCalls.reduce((sum, call) => {
        const diff = call.respondedAt!.getTime() - call.createdAt.getTime();
        return sum + diff;
      }, 0);
      avgResponseTime = totalResponseTime / completedCalls.length / 1000 / 60; // Convert to minutes
    }

    return {
      total,
      pending,
      acknowledged,
      responded,
      completed,
      cancelled,
      avgResponseTimeMinutes: Math.round(avgResponseTime * 10) / 10, // Round to 1 decimal
    };
  }

  private mapToResponse(call: any, table: any): WaiterCallResponseDto {
    return {
      id: call.id,
      tableId: call.tableId,
      tableNumber: table.number,
      tableName: table.name,
      tableArea: table.area,
      branchId: table.branchId,
      branchName: table.branch.name,
      type: call.type,
      status: call.status,
      message: call.message,
      createdAt: call.createdAt,
    };
  }
}
