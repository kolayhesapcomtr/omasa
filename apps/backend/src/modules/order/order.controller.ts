import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { GetUser, RequestUser } from '../auth/decorators/get-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole, OrderStatus } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create new order (public endpoint for QR orders)' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    // For QR orders, we need to get tenantId from table
    const table = await this.orderService['prisma'].table.findUnique({
      where: { id: createOrderDto.tableId },
      include: { branch: { select: { tenantId: true } } },
    });

    if (!table) {
      throw new Error('Table not found');
    }

    return this.orderService.createOrder(createOrderDto, table.branch.tenantId);
  }

  @Post('waiter')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAITER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create order as waiter' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  async createWaiterOrder(
    @Body() createOrderDto: CreateOrderDto,
    @GetUser() user: RequestUser,
  ) {
    return this.orderService.createOrder(createOrderDto, user.tenantId, user.userId);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'status', enum: OrderStatus, required: false })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async getOrders(
    @Query('branchId') branchId: string,
    @Query('status') status: OrderStatus,
    @GetUser() user: RequestUser,
  ) {
    return this.orderService.getOrders(user.tenantId, branchId, status);
  }

  @Get('active')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active orders' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiResponse({ status: 200, description: 'Active orders retrieved successfully' })
  async getActiveOrders(
    @Query('branchId') branchId: string,
    @GetUser() user: RequestUser,
  ) {
    return this.orderService.getActiveOrders(user.tenantId, branchId);
  }

  @Get('kitchen')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.KITCHEN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get kitchen orders (pending/preparing)' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiResponse({ status: 200, description: 'Kitchen orders retrieved successfully' })
  async getKitchenOrders(
    @Query('branchId') branchId: string,
    @GetUser() user: RequestUser,
  ) {
    return this.orderService.getKitchenOrders(user.tenantId, branchId);
  }

  @Get('table/:tableId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get orders for a specific table' })
  @ApiResponse({ status: 200, description: 'Table orders retrieved successfully' })
  async getTableOrders(@Param('tableId') tableId: string, @GetUser() user: RequestUser) {
    return this.orderService.getTableOrders(tableId, user.tenantId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  async getOrder(@Param('id') id: string, @GetUser() user: RequestUser) {
    return this.orderService.getOrder(id, user.tenantId);
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAITER, UserRole.KITCHEN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
    @GetUser() user: RequestUser,
  ) {
    return this.orderService.updateOrderStatus(id, updateStatusDto, user.tenantId);
  }
}
