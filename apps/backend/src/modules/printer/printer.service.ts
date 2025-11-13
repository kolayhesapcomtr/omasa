import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreatePrinterDto,
  UpdatePrinterDto,
  CreatePrintJobDto,
  PrintOrderDto,
  PrintBillDto,
  PrintReceiptDto,
} from './dto';
import { PrinterType, PrintJobStatus, PrintJobType } from '@prisma/client';
import { ESCPOSUtil } from './escpos.util';
import * as net from 'net';

@Injectable()
export class PrinterService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // PRINTER MANAGEMENT
  // ============================================

  async createPrinter(dto: CreatePrinterDto, tenantId: string) {
    // Verify branch belongs to tenant
    const branch = await this.prisma.branch.findFirst({
      where: {
        id: dto.branchId,
        tenantId,
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return this.prisma.printer.create({
      data: {
        name: dto.name,
        type: dto.type,
        connection: dto.connection,
        ipAddress: dto.ipAddress,
        port: dto.port || 9100,
        usbPath: dto.usbPath,
        macAddress: dto.macAddress,
        paperWidth: dto.paperWidth || 80,
        isActive: dto.isActive ?? true,
        autoPrint: dto.autoPrint ?? true,
        categoryIds: dto.categoryIds || [],
        branchId: dto.branchId,
      },
    });
  }

  async updatePrinter(id: string, dto: UpdatePrinterDto, tenantId: string) {
    const printer = await this.prisma.printer.findFirst({
      where: {
        id,
        branch: { tenantId },
      },
    });

    if (!printer) {
      throw new NotFoundException('Printer not found');
    }

    return this.prisma.printer.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.type && { type: dto.type }),
        ...(dto.connection && { connection: dto.connection }),
        ...(dto.ipAddress !== undefined && { ipAddress: dto.ipAddress }),
        ...(dto.port && { port: dto.port }),
        ...(dto.usbPath !== undefined && { usbPath: dto.usbPath }),
        ...(dto.macAddress !== undefined && { macAddress: dto.macAddress }),
        ...(dto.paperWidth && { paperWidth: dto.paperWidth }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.autoPrint !== undefined && { autoPrint: dto.autoPrint }),
        ...(dto.categoryIds && { categoryIds: dto.categoryIds }),
      },
    });
  }

  async deletePrinter(id: string, tenantId: string) {
    const printer = await this.prisma.printer.findFirst({
      where: {
        id,
        branch: { tenantId },
      },
    });

    if (!printer) {
      throw new NotFoundException('Printer not found');
    }

    return this.prisma.printer.delete({ where: { id } });
  }

  async getPrinters(tenantId: string, branchId?: string) {
    return this.prisma.printer.findMany({
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getPrinter(id: string, tenantId: string) {
    const printer = await this.prisma.printer.findFirst({
      where: {
        id,
        branch: { tenantId },
      },
      include: {
        branch: true,
      },
    });

    if (!printer) {
      throw new NotFoundException('Printer not found');
    }

    return printer;
  }

  // ============================================
  // PRINT TEMPLATES
  // ============================================

  /**
   * Generate kitchen order receipt
   */
  private generateKitchenReceipt(order: any, printer: any): string {
    const width = printer.paperWidth === 58 ? 32 : 42;
    let content = '';

    // Initialize printer
    content += ESCPOSUtil.initialize();
    content += ESCPOSUtil.align('center');

    // Header
    content += ESCPOSUtil.textSize(2, 2);
    content += ESCPOSUtil.bold(true);
    content += 'MUTFAK SİPARİŞİ' + ESCPOSUtil.LF;
    content += ESCPOSUtil.bold(false);
    content += ESCPOSUtil.textSize(1, 1);
    content += ESCPOSUtil.divider(width);

    // Order info
    content += ESCPOSUtil.align('left');
    content += ESCPOSUtil.bold(true);
    content += ESCPOSUtil.twoColumns('Sipariş No:', order.orderNumber, width);
    content += ESCPOSUtil.twoColumns(
      'Masa:',
      `${order.table.number} ${order.table.name || ''}`,
      width,
    );
    content += ESCPOSUtil.twoColumns('Tarih:', ESCPOSUtil.formatDateTime(order.createdAt), width);
    content += ESCPOSUtil.bold(false);
    content += ESCPOSUtil.divider(width);

    // Order items
    content += ESCPOSUtil.bold(true);
    content += 'ÜRÜNLER:' + ESCPOSUtil.LF;
    content += ESCPOSUtil.bold(false);

    for (const item of order.items) {
      content += ESCPOSUtil.textSize(1, 1);
      content += ESCPOSUtil.bold(true);
      content += `${item.quantity}x ${item.product.name}` + ESCPOSUtil.LF;
      content += ESCPOSUtil.bold(false);

      if (item.variantName) {
        content += `   (${item.variantName})` + ESCPOSUtil.LF;
      }

      if (item.notes) {
        content += ESCPOSUtil.bold(true);
        content += '   NOT: ' + item.notes + ESCPOSUtil.LF;
        content += ESCPOSUtil.bold(false);
      }

      content += ESCPOSUtil.LF;
    }

    content += ESCPOSUtil.divider(width);

    // Footer
    content += ESCPOSUtil.align('center');
    if (order.customerNote) {
      content += ESCPOSUtil.bold(true);
      content += 'GENEL NOT:' + ESCPOSUtil.LF;
      content += ESCPOSUtil.bold(false);
      content += ESCPOSUtil.wrapText(order.customerNote, width);
      content += ESCPOSUtil.divider(width);
    }

    content += ESCPOSUtil.feed(2);
    content += ESCPOSUtil.cut(false);

    return content;
  }

  /**
   * Generate bill/check receipt
   */
  private generateBillReceipt(bill: any, printer: any): string {
    const width = printer.paperWidth === 58 ? 32 : 42;
    let content = '';

    // Initialize printer
    content += ESCPOSUtil.initialize();
    content += ESCPOSUtil.align('center');

    // Header
    content += ESCPOSUtil.textSize(2, 2);
    content += ESCPOSUtil.bold(true);
    content += bill.table.branch.name + ESCPOSUtil.LF;
    content += ESCPOSUtil.bold(false);
    content += ESCPOSUtil.textSize(1, 1);
    content += ESCPOSUtil.divider(width);

    // Table info
    content += ESCPOSUtil.align('left');
    content += ESCPOSUtil.twoColumns('Masa:', `${bill.table.number}`, width);
    content += ESCPOSUtil.twoColumns('Tarih:', ESCPOSUtil.formatDateTime(), width);
    content += ESCPOSUtil.divider(width);

    // Order items
    content += ESCPOSUtil.bold(true);
    content += 'ÜRÜNLER' + ESCPOSUtil.LF;
    content += ESCPOSUtil.bold(false);
    content += ESCPOSUtil.divider(width);

    for (const order of bill.orders) {
      for (const item of order.items) {
        const itemName = item.product.name + (item.variantName ? ` (${item.variantName})` : '');
        const itemTotal = ESCPOSUtil.formatPrice(Number(item.total));

        content += ESCPOSUtil.twoColumns(`${item.quantity}x ${itemName}`, itemTotal, width);

        if (item.notes) {
          content += `   Not: ${item.notes}` + ESCPOSUtil.LF;
        }
      }
    }

    content += ESCPOSUtil.divider(width);

    // Totals
    content += ESCPOSUtil.align('right');
    content += ESCPOSUtil.twoColumns('Ara Toplam:', ESCPOSUtil.formatPrice(Number(bill.summary.subtotal)), width);
    content += ESCPOSUtil.twoColumns(
      `KDV (%${bill.summary.taxRate}):`,
      ESCPOSUtil.formatPrice(Number(bill.summary.tax)),
      width,
    );
    content += ESCPOSUtil.divider(width);
    content += ESCPOSUtil.textSize(2, 2);
    content += ESCPOSUtil.bold(true);
    content += ESCPOSUtil.twoColumns('TOPLAM:', ESCPOSUtil.formatPrice(Number(bill.summary.total)), width);
    content += ESCPOSUtil.bold(false);
    content += ESCPOSUtil.textSize(1, 1);
    content += ESCPOSUtil.divider(width);

    // Footer
    content += ESCPOSUtil.align('center');
    content += 'Teşekkür ederiz!' + ESCPOSUtil.LF;
    content += 'Tekrar bekleriz.' + ESCPOSUtil.LF;
    content += ESCPOSUtil.feed(2);
    content += ESCPOSUtil.cut(false);

    return content;
  }

  /**
   * Generate payment receipt
   */
  private generatePaymentReceipt(payment: any, printer: any): string {
    const width = printer.paperWidth === 58 ? 32 : 42;
    let content = '';

    // Initialize printer
    content += ESCPOSUtil.initialize();
    content += ESCPOSUtil.align('center');

    // Header
    content += ESCPOSUtil.textSize(2, 2);
    content += ESCPOSUtil.bold(true);
    content += 'ÖDEME FİŞİ' + ESCPOSUtil.LF;
    content += ESCPOSUtil.bold(false);
    content += ESCPOSUtil.textSize(1, 1);
    content += ESCPOSUtil.divider(width);

    // Payment info
    content += ESCPOSUtil.align('left');
    if (payment.invoice) {
      content += ESCPOSUtil.twoColumns('Fiş No:', payment.invoice.invoiceNumber, width);
    }
    content += ESCPOSUtil.twoColumns('Masa:', payment.order.table.number, width);
    content += ESCPOSUtil.twoColumns('Tarih:', ESCPOSUtil.formatDateTime(payment.paidAt), width);
    content += ESCPOSUtil.twoColumns('Ödeme:', payment.method, width);
    content += ESCPOSUtil.divider(width);

    // Amount
    content += ESCPOSUtil.align('right');
    content += ESCPOSUtil.textSize(2, 2);
    content += ESCPOSUtil.bold(true);
    content += ESCPOSUtil.twoColumns('TOPLAM:', ESCPOSUtil.formatPrice(Number(payment.amount)), width);
    content += ESCPOSUtil.bold(false);
    content += ESCPOSUtil.textSize(1, 1);

    if (payment.tipAmount && Number(payment.tipAmount) > 0) {
      content += ESCPOSUtil.twoColumns('Bahşiş:', ESCPOSUtil.formatPrice(Number(payment.tipAmount)), width);
    }

    content += ESCPOSUtil.divider(width);

    // Footer
    content += ESCPOSUtil.align('center');
    content += 'Bizi tercih ettiğiniz için' + ESCPOSUtil.LF;
    content += 'teşekkür ederiz!' + ESCPOSUtil.LF;
    content += ESCPOSUtil.feed(2);
    content += ESCPOSUtil.cut(false);

    return content;
  }

  // ============================================
  // PRINT JOB MANAGEMENT
  // ============================================

  async createPrintJob(dto: CreatePrintJobDto, tenantId: string) {
    // Verify printer belongs to tenant
    const printer = await this.prisma.printer.findFirst({
      where: {
        id: dto.printerId,
        branch: { tenantId },
      },
    });

    if (!printer) {
      throw new NotFoundException('Printer not found');
    }

    const printJob = await this.prisma.printJob.create({
      data: {
        printerId: dto.printerId,
        type: dto.type,
        orderId: dto.orderId,
        paymentId: dto.paymentId,
        invoiceId: dto.invoiceId,
        content: dto.content,
        status: PrintJobStatus.PENDING,
      },
    });

    // Attempt to print immediately if printer is active
    if (printer.isActive) {
      this.executePrintJob(printJob.id).catch((error) => {
        console.error('Auto-print failed:', error);
      });
    }

    return printJob;
  }

  async getPrintJobs(tenantId: string, printerId?: string) {
    return this.prisma.printJob.findMany({
      where: {
        printer: {
          branch: { tenantId },
          ...(printerId && { id: printerId }),
        },
      },
      include: {
        printer: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });
  }

  async retryPrintJob(id: string, tenantId: string) {
    const printJob = await this.prisma.printJob.findFirst({
      where: {
        id,
        printer: {
          branch: { tenantId },
        },
      },
    });

    if (!printJob) {
      throw new NotFoundException('Print job not found');
    }

    if (printJob.status === PrintJobStatus.COMPLETED) {
      throw new BadRequestException('Print job already completed');
    }

    if (printJob.retryCount >= printJob.maxRetries) {
      throw new BadRequestException('Max retries exceeded');
    }

    await this.prisma.printJob.update({
      where: { id },
      data: {
        status: PrintJobStatus.PENDING,
        retryCount: printJob.retryCount + 1,
      },
    });

    return this.executePrintJob(id);
  }

  /**
   * Execute print job - send data to printer
   */
  private async executePrintJob(id: string): Promise<void> {
    const printJob = await this.prisma.printJob.findUnique({
      where: { id },
      include: {
        printer: true,
      },
    });

    if (!printJob || !printJob.printer) {
      throw new NotFoundException('Print job or printer not found');
    }

    try {
      await this.prisma.printJob.update({
        where: { id },
        data: { status: PrintJobStatus.PRINTING },
      });

      // Send to printer based on connection type
      if (printJob.printer.connection === 'NETWORK' && printJob.printer.ipAddress) {
        await this.sendToNetworkPrinter(
          printJob.printer.ipAddress,
          printJob.printer.port || 9100,
          printJob.content,
        );
      } else {
        // For USB and Bluetooth, implementation depends on platform
        // This would typically use node-thermal-printer or similar library
        console.log('USB/Bluetooth printing not yet implemented');
      }

      await this.prisma.printJob.update({
        where: { id },
        data: {
          status: PrintJobStatus.COMPLETED,
          printedAt: new Date(),
        },
      });
    } catch (error) {
      await this.prisma.printJob.update({
        where: { id },
        data: {
          status: PrintJobStatus.FAILED,
          lastError: error.message,
        },
      });
      throw error;
    }
  }

  /**
   * Send data to network printer via TCP
   */
  private sendToNetworkPrinter(ip: string, port: number, data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      const timeout = setTimeout(() => {
        client.destroy();
        reject(new Error('Printer connection timeout'));
      }, 10000); // 10 second timeout

      client.connect(port, ip, () => {
        clearTimeout(timeout);
        client.write(Buffer.from(data, 'utf-8'));
        client.end();
      });

      client.on('end', () => {
        resolve();
      });

      client.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  // ============================================
  // HIGH-LEVEL PRINT FUNCTIONS
  // ============================================

  async printOrder(dto: PrintOrderDto, tenantId: string) {
    // Get order with details
    const order = await this.prisma.order.findFirst({
      where: {
        id: dto.orderId,
        table: {
          branch: { tenantId },
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        table: {
          include: {
            branch: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Determine which printers to use
    let printers: any[] = [];

    if (dto.printerId) {
      const printer = await this.getPrinter(dto.printerId, tenantId);
      printers = [printer];
    } else {
      // Auto-select printers based on order items and categories
      printers = await this.prisma.printer.findMany({
        where: {
          branchId: order.table.branchId,
          type: PrinterType.KITCHEN,
          isActive: true,
          autoPrint: true,
        },
      });
    }

    const printJobs = [];

    for (const printer of printers) {
      // Filter items for this printer based on category
      let itemsToPrint = order.items;
      if (printer.categoryIds.length > 0) {
        itemsToPrint = order.items.filter((item) =>
          printer.categoryIds.includes(item.product.category.id),
        );
      }

      if (itemsToPrint.length === 0) continue;

      // Generate receipt content
      const content = this.generateKitchenReceipt({ ...order, items: itemsToPrint }, printer);

      // Create print job
      const printJob = await this.createPrintJob(
        {
          printerId: printer.id,
          type: PrintJobType.KITCHEN_ORDER,
          orderId: order.id,
          content,
        },
        tenantId,
      );

      printJobs.push(printJob);
    }

    return {
      message: `Order sent to ${printJobs.length} printer(s)`,
      printJobs,
    };
  }

  async printBill(dto: PrintBillDto, tenantId: string) {
    // Get bill from payment service
    // For now, we'll get table orders directly
    const table = await this.prisma.table.findFirst({
      where: {
        id: dto.tableId,
        branch: { tenantId },
      },
      include: {
        branch: true,
        orders: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'],
            },
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!table || table.orders.length === 0) {
      throw new NotFoundException('No active orders found for table');
    }

    // Calculate totals
    const subtotal = table.orders.reduce((sum, order) => sum + Number(order.subtotal), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    const bill = {
      table,
      orders: table.orders,
      summary: {
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        taxRate: '10',
        total: total.toFixed(2),
      },
    };

    // Get bill printer
    let printer: any;
    if (dto.printerId) {
      printer = await this.getPrinter(dto.printerId, tenantId);
    } else {
      printer = await this.prisma.printer.findFirst({
        where: {
          branchId: table.branchId,
          type: PrinterType.BILL,
          isActive: true,
        },
      });
    }

    if (!printer) {
      throw new NotFoundException('No bill printer found');
    }

    const content = this.generateBillReceipt(bill, printer);

    return this.createPrintJob(
      {
        printerId: printer.id,
        type: PrintJobType.BILL,
        content,
      },
      tenantId,
    );
  }

  async printReceipt(dto: PrintReceiptDto, tenantId: string) {
    // Get payment details
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: dto.paymentId,
        tenantId,
      },
      include: {
        order: {
          include: {
            table: true,
          },
        },
        invoice: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Get receipt printer
    let printer: any;
    if (dto.printerId) {
      printer = await this.getPrinter(dto.printerId, tenantId);
    } else {
      printer = await this.prisma.printer.findFirst({
        where: {
          branchId: payment.order.table.branchId,
          type: PrinterType.RECEIPT,
          isActive: true,
        },
      });
    }

    if (!printer) {
      throw new NotFoundException('No receipt printer found');
    }

    const content = this.generatePaymentReceipt(payment, printer);

    return this.createPrintJob(
      {
        printerId: printer.id,
        type: PrintJobType.RECEIPT,
        paymentId: payment.id,
        invoiceId: payment.invoiceId,
        content,
      },
      tenantId,
    );
  }

  async testPrint(printerId: string, tenantId: string) {
    const printer = await this.getPrinter(printerId, tenantId);

    let content = ESCPOSUtil.initialize();
    content += ESCPOSUtil.align('center');
    content += ESCPOSUtil.textSize(2, 2);
    content += ESCPOSUtil.bold(true);
    content += 'TEST YAZDIRMA' + ESCPOSUtil.LF;
    content += ESCPOSUtil.bold(false);
    content += ESCPOSUtil.textSize(1, 1);
    content += ESCPOSUtil.divider(32);
    content += printer.name + ESCPOSUtil.LF;
    content += `Tip: ${printer.type}` + ESCPOSUtil.LF;
    content += `Bağlantı: ${printer.connection}` + ESCPOSUtil.LF;
    content += ESCPOSUtil.divider(32);
    content += ESCPOSUtil.formatDateTime() + ESCPOSUtil.LF;
    content += ESCPOSUtil.feed(2);
    content += ESCPOSUtil.cut(false);

    return this.createPrintJob(
      {
        printerId: printer.id,
        type: PrintJobType.ORDER,
        content,
      },
      tenantId,
    );
  }
}
