import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';
import { ReportsQueryDto } from './dto/reports.dto';

interface RequestUser {
  id: string;
  email: string;
  tenantId: string;
  role: UserRole;
}

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales-overview')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async getSalesOverview(@GetUser() user: RequestUser, @Query() query: ReportsQueryDto) {
    return this.reportsService.getSalesOverview(user.tenantId, query);
  }

  @Get('product-sales')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async getProductSales(@GetUser() user: RequestUser, @Query() query: ReportsQueryDto) {
    return this.reportsService.getProductSales(user.tenantId, query);
  }

  @Get('waiter-performance')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async getWaiterPerformance(@GetUser() user: RequestUser, @Query() query: ReportsQueryDto) {
    return this.reportsService.getWaiterPerformance(user.tenantId, query);
  }

  @Get('daily-sales')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async getDailySales(@GetUser() user: RequestUser, @Query() query: ReportsQueryDto) {
    return this.reportsService.getDailySales(user.tenantId, query);
  }

  @Get('category-sales')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async getCategorySales(@GetUser() user: RequestUser, @Query() query: ReportsQueryDto) {
    return this.reportsService.getCategorySales(user.tenantId, query);
  }

  @Get('revenue-by-hour')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async getRevenueByHour(@GetUser() user: RequestUser, @Query() query: ReportsQueryDto) {
    return this.reportsService.getRevenueByHour(user.tenantId, query);
  }
}
