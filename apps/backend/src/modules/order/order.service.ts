import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrderStatus, OrderType, OrderItemStatus } from '@prisma/client';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { StockService } from '../stock/stock.service';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
    private stockService: StockService,
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
    // Validate based on order type
    const isTakeawayOrDelivery = (
      createOrderDto.type === OrderType.TAKEAWAY ||
      createOrderDto.type === OrderType.DELIVERY ||
      createOrderDto.type === OrderType.PHONE
    );

    // For takeaway/delivery, validate customer info
    if (isTakeawayOrDelivery) {
      if (!createOrderDto.customerName) {
        throw new BadRequestException('Customer name is required for takeaway/delivery orders');
      }
      if (!createOrderDto.customerPhone) {
        throw new BadRequestException('Customer phone is required for takeaway/delivery orders');
      }
      if (createOrderDto.type === OrderType.DELIVERY && !createOrderDto.deliveryAddress) {
        throw new BadRequestException('Delivery address is required for delivery orders');
      }
    }

    // For dine-in orders, table is required
    if (!isTakeawayOrDelivery && !createOrderDto.tableId) {
      throw new BadRequestException('Table is required for dine-in orders');
    }

    // Verify branch exists and belongs to tenant
    const branch = await this.prisma.branch.findFirst({
      where: {
        id: createOrderDto.branchId,
        tenantId,
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Verify table if provided
    let table: any = null;
    if (createOrderDto.tableId) {
      table = await this.prisma.table.findFirst({
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
    }

    // Validate products and calculate totals
    const items = await Promise.all(
      createOrderDto.items.map(async (item) => {
        const product = await this.prisma.product.findFirst({
          where: {
            id: item.productId,
            category: {
              menu: {
                branchId: createOrderDto.branchId,
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
          product: {
            connect: { id: item.productId },
          },
          variantId: item.variantId,
          variantName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.unitPrice * item.quantity,
          notes: item.notes,
          status: OrderItemStatus.PENDING,
        };
      }),
    );

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.1; // 10% tax
    const deliveryFee = createOrderDto.deliveryFee || 0;
    const total = subtotal + tax + deliveryFee;

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
        branchId: createOrderDto.branchId,
        waiterId: userId,
        // Customer info
        customerName: createOrderDto.customerName,
        customerPhone: createOrderDto.customerPhone,
        customerEmail: createOrderDto.customerEmail,
        customerNote: createOrderDto.customerNote,
        // Delivery info
        deliveryAddress: createOrderDto.deliveryAddress,
        deliveryCity: createOrderDto.deliveryCity,
        deliveryDistrict: createOrderDto.deliveryDistrict,
        deliveryZipCode: createOrderDto.deliveryZipCode,
        deliveryNotes: createOrderDto.deliveryNotes,
        // Scheduling
        scheduledFor: createOrderDto.scheduledFor ? new Date(createOrderDto.scheduledFor) : null,
        estimatedTime: createOrderDto.estimatedTime,
        deliveryFee: deliveryFee,
        // Totals
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

    // Update table status to OCCUPIED (only for dine-in orders)
    if (createOrderDto.tableId) {
      await this.prisma.table.update({
        where: { id: createOrderDto.tableId },
        data: { status: 'OCCUPIED' },
      });
    }

    // Deduct stock for ordered items (automatic stock management)
    try {
      await this.stockService.deductStockForOrder(
        order.id,
        (order as any).items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      );
    } catch (error) {
      console.error('Stock deduction failed:', error);
      // Don't fail the order if stock tracking fails
      // Log for monitoring
    }

    // Notify about new order
    this.notificationsGateway.notifyNewOrder(tenantId, createOrderDto.branchId, order);

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

    // Return stock if order is cancelled
    if (updateStatusDto.status === OrderStatus.CANCELLED) {
      try {
        await this.stockService.returnStockForCancelledOrder(
          updatedOrder.id,
          updatedOrder.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        );
      } catch (error) {
        console.error('Stock return failed:', error);
        // Don't fail the status update if stock return fails
      }
    }

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
