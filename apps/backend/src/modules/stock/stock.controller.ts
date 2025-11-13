import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StockService } from './stock.service';
import {
  CreateStockMovementDto,
  UpdateProductStockDto,
  StockMovementFilterDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('api/v1/stock')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  // ============================================
  // PRODUCT STOCK SETTINGS
  // ============================================

  @Put('product/:productId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async updateProductStock(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductStockDto,
  ) {
    return this.stockService.updateProductStock(productId, dto);
  }

  @Get('product/:productId')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAITER, UserRole.KITCHEN)
  async getProductStock(@Param('productId') productId: string) {
    return this.stockService.getProductStock(productId);
  }

  @Get('products')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAITER, UserRole.KITCHEN)
  async getAllProductStocks(@Query('branchId') branchId?: string) {
    return this.stockService.getAllProductStocks(branchId);
  }

  @Get('products/low-stock')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async getLowStockProducts(@Query('branchId') branchId?: string) {
    return this.stockService.getLowStockProducts(branchId);
  }

  // ============================================
  // STOCK MOVEMENTS
  // ============================================

  @Post('movement')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async createStockMovement(@Body() dto: CreateStockMovementDto, @GetUser() user: any) {
    return this.stockService.createStockMovement(
      dto,
      user.id,
      `${user.firstName} ${user.lastName}`,
    );
  }

  @Get('movements')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async getStockMovements(@Query() filters: StockMovementFilterDto) {
    return this.stockService.getStockMovements(filters);
  }

  // ============================================
  // STOCK ALERTS
  // ============================================

  @Get('alerts')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async getStockAlerts(@Query('includeResolved') includeResolved?: string) {
    return this.stockService.getStockAlerts(includeResolved === 'true');
  }

  @Patch('alerts/:alertId/read')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async markAlertAsRead(@Param('alertId') alertId: string) {
    return this.stockService.markAlertAsRead(alertId);
  }

  @Patch('alerts/:alertId/resolve')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async resolveAlert(@Param('alertId') alertId: string) {
    return this.stockService.resolveAlert(alertId);
  }
}
