import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrderStatus, OrderType } from '@prisma/client';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
  ) {}

  private generateOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');

    return `OM-${year}${month}${day}-${random}`;
  }

  async createOrder(createOrderDto: CreateOrderDto, tenantId: string, userId?: string) {
    // Verify table belongs to tenant
    const table = await this.prisma.table.findFirst({
      where: {
        id: createOrderDto.tableId,
        branch: { tenantId },
      },
      include: {
        branch: true,
      },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (!table.isActive) {
      throw new BadRequestException('Table is not active');
    }

    // Validate products and calculate totals
    const items = await Promise.all(
      createOrderDto.items.map(async (item) => {
        const product = await this.prisma.product.findFirst({
          where: {
            id: item.productId,
            category: {
              menu: {
                branchId: table.branchId,
              },
            },
          },
        });

        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        if (!product.isActive || !product.isAvailable) {
          throw new BadRequestException(`Product ${product.name} is not available`);
        }

        // Validate variant if provided
        let variantName: string | undefined;
        if (item.variantId) {
          const variant = await this.prisma.productVariant.findFirst({
            where: {
              id: item.variantId,
              productId: item.productId,
            },
          });

          if (!variant || !variant.isActive) {
            throw new NotFoundException(`Variant ${item.variantId} not found`);
          }

          variantName = variant.name;
        }

        return {
          productId: item.productId,
          variantId: item.variantId,
          variantName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.unitPrice * item.quantity,
          notes: item.notes,
          status: 'PENDING',
        };
      }),
    );

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    // Generate unique order number
    let orderNumber = this.generateOrderNumber();
    let orderExists = await this.prisma.order.findUnique({ where: { orderNumber } });

    while (orderExists) {
      orderNumber = this.generateOrderNumber();
      orderExists = await this.prisma.order.findUnique({ where: { orderNumber } });
    }

    // Create order with items
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        type: createOrderDto.type,
        tableId: createOrderDto.tableId,
        branchId: table.branchId,
        waiterId: userId,
        customerName: createOrderDto.customerName,
        customerPhone: createOrderDto.customerPhone,
        customerNote: createOrderDto.customerNote,
        subtotal,
        tax,
        total,
        status: OrderStatus.PENDING,
        items: {
          create: items,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        table: {
          select: {
            id: true,
            number: true,
            name: true,
          },
        },
        waiter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update table status to OCCUPIED
    await this.prisma.table.update({
      where: { id: createOrderDto.tableId },
      data: { status: 'OCCUPIED' },
    });

    // Notify about new order
    this.notificationsGateway.notifyNewOrder(tenantId, table.branchId, order);

    return order;
  }

  async getOrders(tenantId: string, branchId?: string, status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: {
        branch: {
          tenantId,
          ...(branchId && { id: branchId }),
        },
        ...(status && { status }),
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        table: {
          select: {
            id: true,
            number: true,
            name: true,
            area: true,
          },
        },
        waiter: {
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
    });
  }

  async getOrder(id: string, tenantId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        branch: { tenantId },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                image: true,
              },
            },
          },
        },
        table: {
          select: {
            id: true,
            number: true,
            name: true,
            area: true,
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        waiter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateOrderStatus(id: string, updateStatusDto: UpdateOrderStatusDto, tenantId: string) {
    // Verify order belongs to tenant
    await this.getOrder(id, tenantId);

    const updateData: any = {
      status: updateStatusDto.status,
    };

    // Set timestamp based on status
    const now = new Date();
    switch (updateStatusDto.status) {
      case OrderStatus.CONFIRMED:
        updateData.confirmedAt = now;
        break;
      case OrderStatus.PREPARING:
        updateData.preparingAt = now;
        break;
      case OrderStatus.READY:
        updateData.readyAt = now;
        break;
      case OrderStatus.SERVED:
        updateData.servedAt = now;
        break;
      case OrderStatus.CANCELLED:
        updateData.cancelledAt = now;
        break;
      case OrderStatus.COMPLETED:
        updateData.completedAt = now;
        break;
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        table: true,
        waiter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Notify about order status change
    this.notificationsGateway.notifyOrderStatusChange(tenantId, updatedOrder);

    return updatedOrder;
  }

  async getActiveOrders(tenantId: string, branchId?: string) {
    return this.getOrders(tenantId, branchId, undefined);
  }

  async getTableOrders(tableId: string, tenantId: string) {
    // Verify table belongs to tenant
    const table = await this.prisma.table.findFirst({
      where: {
        id: tableId,
        branch: { tenantId },
      },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    return this.prisma.order.findMany({
      where: {
        tableId,
        status: {
          in: [
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.PREPARING,
            OrderStatus.READY,
            OrderStatus.SERVED,
          ],
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getKitchenOrders(tenantId: string, branchId?: string) {
    return this.prisma.order.findMany({
      where: {
        branch: {
          tenantId,
          ...(branchId && { id: branchId }),
        },
        status: {
          in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING],
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        table: {
          select: {
            id: true,
            number: true,
            name: true,
            area: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}
