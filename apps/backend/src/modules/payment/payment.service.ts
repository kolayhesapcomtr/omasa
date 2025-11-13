import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePaymentDto, MergeTablesDto, SplitBillDto, SplitByItemsDto, TransferOrderDto } from './dto/payment.dto';
import { PaymentStatus, OrderStatus, OrderType } from '@prisma/client';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
  ) {}

  async getTableBill(tableId: string, tenantId: string) {
    // Get table with orders
    const table = await this.prisma.table.findFirst({
      where: {
        id: tableId,
        branch: { tenantId },
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        orders: {
          where: {
            status: {
              in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.SERVED],
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
                variant: {
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
          },
        },
      },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (table.orders.length === 0) {
      throw new BadRequestException('No active orders for this table');
    }

    // Calculate totals
    let subtotal = 0;
    table.orders.forEach((order) => {
      subtotal += parseFloat(order.subtotal.toString());
    });

    const taxRate = 0.1; // 10% tax
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    return {
      table: {
        id: table.id,
        number: table.number,
        name: table.name,
        branch: table.branch,
      },
      orders: table.orders,
      summary: {
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        taxRate: '10',
        total: total.toFixed(2),
        orderCount: table.orders.length,
        itemCount: table.orders.reduce((sum, order) => sum + order.items.length, 0),
      },
    };
  }

  async createPayment(createPaymentDto: CreatePaymentDto, tenantId: string, userId: string) {
    const { tableId, method, tipAmount, notes } = createPaymentDto;

    // Get table bill
    const bill = await this.getTableBill(tableId, tenantId);

    // Calculate final amount with tip
    const baseTotal = parseFloat(bill.summary.total);
    const tip = tipAmount || 0;
    const finalAmount = baseTotal + tip;

    // Create payment and invoice in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Generate invoice number
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
      const invoiceNumber = `INV-${dateStr}-${random}`;

      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          subtotal: parseFloat(bill.summary.subtotal),
          tax: parseFloat(bill.summary.tax),
          total: baseTotal,
          tenantId,
        },
      });

      // Create payments for each order
      const payments = await Promise.all(
        bill.orders.map(async (order) => {
          const orderTotal = parseFloat(order.total.toString());
          const payment = await tx.payment.create({
            data: {
              amount: orderTotal,
              method,
              status: PaymentStatus.COMPLETED,
              paidAt: new Date(),
              notes,
              orderId: order.id,
              invoiceId: invoice.id,
              tenantId,
              userId,
            },
          });

          // Update order status to COMPLETED
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: OrderStatus.COMPLETED,
              completedAt: new Date(),
            },
          });

          return payment;
        }),
      );

      // Update table status to EMPTY
      await tx.table.update({
        where: { id: tableId },
        data: { status: 'EMPTY' },
      });

      return {
        invoice,
        payments,
        totalAmount: finalAmount,
        tipAmount: tip,
      };
    });

    // Notify about payment completion
    this.notificationsGateway.notifyPaymentCompleted(tenantId, {
      id: result.invoice.id,
      invoiceNumber: result.invoice.invoiceNumber,
      totalAmount: result.totalAmount,
      tipAmount: result.tipAmount,
      method,
      tableId,
    });

    return result;
  }

  async getPayments(tenantId: string, branchId?: string) {
    return this.prisma.payment.findMany({
      where: {
        tenantId,
        ...(branchId && {
          order: {
            table: {
              branchId,
            },
          },
        }),
      },
      include: {
        order: {
          include: {
            table: {
              select: {
                id: true,
                number: true,
                name: true,
                branch: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        invoice: true,
      },
      orderBy: {
        paidAt: 'desc',
      },
    });
  }

  async getPayment(id: string, tenantId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        order: {
          include: {
            table: {
              select: {
                id: true,
                number: true,
                name: true,
              },
            },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                variant: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        invoice: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async getInvoices(tenantId: string) {
    return this.prisma.invoice.findMany({
      where: { tenantId },
      include: {
        payments: {
          include: {
            order: {
              include: {
                table: {
                  select: {
                    number: true,
                    name: true,
                  },
                },
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

  // ============================================
  // BILL MERGE & SPLIT OPERATIONS
  // ============================================

  /**
   * Merge multiple tables into one target table
   * All orders from source tables will be transferred to target table
   */
  async mergeTables(dto: MergeTablesDto, tenantId: string) {
    const { sourceTableIds, targetTableId } = dto;

    // Validate all tables belong to the same tenant and branch
    const allTableIds = [...sourceTableIds, targetTableId];
    const tables = await this.prisma.table.findMany({
      where: {
        id: { in: allTableIds },
        branch: { tenantId },
      },
      include: {
        branch: true,
      },
    });

    if (tables.length !== allTableIds.length) {
      throw new NotFoundException('One or more tables not found');
    }

    // Check all tables are in the same branch
    const branchIds = new Set(tables.map((t) => t.branchId));
    if (branchIds.size > 1) {
      throw new BadRequestException('All tables must be in the same branch');
    }

    const targetTable = tables.find((t) => t.id === targetTableId);
    if (!targetTable) {
      throw new NotFoundException('Target table not found');
    }

    // Transfer all orders from source tables to target table
    await this.prisma.$transaction(async (tx) => {
      // Update orders from source tables to target table
      await tx.order.updateMany({
        where: {
          tableId: { in: sourceTableIds },
          status: {
            in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.SERVED],
          },
        },
        data: {
          tableId: targetTableId,
        },
      });

      // Update source tables status to EMPTY
      await tx.table.updateMany({
        where: { id: { in: sourceTableIds } },
        data: { status: 'EMPTY' },
      });

      // Update target table status to OCCUPIED
      await tx.table.update({
        where: { id: targetTableId },
        data: { status: 'OCCUPIED' },
      });
    });

    // Return updated bill for target table
    return this.getTableBill(targetTableId, tenantId);
  }

  /**
   * Split a table's bill into multiple parts
   * Creates separate bills for each split
   */
  async splitBill(dto: SplitBillDto, tenantId: string) {
    const { tableId, splitCount, customPercentages } = dto;

    // Validate percentages if custom split
    if (customPercentages) {
      if (customPercentages.length !== splitCount) {
        throw new BadRequestException('Number of percentages must match split count');
      }
      const total = customPercentages.reduce((sum, p) => sum + p, 0);
      if (Math.abs(total - 100) > 0.01) {
        throw new BadRequestException('Percentages must add up to 100');
      }
    }

    // Get table bill
    const bill = await this.getTableBill(tableId, tenantId);
    const totalAmount = parseFloat(bill.summary.total);

    // Calculate split amounts
    const splitAmounts: number[] = [];
    if (customPercentages) {
      splitAmounts.push(...customPercentages.map((p) => (totalAmount * p) / 100));
    } else {
      const equalAmount = totalAmount / splitCount;
      for (let i = 0; i < splitCount; i++) {
        splitAmounts.push(equalAmount);
      }
    }

    return {
      originalBill: bill,
      splitBills: splitAmounts.map((amount, index) => ({
        splitNumber: index + 1,
        amount: amount.toFixed(2),
        percentage: customPercentages ? customPercentages[index] : (100 / splitCount).toFixed(2),
      })),
      totalSplits: splitCount,
    };
  }

  /**
   * Split specific order items to a new bill
   * Can optionally move to a different table
   */
  async splitByItems(dto: SplitByItemsDto, tenantId: string, userId?: string) {
    const { tableId, orderItemIds, newTableId } = dto;

    // Verify table belongs to tenant
    const table = await this.prisma.table.findFirst({
      where: {
        id: tableId,
        branch: { tenantId },
      },
      include: {
        branch: true,
      },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    // Get order items to split
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        id: { in: orderItemIds },
        order: {
          tableId,
        },
      },
      include: {
        order: true,
        product: true,
      },
    });

    if (orderItems.length !== orderItemIds.length) {
      throw new BadRequestException('One or more order items not found');
    }

    // Group items by order
    const itemsByOrder = orderItems.reduce((acc, item) => {
      if (!acc[item.orderId]) {
        acc[item.orderId] = [];
      }
      acc[item.orderId].push(item);
      return acc;
    }, {} as Record<string, typeof orderItems>);

    const targetTableId = newTableId || tableId;

    // Create new order with split items in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Generate new order number
      const orderNumber = this.generateOrderNumber();

      // Calculate totals for new order
      let subtotal = 0;
      orderItems.forEach((item) => {
        subtotal += parseFloat(item.total.toString());
      });
      const tax = subtotal * 0.1;
      const total = subtotal + tax;

      // Create new order with split items
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          type: OrderType.WAITER,
          tableId: targetTableId,
          branchId: table.branchId,
          waiterId: userId,
          subtotal,
          tax,
          total,
          status: OrderStatus.SERVED,
          customerNote: 'Split from original order',
          items: {
            create: orderItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              variantName: item.variantName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
              notes: item.notes,
              status: item.status,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          table: true,
        },
      });

      // Delete original order items
      await tx.orderItem.deleteMany({
        where: {
          id: { in: orderItemIds },
        },
      });

      // Update original orders totals
      for (const orderId of Object.keys(itemsByOrder)) {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });

        if (order && order.items.length === 0) {
          // If no items left, delete the order
          await tx.order.delete({ where: { id: orderId } });
        } else if (order) {
          // Recalculate totals
          const newSubtotal = order.items.reduce((sum, item) => sum + parseFloat(item.total.toString()), 0);
          const newTax = newSubtotal * 0.1;
          const newTotal = newSubtotal + newTax;

          await tx.order.update({
            where: { id: orderId },
            data: {
              subtotal: newSubtotal,
              tax: newTax,
              total: newTotal,
            },
          });
        }
      }

      // Update target table status if different table
      if (newTableId && newTableId !== tableId) {
        await tx.table.update({
          where: { id: newTableId },
          data: { status: 'OCCUPIED' },
        });
      }

      return newOrder;
    });

    return {
      newOrder: result,
      message: `Split ${orderItems.length} items to ${newTableId ? 'new table' : 'same table'}`,
    };
  }

  /**
   * Transfer an entire order to a different table
   */
  async transferOrder(dto: TransferOrderDto, tenantId: string) {
    const { orderId, targetTableId } = dto;

    // Verify order belongs to tenant
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        table: {
          branch: { tenantId },
        },
      },
      include: {
        table: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify target table belongs to same branch
    const targetTable = await this.prisma.table.findFirst({
      where: {
        id: targetTableId,
        branchId: order.table.branchId,
      },
    });

    if (!targetTable) {
      throw new NotFoundException('Target table not found or not in same branch');
    }

    const sourceTableId = order.tableId;

    // Transfer order in transaction
    await this.prisma.$transaction(async (tx) => {
      // Update order table
      await tx.order.update({
        where: { id: orderId },
        data: { tableId: targetTableId },
      });

      // Check if source table has any remaining orders
      const remainingOrders = await tx.order.count({
        where: {
          tableId: sourceTableId,
          status: {
            in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.SERVED],
          },
        },
      });

      // Update source table status if no orders left
      if (remainingOrders === 0) {
        await tx.table.update({
          where: { id: sourceTableId },
          data: { status: 'EMPTY' },
        });
      }

      // Update target table status to OCCUPIED
      await tx.table.update({
        where: { id: targetTableId },
        data: { status: 'OCCUPIED' },
      });
    });

    return {
      message: `Order transferred from table ${order.table.number} to table ${targetTable.number}`,
      orderId,
      sourceTableId,
      targetTableId,
    };
  }

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
}
