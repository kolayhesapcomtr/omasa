import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  ReportsQueryDto,
  ReportPeriod,
  SalesOverviewDto,
  ProductSalesDto,
  WaiterPerformanceDto,
  DailySalesDto,
  CategorySalesDto,
  RevenueByHourDto,
} from './dto/reports.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private getDateRange(query: ReportsQueryDto): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.setHours(23, 59, 59, 999));

    if (query.period === ReportPeriod.CUSTOM && query.startDate && query.endDate) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      switch (query.period) {
        case ReportPeriod.TODAY:
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case ReportPeriod.YESTERDAY:
          startDate = new Date(now.setDate(now.getDate() - 1));
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        case ReportPeriod.THIS_WEEK:
          const dayOfWeek = now.getDay();
          const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday as first day
          startDate = new Date(now.setDate(now.getDate() - diff));
          startDate.setHours(0, 0, 0, 0);
          break;
        case ReportPeriod.LAST_WEEK:
          const lastWeekStart = new Date(now.setDate(now.getDate() - now.getDay() - 6));
          startDate = new Date(lastWeekStart.setHours(0, 0, 0, 0));
          endDate = new Date(lastWeekStart.setDate(lastWeekStart.getDate() + 6));
          endDate.setHours(23, 59, 59, 999);
          break;
        case ReportPeriod.THIS_MONTH:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
          break;
        case ReportPeriod.LAST_MONTH:
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          break;
        default:
          startDate = new Date(now.setHours(0, 0, 0, 0));
      }
    }

    return { startDate, endDate };
  }

  async getSalesOverview(tenantId: string, query: ReportsQueryDto): Promise<SalesOverviewDto> {
    const { startDate, endDate } = this.getDateRange(query);

    const whereClause: any = {
      tenantId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (query.branchId) {
      whereClause.branchId = query.branchId;
    }

    // Get payments data
    const payments = await this.prisma.payment.findMany({
      where: whereClause,
      include: {
        orders: true,
      },
    });

    // Get orders data for completion stats
    const orders = await this.prisma.order.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(query.branchId && { table: { branchId: query.branchId } }),
      },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.totalAmount), 0);
    const totalTips = payments.reduce((sum, p) => sum + Number(p.tipAmount || 0), 0);
    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED').length;

    // Payment methods breakdown
    const paymentMethodsMap = new Map<string, { count: number; total: number }>();
    payments.forEach((payment) => {
      const existing = paymentMethodsMap.get(payment.method) || { count: 0, total: 0 };
      paymentMethodsMap.set(payment.method, {
        count: existing.count + 1,
        total: existing.total + Number(payment.totalAmount),
      });
    });

    const paymentMethods = Array.from(paymentMethodsMap.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      total: data.total,
    }));

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      totalTips,
      completedOrders,
      cancelledOrders,
      paymentMethods,
    };
  }

  async getProductSales(tenantId: string, query: ReportsQueryDto): Promise<ProductSalesDto[]> {
    const { startDate, endDate } = this.getDateRange(query);

    const whereClause: any = {
      order: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['COMPLETED', 'READY', 'PREPARING', 'CONFIRMED'],
        },
      },
    };

    if (query.branchId) {
      whereClause.order.table = { branchId: query.branchId };
    }

    const orderItems = await this.prisma.orderItem.findMany({
      where: whereClause,
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    // Group by product
    const productMap = new Map<
      string,
      {
        productName: string;
        categoryName: string;
        quantitySold: number;
        revenue: number;
        timesOrdered: number;
      }
    >();

    orderItems.forEach((item) => {
      const existing = productMap.get(item.productId) || {
        productName: item.product.name,
        categoryName: item.product.category?.name || 'Kategorisiz',
        quantitySold: 0,
        revenue: 0,
        timesOrdered: 0,
      };

      productMap.set(item.productId, {
        ...existing,
        quantitySold: existing.quantitySold + item.quantity,
        revenue: existing.revenue + Number(item.price) * item.quantity,
        timesOrdered: existing.timesOrdered + 1,
      });
    });

    return Array.from(productMap.entries())
      .map(([productId, data]) => ({
        productId,
        ...data,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  async getWaiterPerformance(
    tenantId: string,
    query: ReportsQueryDto,
  ): Promise<WaiterPerformanceDto[]> {
    const { startDate, endDate } = this.getDateRange(query);

    const whereClause: any = {
      tenantId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      waiterId: {
        not: null,
      },
    };

    if (query.branchId) {
      whereClause.table = { branchId: query.branchId };
    }

    const orders = await this.prisma.order.findMany({
      where: whereClause,
      include: {
        waiter: true,
        payments: true,
      },
    });

    // Group by waiter
    const waiterMap = new Map<
      string,
      {
        waiterName: string;
        totalOrders: number;
        totalRevenue: number;
        totalTips: number;
      }
    >();

    orders.forEach((order) => {
      if (!order.waiterId) return;

      const existing = waiterMap.get(order.waiterId) || {
        waiterName: `${order.waiter?.firstName} ${order.waiter?.lastName}`,
        totalOrders: 0,
        totalRevenue: 0,
        totalTips: 0,
      };

      const orderRevenue = order.payments.reduce((sum, p) => sum + Number(p.totalAmount), 0);
      const orderTips = order.payments.reduce((sum, p) => sum + Number(p.tipAmount || 0), 0);

      waiterMap.set(order.waiterId, {
        ...existing,
        totalOrders: existing.totalOrders + 1,
        totalRevenue: existing.totalRevenue + orderRevenue,
        totalTips: existing.totalTips + orderTips,
      });
    });

    return Array.from(waiterMap.entries())
      .map(([waiterId, data]) => ({
        waiterId,
        ...data,
        averageOrderValue: data.totalOrders > 0 ? data.totalRevenue / data.totalOrders : 0,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  async getDailySales(tenantId: string, query: ReportsQueryDto): Promise<DailySalesDto[]> {
    const { startDate, endDate } = this.getDateRange(query);

    const whereClause: any = {
      tenantId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (query.branchId) {
      whereClause.branchId = query.branchId;
    }

    const payments = await this.prisma.payment.findMany({
      where: whereClause,
    });

    // Group by date
    const dailyMap = new Map<string, { revenue: number; orders: number }>();

    payments.forEach((payment) => {
      const dateKey = payment.createdAt.toISOString().split('T')[0];
      const existing = dailyMap.get(dateKey) || { revenue: 0, orders: 0 };

      dailyMap.set(dateKey, {
        revenue: existing.revenue + Number(payment.totalAmount),
        orders: existing.orders + 1,
      });
    });

    return Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
        averageOrderValue: data.orders > 0 ? data.revenue / data.orders : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getCategorySales(tenantId: string, query: ReportsQueryDto): Promise<CategorySalesDto[]> {
    const { startDate, endDate } = this.getDateRange(query);

    const whereClause: any = {
      order: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['COMPLETED', 'READY', 'PREPARING', 'CONFIRMED'],
        },
      },
    };

    if (query.branchId) {
      whereClause.order.table = { branchId: query.branchId };
    }

    const orderItems = await this.prisma.orderItem.findMany({
      where: whereClause,
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    // Group by category
    const categoryMap = new Map<
      string,
      {
        categoryName: string;
        totalQuantity: number;
        revenue: number;
      }
    >();

    let totalRevenue = 0;

    orderItems.forEach((item) => {
      const categoryId = item.product.categoryId || 'uncategorized';
      const categoryName = item.product.category?.name || 'Kategorisiz';
      const itemRevenue = Number(item.price) * item.quantity;

      totalRevenue += itemRevenue;

      const existing = categoryMap.get(categoryId) || {
        categoryName,
        totalQuantity: 0,
        revenue: 0,
      };

      categoryMap.set(categoryId, {
        ...existing,
        totalQuantity: existing.totalQuantity + item.quantity,
        revenue: existing.revenue + itemRevenue,
      });
    });

    return Array.from(categoryMap.entries())
      .map(([categoryId, data]) => ({
        categoryId,
        ...data,
        percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  async getRevenueByHour(tenantId: string, query: ReportsQueryDto): Promise<RevenueByHourDto[]> {
    const { startDate, endDate } = this.getDateRange(query);

    const whereClause: any = {
      tenantId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (query.branchId) {
      whereClause.branchId = query.branchId;
    }

    const payments = await this.prisma.payment.findMany({
      where: whereClause,
    });

    // Group by hour
    const hourMap = new Map<number, { revenue: number; orders: number }>();

    payments.forEach((payment) => {
      const hour = payment.createdAt.getHours();
      const existing = hourMap.get(hour) || { revenue: 0, orders: 0 };

      hourMap.set(hour, {
        revenue: existing.revenue + Number(payment.totalAmount),
        orders: existing.orders + 1,
      });
    });

    // Fill all 24 hours
    const result: RevenueByHourDto[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const data = hourMap.get(hour) || { revenue: 0, orders: 0 };
      result.push({
        hour,
        revenue: data.revenue,
        orders: data.orders,
      });
    }

    return result;
  }
}
