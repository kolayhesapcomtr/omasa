import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePaymentDto } from './dto/payment.dto';
import { PaymentStatus, OrderStatus } from '@prisma/client';
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
}
