import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateStockMovementDto,
  UpdateProductStockDto,
  StockMovementFilterDto,
  StockMovementResponseDto,
  StockAlertResponseDto,
  ProductStockStatusDto,
} from './dto';
import { StockMovementType } from '@prisma/client';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // PRODUCT STOCK MANAGEMENT
  // ============================================

  async updateProductStock(productId: string, dto: UpdateProductStockDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        trackStock: dto.trackStock,
        stockQuantity: dto.stockQuantity,
        minStockLevel: dto.minStockLevel,
        stockUnit: dto.stockUnit,
      },
      include: {
        category: true,
      },
    });

    // Check if stock is low after update
    if (updated.trackStock && dto.stockQuantity !== undefined) {
      await this.checkAndCreateStockAlert(productId);
    }

    return updated;
  }

  async getProductStock(productId: string): Promise<ProductStockStatusDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.mapProductToStockStatus(product);
  }

  async getAllProductStocks(branchId?: string): Promise<ProductStockStatusDto[]> {
    const products = await this.prisma.product.findMany({
      where: branchId
        ? {
            category: {
              menu: {
                branchId: branchId,
              },
            },
          }
        : {},
      include: {
        category: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return products.map((p) => this.mapProductToStockStatus(p));
  }

  async getLowStockProducts(branchId?: string): Promise<ProductStockStatusDto[]> {
    const products = await this.prisma.product.findMany({
      where: {
        trackStock: true,
        ...(branchId
          ? {
              category: {
                menu: {
                  branchId: branchId,
                },
              },
            }
          : {}),
      },
      include: {
        category: true,
      },
    });

    return products
      .filter((p) => Number(p.stockQuantity) <= Number(p.minStockLevel))
      .map((p) => this.mapProductToStockStatus(p));
  }

  // ============================================
  // STOCK MOVEMENTS
  // ============================================

  async createStockMovement(dto: CreateStockMovementDto, userId?: string, userName?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.trackStock) {
      throw new BadRequestException('Stock tracking is not enabled for this product');
    }

    const previousStock = Number(product.stockQuantity);
    let newStock: number;

    // Calculate new stock based on movement type
    switch (dto.type) {
      case StockMovementType.IN:
      case StockMovementType.RETURN:
        newStock = previousStock + dto.quantity;
        break;
      case StockMovementType.OUT:
      case StockMovementType.WASTE:
        newStock = previousStock - dto.quantity;
        if (newStock < 0) {
          throw new BadRequestException('Insufficient stock');
        }
        break;
      case StockMovementType.ADJUSTMENT:
        // For adjustment, quantity is the new stock value
        newStock = dto.quantity;
        break;
      default:
        throw new BadRequestException('Invalid movement type');
    }

    // Create stock movement and update product in transaction
    const movement = await this.prisma.$transaction(async (prisma) => {
      // Create movement record
      const mov = await prisma.stockMovement.create({
        data: {
          productId: dto.productId,
          type: dto.type,
          quantity: dto.quantity,
          previousStock,
          newStock,
          orderId: dto.orderId,
          reference: dto.reference,
          notes: dto.notes,
          userId,
          performedBy: userName,
        },
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      });

      // Update product stock
      await prisma.product.update({
        where: { id: dto.productId },
        data: {
          stockQuantity: newStock,
          // Auto-disable if out of stock
          isAvailable: newStock > 0,
        },
      });

      return mov;
    });

    // Check for low stock alerts
    await this.checkAndCreateStockAlert(dto.productId);

    return this.mapMovementToResponse(movement);
  }

  async getStockMovements(filters: StockMovementFilterDto): Promise<{
    data: StockMovementResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { productId, type, startDate, endDate, page = 1, limit = 50 } = filters;

    const where: any = {};

    if (productId) where.productId = productId;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return {
      data: movements.map((m) => this.mapMovementToResponse(m)),
      total,
      page,
      limit,
    };
  }

  // ============================================
  // STOCK ALERTS
  // ============================================

  async getStockAlerts(includeResolved: boolean = false): Promise<StockAlertResponseDto[]> {
    const alerts = await this.prisma.stockAlert.findMany({
      where: includeResolved ? {} : { isResolved: false },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return alerts.map((alert) => ({
      id: alert.id,
      productId: alert.productId,
      productName: alert.product.name,
      productImage: alert.product.image,
      alertType: alert.alertType,
      message: alert.message,
      currentStock: Number(alert.product.stockQuantity),
      minStockLevel: Number(alert.product.minStockLevel),
      isRead: alert.isRead,
      isResolved: alert.isResolved,
      createdAt: alert.createdAt,
    }));
  }

  async markAlertAsRead(alertId: string) {
    return this.prisma.stockAlert.update({
      where: { id: alertId },
      data: { isRead: true },
    });
  }

  async resolveAlert(alertId: string) {
    return this.prisma.stockAlert.update({
      where: { id: alertId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
      },
    });
  }

  // ============================================
  // AUTOMATIC STOCK DEDUCTION (Called from OrderService)
  // ============================================

  async deductStockForOrder(orderId: string, items: Array<{ productId: string; quantity: number }>) {
    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product || !product.trackStock) {
        continue; // Skip if product doesn't track stock
      }

      // Create stock movement for order
      await this.createStockMovement(
        {
          productId: item.productId,
          type: StockMovementType.OUT,
          quantity: item.quantity,
          orderId,
          notes: `Sipariş için stok düşüldü: ${orderId}`,
        },
        undefined,
        'SYSTEM',
      );
    }
  }

  async returnStockForCancelledOrder(
    orderId: string,
    items: Array<{ productId: string; quantity: number }>,
  ) {
    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product || !product.trackStock) {
        continue;
      }

      await this.createStockMovement(
        {
          productId: item.productId,
          type: StockMovementType.RETURN,
          quantity: item.quantity,
          orderId,
          notes: `İptal edilen sipariş için stok iade edildi: ${orderId}`,
        },
        undefined,
        'SYSTEM',
      );
    }
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async checkAndCreateStockAlert(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.trackStock) return;

    const currentStock = Number(product.stockQuantity);
    const minStock = Number(product.minStockLevel);

    // Resolve old alerts if stock is replenished
    if (currentStock > minStock) {
      await this.prisma.stockAlert.updateMany({
        where: {
          productId,
          isResolved: false,
        },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
        },
      });
      return;
    }

    // Check if alert already exists
    const existingAlert = await this.prisma.stockAlert.findFirst({
      where: {
        productId,
        isResolved: false,
      },
    });

    if (existingAlert) return;

    // Create new alert
    const alertType = currentStock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK';
    const message =
      currentStock === 0
        ? `${product.name} stokta yok!`
        : `${product.name} stok seviyesi düşük! (${currentStock} ${product.stockUnit || 'adet'})`;

    await this.prisma.stockAlert.create({
      data: {
        productId,
        alertType,
        message,
      },
    });
  }

  private mapProductToStockStatus(product: any): ProductStockStatusDto {
    const stockQty = Number(product.stockQuantity);
    const minStock = Number(product.minStockLevel);

    let stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
    if (!product.trackStock) {
      stockStatus = 'IN_STOCK';
    } else if (stockQty === 0) {
      stockStatus = 'OUT_OF_STOCK';
    } else if (stockQty <= minStock) {
      stockStatus = 'LOW_STOCK';
    } else {
      stockStatus = 'IN_STOCK';
    }

    return {
      id: product.id,
      name: product.name,
      image: product.image,
      trackStock: product.trackStock,
      stockQuantity: stockQty,
      minStockLevel: minStock,
      stockUnit: product.stockUnit,
      isAvailable: product.isAvailable,
      stockStatus,
      categoryName: product.category?.name || '',
    };
  }

  private mapMovementToResponse(movement: any): StockMovementResponseDto {
    return {
      id: movement.id,
      productId: movement.productId,
      productName: movement.product?.name || '',
      type: movement.type,
      quantity: Number(movement.quantity),
      previousStock: Number(movement.previousStock),
      newStock: Number(movement.newStock),
      orderId: movement.orderId,
      reference: movement.reference,
      notes: movement.notes,
      performedBy: movement.performedBy,
      createdAt: movement.createdAt,
    };
  }
}
