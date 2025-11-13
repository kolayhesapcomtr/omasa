import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, MergeTablesDto, SplitBillDto, SplitByItemsDto, TransferOrderDto } from './dto/payment.dto';
import { GetUser, RequestUser } from '../auth/decorators/get-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('payments')
@Controller('payments')
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('table/:tableId/bill')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get table bill/adisyon' })
  @ApiResponse({ status: 200, description: 'Table bill retrieved successfully' })
  async getTableBill(@Param('tableId') tableId: string, @GetUser() user: RequestUser) {
    return this.paymentService.getTableBill(tableId, user.tenantId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Create payment and close table' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  async createPayment(@Body() createPaymentDto: CreatePaymentDto, @GetUser() user: RequestUser) {
    return this.paymentService.createPayment(createPaymentDto, user.tenantId, user.userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get all payments' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async getPayments(@Query('branchId') branchId: string, @GetUser() user: RequestUser) {
    return this.paymentService.getPayments(user.tenantId, branchId);
  }

  @Get('invoices')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  async getInvoices(@GetUser() user: RequestUser) {
    return this.paymentService.getInvoices(user.tenantId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  async getPayment(@Param('id') id: string, @GetUser() user: RequestUser) {
    return this.paymentService.getPayment(id, user.tenantId);
  }

  // ============================================
  // BILL MERGE & SPLIT OPERATIONS
  // ============================================

  @Post('merge-tables')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER)
  @ApiOperation({ summary: 'Merge multiple tables into one' })
  @ApiResponse({ status: 200, description: 'Tables merged successfully' })
  async mergeTables(@Body() dto: MergeTablesDto, @GetUser() user: RequestUser) {
    return this.paymentService.mergeTables(dto, user.tenantId);
  }

  @Post('split-bill')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Split table bill into multiple parts' })
  @ApiResponse({ status: 200, description: 'Bill split calculated successfully' })
  async splitBill(@Body() dto: SplitBillDto, @GetUser() user: RequestUser) {
    return this.paymentService.splitBill(dto, user.tenantId);
  }

  @Post('split-by-items')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER)
  @ApiOperation({ summary: 'Split specific items to separate bill' })
  @ApiResponse({ status: 200, description: 'Items split successfully' })
  async splitByItems(@Body() dto: SplitByItemsDto, @GetUser() user: RequestUser) {
    return this.paymentService.splitByItems(dto, user.tenantId, user.userId);
  }

  @Post('transfer-order')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER)
  @ApiOperation({ summary: 'Transfer order to different table' })
  @ApiResponse({ status: 200, description: 'Order transferred successfully' })
  async transferOrder(@Body() dto: TransferOrderDto, @GetUser() user: RequestUser) {
    return this.paymentService.transferOrder(dto, user.tenantId);
  }
}
